-- Preflight da migration 012 (remover acesso anon a leads). SOMENTE LEITURA.
-- A garantia de somente leitura é a transação BEGIN READ ONLY abaixo. O lint
-- automático é complementar e não substitui a revisão humana.
-- Confirma o estado ANTES de aplicar. A saída é evidência do estado anterior;
-- nunca é usada para restaurar permissões.
BEGIN READ ONLY;

-- 1. Policies de leads.
-- Esperado (PV-01): leads_anon_insert (INSERT, anon) presente; leads de admin
-- (SELECT, UPDATE para authenticated) presentes. Se leads_anon_insert já não
-- existir, a migration apenas confirma o estado.
SELECT policyname, cmd, roles, permissive
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'leads'
ORDER BY policyname;

-- 2. Privilégios de anon e authenticated em leads.
-- Esperado: anon tem privilégios (grants padrão do Supabase, EV-22). Depois da
-- migration, todos devem ser false para anon.
SELECT
  pg_catalog.has_table_privilege('anon', 'public.leads', 'SELECT') AS anon_sel,
  pg_catalog.has_table_privilege('anon', 'public.leads', 'INSERT') AS anon_ins,
  pg_catalog.has_table_privilege('anon', 'public.leads', 'UPDATE') AS anon_upd,
  pg_catalog.has_table_privilege('anon', 'public.leads', 'DELETE') AS anon_del,
  pg_catalog.has_table_privilege('authenticated', 'public.leads', 'SELECT') AS auth_sel,
  pg_catalog.has_table_privilege('authenticated', 'public.leads', 'UPDATE') AS auth_upd;

-- 3. RLS ligado em leads.
-- Esperado: relrowsecurity = true.
SELECT relname, relrowsecurity
FROM pg_catalog.pg_class
WHERE oid = 'public.leads'::regclass;

-- 4. Colunas de leads (EV-11: 12 colunas na base histórica).
-- Divergência aqui não impede a 012, mas indica snapshot desatualizado.
SELECT count(*) AS colunas
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads';

ROLLBACK;
