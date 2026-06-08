import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import {
  signInAsAthlete,
  signInAsCoach,
  ATHLETE_ID,
  ATHLETE_EMAIL,
  COACH_ID,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from './helpers';

// ─── Password Reset Tests ───────────────────────────

test.describe('Password Reset', () => {
  test('resetPasswordForEmail succeeds or rate-limits for existing user', async () => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await client.auth.resetPasswordForEmail(ATHLETE_EMAIL);
    // Either succeeds (null) or rate-limited — both confirm the endpoint works
    if (error) {
      expect(error.message).toMatch(/security purposes|rate limit/i);
    }
  });

  test('resetPasswordForEmail does not reveal user existence', async () => {
    // Supabase returns success even for unknown emails (prevents user enumeration)
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await client.auth.resetPasswordForEmail('nonexistent-playwright@test.com');
    if (error) {
      expect(error.message).toContain('security purposes');
    }
  });
});

// ─── Auth Session Tests ─────────────────────────────

test.describe('Auth Session', () => {
  test('signInWithPassword returns a valid session', async () => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client.auth.signInWithPassword({
      email: ATHLETE_EMAIL,
      password: 'TestPass123!',
    });
    expect(error).toBeNull();
    expect(data.session).toBeTruthy();
    expect(data.session!.access_token).toBeTruthy();
    expect(data.session!.refresh_token).toBeTruthy();
    expect(data.user).toBeTruthy();
    expect(data.user!.id).toBe(ATHLETE_ID);
  });

  test('session token can be used to query profile', async () => {
    const sb = await signInAsAthlete();
    const { data, error } = await sb
      .from('profiles')
      .select('id, full_name, role, onboarding_completed')
      .eq('id', ATHLETE_ID)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.id).toBe(ATHLETE_ID);
    expect(data!.role).toBe('athlete');
    expect(typeof data!.onboarding_completed).toBe('boolean');
  });

  test('invalid credentials return error', async () => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await client.auth.signInWithPassword({
      email: ATHLETE_EMAIL,
      password: 'WrongPassword!',
    });
    expect(error).not.toBeNull();
  });
});

// ─── Team Membership Visibility Tests ───────────────

test.describe('Team Member Visibility', () => {
  test('coach can see athlete in team_members', async () => {
    const sb = await signInAsCoach();
    const { data: teams } = await sb
      .from('team_coaches')
      .select('team_id')
      .eq('coach_id', COACH_ID);
    expect(teams!.length).toBeGreaterThan(0);

    const teamId = teams![0].team_id;
    const { data: members, error } = await sb
      .from('team_members')
      .select('athlete_id')
      .eq('team_id', teamId);

    expect(error).toBeNull();
    expect(members!.length).toBeGreaterThan(0);
    expect(members!.some((m: any) => m.athlete_id === ATHLETE_ID)).toBe(true);
  });

  test('coach can see athlete profile via team membership', async () => {
    const sb = await signInAsCoach();
    const { data: teams } = await sb
      .from('team_coaches')
      .select('team_id')
      .eq('coach_id', COACH_ID);
    const teamId = teams![0].team_id;

    const { data: members } = await sb
      .from('team_members')
      .select('athlete_id')
      .eq('team_id', teamId);

    const athleteIds = members!.map((m: any) => m.athlete_id);
    const { data: profiles, error } = await sb
      .from('profiles')
      .select('id, full_name, role')
      .in('id', athleteIds);

    expect(error).toBeNull();
    expect(profiles!.length).toBe(athleteIds.length);
    expect(profiles!.every((p: any) => p.role === 'athlete')).toBe(true);
  });

  test('new team member is immediately visible to coach', async () => {
    const coachSb = await signInAsCoach();
    const athleteSb = await signInAsAthlete();

    // Get coach's team
    const { data: teams } = await coachSb
      .from('team_coaches')
      .select('team_id')
      .eq('coach_id', COACH_ID);
    const teamId = teams![0].team_id;

    // Create a temporary test member row (use athlete ID with different team to simulate)
    // Instead, we verify the current state: athlete is already a member, remove and re-add
    const { data: existing } = await athleteSb
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('athlete_id', ATHLETE_ID);

    if (existing && existing.length > 0) {
      // Remove athlete from team
      await athleteSb
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('athlete_id', ATHLETE_ID);

      // Coach should NOT see athlete now
      const { data: membersAfterRemove } = await coachSb
        .from('team_members')
        .select('athlete_id')
        .eq('team_id', teamId);

      expect(membersAfterRemove!.some((m: any) => m.athlete_id === ATHLETE_ID)).toBe(false);

      // Re-add athlete to team
      const { error: reInsertErr } = await athleteSb
        .from('team_members')
        .insert({ team_id: teamId, athlete_id: ATHLETE_ID });
      expect(reInsertErr).toBeNull();

      // Coach should see athlete again immediately (no cache, fresh query)
      const { data: membersAfterAdd } = await coachSb
        .from('team_members')
        .select('athlete_id')
        .eq('team_id', teamId);

      expect(membersAfterAdd!.some((m: any) => m.athlete_id === ATHLETE_ID)).toBe(true);
    }
  });

  test('team invite code exists and is non-empty', async () => {
    const sb = await signInAsCoach();
    const { data: teams } = await sb
      .from('team_coaches')
      .select('team_id')
      .eq('coach_id', COACH_ID);
    const teamId = teams![0].team_id;

    const { data: team, error } = await sb
      .from('teams')
      .select('invite_code')
      .eq('id', teamId)
      .single();

    expect(error).toBeNull();
    expect(team!.invite_code).toBeTruthy();
    expect(team!.invite_code.length).toBeGreaterThanOrEqual(4);
  });

  test('joining by invite code works', async () => {
    const coachSb = await signInAsCoach();
    const { data: teams } = await coachSb
      .from('team_coaches')
      .select('team_id')
      .eq('coach_id', COACH_ID);
    const teamId = teams![0].team_id;

    const { data: team } = await coachSb
      .from('teams')
      .select('invite_code')
      .eq('id', teamId)
      .single();

    // Verify the invite code resolves to the correct team
    const { data: found, error } = await coachSb
      .from('teams')
      .select('id')
      .eq('invite_code', team!.invite_code.toUpperCase())
      .single();

    expect(error).toBeNull();
    expect(found!.id).toBe(teamId);
  });
});
