-- Notification templates: editable from admin dashboard
CREATE TABLE IF NOT EXISTS deco.notification_templates (
  id serial PRIMARY KEY,
  type text NOT NULL,
  variant text NOT NULL DEFAULT 'default',
  language text NOT NULL CHECK (language IN ('nl', 'en')),
  title text NOT NULL,
  body text NOT NULL,
  screen_path text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(type, variant, language)
);

-- Seed with current hardcoded values from send-notifications edge function

-- Pre-training focus
INSERT INTO deco.notification_templates (type, variant, language, title, body, screen_path) VALUES
  ('session_focus', 'default', 'nl', 'Kies je focus', 'Je sessie begint over 1 uur. Waar ga je je op focussen?', '/(athlete)/development/session-goals'),
  ('session_focus', 'default', 'en', 'Set your focus', 'Your session starts in 1 hour. What will you focus on?', '/(athlete)/development/session-goals');

-- Post-training reflection
INSERT INTO deco.notification_templates (type, variant, language, title, body, screen_path) VALUES
  ('post_training', 'default', 'nl', 'Hoe ging je training?', 'Neem 2 minuten om te reflecteren op je focus van vandaag.', '/(athlete)/development/reflect'),
  ('post_training', 'default', 'en', 'How was your session?', 'Take 2 minutes to reflect on today''s focus.', '/(athlete)/development/reflect');

-- Coach feedback (two variants: thumbs_up and comment)
INSERT INTO deco.notification_templates (type, variant, language, title, body, screen_path) VALUES
  ('coach_feedback', 'thumbs_up', 'nl', 'Nieuwe coach feedback', 'Je coach heeft je doel ''{{goal}}'' aangemoedigd! 👍', '/(athlete)/goals'),
  ('coach_feedback', 'thumbs_up', 'en', 'New coach feedback', 'Your coach encouraged your goal ''{{goal}}''! 👍', '/(athlete)/goals'),
  ('coach_feedback', 'comment', 'nl', 'Nieuwe coach feedback', 'Je coach heeft feedback gegeven op ''{{goal}}''', '/(athlete)/goals'),
  ('coach_feedback', 'comment', 'en', 'New coach feedback', 'Your coach left feedback on ''{{goal}}''', '/(athlete)/goals');

-- Weekly reflection
INSERT INTO deco.notification_templates (type, variant, language, title, body, screen_path) VALUES
  ('weekly_review', 'default', 'nl', 'Weekreflectie', 'Hoe was je week? Neem even de tijd om terug te kijken op je ontwikkeling.', '/(athlete)/development/reflect'),
  ('weekly_review', 'default', 'en', 'Weekly reflection', 'How was your week? Take a moment to look back on your development.', '/(athlete)/development/reflect');

-- Coach weekly report
INSERT INTO deco.notification_templates (type, variant, language, title, body, screen_path) VALUES
  ('coach_report', 'default', 'nl', 'Weekrapport invullen', 'Neem even de tijd om een rapport te schrijven over de voortgang van je spelers deze week.', '/(coach)/reports'),
  ('coach_report', 'default', 'en', 'Fill in weekly report', 'Take a moment to write a report about the progress of your players this week.', '/(coach)/reports');

-- RLS: allow service role full access (used by edge function and admin API)
ALTER TABLE deco.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON deco.notification_templates
  FOR ALL USING (true) WITH CHECK (true);
