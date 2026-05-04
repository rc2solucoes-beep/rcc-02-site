-- ─────────────────────────────────────────────────────────────────────────────
-- Admin Users — sistema de roles para autorização
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_users (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS admin_users_email_idx ON public.admin_users (email);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only service role can manage admin users
CREATE POLICY "Admin users table is protected"
  ON public.admin_users FOR ALL
  USING (false)
  WITH CHECK (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- Update Posts RLS — only admins can modify
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users have full access to posts" ON posts;

CREATE POLICY "Only admins can modify posts"
  ON posts FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND auth.uid() IN (SELECT id FROM public.admin_users)
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() IN (SELECT id FROM public.admin_users)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Update Settings RLS — only admins can modify
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can modify settings" ON settings;

CREATE POLICY "Only admins can modify settings"
  ON settings FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND auth.uid() IN (SELECT id FROM public.admin_users)
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() IN (SELECT id FROM public.admin_users)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Update Leads RLS — only admins can read/update
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "leads_auth_select" ON public.leads;
DROP POLICY IF EXISTS "leads_auth_update" ON public.leads;

CREATE POLICY "Only admins can read leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.admin_users));

CREATE POLICY "Only admins can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.admin_users));
