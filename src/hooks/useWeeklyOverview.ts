import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PlayerWeekStats {
  athleteId: string;
  name: string;
  trainingCount: number;
  reflectionCount: number;
  avgScore: number | null;
  hasUnresolvedOutlier: boolean;
}

export type WeeklyActionType = 'good' | 'respond' | 'attention';

export interface CoachWeeklyAction {
  id: string;
  coach_id: string;
  team_id: string;
  athlete_id: string;
  week_start: string;
  action_type: WeeklyActionType;
  message: string | null;
  notification_sent: boolean;
  created_at: string;
}

// ─── Player stats for a week ────────────────────────────────────────────────

export function useWeeklyPlayerStats(teamId: string | undefined, weekStart: string) {
  return useQuery({
    queryKey: ['weekly-player-stats', teamId, weekStart],
    queryFn: async (): Promise<PlayerWeekStats[]> => {
      // Get team members
      const { data: members, error: mErr } = await supabase
        .from('team_members')
        .select('athlete_id')
        .eq('team_id', teamId!);

      if (mErr) throw mErr;
      if (!members || members.length === 0) return [];

      const athleteIds = members.map((m: any) => m.athlete_id);

      // Get profiles for names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', athleteIds);

      const nameMap = new Map<string, string>();
      for (const p of (profiles ?? []) as any[]) {
        nameMap.set(p.id, p.full_name ?? 'Onbekend');
      }

      // Compute week end (weekStart is Monday, end is Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      // Get scheduled sessions for the week
      const { data: sessions } = await supabase
        .from('scheduled_sessions')
        .select('athlete_id')
        .in('athlete_id', athleteIds)
        .gte('date', weekStart)
        .lte('date', weekEndStr);

      const trainingCountMap = new Map<string, number>();
      for (const s of (sessions ?? []) as any[]) {
        trainingCountMap.set(s.athlete_id, (trainingCountMap.get(s.athlete_id) ?? 0) + 1);
      }

      // Get reflections for the week
      const weekStartDate = new Date(weekStart);
      weekStartDate.setHours(0, 0, 0, 0);
      const weekEndDate = new Date(weekEndStr);
      weekEndDate.setHours(23, 59, 59, 999);

      const { data: reflections } = await supabase
        .from('reflections')
        .select('id, athlete_id')
        .in('athlete_id', athleteIds)
        .gte('created_at', weekStartDate.toISOString())
        .lte('created_at', weekEndDate.toISOString());

      const reflectionCountMap = new Map<string, number>();
      const reflectionIds: string[] = [];
      for (const r of (reflections ?? []) as any[]) {
        reflectionCountMap.set(r.athlete_id, (reflectionCountMap.get(r.athlete_id) ?? 0) + 1);
        reflectionIds.push(r.id);
      }

      // Get average scores from reflection_goals
      const avgScoreMap = new Map<string, number>();
      if (reflectionIds.length > 0) {
        const { data: rGoals } = await supabase
          .from('reflection_goals')
          .select('reflection_id, rating')
          .in('reflection_id', reflectionIds);

        // Map reflection_id -> athlete_id
        const refToAthlete = new Map<string, string>();
        for (const r of (reflections ?? []) as any[]) {
          refToAthlete.set(r.id, r.athlete_id);
        }

        // Aggregate ratings per athlete
        const ratingsByAthlete = new Map<string, number[]>();
        for (const rg of (rGoals ?? []) as any[]) {
          const aid = refToAthlete.get(rg.reflection_id);
          if (!aid) continue;
          const existing = ratingsByAthlete.get(aid) ?? [];
          existing.push(rg.rating);
          ratingsByAthlete.set(aid, existing);
        }

        for (const [aid, ratings] of ratingsByAthlete) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          avgScoreMap.set(aid, Math.round(avg * 10) / 10);
        }
      }

      // Check for unresolved outlier notifications
      const { data: unresolvedOutliers } = await supabase
        .from('outlier_notifications')
        .select('athlete_id')
        .in('athlete_id', athleteIds)
        .is('coach_action', null);

      const outlierSet = new Set<string>();
      for (const o of (unresolvedOutliers ?? []) as any[]) {
        outlierSet.add(o.athlete_id);
      }

      return athleteIds.map((aid: string) => ({
        athleteId: aid,
        name: nameMap.get(aid) ?? 'Onbekend',
        trainingCount: trainingCountMap.get(aid) ?? 0,
        reflectionCount: reflectionCountMap.get(aid) ?? 0,
        avgScore: avgScoreMap.get(aid) ?? null,
        hasUnresolvedOutlier: outlierSet.has(aid),
      }));
    },
    enabled: !!teamId,
  });
}

// ─── Weekly actions for a team/week ─────────────────────────────────────────

export function useWeeklyActions(teamId: string | undefined, weekStart: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-actions', teamId, weekStart, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_weekly_actions')
        .select('*')
        .eq('coach_id', user!.id)
        .eq('team_id', teamId!)
        .eq('week_start', weekStart);

      if (error) throw error;
      return (data ?? []) as CoachWeeklyAction[];
    },
    enabled: !!teamId && !!user?.id,
  });
}

// ─── Save/update a weekly action ────────────────────────────────────────────

export function useSaveWeeklyAction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      athleteId,
      weekStart,
      actionType,
      message,
    }: {
      teamId: string;
      athleteId: string;
      weekStart: string;
      actionType: WeeklyActionType;
      message?: string;
    }) => {
      const { error } = await supabase
        .from('coach_weekly_actions')
        .upsert(
          {
            coach_id: user!.id,
            team_id: teamId,
            athlete_id: athleteId,
            week_start: weekStart,
            action_type: actionType,
            message: message ?? null,
            notification_sent: false,
          },
          { onConflict: 'coach_id,team_id,athlete_id,week_start' }
        );

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['weekly-actions', variables.teamId, variables.weekStart, user?.id],
      });
    },
  });
}

// ─── Coach overview notification preferences ────────────────────────────────

export function useCoachOverviewPrefs() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const day = (profile as any)?.coach_overview_day ?? 5;
  const time = (profile as any)?.coach_overview_time ?? '18:00';

  const updatePrefs = useMutation({
    mutationFn: async ({ day, time }: { day: number; time: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ coach_overview_day: day, coach_overview_time: time })
        .eq('id', profile!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return { day, time, updatePrefs };
}
