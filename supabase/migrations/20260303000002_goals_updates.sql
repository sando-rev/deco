-- Migration: Update goals table for new goal setting flow

-- Add skill_id reference (nullable for backward compat)
ALTER TABLE deco.goals ADD COLUMN IF NOT EXISTS skill_id uuid REFERENCES deco.skill_definitions(id);

-- Add structured AI analysis column
ALTER TABLE deco.goals ADD COLUMN IF NOT EXISTS ai_analysis jsonb;

-- Make attribute nullable (was required for old flow)
ALTER TABLE deco.goals ALTER COLUMN attribute DROP NOT NULL;

-- Make deadline nullable (removed from creation flow)
ALTER TABLE deco.goals ALTER COLUMN deadline DROP NOT NULL;
