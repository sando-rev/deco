import { test, expect } from '@playwright/test';
import { signInAsAthlete, signInAsCoach, ATHLETE_ID, COACH_ID } from './helpers';

// ─── Weekly Overview (coach_weekly_actions) ────────────────────────────────

test.describe('Weekly Coach Overview', () => {
  const weekStart = '2026-06-01'; // A Monday

  test('coach can insert a weekly action', async () => {
    const sb = await signInAsCoach();

    // First get a team
    const { data: teams } = await sb.from('team_coaches').select('team_id').eq('coach_id', COACH_ID);
    expect(teams).toBeTruthy();
    expect(teams!.length).toBeGreaterThan(0);
    const teamId = teams![0].team_id;

    // Insert weekly action
    const { error } = await sb.from('coach_weekly_actions').upsert({
      coach_id: COACH_ID,
      team_id: teamId,
      athlete_id: ATHLETE_ID,
      week_start: weekStart,
      action_type: 'good',
    }, { onConflict: 'coach_id,team_id,athlete_id,week_start' });
    expect(error).toBeNull();

    // Verify we can read it back
    const { data, error: readError } = await sb
      .from('coach_weekly_actions')
      .select('*')
      .eq('coach_id', COACH_ID)
      .eq('week_start', weekStart);
    expect(readError).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(data![0].action_type).toBe('good');

    // Clean up
    await sb.from('coach_weekly_actions').delete().eq('coach_id', COACH_ID).eq('week_start', weekStart);
  });

  test('athlete can only see non-attention actions', async () => {
    const sbCoach = await signInAsCoach();
    const { data: teams } = await sbCoach.from('team_coaches').select('team_id').eq('coach_id', COACH_ID);
    const teamId = teams![0].team_id;

    // Insert attention action (should be hidden from athlete)
    await sbCoach.from('coach_weekly_actions').upsert({
      coach_id: COACH_ID,
      team_id: teamId,
      athlete_id: ATHLETE_ID,
      week_start: weekStart,
      action_type: 'attention',
    }, { onConflict: 'coach_id,team_id,athlete_id,week_start' });

    // Athlete should NOT see attention actions
    const sbAthlete = await signInAsAthlete();
    const { data } = await sbAthlete
      .from('coach_weekly_actions')
      .select('*')
      .eq('athlete_id', ATHLETE_ID)
      .eq('week_start', weekStart);
    const attentionActions = (data ?? []).filter((a: any) => a.action_type === 'attention');
    expect(attentionActions.length).toBe(0);

    // Clean up
    await sbCoach.from('coach_weekly_actions').delete().eq('coach_id', COACH_ID).eq('week_start', weekStart);
  });

  test('coach can update overview preferences', async () => {
    const sb = await signInAsCoach();
    const { error } = await sb
      .from('profiles')
      .update({ coach_overview_day: 4, coach_overview_time: '17:00' })
      .eq('id', COACH_ID);
    expect(error).toBeNull();

    // Verify
    const { data } = await sb.from('profiles').select('coach_overview_day, coach_overview_time').eq('id', COACH_ID).single();
    expect(data!.coach_overview_day).toBe(4);
    expect(data!.coach_overview_time).toBe('17:00');

    // Reset to defaults
    await sb.from('profiles').update({ coach_overview_day: 5, coach_overview_time: '18:00' }).eq('id', COACH_ID);
  });
});

// ─── Outlier Notifications ────────────────────────────────────────────────

test.describe('Outlier Notifications', () => {
  test('coach can toggle outlier notifications', async () => {
    const sb = await signInAsCoach();
    const { error } = await sb
      .from('profiles')
      .update({ outlier_notifications_enabled: false })
      .eq('id', COACH_ID);
    expect(error).toBeNull();

    const { data } = await sb.from('profiles').select('outlier_notifications_enabled').eq('id', COACH_ID).single();
    expect(data!.outlier_notifications_enabled).toBe(false);

    // Reset
    await sb.from('profiles').update({ outlier_notifications_enabled: true }).eq('id', COACH_ID);
  });

  test('outlier_notifications table has correct RLS', async () => {
    const sbCoach = await signInAsCoach();
    const { data: teams } = await sbCoach.from('team_coaches').select('team_id').eq('coach_id', COACH_ID);
    const teamId = teams![0].team_id;

    // Create a test reflection first
    const sbAthlete = await signInAsAthlete();
    const { data: ref, error: refErr } = await sbAthlete.from('reflections').insert({
      athlete_id: ATHLETE_ID,
      session_type: 'training',
      notes: 'Test outlier reflection',
    }).select().single();
    expect(refErr).toBeNull();

    // Coach can insert outlier notification
    const { error: insertErr } = await sbCoach.from('outlier_notifications').insert({
      reflection_id: ref!.id,
      athlete_id: ATHLETE_ID,
      coach_id: COACH_ID,
      team_id: teamId,
      outlier_type: 'low',
      avg_score: 1.5,
    });
    expect(insertErr).toBeNull();

    // Coach can read and update (set action)
    const { error: updateErr } = await sbCoach
      .from('outlier_notifications')
      .update({ coach_action: 'good' })
      .eq('coach_id', COACH_ID)
      .eq('reflection_id', ref!.id);
    expect(updateErr).toBeNull();

    // Athlete can see the action (it's 'good', not 'attention')
    const { data: athleteView } = await sbAthlete
      .from('outlier_notifications')
      .select('*')
      .eq('athlete_id', ATHLETE_ID)
      .eq('reflection_id', ref!.id);
    expect(athleteView!.length).toBeGreaterThan(0);

    // Clean up
    await sbCoach.from('outlier_notifications').delete().eq('coach_id', COACH_ID).eq('reflection_id', ref!.id);
    await sbAthlete.from('reflections').delete().eq('id', ref!.id);
  });
});

