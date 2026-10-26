-- E2/016 — verify READ ONLY com asserções, para o estado POSTERIOR à 016. NÃO EXECUTADO.
-- Autorizar o alvo ANTES de qualquer consulta, inclusive de catálogo.
--
-- ESTE É O VERIFY DA 016. O verify.sql da 015 descreve o estado ANTERIOR à 016 e,
-- depois dela, REPROVA de propósito em dois checks (POS-23, policies exatas de leads,
-- e POS-47, authenticated só com SELECT e DELETE). NÃO o use como critério de aprovação
-- depois da 016 e NÃO altere suas evidências históricas.
--
-- COMO LER O RESULTADO
--   * UMA consulta devolve uma linha por check (check_id, expected, actual, pass) e,
--     por último, a linha RESULTADO. Só vale como aprovação se RESULTADO tiver
--     actual = 'APROVADO'. Check ausente, NULL e comparação NULL contam como FALHA.
--   * POS-01 falha se o script for executado fora de uma transação READ ONLY.
--   * A integridade dos DADOS de leads é provada DENTRO da transação da migration
--     (contagem e hash comparados antes e depois, com a tabela bloqueada). Aqui o
--     VOLUME-LEADS é só INFORMATIVO: o formulário pode ter recebido leads novos entre
--     o preflight e esta execução, então totais diferentes NÃO indicam problema.
--   * Nenhuma coluna de dado pessoal é lida: só contagem e hash.
BEGIN READ ONLY;

