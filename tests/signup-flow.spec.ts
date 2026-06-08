import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './helpers';

const TEST_PASSWORD = 'TestSignup123!';

/**
 * Creates a single Supabase client configured exactly like the app
 * (same schema, same options minus AsyncStorage).
 */
function createAppClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // No AsyncStorage in tests
      detectSessionInUrl: false,
    },
    db: { schema: 'deco' },
  });
}

test.describe('Sign-Up → Login Full Flow (mimics app)', () => {

  test('complete sign-up flow with single client (like the app)', async () => {
    const uniqueEmail = `test-app-${Date.now().toString(36)}@deco.app`;
    const sb = createAppClient();

    // === STEP 1: Sign up (like sign-up.tsx handleSignUp) ===
    console.log('=== STEP 1: Sign up ===');
    const { data: signUpData, error: signUpErr } = await sb.auth.signUp({
      email: uniqueEmail,
      password: TEST_PASSWORD,
      options: {
        data: { full_name: 'App Flow Test', role: 'athlete' },
      },
    });

    console.log('signUp:', { error: signUpErr?.message, hasSession: !!signUpData.session, userId: signUpData.user?.id });
    expect(signUpErr).toBeNull();
    expect(signUpData.user).toBeTruthy();

    const userId = signUpData.user!.id;

    // === STEP 2: Check if session exists (like onAuthStateChange) ===
    console.log('=== STEP 2: Check session ===');
    const { data: { session } } = await sb.auth.getSession();
    console.log('getSession:', { hasSession: !!session, userId: session?.user?.id });
    expect(session).toBeTruthy();
    expect(session!.user.id).toBe(userId);

    // === STEP 3: Fetch profile (like useAuth fetchProfile with retries) ===
    console.log('=== STEP 3: Fetch profile with retries ===');
    let profile: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log(`Profile attempt ${attempt}:`, { found: !!data, error: error?.message, code: error?.code });

      if (data && !error) {
        profile = data;
        break;
      }

      if (error?.code === 'PGRST116' && attempt < 3) {
        console.log(`Retrying in ${attempt}s...`);
        await new Promise(r => setTimeout(r, attempt * 1000));
        continue;
      }
    }

    expect(profile).toBeTruthy();
    expect(profile.full_name).toBe('App Flow Test');
    expect(profile.role).toBe('athlete');
    expect(profile.onboarding_completed).toBe(false);

    // === STEP 4: Complete onboarding (like useUpdateOnboardingComplete) ===
    console.log('=== STEP 4: Complete onboarding ===');
    const { error: updateErr } = await sb
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    console.log('Update onboarding_completed:', { error: updateErr?.message });
    expect(updateErr).toBeNull();

    // Verify it persisted
    const { data: updatedProfile } = await sb
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    console.log('After update:', updatedProfile);
    expect(updatedProfile!.onboarding_completed).toBe(true);

    // === STEP 5: Simulate app restart — sign out and sign back in ===
    console.log('=== STEP 5: Sign out + sign back in (app restart) ===');
    await sb.auth.signOut();

    const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({
      email: uniqueEmail,
      password: TEST_PASSWORD,
    });

    console.log('signIn after restart:', { error: signInErr?.message, hasSession: !!signInData.session });
    expect(signInErr).toBeNull();
    expect(signInData.session).toBeTruthy();

    // === STEP 6: Fetch profile again (should still be onboarded) ===
    console.log('=== STEP 6: Fetch profile after restart ===');
    const { data: restartProfile, error: restartErr } = await sb
      .from('profiles')
      .select('id, full_name, role, onboarding_completed')
      .eq('id', userId)
      .single();

    console.log('Profile after restart:', { profile: restartProfile, error: restartErr?.message });
    expect(restartErr).toBeNull();
    expect(restartProfile).toBeTruthy();
    expect(restartProfile!.onboarding_completed).toBe(true);
    expect(restartProfile!.role).toBe('athlete');

    // Clean up
    await sb.from('profiles').delete().eq('id', userId);
  });

  test('sign-up then immediate profile query uses authenticated session', async () => {
    // This tests the exact scenario: after signUp, can we query our profile
    // using the SAME client (no separate sign-in)?
    const uniqueEmail = `test-auth-${Date.now().toString(36)}@deco.app`;
    const sb = createAppClient();

    const { data: signUpData, error: signUpErr } = await sb.auth.signUp({
      email: uniqueEmail,
      password: TEST_PASSWORD,
      options: { data: { full_name: 'Auth Test', role: 'athlete' } },
    });

    expect(signUpErr).toBeNull();
    const userId = signUpData.user!.id;

    // WITHOUT signing in again, try to query profile
    // This is what the app does — onAuthStateChange fires and fetchProfile runs
    let profile: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await sb
        .from('profiles')
        .select('id, full_name, role, onboarding_completed')
        .eq('id', userId)
        .single();

      console.log(`Direct query attempt ${attempt}:`, { found: !!data, error: error?.message });

      if (data) {
        profile = data;
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    expect(profile).toBeTruthy();
    expect(profile.full_name).toBe('Auth Test');
    expect(profile.onboarding_completed).toBe(false);

    // Clean up
    await sb.from('profiles').delete().eq('id', userId);
  });

  test('coach sign-up flow works identically', async () => {
    const uniqueEmail = `test-coach-${Date.now().toString(36)}@deco.app`;
    const sb = createAppClient();

    const { data, error } = await sb.auth.signUp({
      email: uniqueEmail,
      password: TEST_PASSWORD,
      options: { data: { full_name: 'Coach Test', role: 'coach' } },
    });

    expect(error).toBeNull();
    const userId = data.user!.id;

    // Profile should exist with role=coach
    let profile: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data: p } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (p) { profile = p; break; }
      await new Promise(r => setTimeout(r, 1000));
    }

    expect(profile).toBeTruthy();
    expect(profile.role).toBe('coach');
    expect(profile.onboarding_completed).toBe(false);

    // Complete onboarding
    const { error: updateErr } = await sb
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);
    expect(updateErr).toBeNull();

    // Sign out and back in
    await sb.auth.signOut();
    const { error: signInErr } = await sb.auth.signInWithPassword({
      email: uniqueEmail,
      password: TEST_PASSWORD,
    });
    expect(signInErr).toBeNull();

    const { data: reloadedProfile } = await sb
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', userId)
      .single();

    expect(reloadedProfile!.role).toBe('coach');
    expect(reloadedProfile!.onboarding_completed).toBe(true);

    // Clean up
    await sb.from('profiles').delete().eq('id', userId);
  });

  test('onAuthStateChange fires with session after signUp', async () => {
    const uniqueEmail = `test-event-${Date.now().toString(36)}@deco.app`;
    const sb = createAppClient();

    // Listen for auth state changes (like the app does)
    let receivedSession: Session | null = null;
    let eventType: string | null = null;

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      console.log('onAuthStateChange:', event, 'hasSession:', !!session);
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        receivedSession = session;
        eventType = event;
      }
    });

    // Sign up
    const { error } = await sb.auth.signUp({
      email: uniqueEmail,
      password: TEST_PASSWORD,
      options: { data: { full_name: 'Event Test', role: 'athlete' } },
    });

    expect(error).toBeNull();

    // Give the event a moment to fire
    await new Promise(r => setTimeout(r, 500));

    console.log('Received event:', eventType, 'hasSession:', !!receivedSession);

    expect(receivedSession).toBeTruthy();
    expect(receivedSession!.access_token).toBeTruthy();

    // Clean up
    subscription.unsubscribe();
    const userId = receivedSession!.user.id;
    await sb.from('profiles').delete().eq('id', userId);
  });
});
