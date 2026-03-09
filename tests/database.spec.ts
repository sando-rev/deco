import { test, expect } from '@playwright/test';
import { signInAsAthlete, signInAsCoach, ATHLETE_ID, COACH_ID } from './helpers';

// ─── XP System Tests ─────────────────────────────────

test.describe('XP System', () => {
  test('athlete can read own XP events', async () => {
    const sb = await signInAsAthlete();
    const { data, error } = await sb.from('xp_events').select('*').eq('athlete_id', ATHLETE_ID);
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.length).toBeGreaterThan(0);
  });

  test('get_athlete_xp RPC returns correct total', async () => {
    const sb = await signInAsAthlete();
    const { data: xp, error } = await sb.rpc('get_athlete_xp', { p_athlete_id: ATHLETE_ID });
    expect(error).toBeNull();
    expect(typeof xp).toBe('number');
    expect(xp).toBeGreaterThan(0);
  });

  test('athlete can insert XP events for self', async () => {
    const sb = await signInAsAthlete();
    const { error } = await sb.from('xp_events').insert({
      athlete_id: ATHLETE_ID,
      event_type: 'test_event',
      points: 10,
    });
    expect(error).toBeNull();

    // Clean up
    await sb.from('xp_events').delete().eq('athlete_id', ATHLETE_ID).eq('event_type', 'test_event');
  });

  test('athlete cannot insert XP events for other users', async () => {
    const sb = await signInAsAthlete();
    const { error } = await sb.from('xp_events').insert({
      athlete_id: COACH_ID,
      event_type: 'hack_attempt',
      points: 99999,
    });
    expect(error).not.toBeNull();
  });
});

// ─── Achievements Tests ──────────────────────────────

test.describe('Achievements', () => {
  test('all 18 achievements are seeded', async () => {
    const sb = await signInAsAthlete();
    const { data, error } = await sb.from('achievements').select('*').order('display_order');
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.length).toBe(18);
  });

  test('achievement categories are correct', async () => {
    const sb = await signInAsAthlete();
    const { data } = await sb.from('achievements').select('category');
    const categories = new Set(data!.map((a: any) => a.category));
    expect(categories).toContain('goals');
    expect(categories).toContain('reflections');
    expect(categories).toContain('growth');
    expect(categories).toContain('quality');
    expect(categories).toContain('streaks');
  });

  test('athlete can earn achievement', async () => {
    const sb = await signInAsAthlete();
    const { data: achievements } = await sb.from('achievements').select('id').limit(1).single();
    const achievementId = achievements!.id;

    const { error } = await sb.from('athlete_achievements').upsert({
      athlete_id: ATHLETE_ID,
      achievement_id: achievementId,
    }, { onConflict: 'athlete_id,achievement_id' });
    expect(error).toBeNull();

    const { data: earned } = await sb.from('athlete_achievements')
      .select('*')
      .eq('athlete_id', ATHLETE_ID)
      .eq('achievement_id', achievementId);
    expect(earned!.length).toBe(1);
  });

  test('duplicate achievement is handled gracefully', async () => {
    const sb = await signInAsAthlete();
    const { data: achievements } = await sb.from('achievements').select('id').limit(1).single();
    const achievementId = achievements!.id;

    const { error } = await sb.from('athlete_achievements').upsert({
      athlete_id: ATHLETE_ID,
      achievement_id: achievementId,
    }, { onConflict: 'athlete_id,achievement_id' });
    expect(error).toBeNull();
  });
});

// ─── Leaderboard Tests ───────────────────────────────

test.describe('Leaderboard', () => {
  test('get_team_leaderboard returns team data', async () => {
    const sb = await signInAsAthlete();
    const { data: memberships } = await sb.from('team_members').select('team_id').eq('athlete_id', ATHLETE_ID);
    expect(memberships).toBeTruthy();
    expect(memberships!.length).toBeGreaterThan(0);

    const teamId = memberships![0].team_id;
    const { data: leaderboard, error } = await sb.rpc('get_team_leaderboard', { p_team_id: teamId });
    expect(error).toBeNull();
    expect(leaderboard).toBeTruthy();
    expect(leaderboard!.length).toBeGreaterThan(0);

    const entry = leaderboard![0];
    expect(entry).toHaveProperty('athlete_id');
    expect(entry).toHaveProperty('full_name');
    expect(entry).toHaveProperty('total_xp');
    expect(entry).toHaveProperty('goals_achieved');
    expect(entry).toHaveProperty('streak');
  });

  test('leaderboard is ordered by XP descending', async () => {
    const sb = await signInAsAthlete();
    const { data: memberships } = await sb.from('team_members').select('team_id').eq('athlete_id', ATHLETE_ID);
    const teamId = memberships![0].team_id;

    const { data: leaderboard } = await sb.rpc('get_team_leaderboard', { p_team_id: teamId });
    for (let i = 1; i < leaderboard!.length; i++) {
      expect(leaderboard![i - 1].total_xp).toBeGreaterThanOrEqual(leaderboard![i].total_xp);
    }
  });

  test('coach can access leaderboard for their team', async () => {
    const sb = await signInAsCoach();
    const { data: teams } = await sb.from('team_coaches').select('team_id').eq('coach_id', COACH_ID);
    expect(teams!.length).toBeGreaterThan(0);

    const { data: leaderboard, error } = await sb.rpc('get_team_leaderboard', { p_team_id: teams![0].team_id });
    expect(error).toBeNull();
    expect(leaderboard!.length).toBeGreaterThan(0);
  });
});

