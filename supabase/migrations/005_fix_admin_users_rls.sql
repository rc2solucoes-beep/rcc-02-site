-- ─────────────────────────────────────────────────────────────────────────────
-- Fix Admin Users RLS — allow admins to verify their own admin status
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Admin users table is protected" ON public.admin_users;

-- Authenticated users can SELECT only their own admin record (if they are admin)
CREATE POLICY "Admin users - can read own admin status"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Block INSERT for everyone (service role bypasses this anyway)
CREATE POLICY "Admin users - block insert"
  ON public.admin_users FOR INSERT
  WITH CHECK (false);

-- Block UPDATE for everyone
CREATE POLICY "Admin users - block update"
  ON public.admin_users FOR UPDATE
  USING (false);

-- Block DELETE for everyone
CREATE POLICY "Admin users - block delete"
  ON public.admin_users FOR DELETE
  USING (false);
