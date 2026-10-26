-- E2/015 — verify READ ONLY com asserções; após apply AUTORIZADO. NÃO EXECUTADO.
--
-- COMO LER O RESULTADO
--   * A 1ª consulta devolve uma linha por check (check_id, expected, actual, pass)
--     e, por último, a linha RESULTADO. Só vale como aprovação se a linha
--     RESULTADO tiver actual = 'APROVADO'. Qualquer outra coisa é REPROVAÇÃO.
--   * Check ausente (contagem diferente de expected_checks), resultado NULL e
--     comparação NULL contam como FALHA, nunca como aprovação.
--   * Erro de catálogo (relação inexistente, papel inexistente, etc.) aborta a
--     transação: sem a linha RESULTADO = APROVADO, o verify está REPROVADO.
--   * POS-01 falha se o script for executado fora de uma transação READ ONLY.
--   * Estado esperado: DEPOIS da 015. Os checks são o inverso lógico do
--     preflight.sql (que exige a ausência destes mesmos objetos): nenhum dos
--     dois arquivos aprova o estado do outro.
--   * Checks POS-JANELA-* só valem IMEDIATAMENTE após o apply, antes de o
--     código E2 ser liberado. Depois de uso real da E2 eles passam a falhar
--     de propósito (indicam que o banco já tem dados de gestão).
--   * O lint (checkReadOnlySql) é complementar: a garantia real é o
--     BEGIN READ ONLY. Nenhuma consulta lê dado pessoal dos leads.
BEGIN READ ONLY;

