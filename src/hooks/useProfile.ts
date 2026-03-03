import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { AthleteAttributes, AttributeKey } from '../types/database';
import { useAuth } from './useAuth';

export function useLatestAttributes(athleteId?: string) {
  const { user } = useAuth();
  const id = athleteId ?? user?.id;

  return useQuery({
    queryKey: ['attributes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_attributes')
        .select('*')
        .eq('athlete_id', id!)
        .order('assessed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return (data as AthleteAttributes) ?? null;
    },
    enabled: !!id,
  });
}

export function useAttributeHistory(athleteId?: string) {
  const { user } = useAuth();
  const id = athleteId ?? user?.id;

  return useQuery({
    queryKey: ['attribute-history', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_attributes')
        .select('*')
        .eq('athlete_id', id!)
        .order('assessed_at', { ascending: true });

      if (error) throw error;
      return (data as AthleteAttributes[]) ?? [];
    },
    enabled: !!id,
  });
}

export function useSaveAttributes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scores: Record<AttributeKey, number>) => {
      const { data, error } = await supabase
        .from('athlete_attributes')
        .insert({
          athlete_id: user!.id,
          ...scores,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AthleteAttributes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['attribute-history', user?.id] });
    },
  });
}

export function useUpdateOnboardingComplete() {
  const { user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
    },
  });
}
