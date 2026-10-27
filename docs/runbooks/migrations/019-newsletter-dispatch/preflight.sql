-- E3/019 (N2) — preflight READ ONLY com asserções. NÃO EXECUTADO.
-- Autorizar o alvo ANTES de qualquer consulta, inclusive de catálogo.
--
-- COMO LER O RESULTADO
--   * UMA consulta devolve uma linha por check (check_id, expected, actual, pass) e, por
--     último, a linha RESULTADO. Só vale como aprovação se RESULTADO tiver actual = 'APROVADO'.
--   * Check ausente, resultado NULL e comparação NULL contam como FALHA.
--   * Estado esperado: ANTES da 019, com a 018 aplicada, pg_cron, pg_net e Vault INSTALADOS e os
--     dois segredos já criados no Vault. Enquanto pg_net não estiver instalado (PRE-09) ou os
--     segredos não existirem (PRE-12), o preflight REPROVA de propósito: é o portão da N2.
--   * O preflight só consulta NOMES de segredos (vault.secrets). O valor jamais é lido aqui; a
--     migration valida o formato da URL e o tamanho do segredo no seu guard, sem expô-los.
--   * PROJETO CORRETO: abra a conexão contra o ref autorizado (confira o ref na URL do painel).
--     EDITE a linha `alvo` abaixo: isolado -> 'pyhhygvdjokddphftuua' (o marcador deve ser igual);
--     produção -> 'ausente' (produção NÃO tem marcador).
--   * Nenhum dado pessoal é lido: só catálogo e contagens.
--   * pg_net NO SUPABASE HOSPEDADO: net.http_request_queue e net._http_response pertencem a
--     supabase_admin e têm SELECT concedido a PUBLIC; o postgres não pode assumir esse papel e um
--     REVOKE não tem efeito. Por isso NÃO se exige "SELECT = false". Os checks 15B-15D exigem, em
--     vez disso: anon/authenticated sem LOGIN, nenhum papel com LOGIN fora da lista prevista e o
--     schema net fora de pgrst.db_schemas. 15D lê o papel authenticator; se a configuração não
--     puder ser lida o resultado é 'nao_verificavel' = REPROVADO (exige a evidência manual G-1 do
--     README ANTES do apply; nunca se presume aprovação). O README documenta a exposição
--     transitória dos cabeçalhos HTTP (inclusive o bearer) no pg_net e os gates manuais G-1 a G-3.
BEGIN READ ONLY;

