-- Verificação do SNAPSHOT HISTÓRICO do AMBIENTE ISOLADO. SOMENTE LEITURA
-- (a garantia é BEGIN READ ONLY; o lint automático é complementar).
-- Rodar APENAS no projeto de teste (nunca em produção; a consulta equivalente
-- em produção pertence ao E0b.1 e exige autorização).
--
-- Os valores esperados refletem o snapshot histórico de docs/07-supabase-migration-baseline.md
-- (30/08) e os metadados de 13/10. Este arquivo NÃO afirma paridade atual com a
-- produção: ela só pode ser confirmada no preflight E0b.1. Divergência não é
-- erro por si só: registre-a na evidência.
BEGIN READ ONLY;

-- A. Seis tabelas com RLS ligado. Esperado: 6 linhas, rowsecurity = true.
SELECT tablename, rowsecurity FROM pg_catalog.pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('leads', 'posts', 'settings', 'admin_users', 'authors', 'admin_audit_logs')
ORDER BY tablename;

-- B. Policies por tabela.
-- Esperado: admin_users 4, authors 4, leads 3, posts 2, settings 2; admin_audit_logs AUSENTE (0 policies).
SELECT tablename, count(*) AS policies FROM pg_catalog.pg_policies
WHERE schemaname = 'public' GROUP BY tablename ORDER BY tablename;

-- C. A policy insegura do snapshot está reproduzida (R1). Esperado: 1.
SELECT count(*) AS leads_anon_insert FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'leads_anon_insert';

-- D. bootstrap_first_admin ausente, como no snapshot. Esperado: 0.
SELECT count(*) AS bootstrap_first_admin FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'bootstrap_first_admin';

-- E. Colunas de posts. Esperado: 34 (inclui faq_items e cta_block).
SELECT count(*) AS posts_columns FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'posts';

-- F. CHECK de status de posts inclui 'scheduled'.
SELECT pg_get_constraintdef(oid) AS definicao FROM pg_catalog.pg_constraint
WHERE conrelid = 'public.posts'::regclass AND conname = 'posts_status_check';

-- G. Índices de admin_audit_logs.
-- Esperado: apenas a chave primária e os dois índices da migration 010 (severity_idx e resource_idx);
-- sem created_at_idx, event_idx e actor_user_id_idx.
SELECT indexname FROM pg_catalog.pg_indexes
WHERE schemaname = 'public' AND tablename = 'admin_audit_logs' ORDER BY indexname;

-- H. Job de publicação agendada. Esperado: 1 linha ativa (requer pg_cron).
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'publish-scheduled-posts';

-- I. Extensões (informativo). O snapshot cita pg_cron e pgcrypto; pg_net: a verificar no E0b.1.
SELECT extname FROM pg_catalog.pg_extension
WHERE extname IN ('pg_cron', 'pgcrypto', 'pg_net') ORDER BY extname;

-- J. Objetos que, no snapshot, existem só no remoto (informativo).
-- Snapshot: ensure_rls = 1 e rls_auto_enable = 1. Se o projeto de teste não os tiver, registre a diferença.
SELECT
  (SELECT count(*) FROM pg_catalog.pg_event_trigger WHERE evtname = 'ensure_rls') AS ensure_rls,
  (SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') AS rls_auto_enable;

-- K. Marcador de ambiente de teste, exigido pela suíte. Esperado: 1 linha, com value = ref do projeto de teste.
SELECT key, value FROM public.settings WHERE key = '__rc2_isolated_test_env__';

ROLLBACK;
