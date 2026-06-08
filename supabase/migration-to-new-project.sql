-- ============================================================================
-- DECO: Full migration to new Supabase project
-- Run this in the SQL editor of the NEW project (hjbzknaionxkdkiowcch)
-- This is a SINGLE file — paste and run in one go.
-- ============================================================================

-- 1. Create deco schema and grant access
CREATE SCHEMA IF NOT EXISTS deco;
GRANT USAGE ON SCHEMA deco TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA deco TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA deco TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA deco GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA deco GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

CREATE TABLE deco.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  full_name text NOT NULL,
  sport text NOT NULL DEFAULT 'field_hockey',
  push_token text,
  notification_prefs jsonb NOT NULL DEFAULT '{"motivational": true, "post_session": true, "pre_training": true, "weekly_review": true}'::jsonb,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  position text,
  default_match_day integer,
  last_active_at timestamptz DEFAULT now(),
  language text DEFAULT 'nl',
  is_admin boolean NOT NULL DEFAULT false
);
ALTER TABLE deco.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.skill_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  icon text NOT NULL DEFAULT 'ellipse-outline',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  position_type text NOT NULL DEFAULT 'both',
  created_by_athlete_id uuid REFERENCES deco.profiles(id) ON DELETE CASCADE
);
ALTER TABLE deco.skill_definitions ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.athlete_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  dribbling integer NOT NULL,
  passing integer NOT NULL,
  shooting integer NOT NULL,
  defending integer NOT NULL,
  fitness integer NOT NULL,
  game_insight integer NOT NULL,
  communication integer NOT NULL,
  mental_strength integer NOT NULL,
  assessed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deco_athlete_attributes_athlete ON deco.athlete_attributes(athlete_id, assessed_at DESC);
ALTER TABLE deco.athlete_attributes ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.athlete_selected_skills (
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES deco.skill_definitions(id) ON DELETE CASCADE,
  selected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (athlete_id, skill_id)
);
ALTER TABLE deco.athlete_selected_skills ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.athlete_skill_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES deco.skill_definitions(id) ON DELETE CASCADE,
  score integer NOT NULL,
  assessed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_skill_scores_athlete_assessed ON deco.athlete_skill_scores(athlete_id, assessed_at DESC);
ALTER TABLE deco.athlete_skill_scores ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  attribute text,
  target_score integer,
  deadline date,
  status text NOT NULL DEFAULT 'active',
  ai_feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  score_improvement numeric DEFAULT NULL,
  skill_id uuid REFERENCES deco.skill_definitions(id),
  ai_analysis jsonb
);
CREATE INDEX idx_deco_goals_athlete_status ON deco.goals(athlete_id, status);
ALTER TABLE deco.goals ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.coach_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES deco.goals(id) ON DELETE CASCADE,
  content text,
  is_thumbs_up boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  seen_by_athlete boolean DEFAULT false
);
CREATE INDEX idx_deco_coach_comments_goal ON deco.coach_comments(goal_id, created_at DESC);
ALTER TABLE deco.coach_comments ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.coach_score_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_coach_score_feedback_athlete ON deco.coach_score_feedback(athlete_id, created_at DESC);
ALTER TABLE deco.coach_score_feedback ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  session_type text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deco_reflections_athlete ON deco.reflections(athlete_id, created_at DESC);
ALTER TABLE deco.reflections ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.reflection_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id uuid NOT NULL REFERENCES deco.reflections(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES deco.goals(id) ON DELETE CASCADE,
  rating integer NOT NULL
);
CREATE INDEX idx_deco_reflection_goals_reflection ON deco.reflection_goals(reflection_id);
CREATE INDEX idx_deco_reflection_goals_goal ON deco.reflection_goals(goal_id);
ALTER TABLE deco.reflection_goals ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deco_teams_invite_code ON deco.teams(invite_code);
ALTER TABLE deco.teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.team_members (
  team_id uuid NOT NULL REFERENCES deco.teams(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, athlete_id)
);
CREATE INDEX idx_deco_team_members_athlete ON deco.team_members(athlete_id);
ALTER TABLE deco.team_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.team_coaches (
  team_id uuid NOT NULL REFERENCES deco.teams(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, coach_id)
);
CREATE INDEX idx_team_coaches_coach ON deco.team_coaches(coach_id);
ALTER TABLE deco.team_coaches ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.training_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  session_type text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(athlete_id, day_of_week, start_time)
);
ALTER TABLE deco.training_schedules ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.scheduled_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES deco.training_schedules(id) ON DELETE SET NULL,
  session_type text NOT NULL,
  label text,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reflection_id uuid REFERENCES deco.reflections(id) ON DELETE SET NULL,
  notification_sent_pre boolean NOT NULL DEFAULT false,
  notification_sent_post boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  training_goal_text text
);
CREATE INDEX idx_scheduled_sessions_athlete_date ON deco.scheduled_sessions(athlete_id, date);
ALTER TABLE deco.scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.session_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES deco.scheduled_sessions(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES deco.goals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, goal_id)
);
CREATE INDEX idx_session_goals_session ON deco.session_goals(session_id);
ALTER TABLE deco.session_goals ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.match_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time text,
  label text DEFAULT 'Wedstrijd',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE deco.match_dates ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  category text NOT NULL,
  icon text NOT NULL,
  threshold integer NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0
);
ALTER TABLE deco.achievements ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.athlete_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES deco.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(athlete_id, achievement_id)
);
CREATE INDEX idx_athlete_achievements_athlete ON deco.athlete_achievements(athlete_id);
ALTER TABLE deco.athlete_achievements ENABLE ROW LEVEL SECURITY;

