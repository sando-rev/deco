-- Migration: Notification flow builder tables
-- Duolingo-style automated notification sequences for re-engagement

-- Flow definitions
CREATE TABLE deco.notification_flows (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  description   text,
  is_active     boolean     NOT NULL DEFAULT false,
  trigger_type  text        NOT NULL CHECK (trigger_type IN (
    'inactivity', 'new_signup', 'no_goals', 'no_reflections', 'coach_inactive'
  )),
  trigger_config jsonb      NOT NULL DEFAULT '{}',
  target_role   text        CHECK (target_role IN ('athlete', 'coach')),
  exit_on_activity boolean  NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Flow steps (ordered messages per flow)
CREATE TABLE deco.notification_flow_steps (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id     uuid    NOT NULL REFERENCES deco.notification_flows(id) ON DELETE CASCADE,
  step_order  integer NOT NULL,
  delay_hours integer NOT NULL DEFAULT 0,
  title_nl    text    NOT NULL,
  title_en    text    NOT NULL,
  body_nl     text    NOT NULL,
  body_en     text    NOT NULL,
  screen_path text    DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(flow_id, step_order)
);

-- Flow enrollments (tracks user progress)
CREATE TABLE deco.notification_flow_enrollments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id           uuid        NOT NULL REFERENCES deco.notification_flows(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  current_step      integer     NOT NULL DEFAULT 0,
  enrolled_at       timestamptz NOT NULL DEFAULT now(),
  last_step_sent_at timestamptz,
  completed_at      timestamptz,
  exit_reason       text,
  UNIQUE(flow_id, user_id)
);

-- Indexes for the flow processor (runs every 10 min)
CREATE INDEX idx_flow_enrollments_active
  ON deco.notification_flow_enrollments(flow_id, current_step)
  WHERE completed_at IS NULL;

CREATE INDEX idx_flow_enrollments_user
  ON deco.notification_flow_enrollments(user_id)
  WHERE completed_at IS NULL;

-- RLS (service role full access)
ALTER TABLE deco.notification_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE deco.notification_flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE deco.notification_flow_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON deco.notification_flows
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON deco.notification_flow_steps
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON deco.notification_flow_enrollments
  FOR ALL USING (true) WITH CHECK (true);

-- ── Seed: 4 pre-built flows ──────────────────────────────────────────────────

-- Flow 1: Inactivity Re-engagement
INSERT INTO deco.notification_flows (id, name, description, is_active, trigger_type, trigger_config, target_role, exit_on_activity)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Inactivity Re-engagement',
  'Re-engage athletes who haven''t been active for 3+ days',
  true, 'inactivity', '{"days_inactive": 3}', 'athlete', true
);

INSERT INTO deco.notification_flow_steps (flow_id, step_order, delay_hours, title_nl, title_en, body_nl, body_en, screen_path) VALUES
('a1000000-0000-0000-0000-000000000001', 0, 0,
 'Je doelen missen je!', 'Your goals miss you!',
 'Je hebt al een paar dagen niet getraind. Kleine stap vandaag?', 'You haven''t trained in a few days. Small step today?',
 '/(athlete)/goals'),
('a1000000-0000-0000-0000-000000000001', 1, 48,
 'Je streak staat op het spel', 'Your streak is at risk',
 'Log vandaag even in om je voortgang vast te houden.', 'Log in today to keep your progress going.',
 '/(athlete)/development'),
('a1000000-0000-0000-0000-000000000001', 2, 72,
 'Coach tip: kleine stappen', 'Coach tip: small steps',
 'Kleine stappen maken het verschil. Begin met 1 doel.', 'Small steps make the difference. Start with 1 goal.',
 '/(athlete)/goals/new'),
('a1000000-0000-0000-0000-000000000001', 3, 120,
 'We missen je! Kom je terug?', 'We miss you! Coming back?',
 'Je ontwikkeling wacht op je. Open de app en kijk wat je hebt bereikt.', 'Your development awaits. Open the app and see what you''ve achieved.',
 '/(athlete)/development');

