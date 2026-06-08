-- Junction table: which goals an athlete selected to focus on during a session
CREATE TABLE IF NOT EXISTS deco.session_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES deco.scheduled_sessions(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES deco.goals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, goal_id)
);

CREATE INDEX idx_session_goals_session ON deco.session_goals(session_id);

-- Also add a column for training-specific goal text (optional one-off goal)
ALTER TABLE deco.scheduled_sessions ADD COLUMN IF NOT EXISTS training_goal_text text;

-- RLS
ALTER TABLE deco.session_goals ENABLE ROW LEVEL SECURITY;

-- Athletes can manage their own session goals
CREATE POLICY session_goals_athlete ON deco.session_goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM deco.scheduled_sessions ss
      WHERE ss.id = session_goals.session_id AND ss.athlete_id = auth.uid()
    )
  );