CREATE TABLE deco.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES deco.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points integer NOT NULL,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_xp_events_athlete ON deco.xp_events(athlete_id);
CREATE INDEX idx_xp_events_type ON deco.xp_events(athlete_id, event_type);
ALTER TABLE deco.xp_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION deco.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT is_admin FROM deco.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION deco.is_team_coach(p_team_id uuid, p_coach_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path TO 'deco' AS $$
  SELECT EXISTS (SELECT 1 FROM deco.team_coaches WHERE team_id = p_team_id AND coach_id = p_coach_id);
$$;

CREATE OR REPLACE FUNCTION deco.is_team_member(p_team_id uuid, p_athlete_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path TO 'deco' AS $$
  SELECT EXISTS (SELECT 1 FROM deco.team_members WHERE team_id = p_team_id AND athlete_id = p_athlete_id);
$$;

CREATE OR REPLACE FUNCTION deco.create_team_with_coach(team_name text)
RETURNS deco.teams LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_team deco.teams;
BEGIN
  INSERT INTO deco.teams (name) VALUES (team_name) RETURNING * INTO new_team;
  INSERT INTO deco.team_coaches (team_id, coach_id) VALUES (new_team.id, auth.uid());
  RETURN new_team;
END;
$$;

CREATE OR REPLACE FUNCTION deco.get_athlete_xp(p_athlete_id uuid)
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path TO 'deco' AS $$
  SELECT COALESCE(SUM(points), 0)::integer FROM deco.xp_events WHERE athlete_id = p_athlete_id;
$$;

CREATE OR REPLACE FUNCTION deco.get_team_leaderboard(p_team_id uuid)
RETURNS TABLE(athlete_id uuid, full_name text, total_xp integer, goals_achieved integer, streak integer)
LANGUAGE sql SECURITY DEFINER SET search_path TO 'deco' AS $$
  SELECT tm.athlete_id, p.full_name,
    COALESCE((SELECT SUM(points)::integer FROM deco.xp_events xe WHERE xe.athlete_id = tm.athlete_id), 0) as total_xp,
    COALESCE((SELECT COUNT(*)::integer FROM deco.goals g WHERE g.athlete_id = tm.athlete_id AND g.status = 'achieved'), 0) as goals_achieved,
    0 as streak
  FROM deco.team_members tm JOIN deco.profiles p ON p.id = tm.athlete_id
  WHERE tm.team_id = p_team_id ORDER BY total_xp DESC;
$$;

-- Auth trigger: create profile on signup
CREATE OR REPLACE FUNCTION deco.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'deco' AS $$
BEGIN
  INSERT INTO deco.profiles (id, full_name, role, sport)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'athlete'),
    'field_hockey'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, deco.profiles.full_name),
    role = COALESCE(EXCLUDED.role, deco.profiles.role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION deco.handle_new_user();

-- ============================================================================
-- 4. ADMIN FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION deco.get_analytics(range_days integer DEFAULT NULL::integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'deco', 'public' AS $function$
DECLARE
  since timestamptz;
  result jsonb;
  overview jsonb;
  users_data jsonb;
  engagement jsonb;
  gamification jsonb;
  coaches jsonb;
  training jsonb;
  funnel jsonb;
  power_users jsonb;
BEGIN
  IF NOT deco.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF range_days IS NOT NULL THEN since := now() - (range_days || ' days')::interval;
  ELSE since := '2000-01-01'::timestamptz; END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*) FROM deco.profiles),
    'athletes', (SELECT count(*) FROM deco.profiles WHERE role = 'athlete'),
    'coaches', (SELECT count(*) FROM deco.profiles WHERE role = 'coach'),
    'newUsers', (SELECT count(*) FROM deco.profiles WHERE created_at >= since),
    'totalGoals', (SELECT count(*) FROM deco.goals WHERE created_at >= since),
    'totalReflections', (SELECT count(*) FROM deco.reflections WHERE created_at >= since),
    'totalXp', (SELECT COALESCE(sum(points), 0) FROM deco.xp_events WHERE created_at >= since),
    'signupTimeseries', COALESCE((SELECT jsonb_agg(row_to_json(t) ORDER BY t.date) FROM (SELECT date_trunc('day', created_at)::date as date, count(*) as count FROM deco.profiles WHERE created_at >= since GROUP BY 1) t), '[]'::jsonb),
    'dauTimeseries', COALESCE((SELECT jsonb_agg(row_to_json(t) ORDER BY t.date) FROM (SELECT date_trunc('day', last_active_at)::date as date, count(*) as count FROM deco.profiles WHERE last_active_at >= since AND last_active_at IS NOT NULL GROUP BY 1) t), '[]'::jsonb)
  ) INTO overview;

  SELECT jsonb_build_object(
    'goalsTimeseries', COALESCE((SELECT jsonb_agg(row_to_json(t) ORDER BY t.date) FROM (SELECT date_trunc('day', created_at)::date as date, count(*) as count FROM deco.goals WHERE created_at >= since GROUP BY 1) t), '[]'::jsonb),
    'goalsByStatus', (SELECT jsonb_build_object('active', count(*) FILTER (WHERE status = 'active'), 'achieved', count(*) FILTER (WHERE status = 'achieved'), 'abandoned', count(*) FILTER (WHERE status = 'abandoned')) FROM deco.goals),
    'reflectionsTimeseries', COALESCE((SELECT jsonb_agg(row_to_json(t) ORDER BY t.date) FROM (SELECT date_trunc('day', created_at)::date as date, count(*) as count FROM deco.reflections WHERE created_at >= since GROUP BY 1) t), '[]'::jsonb),
    'reflectionQuality', (SELECT jsonb_build_object('total', count(*), 'withNotes', count(*) FILTER (WHERE notes IS NOT NULL AND length(notes) > 0)) FROM deco.reflections),
    'aiFeedbackUsage', (SELECT jsonb_build_object('total', count(*), 'withAi', count(*) FILTER (WHERE ai_analysis IS NOT NULL)) FROM deco.goals),
    'avgAiScores', (SELECT jsonb_build_object('specificity', round(avg((ai_analysis->>'specificity_score')::numeric), 1), 'measurability', round(avg((ai_analysis->>'measurability_score')::numeric), 1), 'challenge', round(avg((ai_analysis->>'challenge_score')::numeric), 1)) FROM deco.goals WHERE ai_analysis IS NOT NULL),
    'skillAssessments', COALESCE((SELECT jsonb_agg(row_to_json(t) ORDER BY t.date) FROM (SELECT date_trunc('day', assessed_at)::date as date, count(*) as count FROM deco.athlete_skill_scores WHERE assessed_at >= since GROUP BY 1) t), '[]'::jsonb)
  ) INTO engagement;

  SELECT jsonb_build_object(
    'totalXpAwarded', (SELECT COALESCE(sum(points), 0) FROM deco.xp_events),
    'xpTimeseries', COALESCE((SELECT jsonb_agg(row_to_json(t) ORDER BY t.date) FROM (SELECT date_trunc('day', created_at)::date as date, sum(points) as total FROM deco.xp_events WHERE created_at >= since GROUP BY 1) t), '[]'::jsonb),
    'xpByType', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT event_type, sum(points) as total, count(*) as count FROM deco.xp_events GROUP BY 1 ORDER BY 2 DESC) t), '[]'::jsonb),
    'xpDistribution', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT xe.athlete_id, p.full_name, sum(xe.points) as total_xp FROM deco.xp_events xe JOIN deco.profiles p ON p.id = xe.athlete_id GROUP BY 1, 2 ORDER BY 3 DESC) t), '[]'::jsonb),
    'achievementRates', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT a.key, a.key as label, a.category as description, count(aa.id) as earned, (SELECT count(*) FROM deco.profiles WHERE role = 'athlete') as total_athletes, round(count(aa.id)::numeric / GREATEST((SELECT count(*) FROM deco.profiles WHERE role = 'athlete'), 1) * 100, 1) as rate FROM deco.achievements a LEFT JOIN deco.athlete_achievements aa ON aa.achievement_id = a.id GROUP BY a.id, a.key, a.category ORDER BY rate DESC) t), '[]'::jsonb)
  ) INTO gamification;

  SELECT jsonb_build_object(
    'commentsTimeseries', COALESCE((SELECT jsonb_agg(row_to_json(t) ORDER BY t.date) FROM (SELECT date_trunc('day', created_at)::date as date, count(*) as count FROM deco.coach_comments WHERE created_at >= since GROUP BY 1) t), '[]'::jsonb),
    'thumbsUpRate', (SELECT jsonb_build_object('total', count(*), 'thumbsUp', count(*) FILTER (WHERE is_thumbs_up = true), 'rate', round(count(*) FILTER (WHERE is_thumbs_up = true)::numeric / GREATEST(count(*), 1) * 100, 1)) FROM deco.coach_comments),
    'scoreFeedbackCount', (SELECT count(*) FROM deco.coach_score_feedback),
    'teamSizes', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT t.name as team_name, (SELECT count(*) FROM deco.team_members tm WHERE tm.team_id = t.id) as member_count, (SELECT count(*) FROM deco.team_coaches tc WHERE tc.team_id = t.id) as coach_count FROM deco.teams t) t), '[]'::jsonb),
    'activeCoaches', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT p.id as coach_id, p.full_name, (SELECT count(*) FROM deco.coach_comments cc WHERE cc.coach_id = p.id) as comments_count, (SELECT count(*) FROM deco.coach_comments cc WHERE cc.coach_id = p.id AND cc.is_thumbs_up = true) as thumbs_ups, (SELECT count(*) FROM deco.coach_score_feedback csf WHERE csf.coach_id = p.id) as score_feedbacks FROM deco.profiles p WHERE p.role = 'coach' ORDER BY comments_count DESC) t), '[]'::jsonb)
  ) INTO coaches;

  SELECT jsonb_build_object(
    'sessionsTimeseries', COALESCE((SELECT jsonb_agg(row_to_json(t) ORDER BY t.date) FROM (SELECT date::date as date, count(*) as count FROM deco.scheduled_sessions WHERE date::date >= since::date GROUP BY 1) t), '[]'::jsonb),
    'completionRate', (SELECT jsonb_build_object('total', count(*), 'withReflection', count(*) FILTER (WHERE reflection_id IS NOT NULL), 'rate', round(count(*) FILTER (WHERE reflection_id IS NOT NULL)::numeric / GREATEST(count(*), 1) * 100, 1)) FROM deco.scheduled_sessions),
    'sessionTypes', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT session_type as type, count(*) as count FROM deco.scheduled_sessions GROUP BY 1) t), '[]'::jsonb),
    'goalSelectionUsage', (SELECT jsonb_build_object('totalSessions', (SELECT count(*) FROM deco.scheduled_sessions), 'withGoals', (SELECT count(DISTINCT session_id) FROM deco.session_goals), 'rate', round((SELECT count(DISTINCT session_id) FROM deco.session_goals)::numeric / GREATEST((SELECT count(*) FROM deco.scheduled_sessions), 1) * 100, 1)))
  ) INTO training;

  SELECT jsonb_build_object(
    'stages', jsonb_build_array(
      jsonb_build_object('label', 'Signed Up', 'value', (SELECT count(*) FROM deco.profiles WHERE role = 'athlete')),
      jsonb_build_object('label', 'Selected Skills', 'value', (SELECT count(DISTINCT athlete_id) FROM deco.athlete_selected_skills)),
      jsonb_build_object('label', 'Created Goal', 'value', (SELECT count(DISTINCT athlete_id) FROM deco.goals)),
      jsonb_build_object('label', 'First Reflection', 'value', (SELECT count(DISTINCT athlete_id) FROM deco.reflections)),
      jsonb_build_object('label', 'Earned XP', 'value', (SELECT count(DISTINCT athlete_id) FROM deco.xp_events)),
      jsonb_build_object('label', 'Retained 7d', 'value', (SELECT count(*) FROM deco.profiles WHERE role = 'athlete' AND last_active_at >= now() - interval '7 days'))
    )
  ) INTO funnel;

  SELECT jsonb_build_object(
    'userList', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT p.id, p.full_name, p.role, p.created_at, p.last_active_at, (SELECT count(*) FROM deco.goals g WHERE g.athlete_id = p.id) as goals_count, (SELECT count(*) FROM deco.reflections r WHERE r.athlete_id = p.id) as reflections_count FROM deco.profiles p ORDER BY p.created_at DESC LIMIT 100) t), '[]'::jsonb)
  ) INTO users_data;

  WITH athlete_activity AS (
    SELECT p.id, p.full_name, p.created_at, p.last_active_at, p.onboarding_completed,
      EXTRACT(day FROM now() - p.created_at)::int AS account_age_days,
      EXTRACT(day FROM now() - COALESCE(p.last_active_at, p.created_at))::int AS days_since_active,
      (SELECT count(*) FROM deco.goals g WHERE g.athlete_id = p.id) AS goals_count,
      (SELECT count(*) FROM deco.goals g WHERE g.athlete_id = p.id AND g.ai_analysis IS NOT NULL) AS ai_goals_count,
      (SELECT count(*) FROM deco.reflections r WHERE r.athlete_id = p.id) AS reflections_count,
      (SELECT count(DISTINCT skill_id) FROM deco.athlete_selected_skills s WHERE s.athlete_id = p.id) AS skills_selected,
      (SELECT coalesce(sum(xe.points), 0) FROM deco.xp_events xe WHERE xe.athlete_id = p.id) AS total_xp,
      (SELECT count(*) FROM deco.scheduled_sessions ss WHERE ss.athlete_id = p.id) AS sessions_count,
      (SELECT count(*) FROM deco.scheduled_sessions ss WHERE ss.athlete_id = p.id AND ss.reflection_id IS NOT NULL) AS sessions_completed,
      (SELECT count(*) FROM deco.athlete_achievements aa WHERE aa.athlete_id = p.id) AS achievements_count,
      (SELECT count(*) FROM deco.coach_comments cc WHERE cc.goal_id IN (SELECT id FROM deco.goals WHERE athlete_id = p.id)) AS coach_comments_received,
      (CASE WHEN EXISTS(SELECT 1 FROM deco.goals WHERE athlete_id = p.id) THEN 1 ELSE 0 END +
       CASE WHEN EXISTS(SELECT 1 FROM deco.reflections WHERE athlete_id = p.id) THEN 1 ELSE 0 END +
       CASE WHEN EXISTS(SELECT 1 FROM deco.athlete_selected_skills WHERE athlete_id = p.id) THEN 1 ELSE 0 END +
       CASE WHEN EXISTS(SELECT 1 FROM deco.scheduled_sessions WHERE athlete_id = p.id) THEN 1 ELSE 0 END +
       CASE WHEN EXISTS(SELECT 1 FROM deco.athlete_achievements WHERE athlete_id = p.id) THEN 1 ELSE 0 END) AS feature_breadth
    FROM deco.profiles p WHERE p.role = 'athlete'
  ),
  classified AS (
    SELECT *, CASE
      WHEN account_age_days < 14 THEN 'new'
      WHEN days_since_active > 14 OR last_active_at IS NULL THEN 'churned'
      WHEN days_since_active BETWEEN 7 AND 14 THEN 'at_risk'
      WHEN feature_breadth >= 3 THEN 'power'
      ELSE 'retained'
    END AS segment FROM athlete_activity
  )
  SELECT jsonb_build_object(
    'segmentCounts', COALESCE((SELECT jsonb_object_agg(segment, cnt) FROM (SELECT segment, count(*) as cnt FROM classified GROUP BY segment) t), '{}'::jsonb),
    'segmentAverages', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT segment, count(*) as user_count, round(avg(goals_count), 1) as avg_goals, round(avg(reflections_count), 1) as avg_reflections, round(avg(skills_selected), 1) as avg_skills, round(avg(sessions_count), 1) as avg_sessions, round(avg(total_xp), 0) as avg_xp, round(avg(achievements_count), 1) as avg_achievements, round(avg(feature_breadth), 1) as avg_feature_breadth, round(avg(ai_goals_count), 1) as avg_ai_goals, round(avg(coach_comments_received), 1) as avg_coach_feedback FROM classified GROUP BY segment ORDER BY CASE segment WHEN 'power' THEN 1 WHEN 'retained' THEN 2 WHEN 'at_risk' THEN 3 WHEN 'churned' THEN 4 WHEN 'new' THEN 5 END) t), '[]'::jsonb),
    'onboardingBySegment', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT segment, count(*) as total, round(100.0 * count(*) FILTER (WHERE onboarding_completed) / GREATEST(count(*), 1), 1) as pct_onboarded, round(100.0 * count(*) FILTER (WHERE skills_selected > 0) / GREATEST(count(*), 1), 1) as pct_selected_skills, round(100.0 * count(*) FILTER (WHERE goals_count > 0) / GREATEST(count(*), 1), 1) as pct_created_goal, round(100.0 * count(*) FILTER (WHERE reflections_count > 0) / GREATEST(count(*), 1), 1) as pct_reflected, round(100.0 * count(*) FILTER (WHERE sessions_count > 0) / GREATEST(count(*), 1), 1) as pct_scheduled_session, round(100.0 * count(*) FILTER (WHERE achievements_count > 0) / GREATEST(count(*), 1), 1) as pct_earned_achievement FROM classified GROUP BY segment ORDER BY CASE segment WHEN 'power' THEN 1 WHEN 'retained' THEN 2 WHEN 'at_risk' THEN 3 WHEN 'churned' THEN 4 WHEN 'new' THEN 5 END) t), '[]'::jsonb),
    'firstActionTimeline', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT segment, round(avg(first_goal_days), 1) as avg_days_to_first_goal, round(avg(first_reflection_days), 1) as avg_days_to_first_reflection, round(avg(first_session_days), 1) as avg_days_to_first_session FROM (SELECT c.id, c.segment, c.created_at, EXTRACT(epoch FROM ((SELECT min(g.created_at) FROM deco.goals g WHERE g.athlete_id = c.id) - c.created_at)) / 86400.0 as first_goal_days, EXTRACT(epoch FROM ((SELECT min(r.created_at) FROM deco.reflections r WHERE r.athlete_id = c.id) - c.created_at)) / 86400.0 as first_reflection_days, ((SELECT min(ss.date) FROM deco.scheduled_sessions ss WHERE ss.athlete_id = c.id) - c.created_at::date)::numeric as first_session_days FROM classified c) sub GROUP BY segment ORDER BY CASE segment WHEN 'power' THEN 1 WHEN 'retained' THEN 2 WHEN 'at_risk' THEN 3 WHEN 'churned' THEN 4 WHEN 'new' THEN 5 END) t), '[]'::jsonb),
    'featureCorrelation', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT feature, round(100.0 * retained_count / GREATEST(total_with_feature, 1), 1) as retention_rate_with, round(100.0 * retained_without / GREATEST(total_without_feature, 1), 1) as retention_rate_without, total_with_feature, total_without_feature FROM (
      SELECT 'Selected Skills' as feature, count(*) FILTER (WHERE skills_selected > 0) as total_with_feature, count(*) FILTER (WHERE skills_selected = 0) as total_without_feature, count(*) FILTER (WHERE skills_selected > 0 AND segment IN ('power','retained')) as retained_count, count(*) FILTER (WHERE skills_selected = 0 AND segment IN ('power','retained')) as retained_without FROM classified WHERE segment != 'new'
      UNION ALL SELECT 'Created Goal', count(*) FILTER (WHERE goals_count > 0), count(*) FILTER (WHERE goals_count = 0), count(*) FILTER (WHERE goals_count > 0 AND segment IN ('power','retained')), count(*) FILTER (WHERE goals_count = 0 AND segment IN ('power','retained')) FROM classified WHERE segment != 'new'
      UNION ALL SELECT 'Used AI Feedback', count(*) FILTER (WHERE ai_goals_count > 0), count(*) FILTER (WHERE ai_goals_count = 0), count(*) FILTER (WHERE ai_goals_count > 0 AND segment IN ('power','retained')), count(*) FILTER (WHERE ai_goals_count = 0 AND segment IN ('power','retained')) FROM classified WHERE segment != 'new'
      UNION ALL SELECT 'Wrote Reflection', count(*) FILTER (WHERE reflections_count > 0), count(*) FILTER (WHERE reflections_count = 0), count(*) FILTER (WHERE reflections_count > 0 AND segment IN ('power','retained')), count(*) FILTER (WHERE reflections_count = 0 AND segment IN ('power','retained')) FROM classified WHERE segment != 'new'
      UNION ALL SELECT 'Scheduled Session', count(*) FILTER (WHERE sessions_count > 0), count(*) FILTER (WHERE sessions_count = 0), count(*) FILTER (WHERE sessions_count > 0 AND segment IN ('power','retained')), count(*) FILTER (WHERE sessions_count = 0 AND segment IN ('power','retained')) FROM classified WHERE segment != 'new'
      UNION ALL SELECT 'Earned Achievement', count(*) FILTER (WHERE achievements_count > 0), count(*) FILTER (WHERE achievements_count = 0), count(*) FILTER (WHERE achievements_count > 0 AND segment IN ('power','retained')), count(*) FILTER (WHERE achievements_count = 0 AND segment IN ('power','retained')) FROM classified WHERE segment != 'new'
      UNION ALL SELECT 'Coach Feedback', count(*) FILTER (WHERE coach_comments_received > 0), count(*) FILTER (WHERE coach_comments_received = 0), count(*) FILTER (WHERE coach_comments_received > 0 AND segment IN ('power','retained')), count(*) FILTER (WHERE coach_comments_received = 0 AND segment IN ('power','retained')) FROM classified WHERE segment != 'new'
    ) sub ORDER BY retention_rate_with DESC NULLS LAST) t), '[]'::jsonb),
    'athleteList', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT id, full_name, segment, account_age_days, days_since_active, goals_count, reflections_count, skills_selected, sessions_count, total_xp, achievements_count, feature_breadth FROM classified ORDER BY total_xp DESC LIMIT 50) t), '[]'::jsonb)
  ) INTO power_users;

  result := jsonb_build_object('overview', overview, 'engagement', engagement, 'gamification', gamification, 'coaches', coaches, 'training', training, 'funnel', funnel, 'users', users_data, 'powerUsers', power_users);
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION deco.get_goal_insights()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'deco', 'public' AS $function$
BEGIN
  IF NOT deco.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN jsonb_build_object(
    'goalsBySkill', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT sd.label as skill, sd.category, count(*) as count FROM deco.goals g JOIN deco.skill_definitions sd ON sd.id = g.skill_id GROUP BY sd.label, sd.category ORDER BY count DESC) t), '[]'::jsonb),
    'goalsByCategory', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT sd.category, count(*) as count FROM deco.goals g JOIN deco.skill_definitions sd ON sd.id = g.skill_id GROUP BY sd.category ORDER BY count DESC) t), '[]'::jsonb),
    'goalsByStatus', (SELECT jsonb_build_object('active', count(*) FILTER (WHERE status = 'active'), 'achieved', count(*) FILTER (WHERE status = 'achieved'), 'abandoned', count(*) FILTER (WHERE status = 'abandoned')) FROM deco.goals),
    'aiScoreDistribution', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT width_bucket((ai_analysis->>'specificity_score')::numeric, 1, 10, 10) as bucket, count(*) as count FROM deco.goals WHERE ai_analysis IS NOT NULL AND ai_analysis->>'specificity_score' IS NOT NULL GROUP BY 1 ORDER BY 1) t), '[]'::jsonb),
    'goalQuality', (SELECT jsonb_build_object('total', count(*), 'withAi', count(*) FILTER (WHERE ai_analysis IS NOT NULL), 'highQuality', count(*) FILTER (WHERE ai_analysis IS NOT NULL AND (ai_analysis->>'specificity_score')::numeric >= 7), 'mediumQuality', count(*) FILTER (WHERE ai_analysis IS NOT NULL AND (ai_analysis->>'specificity_score')::numeric BETWEEN 5 AND 6.9), 'lowQuality', count(*) FILTER (WHERE ai_analysis IS NOT NULL AND (ai_analysis->>'specificity_score')::numeric < 5), 'avgSpecificity', round(avg((ai_analysis->>'specificity_score')::numeric) FILTER (WHERE ai_analysis IS NOT NULL), 1), 'avgMeasurability', round(avg((ai_analysis->>'measurability_score')::numeric) FILTER (WHERE ai_analysis IS NOT NULL), 1), 'avgChallenge', round(avg((ai_analysis->>'challenge_score')::numeric) FILTER (WHERE ai_analysis IS NOT NULL), 1)) FROM deco.goals),
    'reflectionRatings', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT rg.rating, count(*) as count FROM deco.reflection_goals rg GROUP BY rg.rating ORDER BY rg.rating) t), '[]'::jsonb),
    'coachFeedbackSummary', (SELECT jsonb_build_object('totalComments', count(*), 'thumbsUpOnly', count(*) FILTER (WHERE is_thumbs_up = true AND (content IS NULL OR length(content) = 0)), 'withText', count(*) FILTER (WHERE content IS NOT NULL AND length(content) > 0), 'avgPerGoal', round(count(*)::numeric / GREATEST((SELECT count(*) FROM deco.goals), 1), 2)) FROM deco.coach_comments),
    'topGoalTexts', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT g.id, g.title, g.description, g.status, g.created_at, p.full_name as athlete_name, sd.label as skill_label, sd.category as skill_category, g.ai_feedback, (g.ai_analysis->>'specificity_score')::numeric as specificity, (g.ai_analysis->>'measurability_score')::numeric as measurability, (g.ai_analysis->>'challenge_score')::numeric as challenge, (SELECT count(*) FROM deco.reflection_goals rg WHERE rg.goal_id = g.id) as reflection_count, (SELECT round(avg(rg.rating), 1) FROM deco.reflection_goals rg WHERE rg.goal_id = g.id) as avg_rating, (SELECT count(*) FROM deco.coach_comments cc WHERE cc.goal_id = g.id) as coach_comments_count, (SELECT bool_or(cc.is_thumbs_up) FROM deco.coach_comments cc WHERE cc.goal_id = g.id) as has_thumbs_up FROM deco.goals g JOIN deco.profiles p ON p.id = g.athlete_id LEFT JOIN deco.skill_definitions sd ON sd.id = g.skill_id ORDER BY g.created_at DESC LIMIT 50) t), '[]'::jsonb),
    'reflectionsList', COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT r.id, r.session_type, r.notes, r.created_at, p.full_name as athlete_name, (SELECT jsonb_agg(jsonb_build_object('goal_title', g.title, 'rating', rg.rating)) FROM deco.reflection_goals rg JOIN deco.goals g ON g.id = rg.goal_id WHERE rg.reflection_id = r.id) as goal_ratings FROM deco.reflections r JOIN deco.profiles p ON p.id = r.athlete_id ORDER BY r.created_at DESC LIMIT 30) t), '[]'::jsonb)
  );
