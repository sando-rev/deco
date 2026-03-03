-- Migration: Create skill_definitions table and seed with field hockey skills

CREATE TABLE IF NOT EXISTS deco.skill_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('technical', 'tactical', 'physical', 'mental')),
  icon text NOT NULL DEFAULT 'ellipse-outline',
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE deco.skill_definitions ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read skill definitions
CREATE POLICY "Anyone can read skill definitions"
  ON deco.skill_definitions FOR SELECT
  TO authenticated
  USING (true);

-- Seed: Technical Skills
INSERT INTO deco.skill_definitions (key, label, description, category, icon, display_order) VALUES
  ('ball_carrying', 'Ball Carrying', 'Close control, 3D skills, running with the ball', 'technical', 'football-outline', 1),
  ('passing', 'Passing', 'Push pass, slap pass, hit, accuracy', 'technical', 'swap-horizontal-outline', 2),
  ('receiving', 'Receiving', 'Trapping, open/reverse stick, first touch', 'technical', 'hand-left-outline', 3),
  ('shooting', 'Shooting', 'Hitting, flicking, deflections, scoring', 'technical', 'flash-outline', 4),
  ('jab_tackle', 'Jab Tackle', 'Channeling, timing, poking the ball', 'technical', 'shield-outline', 5),
  ('block_tackle', 'Block Tackle', 'Flat stick block, body positioning', 'technical', 'shield-checkmark-outline', 6),
  ('aerial_skills', 'Aerial Skills', 'Aerial pass and reception, overhead flick', 'technical', 'arrow-up-outline', 7),
  ('elimination', 'Elimination Skills', '1v1 moves, pull-back, spin, dummy', 'technical', 'git-branch-outline', 8),
  ('drag_flick', 'Drag Flick', 'Penalty corner drag flicking', 'technical', 'flame-outline', 9),
  ('goalkeeping', 'Goalkeeping', 'Shot stopping, positioning, distribution', 'technical', 'hand-right-outline', 10);

-- Seed: Tactical Skills
INSERT INTO deco.skill_definitions (key, label, description, category, icon, display_order) VALUES
  ('positioning', 'Positioning', 'Finding space, off-ball movement', 'tactical', 'locate-outline', 1),
  ('decision_making', 'Decision Making', 'When to pass/carry/shoot, reading play', 'tactical', 'bulb-outline', 2),
  ('pressing', 'Pressing', 'High press, triggers, defensive pressure', 'tactical', 'push-outline', 3),
  ('transition_attack', 'Transition to Attack', 'Counter-attacking, quick outlet', 'tactical', 'arrow-forward-outline', 4),
  ('transition_defence', 'Transition to Defence', 'Recovery runs, getting goalside', 'tactical', 'arrow-back-outline', 5),
  ('set_pieces', 'Set Pieces', 'Corners (inject/trap/hit), free hits', 'tactical', 'flag-outline', 6),
  ('game_management', 'Game Management', 'Tempo control, closing out games', 'tactical', 'time-outline', 7),
  ('creating_overloads', 'Creating Overloads', '2v1 play, overlapping, combining', 'tactical', 'people-outline', 8);

-- Seed: Physical Skills
INSERT INTO deco.skill_definitions (key, label, description, category, icon, display_order) VALUES
  ('sprint_speed', 'Sprint Speed', 'Acceleration, top speed, repeated sprints', 'physical', 'speedometer-outline', 1),
  ('endurance', 'Endurance', 'Aerobic capacity, lasting 70 min at intensity', 'physical', 'heart-outline', 2),
  ('agility', 'Agility', 'Change of direction, footwork', 'physical', 'navigate-outline', 3),
  ('strength', 'Strength', 'Core, upper body, lower body power', 'physical', 'barbell-outline', 4),
  ('flexibility', 'Flexibility', 'Range of motion, injury prevention', 'physical', 'body-outline', 5),
  ('explosive_power', 'Explosive Power', 'Jumping, explosive starts, hitting power', 'physical', 'rocket-outline', 6);

-- Seed: Mental Skills
INSERT INTO deco.skill_definitions (key, label, description, category, icon, display_order) VALUES
  ('focus', 'Focus', 'Concentration over 70 min, avoiding distractions', 'mental', 'eye-outline', 1),
  ('resilience', 'Resilience', 'Bouncing back from mistakes', 'mental', 'fitness-outline', 2),
  ('confidence', 'Confidence', 'Self-belief, taking initiative', 'mental', 'star-outline', 3),
  ('communication', 'Communication', 'On-pitch calling, organizing teammates', 'mental', 'chatbubbles-outline', 4),
  ('competitiveness', 'Competitiveness', 'Will to win, intensity in duels', 'mental', 'trophy-outline', 5),
  ('handling_pressure', 'Handling Pressure', 'Big game performance, penalty corners', 'mental', 'diamond-outline', 6);
