CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  event TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',

  actor_user_id UUID NULL,
  actor_email_hash TEXT NULL,
  actor_type TEXT NOT NULL DEFAULT 'unknown',

  path TEXT NULL,
  method TEXT NULL,
  status INTEGER NULL,

  ip_hash TEXT NULL,
  user_agent TEXT NULL,

  resource_type TEXT NULL,
  resource_id TEXT NULL,

  metadata JSONB NULL
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx
  ON public.admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_logs_event_idx
  ON public.admin_audit_logs (event);

CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_user_id_idx
  ON public.admin_audit_logs (actor_user_id);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin audit logs - block select"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "Admin audit logs - block insert"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Admin audit logs - block update"
  ON public.admin_audit_logs FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Admin audit logs - block delete"
  ON public.admin_audit_logs FOR DELETE
  TO authenticated
  USING (false);