END;
$function$;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- profiles
CREATE POLICY "Users can read own profile" ON deco.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON deco.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON deco.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Coaches can read team athlete profiles" ON deco.profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_members tm JOIN deco.team_coaches tc ON tc.team_id = tm.team_id WHERE tm.athlete_id = profiles.id AND tc.coach_id = auth.uid()));

-- skill_definitions
CREATE POLICY "Read predefined and own custom skills" ON deco.skill_definitions FOR SELECT TO authenticated USING (created_by_athlete_id IS NULL OR created_by_athlete_id = auth.uid());
CREATE POLICY "Athletes can create custom skills" ON deco.skill_definitions FOR INSERT TO authenticated WITH CHECK (created_by_athlete_id = auth.uid());
CREATE POLICY "Athletes can delete custom skills" ON deco.skill_definitions FOR DELETE TO authenticated USING (created_by_athlete_id = auth.uid());

-- athlete_attributes
CREATE POLICY "Athletes can manage own attributes" ON deco.athlete_attributes FOR ALL USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "Coaches can read team athlete attributes" ON deco.athlete_attributes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_members tm JOIN deco.team_coaches tc ON tc.team_id = tm.team_id WHERE tm.athlete_id = athlete_attributes.athlete_id AND tc.coach_id = auth.uid()));

