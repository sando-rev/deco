-- Table for coach text feedback on athlete skill self-assessments (scores)
CREATE TABLE IF NOT EXISTS deco.coach_score_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by athlete
CREATE INDEX idx_coach_score_feedback_athlete ON deco.coach_score_feedback(athlete_id, created_at DESC);

-- RLS
ALTER TABLE deco.coach_score_feedback ENABLE ROW LEVEL SECURITY;

-- Coaches can insert feedback for athletes on their teams
CREATE POLICY coach_score_feedback_insert ON deco.coach_score_feedback
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id
    AND EXISTS (
      SELECT 1 FROM deco.team_coaches tc
      JOIN deco.team_members tm ON tm.team_id = tc.team_id
      WHERE tc.coach_id = auth.uid() AND tm.athlete_id = coach_score_feedback.athlete_id
    )
  );

-- Coaches can update their own feedback
CREATE POLICY coach_score_feedback_update ON deco.coach_score_feedback
  FOR UPDATE USING (auth.uid() = coach_id);

-- Coaches can delete their own feedback
CREATE POLICY coach_score_feedback_delete ON deco.coach_score_feedback
  FOR DELETE USING (auth.uid() = coach_id);

-- Coaches can read feedback they wrote; athletes can read feedback addressed to them
CREATE POLICY coach_score_feedback_select ON deco.coach_score_feedback
  FOR SELECT USING (
    auth.uid() = coach_id OR auth.uid() = athlete_id
  );
