-- ============================================================================
-- Feed RLS Hardening: tighten policies on coach_weekly_actions, feed_events
-- and feed_reactions, plus server-side enforcement of the feed_visible opt-out
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- BUG 1 (HIGH): cwa_coach_all was FOR ALL USING (coach_id = auth.uid()) with
-- no WITH CHECK, so any authenticated user could INSERT forged rows
-- (coach_id = own uid, arbitrary athlete_id/team_id) which the notification
-- cron would convert into fake "your coach responded" pushes.
-- Fix: split into per-command policies; INSERT/UPDATE require the author to
-- actually coach the target team AND the athlete to be a member of that team
-- (same shape as coach_score_feedback_insert). The app's upsert in
-- useSaveWeeklyAction (insert + on-conflict update as a legitimate team
-- coach) satisfies both the INSERT and UPDATE checks.
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS cwa_coach_all ON deco.coach_weekly_actions;
DROP POLICY IF EXISTS cwa_coach_select ON deco.coach_weekly_actions;
DROP POLICY IF EXISTS cwa_coach_insert ON deco.coach_weekly_actions;
DROP POLICY IF EXISTS cwa_coach_update ON deco.coach_weekly_actions;
DROP POLICY IF EXISTS cwa_coach_delete ON deco.coach_weekly_actions;

-- Coach can read their own actions
CREATE POLICY cwa_coach_select ON deco.coach_weekly_actions
  FOR SELECT USING (coach_id = auth.uid());

-- Coach can delete their own actions
CREATE POLICY cwa_coach_delete ON deco.coach_weekly_actions
  FOR DELETE USING (coach_id = auth.uid());

-- Coach can insert actions only for athletes on teams they actually coach
CREATE POLICY cwa_coach_insert ON deco.coach_weekly_actions
  FOR INSERT WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM deco.team_coaches tc
      WHERE tc.team_id = coach_weekly_actions.team_id AND tc.coach_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM deco.team_members tm
      WHERE tm.team_id = coach_weekly_actions.team_id
        AND tm.athlete_id = coach_weekly_actions.athlete_id
    )
  );

-- Coach can update their own actions; updated row must still target a valid
-- coach/team/athlete combination
CREATE POLICY cwa_coach_update ON deco.coach_weekly_actions
  FOR UPDATE USING (coach_id = auth.uid())
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM deco.team_coaches tc
      WHERE tc.team_id = coach_weekly_actions.team_id AND tc.coach_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM deco.team_members tm
      WHERE tm.team_id = coach_weekly_actions.team_id
        AND tm.athlete_id = coach_weekly_actions.athlete_id
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- BUG 2 (HIGH): feed_athlete_insert allowed athletes to insert ANY event_type
-- (including forged coach_announcement / weekly_summary /
-- coach_overview_published) and pinned rows.
-- Fix: restrict to the athlete milestone event types and is_pinned = false.
-- The app's only client-side athlete insert is 'goal_achieved' with is_pinned
-- defaulting to false (useInsertGoalAchievedEvent) — still allowed. The
-- send-notifications edge function inserts with the service role and bypasses
-- RLS, so server-generated milestones are unaffected.
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS feed_athlete_insert ON deco.feed_events;

-- Athletes can insert their own milestone events (not coach/system types)
CREATE POLICY feed_athlete_insert ON deco.feed_events
  FOR INSERT WITH CHECK (
    athlete_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM deco.team_members tm
      WHERE tm.team_id = feed_events.team_id AND tm.athlete_id = auth.uid()
    )
    AND event_type IN (
      'reflection_streak_3', 'personal_record_week', 'streak_7_plus',
      'goal_achieved'
    )
    AND is_pinned = false
  );

