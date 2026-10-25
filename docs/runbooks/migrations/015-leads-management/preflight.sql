-- E2/015 — preflight READ ONLY com asserções. NÃO EXECUTADO.
-- Autorizar o alvo ANTES de qualquer consulta, inclusive de catálogo.
--
-- COMO LER O RESULTADO
--   * A 1ª consulta devolve uma linha por check (check_id, expected, actual, pass)
--     e, por último, a linha RESULTADO. Só vale como aprovação se a linha
--     RESULTADO tiver actual = 'APROVADO'. Qualquer outra coisa é REPROVAÇÃO.
--   * Check ausente (contagem diferente de expected_checks), resultado NULL e
--     comparação NULL contam como FALHA, nunca como aprovação.
--   * Erro de catálogo (relação inexistente, papel inexistente, etc.) aborta a
--     transação: sem a linha RESULTADO = APROVADO, o preflight está REPROVADO.
--   * PRE-01 falha se o script for executado fora de uma transação READ ONLY.
--   * Estado esperado: ANTES da 015, com a 012 já aplicada. Este arquivo NÃO
--     serve para o estado posterior (use verify.sql). Depois de um rollback
--     estrutural completo, ele deve voltar a APROVAR com os mesmos digests.
--   * O lint (checkReadOnlySql) é complementar: a garantia real é o
--     BEGIN READ ONLY. Nenhuma consulta lê dado pessoal dos leads (só contagem).
--   * As consultas EVD-*/DIGEST-* seguintes são o SNAPSHOT para recuperação:
--     guardar a saída (sem segredos) na evidência desta execução.
BEGIN READ ONLY;