-- athlete_selected_skills
CREATE POLICY "Athletes manage own selected skills" ON deco.athlete_selected_skills FOR ALL TO authenticated USING (athlete_id = auth.uid());
CREATE POLICY "Coaches view team members selected skills" ON deco.athlete_selected_skills FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_members tm JOIN deco.team_coaches tc ON tc.team_id = tm.team_id WHERE tm.athlete_id = athlete_selected_skills.athlete_id AND tc.coach_id = auth.uid()));

-- athlete_skill_scores
CREATE POLICY "Athletes manage own skill scores" ON deco.athlete_skill_scores FOR ALL TO authenticated USING (athlete_id = auth.uid());
CREATE POLICY "Coaches view team members skill scores" ON deco.athlete_skill_scores FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_members tm JOIN deco.team_coaches tc ON tc.team_id = tm.team_id WHERE tm.athlete_id = athlete_skill_scores.athlete_id AND tc.coach_id = auth.uid()));

-- goals
CREATE POLICY "Athletes can manage own goals" ON deco.goals FOR ALL USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "Coaches can read team athlete goals" ON deco.goals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_members tm JOIN deco.team_coaches tc ON tc.team_id = tm.team_id WHERE tm.athlete_id = goals.athlete_id AND tc.coach_id = auth.uid()));

