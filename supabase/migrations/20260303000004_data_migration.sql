-- Migration: Backfill existing athlete data into new skill tables

-- Map old fixed attributes to new skill definitions and create selected skills + scores
-- for all existing athletes who have completed onboarding

DO $$
DECLARE
  attr_map jsonb := '{
    "dribbling": "ball_carrying",
    "passing": "passing",
    "shooting": "shooting",
    "defending": "jab_tackle",
    "fitness": "endurance",
    "game_insight": "decision_making",
    "communication": "communication",
    "mental_strength": "resilience"
  }';
  old_attr text;
  new_key text;
  skill_uuid uuid;
  athlete record;
  attrs record;
BEGIN
  -- For each mapping of old attribute -> new skill key
  FOR old_attr, new_key IN SELECT * FROM jsonb_each_text(attr_map)
  LOOP
    -- Get the skill_definition id for this new key
    SELECT id INTO skill_uuid FROM deco.skill_definitions WHERE key = new_key;

    IF skill_uuid IS NULL THEN
      RAISE NOTICE 'Skill definition not found for key: %', new_key;
      CONTINUE;
    END IF;

    -- For each athlete who has attributes, create selected skill entries
    INSERT INTO deco.athlete_selected_skills (athlete_id, skill_id)
    SELECT DISTINCT aa.athlete_id, skill_uuid
    FROM deco.athlete_attributes aa
    ON CONFLICT (athlete_id, skill_id) DO NOTHING;

    -- For each athlete_attributes row, create a skill score entry
    -- We use dynamic SQL because column names come from the mapping
    EXECUTE format(
      'INSERT INTO deco.athlete_skill_scores (athlete_id, skill_id, score, assessed_at)
       SELECT athlete_id, %L::uuid, %I::int, assessed_at
       FROM deco.athlete_attributes
       WHERE %I IS NOT NULL',
      skill_uuid, old_attr, old_attr
    );
  END LOOP;

  -- Backfill goals.skill_id from goals.attribute
  FOR old_attr, new_key IN SELECT * FROM jsonb_each_text(attr_map)
  LOOP
    SELECT id INTO skill_uuid FROM deco.skill_definitions WHERE key = new_key;
    IF skill_uuid IS NOT NULL THEN
      UPDATE deco.goals
      SET skill_id = skill_uuid
      WHERE attribute = old_attr AND skill_id IS NULL;
    END IF;
  END LOOP;
END $$;
