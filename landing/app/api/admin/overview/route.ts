/**
 * GET /api/admin/overview?range=7d|30d|90d|all
 *
 * Returns aggregated KPI data for the admin overview dashboard.
 * Requires a valid admin session (verified via cookie).
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { subDays, startOfDay, format } from 'date-fns';

// ─── Helpers ───────────────────────────────────────────────────────────────

type Range = '7d' | '30d' | '90d' | 'all';

function getRangeStart(range: Range): Date | null {
  const now = new Date();
  switch (range) {
    case '7d':  return startOfDay(subDays(now, 7));
    case '30d': return startOfDay(subDays(now, 30));
    case '90d': return startOfDay(subDays(now, 90));
    case 'all': return null;
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Auth guard
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse query param
  const { searchParams } = new URL(request.url);
  const rawRange = searchParams.get('range') ?? '30d';
  const range = (['7d', '30d', '90d', 'all'].includes(rawRange)
    ? rawRange
    : '30d') as Range;

  const rangeStart = getRangeStart(range);
  const supabase = createAdminClient();

  try {
    // ── 3a. User counts by role ──────────────────────────────────────────
    const [
      { count: totalUsers },
      { count: athletes },
      { count: coaches },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'athlete'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'coach'),
    ]);

    // ── 3b. New users in range ───────────────────────────────────────────
    let newUsersQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (rangeStart) {
      newUsersQuery = newUsersQuery.gte('created_at', rangeStart.toISOString());
    }
    const { count: newUsers } = await newUsersQuery;

    // ── 3c. Goals and reflections totals ────────────────────────────────
    const [
      { count: totalGoals },
      { count: totalReflections },
    ] = await Promise.all([
      supabase.from('goals').select('*', { count: 'exact', head: true }),
      supabase.from('reflections').select('*', { count: 'exact', head: true }),
    ]);

    // ── 3d. Total XP (sum) ───────────────────────────────────────────────
    const { data: xpData } = await supabase
      .from('xp_events')
      .select('amount');

    const totalXp = (xpData ?? []).reduce(
      (acc: number, row: { amount: number }) => acc + (row.amount ?? 0),
      0
    );

    // ── 3e. Daily signups timeseries ─────────────────────────────────────
    let signupsQuery = supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: true });

    if (rangeStart) {
      signupsQuery = signupsQuery.gte('created_at', rangeStart.toISOString());
    }

    const { data: signupRows } = await signupsQuery;

    const signupMap: Record<string, number> = {};
    for (const row of signupRows ?? []) {
      const day = format(new Date(row.created_at), 'yyyy-MM-dd');
      signupMap[day] = (signupMap[day] ?? 0) + 1;
    }
    const signupTimeseries = Object.entries(signupMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // ── 3f. DAU timeseries (last_active_at grouped by day) ───────────────
    let dauQuery = supabase
      .from('profiles')
      .select('last_active_at')
      .not('last_active_at', 'is', null)
      .order('last_active_at', { ascending: true });

    if (rangeStart) {
      dauQuery = dauQuery.gte('last_active_at', rangeStart.toISOString());
    }

    const { data: dauRows } = await dauQuery;

    // Each row is one profile; count profiles whose last_active_at falls on each day.
    const dauCountMap: Record<string, number> = {};
    for (const row of dauRows ?? []) {
      if (!row.last_active_at) continue;
      const day = format(new Date(row.last_active_at), 'yyyy-MM-dd');
      dauCountMap[day] = (dauCountMap[day] ?? 0) + 1;
    }
    const dauTimeseries = Object.entries(dauCountMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // ── 4. Response ──────────────────────────────────────────────────────
    return NextResponse.json({
      totalUsers:       totalUsers    ?? 0,
      athletes:         athletes      ?? 0,
      coaches:          coaches       ?? 0,
      newUsers:         newUsers      ?? 0,
      totalGoals:       totalGoals    ?? 0,
      totalReflections: totalReflections ?? 0,
      totalXp,
      signupTimeseries,
      dauTimeseries,
    });
  } catch (err) {
    console.error('[/api/admin/overview]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