WITH
meta AS (SELECT 28 AS expected_checks),
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
  SELECT 'PRE-01-TRANSACAO-SOMENTE-LEITURA', 'on',
         current_setting('transaction_read_only')
  UNION ALL
  SELECT 'PRE-02-VERSAO-POSTGRES-13-OU-MAIS', 'true',
         (current_setting('server_version_num')::int >= 130000)::text
  UNION ALL
  SELECT 'PRE-03-PAPEIS-ANON-E-AUTHENTICATED', '2',
         (SELECT count(*)::text FROM rl)
  UNION ALL
  SELECT 'PRE-04-PAPEIS-SEM-SUPERUSER-NEM-BYPASSRLS', '0',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE (count(*) FILTER (WHERE pr.rolsuper OR pr.rolbypassrls))::text END
          FROM pg_roles pr WHERE pr.rolname IN ('anon', 'authenticated'))
  UNION ALL
  SELECT 'PRE-05-TABELAS-LEADS-E-ADMIN-USERS', '2',
         (SELECT count(*)::text FROM rel WHERE relname IN ('leads', 'admin_users'))
  UNION ALL
  SELECT 'PRE-06-AUTH-USERS-EXISTE', 'true',
         (to_regclass('auth.users') IS NOT NULL)::text
  UNION ALL
  SELECT 'PRE-07-GEN-RANDOM-UUID-DISPONIVEL', 'true',
         (to_regprocedure('gen_random_uuid()') IS NOT NULL)::text
  UNION ALL
  SELECT 'PRE-08-UPDATE-UPDATED-AT-COMPATIVEL', '1',
         (SELECT count(*)::text
          FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.proname = 'update_updated_at' AND p.pronargs = 0
            AND p.prorettype = 'pg_catalog.trigger'::regtype AND NOT p.prosecdef
            AND p.prosrc ~* 'new\.updated_at\s*=\s*now\(\)')
  UNION ALL
  SELECT 'PRE-09-EXECUTOR-E-DONO-DE-LEADS', 'true',
         (SELECT (pg_catalog.pg_get_userbyid(relowner) = current_user)::text
          FROM rel WHERE relname = 'leads')
  UNION ALL
  SELECT 'PRE-10-DOZE-COLUNAS-HISTORICAS', '12',
         (SELECT count(*)::text
          FROM pg_attribute a JOIN rel ON rel.oid = a.attrelid
          WHERE rel.relname = 'leads' AND a.attnum > 0 AND NOT a.attisdropped
            AND a.attname IN ('id', 'name', 'company', 'email', 'whatsapp', 'segment',
                              'size', 'solution', 'message', 'source', 'ip_hash', 'created_at'))
  UNION ALL
  SELECT 'PRE-11-SEM-COLUNAS-DA-015', '(nenhum)',
         (SELECT coalesce(string_agg(a.attname::text, ', ' ORDER BY a.attname), '(nenhum)')
          FROM pg_attribute a JOIN rel ON rel.oid = a.attrelid
          WHERE rel.relname = 'leads' AND a.attnum > 0 AND NOT a.attisdropped
            AND a.attname IN ('status', 'status_updated_at', 'next_action',
                              'next_action_at', 'archived_at', 'updated_at'))
  UNION ALL
  SELECT 'PRE-12-SEM-LEAD-NOTES-E-LEAD-ACTIVITY', 'true',
         (to_regclass('public.lead_notes') IS NULL AND to_regclass('public.lead_activity') IS NULL)::text
  UNION ALL
  SELECT 'PRE-13-SEM-SCHEMA-RC2-INTERNAL', 'true',
         (NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'rc2_internal'))::text
  UNION ALL
  SELECT 'PRE-14-SEM-CONSTRAINTS-DA-015', '(nenhum)',
         (SELECT coalesce(string_agg(c.conname::text, ', ' ORDER BY c.conname), '(nenhum)')
          FROM pg_constraint c
          WHERE c.conrelid = to_regclass('public.leads')
            AND c.conname IN ('leads_e2_status_check', 'leads_e2_next_action_check'))
  UNION ALL
  SELECT 'PRE-15-SEM-INDICES-DA-015', '(nenhum)',
         (SELECT coalesce(string_agg(n, ', ' ORDER BY n), '(nenhum)')
          FROM unnest(ARRAY['leads_e2_active_created_idx', 'leads_e2_status_created_idx',
                            'leads_e2_next_action_idx', 'lead_notes_lead_created_idx',
                            'lead_activity_lead_created_idx']) AS n
          WHERE to_regclass('public.' || n) IS NOT NULL)
  UNION ALL
  SELECT 'PRE-16-012-SEM-POLICY-LEADS-ANON-INSERT', '0',
         (SELECT count(*)::text FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'leads_anon_insert')
  UNION ALL
  SELECT 'PRE-17-012-NENHUMA-POLICY-DE-LEADS-ALCANCA-ANON-OU-PUBLIC', '0',
         (SELECT count(*)::text FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'leads'
            AND roles && ARRAY['anon', 'public']::name[])
  UNION ALL
  SELECT 'PRE-18-SO-POLICIES-CONHECIDAS-EM-LEADS', '(nenhum)',
         (SELECT coalesce(string_agg(policyname::text, ', ' ORDER BY policyname), '(nenhum)')
          FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'leads'
            AND policyname NOT IN ('leads_anon_insert', 'Only admins can read leads',
                                   'Only admins can update leads', 'leads_auth_select',
                                   'leads_auth_update'))
  UNION ALL
  SELECT 'PRE-19-SEM-TRIGGERS-DE-USUARIO-EM-LEADS', '(nenhum)',
         (SELECT coalesce(string_agg(t.tgname::text, ', ' ORDER BY t.tgname), '(nenhum)')
          FROM pg_trigger t
          WHERE t.tgrelid = to_regclass('public.leads') AND NOT t.tgisinternal)
  UNION ALL
  SELECT 'PRE-20-012-ANON-SEM-PRIVILEGIO-DE-TABELA-EM-LEADS', 'false',
         (SELECT (p_select OR p_insert OR p_update OR p_delete OR p_truncate OR p_references OR p_trigger)::text
          FROM tp WHERE rolname = 'anon' AND relname = 'leads')
  UNION ALL
  SELECT 'PRE-21-012-ANON-SEM-PRIVILEGIO-DE-COLUNA-EM-LEADS', '0',
         (SELECT CASE WHEN count(*) = 0 THEN NULL
                      ELSE (count(*) FILTER (WHERE c_select OR c_insert OR c_update OR c_references))::text END
          FROM cp WHERE rolname = 'anon' AND relname = 'leads')
  UNION ALL
  SELECT 'PRE-22-LEADS-SEM-ACL-CONCEDIDA-A-PUBLIC', '0',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM rel WHERE relname = 'leads')
                      THEN (SELECT count(*)::text FROM pub WHERE relname = 'leads') END)
  UNION ALL
  SELECT 'PRE-23-SEM-VIEWS-OU-REGRAS-DEPENDENTES-DE-LEADS', '(nenhum)',
         (SELECT coalesce(string_agg(DISTINCT v.relname::text, ', '), '(nenhum)')
          FROM pg_depend d
          JOIN pg_rewrite rw ON rw.oid = d.objid
          JOIN pg_class v ON v.oid = rw.ev_class
          WHERE d.classid = 'pg_catalog.pg_rewrite'::regclass
            AND d.refobjid = to_regclass('public.leads')
            AND v.oid <> to_regclass('public.leads'))
  UNION ALL
  SELECT 'PRE-24-SEM-FK-EXTERNA-PARA-LEADS', '(nenhum)',
         (SELECT coalesce(string_agg(c.conname::text, ', ' ORDER BY c.conname), '(nenhum)')
          FROM pg_constraint c WHERE c.confrelid = to_regclass('public.leads'))
  UNION ALL
  SELECT 'PRE-25-AUTHENTICATED-LE-ADMIN-USERS', 'true',
         (SELECT p_select::text FROM tp WHERE rolname = 'authenticated' AND relname = 'admin_users')
  UNION ALL
  SELECT 'PRE-26-POLICY-DE-SELECT-EM-ADMIN-USERS-PARA-AUTHENTICATED', 'true',
         (SELECT (count(*) >= 1)::text FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'admin_users'
            AND cmd IN ('SELECT', 'ALL') AND roles && ARRAY['authenticated', 'public']::name[])
  UNION ALL
  SELECT 'PRE-27-LEADS-SEM-FORCE-RLS', 'false',
         (SELECT relforcerowsecurity::text FROM rel WHERE relname = 'leads')
  UNION ALL
  SELECT 'PRE-28-AUTHENTICATED-LE-LEADS-ANTES-DA-015', 'true',
         (SELECT p_select::text FROM tp WHERE rolname = 'authenticated' AND relname = 'leads')
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

