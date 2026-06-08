import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import {
  signInAsAthlete,
  signInAsCoach,
  ATHLETE_ID,
  ATHLETE_EMAIL,
  ATHLETE_PASSWORD,
  COACH_ID,
  COACH_EMAIL,
  COACH_PASSWORD,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from './helpers';

// ─── Session Persistence Tests ──────────────────────
// These tests verify the fixes for: users getting logged out on app close
// and being redirected to onboarding despite having completed it.

test.describe('Session Token Persistence', () => {
  test('refresh token can restore a session after access token expires', async () => {
    // Simulate: user signs in, closes app, reopens (uses refresh token)
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
      email: ATHLETE_EMAIL,
      password: ATHLETE_PASSWORD,
    });
    expect(signInErr).toBeNull();

    const refreshToken = signInData.session!.refresh_token;
    expect(refreshToken).toBeTruthy();

    // Create a fresh client (simulates app restart — no in-memory session)
    const freshClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: refreshed, error: refreshErr } = await freshClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    expect(refreshErr).toBeNull();
    expect(refreshed.session).toBeTruthy();
    expect(refreshed.session!.access_token).toBeTruthy();
    expect(refreshed.session!.user.id).toBe(ATHLETE_ID);
  });

  test('session user ID matches profile ID after re-auth', async () => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await client.auth.signInWithPassword({
      email: ATHLETE_EMAIL,
      password: ATHLETE_PASSWORD,
    });

    const refreshToken = data.session!.refresh_token;

    // Simulate app restart with refresh
    const freshClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'deco' },
    });
    const { data: refreshed } = await freshClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    // Now query profile with the refreshed session
    const profileClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'deco' },
      global: {
        headers: { Authorization: `Bearer ${refreshed.session!.access_token}` },
      },
    });

    const { data: profile, error } = await profileClient
      .from('profiles')
      .select('id, full_name, role, onboarding_completed')
      .eq('id', refreshed.session!.user.id)
      .single();

    expect(error).toBeNull();
    expect(profile).toBeTruthy();
    expect(profile!.id).toBe(ATHLETE_ID);
    expect(typeof profile!.onboarding_completed).toBe('boolean');
  });

  test('coach session persists same way', async () => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await client.auth.signInWithPassword({
      email: COACH_EMAIL,
      password: COACH_PASSWORD,
    });

    const { data: refreshed, error } = await createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      .auth.refreshSession({ refresh_token: data.session!.refresh_token });

    expect(error).toBeNull();
    expect(refreshed.session!.user.id).toBe(COACH_ID);
  });
});

// ─── Profile Availability After Auth ────────────────
// These tests verify the fix: profile must be loaded before AuthGate decides routing.

test.describe('Profile Available After Sign-In', () => {
  test('profile exists immediately after signInWithPassword', async () => {
    // This simulates what useAuth does: sign in → immediately fetch profile
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authData, error: authErr } = await client.auth.signInWithPassword({
      email: ATHLETE_EMAIL,
      password: ATHLETE_PASSWORD,
    });
    expect(authErr).toBeNull();

    // Immediately query profile (no delay)
    const profileClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'deco' },
      global: {
        headers: { Authorization: `Bearer ${authData.session!.access_token}` },
      },
    });

    const { data: profile, error: profileErr } = await profileClient
      .from('profiles')
      .select('id, onboarding_completed, role')
      .eq('id', authData.user!.id)
      .single();

    expect(profileErr).toBeNull();
    expect(profile).toBeTruthy();
    expect(profile!.id).toBe(ATHLETE_ID);
    // onboarding_completed is a boolean (could be true or false for test user)
    expect(typeof profile!.onboarding_completed).toBe('boolean');
  });

  test('profile is always returned with onboarding_completed field', async () => {
    const sb = await signInAsAthlete();
    const { data, error } = await sb
      .from('profiles')
      .select('id, onboarding_completed, role, full_name')
      .eq('id', ATHLETE_ID)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data).toHaveProperty('onboarding_completed');
    expect(typeof data!.onboarding_completed).toBe('boolean');
  });

  test('coach profile is always returned with onboarding_completed field', async () => {
    const sb = await signInAsCoach();
    const { data, error } = await sb
      .from('profiles')
      .select('id, onboarding_completed, role')
      .eq('id', COACH_ID)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data).toHaveProperty('onboarding_completed');
    expect(typeof data!.onboarding_completed).toBe('boolean');
  });

  test('onboarding_completed survives unrelated profile update', async () => {
    const sb = await signInAsAthlete();

    // Read current state
    const { data: before } = await sb
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', ATHLETE_ID)
      .single();
    const originalValue = before!.onboarding_completed;

    // Update an unrelated field
    const { error: updateErr } = await sb
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', ATHLETE_ID);
    expect(updateErr).toBeNull();

    // Verify onboarding_completed is unchanged
    const { data: after, error } = await sb
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', ATHLETE_ID)
      .single();

    expect(error).toBeNull();
    expect(after!.onboarding_completed).toBe(originalValue);
  });
});

