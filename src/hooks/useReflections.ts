import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Reflection, ReflectionGoal, SessionType, Goal } from '../types/database';
import { useAuth } from './useAuth';
import { XP_VALUES, calculateReflectionQualityBonus } from './useGamification';

export function useReflections(athleteId?: string) {
  const { user } = useAuth();
  const id = athleteId ?? user?.id;

  return useQuery({
    queryKey: ['reflections', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('athlete_id', id!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Reflection[]) ?? [];
    },
    enabled: !!id,
  });
}

export function useReflectionWithGoals(reflectionId: string) {
  return useQuery({
    queryKey: ['reflection', reflectionId],
    queryFn: async () => {
      const { data: reflection, error: rError } = await supabase
        .from('reflections')
        .select('*')
        .eq('id', reflectionId)
        .single();

      if (rError) throw rError;

      const { data: goalRatings, error: gError } = await supabase
        .from('reflection_goals')
        .select('*')
        .eq('reflection_id', reflectionId);

      if (gError) throw gError;

      // Fetch goal details for each rating
      const goalIds = (goalRatings as ReflectionGoal[]).map((rg) => rg.goal_id);
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .in('id', goalIds);

      const goalsMap = new Map((goals as Goal[]).map((g) => [g.id, g]));

      return {
        ...(reflection as Reflection),
        reflection_goals: (goalRatings as ReflectionGoal[]).map((rg) => ({
          ...rg,
          goal: goalsMap.get(rg.goal_id)!,
        })),
      };
    },
    enabled: !!reflectionId,
  });
}

// Get goal progress over time (ratings from all reflections for a specific goal)
export function useGoalProgress(goalId: string) {
  return useQuery({
    queryKey: ['goal-progress', goalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflection_goals')
        .select('*, reflections!inner(created_at, session_type)')
        .eq('goal_id', goalId)
        .order('reflections(created_at)', { ascending: true } as any);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!goalId,
  });
}

interface CreateReflectionInput {
  session_type: SessionType;
  notes: string | null;
  goal_ratings: { goal_id: string; rating: number }[];
}

export function useCreateReflection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReflectionInput) => {
      // Create reflection
      const { data: reflection, error: rError } = await supabase
        .from('reflections')
        .insert({
          athlete_id: user!.id,
          session_type: input.session_type,
          notes: input.notes,
        })
        .select()
        .single();

      if (rError) throw rError;

      // Create goal ratings
      if (input.goal_ratings.length > 0) {
        const { error: gError } = await supabase
          .from('reflection_goals')
          .insert(
            input.goal_ratings.map((gr) => ({
              reflection_id: (reflection as Reflection).id,
              goal_id: gr.goal_id,
              rating: gr.rating,
            }))
          );

        if (gError) throw gError;
      }

      // Award XP for reflection
      try {
        const baseXp = XP_VALUES.reflection;
        const qualityBonus = calculateReflectionQualityBonus(
          input.notes,
          input.goal_ratings.length
        );
        await supabase.from('xp_events').insert({
          athlete_id: user!.id,
          event_type: 'reflection',
          points: baseXp + qualityBonus,
          reference_id: (reflection as Reflection).id,
        });
      } catch {
        // XP is non-critical
      }

      return reflection as Reflection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['goal-progress'] });
      queryClient.invalidateQueries({ queryKey: ['athlete-xp', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['xp-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['session-streak', user?.id] });
    },
  });
}
