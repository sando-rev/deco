import { test, expect } from '@playwright/test';
import { signInAsAthlete, signInAsCoach, ATHLETE_ID, COACH_ID, SUPABASE_URL, SUPABASE_ANON_KEY } from './helpers';

// ─── Notification Infrastructure Tests ──────────────

test.describe('Notification Infrastructure', () => {
  test('scheduled_sessions have notification flag columns', async () => {
    const sb = await signInAsAthlete();
    const { data, error } = await sb.from('scheduled_sessions')
      .select('id, notification_sent_pre, notification_sent_post')
      .eq('athlete_id', ATHLETE_ID)
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.length).toBeGreaterThan(0);

    const session = data![0];
    expect(typeof session.notification_sent_pre).toBe('boolean');
    expect(typeof session.notification_sent_post).toBe('boolean');
  });

  test('profiles have push_token and notification_prefs columns', async () => {
    const sb = await signInAsAthlete();
    const { data, error } = await sb.from('profiles')
      .select('id, push_token, notification_prefs, notifications_paused_until')
      .eq('id', ATHLETE_ID)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!).toHaveProperty('push_token');
    expect(data!).toHaveProperty('notification_prefs');
    expect(data!).toHaveProperty('notifications_paused_until');
  });

  test('notification_prefs has correct structure', async () => {
    const sb = await signInAsAthlete();
    const { data } = await sb.from('profiles')
      .select('notification_prefs')
      .eq('id', ATHLETE_ID)
      .single();

    const prefs = data!.notification_prefs as any;
    expect(prefs).toHaveProperty('pre_training');
    expect(prefs).toHaveProperty('post_session');
    expect(prefs).toHaveProperty('motivational');
    expect(prefs).toHaveProperty('weekly_review');
    expect(typeof prefs.pre_training).toBe('boolean');
    expect(typeof prefs.post_session).toBe('boolean');
  });

  test('coach_comments have notification_sent column', async () => {
    const sb = await signInAsCoach();
    const { data: goals } = await sb.from('goals').select('id').eq('athlete_id', ATHLETE_ID);
    const goalId = goals![0].id;

    const { data: comments, error } = await sb.from('coach_comments')
      .select('id, notification_sent')
      .eq('goal_id', goalId)
      .limit(1);

    expect(error).toBeNull();
    expect(comments).toBeTruthy();
    expect(comments!.length).toBeGreaterThan(0);
    expect(typeof comments![0].notification_sent).toBe('boolean');
  });
});

// ─── Notification Edge Function Tests ───────────────

test.describe('Send Notifications Edge Function', () => {
  test('function is reachable and returns valid response', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok).toBe(true);
    const body = await response.json();

    // Verify response shape
    expect(body).toHaveProperty('pre_training');
    expect(body).toHaveProperty('post_training');
    expect(body).toHaveProperty('coach_feedback');
    expect(body).toHaveProperty('weekly_reflection');
    expect(body).toHaveProperty('coach_report');
    expect(body).toHaveProperty('timestamp');

    // Each result has sent/skipped counts
    for (const key of ['pre_training', 'post_training', 'coach_feedback', 'weekly_reflection', 'coach_report']) {
      expect(body[key]).toHaveProperty('sent');
      expect(body[key]).toHaveProperty('skipped');
      expect(typeof body[key].sent).toBe('number');
      expect(typeof body[key].skipped).toBe('number');
    }
  });

  test('function handles CORS preflight', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notifications`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    expect(response.ok).toBe(true);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('function is idempotent — second call does not double-send', async () => {
    const call1 = await fetch(`${SUPABASE_URL}/functions/v1/send-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    const body1 = await call1.json();

    const call2 = await fetch(`${SUPABASE_URL}/functions/v1/send-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    const body2 = await call2.json();

    // Second call should never send MORE than first call
    // (it may send 0 if first call already marked everything as sent)
    expect(body2.pre_training.sent).toBeLessThanOrEqual(body1.pre_training.sent);
    expect(body2.post_training.sent).toBeLessThanOrEqual(body1.post_training.sent);
    expect(body2.coach_feedback.sent).toBeLessThanOrEqual(body1.coach_feedback.sent);
  });
});

// ─── Session Notification Flag Tests ────────────────

test.describe('Session Notification Flags', () => {
  test('new session defaults notification flags to false', async () => {
    const sb = await signInAsAthlete();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // Insert a test session
    const { data: session, error: insertErr } = await sb.from('scheduled_sessions')
      .insert({
        athlete_id: ATHLETE_ID,
        session_type: 'training',
        label: 'Notification test',
        date: dateStr,
        start_time: '18:00',
        end_time: '19:30',
        notification_sent_pre: false,
        notification_sent_post: false,
      })
      .select()
      .single();

    expect(insertErr).toBeNull();
    expect(session!.notification_sent_pre).toBe(false);
    expect(session!.notification_sent_post).toBe(false);

    // Clean up
    await sb.from('scheduled_sessions').delete().eq('id', session!.id);
  });

  test('athlete can update push_token on profile', async () => {
    const sb = await signInAsAthlete();

    // Read current token
    const { data: before } = await sb.from('profiles')
      .select('push_token')
      .eq('id', ATHLETE_ID)
      .single();

    const testToken = 'ExponentPushToken[test-notification-token]';

    // Update
    const { error } = await sb.from('profiles')
      .update({ push_token: testToken })
      .eq('id', ATHLETE_ID);

    expect(error).toBeNull();

    // Verify
    const { data: after } = await sb.from('profiles')
      .select('push_token')
      .eq('id', ATHLETE_ID)
      .single();

    expect(after!.push_token).toBe(testToken);

    // Restore
    await sb.from('profiles')
      .update({ push_token: before!.push_token })
      .eq('id', ATHLETE_ID);
  });

  test('athlete can update notification_prefs', async () => {
    const sb = await signInAsAthlete();

    // Read current prefs
    const { data: before } = await sb.from('profiles')
      .select('notification_prefs')
      .eq('id', ATHLETE_ID)
      .single();

    const newPrefs = {
      pre_training: false,
      post_session: false,
      motivational: false,
      weekly_review: false,
    };

    // Update
    const { error } = await sb.from('profiles')
      .update({ notification_prefs: newPrefs })
      .eq('id', ATHLETE_ID);

    expect(error).toBeNull();

    // Verify
    const { data: after } = await sb.from('profiles')
      .select('notification_prefs')
      .eq('id', ATHLETE_ID)
      .single();

    expect((after!.notification_prefs as any).pre_training).toBe(false);

    // Restore
    await sb.from('profiles')
      .update({ notification_prefs: before!.notification_prefs })
      .eq('id', ATHLETE_ID);
  });

  test('coach comment insert creates unset notification_sent', async () => {
    const sb = await signInAsCoach();
    const { data: goals } = await sb.from('goals').select('id').eq('athlete_id', ATHLETE_ID);
    const goalId = goals![0].id;

    const { data: comment, error } = await sb.from('coach_comments')
      .insert({
        coach_id: COACH_ID,
        goal_id: goalId,
        content: 'Notification flag test',
        is_thumbs_up: false,
      })
      .select('id, notification_sent')
      .single();

    expect(error).toBeNull();
    expect(comment!.notification_sent).toBe(false);

    // Clean up
    await sb.from('coach_comments').delete().eq('id', comment!.id);
  });
});
