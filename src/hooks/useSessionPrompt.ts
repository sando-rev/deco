import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

/**
 * On app open, checks if the athlete has a session that needs attention:
 * 1. An upcoming session (within 75 min) without session goals → navigate to session-goals
 * 2. A past session from today without a reflection → navigate to reflect
 *
 * This ensures the user sees the right screen even if they swiped away a notification.
 * Only runs once per app session.
 */
export function useSessionPrompt() {
  const { user, profile } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!user || !profile || profile.role !== 'athlete' || hasChecked.current) return;
    hasChecked.current = true;

    const checkPendingSessions = async () => {
      try {
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');

        // Fetch today's sessions
        const { data: sessions, error } = await supabase
          .from('scheduled_sessions')
          .select('id, date, start_time, end_time, session_type, reflection_id')
          .eq('athlete_id', user.id)
          .eq('date', today)
          .order('start_time', { ascending: true });

        if (error || !sessions || sessions.length === 0) return;

        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        // Check for past session needing reflection (higher priority)
        for (const session of sessions) {
          const [endH, endM] = session.end_time.split(':').map(Number);
          const endMinutes = endH * 60 + endM;

          // Session has ended and no reflection yet
          if (nowMinutes > endMinutes && !session.reflection_id) {
            console.log('[SessionPrompt] Past session needs reflection:', session.id);
            // Small delay to let the app settle
            setTimeout(() => {
              router.push({
                pathname: '/(athlete)/development/reflect' as any,
                params: { sessionId: session.id },
              });
            }, 1500);
            return;
          }
        }

        // Check for upcoming session needing focus goals (within 75 min)
        for (const session of sessions) {
          const [startH, startM] = session.start_time.split(':').map(Number);
          const startMinutes = startH * 60 + startM;
          const minutesUntil = startMinutes - nowMinutes;

          if (minutesUntil > 0 && minutesUntil <= 75) {
            // Check if session goals are already set
            const { data: goals } = await supabase
              .from('session_goals')
              .select('id')
              .eq('session_id', session.id)
              .limit(1);

            if (!goals || goals.length === 0) {
              console.log('[SessionPrompt] Upcoming session needs goals:', session.id);
              setTimeout(() => {
                router.push({
                  pathname: '/(athlete)/development/session-goals' as any,
                  params: { sessionId: session.id },
                });
              }, 1500);
              return;
            }
          }
        }
      } catch (e) {
        console.log('[SessionPrompt] Error checking sessions:', e);
      }
    };

    checkPendingSessions();
  }, [user, profile]);
}