WITH
meta AS (SELECT 58 AS expected_checks),
rl AS (
  SELECT oid, rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')
),
rel AS (
  SELECT c.oid, c.relname, c.relowner, c.relrowsecurity, c.relforcerowsecurity, c.relacl
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND c.relname IN ('leads', 'lead_notes', 'lead_activity', 'admin_users')
),
-- Privilégios EFETIVOS (incluem os derivados de PUBLIC e de herança de papéis).
tp AS (
  SELECT rl.rolname, rel.relname,
         has_table_privilege(rl.oid, rel.oid, 'SELECT') AS p_select,
         has_table_privilege(rl.oid, rel.oid, 'INSERT') AS p_insert,
         has_table_privilege(rl.oid, rel.oid, 'UPDATE') AS p_update,
         has_table_privilege(rl.oid, rel.oid, 'DELETE') AS p_delete,
         has_table_privilege(rl.oid, rel.oid, 'TRUNCATE') AS p_truncate,
         has_table_privilege(rl.oid, rel.oid, 'REFERENCES') AS p_references,
         has_table_privilege(rl.oid, rel.oid, 'TRIGGER') AS p_trigger
  FROM rl CROSS JOIN rel
),
cp AS (
  SELECT rl.rolname, rel.relname, a.attname,
         has_column_privilege(rl.oid, rel.oid, a.attnum, 'SELECT') AS c_select,
         has_column_privilege(rl.oid, rel.oid, a.attnum, 'INSERT') AS c_insert,
         has_column_privilege(rl.oid, rel.oid, a.attnum, 'UPDATE') AS c_update,
         has_column_privilege(rl.oid, rel.oid, a.attnum, 'REFERENCES') AS c_references
  FROM rl CROSS JOIN rel
  JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum > 0 AND NOT a.attisdropped
),
-- Entradas de ACL concedidas a PUBLIC (grantee = 0), em tabela e em coluna.
pub AS (
  SELECT rel.relname, 'tabela'::text AS alvo, x.privilege_type::text AS priv
  FROM rel, aclexplode(rel.relacl) AS x
  WHERE x.grantee = 0
  UNION ALL
  SELECT rel.relname, a.attname::text, x.privilege_type::text
  FROM rel JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum > 0 AND NOT a.attisdropped,
       aclexplode(a.attacl) AS x
  WHERE x.grantee = 0
),
facts(check_id, expected, actual) AS (
  SELECT 'POS-01-TRANSACAO-SOMENTE-LEITURA', 'on',
         current_setting('transaction_read_only')
  UNION ALL
  SELECT 'POS-02-PAPEIS-ANON-E-AUTHENTICATED', '2',
         (SELECT count(*)::text FROM rl)
  UNION ALL
  SELECT 'POS-03-PAPEIS-SEM-SUPERUSER-NEM-BYPASSRLS', '0',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE (count(*) FILTER (WHERE pr.rolsuper OR pr.rolbypassrls))::text END
          FROM pg_roles pr WHERE pr.rolname IN ('anon', 'authenticated'))
  UNION ALL
  SELECT 'POS-04-TRES-TABELAS-DE-LEADS-EXISTEM', '3',
         (SELECT count(*)::text FROM rel WHERE relname IN ('leads', 'lead_notes', 'lead_activity'))
  UNION ALL
  SELECT 'POS-05-COLUNAS-DE-GESTAO-EM-LEADS', 'archived_at:timestamp with time zone:false:-;next_action:text:false:-;next_action_at:timestamp with time zone:false:-;status:text:true:''new''::text;status_updated_at:timestamp with time zone:false:-;updated_at:timestamp with time zone:true:now()',
         (SELECT string_agg(a.attname::text || ':' || format_type(a.atttypid, a.atttypmod) || ':'
                            || a.attnotnull::text || ':' || coalesce(pg_get_expr(d.adbin, d.adrelid), '-'),
                            ';' ORDER BY a.attname)
          FROM pg_attribute a JOIN rel ON rel.oid = a.attrelid
          LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
          WHERE rel.relname = 'leads' AND a.attnum > 0 AND NOT a.attisdropped
            AND a.attname IN ('status', 'status_updated_at', 'next_action',
                              'next_action_at', 'archived_at', 'updated_at'))
  UNION ALL
  SELECT 'POS-06-DOZE-COLUNAS-HISTORICAS-PRESERVADAS', '12',
         (SELECT count(*)::text
          FROM pg_attribute a JOIN rel ON rel.oid = a.attrelid
          WHERE rel.relname = 'leads' AND a.attnum > 0 AND NOT a.attisdropped
            AND a.attname IN ('id', 'name', 'company', 'email', 'whatsapp', 'segment',
                              'size', 'solution', 'message', 'source', 'ip_hash', 'created_at'))
  UNION ALL
  SELECT 'POS-07-IP-HASH-CONTINUA-NULAVEL', 'true',
         (SELECT (NOT a.attnotnull)::text
          FROM pg_attribute a JOIN rel ON rel.oid = a.attrelid
          WHERE rel.relname = 'leads' AND a.attname = 'ip_hash' AND NOT a.attisdropped)
  UNION ALL
  SELECT 'POS-08-COLUNAS-DE-LEAD-NOTES', 'author_id:uuid:false:-;body:text:true:-;created_at:timestamp with time zone:true:now();id:uuid:true:gen_random_uuid();lead_id:uuid:true:-',
         (SELECT string_agg(a.attname::text || ':' || format_type(a.atttypid, a.atttypmod) || ':'
                            || a.attnotnull::text || ':' || coalesce(pg_get_expr(d.adbin, d.adrelid), '-'),
                            ';' ORDER BY a.attname)
          FROM pg_attribute a JOIN rel ON rel.oid = a.attrelid
          LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
          WHERE rel.relname = 'lead_notes' AND a.attnum > 0 AND NOT a.attisdropped)
  UNION ALL
  SELECT 'POS-09-COLUNAS-DE-LEAD-ACTIVITY', 'actor_id:uuid:false:-;created_at:timestamp with time zone:true:now();from_value:text:false:-;id:uuid:true:gen_random_uuid();kind:text:true:-;lead_id:uuid:true:-;to_value:text:false:-',
         (SELECT string_agg(a.attname::text || ':' || format_type(a.atttypid, a.atttypmod) || ':'
                            || a.attnotnull::text || ':' || coalesce(pg_get_expr(d.adbin, d.adrelid), '-'),
                            ';' ORDER BY a.attname)
          FROM pg_attribute a JOIN rel ON rel.oid = a.attrelid
          LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
          WHERE rel.relname = 'lead_activity' AND a.attnum > 0 AND NOT a.attisdropped)
  UNION ALL
  SELECT 'POS-10-CONSTRAINTS-DA-015-EM-LEADS-VALIDADAS', 'leads_e2_next_action_check:true;leads_e2_status_check:true',
         (SELECT string_agg(c.conname::text || ':' || c.convalidated::text, ';' ORDER BY c.conname)
          FROM pg_constraint c
          WHERE c.conrelid = to_regclass('public.leads')
            AND c.conname IN ('leads_e2_status_check', 'leads_e2_next_action_check'))
  UNION ALL
  SELECT 'POS-11-CHECK-DE-STATUS-LISTA-OS-CINCO-VALORES', 'true',
         (SELECT (position('''new''' IN d) > 0 AND position('''in_review''' IN d) > 0
                  AND position('''contacted''' IN d) > 0 AND position('''qualified''' IN d) > 0
                  AND position('''closed''' IN d) > 0)::text
          FROM (SELECT pg_get_constraintdef(c.oid) AS d FROM pg_constraint c
                WHERE c.conrelid = to_regclass('public.leads')
                  AND c.conname = 'leads_e2_status_check') s)
  UNION ALL
  SELECT 'POS-12-CHECK-DE-NEXT-ACTION-LIMITA-280', 'true',
         (SELECT (position('char_length(next_action)' IN d) > 0 AND position('280' IN d) > 0)::text
          FROM (SELECT pg_get_constraintdef(c.oid) AS d FROM pg_constraint c
                WHERE c.conrelid = to_regclass('public.leads')
                  AND c.conname = 'leads_e2_next_action_check') s)
  UNION ALL
  SELECT 'POS-13-ACTIVITY-REJEITA-NULL-EM-STATUS-CHANGED', 'true',
         (SELECT (c.convalidated
                  AND position('from_value IS NOT NULL' IN d.d) > 0
                  AND position('to_value IS NOT NULL' IN d.d) > 0
                  AND position('from_value IS NULL' IN d.d) > 0
                  AND position('to_value IS NULL' IN d.d) > 0
                  AND position('status_changed' IN d.d) > 0)::text
          FROM pg_constraint c,
               LATERAL (SELECT pg_get_constraintdef(c.oid) AS d) d
          WHERE c.conrelid = to_regclass('public.lead_activity')
            AND c.conname = 'lead_activity_status_values_check')
  UNION ALL
  SELECT 'POS-14-CHECK-DE-BODY-EM-LEAD-NOTES', '1',
         (SELECT count(*)::text FROM pg_constraint c
          WHERE c.conrelid = to_regclass('public.lead_notes') AND c.contype = 'c'
            AND position('char_length(body)' IN pg_get_constraintdef(c.oid)) > 0
            AND position('2000' IN pg_get_constraintdef(c.oid)) > 0)
  UNION ALL
  SELECT 'POS-15-CHECK-DE-KIND-EM-LEAD-ACTIVITY', '1',
         (SELECT count(*)::text FROM pg_constraint c
          WHERE c.conrelid = to_regclass('public.lead_activity') AND c.contype = 'c'
            AND position('''status_changed''' IN pg_get_constraintdef(c.oid)) > 0
            AND position('''next_action_changed''' IN pg_get_constraintdef(c.oid)) > 0
            AND position('''archived''' IN pg_get_constraintdef(c.oid)) > 0
            AND position('''restored''' IN pg_get_constraintdef(c.oid)) > 0
            AND position('kind' IN pg_get_constraintdef(c.oid)) > 0
            AND position('from_value' IN pg_get_constraintdef(c.oid)) = 0)
  UNION ALL
  SELECT 'POS-16-FKS-DE-LEAD-NOTES-CASCADE-E-SET-NULL', 'leads:c;auth.users:n',
         (SELECT string_agg((CASE WHEN c.confrelid = to_regclass('public.leads') THEN 'leads'
                                  WHEN c.confrelid = to_regclass('auth.users') THEN 'auth.users'
                                  ELSE '?' END) || ':' || c.confdeltype::text,
                            ';' ORDER BY c.confdeltype::text)
          FROM pg_constraint c
          WHERE c.conrelid = to_regclass('public.lead_notes') AND c.contype = 'f')
  UNION ALL
  SELECT 'POS-17-FKS-DE-LEAD-ACTIVITY-CASCADE-E-SET-NULL', 'leads:c;auth.users:n',
         (SELECT string_agg((CASE WHEN c.confrelid = to_regclass('public.leads') THEN 'leads'
                                  WHEN c.confrelid = to_regclass('auth.users') THEN 'auth.users'
                                  ELSE '?' END) || ':' || c.confdeltype::text,
                            ';' ORDER BY c.confdeltype::text)
          FROM pg_constraint c
          WHERE c.conrelid = to_regclass('public.lead_activity') AND c.contype = 'f')
  UNION ALL
  SELECT 'POS-18-NENHUMA-CONSTRAINT-NAO-VALIDADA', '0',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE (count(*) FILTER (WHERE NOT c.convalidated))::text END
          FROM pg_constraint c
          WHERE c.conrelid IN (to_regclass('public.leads'), to_regclass('public.lead_notes'),
                               to_regclass('public.lead_activity')))
  UNION ALL
  SELECT 'POS-19-CINCO-INDICES-VALIDOS', 'lead_activity_lead_created_idx:true:true;lead_notes_lead_created_idx:true:true;leads_e2_active_created_idx:true:true;leads_e2_next_action_idx:true:true;leads_e2_status_created_idx:true:true',
         (SELECT string_agg(i.relname::text || ':' || x.indisvalid::text || ':' || x.indisready::text,
                            ';' ORDER BY i.relname)
          FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid
          JOIN pg_namespace n ON n.oid = i.relnamespace
          WHERE n.nspname = 'public'
            AND i.relname IN ('leads_e2_active_created_idx', 'leads_e2_status_created_idx',
                              'leads_e2_next_action_idx', 'lead_notes_lead_created_idx',
                              'lead_activity_lead_created_idx'))
  UNION ALL
  SELECT 'POS-20-DEFINICAO-DOS-CINCO-INDICES', '5',
         (SELECT count(*)::text FROM pg_indexes
          WHERE schemaname = 'public'
            AND ((indexname = 'leads_e2_active_created_idx'
                  AND indexdef ~ '\(archived_at, created_at DESC, id DESC\)$')
              OR (indexname = 'leads_e2_status_created_idx'
                  AND indexdef ~ '\(status, created_at DESC, id DESC\)$')
              OR (indexname = 'leads_e2_next_action_idx'
                  AND indexdef ~ '\(next_action_at( NULLS LAST)?, id\)$')
              OR (indexname = 'lead_notes_lead_created_idx'
                  AND indexdef ~ '\(lead_id, created_at DESC\)$')
              OR (indexname = 'lead_activity_lead_created_idx'
                  AND indexdef ~ '\(lead_id, created_at DESC\)$')))
  UNION ALL
  SELECT 'POS-21-RLS-LIGADA-NAS-TRES-TABELAS', 'lead_activity:true;lead_notes:true;leads:true',
         (SELECT string_agg(relname::text || ':' || relrowsecurity::text, ';' ORDER BY relname)
          FROM rel WHERE relname IN ('leads', 'lead_notes', 'lead_activity'))
  UNION ALL
  SELECT 'POS-22-RLS-NAO-FORCADA-NAS-TRES-TABELAS', 'lead_activity:false;lead_notes:false;leads:false',
         (SELECT string_agg(relname::text || ':' || relforcerowsecurity::text, ';' ORDER BY relname)
          FROM rel WHERE relname IN ('leads', 'lead_notes', 'lead_activity'))
  UNION ALL
  SELECT 'POS-23-POLICIES-EXATAS-EM-LEADS', 'leads_e2_admin_delete:DELETE:{authenticated};leads_e2_admin_select:SELECT:{authenticated};leads_e2_admin_update:UPDATE:{authenticated}',
         (SELECT string_agg(policyname::text || ':' || cmd || ':' || roles::text, ';' ORDER BY policyname)
          FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads')
  UNION ALL
  SELECT 'POS-24-POLICIES-EXATAS-EM-LEAD-NOTES', 'lead_notes_e2_admin_insert:INSERT:{authenticated};lead_notes_e2_admin_select:SELECT:{authenticated}',
         (SELECT string_agg(policyname::text || ':' || cmd || ':' || roles::text, ';' ORDER BY policyname)
          FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lead_notes')
  UNION ALL
  SELECT 'POS-25-POLICIES-EXATAS-EM-LEAD-ACTIVITY', 'lead_activity_e2_admin_select:SELECT:{authenticated}',
         (SELECT string_agg(policyname::text || ':' || cmd || ':' || roles::text, ';' ORDER BY policyname)
          FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lead_activity')
  UNION ALL
  SELECT 'POS-26-TODAS-AS-POLICIES-SAO-PERMISSIVAS-E-EXIGEM-ADMIN', '0',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE (count(*) FILTER (WHERE permissive <> 'PERMISSIVE'
                            OR position('admin_users' IN coalesce(qual, '') || coalesce(with_check, '')) = 0))::text END
          FROM pg_policies
          WHERE schemaname = 'public' AND tablename IN ('leads', 'lead_notes', 'lead_activity'))
  UNION ALL
  SELECT 'POS-27-INSERT-DE-NOTA-AMARRA-O-AUTOR', '1',
         (SELECT count(*)::text FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'lead_notes' AND cmd = 'INSERT'
            AND position('author_id' IN coalesce(with_check, '')) > 0
            AND position('uid()' IN coalesce(with_check, '')) > 0)
  UNION ALL
  SELECT 'POS-28-UPDATE-DE-LEADS-TEM-WITH-CHECK', '1',
         (SELECT count(*)::text FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'leads' AND cmd = 'UPDATE'
            AND with_check IS NOT NULL)
  UNION ALL
  SELECT 'POS-29-NENHUMA-POLICY-ALCANCA-ANON-OU-PUBLIC', '0',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE (count(*) FILTER (WHERE roles && ARRAY['anon', 'public']::name[]))::text END
          FROM pg_policies
          WHERE schemaname = 'public' AND tablename IN ('leads', 'lead_notes', 'lead_activity'))
  UNION ALL
  SELECT 'POS-30-TRES-TRIGGERS-EM-LEADS-HABILITADOS', 'leads_10_before_update:O;leads_20_set_updated_at:O;leads_30_activity:O',
         (SELECT string_agg(t.tgname::text || ':' || t.tgenabled::text, ';' ORDER BY t.tgname)
          FROM pg_trigger t
          WHERE t.tgrelid = to_regclass('public.leads') AND NOT t.tgisinternal)
  UNION ALL
  SELECT 'POS-31-TRIGGER-10-BEFORE-SEM-WHEN', '1',
         (SELECT count(*)::text FROM pg_trigger t
          WHERE t.tgrelid = to_regclass('public.leads') AND t.tgname = 'leads_10_before_update'
            AND pg_get_triggerdef(t.oid) ~ 'BEFORE UPDATE ON'
            AND pg_get_triggerdef(t.oid) ~ 'FOR EACH ROW'
            AND pg_get_triggerdef(t.oid) ~ 'rc2_internal\.leads_before_update\(\)'
            AND pg_get_triggerdef(t.oid) !~ 'WHEN')
  UNION ALL
  SELECT 'POS-32-TRIGGER-20-BEFORE-COM-WHEN-E-FUNCAO-EXISTENTE', '1',
         (SELECT count(*)::text FROM pg_trigger t
          WHERE t.tgrelid = to_regclass('public.leads') AND t.tgname = 'leads_20_set_updated_at'
            AND pg_get_triggerdef(t.oid) ~ 'BEFORE UPDATE ON'
            AND pg_get_triggerdef(t.oid) ~ 'FOR EACH ROW'
            AND pg_get_triggerdef(t.oid) ~ 'WHEN'
            AND pg_get_triggerdef(t.oid) ~ 'IS DISTINCT FROM new\.\*'
            AND pg_get_triggerdef(t.oid) ~ 'update_updated_at\(\)')
  UNION ALL
  SELECT 'POS-33-TRIGGER-30-AFTER-COM-WHEN-E-HISTORICO', '1',
         (SELECT count(*)::text FROM pg_trigger t
          WHERE t.tgrelid = to_regclass('public.leads') AND t.tgname = 'leads_30_activity'
            AND pg_get_triggerdef(t.oid) ~ 'AFTER UPDATE ON'
            AND pg_get_triggerdef(t.oid) ~ 'FOR EACH ROW'
            AND pg_get_triggerdef(t.oid) ~ 'WHEN'
            AND pg_get_triggerdef(t.oid) ~ 'IS DISTINCT FROM new\.\*'
            AND pg_get_triggerdef(t.oid) ~ 'rc2_internal\.leads_record_activity\(\)')
  UNION ALL
  SELECT 'POS-34-TRIGGERS-DE-POSTS-E-SETTINGS-INTACTOS', '2',
         (SELECT count(*)::text FROM pg_trigger t
          WHERE t.tgname IN ('posts_updated_at', 'settings_updated_at')
            AND NOT t.tgisinternal AND t.tgenabled = 'O')
  UNION ALL
  SELECT 'POS-35-UPDATE-UPDATED-AT-CONTINUA-COMPATIVEL', '1',
         (SELECT count(*)::text
          FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.proname = 'update_updated_at' AND p.pronargs = 0
            AND p.prorettype = 'pg_catalog.trigger'::regtype AND NOT p.prosecdef
            AND p.prosrc ~* 'new\.updated_at\s*=\s*now\(\)')
  UNION ALL
  SELECT 'POS-36-FUNCOES-DO-SCHEMA-INTERNO-E-SECURITY-DEFINER', 'leads_before_update:false;leads_record_activity:true',
         (SELECT string_agg(p.proname::text || ':' || p.prosecdef::text, ';' ORDER BY p.proname)
          FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'rc2_internal')
  UNION ALL
  SELECT 'POS-37-SEARCH-PATH-VAZIO-NAS-DUAS-FUNCOES', '2',
         (SELECT count(*)::text
          FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'rc2_internal' AND 'search_path=""' = ANY (p.proconfig))
  UNION ALL
  SELECT 'POS-38-UM-UNICO-DONO-PARA-TABELAS-SCHEMA-E-FUNCOES', '1',
         (SELECT count(DISTINCT o)::text
          FROM (SELECT relowner AS o FROM rel WHERE relname IN ('leads', 'lead_notes', 'lead_activity')
                UNION ALL
                SELECT nspowner FROM pg_namespace WHERE nspname = 'rc2_internal'
                UNION ALL
                SELECT p.proowner FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'rc2_internal') s)
  UNION ALL
  SELECT 'POS-39-DONO-DA-FUNCAO-DEFINER-CHAMA-AUTH-UID', 'true',
         (SELECT (has_function_privilege(s.o, to_regprocedure('auth.uid()')::oid, 'EXECUTE')
                  AND has_schema_privilege(s.o, 'auth', 'USAGE'))::text
          FROM (SELECT p.proowner AS o FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'rc2_internal' AND p.proname = 'leads_record_activity') s)
  UNION ALL
  SELECT 'POS-40-API-SEM-EXECUTE-NAS-FUNCOES-INTERNAS', '0',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE (count(*) FILTER (WHERE has_function_privilege(rl.oid, pf.oid, 'EXECUTE')))::text END
          FROM rl CROSS JOIN (SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                              WHERE n.nspname = 'rc2_internal') pf)
  UNION ALL
  SELECT 'POS-41-FUNCOES-INTERNAS-SEM-EXECUTE-PADRAO-DE-PUBLIC', '0',
         (SELECT count(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'rc2_internal'
            AND (p.proacl IS NULL OR EXISTS (SELECT 1 FROM aclexplode(p.proacl) x WHERE x.grantee = 0)))
  UNION ALL
  SELECT 'POS-42-API-SEM-USAGE-NEM-CREATE-NO-SCHEMA-INTERNO', '0',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE (count(*) FILTER (WHERE has_schema_privilege(rl.oid, ns.oid, 'USAGE,CREATE')))::text END
          FROM rl CROSS JOIN (SELECT oid FROM pg_namespace WHERE nspname = 'rc2_internal') ns)
  UNION ALL
  SELECT 'POS-43-SCHEMA-INTERNO-SEM-ACL-DE-PUBLIC', '0',
         (SELECT count(*)::text FROM pg_namespace ns, aclexplode(ns.nspacl) x
          WHERE ns.nspname = 'rc2_internal' AND x.grantee = 0)
  UNION ALL
  SELECT 'POS-44-ANON-SEM-PRIVILEGIO-DE-TABELA-NAS-TRES-TABELAS', '0',
         (SELECT CASE WHEN count(*) <> 3 THEN NULL
                      ELSE (count(*) FILTER (WHERE p_select OR p_insert OR p_update OR p_delete
                            OR p_truncate OR p_references OR p_trigger))::text END
          FROM tp WHERE rolname = 'anon' AND relname IN ('leads', 'lead_notes', 'lead_activity'))
  UNION ALL
  SELECT 'POS-45-ANON-SEM-PRIVILEGIO-DE-COLUNA-NAS-TRES-TABELAS', '0',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE (count(*) FILTER (WHERE c_select OR c_insert OR c_update OR c_references))::text END
          FROM cp WHERE rolname = 'anon' AND relname IN ('leads', 'lead_notes', 'lead_activity'))
  UNION ALL
  SELECT 'POS-46-TRES-TABELAS-SEM-ACL-CONCEDIDA-A-PUBLIC', '0',
         (SELECT CASE WHEN (SELECT count(*) FROM rel
                            WHERE relname IN ('leads', 'lead_notes', 'lead_activity')) = 3
                      THEN (SELECT count(*)::text FROM pub
                            WHERE relname IN ('leads', 'lead_notes', 'lead_activity')) END)
  UNION ALL
  SELECT 'POS-47-AUTHENTICATED-EM-LEADS-SO-SELECT-E-DELETE', 'SELECT,DELETE',
         (SELECT concat_ws(',', CASE WHEN p_select THEN 'SELECT' END, CASE WHEN p_insert THEN 'INSERT' END,
                           CASE WHEN p_update THEN 'UPDATE' END, CASE WHEN p_delete THEN 'DELETE' END,
                           CASE WHEN p_truncate THEN 'TRUNCATE' END, CASE WHEN p_references THEN 'REFERENCES' END,
                           CASE WHEN p_trigger THEN 'TRIGGER' END)
          FROM tp WHERE rolname = 'authenticated' AND relname = 'leads')
  UNION ALL
  SELECT 'POS-48-AUTHENTICATED-ATUALIZA-SO-QUATRO-COLUNAS-DE-LEADS', 'archived_at,next_action,next_action_at,status',
         (SELECT string_agg(attname::text, ',' ORDER BY attname)
          FROM cp WHERE rolname = 'authenticated' AND relname = 'leads' AND c_update)
  UNION ALL
  SELECT 'POS-49-AUTHENTICATED-SEM-INSERT-NEM-REFERENCES-EM-COLUNAS-DE-LEADS', '(nenhum)',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE coalesce(string_agg(attname::text, ',' ORDER BY attname)
                                    FILTER (WHERE c_insert OR c_references), '(nenhum)') END
          FROM cp WHERE rolname = 'authenticated' AND relname = 'leads')
  UNION ALL
  SELECT 'POS-50-AUTHENTICATED-EM-LEAD-NOTES-SO-SELECT-E-INSERT', 'SELECT,INSERT',
         (SELECT concat_ws(',', CASE WHEN p_select THEN 'SELECT' END, CASE WHEN p_insert THEN 'INSERT' END,
                           CASE WHEN p_update THEN 'UPDATE' END, CASE WHEN p_delete THEN 'DELETE' END,
                           CASE WHEN p_truncate THEN 'TRUNCATE' END, CASE WHEN p_references THEN 'REFERENCES' END,
                           CASE WHEN p_trigger THEN 'TRIGGER' END)
          FROM tp WHERE rolname = 'authenticated' AND relname = 'lead_notes')
  UNION ALL
  SELECT 'POS-51-AUTHENTICATED-SEM-UPDATE-EM-COLUNAS-DE-LEAD-NOTES', '(nenhum)',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE coalesce(string_agg(attname::text, ',' ORDER BY attname)
                                    FILTER (WHERE c_update OR c_references), '(nenhum)') END
          FROM cp WHERE rolname = 'authenticated' AND relname = 'lead_notes')
  UNION ALL
  SELECT 'POS-52-AUTHENTICATED-EM-LEAD-ACTIVITY-SO-SELECT', 'SELECT',
         (SELECT concat_ws(',', CASE WHEN p_select THEN 'SELECT' END, CASE WHEN p_insert THEN 'INSERT' END,
                           CASE WHEN p_update THEN 'UPDATE' END, CASE WHEN p_delete THEN 'DELETE' END,
                           CASE WHEN p_truncate THEN 'TRUNCATE' END, CASE WHEN p_references THEN 'REFERENCES' END,
                           CASE WHEN p_trigger THEN 'TRIGGER' END)
          FROM tp WHERE rolname = 'authenticated' AND relname = 'lead_activity')
  UNION ALL
  SELECT 'POS-53-AUTHENTICATED-SEM-ESCRITA-EM-COLUNAS-DE-LEAD-ACTIVITY', '(nenhum)',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE coalesce(string_agg(attname::text, ',' ORDER BY attname)
                                    FILTER (WHERE c_insert OR c_update OR c_references), '(nenhum)') END
          FROM cp WHERE rolname = 'authenticated' AND relname = 'lead_activity')
  UNION ALL
  SELECT 'POS-JANELA-54-LEADS-HISTORICOS-NO-ESTADO-INICIAL', '0',
         (SELECT count(*)::text FROM public.leads
          WHERE status <> 'new' OR status_updated_at IS NOT NULL OR next_action IS NOT NULL
             OR next_action_at IS NOT NULL OR archived_at IS NOT NULL OR updated_at <> created_at)
  UNION ALL
  SELECT 'POS-JANELA-55-NOTAS-E-ATIVIDADE-VAZIAS', '0',
         ((SELECT count(*) FROM public.lead_notes) + (SELECT count(*) FROM public.lead_activity))::text
  UNION ALL
  SELECT 'POS-56-INVARIANTES-DE-DADOS-DE-LEADS', '0',
         (SELECT count(*)::text FROM public.leads
          WHERE updated_at IS NULL OR updated_at < created_at
             OR status NOT IN ('new', 'in_review', 'contacted', 'qualified', 'closed'))
  UNION ALL
  -- service_role depende de default privileges do Supabase nas tabelas novas
  -- (a migration só revoga de PUBLIC/anon/authenticated). Efetivo, não ACL crua.
  SELECT 'POS-57-SERVICE-ROLE-COM-SELECT-INSERT-UPDATE-DELETE-NAS-TRES-TABELAS', '0',
         (SELECT CASE WHEN (SELECT count(*) FROM pg_roles WHERE rolname = 'service_role') <> 1
                        OR (SELECT count(*) FROM rel WHERE relname IN ('leads', 'lead_notes', 'lead_activity')) <> 3
                      THEN NULL
                      ELSE (SELECT count(*)::text
                            FROM pg_roles r CROSS JOIN rel
                            WHERE r.rolname = 'service_role'
                              AND rel.relname IN ('leads', 'lead_notes', 'lead_activity')
                              AND NOT (has_table_privilege(r.oid, rel.oid, 'SELECT')
                                       AND has_table_privilege(r.oid, rel.oid, 'INSERT')
                                       AND has_table_privilege(r.oid, rel.oid, 'UPDATE')
                                       AND has_table_privilege(r.oid, rel.oid, 'DELETE'))) END)
  UNION ALL
  -- Sem policy para service_role nas tabelas novas: o acesso depende de BYPASSRLS.
  SELECT 'POS-58-SERVICE-ROLE-IGNORA-RLS', 'true',
         (SELECT rolbypassrls::text FROM pg_roles WHERE rolname = 'service_role')
),
checks AS (
  SELECT check_id, expected, actual, coalesce(actual = expected, false) AS pass FROM facts
),
summary AS (
  SELECT 'RESULTADO' AS check_id,
         'APROVADO' AS expected,
         CASE WHEN (SELECT count(*) FROM checks) = (SELECT expected_checks FROM meta)
                   AND (SELECT count(*) FROM checks WHERE NOT pass) = 0
              THEN 'APROVADO'
              ELSE 'REPROVADO: ' || (SELECT count(*) FROM checks WHERE NOT pass)::text
                   || ' falha(s) em ' || (SELECT count(*) FROM checks)::text
                   || ' checks (esperados ' || (SELECT expected_checks FROM meta)::text || ')'
         END AS actual
)
SELECT u.check_id, u.expected, u.actual, u.pass
FROM (
  SELECT check_id, expected, actual, pass FROM checks
  UNION ALL
  SELECT check_id, expected, actual, (actual = 'APROVADO') FROM summary
) u
ORDER BY (u.check_id = 'RESULTADO'), u.check_id;

