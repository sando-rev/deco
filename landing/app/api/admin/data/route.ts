import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
            // Ignore in route handlers
          }
        },
      },
      db: { schema: 'deco' },
    }
  );

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse range
  const range = request.nextUrl.searchParams.get('range') || '30d';
  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : null;

  // Call the Postgres function (runs as SECURITY DEFINER, checks is_admin internally)
  const { data, error } = await supabase.rpc('get_analytics', {
    range_days: rangeDays,
  });

  if (error) {
    console.error('Analytics RPC error:', error);
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
