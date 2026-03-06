-- Migration: Create schedule tables for training and match planning

-- Weekly recurring training schedule template
CREATE TABLE IF NOT EXISTS deco.training_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('training', 'match', 'gym', 'other')),
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, day_of_week, start_time)
);

ALTER TABLE deco.training_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage own training schedules"
  ON deco.training_schedules FOR ALL
  TO authenticated
  USING (athlete_id = auth.uid());

CREATE POLICY "Coaches view team members training schedules"
  ON deco.training_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deco.team_members tm
      JOIN deco.team_coaches tc ON tc.team_id = tm.team_id
      WHERE tm.athlete_id = training_schedules.athlete_id
      AND tc.coach_id = auth.uid()
    )
  );

-- Materialized session instances (from template + manually added)
CREATE TABLE IF NOT EXISTS deco.scheduled_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES deco.training_schedules(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('training', 'match', 'gym', 'other')),
  label text,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reflection_id uuid REFERENCES deco.reflections(id) ON DELETE SET NULL,
  notification_sent_pre boolean NOT NULL DEFAULT false,
  notification_sent_post boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_sessions_athlete_date
  ON deco.scheduled_sessions(athlete_id, date);

ALTER TABLE deco.scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage own scheduled sessions"
  ON deco.scheduled_sessions FOR ALL
  TO authenticated
  USING (athlete_id = auth.uid());

CREATE POLICY "Coaches view team members scheduled sessions"
  ON deco.scheduled_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deco.team_members tm
      JOIN deco.team_coaches tc ON tc.team_id = tm.team_id
      WHERE tm.athlete_id = scheduled_sessions.athlete_id
      AND tc.coach_id = auth.uid()
    )
  );
