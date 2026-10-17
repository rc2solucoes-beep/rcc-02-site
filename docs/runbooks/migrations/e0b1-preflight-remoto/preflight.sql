-- E0b.1 — Preflight remoto. SOMENTE LEITURA. Executar apenas com autorização explícita.
-- A garantia de somente leitura é a transação BEGIN READ ONLY abaixo. O lint
-- automático é complementar e não substitui a revisão humana.
-- Cobre PV-01 a PV-04 e o estado necessário às migrations 012 e 013.
-- Se o bloco 8 (cron.job) falhar porque a extensão pg_cron não existe, a transação
-- inteira aborta: rode os blocos 1 a 7 e 9 a 11 sem o bloco 8 e registre PV-04.
BEGIN READ ONLY;

-- 1. Policies de leads, admin_audit_logs, posts e admin_users (PV-01, PV-02).
-- Esperado: leads_anon_insert presente em leads (PV-01); nenhuma policy de SELECT em
-- admin_audit_logs (PV-02). Divergência: registrar; a 012/013 são idempotentes.
SELECT tablename, policyname, cmd, roles, permissive, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename IN ('leads', 'admin_audit_logs', 'posts', 'admin_users')
ORDER BY tablename, policyname;

-- 2. RLS ligado nas tabelas relevantes.
-- Esperado: relrowsecurity = true em todas.
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('leads', 'admin_audit_logs', 'posts', 'admin_users', 'settings', 'authors')
ORDER BY c.relname;

-- 3. Privilégios de anon e authenticated (EV-22).
-- Esperado: grants padrão do Supabase (a RLS é a única barreira). Alvo da 012/013:
-- anon sem nenhum acesso a leads; sem escrita em admin_audit_logs.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN ('leads', 'admin_audit_logs', 'posts')
ORDER BY table_name, grantee, privilege_type;

-- 4. Privilégios por coluna para anon em leads.
-- Esperado: nenhum privilégio de coluna isolado (os da tabela já aparecem no bloco 3).
SELECT table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'leads' AND grantee = 'anon'
ORDER BY column_name, privilege_type;

-- 5. Funções (PV-03).
-- Esperado: bootstrap_first_admin presente (migration 008) e rls_auto_enable presente
-- (EV-10: só no remoto). Ausência é divergência a registrar.
SELECT p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer, p.proacl
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('bootstrap_first_admin', 'rls_auto_enable')
ORDER BY p.proname;

-- 6. Event triggers (EV-10: ensure_rls só no remoto).
SELECT evtname, evtevent, evtenabled
FROM pg_catalog.pg_event_trigger
ORDER BY evtname;

-- 7. Extensões (PV-04).
-- Esperado: pg_cron, pg_net e pgcrypto instaladas. A E0c exige pg_cron.
SELECT extname, extversion
FROM pg_catalog.pg_extension
WHERE extname IN ('pg_cron', 'pg_net', 'pgcrypto')
ORDER BY extname;

-- 8. Job de publicação agendada (PV-03).
-- Esperado: publish-scheduled-posts ativo, a cada 5 minutos (*/5 * * * *).
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobid;

-- 9. Índices e constraints de admin_audit_logs.
-- Esperado: aplicados só em parte (EV-09). Compare por definição antes da 013.
SELECT indexname, indexdef
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public' AND tablename = 'admin_audit_logs'
ORDER BY indexname;

SELECT conname, pg_catalog.pg_get_constraintdef(oid) AS definicao
FROM pg_catalog.pg_constraint
WHERE conrelid = 'public.admin_audit_logs'::regclass
ORDER BY conname;

-- 10. Tabelas de backup fora do escopo (DT-07). Informativo.
SELECT tablename
FROM pg_catalog.pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'idx02_links_backup%'
ORDER BY tablename;

-- 11. Volumes e colunas (EV-09, EV-11). Informativo.
SELECT count(*) AS leads_linhas FROM public.leads;

SELECT count(*) AS audit_linhas FROM public.admin_audit_logs;

SELECT count(*) AS leads_colunas
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads';

ROLLBACK;
