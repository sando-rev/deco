import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { TrainingSchedule, ScheduledSession, ScheduleSessionType, MatchDate, SessionGoal, Goal } from '../types/database';
import { useAuth } from './useAuth';
import { addDays, format, startOfWeek } from 'date-fns';

export function useTrainingSchedule() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['training-schedule', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_schedules')
        .select('*')
        .eq('athlete_id', user!.id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return (data as TrainingSchedule[]) ?? [];
    },
    enabled: !!user?.id,
  });
}

interface SaveScheduleInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_type: ScheduleSessionType;
  label?: string;
}

export function useSaveTrainingSchedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedules: SaveScheduleInput[]) => {
      // Delete existing schedule
      await supabase
        .from('training_schedules')
        .delete()
        .eq('athlete_id', user!.id);

      if (schedules.length === 0) return;

      // Insert new schedule
      const { error } = await supabase
        .from('training_schedules')
        .insert(
          schedules.map((s) => ({
            athlete_id: user!.id,
            ...s,
          }))
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-schedule', user?.id] });
    },
  });
}

export function useUpcomingSessions(days: number = 14) {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), days), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['upcoming-sessions', user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*')
        .eq('athlete_id', user!.id)
        .gte('date', today)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return (data as ScheduledSession[]) ?? [];
    },
    enabled: !!user?.id,
  });
}

export function useGenerateUpcomingSessions() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedules: TrainingSchedule[]) => {
      const sessions: Omit<ScheduledSession, 'id' | 'created_at'>[] = [];
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const weeksAhead = 4;

      for (let week = 0; week < weeksAhead; week++) {
        const weekStart = startOfWeek(addDays(today, week * 7), { weekStartsOn: 0 });

        for (const schedule of schedules) {
          const sessionDate = addDays(weekStart, schedule.day_of_week);

          // Skip dates in the past
          if (sessionDate < today) continue;

          sessions.push({
            athlete_id: user!.id,
            schedule_id: schedule.id,
            session_type: schedule.session_type as ScheduleSessionType,
            label: schedule.label,
            date: format(sessionDate, 'yyyy-MM-dd'),
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            reflection_id: null,
            notification_sent_pre: false,
            notification_sent_post: false,
          });
        }

        // Also generate match sessions from default_match_day
        const matchDay = profile?.default_match_day;
        if (matchDay !== null && matchDay !== undefined) {
          const matchDate = addDays(weekStart, matchDay);
          if (matchDate >= today) {
            sessions.push({
              athlete_id: user!.id,
              schedule_id: null as any,
              session_type: 'match' as ScheduleSessionType,
              label: 'Wedstrijd',
              date: format(matchDate, 'yyyy-MM-dd'),
              start_time: '09:00',
              end_time: '12:00',
              reflection_id: null,
              notification_sent_pre: false,
              notification_sent_post: false,
            });
          }
        }
      }

      // Delete future auto-generated sessions (without reflections) before re-inserting
      // Keep manually added matches that have different times
      await supabase
        .from('scheduled_sessions')
        .delete()
        .eq('athlete_id', user!.id)
        .gte('date', todayStr)
        .is('reflection_id', null)
        .neq('session_type', 'match');

      if (sessions.length > 0) {
        const { error } = await supabase
          .from('scheduled_sessions')
          .upsert(sessions, { onConflict: 'athlete_id,date,start_time,end_time,session_type', ignoreDuplicates: true });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions', user?.id] });
    },
  });
}

/**
 * Auto-regenerates sessions when they're about to run out.
 * Runs once on mount — checks if the furthest session is < 7 days away,
 * and if so, regenerates 4 weeks of sessions.
 */
