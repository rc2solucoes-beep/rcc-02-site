-- 013 — E0b.3 (RF-SEG-02, DEC-03): leitura administrativa de public.admin_audit_logs.
--
-- Hoje a tabela tem RLS ligado e, segundo o advisor de 13/10, nenhuma policy: o painel
-- (/admin/security), que lê com a sessão do usuário, enxerga zero linhas. Esta migration:
--   1. concede SELECT apenas a usuário autenticado que esteja em admin_users;
--   2. revoga a escrita (INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) de anon e authenticated;
--   3. recria, se ausentes, os índices previstos.
-- A escrita continua por service_role (ignora RLS), inalterada. Não toca em idx02_links_backup_* (DT-07).
--
-- Idempotente. Rollback seguro: apenas remover a policy de SELECT; os privilégios revogados NÃO são
-- restaurados (docs/runbooks/migrations/013-admin-audit-logs-admin-select/rollback.sql).

BEGIN;

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies de SELECT anteriores (versão da 009 e o bloqueio antigo) cedem lugar à versão com (select auth.uid()).
DROP POLICY IF EXISTS "Admin audit logs - block select" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admin audit logs - admin select" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_logs_admin_select" ON public.admin_audit_logs;

CREATE POLICY "admin_audit_logs_admin_select"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.admin_audit_logs FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx
  ON public.admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_logs_event_idx
  ON public.admin_audit_logs (event);

CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_user_id_idx
  ON public.admin_audit_logs (actor_user_id);

COMMIT;
