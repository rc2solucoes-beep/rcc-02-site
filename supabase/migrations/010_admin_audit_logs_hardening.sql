UPDATE public.admin_audit_logs
SET severity = 'warn'
WHERE severity = 'warning';

UPDATE public.admin_audit_logs
SET severity = 'error'
WHERE severity = 'critical';

UPDATE public.admin_audit_logs
SET severity = 'info'
WHERE severity IS NULL OR severity NOT IN ('info', 'warn', 'error');

UPDATE public.admin_audit_logs
SET actor_type = 'unknown'
WHERE actor_type IS NULL OR actor_type NOT IN ('anonymous', 'authenticated', 'admin', 'system', 'unknown');

ALTER TABLE public.admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_severity_check
  CHECK (severity IN ('info', 'warn', 'error'));

ALTER TABLE public.admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_actor_type_check
  CHECK (actor_type IN ('anonymous', 'authenticated', 'admin', 'system', 'unknown'));

CREATE INDEX IF NOT EXISTS admin_audit_logs_severity_idx
  ON public.admin_audit_logs (severity);

CREATE INDEX IF NOT EXISTS admin_audit_logs_resource_idx
  ON public.admin_audit_logs (resource_type, resource_id);
