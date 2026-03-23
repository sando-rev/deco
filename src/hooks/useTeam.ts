import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { Team, TeamCoach, TeamMember, Profile, CoachScoreFeedback } from '../types/database';
import { useAuth } from './useAuth';

// Coach: get all my teams
export function useCoachTeams() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['coach-teams', user?.id],
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from('team_coaches')
        .select('team_id')
        .eq('coach_id', user!.id);

      if (error) throw error;
      if (!memberships || memberships.length === 0) return [];

      const teamIds = (memberships as TeamCoach[]).map((m) => m.team_id);

      const { data: teams, error: tError } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds);

      if (tError) throw tError;
      return (teams as Team[]) ?? [];
    },
    enabled: !!user?.id,
  });
}

// Coach: get team members with profiles
export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      // Get team members
      const { data: members, error: mError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId!);

      if (mError) throw mError;
      if (!members || members.length === 0) return [];

      const athleteIds = (members as TeamMember[]).map((m) => m.athlete_id);

      // Get profiles for all athletes
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', athleteIds);

      if (pError) throw pError;

      // Get selected skill counts per athlete
      const { data: skillCounts } = await supabase
        .from('athlete_selected_skills')
        .select('athlete_id')
        .in('athlete_id', athleteIds);

      const skillCountMap = new Map<string, number>();
      for (const s of skillCounts ?? []) {
        const aid = (s as any).athlete_id;
        skillCountMap.set(aid, (skillCountMap.get(aid) ?? 0) + 1);
      }

      // Get active goals with skill info
      const { data: goals } = await supabase
        .from('goals')
        .select('athlete_id, skill_id')
        .in('athlete_id', athleteIds)
        .eq('status', 'active');

      const goalCountMap = new Map<string, number>();
      const goalSkillIdsMap = new Map<string, string[]>();
      for (const g of goals ?? []) {
        const aid = (g as any).athlete_id;
        goalCountMap.set(aid, (goalCountMap.get(aid) ?? 0) + 1);
        if ((g as any).skill_id) {
          const existing = goalSkillIdsMap.get(aid) ?? [];
          if (!existing.includes((g as any).skill_id)) {
            existing.push((g as any).skill_id);
          }
          goalSkillIdsMap.set(aid, existing);
        }
      }

      // Get skill labels for active goal skills
      const allSkillIds = [...new Set([...goalSkillIdsMap.values()].flat())];
      const skillLabelMap = new Map<string, string>();
      if (allSkillIds.length > 0) {
        const { data: skillDefs } = await supabase
          .from('skill_definitions')
          .select('id, label')
          .in('id', allSkillIds);
        for (const sd of skillDefs ?? []) {
          skillLabelMap.set((sd as any).id, (sd as any).label);
        }
      }

      // Get last reflection dates
      const { data: reflections } = await supabase
        .from('reflections')
        .select('athlete_id, created_at')
        .in('athlete_id', athleteIds)
        .order('created_at', { ascending: false });

      const lastReflectionMap = new Map<string, string>();
      for (const r of (reflections ?? []) as any[]) {
        if (!lastReflectionMap.has(r.athlete_id)) {
          lastReflectionMap.set(r.athlete_id, r.created_at);
        }
      }

      const profilesMap = new Map(
        (profiles as Profile[]).map((p) => [p.id, p])
      );

      return (members as TeamMember[]).map((m) => ({
        ...m,
        profile: profilesMap.get(m.athlete_id)!,
        selected_skills_count: skillCountMap.get(m.athlete_id) ?? 0,
        active_goals_count: goalCountMap.get(m.athlete_id) ?? 0,
        last_reflection_date: lastReflectionMap.get(m.athlete_id) ?? null,
        active_goal_skills: (goalSkillIdsMap.get(m.athlete_id) ?? [])
          .map((sid) => skillLabelMap.get(sid))
          .filter(Boolean)
          .slice(0, 3) as string[],
      }));
    },
    enabled: !!teamId,
  });
}

// Coach: create team (atomic with coach membership)
export function useCreateTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .rpc('create_team_with_coach', { team_name: name });

      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-teams', user?.id] });
    },
  });
}

// Join team by invite code (works for both coaches and athletes)
export function useJoinTeam() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      // Find team by invite code
      const { data: team, error: tError } = await supabase
        .from('teams')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (tError || !team) throw new Error('Invalid invite code');

      if (profile?.role === 'coach') {
        // Coach joins team_coaches
        const { error: jError } = await supabase
          .from('team_coaches')
          .insert({
            team_id: (team as Team).id,
            coach_id: user!.id,
          });

        if (jError) {
          if (jError.code === '23505') throw new Error('You are already on this team');
          throw jError;
        }
      } else {
        // Athlete joins team_members
        const { error: jError } = await supabase
          .from('team_members')
          .insert({
            team_id: (team as Team).id,
            athlete_id: user!.id,
          });

        if (jError) {
          if (jError.code === '23505') throw new Error('You are already on this team');
          throw jError;
        }
      }

      return team as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-teams', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-teams', user?.id] });
    },
  });
}

