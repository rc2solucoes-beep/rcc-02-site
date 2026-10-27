-- E0c/017 — preflight READ ONLY com asserções. NÃO EXECUTADO.
-- Autorizar o alvo ANTES de qualquer consulta, inclusive de catálogo.
--
-- COMO LER O RESULTADO
--   * UMA consulta devolve uma linha por check (check_id, expected, actual, pass) e, por
--     último, a linha RESULTADO. Só vale como aprovação se RESULTADO tiver actual = 'APROVADO'.
--   * Check ausente, resultado NULL e comparação NULL contam como FALHA.
--   * PRE-01 falha se o script for executado fora de uma transação READ ONLY.
--   * Estado esperado: ANTES da 017 (nenhum objeto da 017 existe), com pg_cron habilitado.
--     Este arquivo NÃO serve para o estado posterior (use verify.sql).
--   * Nenhum dado pessoal é lido: só catálogo e contagens.
BEGIN READ ONLY;

WITH
checks(ord, check_id, expected, actual) AS (
  VALUES
  (1, 'PRE-01-TRANSACAO-SOMENTE-LEITURA', 'on', current_setting('transaction_read_only')),
  (2, 'PRE-02-PAPEIS-ANON-AUTHENTICATED-SERVICE', '3',
      (SELECT count(*)::text FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role'))),
  (3, 'PRE-03-TABELA-LEADS-EXISTE-ALVO-CORRETO', 'true', (to_regclass('public.leads') IS NOT NULL)::text),
  (4, 'PRE-04-TABELA-RATE-LIMIT-COUNTERS-AUSENTE', 'true', (to_regclass('public.rate_limit_counters') IS NULL)::text),
  (5, 'PRE-05-FUNCAO-RATE-LIMIT-HIT-AUSENTE', 'true',
      (to_regprocedure('public.rate_limit_hit(text,integer,integer)') IS NULL)::text),
  (6, 'PRE-06-PG-CRON-HABILITADO', '1', (SELECT count(*)::text FROM pg_extension WHERE extname = 'pg_cron')),
  (7, 'PRE-07-JOB-DE-PURGA-AUSENTE', '0',
      (SELECT count(*)::text FROM cron.job WHERE jobname = 'purge-rate-limit-counters')),
  (8, 'PRE-08-JOB-PUBLISH-SCHEDULED-POSTS-DA-011-PRESENTE', '1',
      (SELECT count(*)::text FROM cron.job WHERE jobname = 'publish-scheduled-posts'))
),
res AS (
  SELECT ord, check_id, expected, actual, (actual IS NOT NULL AND actual = expected) AS pass FROM checks
)
SELECT check_id, expected, actual, pass
FROM (
  SELECT ord, check_id, expected, actual, pass FROM res
  UNION ALL
  SELECT 999, 'RESULTADO', 'APROVADO',
         CASE WHEN count(*) = 8 AND bool_and(pass) THEN 'APROVADO' ELSE 'REPROVADO' END,
         count(*) = 8 AND bool_and(pass)
    FROM res
) s
ORDER BY ord;

ROLLBACK;
