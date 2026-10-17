-- Preflight da migration 013 (leitura administrativa de admin_audit_logs). SOMENTE LEITURA.
-- A garantia de somente leitura é a transação BEGIN READ ONLY abaixo. O lint
-- automático é complementar e não substitui a revisão humana.
BEGIN READ ONLY;

-- 1. Policies de admin_audit_logs.
-- Esperado (PV-02): nenhuma policy de SELECT (EV-09: RLS ligado, sem policy). Pode
-- haver policies de bloqueio da 009. Registrar o que existir.
SELECT policyname, cmd, roles, permissive
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_audit_logs'
ORDER BY policyname;

-- 2. RLS ligado.
-- Esperado: relrowsecurity = true.
SELECT relname, relrowsecurity
FROM pg_catalog.pg_class
WHERE oid = 'public.admin_audit_logs'::regclass;

-- 3. Privilégios de anon e authenticated.
-- Esperado (EV-22): grants padrão presentes. Depois da migration, escrita = false.
SELECT
  pg_catalog.has_table_privilege('anon', 'public.admin_audit_logs', 'SELECT') AS anon_sel,
  pg_catalog.has_table_privilege('anon', 'public.admin_audit_logs', 'INSERT') AS anon_ins,
  pg_catalog.has_table_privilege('authenticated', 'public.admin_audit_logs', 'SELECT') AS auth_sel,
  pg_catalog.has_table_privilege('authenticated', 'public.admin_audit_logs', 'INSERT') AS auth_ins,
  pg_catalog.has_table_privilege('authenticated', 'public.admin_audit_logs', 'UPDATE') AS auth_upd,
  pg_catalog.has_table_privilege('authenticated', 'public.admin_audit_logs', 'DELETE') AS auth_del;

-- 4. Índices existentes (compare por definição, não só por nome).
-- Esperado: aplicados só em parte (EV-09). Se já houver índice equivalente com
-- outro nome, NÃO aplique sem decidir: o IF NOT EXISTS da migration é por nome.
SELECT indexname, indexdef
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public' AND tablename = 'admin_audit_logs'
ORDER BY indexname;

-- 5. A policy de admin_users que sustenta o subselect da nova policy.
-- Esperado: SELECT para authenticated com auth.uid() = id (migration 005).
SELECT policyname, cmd, roles, qual
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_users'
ORDER BY policyname;

-- 6. Tabelas de backup fora do escopo (DT-07). Apenas informativo.
SELECT tablename
FROM pg_catalog.pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'idx02_links_backup%'
ORDER BY tablename;

-- 7. Volume atual (EV-09: 195 linhas em 13/10). Apenas informativo.
SELECT count(*) AS linhas FROM public.admin_audit_logs;

ROLLBACK;
