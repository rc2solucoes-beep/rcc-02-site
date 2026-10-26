-- E2/016 — preflight READ ONLY com asserções. NÃO EXECUTADO.
-- Autorizar o alvo ANTES de qualquer consulta, inclusive de catálogo.
--
-- COMO LER O RESULTADO
--   * UMA consulta devolve uma linha por check (check_id, expected, actual, pass),
--     as linhas EVD-*/DIGEST-* (snapshot para recuperação) e, por último, a linha
--     RESULTADO. Só vale como aprovação se RESULTADO tiver actual = 'APROVADO'.
--   * Check ausente, resultado NULL e comparação NULL contam como FALHA.
--   * PRE-01 falha se o script for executado fora de uma transação READ ONLY.
--   * Estado esperado: ANTES da 016, com a 012 e a 015 aplicadas. Este arquivo NÃO
--     serve para o estado posterior (use verify.sql).
--   * O lint (checkReadOnlySql) é complementar: a garantia real é o BEGIN READ ONLY.
--     Nenhuma coluna de dado pessoal é lida: só contagem e hash.
--   * VOLUME-LEADS é INFORMATIVO. O total e o hash de leads PODEM mudar entre duas
--     execuções (o formulário recebe leads legítimos); não é critério de aprovação.
--     O critério de integridade é a comparação feita DENTRO da transação da migration.
BEGIN READ ONLY;

