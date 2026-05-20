-- ─────────────────────────────────────────────────────────────────────────────
-- Atomic first-admin bootstrap for service-role-only admin initialization
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(
  bootstrap_user_id UUID,
  bootstrap_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('public.bootstrap_first_admin', 0));

  IF EXISTS (SELECT 1 FROM public.admin_users) THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.admin_users (id, email)
  VALUES (bootstrap_user_id, bootstrap_email)
  ON CONFLICT (id) DO NOTHING;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_admin(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(UUID, TEXT) TO service_role;
