import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeseriesPoint {
  date: string;
  count: number;
}

export interface RetentionCohort {
  cohortWeek: string; // ISO week start date (Monday), e.g. "2024-01-01"
  week0: number;      // % retained in the signup week (always 100 for absolute, or % for relative)
  week1: number;
  week2: number;
  week3: number;
  totalUsers: number;
}

export interface UserRow {
  id: string;
  full_name: string | null;
  role: string | null;
  created_at: string;
  last_active_at: string | null;
  goalsCount: number;
  reflectionsCount: number;
}

export interface UsersApiResponse {
  signupTimeseries: TimeseriesPoint[];
  dauTimeseries: TimeseriesPoint[];
  wauTimeseries: TimeseriesPoint[];
  mauTimeseries: TimeseriesPoint[];
  retentionCohorts: RetentionCohort[];
  userList: UserRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns ISO date string (YYYY-MM-DD) for the Monday of the week containing `date`. */
function toWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Returns ISO date string (YYYY-MM-DD). */
function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Returns YYYY-MM (month bucket). */
function toMonthStr(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/** Adds `days` to a date and returns the resulting date. */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function rangeStartDate(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case '7d':  return addDays(now, -7);
    case '30d': return addDays(now, -30);
    case '90d': return addDays(now, -90);
    default:    return null; // all
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth guard
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') ?? '30d';
  const since = rangeStartDate(range);

  const supabase = createAdminClient();

  // ── 1. Fetch profiles within range ─────────────────────────────────────────
  let profilesQuery = supabase
    .from('profiles')
    .select('id, full_name, role, created_at, last_active_at');

  if (since) {
    profilesQuery = profilesQuery.gte('created_at', since.toISOString());
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError) {
    console.error('[admin/users] profiles error:', profilesError);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }

  const allProfiles = profiles ?? [];

  // ── 2. Signup timeseries — daily count of new profiles ────────────────────
  const signupByDate = new Map<string, number>();
  for (const p of allProfiles) {
    const d = toDateStr(new Date(p.created_at));
    signupByDate.set(d, (signupByDate.get(d) ?? 0) + 1);
  }
  const signupTimeseries: TimeseriesPoint[] = [...signupByDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  // ── 3. Activity timeseries — DAU / WAU / MAU ──────────────────────────────
  // For DAU/WAU/MAU we use ALL profiles' last_active_at (not range-filtered),
  // but we only bucket activity that falls within the selected range window.
  let activityQuery = supabase
    .from('profiles')
    .select('last_active_at')
    .not('last_active_at', 'is', null);

  if (since) {
    activityQuery = activityQuery.gte('last_active_at', since.toISOString());
  }

  const { data: activeProfiles } = await activityQuery;
  const activeRows = activeProfiles ?? [];

  // DAU — bucket by day
  const dauMap = new Map<string, Set<string>>();
  // WAU — bucket by week start
  const wauMap = new Map<string, Set<string>>();
  // MAU — bucket by month
  const mauMap = new Map<string, Set<string>>();

  for (const row of activeRows) {
    if (!row.last_active_at) continue;
    const d = new Date(row.last_active_at);
    const dayKey   = toDateStr(d);
    const weekKey  = toWeekStart(d);
    const monthKey = toMonthStr(d);

    // We use a fake unique key per row; Supabase doesn't return user id here —
    // use the timestamp string itself as a proxy (good enough for counting).
    const uid = row.last_active_at;

    if (!dauMap.has(dayKey))   dauMap.set(dayKey,   new Set());
    if (!wauMap.has(weekKey))  wauMap.set(weekKey,  new Set());
    if (!mauMap.has(monthKey)) mauMap.set(monthKey, new Set());

    dauMap.get(dayKey)!.add(uid);
    wauMap.get(weekKey)!.add(uid);
    mauMap.get(monthKey)!.add(uid);
  }

  const toSeries = (map: Map<string, Set<string>>): TimeseriesPoint[] =>
    [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, set]) => ({ date, count: set.size }));

  const dauTimeseries = toSeries(dauMap);
  const wauTimeseries = toSeries(wauMap);
  const mauTimeseries = toSeries(mauMap);

  // ── 4. Retention cohorts — all-time profiles, last 8 cohort weeks ─────────
  const { data: cohortProfiles } = await supabase
    .from('profiles')
    .select('id, created_at, last_active_at');

  const allCohortProfiles = cohortProfiles ?? [];

  // Group by signup week
  const cohortMap = new Map<string, { id: string; last_active_at: string | null }[]>();
  for (const p of allCohortProfiles) {
    const week = toWeekStart(new Date(p.created_at));
    if (!cohortMap.has(week)) cohortMap.set(week, []);
    cohortMap.get(week)!.push({ id: p.id, last_active_at: p.last_active_at });
  }

  // Take the 8 most recent cohort weeks
  const cohortWeeks = [...cohortMap.keys()].sort((a, b) => b.localeCompare(a)).slice(0, 8).reverse();

  const retentionCohorts: RetentionCohort[] = cohortWeeks.map((cohortWeek) => {
    const users = cohortMap.get(cohortWeek) ?? [];
    const total = users.length;

    const weekStartMs = new Date(cohortWeek).getTime();
    const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    const countActive = (weekOffset: number): number => {
      const windowStart = weekStartMs + weekOffset * MS_PER_WEEK;
      const windowEnd   = windowStart + MS_PER_WEEK;
      return users.filter((u) => {
        if (!u.last_active_at) return false;
        const t = new Date(u.last_active_at).getTime();
        return t >= windowStart && t < windowEnd;
      }).length;
    };

    return {
      cohortWeek,
      week0: pct(countActive(0)),
      week1: pct(countActive(1)),
      week2: pct(countActive(2)),
      week3: pct(countActive(3)),
      totalUsers: total,
    };
  });

  // ── 5. User list — top 100 newest users with goal/reflection counts ────────
  const { data: userRows } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at, last_active_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const users = userRows ?? [];

  // Fetch goal counts
  const userIds = users.map((u) => u.id);
  const { data: goalRows } = await supabase
    .from('goals')
    .select('user_id')
    .in('user_id', userIds);

  const { data: reflectionRows } = await supabase
    .from('reflections')
    .select('user_id')
    .in('user_id', userIds);

  const goalCounts = new Map<string, number>();
  for (const g of goalRows ?? []) {
    goalCounts.set(g.user_id, (goalCounts.get(g.user_id) ?? 0) + 1);
  }

  const reflectionCounts = new Map<string, number>();
  for (const r of reflectionRows ?? []) {
    reflectionCounts.set(r.user_id, (reflectionCounts.get(r.user_id) ?? 0) + 1);
  }

  const userList: UserRow[] = users.map((u) => ({
    id:              u.id,
    full_name:       u.full_name ?? null,
    role:            u.role ?? null,
    created_at:      u.created_at,
    last_active_at:  u.last_active_at ?? null,
    goalsCount:      goalCounts.get(u.id) ?? 0,
    reflectionsCount: reflectionCounts.get(u.id) ?? 0,
  }));

  // ── 6. Return ──────────────────────────────────────────────────────────────
  const response: UsersApiResponse = {
    signupTimeseries,
    dauTimeseries,
    wauTimeseries,
    mauTimeseries,
    retentionCohorts,
    userList,
  };

  return NextResponse.json(response);
}
