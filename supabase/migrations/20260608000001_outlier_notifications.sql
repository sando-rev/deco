-- ============================================================================
-- Outlier Notifications: notify coach on extreme reflection scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS deco.outlier_notifications (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id           uuid        NOT NULL REFERENCES deco.reflections(id) ON DELETE CASCADE,
  athlete_id              uuid        NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  coach_id                uuid        NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  team_id                 uuid        NOT NULL REFERENCES deco.teams(id) ON DELETE CASCADE,
  outlier_type            text        NOT NULL CHECK (outlier_type IN ('low', 'high')),
  avg_score               numeric(3,2) NOT NULL,
  coach_action            text        CHECK (coach_action IN ('good', 'respond', 'attention')),
  coach_message           text,
  action_notification_sent boolean    NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reflection_id, coach_id)
);

CREATE INDEX IF NOT EXISTS idx_outlier_athlete ON deco.outlier_notifications(athlete_id);
CREATE INDEX IF NOT EXISTS idx_outlier_coach_pending ON deco.outlier_notifications(coach_id)
  WHERE coach_action IS NULL;

ALTER TABLE deco.outlier_notifications ENABLE ROW LEVEL SECURITY;

-- Coach can manage their own outlier notifications
CREATE POLICY outlier_coach_all ON deco.outlier_notifications
  FOR ALL USING (coach_id = auth.uid());

-- Athlete can see actions directed at them (except 'attention')
CREATE POLICY outlier_athlete_read ON deco.outlier_notifications
  FOR SELECT USING (
    athlete_id = auth.uid() AND coach_action IS NOT NULL AND coach_action != 'attention'
  );

-- Add outlier notification toggle to profiles
ALTER TABLE deco.profiles
  ADD COLUMN IF NOT EXISTS outlier_notifications_enabled boolean DEFAULT true;
