import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './helpers';

test.describe('Admin Notifications API', () => {
  test('service role client can list profiles', async () => {
    // Simulate what the API does — query profiles with anon key (RLS applies)
    // This tests the profile query part
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'deco' } });

    // Sign in as test user to bypass RLS
    await sb.auth.signInWithPassword({
      email: 'test-playwright@deco.app',
      password: 'TestPass123!',
    });

    const { data, error } = await sb
      .from('profiles')
      .select('id, full_name, role, push_token, notification_prefs, notifications_paused_until, language');

    console.log('Profiles query:', { count: data?.length, error: error?.message });
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.length).toBeGreaterThan(0);
  });

  test('auth.admin.listUsers requires service role key', async () => {
    // This will fail with anon key — confirms the issue
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
      const result = await sb.auth.admin.listUsers({ perPage: 10 });
      console.log('listUsers result:', {
        hasData: !!result.data,
        hasUsers: !!result.data?.users,
        userCount: result.data?.users?.length,
        error: result.error?.message,
      });
      // With anon key, this should either error or return empty
      if (result.error) {
        console.log('Expected error with anon key:', result.error.message);
      }
    } catch (err: any) {
      console.log('listUsers threw:', err.message);
      // This confirms the destructuring issue
    }
  });

  test('supabase client handles listUsers error gracefully', async () => {
    // Test that our error handling approach works
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const emailMap: Record<string, string> = {};
    try {
      const response = await sb.auth.admin.listUsers({ perPage: 10 });
      // Safe access — don't destructure directly
      const authUsers = response?.data?.users;
      if (authUsers) {
        for (const u of authUsers) {
          if (u.email) emailMap[u.id] = u.email;
        }
      }
    } catch (_err) {
      console.log('listUsers failed (expected), continuing without emails');
    }

    console.log('emailMap entries:', Object.keys(emailMap).length);
    // Should be 0 since anon key can't list users
    expect(Object.keys(emailMap).length).toBe(0);
  });

  test('profiles query returns expected fields', async () => {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'deco' } });
    await sb.auth.signInWithPassword({
      email: 'test-playwright@deco.app',
      password: 'TestPass123!',
    });

    const { data, error } = await sb
      .from('profiles')
      .select('id, full_name, role, push_token, notification_prefs, notifications_paused_until, language')
      .limit(1)
      .single();

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('full_name');
    expect(data).toHaveProperty('role');
    expect(data).toHaveProperty('push_token');
    expect(data).toHaveProperty('notification_prefs');
    expect(data).toHaveProperty('notifications_paused_until');
    expect(data).toHaveProperty('language');
  });
});
