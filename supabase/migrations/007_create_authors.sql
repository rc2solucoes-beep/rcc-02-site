-- ─────────────────────────────────────────────────────────────────────────────
-- Create authors table for post attribution
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  photo_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS authors_name_idx ON public.authors (name);

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can read authors" ON public.authors;
CREATE POLICY "Only admins can read authors"
  ON public.authors FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.admin_users));

DROP POLICY IF EXISTS "Only admins can insert authors" ON public.authors;
CREATE POLICY "Only admins can insert authors"
  ON public.authors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM public.admin_users));

DROP POLICY IF EXISTS "Only admins can update authors" ON public.authors;
CREATE POLICY "Only admins can update authors"
  ON public.authors FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.admin_users));

DROP POLICY IF EXISTS "Only admins can delete authors" ON public.authors;
CREATE POLICY "Only admins can delete authors"
  ON public.authors FOR DELETE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.admin_users));
