import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch only active profiles (completed onboarding = real Deco users)
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, full_name, role, push_token, notification_prefs, notifications_paused_until, language')
      .eq('onboarding_completed', true)
      .order('full_name');

    if (profilesErr) {
      console.error('[notifications] profiles query error:', profilesErr);
      return NextResponse.json({ error: `Profiles query failed: ${profilesErr.message}` }, { status: 500 });
    }

    // Fetch emails from auth.users via admin API — non-fatal if it fails
    const emailMap: Record<string, string> = {};
    try {
      const response = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const authUsers = response?.data?.users;
      if (authUsers) {
        for (const u of authUsers) {
          if (u.email) emailMap[u.id] = u.email;
        }
      }
    } catch (_err) {
      console.error('[notifications] listUsers error (continuing without emails):', _err);
    }

  const users = (profiles ?? [])
    .map((p: any) => ({
      ...p,
      email: emailMap[p.id] ?? null,
      has_push_token: !!p.push_token,
    }))
    // Filter out Playwright test accounts
    .filter((u: any) => !u.email?.endsWith('@deco.app'));

  // Notification type definitions with default content and deep link paths
  // Pre-seeded with the exact text from the send-notifications edge function
  const notificationTypes = [
    {
      type: 'session_focus',
      label: 'Pre-training focus',
      default_path: '/(athlete)/development/session-goals',
      defaults: {
        nl: { title: 'Kies je focus', body: 'Je sessie begint over 1 uur. Waar ga je je op focussen?' },
        en: { title: 'Set your focus', body: 'Your session starts in 1 hour. What will you focus on?' },
      },
    },
    {
      type: 'post_training',
      label: 'Post-training reflection',
      default_path: '/(athlete)/development/reflect',
      defaults: {
        nl: { title: 'Hoe ging je training?', body: 'Neem 2 minuten om te reflecteren op je focus van vandaag.' },
        en: { title: 'How was your session?', body: 'Take 2 minutes to reflect on today\'s focus.' },
      },
    },
    {
      type: 'coach_feedback',
      label: 'Coach feedback',
      default_path: '/(athlete)/goals',
      defaults: {
        nl: { title: 'Nieuwe coach feedback', body: 'Je coach heeft feedback gegeven op een doel.' },
        en: { title: 'New coach feedback', body: 'Your coach left feedback on a goal.' },
      },
    },
    {
      type: 'weekly_review',
      label: 'Weekly reflection',
      default_path: '/(athlete)/development/reflect',
      defaults: {
        nl: { title: 'Weekreflectie', body: 'Hoe was je week? Neem even de tijd om terug te kijken op je ontwikkeling.' },
        en: { title: 'Weekly reflection', body: 'How was your week? Take a moment to look back on your development.' },
      },
    },
    {
      type: 'coach_report',
      label: 'Coach weekly report',
      default_path: '/(coach)/reports',
      defaults: {
        nl: { title: 'Weekrapport invullen', body: 'Neem even de tijd om een rapport te schrijven over de voortgang van je spelers deze week.' },
        en: { title: 'Fill in weekly report', body: 'Take a moment to write a report about the progress of your players this week.' },
      },
    },
    {
      type: 'custom',
      label: 'Custom notification',
      default_path: '',
      defaults: { nl: { title: '', body: '' }, en: { title: '', body: '' } },
    },
  ];

  // All navigable screens available as deep link targets
  const appScreens = [
    { path: '/(athlete)/profile', label: 'Athlete Home' },
    { path: '/(athlete)/development', label: 'Development Overview' },
    { path: '/(athlete)/development/reflect', label: 'Reflect on Training' },
    { path: '/(athlete)/development/session-goals', label: 'Pre-training Goals' },
    { path: '/(athlete)/goals', label: 'Goals List' },
    { path: '/(athlete)/goals/new', label: 'Create New Goal' },
    { path: '/(athlete)/settings', label: 'Athlete Settings' },
    { path: '/(coach)/players', label: 'Players List' },
    { path: '/(coach)/team', label: 'Team Management' },
    { path: '/(coach)/reports', label: 'Coach Reports' },
    { path: '/(coach)/settings', label: 'Coach Settings' },
  ];

  return NextResponse.json({ users, notificationTypes, appScreens });
  } catch (err: any) {
    console.error('[notifications] unhandled error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pushTokens, title, body: messageBody, type, url, data: extraData } = body;

    console.log('[notifications POST] Received:', {
      tokenCount: pushTokens?.length,
      title,
      messageBody: messageBody?.substring(0, 50),
      type,
      url,
      extraData,
    });

    if (!pushTokens || !Array.isArray(pushTokens) || pushTokens.length === 0) {
      return NextResponse.json({ error: 'No push tokens provided' }, { status: 400 });
    }
    if (!title || !messageBody) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // Build notification data payload
    const notifData: Record<string, unknown> = {};
    if (type) notifData.type = type;
    if (url) notifData.url = url;
    if (extraData) Object.assign(notifData, extraData);

    // Send via Expo Push API
    const messages = pushTokens.map((token: string) => ({
      to: token,
      title,
      body: messageBody,
      data: notifData,
      sound: 'default' as const,
    }));

    console.log('[notifications POST] Sending', messages.length, 'message(s) to Expo');

    // Expo supports batches of up to 100
    const results = [];
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch.length === 1 ? batch[0] : batch),
      });
      const result = await response.json();
      console.log('[notifications POST] Expo response:', JSON.stringify(result));
      results.push(result);
    }

    return NextResponse.json({ success: true, results, sent: pushTokens.length });
  } catch (err: any) {
    console.error('[notifications POST] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}
