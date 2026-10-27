-- E3/019 (N2) — verify READ ONLY com asserções. NÃO EXECUTADO.
-- Executar DEPOIS do apply, no mesmo alvo autorizado.
--
-- COMO LER O RESULTADO
--   * UMA consulta devolve uma linha por check (check_id, expected, actual, pass) e, por
--     último, a linha RESULTADO. Só vale como aprovação se RESULTADO tiver actual = 'APROVADO'.
--   * Check ausente, resultado NULL e comparação NULL contam como FALHA.
--   * Este arquivo NÃO dispara o job nem chama a rota. A demonstração ponta a ponta (autenticação,
--     200/401, idempotência, recuperação) é o LC-01 (runbook README, seção "LC-01").
--   * POS-15B a POS-15D repetem os controles de acesso ao pg_net do preflight (sem SELECT = false:
--     as tabelas net pertencem a supabase_admin no Supabase hospedado). Ver README, "Gates manuais".
--   * Lê o COMANDO dos jobs (não contém segredo); nunca lê o valor de um segredo do Vault.
BEGIN READ ONLY;

WITH

checks(ord, check_id, expected, actual) AS (
  VALUES
  (1, 'POS-01-TRANSACAO-SOMENTE-LEITURA', 'on', current_setting('transaction_read_only')),
  (2, 'POS-02-DISPATCH-AGENDADO-A-CADA-MINUTO', '* * * * *', (SELECT schedule FROM cron.job WHERE jobname = 'newsletter-dispatch')),
  (3, 'POS-03-MANUTENCAO-AGENDADA-A-CADA-5-MINUTOS', '*/5 * * * *', (SELECT schedule FROM cron.job WHERE jobname = 'newsletter-maintenance')),
  (4, 'POS-04-DISPATCH-ATIVO-E-MANUTENCAO-ATIVA', '2', (SELECT count(*)::text FROM cron.job WHERE jobname IN ('newsletter-dispatch', 'newsletter-maintenance') AND active)),
  (5, 'POS-05-DISPATCH-USA-NET-HTTP-POST-E-VAULT', 'true', (SELECT (command LIKE '%net.http_post%' AND command LIKE '%vault.decrypted_secrets%' AND command LIKE '%newsletter_dispatch_url%' AND command LIKE '%newsletter_dispatch_secret%')::text FROM cron.job WHERE jobname = 'newsletter-dispatch')),
  (6, 'POS-06-DISPATCH-TIMEOUT-125000-MAIOR-QUE-MAXDURATION-120S', 'true', (SELECT (command LIKE '%timeout_milliseconds := 125000%')::text FROM cron.job WHERE jobname = 'newsletter-dispatch')),
  (7, 'POS-07-DISPATCH-SEM-CREDENCIAL-LITERAL', 'false', (SELECT (command ~ 'Bearer [A-Za-z0-9_-]{16,}' OR command ~* 'nlt_|re_[A-Za-z0-9]{10,}')::text FROM cron.job WHERE jobname = 'newsletter-dispatch')),
  (8, 'POS-08-MANUTENCAO-CHAMA-EXPIRE', 'true', (SELECT (command LIKE '%newsletter_outbox_expire()%')::text FROM cron.job WHERE jobname = 'newsletter-maintenance')),
  (9, 'POS-09-EXATAMENTE-2-JOBS-NEWSLETTER', '2', (SELECT count(*)::text FROM cron.job WHERE jobname LIKE 'newsletter%')),
  (10, 'POS-10-JOB-DA-011-INTACTO', '*/5 * * * *', (SELECT schedule FROM cron.job WHERE jobname = 'publish-scheduled-posts')),
  (11, 'POS-11-JOB-DA-017-INTACTO', '17 * * * *', (SELECT schedule FROM cron.job WHERE jobname = 'purge-rate-limit-counters')),
  (12, 'POS-12-MIGRATION-018-INTACTA-NOVE-FUNCOES', '9', (SELECT count(*)::text FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'newsletter\_%')),
  (13, 'POS-13-SEGREDOS-DO-VAULT-AINDA-PRESENTES', '2', coalesce((SELECT CASE WHEN to_regclass('vault.secrets') IS NULL THEN 'ausente' ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM vault.secrets WHERE name IN (''newsletter_dispatch_url'', ''newsletter_dispatch_secret'')', false, true, '')))[1]::text END), 'ausente')),
  (14, 'POS-13B-DISPATCH-BYPASS-OPCIONAL-VEM-DO-VAULT-SEM-LITERAL', 'false', (SELECT (command ~* 'x-vercel-protection-bypass''\s*,\s*''[A-Za-z0-9]{16,}' OR (command LIKE '%x-vercel-protection-bypass%' AND command NOT LIKE '%newsletter_dispatch_bypass%'))::text FROM cron.job WHERE jobname = 'newsletter-dispatch')),
  (15, 'POS-15B-ANON-E-AUTHENTICATED-SEM-LOGIN', '0', (SELECT count(*)::text FROM pg_roles WHERE rolname IN ('anon', 'authenticated') AND rolcanlogin)),
  (16, 'POS-15C-ROLES-COM-LOGIN-TODOS-PREVISTOS', 'nenhum', coalesce((SELECT string_agg(rolname::text, ',' ORDER BY rolname) FROM pg_roles WHERE rolcanlogin AND rolname NOT IN ('postgres', 'supabase_admin', 'authenticator', 'pgbouncer', 'supabase_auth_admin', 'supabase_storage_admin', 'supabase_read_only_user', 'supabase_replication_admin', 'supabase_etl_admin') AND rolname NOT LIKE 'pg\_%'), 'nenhum')),
  (17, 'POS-15D-SCHEMA-NET-FORA-DA-DATA-API', 'nao_exposto', (SELECT CASE WHEN count(v) = 0 THEN 'nao_verificavel' WHEN bool_or(string_to_array(regexp_replace(v, '\s', '', 'g'), ',') @> ARRAY['net']) THEN 'exposto' ELSE 'nao_exposto' END FROM (SELECT (SELECT substr(c, length('pgrst.db_schemas=') + 1) FROM unnest(d.setconfig) c WHERE c LIKE 'pgrst.db_schemas=%') AS v FROM pg_db_role_setting d WHERE d.setrole = (SELECT oid FROM pg_roles WHERE rolname = 'authenticator')) q)),
  (18, 'POS-14-PG-NET-INSTALADO', '1', (SELECT count(*)::text FROM pg_extension WHERE extname = 'pg_net'))
),
res AS (
  SELECT ord, check_id, expected, actual, (actual IS NOT NULL AND actual = expected) AS pass FROM checks
)
SELECT check_id, expected, actual, pass
FROM (
  SELECT ord, check_id, expected, actual, pass FROM res
  UNION ALL
  SELECT 999, 'RESULTADO', 'APROVADO',
         CASE WHEN count(*) = 18 AND bool_and(pass) THEN 'APROVADO' ELSE 'REPROVADO' END,
         count(*) = 18 AND bool_and(pass)
    FROM res
) s
ORDER BY ord;

ROLLBACK;
