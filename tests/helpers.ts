import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://hjbzknaionxkdkiowcch.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYnprbmFpb254a2RraW93Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjgxMjAsImV4cCI6MjA4ODc0NDEyMH0.WRE11VHC7-6QJNaPgg-9miDGceDxDmGqPL45-fhI6Ic';

export const ATHLETE_EMAIL = 'test-playwright@deco.app';
export const ATHLETE_PASSWORD = 'TestPass123!';
export const ATHLETE_ID = 'ec9e8787-2758-4edd-ab6d-556a8fb0931f';
export const COACH_EMAIL = 'test-coach@deco.app';
export const COACH_PASSWORD = 'TestPass123!';
export const COACH_ID = 'e5c85ee2-705d-493f-acd2-476732a8db60';

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
