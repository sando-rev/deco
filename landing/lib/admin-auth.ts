import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Verify the request is from an authenticated admin
export async function verifyAdmin(): Promise<{ id: string; email: string } | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
      db: { schema: 'deco' },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check admin flag using the is_admin() database function
  const { data, error } = await supabase.rpc('is_admin');
  if (error || !data) return null;

  return { id: user.id, email: user.email! };
}
