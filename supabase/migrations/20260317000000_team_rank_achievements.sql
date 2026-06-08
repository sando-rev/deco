-- Add team ranking achievements
INSERT INTO deco.achievements (id, key, category, icon, threshold, xp_reward, display_order) VALUES
  (gen_random_uuid(), 'top_3_team', 'ranking', 'podium-outline', 1, 50, 20),
  (gen_random_uuid(), 'number_1_team', 'ranking', 'trophy', 1, 100, 21);
