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

  // --- commentsTimeseries: coach_comments per day ---
  let commentsQuery = supabase
    .from('coach_comments')
    .select('created_at');
  if (rangeStart) {
    commentsQuery = commentsQuery.gte('created_at', rangeStart.toISOString());
  }
  const { data: commentsRaw, error: commentsErr } = await commentsQuery;
  if (commentsErr) {
    return NextResponse.json({ error: commentsErr.message }, { status: 500 });
  }

  // Aggregate by day client-side for flexibility
  const dayMap = new Map<string, number>();
  for (const row of commentsRaw ?? []) {
    const day = format(new Date(row.created_at), 'yyyy-MM-dd');
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const commentsTimeseries = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // --- thumbsUpRate: total vs thumbs-up comments ---
  let thumbsQuery = supabase
    .from('coach_comments')
    .select('is_thumbs_up');
  if (rangeStart) {
    thumbsQuery = thumbsQuery.gte('created_at', rangeStart.toISOString());
  }
  const { data: thumbsRaw, error: thumbsErr } = await thumbsQuery;
  if (thumbsErr) {
    return NextResponse.json({ error: thumbsErr.message }, { status: 500 });
  }
  const total = thumbsRaw?.length ?? 0;
  const thumbsUp = thumbsRaw?.filter((r) => r.is_thumbs_up === true).length ?? 0;
  const thumbsUpRate = {
    total,
    thumbsUp,
    rate: total > 0 ? Math.round((thumbsUp / total) * 100) : 0,
  };

  // --- scoreFeedbackCount ---
  let scoreFbQuery = supabase
    .from('coach_score_feedback')
    .select('id', { count: 'exact', head: true });
  if (rangeStart) {
    scoreFbQuery = scoreFbQuery.gte('created_at', rangeStart.toISOString());
  }
  const { count: scoreFeedbackCount, error: scoreErr } = await scoreFbQuery;
  if (scoreErr) {
    return NextResponse.json({ error: scoreErr.message }, { status: 500 });
  }

  // --- teamSizes: teams with member and coach counts ---
  const { data: teamsRaw, error: teamsErr } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      team_members ( id ),
      team_coaches ( id )
    `);
  if (teamsErr) {
    return NextResponse.json({ error: teamsErr.message }, { status: 500 });
  }
  const teamSizes = (teamsRaw ?? []).map((team) => ({
    teamName: team.name as string,
    memberCount: Array.isArray(team.team_members) ? team.team_members.length : 0,
    coachCount: Array.isArray(team.team_coaches) ? team.team_coaches.length : 0,
  }));

  // --- activeCoaches: top coaches by activity ---
  // Fetch comments with coach_id
  let coachCommentsQuery = supabase
    .from('coach_comments')
    .select('coach_id, is_thumbs_up');
  if (rangeStart) {
    coachCommentsQuery = coachCommentsQuery.gte('created_at', rangeStart.toISOString());
  }
  const { data: coachCommentsRaw, error: ccErr } = await coachCommentsQuery;
  if (ccErr) {
    return NextResponse.json({ error: ccErr.message }, { status: 500 });
  }

  let coachScoreQuery = supabase
    .from('coach_score_feedback')
    .select('coach_id');
  if (rangeStart) {
    coachScoreQuery = coachScoreQuery.gte('created_at', rangeStart.toISOString());
  }
  const { data: coachScoreRaw, error: csErr } = await coachScoreQuery;
  if (csErr) {
    return NextResponse.json({ error: csErr.message }, { status: 500 });
  }

  // Aggregate per coach
  const coachMap = new Map<
    string,
    { commentsCount: number; thumbsUps: number; scoreFeedbacks: number }
  >();
  for (const row of coachCommentsRaw ?? []) {
    const id = row.coach_id as string;
    const entry = coachMap.get(id) ?? { commentsCount: 0, thumbsUps: 0, scoreFeedbacks: 0 };
    entry.commentsCount += 1;
    if (row.is_thumbs_up) entry.thumbsUps += 1;
    coachMap.set(id, entry);
  }
  for (const row of coachScoreRaw ?? []) {
    const id = row.coach_id as string;
    const entry = coachMap.get(id) ?? { commentsCount: 0, thumbsUps: 0, scoreFeedbacks: 0 };
    entry.scoreFeedbacks += 1;
    coachMap.set(id, entry);
  }

  // Fetch profile names for all coach IDs
  const coachIds = Array.from(coachMap.keys());
  let activeCoaches: {
    coachId: string;
    fullName: string;
    commentsCount: number;
    thumbsUps: number;
    scoreFeedbacks: number;
  }[] = [];

  if (coachIds.length > 0) {
    const { data: profilesRaw, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', coachIds);
    if (profilesErr) {
      return NextResponse.json({ error: profilesErr.message }, { status: 500 });
    }
    const profileMap = new Map<string, string>(
      (profilesRaw ?? []).map((p) => [p.id as string, (p.full_name ?? 'Unknown') as string])
    );
    activeCoaches = coachIds
      .map((id) => ({
        coachId: id,
        fullName: profileMap.get(id) ?? 'Unknown',
        ...(coachMap.get(id)!),
      }))
      .sort((a, b) => b.commentsCount - a.commentsCount)
      .slice(0, 20);
  }

  return NextResponse.json({
    commentsTimeseries,
    thumbsUpRate,
    scoreFeedbackCount: scoreFeedbackCount ?? 0,
    teamSizes,
    activeCoaches,
  });
}
