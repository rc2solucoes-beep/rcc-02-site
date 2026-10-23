-- E2/015 — verify READ ONLY; após apply AUTORIZADO. NÃO EXECUTADO.
BEGIN READ ONLY;

-- 1. Colunas novas e nulabilidade.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads'
  AND column_name IN (
    'status','status_updated_at','next_action','next_action_at',
    'archived_at','updated_at'
  )
ORDER BY column_name;

-- 2. Dados legados permanecem; contagens agregadas e limites.
SELECT count(*) AS total,
       count(*) FILTER (WHERE status = 'new') AS new_count,
       count(*) FILTER (WHERE status IS NULL) AS missing_status,
       count(*) FILTER (WHERE updated_at IS NULL) AS missing_updated_at
FROM public.leads;

-- 3. Policies e grants.
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('leads','lead_notes','lead_activity')
ORDER BY tablename, policyname;

SELECT
  has_table_privilege('anon','public.leads','SELECT') AS anon_read,
  has_table_privilege('anon','public.leads','INSERT') AS anon_write,
  has_table_privilege('authenticated','public.leads','SELECT') AS auth_read,
  has_column_privilege('authenticated','public.leads','status','UPDATE') AS auth_upd_status,
  has_column_privilege('authenticated','public.leads','name','UPDATE') AS auth_upd_name,
  has_column_privilege('authenticated','public.leads','updated_at','UPDATE') AS auth_upd_timestamp,
  has_table_privilege('authenticated','public.lead_notes','INSERT') AS auth_note_insert,
  has_table_privilege('authenticated','public.lead_activity','INSERT') AS auth_activity_insert;

-- 4. RLS e índices reais.
SELECT relname, relrowsecurity
FROM pg_class WHERE oid IN ('public.leads'::regclass,'public.lead_notes'::regclass,
                           'public.lead_activity'::regclass)
ORDER BY relname;

SELECT tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname = 'public'
  AND tablename IN ('leads','lead_notes','lead_activity')
ORDER BY tablename,indexname;

-- 5. Triggers, funções e acesso ao schema interno.
SELECT t.tgname, pg_get_triggerdef(t.oid) AS definition,
       t.tgenabled
FROM pg_trigger t
WHERE t.tgrelid = 'public.leads'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

SELECT n.nspname, p.proname, p.prosecdef,
       p.proconfig, p.proacl::text AS function_grants
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'rc2_internal'
  AND p.proname IN ('leads_before_update','leads_record_activity')
ORDER BY p.proname;

-- 6. Constraints validadas.
SELECT conrelid::regclass::text AS relation, conname, convalidated,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN ('public.leads'::regclass,'public.lead_notes'::regclass,
                   'public.lead_activity'::regclass)
ORDER BY relation,conname;

ROLLBACK;