// ─── Activity Feed ────────────────────────────────────────────────────────

test.describe('Activity Feed', () => {
  test('feed_events table exists and is accessible', async () => {
    const sb = await signInAsAthlete();
    const { data: teams } = await sb.from('team_members').select('team_id').eq('athlete_id', ATHLETE_ID);
    expect(teams).toBeTruthy();

    if (teams && teams.length > 0) {
      const { data, error } = await sb
        .from('feed_events')
        .select('*')
        .eq('team_id', teams[0].team_id)
        .limit(5);
      expect(error).toBeNull();
      // Data may be empty but query should succeed
      expect(data).toBeTruthy();
    }
  });

  test('athlete can insert own milestone event', async () => {
    const sb = await signInAsAthlete();
    const { data: teams } = await sb.from('team_members').select('team_id').eq('athlete_id', ATHLETE_ID);
    expect(teams!.length).toBeGreaterThan(0);
    const teamId = teams![0].team_id;

    const { data: event, error } = await sb.from('feed_events').insert({
      team_id: teamId,
      athlete_id: ATHLETE_ID,
      event_type: 'goal_achieved',
      metadata: { goalTitle: 'Test goal', name: 'Test' },
    }).select().single();
    expect(error).toBeNull();
    expect(event).toBeTruthy();

    // Clean up
    await sb.from('feed_events').delete().eq('id', event!.id);
  });

  test('coach can insert announcement', async () => {
    const sb = await signInAsCoach();
    const { data: teams } = await sb.from('team_coaches').select('team_id').eq('coach_id', COACH_ID);
    const teamId = teams![0].team_id;

    const { data: event, error } = await sb.from('feed_events').insert({
      team_id: teamId,
      event_type: 'coach_announcement',
      metadata: { message: 'Test announcement' },
      is_pinned: true,
    }).select().single();
    expect(error).toBeNull();

    // Clean up
    await sb.from('feed_events').delete().eq('id', event!.id);
  });

  test('reactions work with emoji constraint', async () => {
    const sb = await signInAsAthlete();
    const { data: teams } = await sb.from('team_members').select('team_id').eq('athlete_id', ATHLETE_ID);
    const teamId = teams![0].team_id;

    // Create event
    const { data: event } = await sb.from('feed_events').insert({
      team_id: teamId,
      athlete_id: ATHLETE_ID,
      event_type: 'goal_achieved',
      metadata: { goalTitle: 'Test', name: 'Test' },
    }).select().single();

    // Add valid reaction
    const { error: reactErr } = await sb.from('feed_reactions').insert({
      event_id: event!.id,
      user_id: ATHLETE_ID,
      emoji: '💪',
    });
    expect(reactErr).toBeNull();

    // Verify unique constraint (same user, same event)
    const { error: dupErr } = await sb.from('feed_reactions').insert({
      event_id: event!.id,
      user_id: ATHLETE_ID,
      emoji: '🔥',
    });
    expect(dupErr).toBeTruthy(); // Should fail on unique constraint

    // Clean up
    await sb.from('feed_reactions').delete().eq('event_id', event!.id);
    await sb.from('feed_events').delete().eq('id', event!.id);
  });

  test('athlete can toggle feed visibility', async () => {
    const sb = await signInAsAthlete();
    const { error } = await sb
      .from('profiles')
      .update({ feed_visible: false })
      .eq('id', ATHLETE_ID);
    expect(error).toBeNull();

    const { data } = await sb.from('profiles').select('feed_visible').eq('id', ATHLETE_ID).single();
    expect(data!.feed_visible).toBe(false);

    // Reset
    await sb.from('profiles').update({ feed_visible: true }).eq('id', ATHLETE_ID);
  });
});