-- coach_comments
CREATE POLICY "Coaches can create comments on team athlete goals" ON deco.coach_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = coach_id AND EXISTS (SELECT 1 FROM deco.goals g JOIN deco.team_members tm ON tm.athlete_id = g.athlete_id JOIN deco.team_coaches tc ON tc.team_id = tm.team_id WHERE g.id = coach_comments.goal_id AND tc.coach_id = auth.uid()));
CREATE POLICY "Coaches can read own comments" ON deco.coach_comments FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can update own comments" ON deco.coach_comments FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can delete own comments" ON deco.coach_comments FOR DELETE USING (auth.uid() = coach_id);
CREATE POLICY "Athletes can read comments on own goals" ON deco.coach_comments FOR SELECT USING (EXISTS (SELECT 1 FROM deco.goals g WHERE g.id = coach_comments.goal_id AND g.athlete_id = auth.uid()));
CREATE POLICY "Athletes can mark feedback as seen" ON deco.coach_comments FOR UPDATE USING (EXISTS (SELECT 1 FROM deco.goals g WHERE g.id = coach_comments.goal_id AND g.athlete_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM deco.goals g WHERE g.id = coach_comments.goal_id AND g.athlete_id = auth.uid()));

-- coach_score_feedback
CREATE POLICY "coach_score_feedback_select" ON deco.coach_score_feedback FOR SELECT USING (auth.uid() = coach_id OR auth.uid() = athlete_id);
CREATE POLICY "coach_score_feedback_insert" ON deco.coach_score_feedback FOR INSERT WITH CHECK (auth.uid() = coach_id AND EXISTS (SELECT 1 FROM deco.team_coaches tc JOIN deco.team_members tm ON tm.team_id = tc.team_id WHERE tc.coach_id = auth.uid() AND tm.athlete_id = coach_score_feedback.athlete_id));
CREATE POLICY "coach_score_feedback_update" ON deco.coach_score_feedback FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "coach_score_feedback_delete" ON deco.coach_score_feedback FOR DELETE USING (auth.uid() = coach_id);

