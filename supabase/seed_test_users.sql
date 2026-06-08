-- Create test users for Playwright tests

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'test-playwright@deco.app',
  crypt('TestPass123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test Athlete"}',
  'authenticated', 'authenticated', now(), now()
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('TestPass123!', gen_salt('bf'));

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'test-coach@deco.app',
  crypt('TestPass123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test Coach"}',
  'authenticated', 'authenticated', now(), now()
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('TestPass123!', gen_salt('bf'));

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub','a0000000-0000-0000-0000-000000000001','email','test-playwright@deco.app'),
  'email', 'a0000000-0000-0000-0000-000000000001', now(), now(), now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub','c0000000-0000-0000-0000-000000000001','email','test-coach@deco.app'),
  'email', 'c0000000-0000-0000-0000-000000000001', now(), now(), now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

INSERT INTO deco.profiles (id, role, full_name, sport, onboarding_completed)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'athlete', 'Test Athlete', 'field_hockey', true),
  ('c0000000-0000-0000-0000-000000000001', 'coach', 'Test Coach', 'field_hockey', true)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

INSERT INTO deco.teams (id, name, invite_code)
VALUES ('00000000-0000-0000-0000-000000000099', 'Test Team PW', 'PWTEST')
ON CONFLICT (id) DO NOTHING;

INSERT INTO deco.team_members (team_id, athlete_id)
VALUES ('00000000-0000-0000-0000-000000000099', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO deco.team_coaches (team_id, coach_id)
VALUES ('00000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO deco.goals (id, athlete_id, title, status)
VALUES ('00000000-0000-0000-0000-000000000088', 'a0000000-0000-0000-0000-000000000001', 'Test Goal', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO deco.xp_events (athlete_id, event_type, points)
VALUES ('a0000000-0000-0000-0000-000000000001', 'goal_created', 25);