WITH
lead_rel AS (SELECT c.oid, c.relrowsecurity FROM pg_class c WHERE c.oid = to_regclass('public.leads')),
checks(ord, check_id, expected, actual) AS (
  VALUES
  (1, 'POS-01-TRANSACAO-SOMENTE-LEITURA', 'on', current_setting('transaction_read_only')),
  (2, 'POS-02-AUTHENTICATED-SEM-DELETE-EM-LEADS', 'false', has_table_privilege('authenticated', 'public.leads', 'DELETE')::text),
  (3, 'POS-03-AUTHENTICATED-MANTEM-SELECT-EM-LEADS', 'true', has_table_privilege('authenticated', 'public.leads', 'SELECT')::text),
  (4, 'POS-04-AUTHENTICATED-SEM-OUTROS-PRIVILEGIOS-DE-TABELA', 'false',
      has_table_privilege('authenticated', 'public.leads', 'INSERT,UPDATE,TRUNCATE,REFERENCES,TRIGGER')::text),
  (5, 'POS-05-COLUNAS-COM-UPDATE-PARA-AUTHENTICATED', 'archived_at,next_action,next_action_at,status',
      (SELECT string_agg(a.attname::text, ',' ORDER BY a.attname) FROM pg_attribute a
        WHERE a.attrelid = to_regclass('public.leads') AND a.attnum > 0 AND NOT a.attisdropped
          AND has_column_privilege('authenticated', a.attrelid, a.attnum, 'UPDATE'))),
  (6, 'POS-06-POLICIES-DE-LEADS-EXATAS', 'leads_e2_admin_select:SELECT:{authenticated};leads_e2_admin_update:UPDATE:{authenticated}',
      (SELECT string_agg(policyname || ':' || cmd || ':' || roles::text, ';' ORDER BY policyname)
         FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads')),
  (7, 'POS-07-NENHUMA-POLICY-DE-DELETE-OU-ALL-EM-LEADS', '0',
      (SELECT count(*)::text FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads' AND cmd IN ('DELETE', 'ALL'))),
  (8, 'POS-08-RLS-LIGADA-EM-LEADS', 'true', (SELECT relrowsecurity::text FROM lead_rel)),
  (9, 'POS-09-ANON-SEM-PRIVILEGIO-EM-LEADS', 'false',
      (has_table_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       OR has_any_column_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,REFERENCES'))::text),
  (10, 'POS-10-NENHUMA-POLICY-ALCANCA-ANON-OU-PUBLIC', '0',
      (SELECT count(*)::text FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads'
         AND roles && ARRAY['anon', 'public']::name[])),
  (11, 'POS-11-SERVICE-ROLE-PRESERVADA-EM-LEADS', 'DELETE,INSERT,SELECT,UPDATE',
      (SELECT string_agg(p, ',' ORDER BY p) FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS p
        WHERE has_table_privilege('service_role', 'public.leads', p))),
  (12, 'POS-12-TRIGGERS-DE-LEADS-INALTERADOS', 'leads_10_before_update,leads_20_set_updated_at,leads_30_activity',
      (SELECT string_agg(tgname::text, ',' ORDER BY tgname) FROM pg_trigger
        WHERE tgrelid = to_regclass('public.leads') AND NOT tgisinternal)),
  (13, 'POS-13-POLICIES-DE-NOTAS-E-ATIVIDADE-INALTERADAS',
      'lead_activity:lead_activity_e2_admin_select:SELECT;lead_notes:lead_notes_e2_admin_insert:INSERT;lead_notes:lead_notes_e2_admin_select:SELECT',
      (SELECT string_agg(tablename || ':' || policyname || ':' || cmd, ';' ORDER BY tablename, policyname)
         FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('lead_notes', 'lead_activity'))),
  (14, 'POS-14-RLS-LIGADA-EM-NOTAS-E-ATIVIDADE', '2',
      (SELECT count(*)::text FROM pg_class WHERE oid IN (to_regclass('public.lead_notes'), to_regclass('public.lead_activity'))
         AND relrowsecurity)),
  (15, 'POS-15-AUTHENTICATED-EM-NOTAS-SO-SELECT-E-INSERT', 'INSERT,SELECT',
      (SELECT string_agg(p, ',' ORDER BY p) FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) AS p
        WHERE has_table_privilege('authenticated', 'public.lead_notes', p))),
  (16, 'POS-16-AUTHENTICATED-EM-ATIVIDADE-SO-SELECT', 'SELECT',
      (SELECT string_agg(p, ',' ORDER BY p) FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) AS p
        WHERE has_table_privilege('authenticated', 'public.lead_activity', p)))
),
graded AS (SELECT ord, check_id, expected, actual, (actual IS NOT DISTINCT FROM expected) AS pass FROM checks)
SELECT check_id, expected, actual, pass::text AS pass FROM (
  SELECT ord, check_id, expected, actual, pass FROM graded
  UNION ALL
  SELECT 90, 'RESULTADO', 'APROVADO',
         CASE WHEN (SELECT count(*) FROM graded) = 16 AND coalesce((SELECT bool_and(pass) FROM graded), false) THEN 'APROVADO' ELSE 'REPROVADO' END,
         (SELECT count(*) FROM graded) = 16 AND coalesce((SELECT bool_and(pass) FROM graded), false)
  UNION ALL
  SELECT 100, 'DIGEST-ACL-LEADS', '(informativo)',
         md5(coalesce((SELECT relacl::text FROM pg_class WHERE oid = to_regclass('public.leads')), '') || '|' ||
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
  SELECT 102, 'DIGEST-NOTAS-E-ATIVIDADE', '(informativo)',
         md5(coalesce((SELECT string_agg(c.relname || '|' || coalesce(c.relacl::text, '') || '|' || c.relrowsecurity::text, ';' ORDER BY c.relname)
                         FROM pg_class c WHERE c.oid IN (to_regclass('public.lead_notes'), to_regclass('public.lead_activity'))), '') || '|' ||
             coalesce((SELECT string_agg(tablename || '|' || policyname || '|' || roles::text || '|' || cmd || '|' ||
                                        coalesce(qual, '') || '|' || coalesce(with_check, ''), ';' ORDER BY tablename, policyname)
                         FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('lead_notes', 'lead_activity')), '')),
         NULL
  UNION ALL
  SELECT 103, 'DIGEST-TRIGGERS-LEADS', '(informativo)',
         md5(coalesce((SELECT string_agg(tgname::text || '|' || tgenabled::text || '|' || pg_get_triggerdef(oid), ';' ORDER BY tgname)
                         FROM pg_trigger WHERE tgrelid = to_regclass('public.leads') AND NOT tgisinternal), '')),
         NULL
  UNION ALL
  -- INFORMATIVO: pode diferir do preflight sem indicar problema (novos leads legítimos).
  SELECT 104, 'VOLUME-LEADS', '(informativo)',
         (SELECT count(*)::text || ' leads; hash ' || md5(coalesce(string_agg(md5(to_jsonb(l)::text), ',' ORDER BY l.id), ''))
            FROM public.leads l),
         NULL
) s
ORDER BY ord;

ROLLBACK;
