-- E0c/017 — verify READ ONLY com asserções. NÃO EXECUTADO.
-- Executar DEPOIS do apply, no mesmo alvo autorizado.
--
-- COMO LER O RESULTADO
--   * UMA consulta devolve uma linha por check (check_id, expected, actual, pass) e, por
--     último, a linha RESULTADO. Só vale como aprovação se RESULTADO tiver actual = 'APROVADO'.
--   * Check ausente, resultado NULL e comparação NULL contam como FALHA.
--   * Este arquivo NÃO exercita a função (ela escreve). O comportamento (incremento atômico,
--     limites, independência de leads) é coberto por tests/integration/rls/e0c-rate-limit.test.ts.
--   * Nenhum dado pessoal é lido: só catálogo.
BEGIN READ ONLY;

WITH
rel AS (SELECT c.oid, c.relrowsecurity, c.relacl FROM pg_class c WHERE c.oid = to_regclass('public.rate_limit_counters')),
fn AS (SELECT p.oid, p.prosecdef, p.provolatile, p.proconfig, p.proacl
         FROM pg_proc p WHERE p.oid = to_regprocedure('public.rate_limit_hit(text,integer,integer)')),
checks(ord, check_id, expected, actual) AS (
  VALUES
  (1, 'POS-01-TRANSACAO-SOMENTE-LEITURA', 'on', current_setting('transaction_read_only')),
  (2, 'POS-02-TABELA-EXISTE', '1', (SELECT count(*)::text FROM rel)),
  (3, 'POS-03-COLUNAS', 'count,key,window_start',
      (SELECT string_agg(attname::text, ',' ORDER BY attname) FROM pg_attribute
        WHERE attrelid = to_regclass('public.rate_limit_counters') AND attnum > 0 AND NOT attisdropped)),
  (4, 'POS-04-CHAVE-PRIMARIA-KEY-WINDOW-START', 'key,window_start',
      (SELECT string_agg(a.attname::text, ',' ORDER BY k.ord)
         FROM pg_constraint c
         CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
         JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
        WHERE c.conrelid = to_regclass('public.rate_limit_counters') AND c.contype = 'p')),
  (5, 'POS-05-INDICE-WINDOW-START-PARA-A-PURGA', '1',
      (SELECT count(*)::text FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'rate_limit_counters'
          AND indexname = 'rate_limit_counters_window_start_idx')),
  (6, 'POS-06-RLS-LIGADO', 'true', (SELECT relrowsecurity::text FROM rel)),
  (7, 'POS-07-SEM-POLICIES', '0',
      (SELECT count(*)::text FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rate_limit_counters')),
  (8, 'POS-08-ANON-SEM-PRIVILEGIOS-NA-TABELA', 'false',
      has_table_privilege('anon', 'public.rate_limit_counters', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')::text),
  (9, 'POS-09-AUTHENTICATED-SEM-PRIVILEGIOS-NA-TABELA', 'false',
      has_table_privilege('authenticated', 'public.rate_limit_counters', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')::text),
  (10, 'POS-10-SERVICE-ROLE-SELECT-INSERT-UPDATE-DELETE', 'true',
      (has_table_privilege('service_role', 'public.rate_limit_counters', 'SELECT')
       AND has_table_privilege('service_role', 'public.rate_limit_counters', 'INSERT')
       AND has_table_privilege('service_role', 'public.rate_limit_counters', 'UPDATE')
       AND has_table_privilege('service_role', 'public.rate_limit_counters', 'DELETE'))::text),
  (11, 'POS-11-PUBLIC-SEM-ACL-NA-TABELA', '0',
      (SELECT count(*)::text FROM rel CROSS JOIN LATERAL aclexplode(rel.relacl) a WHERE a.grantee = 0)),
  (12, 'POS-12-FUNCAO-EXISTE', '1', (SELECT count(*)::text FROM fn)),
  (13, 'POS-13-SECURITY-INVOKER', 'false', (SELECT prosecdef::text FROM fn)),
  (14, 'POS-14-SEARCH-PATH-FIXO', 'true',
      (SELECT (proconfig @> ARRAY['search_path=pg_catalog, public'])::text FROM fn)),
  (15, 'POS-15-VOLATIL', 'v', (SELECT provolatile::text FROM fn)),
  (16, 'POS-16-RETORNO-ALLOWED-COUNT-RESET-AT', 'TABLE(allowed boolean, count integer, reset_at timestamp with time zone)',
      (SELECT pg_get_function_result(fn.oid) FROM fn)),
  (17, 'POS-17-ANON-SEM-EXECUTE', 'false',
      has_function_privilege('anon', to_regprocedure('public.rate_limit_hit(text,integer,integer)'), 'EXECUTE')::text),
  (18, 'POS-18-AUTHENTICATED-SEM-EXECUTE', 'false',
      has_function_privilege('authenticated', to_regprocedure('public.rate_limit_hit(text,integer,integer)'), 'EXECUTE')::text),
  (19, 'POS-19-SERVICE-ROLE-COM-EXECUTE', 'true',
      has_function_privilege('service_role', to_regprocedure('public.rate_limit_hit(text,integer,integer)'), 'EXECUTE')::text),
  (20, 'POS-20-PUBLIC-SEM-EXECUTE', '0',
      (SELECT count(*)::text FROM fn CROSS JOIN LATERAL aclexplode(fn.proacl) a WHERE a.grantee = 0)),
  (21, 'POS-21-JOB-DE-PURGA-AGENDADO', '17 * * * *',
      (SELECT schedule FROM cron.job WHERE jobname = 'purge-rate-limit-counters')),
  (22, 'POS-22-JOB-DE-PURGA-REMOVE-RATE-LIMIT-COUNTERS-COM-2-DIAS', 'true',
      (SELECT (command LIKE '%rate_limit_counters%' AND command LIKE '%2 days%')::text
         FROM cron.job WHERE jobname = 'purge-rate-limit-counters')),
  (23, 'POS-23-JOB-DA-011-INTACTO', '*/5 * * * *',
      (SELECT schedule FROM cron.job WHERE jobname = 'publish-scheduled-posts'))
),
res AS (
  SELECT ord, check_id, expected, actual, (actual IS NOT NULL AND actual = expected) AS pass FROM checks
)
SELECT check_id, expected, actual, pass
FROM (
  SELECT ord, check_id, expected, actual, pass FROM res
  UNION ALL
  SELECT 999, 'RESULTADO', 'APROVADO',
         CASE WHEN count(*) = 23 AND bool_and(pass) THEN 'APROVADO' ELSE 'REPROVADO' END,
         count(*) = 23 AND bool_and(pass)
    FROM res
) s
ORDER BY ord;

ROLLBACK;