WITH
alvo(ref) AS (VALUES ('pyhhygvdjokddphftuua')),
checks(ord, check_id, expected, actual) AS (
  VALUES
  (1, 'PRE-01-TRANSACAO-SOMENTE-LEITURA', 'on', current_setting('transaction_read_only')),
  (2, 'PRE-02-ALVO-ESPERADO-MARCADOR-DE-AMBIENTE', (SELECT ref FROM alvo), coalesce((SELECT btrim(value::text, '"') FROM public.settings WHERE key = '__rc2_isolated_test_env__'), 'ausente')),
  (3, 'PRE-03-PAPEIS-ANON-AUTHENTICATED-SERVICE', '3', (SELECT count(*)::text FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role'))),
  (4, 'PRE-04-TABELA-LEADS-EXISTE-ALVO-CORRETO', 'true', (to_regclass('public.leads') IS NOT NULL)::text),
  (5, 'PRE-05-MIGRATION-018-CINCO-TABELAS-PRESENTES', '5', (SELECT count(*)::text FROM unnest(ARRAY['newsletter_subscribers','newsletter_outbox','newsletter_tokens','newsletter_outbox_payload','newsletter_consents']) t WHERE to_regclass('public.' || t) IS NOT NULL)),
  (6, 'PRE-06-MIGRATION-018-NOVE-FUNCOES-PRESENTES', '9', (SELECT count(*)::text FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'newsletter\_%')),
  (7, 'PRE-07-MIGRATION-017-FUNCAO-PRESENTE', 'true', (to_regprocedure('public.rate_limit_hit(text,integer,integer)') IS NOT NULL)::text),
  (8, 'PRE-08-PG-CRON-INSTALADO', '1', (SELECT count(*)::text FROM pg_extension WHERE extname = 'pg_cron')),
  (9, 'PRE-09-PG-NET-INSTALADO', '1', (SELECT count(*)::text FROM pg_extension WHERE extname = 'pg_net')),
  (10, 'PRE-10-VAULT-INSTALADO', '1', (SELECT count(*)::text FROM pg_extension WHERE extname = 'supabase_vault')),
  (11, 'PRE-11-VAULT-DECRYPTED-SECRETS-DISPONIVEL', 'true', (to_regclass('vault.decrypted_secrets') IS NOT NULL)::text),
  (12, 'PRE-12-SEGREDOS-DO-VAULT-CRIADOS-SO-OS-NOMES', '2', coalesce((SELECT CASE WHEN to_regclass('vault.secrets') IS NULL THEN 'ausente' ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM vault.secrets WHERE name IN (''newsletter_dispatch_url'', ''newsletter_dispatch_secret'')', false, true, '')))[1]::text END), 'ausente')),
  (13, 'PRE-13-JOB-PUBLISH-SCHEDULED-POSTS-DA-011-PRESENTE', '1', coalesce((SELECT CASE WHEN to_regclass('cron.job') IS NULL THEN 'ausente' ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM cron.job WHERE jobname = ''publish-scheduled-posts''', false, true, '')))[1]::text END), 'ausente')),
  (14, 'PRE-14-JOB-PURGE-RATE-LIMIT-COUNTERS-DA-017-PRESENTE', '1', coalesce((SELECT CASE WHEN to_regclass('cron.job') IS NULL THEN 'ausente' ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM cron.job WHERE jobname = ''purge-rate-limit-counters''', false, true, '')))[1]::text END), 'ausente')),
  (15, 'PRE-15B-ANON-E-AUTHENTICATED-SEM-LOGIN', '0', (SELECT count(*)::text FROM pg_roles WHERE rolname IN ('anon', 'authenticated') AND rolcanlogin)),
  (16, 'PRE-15C-ROLES-COM-LOGIN-TODOS-PREVISTOS', 'nenhum', coalesce((SELECT string_agg(rolname::text, ',' ORDER BY rolname) FROM pg_roles WHERE rolcanlogin AND rolname NOT IN ('postgres', 'supabase_admin', 'authenticator', 'pgbouncer', 'supabase_auth_admin', 'supabase_storage_admin', 'supabase_read_only_user', 'supabase_replication_admin', 'supabase_etl_admin') AND rolname NOT LIKE 'pg\_%'), 'nenhum')),
  (17, 'PRE-15D-SCHEMA-NET-FORA-DA-DATA-API', 'nao_exposto', (SELECT CASE WHEN count(v) = 0 THEN 'nao_verificavel' WHEN bool_or(string_to_array(regexp_replace(v, '\s', '', 'g'), ',') @> ARRAY['net']) THEN 'exposto' ELSE 'nao_exposto' END FROM (SELECT (SELECT substr(c, length('pgrst.db_schemas=') + 1) FROM unnest(d.setconfig) c WHERE c LIKE 'pgrst.db_schemas=%') AS v FROM pg_db_role_setting d WHERE d.setrole = (SELECT oid FROM pg_roles WHERE rolname = 'authenticator')) q)),
  (18, 'PRE-15-NENHUM-JOB-NEWSLETTER-AGENDADO', '0', coalesce((SELECT CASE WHEN to_regclass('cron.job') IS NULL THEN 'ausente' ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM cron.job WHERE jobname LIKE ''newsletter%''', false, true, '')))[1]::text END), 'ausente'))
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
