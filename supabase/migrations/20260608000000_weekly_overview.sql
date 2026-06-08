-- ============================================================================
-- Weekly Coach Overview: coach_weekly_actions table + profile columns
-- ============================================================================

-- Coach weekly actions (per-player feedback in the weekly overview)
CREATE TABLE IF NOT EXISTS deco.coach_weekly_actions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid        NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  team_id     uuid        NOT NULL REFERENCES deco.teams(id) ON DELETE CASCADE,
  athlete_id  uuid        NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  week_start  date        NOT NULL,
  action_type text        NOT NULL CHECK (action_type IN ('good', 'respond', 'attention')),
  message     text,
  notification_sent boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coach_id, team_id, athlete_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_cwa_team_week ON deco.coach_weekly_actions(team_id, week_start);
CREATE INDEX IF NOT EXISTS idx_cwa_athlete ON deco.coach_weekly_actions(athlete_id, week_start);

ALTER TABLE deco.coach_weekly_actions ENABLE ROW LEVEL SECURITY;

-- Coach can manage their own actions
CREATE POLICY cwa_coach_all ON deco.coach_weekly_actions
  FOR ALL USING (coach_id = auth.uid());

-- Athlete can see actions directed at them (except 'attention')
CREATE POLICY cwa_athlete_read ON deco.coach_weekly_actions
  FOR SELECT USING (
    athlete_id = auth.uid() AND action_type != 'attention'
  );

-- Profile columns for configurable overview notification day/time
ALTER TABLE deco.profiles
  ADD COLUMN IF NOT EXISTS coach_overview_day integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS coach_overview_time text DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS coach_overview_notif_sent_date text;