-- Flow 2: New User Onboarding
INSERT INTO deco.notification_flows (id, name, description, is_active, trigger_type, trigger_config, target_role, exit_on_activity)
VALUES (
  'a1000000-0000-0000-0000-000000000002',
  'New User Onboarding',
  'Guide new athletes through their first week',
  true, 'new_signup', '{"days_after_signup": 1}', 'athlete', false
);

INSERT INTO deco.notification_flow_steps (flow_id, step_order, delay_hours, title_nl, title_en, body_nl, body_en, screen_path) VALUES
('a1000000-0000-0000-0000-000000000002', 0, 0,
 'Welkom bij Deco! Stel je eerste doel', 'Welcome to Deco! Set your first goal',
 'Een doel stellen duurt 30 seconden en helpt je focus houden.', 'Setting a goal takes 30 seconds and helps you stay focused.',
 '/(athlete)/goals/new'),
('a1000000-0000-0000-0000-000000000002', 1, 48,
 'Tip: reflecteer na je training', 'Tip: reflect after training',
 'Spelers die reflecteren groeien 2x sneller. Probeer het na je volgende sessie!', 'Players who reflect grow 2x faster. Try it after your next session!',
 '/(athlete)/development/reflect'),
('a1000000-0000-0000-0000-000000000002', 2, 120,
 'Ontdek wat je coach kan doen', 'Discover what your coach can do',
 'Je coach kan feedback geven op je doelen. Bekijk hoe dat werkt.', 'Your coach can give feedback on your goals. See how it works.',
 '/(athlete)/goals');

-- Flow 3: No Goals Nudge
INSERT INTO deco.notification_flows (id, name, description, is_active, trigger_type, trigger_config, target_role, exit_on_activity)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  'No Goals Nudge',
  'Nudge athletes who haven''t created any goals after 3 days',
  true, 'no_goals', '{"days_without_goals": 3}', 'athlete', true
);

INSERT INTO deco.notification_flow_steps (flow_id, step_order, delay_hours, title_nl, title_en, body_nl, body_en, screen_path) VALUES
('a1000000-0000-0000-0000-000000000003', 0, 0,
 'Een doel stellen duurt 30 seconden', 'Setting a goal takes 30 seconds',
 'Begin met iets kleins. Wat wil je deze week verbeteren?', 'Start small. What do you want to improve this week?',
 '/(athlete)/goals/new'),
('a1000000-0000-0000-0000-000000000003', 1, 72,
 'Spelers met doelen groeien 2x sneller', 'Players with goals grow 2x faster',
 'Data laat zien: spelers met doelen trainen gerichter. Stel er een in!', 'Data shows: players with goals train with more focus. Set one!',
 '/(athlete)/goals/new');

-- Flow 4: Weekly Inactive Coach
INSERT INTO deco.notification_flows (id, name, description, is_active, trigger_type, trigger_config, target_role, exit_on_activity)
VALUES (
  'a1000000-0000-0000-0000-000000000004',
  'Weekly Inactive Coach',
  'Re-engage coaches who haven''t been active for 7 days',
  true, 'coach_inactive', '{"days_inactive": 7}', 'coach', true
);

INSERT INTO deco.notification_flow_steps (flow_id, step_order, delay_hours, title_nl, title_en, body_nl, body_en, screen_path) VALUES
('a1000000-0000-0000-0000-000000000004', 0, 0,
 'Je spelers wachten op feedback', 'Your players are waiting for feedback',
 'Een korte reactie op een doel maakt al verschil.', 'A quick reaction to a goal already makes a difference.',
 '/(coach)/players'),
('a1000000-0000-0000-0000-000000000004', 1, 72,
 'Feedback geven kost maar 2 minuten', 'Giving feedback takes only 2 minutes',
 'Open de app en geef je spelers een duim omhoog of korte tip.', 'Open the app and give your players a thumbs up or quick tip.',
 '/(coach)/players');
