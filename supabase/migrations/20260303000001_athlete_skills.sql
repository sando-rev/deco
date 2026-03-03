-- Migration: Create athlete skill selection and scoring tables

-- Tracks which skills each athlete selected during onboarding
CREATE TABLE IF NOT EXISTS deco.athlete_selected_skills (
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES deco.skill_definitions(id) ON DELETE CASCADE,
  selected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (athlete_id, skill_id)
);

ALTER TABLE deco.athlete_selected_skills ENABLE ROW LEVEL SECURITY;

-- Athletes can manage their own selected skills
CREATE POLICY "Athletes manage own selected skills"
  ON deco.athlete_selected_skills FOR ALL
  TO authenticated
  USING (athlete_id = auth.uid());

-- Coaches can view team members' selected skills
CREATE POLICY "Coaches view team members selected skills"
  ON deco.athlete_selected_skills FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deco.team_members tm
      JOIN deco.teams t ON t.id = tm.team_id
      WHERE tm.athlete_id = athlete_selected_skills.athlete_id
      AND t.coach_id = auth.uid()
    )
  );

-- Stores score history for each skill
CREATE TABLE IF NOT EXISTS deco.athlete_skill_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES deco.skill_definitions(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score >= 1 AND score <= 10),
  assessed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_skill_scores_athlete_assessed
  ON deco.athlete_skill_scores(athlete_id, assessed_at DESC);

ALTER TABLE deco.athlete_skill_scores ENABLE ROW LEVEL SECURITY;

-- Athletes can manage their own scores
CREATE POLICY "Athletes manage own skill scores"
  ON deco.athlete_skill_scores FOR ALL
  TO authenticated
  USING (athlete_id = auth.uid());

-- Coaches can view team members' scores
CREATE POLICY "Coaches view team members skill scores"
  ON deco.athlete_skill_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deco.team_members tm
      JOIN deco.teams t ON t.id = tm.team_id
      WHERE tm.athlete_id = athlete_skill_scores.athlete_id
      AND t.coach_id = auth.uid()
    )
  );
