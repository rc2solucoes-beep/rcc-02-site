-- Verificação pós-aplicação da migration 013. SOMENTE LEITURA (BEGIN READ ONLY).
BEGIN READ ONLY;

-- 1. A policy de SELECT administrativa existe e é só para authenticated.
-- Esperado: 1 linha, cmd = SELECT, roles = {authenticated}, admin_users = true.
SELECT policyname, cmd, roles, position('admin_users' IN qual) > 0 AS usa_admin_users
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_audit_logs' AND cmd = 'SELECT';

-- 2. Nenhuma policy de escrita para authenticated/anon além das de bloqueio (WITH CHECK false).
-- Esperado: nenhuma linha com qual/with_check permissivo; qualquer linha aqui deve ser de bloqueio.
SELECT policyname, cmd, roles, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_audit_logs' AND cmd <> 'SELECT'
ORDER BY policyname;

-- 3. Privilégios: sem escrita para anon e authenticated; authenticated lê.
-- Esperado: todos false, exceto auth_sel = true.
SELECT
  pg_catalog.has_table_privilege('anon', 'public.admin_audit_logs', 'INSERT') AS anon_ins,
  pg_catalog.has_table_privilege('anon', 'public.admin_audit_logs', 'UPDATE') AS anon_upd,
  pg_catalog.has_table_privilege('anon', 'public.admin_audit_logs', 'DELETE') AS anon_del,
  pg_catalog.has_table_privilege('anon', 'public.admin_audit_logs', 'TRUNCATE') AS anon_trunc,
  pg_catalog.has_table_privilege('authenticated', 'public.admin_audit_logs', 'INSERT') AS auth_ins,
  pg_catalog.has_table_privilege('authenticated', 'public.admin_audit_logs', 'UPDATE') AS auth_upd,
  pg_catalog.has_table_privilege('authenticated', 'public.admin_audit_logs', 'DELETE') AS auth_del,
  pg_catalog.has_table_privilege('authenticated', 'public.admin_audit_logs', 'TRUNCATE') AS auth_trunc,
  pg_catalog.has_table_privilege('authenticated', 'public.admin_audit_logs', 'SELECT') AS auth_sel;

-- 4. RLS ligado e índices previstos presentes.
-- Esperado: relrowsecurity = true; 3 índices (created_at, event, actor_user_id).
SELECT relrowsecurity
FROM pg_catalog.pg_class
WHERE oid = 'public.admin_audit_logs'::regclass;

SELECT indexname
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public' AND tablename = 'admin_audit_logs'
  AND indexname IN ('admin_audit_logs_created_at_idx', 'admin_audit_logs_event_idx', 'admin_audit_logs_actor_user_id_idx')
ORDER BY indexname;

ROLLBACK;
