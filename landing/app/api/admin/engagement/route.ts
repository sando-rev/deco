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
  // Auth guard
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') ?? '30d';
  const rangeStart = getRangeStart(range);

  const supabase = createAdminClient();

  try {
    // ── Goals timeseries ─────────────────────────────────────────────────────
    let goalsQuery = supabase
      .from('goals')
      .select('created_at, status, ai_analysis');

    if (rangeStart) {
      goalsQuery = goalsQuery.gte('created_at', rangeStart.toISOString());
    }

    const { data: goalsRaw, error: goalsErr } = await goalsQuery;
    if (goalsErr) throw goalsErr;

    // Aggregate by date
    const goalsByDate: Record<string, number> = {};
    let activeCount = 0;
    let achievedCount = 0;
    let abandonedCount = 0;
    let goalsWithAi = 0;

    const aiScores: { specificity: number[]; measurability: number[]; challenge: number[] } = {
      specificity: [],
      measurability: [],
      challenge: [],
    };

    for (const goal of goalsRaw ?? []) {
      const day = format(startOfDay(new Date(goal.created_at)), 'yyyy-MM-dd');
      goalsByDate[day] = (goalsByDate[day] ?? 0) + 1;

      if (goal.status === 'active')    activeCount++;
      if (goal.status === 'achieved')  achievedCount++;
      if (goal.status === 'abandoned') abandonedCount++;

      if (goal.ai_analysis) {
        goalsWithAi++;
        const analysis = typeof goal.ai_analysis === 'string'
          ? JSON.parse(goal.ai_analysis)
          : goal.ai_analysis;

        if (typeof analysis?.specificity === 'number')   aiScores.specificity.push(analysis.specificity);
        if (typeof analysis?.measurability === 'number') aiScores.measurability.push(analysis.measurability);
        if (typeof analysis?.challenge === 'number')     aiScores.challenge.push(analysis.challenge);
      }
    }

    const goalsTimeseries = Object.entries(goalsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const goalsByStatus = { active: activeCount, achieved: achievedCount, abandoned: abandonedCount };
    const totalGoals = (goalsRaw ?? []).length;

    const aiFeedbackUsage = { total: totalGoals, withAi: goalsWithAi };

    const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : 0;
    const avgAiScores = {
      specificity:   avg(aiScores.specificity),
      measurability: avg(aiScores.measurability),
      challenge:     avg(aiScores.challenge),
    };

    const goalCompletionRate =
      totalGoals > 0
        ? Math.round((achievedCount / totalGoals) * 100 * 10) / 10
        : 0;

    // ── Reflections timeseries ───────────────────────────────────────────────
    let reflQuery = supabase
      .from('reflections')
      .select('created_at, notes');

    if (rangeStart) {
      reflQuery = reflQuery.gte('created_at', rangeStart.toISOString());
    }

    const { data: reflRaw, error: reflErr } = await reflQuery;
    if (reflErr) throw reflErr;

    const reflByDate: Record<string, number> = {};
    let reflWithNotes = 0;
    const noteLengths: number[] = [];

    for (const refl of reflRaw ?? []) {
      const day = format(startOfDay(new Date(refl.created_at)), 'yyyy-MM-dd');
      reflByDate[day] = (reflByDate[day] ?? 0) + 1;

      if (refl.notes && String(refl.notes).length > 0) {
        reflWithNotes++;
        noteLengths.push(String(refl.notes).length);
      }
    }

    const reflectionsTimeseries = Object.entries(reflByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const avgNotesLength = noteLengths.length
      ? Math.round(noteLengths.reduce((s, v) => s + v, 0) / noteLengths.length)
      : 0;

    const reflectionQuality = {
      total: (reflRaw ?? []).length,
      withNotes: reflWithNotes,
      avgNotesLength,
    };

    // ── Skill assessments timeseries ─────────────────────────────────────────
    let skillQuery = supabase
      .from('athlete_skill_scores')
      .select('created_at');

    if (rangeStart) {
      skillQuery = skillQuery.gte('created_at', rangeStart.toISOString());
    }

    const { data: skillRaw, error: skillErr } = await skillQuery;
    if (skillErr) throw skillErr;

    const skillByDate: Record<string, number> = {};
    for (const row of skillRaw ?? []) {
      const day = format(startOfDay(new Date(row.created_at)), 'yyyy-MM-dd');
      skillByDate[day] = (skillByDate[day] ?? 0) + 1;
    }

    const skillAssessments = Object.entries(skillByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      goalsTimeseries,
      goalsByStatus,
      reflectionsTimeseries,
      reflectionQuality,
      aiFeedbackUsage,
      avgAiScores,
      skillAssessments,
      goalCompletionRate,
    });
  } catch (err) {
    console.error('[admin/engagement]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
