import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

// ─── Types ──────────────────────────────────────────────────────────────────

export type FeedEventType =
  | 'reflection_streak_3'
  | 'personal_record_week'
  | 'streak_7_plus'
  | 'goal_achieved'
  | 'coach_overview_published'
  | 'weekly_summary'
  | 'coach_announcement';

export interface FeedEvent {
  id: string;
  team_id: string;
  athlete_id: string | null;
  event_type: FeedEventType;
  metadata: Record<string, any>;
  is_pinned: boolean;
  created_at: string;
  athlete_name?: string;
}

export interface FeedReaction {
  id: string;
  event_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export type FeedEmoji = 'like' | '💪' | '🔥' | '👏' | '🏑' | '⭐' | '🎯';

export const FEED_EMOJIS: FeedEmoji[] = ['like', '💪', '🔥', '👏', '🏑', '⭐', '🎯'];

// ─── Feed events ────────────────────────────────────────────────────────────

export function useFeedEvents(teamId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feed-events', teamId],
    queryFn: async () => {
      // Get feed events
      const { data: events, error } = await supabase
        .from('feed_events')
        .select('*')
        .eq('team_id', teamId!)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!events || events.length === 0) return [];

      // Get athlete names for events
      const athleteIds = [...new Set(
        (events as any[]).filter((e) => e.athlete_id).map((e) => e.athlete_id)
      )];

      const nameMap = new Map<string, string>();
      if (athleteIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, feed_visible')
          .in('id', athleteIds);

        for (const p of (profiles ?? []) as any[]) {
          nameMap.set(p.id, p.full_name ?? 'Speler');
        }

        // Filter out events from athletes who have feed_visible = false
        // (unless it's the current user's own events)
        const hiddenIds = new Set(
          ((profiles ?? []) as any[])
            .filter((p) => p.feed_visible === false && p.id !== user?.id)
            .map((p) => p.id)
        );

        return (events as any[])
          .filter((e) => !e.athlete_id || !hiddenIds.has(e.athlete_id))
          .map((e) => ({
            ...e,
            athlete_name: e.athlete_id ? nameMap.get(e.athlete_id)?.split(' ')[0] : null,
          })) as FeedEvent[];
      }

      return (events as any[]).map((e) => ({
        ...e,
        athlete_name: null,
      })) as FeedEvent[];
    },
    enabled: !!teamId,
  });
}

// ─── Reactions for an event ─────────────────────────────────────────────────

export function useFeedReactions(eventId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feed-reactions', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_reactions')
        .select('*')
        .eq('event_id', eventId!);

      if (error) throw error;

      const reactions = (data ?? []) as FeedReaction[];

      // Count by emoji
      const counts = new Map<string, number>();
      let userEmoji: string | null = null;
      for (const r of reactions) {
        counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
        if (r.user_id === user?.id) userEmoji = r.emoji;
      }

      return { reactions, counts, userEmoji, total: reactions.length };
    },
    enabled: !!eventId,
  });
}

// ─── Toggle reaction ────────────────────────────────────────────────────────

export function useToggleReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, emoji }: { eventId: string; emoji: FeedEmoji }) => {
      // Check if reaction exists
      const { data: existing } = await supabase
        .from('feed_reactions')
        .select('id, emoji')
        .eq('event_id', eventId)
        .eq('user_id', user!.id)
        .single();

      if (existing) {
        if ((existing as any).emoji === emoji) {
          // Same emoji → remove reaction
          await supabase.from('feed_reactions').delete().eq('id', (existing as any).id);
        } else {
          // Different emoji → update the emoji only; keep notification_sent
          // untouched so the owner isn't re-notified for every emoji change
          await supabase
            .from('feed_reactions')
            .update({ emoji })
            .eq('id', (existing as any).id);
        }
      } else {
        // No reaction yet → insert
        const { error } = await supabase.from('feed_reactions').insert({
          event_id: eventId,
          user_id: user!.id,
          emoji,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed-reactions', variables.eventId] });
    },
  });
}

// ─── Coach announcement ─────────────────────────────────────────────────────

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, message }: { teamId: string; message: string }) => {
      // Unpin previous announcements
      await supabase
        .from('feed_events')
        .update({ is_pinned: false })
        .eq('team_id', teamId)
        .eq('event_type', 'coach_announcement')
        .eq('is_pinned', true);

      // Insert new announcement
      const { error } = await supabase.from('feed_events').insert({
        team_id: teamId,
        event_type: 'coach_announcement',
        metadata: { message },
        is_pinned: true,
      });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed-events', variables.teamId] });
    },
  });
}

// ─── Pin/unpin events (coach) ───────────────────────────────────────────────

export function usePinEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, teamId, pin }: { eventId: string; teamId: string; pin: boolean }) => {
      const { error } = await supabase
        .from('feed_events')
        .update({ is_pinned: pin })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed-events', variables.teamId] });
    },
  });
}

// ─── Goal achieved feed event ───────────────────────────────────────────────
// Inserts a 'goal_achieved' event into each of the athlete's team feeds.
// Deduped per goal via metadata.goalId. Non-critical side effect: callers
// should fire-and-forget and catch errors.

export function useInsertGoalAchievedEvent() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, goalTitle }: { goalId: string; goalTitle: string }) => {
      // Respect the athlete's feed visibility preference (defaults to true
      // when the column is null/undefined — only skip on explicit false)
      if ((profile as any)?.feed_visible === false) return [];

      // Resolve the athlete's team memberships
      const { data: memberships, error: mError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('athlete_id', user!.id);

      if (mError) throw mError;

      const teamIds = ((memberships ?? []) as any[]).map((m) => m.team_id);
      if (teamIds.length === 0) return []; // No team → skip silently

      // Dedup: skip teams that already have an event for this goal
      const { data: existing, error: eError } = await supabase
        .from('feed_events')
        .select('team_id')
        .eq('athlete_id', user!.id)
        .eq('event_type', 'goal_achieved')
        .eq('metadata->>goalId', goalId);

      if (eError) throw eError;

      const existingTeamIds = new Set(((existing ?? []) as any[]).map((e) => e.team_id));
      const newTeamIds = teamIds.filter((id) => !existingTeamIds.has(id));
      if (newTeamIds.length === 0) return [];

      const firstName = profile?.full_name?.split(' ')[0] ?? 'Speler';

      const { error } = await supabase.from('feed_events').insert(
        newTeamIds.map((teamId) => ({
          team_id: teamId,
          athlete_id: user!.id,
          event_type: 'goal_achieved',
          metadata: { name: firstName, goalId, goalTitle },
        }))
      );

      if (error) throw error;
      return newTeamIds;
    },
    onSuccess: (teamIds) => {
      for (const teamId of teamIds) {
        queryClient.invalidateQueries({ queryKey: ['feed-events', teamId] });
      }
    },
  });
}

// ─── Insert feed event (used client-side for goal achieved, etc.) ───────────

export function useInsertFeedEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      eventType,
      metadata,
    }: {
      teamId: string;
      eventType: FeedEventType;
      metadata?: Record<string, any>;
    }) => {
      const { error } = await supabase.from('feed_events').insert({
        team_id: teamId,
        athlete_id: user!.id,
        event_type: eventType,
        metadata: metadata ?? {},
      });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed-events', variables.teamId] });
    },
  });
}
