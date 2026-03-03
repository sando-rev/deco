import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { SkillDefinition, SkillCategory, AthleteSkillScore, AthleteSkillWithDefinition } from '../types/database';
import { useAuth } from './useAuth';

export function useSkillDefinitions() {
  return useQuery({
    queryKey: ['skill-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_definitions')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data as SkillDefinition[]) ?? [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour - rarely changes
  });
}

export function useSkillsByCategory(category: SkillCategory) {
  const { data: allSkills } = useSkillDefinitions();
  return (allSkills ?? []).filter((s) => s.category === category);
}

export function useSelectedSkills(athleteId?: string) {
  const { user } = useAuth();
  const id = athleteId ?? user?.id;

  return useQuery({
    queryKey: ['selected-skills', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_selected_skills')
        .select('*, skill:skill_definitions(*)')
        .eq('athlete_id', id!);

      if (error) throw error;
      return (data ?? []).map((row: any) => row.skill as SkillDefinition);
    },
    enabled: !!id,
  });
}

export function useLatestSkillScores(athleteId?: string) {
  const { user } = useAuth();
  const id = athleteId ?? user?.id;

  return useQuery({
    queryKey: ['skill-scores', id],
    queryFn: async () => {
      // Get the latest score for each skill
      const { data, error } = await supabase
        .from('athlete_skill_scores')
        .select('*, skill:skill_definitions(*)')
        .eq('athlete_id', id!)
        .order('assessed_at', { ascending: false });

      if (error) throw error;

      // Deduplicate: keep only the latest score per skill
      const latestBySkill = new Map<string, AthleteSkillWithDefinition>();
      for (const row of (data ?? []) as any[]) {
        if (!latestBySkill.has(row.skill_id)) {
          latestBySkill.set(row.skill_id, {
            skill_id: row.skill_id,
            score: row.score,
            assessed_at: row.assessed_at,
            skill: row.skill as SkillDefinition,
          });
        }
      }

      return Array.from(latestBySkill.values());
    },
    enabled: !!id,
  });
}

export function useSkillScoreHistory(athleteId?: string) {
  const { user } = useAuth();
  const id = athleteId ?? user?.id;

  return useQuery({
    queryKey: ['skill-score-history', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_skill_scores')
        .select('*, skill:skill_definitions(*)')
        .eq('athlete_id', id!)
        .order('assessed_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as (AthleteSkillScore & { skill: SkillDefinition })[];
    },
    enabled: !!id,
  });
}

export function useSaveSelectedSkills() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skillIds: string[]) => {
      // Delete existing selections first
      await supabase
        .from('athlete_selected_skills')
        .delete()
        .eq('athlete_id', user!.id);

      // Insert new selections
      const { error } = await supabase
        .from('athlete_selected_skills')
        .insert(
          skillIds.map((skill_id) => ({
            athlete_id: user!.id,
            skill_id,
          }))
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selected-skills', user?.id] });
    },
  });
}

export function useSaveSkillScores() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scores: { skill_id: string; score: number }[]) => {
      const { error } = await supabase
        .from('athlete_skill_scores')
        .insert(
          scores.map((s) => ({
            athlete_id: user!.id,
            skill_id: s.skill_id,
            score: s.score,
          }))
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-scores', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['skill-score-history', user?.id] });
    },
  });
}
