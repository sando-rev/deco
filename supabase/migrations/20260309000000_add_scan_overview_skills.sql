-- Migration: Add overview and scanning skill definitions
-- Overview (Overzicht) = looking behavior WITH the ball (kijkgedrag mét de bal)
-- Scanning (Scannen) = looking behavior WITHOUT the ball (kijkgedrag zonder de bal)

INSERT INTO deco.skill_definitions (key, label, description, category, icon, display_order) VALUES
  ('overview', 'Overzicht', 'Kijkgedrag mét de bal: hoofd omhoog, opties zien, speelveld overzien terwijl je in balbezit bent', 'tactical', 'eye-outline', 9),
  ('scanning', 'Scannen', 'Kijkgedrag zonder de bal: om je heen kijken, informatie verzamelen vóórdat je de bal ontvangt', 'tactical', 'scan-outline', 10)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;