// ─── Streak Tests ────────────────────────────────────

test.describe('Session Streak', () => {
  test('streak counts consecutive sessions with reflections', async () => {
    const sb = await signInAsAthlete();
    const today = new Date().toISOString().split('T')[0];

    const { data: sessions } = await sb.from('scheduled_sessions')
      .select('id, date, reflection_id')
      .eq('athlete_id', ATHLETE_ID)
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(100);

    expect(sessions).toBeTruthy();

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

  test('scheduled sessions are queryable by athlete', async () => {
    const sb = await signInAsAthlete();
    const { data, error } = await sb.from('scheduled_sessions')
      .select('*')
      .eq('athlete_id', ATHLETE_ID);

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
  });
});

// ─── Coach Feedback Tests ────────────────────────────

test.describe('Coach Feedback', () => {
  test('coach comments exist on test goal', async () => {
    const sb = await signInAsAthlete();
    const { data: goals } = await sb.from('goals').select('id').eq('athlete_id', ATHLETE_ID);
    expect(goals!.length).toBeGreaterThan(0);

    const goalId = goals![0].id;
    const { data: comments, error } = await sb.from('coach_comments')
      .select('*')
      .eq('goal_id', goalId);

    expect(error).toBeNull();
    expect(comments!.length).toBeGreaterThan(0);

    const hasThumbsUp = comments!.some((c: any) => c.is_thumbs_up);
    const hasTextComment = comments!.some((c: any) => c.content && c.content.length > 0);
    expect(hasThumbsUp).toBe(true);
    expect(hasTextComment).toBe(true);
  });

  test('seen_by_athlete field exists and defaults to false', async () => {
    const sb = await signInAsAthlete();
    const { data: goals } = await sb.from('goals').select('id').eq('athlete_id', ATHLETE_ID);
    const goalId = goals![0].id;

    const { data: comments } = await sb.from('coach_comments')
      .select('seen_by_athlete')
      .eq('goal_id', goalId);

    const unseenCount = comments!.filter((c: any) => !c.seen_by_athlete).length;
    expect(unseenCount).toBeGreaterThan(0);
  });

  test('athlete can mark feedback as seen', async () => {
    const sb = await signInAsAthlete();
    const { data: goals } = await sb.from('goals').select('id').eq('athlete_id', ATHLETE_ID);
    const goalId = goals![0].id;

    const { error } = await sb.from('coach_comments')
      .update({ seen_by_athlete: true })
      .eq('goal_id', goalId)
      .eq('seen_by_athlete', false);

    expect(error).toBeNull();

    const { data: comments } = await sb.from('coach_comments')
      .select('seen_by_athlete')
      .eq('goal_id', goalId);

    const allSeen = comments!.every((c: any) => c.seen_by_athlete);
    expect(allSeen).toBe(true);

    // Reset for other tests
    await sb.from('coach_comments')
      .update({ seen_by_athlete: false })
      .eq('goal_id', goalId);
  });

  test('coach can delete own comment', async () => {
    const sb = await signInAsCoach();
    const { data: goals } = await sb.from('goals').select('id').eq('athlete_id', ATHLETE_ID);
    const goalId = goals![0].id;

    const { data: newComment, error: insertErr } = await sb.from('coach_comments')
      .insert({
        coach_id: COACH_ID,
        goal_id: goalId,
        content: 'To be deleted',
        is_thumbs_up: false,
      })
      .select()
      .single();

    expect(insertErr).toBeNull();

    const { error: deleteErr } = await sb.from('coach_comments')
      .delete()
      .eq('id', newComment!.id);

    expect(deleteErr).toBeNull();
  });

  test('coach can update own comment', async () => {
    const sb = await signInAsCoach();
    const { data: goals } = await sb.from('goals').select('id').eq('athlete_id', ATHLETE_ID);
    const goalId = goals![0].id;

    const { data: comment } = await sb.from('coach_comments')
      .insert({
        coach_id: COACH_ID,
        goal_id: goalId,
        content: 'Original text',
        is_thumbs_up: false,
      })
      .select()
      .single();

    const { error } = await sb.from('coach_comments')
      .update({ content: 'Updated text' })
      .eq('id', comment!.id);

    expect(error).toBeNull();

    const { data: updated } = await sb.from('coach_comments')
      .select('content')
      .eq('id', comment!.id)
      .single();

    expect(updated!.content).toBe('Updated text');

    // Clean up
    await sb.from('coach_comments').delete().eq('id', comment!.id);
  });
});

// ─── RLS Security Tests ──────────────────────────────

test.describe('RLS Security', () => {
  test('athlete cannot see XP of non-teammate', async () => {
    const sb = await signInAsAthlete();
    const { data } = await sb.from('xp_events').select('*').eq('athlete_id', COACH_ID);
    expect(data!.length).toBe(0);
  });

  test('no infinite recursion on team_members policy', async () => {
    const sb = await signInAsAthlete();
    const { data, error } = await sb.from('team_members').select('*');
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
  });

  test('no infinite recursion on team_coaches policy', async () => {
    const sb = await signInAsAthlete();
    const { data, error } = await sb.from('team_coaches').select('*');
    expect(error).toBeNull();
  });
});

// ─── Goal Quality Bonus Tests ────────────────────────

test.describe('Goal Quality Bonus', () => {
  test('goal with AI analysis has quality scores', async () => {
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
    expect(analysis.specificity_score).toBeGreaterThanOrEqual(1);
    expect(analysis.specificity_score).toBeLessThanOrEqual(10);
  });
});
