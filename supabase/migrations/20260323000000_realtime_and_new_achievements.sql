-- Enable realtime for coach_comments and coach_score_feedback
ALTER PUBLICATION supabase_realtime ADD TABLE deco.coach_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE deco.coach_score_feedback;

-- Remove old duplicate "scannen" skill if it exists (key='scannen', from old migration data)
-- The correct one uses key='scanning' from the skill_definitions migration
-- Reassign any references to the new scanning skill before deleting
UPDATE deco.athlete_selected_skills
SET skill_id = (SELECT id FROM deco.skill_definitions WHERE key = 'scanning')
WHERE skill_id IN (SELECT id FROM deco.skill_definitions WHERE key = 'scannen');

UPDATE deco.athlete_skill_scores
SET skill_id = (SELECT id FROM deco.skill_definitions WHERE key = 'scanning')
WHERE skill_id IN (SELECT id FROM deco.skill_definitions WHERE key = 'scannen');

UPDATE deco.goals
SET skill_id = (SELECT id FROM deco.skill_definitions WHERE key = 'scanning')
WHERE skill_id IN (SELECT id FROM deco.skill_definitions WHERE key = 'scannen');

DELETE FROM deco.skill_definitions WHERE key = 'scannen';

-- Add new achievements: "Stel 3 doelen" and "Behaal 3 doelen"
INSERT INTO deco.achievements (id, key, category, icon, threshold, xp_reward, display_order) VALUES
  (gen_random_uuid(), 'three_goals', 'goals', 'flag-outline', 3, 25, 2),
  (gen_random_uuid(), 'three_achieved', 'goals', 'checkmark-circle-outline', 3, 50, 12);

-- Coach reports table
CREATE TABLE IF NOT EXISTS deco.coach_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES deco.teams(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coach_id, team_id, week_start)
);

ALTER TABLE deco.coach_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their own reports"
  ON deco.coach_reports FOR ALL
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());