-- reflections
CREATE POLICY "Athletes can manage own reflections" ON deco.reflections FOR ALL USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "Coaches can read team athlete reflections" ON deco.reflections FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_members tm JOIN deco.team_coaches tc ON tc.team_id = tm.team_id WHERE tm.athlete_id = reflections.athlete_id AND tc.coach_id = auth.uid()));

-- reflection_goals
CREATE POLICY "Athletes can manage own reflection goals" ON deco.reflection_goals FOR ALL USING (EXISTS (SELECT 1 FROM deco.reflections r WHERE r.id = reflection_goals.reflection_id AND r.athlete_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM deco.reflections r WHERE r.id = reflection_goals.reflection_id AND r.athlete_id = auth.uid()));
CREATE POLICY "Coaches can read team athlete reflection goals" ON deco.reflection_goals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.reflections r JOIN deco.team_members tm ON tm.athlete_id = r.athlete_id JOIN deco.team_coaches tc ON tc.team_id = tm.team_id WHERE r.id = reflection_goals.reflection_id AND tc.coach_id = auth.uid()));

-- teams
CREATE POLICY "Anyone can read teams" ON deco.teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON deco.teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Coaches can update own teams" ON deco.teams FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_coaches tc WHERE tc.team_id = teams.id AND tc.coach_id = auth.uid()));
CREATE POLICY "Coaches can delete own teams" ON deco.teams FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_coaches tc WHERE tc.team_id = teams.id AND tc.coach_id = auth.uid()));

-- team_members
CREATE POLICY "Athletes can see own memberships" ON deco.team_members FOR SELECT USING (auth.uid() = athlete_id);
CREATE POLICY "Athletes can join teams" ON deco.team_members FOR INSERT WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "Athletes can leave teams" ON deco.team_members FOR DELETE USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches can see their team members" ON deco.team_members FOR SELECT TO authenticated USING (deco.is_team_coach(team_id, auth.uid()));

-- team_coaches
CREATE POLICY "Coaches see own team memberships" ON deco.team_coaches FOR SELECT TO authenticated USING (coach_id = auth.uid());
CREATE POLICY "Coaches can join teams" ON deco.team_coaches FOR INSERT TO authenticated WITH CHECK (coach_id = auth.uid());
CREATE POLICY "Coaches can leave teams" ON deco.team_coaches FOR DELETE TO authenticated USING (coach_id = auth.uid());
CREATE POLICY "Athletes see coaches on own teams" ON deco.team_coaches FOR SELECT TO authenticated USING (deco.is_team_member(team_id, auth.uid()));

-- training_schedules
CREATE POLICY "Athletes manage own training schedules" ON deco.training_schedules FOR ALL TO authenticated USING (athlete_id = auth.uid());
CREATE POLICY "Coaches view team members training schedules" ON deco.training_schedules FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_members tm JOIN deco.team_coaches tc ON tc.team_id = tm.team_id WHERE tm.athlete_id = training_schedules.athlete_id AND tc.coach_id = auth.uid()));