-- ─── Snapshot de recuperação (sem dado pessoal) ─────────────────────────────
-- EVD-1: dono, RLS e ACL de tabela (ACL NULL = padrão: só o dono).
SELECT 'EVD-ACL-TABELA' AS evidence_id,
       n.nspname || '.' || c.relname AS objeto,
       pg_catalog.pg_get_userbyid(c.relowner)::text AS dono,
       c.relrowsecurity AS rls,
       c.relforcerowsecurity AS rls_forcada,
       coalesce(c.relacl::text, '(padrao: somente o dono)') AS acl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname, c.relname) IN (('public', 'leads'), ('public', 'admin_users'),
                                 ('public', 'lead_notes'), ('public', 'lead_activity'),
                                 ('auth', 'users'))
ORDER BY 2;

-- EVD-2: ACL de coluna (só colunas com ACL própria).
SELECT 'EVD-ACL-COLUNA' AS evidence_id,
       c.relname || '.' || a.attname AS objeto,
       a.attacl::text AS acl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
WHERE n.nspname = 'public' AND c.relname IN ('leads', 'admin_users', 'lead_notes', 'lead_activity')
  AND a.attacl IS NOT NULL
ORDER BY 2;

-- EVD-3: privilégios padrão e ACL de schema.
SELECT 'EVD-ACL-PADRAO' AS evidence_id,
       pg_catalog.pg_get_userbyid(d.defaclrole)::text AS dono,
       coalesce(ns.nspname::text, '(global)') AS schema,
       d.defaclobjtype::text AS tipo,
       d.defaclacl::text AS acl
FROM pg_default_acl d LEFT JOIN pg_namespace ns ON ns.oid = d.defaclnamespace
UNION ALL
SELECT 'EVD-ACL-SCHEMA', nspowner::regrole::text, nspname::text, 'schema',
       coalesce(nspacl::text, '(padrao: somente o dono)')
FROM pg_namespace WHERE nspname IN ('public', 'auth', 'rc2_internal');

-- EVD-4: definição completa das policies (para recriar com fidelidade).
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

