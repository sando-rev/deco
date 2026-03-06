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

-- Seed: Technische vaardigheden
INSERT INTO deco.skill_definitions (key, label, description, category, icon, display_order) VALUES
  ('ball_carrying', 'Balvoering', 'Balcontrole, 3D-vaardigheden, lopen met de bal', 'technical', 'football-outline', 1),
  ('passing', 'Passen', 'Pushpass, sleeppass, hit, nauwkeurigheid', 'technical', 'swap-horizontal-outline', 2),
  ('receiving', 'Aannemen', 'Stoppen, forehand/backhand, eerste aanname', 'technical', 'hand-left-outline', 3),
  ('shooting', 'Schieten', 'Hit, push, tip-in, deflecties, scoren', 'technical', 'flash-outline', 4),
  ('jab_tackle', 'Jab Tackle', 'Kanaliseren, timing, bal wegprikken', 'technical', 'shield-outline', 5),
  ('block_tackle', 'Bloktackle', 'Vlakke stick blok, lichaamshouding', 'technical', 'shield-checkmark-outline', 6),
  ('aerial_skills', 'Luchtballen', 'Luchtpass en -aanname, overhead flick', 'technical', 'arrow-up-outline', 7),
  ('elimination', 'Uitspelen', '1-tegen-1 acties, pull-back, spin, schijnbeweging', 'technical', 'git-branch-outline', 8),
  ('drag_flick', 'Strafcorner Sleep', 'Strafcorner sleepbal', 'technical', 'flame-outline', 9),
  ('goalkeeping', 'Keepen', 'Ballen stoppen, positie kiezen, uitspelen', 'technical', 'hand-right-outline', 10);

-- Seed: Tactische vaardigheden
INSERT INTO deco.skill_definitions (key, label, description, category, icon, display_order) VALUES
  ('positioning', 'Positiespel', 'Ruimte vinden, bewegen zonder bal', 'tactical', 'locate-outline', 1),
  ('decision_making', 'Besluitvorming', 'Wanneer passen/lopen/schieten, spel lezen', 'tactical', 'bulb-outline', 2),
  ('pressing', 'Druk zetten', 'Hoge druk, aanjagen, verdedigende druk', 'tactical', 'push-outline', 3),
  ('transition_attack', 'Omschakeling aanval', 'Counteren, snelle uitspeel', 'tactical', 'arrow-forward-outline', 4),
  ('transition_defence', 'Omschakeling verdediging', 'Terugverdedigen, doelzijde kiezen', 'tactical', 'arrow-back-outline', 5),
  ('set_pieces', 'Standaardsituaties', 'Strafcorners (aangeven/stoppen/hit), vrije slagen', 'tactical', 'flag-outline', 6),
  ('game_management', 'Wedstrijdmanagement', 'Tempo bepalen, wedstrijden uitspelen', 'tactical', 'time-outline', 7),
  ('creating_overloads', 'Overtal creëren', '2-tegen-1 spel, overlap lopen, combineren', 'tactical', 'people-outline', 8);

-- Seed: Fysieke vaardigheden
INSERT INTO deco.skill_definitions (key, label, description, category, icon, display_order) VALUES
  ('sprint_speed', 'Sprintsnelheid', 'Acceleratie, topsnelheid, herhaalde sprints', 'physical', 'speedometer-outline', 1),
  ('endurance', 'Uithoudingsvermogen', 'Aerobe capaciteit, 70 minuten volhouden op intensiteit', 'physical', 'heart-outline', 2),
  ('agility', 'Wendbaarheid', 'Richtingsverandering, voetenwerk', 'physical', 'navigate-outline', 3),
  ('strength', 'Kracht', 'Core, bovenlichaam, onderlichaam kracht', 'physical', 'barbell-outline', 4),
  ('flexibility', 'Flexibiliteit', 'Bewegingsbereik, blessurepreventie', 'physical', 'body-outline', 5),
  ('explosive_power', 'Explosiviteit', 'Springen, explosieve starts, slagkracht', 'physical', 'rocket-outline', 6);

-- Seed: Mentale vaardigheden
INSERT INTO deco.skill_definitions (key, label, description, category, icon, display_order) VALUES
  ('focus', 'Focus', 'Concentratie over 70 minuten, afleidingen vermijden', 'mental', 'eye-outline', 1),
  ('resilience', 'Veerkracht', 'Terugkomen na fouten', 'mental', 'fitness-outline', 2),
  ('confidence', 'Zelfvertrouwen', 'Geloof in jezelf, initiatief nemen', 'mental', 'star-outline', 3),
  ('communication', 'Communicatie', 'Coachen op het veld, teamgenoten aansturen', 'mental', 'chatbubbles-outline', 4),
  ('competitiveness', 'Competitiviteit', 'Winnaarsmentaliteit, intensiteit in duels', 'mental', 'trophy-outline', 5),
  ('handling_pressure', 'Omgaan met druk', 'Presteren in grote wedstrijden, strafcorners', 'mental', 'diamond-outline', 6);
