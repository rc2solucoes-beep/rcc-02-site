-- Rollback da migration 013: SEGURO E PARCIAL.
--
-- Remove apenas a policy de SELECT administrativa (volta ao deny-all, estado seguro).
-- NÃO restaura os privilégios de escrita revogados de anon/authenticated e NÃO
-- remove os índices. Efeito colateral: /admin/security passa a listar zero eventos.
-- Reverta o código que depende da leitura ANTES, se houver.
BEGIN;

DROP POLICY IF EXISTS "admin_audit_logs_admin_select" ON public.admin_audit_logs;

COMMIT;
