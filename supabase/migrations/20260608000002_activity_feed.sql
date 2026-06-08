-- ============================================================================
-- Activity Feed: feed_events and feed_reactions tables
-- ============================================================================

-- Feed events (auto-generated milestones + coach announcements)
CREATE TABLE IF NOT EXISTS deco.feed_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid        NOT NULL REFERENCES deco.teams(id) ON DELETE CASCADE,
  athlete_id  uuid        REFERENCES deco.profiles(id) ON DELETE CASCADE,
  event_type  text        NOT NULL CHECK (event_type IN (
    'reflection_streak_3', 'personal_record_week', 'streak_7_plus',
    'goal_achieved', 'coach_overview_published', 'weekly_summary',
    'coach_announcement'
  )),
  metadata    jsonb       NOT NULL DEFAULT '{}',
  is_pinned   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_team_created ON deco.feed_events(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_pinned ON deco.feed_events(team_id) WHERE is_pinned = true;

ALTER TABLE deco.feed_events ENABLE ROW LEVEL SECURITY;

-- Team members can read feed events
CREATE POLICY feed_read_member ON deco.feed_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deco.team_members tm
      WHERE tm.team_id = feed_events.team_id AND tm.athlete_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM deco.team_coaches tc
      WHERE tc.team_id = feed_events.team_id AND tc.coach_id = auth.uid()
    )
  );

-- Coaches can insert announcements and team-level events
CREATE POLICY feed_coach_insert ON deco.feed_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM deco.team_coaches tc
      WHERE tc.team_id = feed_events.team_id AND tc.coach_id = auth.uid()
    )
  );

-- Athletes can insert their own milestone events
CREATE POLICY feed_athlete_insert ON deco.feed_events
  FOR INSERT WITH CHECK (
    athlete_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM deco.team_members tm
      WHERE tm.team_id = feed_events.team_id AND tm.athlete_id = auth.uid()
    )
  );

-- Coaches can update pin status
CREATE POLICY feed_coach_update ON deco.feed_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM deco.team_coaches tc
      WHERE tc.team_id = feed_events.team_id AND tc.coach_id = auth.uid()
    )
  );

-- Feed reactions (emoji responses to events)
CREATE TABLE IF NOT EXISTS deco.feed_reactions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid        NOT NULL REFERENCES deco.feed_events(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  emoji           text        NOT NULL CHECK (emoji IN ('like', '💪', '🔥', '👏', '🏑', '⭐', '🎯')),
  notification_sent boolean   NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_reactions_event ON deco.feed_reactions(event_id);

ALTER TABLE deco.feed_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone in the team can manage their own reactions
CREATE POLICY reactions_member_all ON deco.feed_reactions
  FOR ALL USING (user_id = auth.uid());

-- Anyone in the team can read all reactions
CREATE POLICY reactions_read ON deco.feed_reactions
  FOR SELECT USING (
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
  );

-- Feed visibility preference on profiles
ALTER TABLE deco.profiles
  ADD COLUMN IF NOT EXISTS feed_visible boolean DEFAULT true;

-- Weekly summary dedup on teams
ALTER TABLE deco.teams
  ADD COLUMN IF NOT EXISTS weekly_summary_sent_date text;