// Athlete: get teams I'm on
export function useMyTeams() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-teams', user?.id],
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('athlete_id', user!.id);

      if (error) throw error;
      if (!memberships || memberships.length === 0) return [];

      const teamIds = (memberships as TeamMember[]).map((m) => m.team_id);

      const { data: teams, error: tError } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds);

      if (tError) throw tError;
      return (teams as Team[]) ?? [];
    },
    enabled: !!user?.id,
  });
}

// Coach: delete a team
export function useDeleteTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-teams', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-teams', user?.id] });
    },
  });
}

// Coach: leave a team (remove self from team_coaches)
export function useLeaveTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('team_coaches')
        .delete()
        .eq('team_id', teamId)
        .eq('coach_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-teams', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-teams', user?.id] });
    },
  });
}

// Coach: remove thumbs-up from goal
export function useRemoveCoachThumbsUp() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId }: { goalId: string }) => {
      const { error } = await supabase
        .from('coach_comments')
        .delete()
        .eq('coach_id', user!.id)
        .eq('goal_id', goalId)
        .eq('is_thumbs_up', true)
        .is('content', null);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goal', variables.goalId] });
    },
  });
}

// Coach: save score feedback for an athlete
export function useSaveScoreFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      athleteId,
      feedbackText,
    }: {
      athleteId: string;
      feedbackText: string;
    }) => {
      const { error } = await supabase.from('coach_score_feedback').insert({
        coach_id: user!.id,
        athlete_id: athleteId,
        feedback_text: feedbackText,
      });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['score-feedback', variables.athleteId] });
    },
  });
}

// Coach: update score feedback
export function useUpdateScoreFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feedbackId,
      athleteId,
      feedbackText,
    }: {
      feedbackId: string;
      athleteId: string;
      feedbackText: string;
    }) => {
      const { error } = await supabase
        .from('coach_score_feedback')
        .update({ feedback_text: feedbackText })
        .eq('id', feedbackId)
        .eq('coach_id', user!.id);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['score-feedback', variables.athleteId] });
    },
  });
}

// Coach: delete score feedback
export function useDeleteScoreFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feedbackId,
      athleteId,
    }: {
      feedbackId: string;
      athleteId: string;
    }) => {
      const { error } = await supabase
        .from('coach_score_feedback')
        .delete()
        .eq('id', feedbackId)
        .eq('coach_id', user!.id);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['score-feedback', variables.athleteId] });
    },
  });
}

// Read score feedback for an athlete (works for both coach and athlete)
export function useScoreFeedback(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['score-feedback', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_score_feedback')
        .select('*')
        .eq('athlete_id', athleteId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as CoachScoreFeedback[];
    },
    enabled: !!athleteId,
  });
}

// Athlete: track unseen score feedback
export function useUnseenScoreFeedback() {
  const { user } = useAuth();
  const { data: scoreFeedback } = useScoreFeedback(user?.id);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.getItem(`deco_last_score_feedback_${user.id}`).then(setLastSeenId);
  }, [user?.id]);

  const hasUnseen = scoreFeedback && scoreFeedback.length > 0 && scoreFeedback[0].id !== lastSeenId;

  const markSeen = async () => {
    if (scoreFeedback && scoreFeedback.length > 0 && user?.id) {
      await AsyncStorage.setItem(`deco_last_score_feedback_${user.id}`, scoreFeedback[0].id);
      setLastSeenId(scoreFeedback[0].id);
    }
  };

  return { hasUnseen: !!hasUnseen, markSeen };
}

// ─── Coach Reports ──────────────────────────────────

export interface CoachReport {
  id: string;
  coach_id: string;
  team_id: string;
  week_start: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useCoachReports(teamId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['coach-reports', teamId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_reports')
        .select('*')
        .eq('coach_id', user!.id)
        .eq('team_id', teamId!)
        .order('week_start', { ascending: false });

      if (error) throw error;
      return (data ?? []) as CoachReport[];
    },
    enabled: !!teamId && !!user?.id,
  });
}

export function useSaveCoachReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      weekStart,
      notes,
    }: {
      teamId: string;
      weekStart: string;
      notes: string;
    }) => {
      const { error } = await supabase
        .from('coach_reports')
        .upsert(
          {
            coach_id: user!.id,
            team_id: teamId,
            week_start: weekStart,
            notes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'coach_id,team_id,week_start' }
        );

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coach-reports', variables.teamId, user?.id] });
    },
  });
}

export function useDeleteCoachReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, teamId }: { reportId: string; teamId: string }) => {
      const { error } = await supabase
        .from('coach_reports')
        .delete()
        .eq('id', reportId)
        .eq('coach_id', user!.id);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coach-reports', variables.teamId, user?.id] });
    },
  });
}

// Coach: add comment to goal
export function useAddCoachComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      content,
      isThumbsUp,
    }: {
      goalId: string;
      content?: string;
      isThumbsUp?: boolean;
    }) => {
      const { error } = await supabase.from('coach_comments').insert({
        coach_id: user!.id,
        goal_id: goalId,
        content: content ?? null,
        is_thumbs_up: isThumbsUp ?? false,
      });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goal', variables.goalId] });
    },
  });
}
