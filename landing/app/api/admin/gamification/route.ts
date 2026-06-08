import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { subDays, startOfDay, format } from 'date-fns';

function getRangeStart(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case '7d':  return subDays(now, 7);
    case '30d': return subDays(now, 30);
    case '90d': return subDays(now, 90);
    default:    return null;
  }
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') ?? '30d';
  const rangeStart = getRangeStart(range);

  const supabase = createAdminClient();

  try {
    // ── XP events ────────────────────────────────────────────────────────────
    let xpQuery = supabase
      .from('xp_events')
      .select('athlete_id, points, event_type, created_at');

    if (rangeStart) {
      xpQuery = xpQuery.gte('created_at', rangeStart.toISOString());
    }

    const { data: xpRaw, error: xpErr } = await xpQuery;
    if (xpErr) throw xpErr;

    let totalXpAwarded = 0;
    const xpByDateMap: Record<string, number> = {};
    const xpByTypeMap: Record<string, { total: number; count: number }> = {};
    const xpByAthleteMap: Record<string, number> = {};

    for (const ev of xpRaw ?? []) {
      const pts = ev.points ?? 0;
      totalXpAwarded += pts;

      const day = format(startOfDay(new Date(ev.created_at)), 'yyyy-MM-dd');
      xpByDateMap[day] = (xpByDateMap[day] ?? 0) + pts;

      const type = ev.event_type ?? 'unknown';
      if (!xpByTypeMap[type]) xpByTypeMap[type] = { total: 0, count: 0 };
      xpByTypeMap[type].total += pts;
      xpByTypeMap[type].count += 1;

      xpByAthleteMap[ev.athlete_id] = (xpByAthleteMap[ev.athlete_id] ?? 0) + pts;
    }

    const xpTimeseries = Object.entries(xpByDateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));

    const xpByType = Object.entries(xpByTypeMap)
      .map(([event_type, { total, count }]) => ({ event_type, total, count }))
      .sort((a, b) => b.total - a.total);

    // ── XP distribution per athlete ──────────────────────────────────────────
    // Fetch athlete names
    const athleteIds = Object.keys(xpByAthleteMap);
    let nameMap: Record<string, string> = {};

    if (athleteIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', athleteIds);

      for (const p of profiles ?? []) {
        nameMap[p.id] = p.full_name ?? p.id;
      }
    }

    const xpDistribution = Object.entries(xpByAthleteMap)
      .map(([athlete_id, totalXp]) => ({
        athlete_id,
        full_name: nameMap[athlete_id] ?? athlete_id,
        totalXp,
      }))
      .sort((a, b) => b.totalXp - a.totalXp);

    // ── Achievements ─────────────────────────────────────────────────────────
    const { data: allAchievements, error: achieveDefErr } = await supabase
      .from('achievements')
      .select('key, label, description');

    if (achieveDefErr) throw achieveDefErr;

    // Total distinct athletes
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: false });
    const totalAthletes = (allProfiles ?? []).length;

    // Earned achievements (all time — not range filtered, for cumulative rates)
    const { data: earnedRaw, error: earnedErr } = await supabase
      .from('athlete_achievements')
      .select('achievement_key');

    if (earnedErr) throw earnedErr;

    const earnedByKey: Record<string, number> = {};
    for (const row of earnedRaw ?? []) {
      earnedByKey[row.achievement_key] = (earnedByKey[row.achievement_key] ?? 0) + 1;
    }

    const achievementRates = (allAchievements ?? []).map((a) => {
      const totalEarned = earnedByKey[a.key] ?? 0;
      const rate = totalAthletes > 0 ? Math.round((totalEarned / totalAthletes) * 100 * 10) / 10 : 0;
      return {
        key: a.key,
        label: a.label,
        description: a.description ?? '',
        totalEarned,
        totalAthletes,
        rate,
      };
    }).sort((a, b) => b.rate - a.rate);

    // ── Streak distribution ──────────────────────────────────────────────────
    const { data: streakRaw, error: streakErr } = await supabase
      .from('profiles')
      .select('current_streak');

    if (streakErr) throw streakErr;

    const streakMap: Record<number, number> = {};
    for (const row of streakRaw ?? []) {
      const s = row.current_streak ?? 0;
      streakMap[s] = (streakMap[s] ?? 0) + 1;
    }

    const streakDistribution = Object.entries(streakMap)
      .map(([streak, count]) => ({ streak: Number(streak), count }))
      .sort((a, b) => a.streak - b.streak);

    return NextResponse.json({
      totalXpAwarded,
      xpTimeseries,
      xpByType,
      xpDistribution,
      achievementRates,
      streakDistribution,
    });
  } catch (err) {
    console.error('[admin/gamification]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
