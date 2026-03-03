import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { TrainingSchedule, ScheduledSession, ScheduleSessionType } from '../types/database';
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedules: TrainingSchedule[]) => {
      const sessions: Omit<ScheduledSession, 'id' | 'created_at'>[] = [];
      const today = new Date();
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
      }

      if (sessions.length > 0) {
        const { error } = await supabase
          .from('scheduled_sessions')
          .insert(sessions);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions', user?.id] });
    },
  });
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
          label: input.label ?? 'Match',
          date: input.date,
          start_time: input.start_time,
          end_time: input.end_time,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions', user?.id] });
    },
  });
}
