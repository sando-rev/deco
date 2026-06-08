-- Migration: blog_posts table in deco schema
-- Stores blog posts editable from the admin dashboard.
-- Static blog posts in /landing/app/blog/ continue to work as fallback.

CREATE TABLE deco.blog_posts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text        UNIQUE NOT NULL,
  title      text        NOT NULL,
  excerpt    text        NOT NULL DEFAULT '',
  author     text        NOT NULL DEFAULT 'Deco Team',
  content    text        NOT NULL DEFAULT '',
  published  boolean     NOT NULL DEFAULT false,
  date       date        NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION deco.touch_blog_posts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON deco.blog_posts
  FOR EACH ROW EXECUTE FUNCTION deco.touch_blog_posts();

-- RLS enabled; service role bypasses all policies
ALTER TABLE deco.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON deco.blog_posts
  FOR ALL USING (true) WITH CHECK (true);
