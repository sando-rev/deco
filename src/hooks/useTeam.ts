import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Team, TeamMember, Profile } from '../types/database';
import { useAuth } from './useAuth';

// Coach: get my team
export function useCoachTeam() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['coach-team', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('coach_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return (data as Team) ?? null;
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

      // Get active goal counts
      const { data: goals } = await supabase
        .from('goals')
        .select('athlete_id')
        .in('athlete_id', athleteIds)
        .eq('status', 'active');

      const goalCountMap = new Map<string, number>();
      for (const g of goals ?? []) {
        const aid = (g as any).athlete_id;
        goalCountMap.set(aid, (goalCountMap.get(aid) ?? 0) + 1);
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
      }));
    },
    enabled: !!teamId,
  });
}

// Coach: create team
export function useCreateTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({ name, coach_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-team', user?.id] });
    },
  });
}

// Athlete: join team by invite code
export function useJoinTeam() {
  const { user } = useAuth();
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

      // Join team
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

      return team as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
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
