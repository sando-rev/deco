import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { subDays, startOfDay, format } from 'date-fns';

function getRangeStart(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case '7d':  return subDays(startOfDay(now), 7);
    case '30d': return subDays(startOfDay(now), 30);
    case '90d': return subDays(startOfDay(now), 90);
    default:    return null;
  }
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const range = req.nextUrl.searchParams.get('range') ?? '30d';
  const rangeStart = getRangeStart(range);

  const supabase = createAdminClient();

  // --- Fetch all sessions once; derive multiple metrics ---
  let sessionsQuery = supabase
    .from('scheduled_sessions')
    .select('created_at, session_type, reflection_id');
  if (rangeStart) {
    sessionsQuery = sessionsQuery.gte('created_at', rangeStart.toISOString());
  }
  const { data: sessionsRaw, error: sessionsErr } = await sessionsQuery;
  if (sessionsErr) {
    return NextResponse.json({ error: sessionsErr.message }, { status: 500 });
  }
  const sessions = sessionsRaw ?? [];

  // --- sessionsTimeseries: sessions per day ---
  const dayMap = new Map<string, number>();
  for (const row of sessions) {
    const day = format(new Date(row.created_at), 'yyyy-MM-dd');
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const sessionsTimeseries = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // --- completionRate: sessions with a reflection ---
  const totalSessions = sessions.length;
  const withReflection = sessions.filter((s) => s.reflection_id != null).length;
  const completionRate = {
    total: totalSessions,
    withReflection,
    rate: totalSessions > 0 ? Math.round((withReflection / totalSessions) * 100) : 0,
  };

  // --- sessionTypes: grouped by session_type ---
  const typeMap = new Map<string, number>();
  for (const row of sessions) {
    const type = (row.session_type as string) || 'other';
    typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
  }
  const sessionTypes = Array.from(typeMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ type, count }));

  // --- goalSelectionUsage: sessions that have entries in session_goals ---
  // Fetch session IDs first, then join session_goals
  let sessionIdsQuery = supabase
    .from('scheduled_sessions')
    .select('id');
  if (rangeStart) {
    sessionIdsQuery = sessionIdsQuery.gte('created_at', rangeStart.toISOString());
  }
  const { data: sessionIds, error: sessionIdsErr } = await sessionIdsQuery;
  if (sessionIdsErr) {
    return NextResponse.json({ error: sessionIdsErr.message }, { status: 500 });
  }

  const ids = (sessionIds ?? []).map((s) => s.id as string);
  let withGoals = 0;

  if (ids.length > 0) {
    // Fetch distinct session IDs that appear in session_goals
    const { data: goalRows, error: goalErr } = await supabase
      .from('session_goals')
      .select('session_id')
      .in('session_id', ids);
    if (goalErr) {
      return NextResponse.json({ error: goalErr.message }, { status: 500 });
    }
    const distinctSessionsWithGoals = new Set((goalRows ?? []).map((r) => r.session_id));
    withGoals = distinctSessionsWithGoals.size;
  }

  const goalSelectionUsage = {
    totalSessions,
    withGoals,
    rate: totalSessions > 0 ? Math.round((withGoals / totalSessions) * 100) : 0,
  };

  return NextResponse.json({
    sessionsTimeseries,
    completionRate,
    sessionTypes,
    goalSelectionUsage,
  });
}
