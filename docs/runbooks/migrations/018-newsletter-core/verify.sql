-- E3/018 — verify READ ONLY com asserções. NÃO EXECUTADO.
-- Executar DEPOIS do apply, no mesmo alvo autorizado.
--
-- COMO LER O RESULTADO
--   * UMA consulta devolve uma linha por check (check_id, expected, actual, pass) e, por
--     último, a linha RESULTADO. Só vale como aprovação se RESULTADO tiver actual = 'APROVADO'.
--   * Check ausente, resultado NULL e comparação NULL contam como FALHA.
--   * Este arquivo NÃO exercita as funções (elas escrevem). O comportamento transacional é
--     coberto no isolado pelos testes de integração da newsletter (a escrever, T-NL-I*).
--   * Nenhum dado pessoal é lido: só catálogo.
BEGIN READ ONLY;

WITH

checks(ord, check_id, expected, actual) AS (
  VALUES
  (1, 'POS-01-TRANSACAO-SOMENTE-LEITURA', 'on', current_setting('transaction_read_only')),
  (2, 'POS-02-CINCO-TABELAS-EXISTEM', '5', (SELECT count(*)::text FROM unnest(ARRAY['newsletter_subscribers','newsletter_outbox','newsletter_tokens','newsletter_outbox_payload','newsletter_consents']) t WHERE to_regclass('public.' || t) IS NOT NULL)),
  (3, 'POS-COLUNAS-SUBSCRIBERS', 'confirmed_at,created_at,email,email_normalized,id,last_request_at,status,unsubscribed_at,updated_at', (SELECT string_agg(attname::text, ',' ORDER BY attname COLLATE "C") FROM pg_attribute WHERE attrelid = to_regclass('public.newsletter_subscribers') AND attnum > 0 AND NOT attisdropped)),
  (4, 'POS-COLUNAS-OUTBOX', 'attempts,consent_text_version,created_at,dead_reason,deadline_at,first_attempt_at,id,idempotency_key,kind,last_error_code,lease_until,next_attempt_at,outcome_unknown,policy_version,provider_message_id,sent_at,status,subscriber_id,updated_at', (SELECT string_agg(attname::text, ',' ORDER BY attname COLLATE "C") FROM pg_attribute WHERE attrelid = to_regclass('public.newsletter_outbox') AND attnum > 0 AND NOT attisdropped)),
  (5, 'POS-COLUNAS-TOKENS', 'consent_text_version,created_at,expires_at,id,kind,last_used_at,outbox_id,policy_version,subscriber_id,token_hash', (SELECT string_agg(attname::text, ',' ORDER BY attname COLLATE "C") FROM pg_attribute WHERE attrelid = to_regclass('public.newsletter_tokens') AND attnum > 0 AND NOT attisdropped)),
  (6, 'POS-COLUNAS-OUTBOX-PAYLOAD', 'confirm_token,created_at,outbox_id,template_version,unsubscribe_token', (SELECT string_agg(attname::text, ',' ORDER BY attname COLLATE "C") FROM pg_attribute WHERE attrelid = to_regclass('public.newsletter_outbox_payload') AND attnum > 0 AND NOT attisdropped)),
  (7, 'POS-COLUNAS-CONSENTS', 'consent_text_version,created_at,event,id,ip_hash,policy_version,reason,source_path,subscriber_id', (SELECT string_agg(attname::text, ',' ORDER BY attname COLLATE "C") FROM pg_attribute WHERE attrelid = to_regclass('public.newsletter_consents') AND attnum > 0 AND NOT attisdropped)),
  (8, 'POS-CHAVES-PRIMARIAS-5', '5', (SELECT count(*)::text FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid WHERE c.contype = 'p' AND r.relnamespace = 'public'::regnamespace AND r.relname LIKE 'newsletter\_%')),
  (9, 'POS-UNIQUE-EMAIL-NORMALIZED-TOKEN-HASH-IDEMPOTENCY', 'newsletter_outbox_idempotency_key_key,newsletter_subscribers_email_normalized_key,newsletter_tokens_token_hash_key', (SELECT string_agg(conname::text, ',' ORDER BY conname COLLATE "C") FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid WHERE c.contype = 'u' AND r.relnamespace = 'public'::regnamespace AND r.relname LIKE 'newsletter\_%')),
  (10, 'POS-FKS-E-REGRAS-DE-EXCLUSAO', 'newsletter_consents_subscriber_fkey:c,newsletter_outbox_payload_outbox_fkey:c,newsletter_outbox_subscriber_fkey:c,newsletter_tokens_outbox_fkey:n,newsletter_tokens_subscriber_fkey:c', (SELECT string_agg(conname::text || ':' || confdeltype::text, ',' ORDER BY conname COLLATE "C") FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid WHERE c.contype = 'f' AND r.relnamespace = 'public'::regnamespace AND r.relname LIKE 'newsletter\_%')),
  (11, 'POS-CHECKS-TOTAL', '25', (SELECT count(*)::text FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid WHERE c.contype = 'c' AND r.relnamespace = 'public'::regnamespace AND r.relname LIKE 'newsletter\_%')),
  (12, 'POS-INDICES-TOTAL', '15', (SELECT count(*)::text FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE 'newsletter\_%')),
  (13, 'POS-INDICE-PARCIAL-UMA-MENSAGEM-EM-ABERTO', 'true', (SELECT (indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%(subscriber_id, kind)%' AND indexdef LIKE '%queued%' AND indexdef LIKE '%sending%' AND indexdef LIKE '%retry%')::text FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'newsletter_outbox_one_open_per_kind')),
  (14, 'POS-IDEMPOTENCY-KEY-GERADA', 's', (SELECT attgenerated::text FROM pg_attribute WHERE attrelid = to_regclass('public.newsletter_outbox') AND attname = 'idempotency_key')),
  (15, 'POS-RLS-LIGADO-EM-TODAS', '5', (SELECT count(*)::text FROM pg_class r WHERE r.relnamespace = 'public'::regnamespace AND r.relname LIKE 'newsletter\_%' AND r.relkind = 'r' AND r.relrowsecurity)),
  (16, 'POS-POLICIES-SOMENTE-SELECT-ADMIN-EM-3-TABELAS', 'newsletter_consents_admin_select:SELECT,newsletter_outbox_admin_select:SELECT,newsletter_subscribers_admin_select:SELECT', (SELECT string_agg(policyname::text || ':' || cmd::text, ',' ORDER BY policyname COLLATE "C") FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'newsletter\_%')),
  (17, 'POS-POLICIES-SOMENTE-PARA-AUTHENTICATED', '{authenticated}', (SELECT string_agg(DISTINCT roles::text, ',') FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'newsletter\_%')),
  (18, 'POS-TOKENS-E-PAYLOAD-SEM-POLICY', '0', (SELECT count(*)::text FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('newsletter_tokens', 'newsletter_outbox_payload'))),
  (19, 'POS-ANON-SEM-NENHUM-PRIVILEGIO-NAS-TABELAS', '0', (SELECT count(*)::text FROM unnest(ARRAY['newsletter_subscribers','newsletter_outbox','newsletter_tokens','newsletter_outbox_payload','newsletter_consents']) t CROSS JOIN unnest(string_to_array('SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER', ',')) p WHERE has_table_privilege('anon', 'public.' || t, p))),
  (20, 'POS-AUTHENTICATED-SO-SELECT-EM-3-TABELAS', 'newsletter_consents:SELECT,newsletter_outbox:SELECT,newsletter_subscribers:SELECT', (SELECT string_agg(t || ':' || p, ',' ORDER BY t COLLATE "C", p) FROM unnest(ARRAY['newsletter_subscribers','newsletter_outbox','newsletter_tokens','newsletter_outbox_payload','newsletter_consents']) t CROSS JOIN unnest(string_to_array('SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER', ',')) p WHERE has_table_privilege('authenticated', 'public.' || t, p))),
  (21, 'POS-ADMIN-NAO-LE-TOKENS-NEM-PAYLOAD', 'false', (has_table_privilege('authenticated', 'public.newsletter_tokens', 'SELECT') OR has_table_privilege('authenticated', 'public.newsletter_outbox_payload', 'SELECT'))::text),
  (22, 'POS-SERVICE-ROLE-SELECT-INSERT-UPDATE-DELETE-EM-TODAS', '20', (SELECT count(*)::text FROM unnest(ARRAY['newsletter_subscribers','newsletter_outbox','newsletter_tokens','newsletter_outbox_payload','newsletter_consents']) t CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) p WHERE has_table_privilege('service_role', 'public.' || t, p))),
  (23, 'POS-PUBLIC-SEM-ACL-NAS-TABELAS', '0', (SELECT count(*)::text FROM pg_class r CROSS JOIN LATERAL aclexplode(r.relacl) a WHERE r.relnamespace = 'public'::regnamespace AND r.relname LIKE 'newsletter\_%' AND r.relkind = 'r' AND a.grantee = 0)),
  (24, 'POS-NOVE-FUNCOES-EXISTEM', '9', (SELECT count(*)::text FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'newsletter\_%')),
  (25, 'POS-FUNCOES-ASSINATURAS-ESPERADAS', '9', (SELECT count(*)::text FROM unnest(ARRAY['public.newsletter_touch_updated_at()','public.newsletter_request_subscription(text,text,text,text,text,text)','public.newsletter_request_unsubscribe_link(text)','public.newsletter_confirm(text,text)','public.newsletter_unsubscribe(text,text)','public.newsletter_outbox_claim(integer,integer,text[])','public.newsletter_outbox_prepare(uuid,integer,text,text,text,text,text)','public.newsletter_outbox_complete(uuid,integer,text,text,text,timestamp with time zone,text,boolean)','public.newsletter_outbox_expire()']) f WHERE to_regprocedure(f) IS NOT NULL)),
  (26, 'POS-NENHUMA-FUNCAO-COM-PRIVILEGIOS-DO-DONO', '0', (SELECT count(*)::text FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'newsletter\_%' AND p.prosecdef)),
  (27, 'POS-SEARCH-PATH-FIXO-EM-TODAS', '9', (SELECT count(*)::text FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'newsletter\_%' AND p.proconfig::text LIKE '%search_path=pg_catalog, public%')),
  (28, 'POS-ANON-AUTHENTICATED-SEM-EXECUTE-EM-TODAS', '0', (SELECT count(*)::text FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'newsletter\_%' AND (has_function_privilege('anon', p.oid, 'EXECUTE') OR has_function_privilege('authenticated', p.oid, 'EXECUTE')))),
  (29, 'POS-PUBLIC-SEM-EXECUTE-EM-TODAS', '0', (SELECT count(*)::text FROM pg_proc p CROSS JOIN LATERAL aclexplode(p.proacl) a WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'newsletter\_%' AND a.grantee = 0)),
  (30, 'POS-SERVICE-ROLE-COM-EXECUTE-NAS-8-FUNCOES-DO-FLUXO', '8', (SELECT count(*)::text FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'newsletter\_%' AND p.proname <> 'newsletter_touch_updated_at' AND has_function_privilege('service_role', p.oid, 'EXECUTE'))),
  (31, 'POS-TRIGGERS-UPDATED-AT-EM-SUBSCRIBERS-E-OUTBOX', 'newsletter_outbox_touch_updated_at,newsletter_subscribers_touch_updated_at', (SELECT string_agg(tgname::text, ',' ORDER BY tgname COLLATE "C") FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (to_regclass('public.newsletter_subscribers'), to_regclass('public.newsletter_outbox')))),
  (32, 'POS-SEM-VINCULO-COM-LEADS-NENHUMA-FK-PARA-FORA-DA-NEWSLETTER', '0', (SELECT count(*)::text FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid JOIN pg_class f ON f.oid = c.confrelid WHERE c.contype = 'f' AND r.relnamespace = 'public'::regnamespace AND r.relname LIKE 'newsletter\_%' AND NOT (f.relnamespace = 'public'::regnamespace AND f.relname LIKE 'newsletter\_%'))),
  (33, 'POS-SEM-FK-DE-OUTRA-TABELA-PARA-A-NEWSLETTER', '0', (SELECT count(*)::text FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid JOIN pg_class f ON f.oid = c.confrelid WHERE c.contype = 'f' AND f.relnamespace = 'public'::regnamespace AND f.relname LIKE 'newsletter\_%' AND NOT (r.relnamespace = 'public'::regnamespace AND r.relname LIKE 'newsletter\_%'))),
  (34, 'POS-SEM-COLUNA-LEAD-NAS-TABELAS-NEWSLETTER', '0', (SELECT count(*)::text FROM pg_attribute a JOIN pg_class r ON r.oid = a.attrelid WHERE r.relnamespace = 'public'::regnamespace AND r.relname LIKE 'newsletter\_%' AND r.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped AND a.attname LIKE '%lead%')),
  (35, 'POS-TOKENS-SEM-COLUNA-DE-TOKEN-BRUTO', 'false', (EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass('public.newsletter_tokens') AND attname IN ('token', 'raw_token', 'confirm_token', 'unsubscribe_token') AND NOT attisdropped))::text),
  (36, 'POS-TOKEN-BRUTO-SOMENTE-NO-PAYLOAD-TRANSITORIO', 'confirm_token,unsubscribe_token', (SELECT string_agg(attname::text, ',' ORDER BY attname COLLATE "C") FROM pg_attribute WHERE attrelid = to_regclass('public.newsletter_outbox_payload') AND attname LIKE '%token%' AND NOT attisdropped)),
  (37, 'POS-NENHUM-JOB-NEWSLETTER-AGENDADO', '0', (SELECT count(*)::text FROM cron.job WHERE jobname LIKE 'newsletter%')),
  (38, 'POS-JOB-DA-011-INTACTO', '*/5 * * * *', (SELECT schedule FROM cron.job WHERE jobname = 'publish-scheduled-posts')),
  (39, 'POS-JOB-DA-017-INTACTO', '17 * * * *', (SELECT schedule FROM cron.job WHERE jobname = 'purge-rate-limit-counters')),
  (40, 'POS-FUNCAO-RATE-LIMIT-HIT-DA-017-INTACTA', 'true', (to_regprocedure('public.rate_limit_hit(text,integer,integer)') IS NOT NULL)::text)
),
res AS (
  SELECT ord, check_id, expected, actual, (actual IS NOT NULL AND actual = expected) AS pass FROM checks
)
SELECT check_id, expected, actual, pass
FROM (
  SELECT ord, check_id, expected, actual, pass FROM res
  UNION ALL
  SELECT 999, 'RESULTADO', 'APROVADO',
         CASE WHEN count(*) = 40 AND bool_and(pass) THEN 'APROVADO' ELSE 'REPROVADO' END,
         count(*) = 40 AND bool_and(pass)
    FROM res
) s
ORDER BY ord;

ROLLBACK;
