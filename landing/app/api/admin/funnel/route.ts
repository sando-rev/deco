/**
 * GET /api/admin/funnel
 *
 * Returns a 6-step conversion funnel showing athlete progression
 * from signup through 7-day retention.
 * Requires a valid admin session.
 */

import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { subDays } from 'date-fns';

export async function GET() {
  // 1. Auth guard
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    // ── Step 1: Total athletes ────────────────────────────────────────────
    const { count: totalAthletes } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'athlete');

    const step1 = totalAthletes ?? 0;

    // ── Step 2: Athletes who selected skills ─────────────────────────────
    const { data: skillRows } = await supabase
      .from('athlete_selected_skills')
      .select('athlete_id');

    const step2 = new Set((skillRows ?? []).map((r: { athlete_id: string }) => r.athlete_id)).size;

    // ── Step 3: Athletes who created a goal ──────────────────────────────
    const { data: goalRows } = await supabase
      .from('goals')
      .select('athlete_id');

    const step3 = new Set((goalRows ?? []).map((r: { athlete_id: string }) => r.athlete_id)).size;

    // ── Step 4: Athletes who wrote a reflection ───────────────────────────
    const { data: reflectionRows } = await supabase
      .from('reflections')
      .select('athlete_id');

    const step4 = new Set((reflectionRows ?? []).map((r: { athlete_id: string }) => r.athlete_id)).size;

    // ── Step 5: Athletes who earned XP ───────────────────────────────────
    const { data: xpRows } = await supabase
      .from('xp_events')
      .select('athlete_id');

    const step5 = new Set((xpRows ?? []).map((r: { athlete_id: string }) => r.athlete_id)).size;

    // ── Step 6: Athletes retained (active in last 7 days) ────────────────
    const { count: retainedCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'athlete')
      .gte('last_active_at', sevenDaysAgo);

    const step6 = retainedCount ?? 0;

    // ── Build stages with percentage of previous step ────────────────────
    const rawStages = [
      { label: 'Total Athletes',     value: step1 },
      { label: 'Selected Skills',    value: step2 },
      { label: 'Created First Goal', value: step3 },
      { label: 'First Reflection',   value: step4 },
      { label: 'Earned XP',          value: step5 },
      { label: 'Retained 7d',        value: step6 },
    ];

    const stages = rawStages.map((stage, i) => {
      const prev = i === 0 ? step1 : rawStages[i - 1].value;
      const percentage = prev === 0
        ? 0
        : Math.round((stage.value / prev) * 100);

      return {
        label:      stage.label,
        value:      stage.value,
        percentage: i === 0 ? 100 : percentage,
      };
    });

    return NextResponse.json({ stages });
  } catch (err) {
    console.error('[/api/admin/funnel]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
