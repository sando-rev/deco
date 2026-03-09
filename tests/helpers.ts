import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://njzojocqtouumgazbfso.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qem9qb2NxdG91dW1nYXpiZnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzU1MTIsImV4cCI6MjA4MzQ1MTUxMn0.U8yQUOUVrQ_zcFOfL2ghzNIBtchUr54Owi_UWRDqdAQ';

export const ATHLETE_EMAIL = 'test-playwright@deco.app';
export const ATHLETE_PASSWORD = 'TestPass123!';
export const ATHLETE_ID = 'a0000000-0000-0000-0000-000000000001';
export const COACH_EMAIL = 'test-coach@deco.app';
export const COACH_PASSWORD = 'TestPass123!';
export const COACH_ID = 'c0000000-0000-0000-0000-000000000001';

// Cache tokens to avoid rate limits
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getToken(email: string, password: string): Promise<string> {
  const cached = tokenCache.get(email);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign in failed for ${email}: ${error.message}`);

  const token = data.session!.access_token;
  // Cache for 50 minutes (tokens last 1 hour)
  tokenCache.set(email, { token, expiresAt: Date.now() + 50 * 60 * 1000 });
  return token;
}

function makeClient(token: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: 'deco' },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

export async function signInAsAthlete(): Promise<SupabaseClient> {
  const token = await getToken(ATHLETE_EMAIL, ATHLETE_PASSWORD);
  return makeClient(token);
}

export async function signInAsCoach(): Promise<SupabaseClient> {
  const token = await getToken(COACH_EMAIL, COACH_PASSWORD);
  return makeClient(token);
}