-- EVD-5: triggers de leads, posts e settings.
SELECT 'EVD-TRIGGER' AS evidence_id,
       c.relname::text AS tabela,
       t.tgname::text AS gatilho,
       t.tgenabled::text AS habilitado,
       pg_get_triggerdef(t.oid) AS definicao
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('leads', 'posts', 'settings') AND NOT t.tgisinternal
ORDER BY 2, 3;

-- EVD-6: função reaproveitada pela 015.
SELECT 'EVD-FUNCAO' AS evidence_id,
       p.oid::regprocedure::text AS funcao,
       pg_catalog.pg_get_userbyid(p.proowner)::text AS dono,
       coalesce(p.proacl::text, '(padrao)') AS acl,
       md5(p.prosrc) AS md5_corpo,
       pg_get_functiondef(p.oid) AS definicao
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'update_updated_at';

-- EVD-7: constraints e índices de leads por DEFINIÇÃO.
SELECT 'EVD-CONSTRAINT' AS evidence_id, c.conname::text AS nome, c.contype::text AS tipo,
       c.convalidated AS validada, pg_get_constraintdef(c.oid) AS definicao
FROM pg_constraint c WHERE c.conrelid = to_regclass('public.leads')
UNION ALL
SELECT 'EVD-INDICE', indexname::text, 'i', true, indexdef
FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'leads'
ORDER BY 1, 2;

-- EVD-8: volume agregado (sem dado pessoal).
SELECT 'EVD-VOLUME' AS evidence_id, count(*) AS total_leads FROM public.leads;

-- DIGEST: impressões comparáveis depois de uma recuperação. O estado anterior
-- à 015 só está restaurado quando este arquivo voltar a APROVAR e todos os
-- digests forem IGUAIS aos guardados daqui.
SELECT 'DIGEST-ACL' AS evidence_id,
       md5(coalesce(string_agg(x, ';' ORDER BY x), '')) AS digest, count(*) AS itens
FROM (
  SELECT 'T:' || c.relname || '|' || pg_catalog.pg_get_userbyid(c.relowner)::text
         || '|' || c.relrowsecurity::text || '|' || c.relforcerowsecurity::text
         || '|' || coalesce(c.relacl::text, '') AS x
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname IN ('leads', 'admin_users')
  UNION ALL
  SELECT 'C:' || c.relname || '.' || a.attname || '|' || a.attacl::text
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
  WHERE n.nspname = 'public' AND c.relname IN ('leads', 'admin_users') AND a.attacl IS NOT NULL
) s
UNION ALL
SELECT 'DIGEST-POLICIES',
       md5(coalesce(string_agg(x, ';' ORDER BY x), '')), count(*)
FROM (
  SELECT p.tablename || '|' || p.policyname || '|' || p.permissive || '|' || p.roles::text
         || '|' || p.cmd || '|' || coalesce(p.qual, '') || '|' || coalesce(p.with_check, '') AS x
  FROM pg_policies p
  WHERE p.schemaname = 'public' AND p.tablename IN ('leads', 'admin_users')
) s
UNION ALL
SELECT 'DIGEST-TRIGGERS',
       md5(coalesce(string_agg(x, ';' ORDER BY x), '')), count(*)
FROM (
  SELECT c.relname || '|' || t.tgname || '|' || t.tgenabled::text || '|' || pg_get_triggerdef(t.oid) AS x
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname IN ('leads', 'posts', 'settings') AND NOT t.tgisinternal
) s
UNION ALL
SELECT 'DIGEST-FUNCAO',
       md5(coalesce(string_agg(x, ';' ORDER BY x), '')), count(*)
FROM (
  SELECT p.oid::regprocedure::text || '|' || md5(p.prosrc) || '|' || coalesce(p.proacl::text, '') AS x
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'update_updated_at'
) s
UNION ALL
SELECT 'DIGEST-CONSTRAINTS-E-INDICES',
       md5(coalesce(string_agg(x, ';' ORDER BY x), '')), count(*)
FROM (
  SELECT 'K:' || c.conname || '|' || c.convalidated::text || '|' || pg_get_constraintdef(c.oid) AS x
  FROM pg_constraint c WHERE c.conrelid = to_regclass('public.leads')
  UNION ALL
  SELECT 'I:' || indexname || '|' || indexdef
  FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'leads'
) s;

ROLLBACK;
