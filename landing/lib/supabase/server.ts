import { createClient } from '@supabase/supabase-js';

// Service role client — bypasses RLS, use only in API route handlers
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'deco' } }
  );
