-- E3/018 — preflight READ ONLY com asserções. NÃO EXECUTADO.
-- Autorizar o alvo ANTES de qualquer consulta, inclusive de catálogo.
--
-- COMO LER O RESULTADO
--   * UMA consulta devolve uma linha por check (check_id, expected, actual, pass) e, por
--     último, a linha RESULTADO. Só vale como aprovação se RESULTADO tiver actual = 'APROVADO'.
--   * Check ausente, resultado NULL e comparação NULL contam como FALHA.
--   * PRE-01 falha se o script for executado fora de uma transação READ ONLY.
--   * Estado esperado: ANTES da 018 (nenhum objeto da 018 existe), com a 017 aplicada e o job da
--     011 presente. Este arquivo NÃO serve para o estado posterior (use verify.sql).
--   * PROJETO CORRETO: abra a conexão contra o ref autorizado (confira o ref na URL do painel antes
--     de colar). PRE-02 reforça: o ISOLADO tem a linha-marcador em public.settings (key
--     '__rc2_isolated_test_env__', value = ref do projeto isolado). EDITE a linha `alvo` abaixo:
--       * isolado   -> ref 'pyhhygvdjokddphftuua' (o marcador deve ser igual ao ref);
--       * produção  -> ref 'ausente' (produção NÃO tem marcador; o ref autorizado é conferido na URL).
--   * Nenhum dado pessoal é lido: só catálogo e contagens.
BEGIN READ ONLY;

WITH
alvo(ref) AS (VALUES ('pyhhygvdjokddphftuua')),
checks(ord, check_id, expected, actual) AS (
  VALUES
  (1, 'PRE-01-TRANSACAO-SOMENTE-LEITURA', 'on', current_setting('transaction_read_only')),
  (2, 'PRE-02-ALVO-ESPERADO-MARCADOR-DE-AMBIENTE', (SELECT ref FROM alvo), coalesce((SELECT btrim(value::text, '"') FROM public.settings WHERE key = '__rc2_isolated_test_env__'), 'ausente')),
  (3, 'PRE-03-PAPEIS-ANON-AUTHENTICATED-SERVICE', '3', (SELECT count(*)::text FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role'))),
  (4, 'PRE-04-TABELA-LEADS-EXISTE-ALVO-CORRETO', 'true', (to_regclass('public.leads') IS NOT NULL)::text),
  (5, 'PRE-05-ADMIN-USERS-EXISTE', 'true', (to_regclass('public.admin_users') IS NOT NULL)::text),
  (6, 'PRE-06-AUTHENTICATED-LE-ADMIN-USERS-USADO-PELAS-POLICIES', 'true', has_table_privilege('authenticated', 'public.admin_users', 'SELECT')::text),
  (7, 'PRE-07-MIGRATION-017-TABELA-PRESENTE', 'true', (to_regclass('public.rate_limit_counters') IS NOT NULL)::text),
  (8, 'PRE-08-MIGRATION-017-FUNCAO-PRESENTE', 'true', (to_regprocedure('public.rate_limit_hit(text,integer,integer)') IS NOT NULL)::text),
  (9, 'PRE-09-MIGRATION-017-JOB-DE-PURGA-PRESENTE', '1', (SELECT count(*)::text FROM cron.job WHERE jobname = 'purge-rate-limit-counters')),
  (10, 'PRE-10-JOB-PUBLISH-SCHEDULED-POSTS-DA-011-PRESENTE', '1', (SELECT count(*)::text FROM cron.job WHERE jobname = 'publish-scheduled-posts')),
  (11, 'PRE-11-PG-CRON-HABILITADO', '1', (SELECT count(*)::text FROM pg_extension WHERE extname = 'pg_cron')),
  (12, 'PRE-12-GEN-RANDOM-UUID-DISPONIVEL', 'true', (to_regprocedure('gen_random_uuid()') IS NOT NULL)::text),
  (13, 'PRE-13-NENHUMA-TABELA-DA-018-EXISTE', '0', (SELECT count(*)::text FROM unnest(ARRAY['newsletter_subscribers','newsletter_outbox','newsletter_tokens','newsletter_outbox_payload','newsletter_consents']) t WHERE to_regclass('public.' || t) IS NOT NULL)),
  (14, 'PRE-14-NENHUMA-FUNCAO-NEWSLETTER-EXISTE', '0', (SELECT count(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname LIKE 'newsletter\_%')),
  (15, 'PRE-15-NENHUM-INDICE-NEWSLETTER-EXISTE', '0', (SELECT count(*)::text FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'newsletter\_%')),
  (16, 'PRE-16-NENHUMA-POLICY-NEWSLETTER-EXISTE', '0', (SELECT count(*)::text FROM pg_policies WHERE schemaname = 'public' AND policyname LIKE 'newsletter\_%')),
  (17, 'PRE-17-NENHUM-JOB-NEWSLETTER-AGENDADO', '0', (SELECT count(*)::text FROM cron.job WHERE jobname LIKE 'newsletter%'))
),
res AS (
  SELECT ord, check_id, expected, actual, (actual IS NOT NULL AND actual = expected) AS pass FROM checks
)
SELECT check_id, expected, actual, pass
FROM (
  SELECT ord, check_id, expected, actual, pass FROM res
  UNION ALL
  SELECT 999, 'RESULTADO', 'APROVADO',
         CASE WHEN count(*) = 17 AND bool_and(pass) THEN 'APROVADO' ELSE 'REPROVADO' END,
         count(*) = 17 AND bool_and(pass)
    FROM res
) s
ORDER BY ord;

ROLLBACK;
