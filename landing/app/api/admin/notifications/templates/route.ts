import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .order('type')
    .order('variant')
    .order('language');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also return app screens for the screen picker
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

  return NextResponse.json({ templates: data, appScreens });
}

export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { templates } = await req.json();
  if (!templates || !Array.isArray(templates)) {
    return NextResponse.json({ error: 'templates array required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  for (const t of templates) {
    const { error } = await supabase
      .from('notification_templates')
      .update({ title: t.title, body: t.body, screen_path: t.screen_path, updated_at: new Date().toISOString() })
      .eq('id', t.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