-- scheduled_sessions
CREATE POLICY "Athletes manage own scheduled sessions" ON deco.scheduled_sessions FOR ALL TO authenticated USING (athlete_id = auth.uid());
CREATE POLICY "Coaches view team members scheduled sessions" ON deco.scheduled_sessions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_members tm JOIN deco.team_coaches tc ON tc.team_id = tm.team_id WHERE tm.athlete_id = scheduled_sessions.athlete_id AND tc.coach_id = auth.uid()));

-- session_goals
CREATE POLICY "session_goals_athlete" ON deco.session_goals FOR ALL USING (EXISTS (SELECT 1 FROM deco.scheduled_sessions ss WHERE ss.id = session_goals.session_id AND ss.athlete_id = auth.uid()));

-- match_dates
CREATE POLICY "Athletes manage own match dates" ON deco.match_dates FOR ALL TO authenticated USING (athlete_id = auth.uid());

-- achievements
CREATE POLICY "Anyone can read achievements" ON deco.achievements FOR SELECT TO authenticated USING (true);

-- athlete_achievements
CREATE POLICY "Athletes see own achievements" ON deco.athlete_achievements FOR SELECT TO authenticated USING (athlete_id = auth.uid());
CREATE POLICY "Athletes earn achievements" ON deco.athlete_achievements FOR INSERT TO authenticated WITH CHECK (athlete_id = auth.uid());
CREATE POLICY "Athletes update own achievements" ON deco.athlete_achievements FOR UPDATE USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());
CREATE POLICY "Teammates see achievements" ON deco.athlete_achievements FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_members my_tm JOIN deco.team_members their_tm ON my_tm.team_id = their_tm.team_id WHERE my_tm.athlete_id = auth.uid() AND their_tm.athlete_id = athlete_achievements.athlete_id));

-- xp_events
CREATE POLICY "Athletes see own XP" ON deco.xp_events FOR SELECT TO authenticated USING (athlete_id = auth.uid());
CREATE POLICY "Athletes earn XP" ON deco.xp_events FOR INSERT TO authenticated WITH CHECK (athlete_id = auth.uid());
CREATE POLICY "Coaches see team member XP" ON deco.xp_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_coaches tc JOIN deco.team_members tm ON tc.team_id = tm.team_id WHERE tc.coach_id = auth.uid() AND tm.athlete_id = xp_events.athlete_id));
CREATE POLICY "Teammates see XP" ON deco.xp_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM deco.team_members my_tm JOIN deco.team_members their_tm ON my_tm.team_id = their_tm.team_id WHERE my_tm.athlete_id = auth.uid() AND their_tm.athlete_id = xp_events.athlete_id));

-- ============================================================================
-- 6. SEED DATA: achievements
-- ============================================================================

INSERT INTO deco.achievements (key, category, icon, threshold, xp_reward, display_order) VALUES
  ('first_goal', 'goals', 'flag-outline', 1, 25, 1),
  ('five_goals', 'goals', 'flag-outline', 5, 50, 2),
  ('ten_goals', 'goals', 'flag-outline', 10, 100, 3),
  ('first_achieved', 'goals', 'trophy-outline', 1, 50, 4),
  ('five_achieved', 'goals', 'trophy-outline', 5, 100, 5),
  ('ten_achieved', 'goals', 'trophy-outline', 10, 200, 6),
  ('first_reflection', 'reflections', 'journal-outline', 1, 25, 7),
  ('ten_reflections', 'reflections', 'journal-outline', 10, 75, 8),
  ('fifty_reflections', 'reflections', 'journal-outline', 50, 200, 9),
  ('first_growth', 'growth', 'trending-up', 1, 50, 10),
  ('five_growth', 'growth', 'trending-up', 5, 150, 11),
  ('sharp_goal', 'quality', 'diamond-outline', 8, 50, 12),
  ('perfect_goal', 'quality', 'diamond-outline', 9, 100, 13),
  ('journaler', 'quality', 'create-outline', 10, 75, 14),
  ('streak_3', 'streaks', 'flame-outline', 3, 25, 15),
  ('streak_7', 'streaks', 'flame-outline', 7, 75, 16),
  ('streak_14', 'streaks', 'flame-outline', 14, 150, 17),
  ('streak_30', 'streaks', 'flame-outline', 30, 300, 18);

-- ============================================================================
-- 7. SEED DATA: skill_definitions (predefined, no athlete owner)
-- ============================================================================

