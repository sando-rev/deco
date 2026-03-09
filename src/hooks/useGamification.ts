import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

// ─── XP Point Values ─────────────────────────────────
export const XP_VALUES = {
  goal_created: 25,
  goal_achieved: 100,
  reflection: 20,
  radar_profile: 50,
  streak_bonus: 5, // per streak day
  // Quality bonuses are dynamic
};

export interface XpEvent {
  id: string;
  athlete_id: string;
  event_type: string;
  points: number;
  reference_id: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  category: string;
  icon: string;
  threshold: number;
  xp_reward: number;
  display_order: number;
}

export interface AthleteAchievement {
  id: string;
  athlete_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface LeaderboardEntry {
  athlete_id: string;
  full_name: string;
  total_xp: number;
  goals_achieved: number;
  streak: number;
}

// ─── Get total XP ────────────────────────────────────
export function useAthleteXp(athleteId?: string) {
  const { user } = useAuth();
  const id = athleteId ?? user?.id;

  return useQuery({
    queryKey: ['athlete-xp', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_athlete_xp', { p_athlete_id: id });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!id,
  });
}

// ─── Get XP events ───────────────────────────────────
export function useXpEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['xp-events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('xp_events')
        .select('*')
        .eq('athlete_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as XpEvent[]) ?? [];
    },
    enabled: !!user?.id,
  });
}

// ─── Award XP ────────────────────────────────────────
export function useAwardXp() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventType,
      points,
      referenceId,
    }: {
      eventType: string;
      points: number;
      referenceId?: string;
    }) => {
      const { error } = await supabase.from('xp_events').insert({
        athlete_id: user!.id,
        event_type: eventType,
        points,
        reference_id: referenceId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-xp', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['xp-events', user?.id] });
    },
  });
}

// ─── Achievements ────────────────────────────────────
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data as Achievement[]) ?? [];
    },
  });
}

export function useMyAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-achievements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_achievements')
        .select('*, achievements(*)')
        .eq('athlete_id', user!.id)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        ...d,
        achievement: d.achievements as Achievement,
      })) as AthleteAchievement[];
    },
    enabled: !!user?.id,
  });
}

export function useEarnAchievement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      // Use upsert to avoid duplicate errors
      const { error } = await supabase
        .from('athlete_achievements')
        .upsert({
          athlete_id: user!.id,
          achievement_id: achievementId,
        }, { onConflict: 'athlete_id,achievement_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-achievements', user?.id] });
    },
  });
}

// ─── Check & award achievements ──────────────────────
export function useCheckAchievements() {
  const { user } = useAuth();
  const { data: allAchievements } = useAchievements();
  const { data: myAchievements } = useMyAchievements();
  const earnAchievement = useEarnAchievement();
  const awardXp = useAwardXp();

  const checkAndAward = async (stats: {
    goalsCreated: number;
    goalsAchieved: number;
    reflections: number;
    growthPoints: number;
    bestGoalQuality: number;
    reflectionsWithNotes: number;
    currentStreak: number;
  }) => {
    if (!allAchievements || !myAchievements) return [];

    const earnedKeys = new Set(
      myAchievements.map((a) => a.achievement?.key).filter(Boolean)
    );

    const newlyEarned: Achievement[] = [];

    const checkMap: Record<string, number> = {
      first_goal: stats.goalsCreated,
      five_goals: stats.goalsCreated,
      ten_goals: stats.goalsCreated,
      first_achieved: stats.goalsAchieved,
      five_achieved: stats.goalsAchieved,
      ten_achieved: stats.goalsAchieved,
      first_reflection: stats.reflections,
      ten_reflections: stats.reflections,
      fifty_reflections: stats.reflections,
      first_growth: stats.growthPoints,
      five_growth: stats.growthPoints,
      sharp_goal: stats.bestGoalQuality,
      perfect_goal: stats.bestGoalQuality,
      journaler: stats.reflectionsWithNotes,
      streak_3: stats.currentStreak,
      streak_7: stats.currentStreak,
      streak_14: stats.currentStreak,
      streak_30: stats.currentStreak,
    };

    for (const achievement of allAchievements) {
      if (earnedKeys.has(achievement.key)) continue;

      const currentValue = checkMap[achievement.key];
      if (currentValue !== undefined && currentValue >= achievement.threshold) {
        try {
          await earnAchievement.mutateAsync(achievement.id);
          if (achievement.xp_reward > 0) {
            await awardXp.mutateAsync({
              eventType: 'achievement',
              points: achievement.xp_reward,
              referenceId: achievement.id,
            });
          }
          newlyEarned.push(achievement);
        } catch {
          // ignore duplicates
        }
      }
    }

    return newlyEarned;
  };

  return { checkAndAward };
}

// ─── Team leaderboard ────────────────────────────────
export function useTeamLeaderboard(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team-leaderboard', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_team_leaderboard', { p_team_id: teamId });
      if (error) throw error;
      return (data as LeaderboardEntry[]) ?? [];
    },
    enabled: !!teamId,
  });
}

// ─── Streak calculation (per scheduled session) ──────
export function useSessionStreak(athleteId?: string) {
  const { user } = useAuth();
  const id = athleteId ?? user?.id;

  return useQuery({
    queryKey: ['session-streak', id],
    queryFn: async () => {
      // Get all scheduled sessions up to today, ordered by date desc
      const today = new Date().toISOString().split('T')[0];
      const { data: sessions, error } = await supabase
        .from('scheduled_sessions')
        .select('id, date, reflection_id')
        .eq('athlete_id', id!)
        .lte('date', today)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!sessions || sessions.length === 0) return 0;

      // Count consecutive sessions (from most recent) that have a reflection
      let streak = 0;
      for (const session of sessions) {
        if (session.reflection_id) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    },
    enabled: !!id,
  });
}

// ─── Unseen coach feedback count ─────────────────────
export function useUnseenFeedbackCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unseen-feedback', user?.id],
    queryFn: async () => {
      const { data: goals } = await supabase
        .from('goals')
        .select('id')
        .eq('athlete_id', user!.id);

      if (!goals || goals.length === 0) return 0;

      const goalIds = goals.map((g: any) => g.id);
      const { count, error } = await supabase
        .from('coach_comments')
        .select('*', { count: 'exact', head: true })
        .in('goal_id', goalIds)
        .eq('seen_by_athlete', false);

      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });
}

export function useMarkFeedbackSeen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('coach_comments')
        .update({ seen_by_athlete: true })
        .eq('goal_id', goalId)
        .eq('seen_by_athlete', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unseen-feedback', user?.id] });
    },
  });
}

// ─── Calculate quality bonus XP ──────────────────────
export function calculateGoalQualityBonus(aiAnalysis: {
  specificity_score: number;
  measurability_score: number;
  challenge_score: number;
} | null): number {
  if (!aiAnalysis) return 0;
  const avg =
    (aiAnalysis.specificity_score +
      aiAnalysis.measurability_score +
      aiAnalysis.challenge_score) /
    3;
  // 0-30 XP based on quality: (avg / 10) * 30
  return Math.round((avg / 10) * 30);
}

export function calculateReflectionQualityBonus(
  notes: string | null,
  goalRatingsCount: number
): number {
  let bonus = 0;
  if (notes && notes.length > 20) bonus += 5;
  if (notes && notes.length > 100) bonus += 5;
  if (goalRatingsCount > 0) bonus += 5;
  if (goalRatingsCount >= 3) bonus += 5;
  return bonus;
}
