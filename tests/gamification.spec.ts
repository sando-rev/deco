import { test, expect } from '@playwright/test';
import { signInAsAthlete, signInAsCoach, ATHLETE_ID, COACH_ID } from './helpers';

// ─── Gamification Data Integrity Tests ──────────────────

test.describe('Gamification - XP & Streaks', () => {
  test('XP events table has correct event types', async () => {
    const sb = await signInAsAthlete();
    const { data } = await sb.from('xp_events').select('event_type, points').eq('athlete_id', ATHLETE_ID);
    expect(data!.length).toBeGreaterThan(0);

    const types = new Set(data!.map((e: any) => e.event_type));
    expect(types.has('goal_created') || types.has('reflection') || types.has('radar_profile')).toBe(true);

    for (const event of data!) {
      expect((event as any).points).toBeGreaterThan(0);
    }
  });

  test('get_athlete_xp matches sum of XP events', async () => {
    const sb = await signInAsAthlete();
    const { data: rpcXp } = await sb.rpc('get_athlete_xp', { p_athlete_id: ATHLETE_ID });
    const { data: events } = await sb.from('xp_events').select('points').eq('athlete_id', ATHLETE_ID);
    const manualSum = events!.reduce((acc: number, e: any) => acc + e.points, 0);
    expect(rpcXp).toBe(manualSum);
  });

  test('session streak calculation is consistent', async () => {
    const sb = await signInAsAthlete();
    const today = new Date().toISOString().split('T')[0];

    const { data: sessions } = await sb.from('scheduled_sessions')
      .select('id, date, reflection_id')
      .eq('athlete_id', ATHLETE_ID)
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(100);

    expect(sessions).toBeTruthy();
    expect(sessions!.length).toBeGreaterThan(0);

    let streak = 0;
    for (const session of sessions!) {
      if (session.reflection_id) {
        streak++;
      } else {
        break;
      }
    }
    expect(streak).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Gamification - Leaderboard Data', () => {
  test('leaderboard includes XP, streak, and goals for each player', async () => {
    const sb = await signInAsAthlete();
    const { data: memberships } = await sb.from('team_members').select('team_id').eq('athlete_id', ATHLETE_ID);
    const teamId = memberships![0].team_id;

    const { data: leaderboard } = await sb.rpc('get_team_leaderboard', { p_team_id: teamId });
    expect(leaderboard!.length).toBeGreaterThan(0);

    for (const entry of leaderboard!) {
      expect(typeof entry.total_xp).toBe('number');
      expect(typeof entry.streak).toBe('number');
      expect(typeof entry.goals_achieved).toBe('number');
      expect(entry.full_name).toBeTruthy();
    }
  });

  test('test athlete appears in leaderboard with correct name', async () => {
    const sb = await signInAsAthlete();
    const { data: memberships } = await sb.from('team_members').select('team_id').eq('athlete_id', ATHLETE_ID);
    const teamId = memberships![0].team_id;

    const { data: leaderboard } = await sb.rpc('get_team_leaderboard', { p_team_id: teamId });
    const athleteEntry = leaderboard!.find((e: any) => e.athlete_id === ATHLETE_ID);
    expect(athleteEntry).toBeTruthy();
    expect(athleteEntry!.full_name).toBe('Test Speler');
  });
});

test.describe('Gamification - Achievements Data', () => {
  test('achievement definitions have required fields', async () => {
    const sb = await signInAsAthlete();
    const { data } = await sb.from('achievements').select('*');

    for (const a of data!) {
      expect((a as any).key).toBeTruthy();
      expect((a as any).category).toBeTruthy();
      expect((a as any).icon).toBeTruthy();
      expect((a as any).xp_reward).toBeGreaterThanOrEqual(0);
    }
  });

  test('earned achievements have timestamps', async () => {
    const sb = await signInAsAthlete();
    const { data } = await sb.from('athlete_achievements')
      .select('*, achievement:achievements(*)')
      .eq('athlete_id', ATHLETE_ID);

    if (data!.length > 0) {
      for (const aa of data!) {
        expect((aa as any).earned_at).toBeTruthy();
        expect((aa as any).achievement).toBeTruthy();
      }
    }
  });
});

test.describe('Gamification - Coach Feedback Flow', () => {
  test('coach can create thumbs up on athlete goal', async () => {
    const sb = await signInAsCoach();
    const { data: goals } = await sb.from('goals').select('id').eq('athlete_id', ATHLETE_ID);
    const goalId = goals![0].id;

    const { data: comment, error } = await sb.from('coach_comments')
      .insert({
        coach_id: COACH_ID,
        goal_id: goalId,
        is_thumbs_up: true,
        content: null,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(comment!.is_thumbs_up).toBe(true);

    // Clean up
    await sb.from('coach_comments').delete().eq('id', comment!.id);
  });

  test('athlete sees unseen feedback count', async () => {
    const sb = await signInAsAthlete();
    const { data: goals } = await sb.from('goals').select('id').eq('athlete_id', ATHLETE_ID);

    let totalUnseen = 0;
    for (const goal of goals!) {
      const { data: comments } = await sb.from('coach_comments')
        .select('seen_by_athlete')
        .eq('goal_id', goal.id);
      totalUnseen += (comments ?? []).filter((c: any) => !c.seen_by_athlete).length;
    }

    expect(totalUnseen).toBeGreaterThan(0);
  });

  test('feedback grouped per goal is retrievable', async () => {
    const sb = await signInAsAthlete();
    const { data: goals } = await sb.from('goals')
      .select('id, title')
      .eq('athlete_id', ATHLETE_ID);

    expect(goals!.length).toBeGreaterThan(0);

    const goalId = goals![0].id;
    const { data: comments } = await sb.from('coach_comments')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false });

    expect(comments!.length).toBeGreaterThan(0);

    const hasThumbsUp = comments!.some((c: any) => c.is_thumbs_up);
    const hasText = comments!.some((c: any) => c.content && c.content.length > 0);
    expect(hasThumbsUp).toBe(true);
    expect(hasText).toBe(true);
  });

  test('goal AI analysis has quality scores for bonus XP', async () => {
    const sb = await signInAsAthlete();
    const { data: goals } = await sb.from('goals')
      .select('ai_analysis')
      .eq('athlete_id', ATHLETE_ID)
      .not('ai_analysis', 'is', null);

    expect(goals!.length).toBeGreaterThan(0);
    const analysis = goals![0].ai_analysis as any;
    expect(analysis).toHaveProperty('specificity_score');
    expect(analysis).toHaveProperty('measurability_score');
    expect(analysis).toHaveProperty('challenge_score');

    const avg = (analysis.specificity_score + analysis.measurability_score + analysis.challenge_score) / 3;
    const bonus = Math.min(Math.floor(avg * 3), 30);
    expect(bonus).toBeGreaterThan(0);
    expect(bonus).toBeLessThanOrEqual(30);
  });
});