INSERT INTO deco.skill_definitions (key, label, description, category, icon, display_order, position_type) VALUES
  -- Technical (outfield)
  ('passen', 'Passen', 'Duwpass, flats, nauwkeurigheid, snelheid', 'technical', 'swap-horizontal-outline', 1, 'outfield'),
  ('aannemen', 'Aannemen', 'Forehand/backhand, open, gesloten, stuiterbal, hoge bal', 'technical', 'hand-left-outline', 2, 'outfield'),
  ('slaan_forehand', 'Slaan forehand', 'Forehand slagtechniek', 'technical', 'flash-outline', 3, 'outfield'),
  ('slaan_backhand', 'Slaan backhand', 'Backhand slagtechniek', 'technical', 'flash-outline', 4, 'outfield'),
  ('individuele_actie', 'Individuele actie', 'Pull, turn, lift, 3D skills', 'technical', 'git-branch-outline', 5, 'outfield'),
  ('verdedigende_tackle', 'Verdedigende tackle', 'Blocktackle, jab, timing, voetenwerk', 'technical', 'shield-outline', 6, 'outfield'),
  ('interceptie', 'Interceptie', 'Positionering, timing', 'technical', 'locate-outline', 7, 'outfield'),
  ('scoop', 'Scoop', 'Scoop techniek', 'technical', 'arrow-up-outline', 8, 'outfield'),
  ('sleeppush', 'Sleeppush', 'Sleeppush techniek', 'technical', 'flame-outline', 9, 'outfield'),
  ('aangeven_sc', 'Aangeven strafcorner', 'Strafcorner aangeven', 'technical', 'flag-outline', 10, 'outfield'),
  ('stoppen_sc', 'Stoppen strafcorner', 'Strafcorner stoppen', 'technical', 'hand-right-outline', 11, 'outfield'),
  -- Technical (goalkeeper)
  ('grond_technieken', 'Grond technieken', 'Blocksliding, headfirst', 'technical', 'shield-outline', 1, 'goalkeeper'),
  ('stick_techniek', 'Stick techniek', 'Sticktechniek als keeper', 'technical', 'hand-right-outline', 2, 'goalkeeper'),
  ('sc_keepen', 'Strafcorner keepen', 'Keepen bij strafcorners', 'technical', 'flag-outline', 3, 'goalkeeper'),
  ('laag_uitstappen', 'Laag uitstappen', 'Laag uitstappen op de aanvaller', 'technical', 'arrow-down-outline', 4, 'goalkeeper'),
  ('hoog_uitstappen', 'Hoog uitstappen', 'Hoog uitstappen op de aanvaller', 'technical', 'arrow-up-outline', 5, 'goalkeeper'),
  ('duiken', 'Duiken', 'Duiktechniek voor reddingen', 'technical', 'body-outline', 6, 'goalkeeper'),
  ('gk_rebound_tech', 'Rebound verwerken', 'Technisch omgaan met rebounds', 'technical', 'reload-outline', 7, 'goalkeeper'),
  -- Tactical (outfield)
  ('overzicht', 'Overzicht aan de bal', 'Overzicht houden wanneer je aan de bal bent', 'tactical', 'eye-outline', 1, 'outfield'),
  ('handelingssnelheid', 'Handelingssnelheid', 'Snel handelen aan de bal', 'tactical', 'speedometer-outline', 2, 'outfield'),
  ('positionering', 'Positionering', 'Juiste positie kiezen op het veld', 'tactical', 'locate-outline', 3, 'outfield'),
  ('timing', 'Timing', 'Timing van acties en bewegingen', 'tactical', 'time-outline', 4, 'outfield'),
  ('vrijlopen', 'Vrijlopen', 'Vrijlopen van tegenstander', 'tactical', 'walk-outline', 5, 'outfield'),
  ('druk_zetten', 'Druk zetten', 'Druk zetten op tegenstander', 'tactical', 'push-outline', 6, 'outfield'),
  ('scannen', 'Scannen', 'Omgeving scannen voor en tijdens balcontact', 'tactical', 'scan-outline', 7, 'outfield'),
  ('overtal_herkennen', 'Overtal herkennen', 'Overtalsituaties herkennen en benutten', 'tactical', 'people-outline', 8, 'outfield'),
  ('omschakeling_aanval', 'Omschakeling aanvallend', 'Snel omschakelen naar aanval', 'tactical', 'arrow-forward-outline', 9, 'outfield'),
  ('omschakeling_verdediging', 'Omschakeling verdedigend', 'Snel omschakelen naar verdediging', 'tactical', 'arrow-back-outline', 10, 'outfield'),
  -- Tactical (goalkeeper)
  ('gk_positionering', 'Positionering', 'Juiste positie in het doel kiezen', 'tactical', 'locate-outline', 1, 'goalkeeper'),
  ('keuzes_uitkomen', 'Keuzes maken in uitkomen', 'Wanneer wel en niet uitkomen', 'tactical', 'bulb-outline', 2, 'goalkeeper'),
  ('gk_1v1', '1 v 1', 'Een-tegen-een situaties als keeper', 'tactical', 'person-outline', 3, 'goalkeeper'),
  ('gk_rebound_tact', 'Rebound verwerken', 'Tactisch omgaan met reboundsituaties', 'tactical', 'reload-outline', 4, 'goalkeeper'),
  ('situatie_lezen', 'Situatie lezen', 'Het spel lezen en anticiperen', 'tactical', 'eye-outline', 5, 'goalkeeper'),
  -- Tactical (both)
  ('overview', 'Overzicht', 'Kijkgedrag met de bal: hoofd omhoog, opties zien, speelveld overzien terwijl je in balbezit bent', 'tactical', 'eye-outline', 9, 'both'),
  ('scanning', 'Scannen', 'Kijkgedrag zonder de bal: om je heen kijken, informatie verzamelen voordat je de bal ontvangt', 'tactical', 'scan-outline', 10, 'both'),
  -- Physical (outfield)
  ('sprintsnelheid', 'Sprintsnelheid', 'Acceleratie, topsnelheid, herhaalde sprints', 'physical', 'speedometer-outline', 1, 'outfield'),
  ('explosiviteit', 'Explosiviteit', 'Explosieve starts en acties', 'physical', 'rocket-outline', 2, 'outfield'),
  ('wendbaarheid', 'Wendbaarheid', 'Richtingsverandering, voetenwerk', 'physical', 'navigate-outline', 3, 'outfield'),
  ('afremmen', 'Afremmen', 'Gecontroleerd afremmen en stoppen', 'physical', 'stop-circle-outline', 4, 'outfield'),
  ('kracht', 'Kracht', 'Kracht in duels en acties', 'physical', 'barbell-outline', 5, 'outfield'),
  ('conditie', 'Conditie', 'Uithoudingsvermogen en fitheid', 'physical', 'heart-outline', 6, 'outfield'),
  ('lenigheid', 'Lenigheid', 'Flexibiliteit en bewegingsbereik', 'physical', 'body-outline', 7, 'outfield'),
  ('schijnbewegingen', 'Schijnbewegingen', 'Lichaamsbewegingen om tegenstander te misleiden', 'physical', 'git-branch-outline', 8, 'outfield'),
  -- Physical (goalkeeper)
  ('reactiesnelheid', 'Reactiesnelheid', 'Snel reageren op schoten en acties', 'physical', 'flash-outline', 2, 'goalkeeper'),
  ('snel_opstaan', 'Snel opstaan', 'Snel weer overeind komen na een redding', 'physical', 'arrow-up-outline', 3, 'goalkeeper'),
  ('gk_voetenwerk', 'Voetenwerk', 'Voetenwerk en positionering in het doel', 'physical', 'footsteps-outline', 4, 'goalkeeper'),
  -- Physical (both)
  ('balans', 'Balans', 'Evenwicht en stabiliteit', 'physical', 'body-outline', 9, 'both'),
  -- Mental (both)
  ('omgaan_met_druk', 'Omgaan met druk', 'Rustig blijven onder druk', 'mental', 'diamond-outline', 1, 'both'),
  ('veerkracht', 'Veerkracht', 'Omgaan met tegenslag en fouten', 'mental', 'fitness-outline', 2, 'both'),
  ('focus', 'Focus', 'Concentratie vasthouden', 'mental', 'eye-outline', 3, 'both'),
  ('coachen', 'Coachen', 'Teamgenoten aansturen op het veld', 'mental', 'chatbubbles-outline', 4, 'both'),
  ('zelfvertrouwen', 'Zelfvertrouwen', 'Geloof in eigen kunnen', 'mental', 'star-outline', 5, 'both'),
  ('positiviteit', 'Positiviteit', 'Positieve instelling houden', 'mental', 'happy-outline', 6, 'both'),
  -- Mental (outfield)
  ('doorzettingsvermogen', 'Doorzettingsvermogen', 'Volhouden en niet opgeven', 'mental', 'fitness-outline', 7, 'outfield'),
  ('lef_hebben', 'Lef hebben', 'Durven risico te nemen', 'mental', 'flame-outline', 8, 'outfield'),
  ('teamplayer', 'Teamplayer zijn', 'Samenwerken en teambelang voorop stellen', 'mental', 'people-outline', 9, 'outfield');

-- ============================================================================
-- DONE! Now:
-- 1. Register your admin account in the app
-- 2. Run: UPDATE deco.profiles SET is_admin = true WHERE id = '<your-user-id>';
-- ============================================================================
