import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Goal, GoalStatus, CoachComment, GoalAiAnalysis } from '../types/database';
import { getGoalFeedback } from '../services/ai';
import { useAuth } from './useAuth';

export function useGoals(athleteId?: string, status?: GoalStatus) {
  const { user } = useAuth();
  const id = athleteId ?? user?.id;

  return useQuery({
    queryKey: ['goals', id, status],
    queryFn: async () => {
      let query = supabase
        .from('goals')
        .select('*')
        .eq('athlete_id', id!)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Goal[]) ?? [];
    },
    enabled: !!id,
  });
}

export function useGoalWithComments(goalId: string) {
  return useQuery({
    queryKey: ['goal', goalId],
    queryFn: async () => {
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError) throw goalError;

      const { data: comments, error: commentsError } = await supabase
        .from('coach_comments')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      return {
        ...(goal as Goal),
        coach_comments: (comments as CoachComment[]) ?? [],
      };
    },
    enabled: !!goalId,
  });
}

interface CreateGoalInput {
  description: string;
  skill_id?: string;
  deadline?: string;
  athlete_skills?: string[]; // skill labels for AI context
  skill_label?: string; // selected skill label for AI context
}

export function useCreateGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      // Get AI feedback first
      let aiAnalysis: GoalAiAnalysis | null = null;
      try {
        aiAnalysis = await getGoalFeedback({
          description: input.description,
          athlete_skills: input.athlete_skills ?? [],
          skill_label: input.skill_label,
        });
      } catch {
        // Continue without AI feedback
      }

      // Extract title from description (first sentence or first 100 chars)
      const firstSentence = input.description.split(/[.!?]/)[0].trim();
      const title = firstSentence.length > 100
        ? firstSentence.substring(0, 97) + '...'
        : firstSentence;

      // Create goal
      const { data: goal, error } = await supabase
        .from('goals')
        .insert({
          athlete_id: user!.id,
          title,
          description: input.description,
          skill_id: input.skill_id ?? null,
          deadline: input.deadline ?? null,
          ai_feedback: aiAnalysis?.feedback ?? null,
          ai_analysis: aiAnalysis as any,
        })
        .select()
        .single();

      if (error) throw error;

      return { ...(goal as Goal), ai_analysis: aiAnalysis };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    },
  });
}

export function useGetGoalFeedback() {
  return useMutation({
    mutationFn: async (input: { description: string; athlete_skills: string[]; skill_label?: string }) => {
      return getGoalFeedback(input);
    },
  });
}

export function useUpdateGoalStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      status,
      scoreImprovement,
    }: {
      goalId: string;
      status: GoalStatus;
      scoreImprovement?: number;
    }) => {
      const { error } = await supabase
        .from('goals')
        .update({
          status,
          completed_at: status === 'achieved' ? new Date().toISOString() : null,
          score_improvement: scoreImprovement ?? null,
        })
        .eq('id', goalId);

      if (error) throw error;

      // If achieved with a score improvement, update the skill score
      if (status === 'achieved' && scoreImprovement && scoreImprovement > 0) {
        const { data: goal } = await supabase
          .from('goals')
          .select('skill_id')
          .eq('id', goalId)
          .single();

        if (goal?.skill_id) {
          // Get latest score for this skill
          const { data: latestScore } = await supabase
            .from('athlete_skill_scores')
            .select('score')
            .eq('athlete_id', user!.id)
            .eq('skill_id', goal.skill_id)
            .order('assessed_at', { ascending: false })
            .limit(1)
            .single();

          if (latestScore) {
            const newScore = Math.min(10, (latestScore.score as number) + scoreImprovement);

            await supabase
              .from('athlete_skill_scores')
              .insert({
                athlete_id: user!.id,
                skill_id: goal.skill_id,
                score: newScore,
              });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['skill-scores', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['skill-score-history', user?.id] });
    },
  });
}

export function useCoachFeedback(athleteId?: string) {
  const { user } = useAuth();
  const id = athleteId ?? user?.id;

  return useQuery({
    queryKey: ['coach-feedback', id],
    queryFn: async () => {
      // Get all goals for the athlete
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('id, title')
        .eq('athlete_id', id!);

      if (goalsError) throw goalsError;
      if (!goals || goals.length === 0) return [];

      const goalIds = goals.map((g: any) => g.id);

      // Get coach comments for those goals
      const { data: comments, error: commentsError } = await supabase
        .from('coach_comments')
        .select('*')
        .in('goal_id', goalIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (commentsError) throw commentsError;

      // Attach goal title to each comment
      const goalMap = new Map(goals.map((g: any) => [g.id, g.title]));
      return ((comments as CoachComment[]) ?? []).map((c) => ({
        ...c,
        goal_title: goalMap.get(c.goal_id) ?? '',
      }));
    },
    enabled: !!id,
  });
}
