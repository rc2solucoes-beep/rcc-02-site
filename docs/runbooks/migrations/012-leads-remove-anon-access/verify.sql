-- Verificação pós-aplicação da migration 012. SOMENTE LEITURA (BEGIN READ ONLY).
BEGIN READ ONLY;

-- 1. leads_anon_insert não existe e nenhuma policy de leads alcança anon.
-- Esperado: 0 linhas. (Uma policy sem TO explícito vale para PUBLIC, que inclui anon.)
SELECT policyname, cmd, roles
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'leads'
  AND (policyname = 'leads_anon_insert' OR roles && ARRAY['anon', 'public']::name[]);

-- 2. anon não tem nenhum privilégio em leads (tabela ou coluna).
-- Esperado: 1 linha com todos os campos = false.
SELECT
  pg_catalog.has_table_privilege('anon', 'public.leads', 'SELECT') AS anon_sel,
  pg_catalog.has_table_privilege('anon', 'public.leads', 'INSERT') AS anon_ins,
  pg_catalog.has_table_privilege('anon', 'public.leads', 'UPDATE') AS anon_upd,
  pg_catalog.has_table_privilege('anon', 'public.leads', 'DELETE') AS anon_del,
  pg_catalog.has_table_privilege('anon', 'public.leads', 'TRUNCATE') AS anon_trunc,
  pg_catalog.has_table_privilege('anon', 'public.leads', 'REFERENCES') AS anon_ref,
  pg_catalog.has_any_column_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,REFERENCES') AS anon_col;

-- 3. As policies de admin foram preservadas.
-- Esperado: SELECT e UPDATE para authenticated (as mesmas do preflight).
SELECT policyname, cmd, roles
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'leads'
ORDER BY policyname;

-- 4. RLS continua ligado e authenticated mantém os privilégios que o painel usa.
-- Esperado: relrowsecurity = true; auth_sel = true; auth_upd = true.
SELECT
  c.relrowsecurity,
  pg_catalog.has_table_privilege('authenticated', 'public.leads', 'SELECT') AS auth_sel,
  pg_catalog.has_table_privilege('authenticated', 'public.leads', 'UPDATE') AS auth_upd
FROM pg_catalog.pg_class AS c
WHERE c.oid = 'public.leads'::regclass;

ROLLBACK;