// ─── Auth Trigger Profile Creation ──────────────────
// Verifies handle_new_user() trigger creates a profile row

test.describe('Profile Creation Trigger', () => {
  test('profile exists for test athlete (trigger ran on signup)', async () => {
    const sb = await signInAsAthlete();
    const { data, error } = await sb
      .from('profiles')
      .select('id, full_name, role, sport')
      .eq('id', ATHLETE_ID)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.id).toBe(ATHLETE_ID);
    expect(data!.role).toBe('athlete');
    expect(data!.sport).toBeTruthy();
  });

  test('profile exists for test coach (trigger ran on signup)', async () => {
    const sb = await signInAsCoach();
    const { data, error } = await sb
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', COACH_ID)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.role).toBe('coach');
  });
});

// ─── Onboarding Completion Persistence ──────────────

test.describe('Onboarding Completion', () => {
  test('onboarding_completed=true persists across sessions', async () => {
    const sb = await signInAsAthlete();

    // Ensure it's true first
    await sb.from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', ATHLETE_ID);

    // Simulate a new session (fresh client with re-auth)
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authData } = await client.auth.signInWithPassword({
      email: ATHLETE_EMAIL,
      password: ATHLETE_PASSWORD,
    });

    const freshSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'deco' },
      global: {
        headers: { Authorization: `Bearer ${authData.session!.access_token}` },
      },
    });

    const { data: after, error } = await freshSb
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', ATHLETE_ID)
      .single();

    expect(error).toBeNull();
    expect(after!.onboarding_completed).toBe(true);
  });

  test('onboarding_completed round-trip: false → true → verify', async () => {
    const sb = await signInAsAthlete();

    // Set to false temporarily
    await sb.from('profiles')
      .update({ onboarding_completed: false })
      .eq('id', ATHLETE_ID);

    const { data: check1 } = await sb
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', ATHLETE_ID)
      .single();
    expect(check1!.onboarding_completed).toBe(false);

    // Set back to true (simulates useUpdateOnboardingComplete)
    await sb.from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', ATHLETE_ID);

    const { data: check2 } = await sb
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', ATHLETE_ID)
      .single();
    expect(check2!.onboarding_completed).toBe(true);
  });

  test('multiple rapid profile fetches return consistent onboarding state', async () => {
    // Simulates AuthGate + onAuthStateChange + getSession all fetching profile
    const sb = await signInAsAthlete();

    const results = await Promise.all([
      sb.from('profiles').select('onboarding_completed').eq('id', ATHLETE_ID).single(),
      sb.from('profiles').select('onboarding_completed').eq('id', ATHLETE_ID).single(),
      sb.from('profiles').select('onboarding_completed').eq('id', ATHLETE_ID).single(),
    ]);

    for (const { data, error } of results) {
      expect(error).toBeNull();
      expect(data!.onboarding_completed).toBe(true);
    }
  });
});