-- ────────────────────────────────────────────────────────────────────────────
-- BUG 3 (MEDIUM): reactions_member_all was FOR ALL USING (user_id = auth.uid())
-- so INSERT was not scoped to team membership — any authenticated user could
-- react to any team's events (and trigger reaction pushes).
-- Fix: split into per-command policies; INSERT additionally requires that the
-- reacting user is a member or coach of the event's team (same shape as the
-- existing reactions_read policy, which is kept as is).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS reactions_member_all ON deco.feed_reactions;
DROP POLICY IF EXISTS reactions_own_select ON deco.feed_reactions;
DROP POLICY IF EXISTS reactions_own_update ON deco.feed_reactions;
DROP POLICY IF EXISTS reactions_own_delete ON deco.feed_reactions;
DROP POLICY IF EXISTS reactions_member_insert ON deco.feed_reactions;

-- Users can read their own reactions (team-wide reads via reactions_read)
CREATE POLICY reactions_own_select ON deco.feed_reactions
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own reactions (emoji changes)
CREATE POLICY reactions_own_update ON deco.feed_reactions
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own reactions
CREATE POLICY reactions_own_delete ON deco.feed_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Users can react only to events on teams they belong to (member or coach)
CREATE POLICY reactions_member_insert ON deco.feed_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM deco.feed_events fe
        JOIN deco.team_members tm ON tm.team_id = fe.team_id
        WHERE fe.id = feed_reactions.event_id AND tm.athlete_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM deco.feed_events fe
        JOIN deco.team_coaches tc ON tc.team_id = fe.team_id
        WHERE fe.id = feed_reactions.event_id AND tc.coach_id = auth.uid()
      )
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- BUG 4 (LOW): feed_coach_update let a coach rewrite ANY column of any team
-- feed event (event_type, metadata, athlete_id), while the app only ever
-- updates is_pinned (usePinEvent, useCreateAnnouncement unpin).
-- Fix: column-level grants — authenticated clients may only UPDATE is_pinned;
-- the feed_coach_update RLS policy remains the row filter. The revoke is safe
-- for existing flows because every client-side UPDATE on feed_events sets
-- only is_pinned; SELECT/INSERT/DELETE grants are untouched and the service
-- role keeps its own full grants.
-- NOTE: a future blanket `GRANT ALL ON ALL TABLES IN SCHEMA deco TO
-- authenticated` would undo this — re-apply these two statements if the
-- schema grants are ever reset.
-- ────────────────────────────────────────────────────────────────────────────

REVOKE UPDATE ON deco.feed_events FROM authenticated;
GRANT UPDATE (is_pinned) ON deco.feed_events TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- BUG 5 (MEDIUM): the feed_visible opt-out was only enforced client-side
-- (useFeed.ts filtered hidden athletes after fetching), so any team member
-- could query hidden athletes' milestone events directly.
-- Fix: enforce it in the feed_read_member SELECT policy via a SECURITY
-- DEFINER helper (profiles rows of teammates are not otherwise guaranteed to
-- be readable inside the policy). Coaches DO still see hidden athletes'
-- events: the toggle is about visibility to peers in the TEAM feed, while
-- coach oversight (weekly overview, outliers) intentionally covers every
-- athlete — so the hidden-filter applies only to the team_members branch and
-- the team_coaches branch is left untouched. Athletes always see their own
-- events regardless of the toggle.
-- ────────────────────────────────────────────────────────────────────────────

-- True only when the athlete has explicitly opted out (feed_visible = false);
-- null/missing profile or null feed_visible counts as visible
CREATE OR REPLACE FUNCTION deco.feed_athlete_hidden(aid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = deco, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT p.feed_visible = false FROM deco.profiles p WHERE p.id = aid),
    false
  );
$$;

DROP POLICY IF EXISTS feed_read_member ON deco.feed_events;

-- Team members can read feed events, except milestone events of athletes who
-- opted out of the feed (they still see their own); coaches see everything
CREATE POLICY feed_read_member ON deco.feed_events
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM deco.team_members tm
        WHERE tm.team_id = feed_events.team_id AND tm.athlete_id = auth.uid()
      )
      AND (
        feed_events.athlete_id IS NULL
        OR feed_events.athlete_id = auth.uid()
        OR NOT deco.feed_athlete_hidden(feed_events.athlete_id)
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM deco.team_coaches tc
      WHERE tc.team_id = feed_events.team_id AND tc.coach_id = auth.uid()
    )
  );