-- ─── Snapshot pós-apply (sem dado pessoal) ──────────────────────────────────
-- Guardar na evidência: servem de base para a recuperação e para comparar com
-- o snapshot do preflight.
SELECT 'EVD-ACL-TABELA' AS evidence_id,
       n.nspname || '.' || c.relname AS objeto,
       pg_catalog.pg_get_userbyid(c.relowner)::text AS dono,
       c.relrowsecurity AS rls,
       c.relforcerowsecurity AS rls_forcada,
       coalesce(c.relacl::text, '(padrao: somente o dono)') AS acl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname, c.relname) IN (('public', 'leads'), ('public', 'admin_users'),
                                 ('public', 'lead_notes'), ('public', 'lead_activity'))
ORDER BY 2;

SELECT 'EVD-ACL-COLUNA' AS evidence_id,
       c.relname || '.' || a.attname AS objeto,
       a.attacl::text AS acl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
WHERE n.nspname = 'public' AND c.relname IN ('leads', 'admin_users', 'lead_notes', 'lead_activity')
  AND a.attacl IS NOT NULL
ORDER BY 2;

SELECT 'EVD-POLICY' AS evidence_id,
       p.schemaname || '.' || p.tablename AS objeto,
       p.policyname::text AS politica,
       p.permissive,
       p.roles::text AS papeis,
       p.cmd,
       p.qual,
       p.with_check
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN ('leads', 'admin_users', 'lead_notes', 'lead_activity')
ORDER BY 2, 3;

