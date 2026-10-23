-- E2/015 — preflight READ ONLY. NÃO EXECUTADO.
-- Autorizar alvo antes de qualquer consulta, inclusive catálogo.
BEGIN READ ONLY;

-- 1. Identidade e versão (sem expor segredos).
SELECT current_database() AS db_name,
       current_setting('server_version_num')::int AS server_version_num;

-- 2. Schema histórico: compare com EV-11 e planos do E2.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads'
ORDER BY ordinal_position;

-- 3. Nenhuma tabela filha E2 existente é pressuposto. Qualquer ocorrência = STOP.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('lead_notes', 'lead_activity')
ORDER BY table_name;

-- 4. Policies reais, incluindo a legacy leads_anon_insert que deve estar ausente.
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('leads','admin_users','lead_notes','lead_activity')
ORDER BY tablename, policyname;

-- 5. Grants efetivos (não confundir privilégios de tabela com de coluna).
SELECT
  has_table_privilege('anon','public.leads','SELECT') AS anon_select,
  has_table_privilege('anon','public.leads','INSERT') AS anon_insert,
  has_table_privilege('authenticated','public.leads','SELECT') AS auth_select,
  has_table_privilege('authenticated','public.leads','UPDATE') AS auth_update_table,
  has_column_privilege('authenticated','public.leads','name','UPDATE') AS auth_update_name,
  has_column_privilege('authenticated','public.leads','email','UPDATE') AS auth_update_email;

-- 6. Todos os triggers existentes devem ser inventariados.
SELECT c.relname, t.tgname,
       pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('leads','posts','settings')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- 7. Função legada usada por posts/settings: só reaproveitar se compatível.
SELECT p.oid::regprocedure::text AS function_name,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'update_updated_at';

-- 8. Índices por DEFINIÇÃO (não apenas nome) e constraints.
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'leads'
ORDER BY indexname;
SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.leads'::regclass
ORDER BY conname;

-- 9. Schema interno: se já existir, revisar dono e privilégios antes do apply.
SELECT nspname, nspowner::regrole::text AS owner, nspacl::text AS grants
FROM pg_namespace
WHERE nspname = 'rc2_internal';

-- 10. Volume somente agregado; não expor PII.
SELECT count(*) AS total_leads FROM public.leads;

ROLLBACK;