WITH
rl AS (SELECT oid, rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role')),
lead_rel AS (SELECT c.oid, c.relowner, c.relrowsecurity, c.relacl FROM pg_class c WHERE c.oid = to_regclass('public.leads')),
checks(ord, check_id, expected, actual) AS (
  VALUES
  (1, 'PRE-01-TRANSACAO-SOMENTE-LEITURA', 'on', current_setting('transaction_read_only')),
  (2, 'PRE-02-PAPEIS-ANON-AUTHENTICATED-SERVICE', '3', (SELECT count(*)::text FROM rl)),
  (3, 'PRE-03-TABELAS-DA-015', '2',
      (SELECT count(*)::text FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname IN ('lead_notes', 'lead_activity'))),
  (4, 'PRE-04-COLUNAS-DA-015-EM-LEADS', 'archived_at,next_action,next_action_at,status,status_updated_at,updated_at',
      (SELECT string_agg(attname::text, ',' ORDER BY attname) FROM pg_attribute
        WHERE attrelid = to_regclass('public.leads') AND NOT attisdropped
          AND attname IN ('status', 'status_updated_at', 'next_action', 'next_action_at', 'archived_at', 'updated_at'))),
  (5, 'PRE-05-POLICIES-DE-LEADS-ESTADO-FINAL-DA-015',
      'leads_e2_admin_delete:DELETE:{authenticated};leads_e2_admin_select:SELECT:{authenticated};leads_e2_admin_update:UPDATE:{authenticated}',
      (SELECT string_agg(policyname || ':' || cmd || ':' || roles::text, ';' ORDER BY policyname)
         FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads')),
  (6, 'PRE-06-AUTHENTICATED-TEM-DELETE-EM-LEADS', 'true', has_table_privilege('authenticated', 'public.leads', 'DELETE')::text),
  (7, 'PRE-07-AUTHENTICATED-TEM-SELECT-EM-LEADS', 'true', has_table_privilege('authenticated', 'public.leads', 'SELECT')::text),
  (8, 'PRE-08-AUTHENTICATED-SEM-OUTROS-PRIVILEGIOS-DE-TABELA', 'false',
      has_table_privilege('authenticated', 'public.leads', 'INSERT,UPDATE,TRUNCATE,REFERENCES,TRIGGER')::text),
  (9, 'PRE-09-COLUNAS-COM-UPDATE-PARA-AUTHENTICATED', 'archived_at,next_action,next_action_at,status',
      (SELECT string_agg(a.attname::text, ',' ORDER BY a.attname) FROM pg_attribute a
        WHERE a.attrelid = to_regclass('public.leads') AND a.attnum > 0 AND NOT a.attisdropped
          AND has_column_privilege('authenticated', a.attrelid, a.attnum, 'UPDATE'))),
  (10, 'PRE-10-ANON-SEM-PRIVILEGIO-EM-LEADS', 'false',
      (has_table_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       OR has_any_column_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,REFERENCES'))::text),
  (11, 'PRE-11-RLS-LIGADA-EM-LEADS', 'true', (SELECT relrowsecurity::text FROM lead_rel)),
  (12, 'PRE-12-SERVICE-ROLE-COM-OS-QUATRO-PRIVILEGIOS', 'DELETE,INSERT,SELECT,UPDATE',
      (SELECT string_agg(p, ',' ORDER BY p) FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS p
        WHERE has_table_privilege('service_role', 'public.leads', p))),
  (13, 'PRE-13-EXECUTOR-E-DONO-DE-LEADS', 'true',
      (SELECT pg_has_role(current_user, relowner, 'USAGE')::text FROM lead_rel)),
  (14, 'PRE-14-TRIGGERS-DE-LEADS', 'leads_10_before_update,leads_20_set_updated_at,leads_30_activity',
      (SELECT string_agg(tgname::text, ',' ORDER BY tgname) FROM pg_trigger
        WHERE tgrelid = to_regclass('public.leads') AND NOT tgisinternal))
),
graded AS (SELECT ord, check_id, expected, actual, (actual IS NOT DISTINCT FROM expected) AS pass FROM checks)
SELECT check_id, expected, actual, pass::text AS pass FROM (
  SELECT ord, check_id, expected, actual, pass FROM graded
  UNION ALL
  SELECT 90, 'RESULTADO', 'APROVADO',
         CASE WHEN (SELECT count(*) FROM graded) = 14 AND coalesce((SELECT bool_and(pass) FROM graded), false) THEN 'APROVADO' ELSE 'REPROVADO' END,
         (SELECT count(*) FROM graded) = 14 AND coalesce((SELECT bool_and(pass) FROM graded), false)
  UNION ALL
  SELECT 100, 'DIGEST-ACL-LEADS', '(informativo)',
         md5(coalesce((SELECT relacl::text FROM lead_rel), '') || '|' ||
             coalesce((SELECT string_agg(attname::text || ':' || attacl::text, ';' ORDER BY attname)
                         FROM pg_attribute WHERE attrelid = to_regclass('public.leads') AND attacl IS NOT NULL), '')),
         NULL
  UNION ALL
  SELECT 101, 'DIGEST-POLICIES-LEADS', '(informativo)',
         md5(coalesce((SELECT string_agg(policyname || '|' || permissive || '|' || roles::text || '|' || cmd || '|' ||
                                        coalesce(qual, '') || '|' || coalesce(with_check, ''), ';' ORDER BY policyname)
                         FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads'), '')),
         NULL
  UNION ALL
  -- Definição da policy que a 016 remove: necessária para reconstruí-la numa eventual 017.
  SELECT 102, 'EVD-POLICY-DELETE-DEFINICAO', '(informativo)',
         coalesce((SELECT cmd || '|' || roles::text || '|' || coalesce(qual, '') || '|' || coalesce(with_check, '')
                     FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'leads_e2_admin_delete'), '(ausente)'),
         NULL
  UNION ALL
  SELECT 103, 'DIGEST-NOTAS-E-ATIVIDADE', '(informativo)',
         md5(coalesce((SELECT string_agg(c.relname || '|' || coalesce(c.relacl::text, '') || '|' || c.relrowsecurity::text, ';' ORDER BY c.relname)
                         FROM pg_class c WHERE c.oid IN (to_regclass('public.lead_notes'), to_regclass('public.lead_activity'))), '') || '|' ||
             coalesce((SELECT string_agg(tablename || '|' || policyname || '|' || roles::text || '|' || cmd || '|' ||
                                        coalesce(qual, '') || '|' || coalesce(with_check, ''), ';' ORDER BY tablename, policyname)
                         FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('lead_notes', 'lead_activity')), '')),
         NULL
  UNION ALL
  SELECT 104, 'DIGEST-TRIGGERS-LEADS', '(informativo)',
         md5(coalesce((SELECT string_agg(tgname::text || '|' || tgenabled::text || '|' || pg_get_triggerdef(oid), ';' ORDER BY tgname)
                         FROM pg_trigger WHERE tgrelid = to_regclass('public.leads') AND NOT tgisinternal), '')),
         NULL
  UNION ALL
  -- INFORMATIVO: só contagem e hash (sem dado pessoal). Pode variar entre execuções.
  SELECT 105, 'VOLUME-LEADS', '(informativo)',
         (SELECT count(*)::text || ' leads; hash ' || md5(coalesce(string_agg(md5(to_jsonb(l)::text), ',' ORDER BY l.id), ''))
            FROM public.leads l),
         NULL
) s
ORDER BY ord;

ROLLBACK;