SELECT 'EVD-TRIGGER' AS evidence_id,
       c.relname::text AS tabela,
       t.tgname::text AS gatilho,
       t.tgenabled::text AS habilitado,
       pg_get_triggerdef(t.oid) AS definicao
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('leads', 'posts', 'settings') AND NOT t.tgisinternal
ORDER BY 2, 3;

SELECT 'EVD-FUNCAO' AS evidence_id,
       p.oid::regprocedure::text AS funcao,
       pg_catalog.pg_get_userbyid(p.proowner)::text AS dono,
       p.prosecdef AS security_definer,
       coalesce(p.proconfig::text, '(sem configuracao)') AS configuracao,
       coalesce(p.proacl::text, '(padrao)') AS acl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'rc2_internal'
ORDER BY 2;

SELECT 'EVD-CONSTRAINT' AS evidence_id, c.conrelid::regclass::text AS tabela, c.conname::text AS nome,
       c.convalidated AS validada, pg_get_constraintdef(c.oid) AS definicao
FROM pg_constraint c
WHERE c.conrelid IN (to_regclass('public.leads'), to_regclass('public.lead_notes'),
                     to_regclass('public.lead_activity'))
UNION ALL
SELECT 'EVD-INDICE', tablename::text, indexname::text, true, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('leads', 'lead_notes', 'lead_activity')
ORDER BY 1, 2, 3;

-- Volume agregado (sem dado pessoal): base para a triagem de recuperação.
SELECT 'EVD-VOLUME' AS evidence_id,
       (SELECT count(*) FROM public.leads) AS total_leads,
       (SELECT count(*) FROM public.lead_notes) AS total_notas,
       (SELECT count(*) FROM public.lead_activity) AS total_atividades;

ROLLBACK;