export function useAutoRegenerateSessions() {
  const { user, profile } = useAuth();
  const generateSessions = useGenerateUpcomingSessions();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!user || !profile || profile.role !== 'athlete' || hasChecked.current) return;
    hasChecked.current = true;

    (async () => {
      try {
        // 1. Fetch training schedules
        const { data: schedules } = await supabase
          .from('training_schedules')
          .select('*')
          .eq('athlete_id', user.id);

        const hasSchedule = schedules && schedules.length > 0;
        const hasMatchDay = profile.default_match_day !== null && profile.default_match_day !== undefined;

        // Nothing to generate if no schedule and no match day
        if (!hasSchedule && !hasMatchDay) return;

        // 2. Check furthest future session
        const { data: lastSession } = await supabase
          .from('scheduled_sessions')
          .select('date')
          .eq('athlete_id', user.id)
          .gte('date', format(new Date(), 'yyyy-MM-dd'))
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const today = new Date();
        const sevenDaysFromNow = addDays(today, 7);
        const lastDate = lastSession?.date ? new Date(lastSession.date) : null;

        // 3. Regenerate if no future sessions or last session is within 7 days
        if (!lastDate || lastDate < sevenDaysFromNow) {
          console.log('[AutoRegen] Regenerating sessions — last session:', lastSession?.date ?? 'none');
          await generateSessions.mutateAsync((schedules ?? []) as TrainingSchedule[]);
        }
      } catch (err) {
        console.error('[AutoRegen] Error:', err);
      }
    })();
  }, [user, profile]);
}

export function useAddMatch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      date: string;
      start_time: string;
      end_time: string;
      label?: string;
    }) => {
      const { error } = await supabase
        .from('scheduled_sessions')
        .insert({
          athlete_id: user!.id,
          session_type: 'match',
          label: input.label ?? 'Wedstrijd',
          date: input.date,
          start_time: input.start_time,
          end_time: input.end_time,
          notification_sent_pre: false,
          notification_sent_post: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions', user?.id] });
    },
  });
}

export function useMatchDates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['match-dates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_dates')
        .select('*')
        .eq('athlete_id', user!.id)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;
      return (data as MatchDate[]) ?? [];
    },
    enabled: !!user?.id,
  });
}

export function useSaveMatchDate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { date: string; start_time?: string; label?: string }) => {
      const { error } = await supabase
        .from('match_dates')
        .insert({
          athlete_id: user!.id,
          date: input.date,
          start_time: input.start_time ?? null,
          label: input.label ?? null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-dates', user?.id] });
    },
  });
}

export function useDeleteMatchDate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchDateId: string) => {
      const { error } = await supabase
        .from('match_dates')
        .delete()
        .eq('id', matchDateId)
        .eq('athlete_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-dates', user?.id] });
    },
  });
}

export function useScheduledSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['scheduled-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*')
        .eq('id', sessionId!)
        .single();

      if (error) throw error;
      return data as ScheduledSession;
    },
    enabled: !!sessionId,
  });
}

// --- Session Goals (pre-training goal selection) ---

export interface SessionGoalWithGoal extends SessionGoal {
  goal: Pick<Goal, 'id' | 'title' | 'description' | 'skill_id'>;
}

export function useSessionGoals(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-goals', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_goals')
        .select('*, goal:goals(id, title, description, skill_id)')
        .eq('session_id', sessionId!);

      if (error) throw error;
      return (data as unknown as SessionGoalWithGoal[]) ?? [];
    },
    enabled: !!sessionId,
  });
}

export function useSaveSessionGoals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, goalIds }: { sessionId: string; goalIds: string[] }) => {
      // Delete existing session goals
      const { error: deleteError } = await supabase
        .from('session_goals')
        .delete()
        .eq('session_id', sessionId);

      if (deleteError) throw deleteError;

      if (goalIds.length === 0) return;

      // Insert new session goals
      const { error: insertError } = await supabase
        .from('session_goals')
        .insert(
          goalIds.map((goalId) => ({
            session_id: sessionId,
            goal_id: goalId,
          }))
        );

      if (insertError) throw insertError;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-goals', variables.sessionId] });
    },
  });
}

export function useSaveTrainingGoalText() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId, text }: { sessionId: string; text: string | null }) => {
      const { error } = await supabase
        .from('scheduled_sessions')
        .update({ training_goal_text: text })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions', user?.id] });
    },
  });
}
