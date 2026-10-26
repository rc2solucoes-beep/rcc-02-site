-- E2 / 016 — Suspende a exclusão definitiva de leads pelo papel authenticated.
-- PROPOSTA NÃO APLICADA. NÃO EXECUTAR sem autorização específica por ambiente
-- (preflight do alvo → apply → verify). O histórico remoto é manual: NÃO usar
-- db push, pull ou repair. A migration 015 NÃO é modificada por esta.
--
-- O QUE FAZ (só isto):
--   1. REVOKE DELETE ON public.leads FROM authenticated;
--   2. DROP POLICY leads_e2_admin_delete ON public.leads;
-- O QUE NÃO FAZ: não toca SELECT, o UPDATE por coluna, RLS, triggers, funções,
-- lead_notes, lead_activity, anon, service_role, nem nenhuma linha de dados. Não
-- altera o formulário de contato (que grava por service_role).
--
-- POR QUE: a 015 concedeu DELETE a authenticated e criou leads_e2_admin_delete,
-- de modo que um administrador autenticado exclui leads direto pela API do
-- Supabase, contornando qualquer trava da aplicação. Sem backup completo/PITR a
-- exclusão (com ON DELETE CASCADE em notas e histórico) não é recuperável.
--
-- REABILITAR: exige uma migration NOVA e autorizada (017) que recrie o GRANT e a
-- policy; a variável LEADS_DELETE_ENABLED da aplicação sozinha NÃO basta.
--
-- PRIMEIRA APLICAÇÃO ESTRITA: não é idempotente. Se o estado esperado da 015 não
-- estiver presente, o guard aborta (transação inteira revertida). Os comandos
-- REVOKE/DROP POLICY não usam IF EXISTS, como segunda barreira.
--
-- IMPACTO: toma ACCESS EXCLUSIVE em public.leads por milissegundos. O INSERT do
-- /api/contact fica em fila nesse intervalo; se o lock não vier em 5 s a
-- migration falha (55P03) e NADA é aplicado. Repetir em janela de baixo tráfego.
--
-- FINGERPRINT: calculado e comparado DENTRO desta transação, com a tabela
-- bloqueada. Só hashes (md5) circulam; nenhum dado pessoal é lido para fora.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Lock ANTES de ler o estado: o guard, o fingerprint e a autoverificação enxergam
-- a MESMA tabela (um INSERT concorrente do formulário não gera falso aborto).
LOCK TABLE public.leads IN ACCESS EXCLUSIVE MODE;

-- ─── Guard: estado esperado (015 aplicada, 012 aplicada, nada da 016 ainda) ──
DO $guard$
DECLARE
  problems text[] := ARRAY[]::text[];
  update_cols text;
BEGIN
  IF to_regclass('public.leads') IS NULL THEN problems := problems || 'public.leads inexistente'; END IF;
  IF to_regclass('public.lead_notes') IS NULL THEN problems := problems || 'public.lead_notes inexistente: aplique a 015'; END IF;
  IF to_regclass('public.lead_activity') IS NULL THEN problems := problems || 'public.lead_activity inexistente: aplique a 015'; END IF;
  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'016 ABORTADA — pré-requisitos ausentes:\n - %', array_to_string(problems, E'\n - ');
  END IF;

  IF NOT pg_catalog.pg_has_role(current_user,
       (SELECT relowner FROM pg_catalog.pg_class WHERE oid = 'public.leads'::regclass), 'USAGE') THEN
    problems := problems || 'o executor não é dono de public.leads (o REVOKE não teria efeito)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    problems := problems || 'papel service_role inexistente';
  END IF;

  -- Estado final da 015: policies de leads exatamente select, update e delete (E2).
  IF (SELECT string_agg(policyname || ':' || cmd || ':' || roles::text, ';' ORDER BY policyname)
        FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = 'leads')
     IS DISTINCT FROM
     'leads_e2_admin_delete:DELETE:{authenticated};leads_e2_admin_select:SELECT:{authenticated};leads_e2_admin_update:UPDATE:{authenticated}' THEN
    problems := problems || 'policies de public.leads diferem do estado final da 015 (ou a 016 já foi aplicada)';
  END IF;

  -- authenticated: só SELECT e DELETE de tabela, UPDATE só nas 4 colunas da PRP-01.
  IF NOT has_table_privilege('authenticated', 'public.leads', 'SELECT') THEN problems := problems || 'authenticated sem SELECT em leads'; END IF;
  IF NOT has_table_privilege('authenticated', 'public.leads', 'DELETE') THEN problems := problems || 'authenticated já sem DELETE em leads (016 já aplicada?)'; END IF;
  IF has_table_privilege('authenticated', 'public.leads', 'INSERT,UPDATE,TRUNCATE,REFERENCES,TRIGGER') THEN
    problems := problems || 'authenticated tem privilégio de tabela inesperado em leads';
  END IF;
  SELECT string_agg(a.attname::text, ',' ORDER BY a.attname) INTO update_cols
    FROM pg_catalog.pg_attribute a
   WHERE a.attrelid = 'public.leads'::regclass AND a.attnum > 0 AND NOT a.attisdropped
     AND has_column_privilege('authenticated', 'public.leads'::regclass, a.attnum, 'UPDATE');
  IF update_cols IS DISTINCT FROM 'archived_at,next_action,next_action_at,status' THEN
    problems := problems || 'colunas com UPDATE para authenticated diferem da PRP-01';
  END IF;

  -- 012: anon sem policy nem privilégio.
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = 'leads'
             AND roles && ARRAY['anon', 'public']::name[]) THEN
    problems := problems || 'há policy em leads que alcança anon/public';
  END IF;
  IF has_table_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_any_column_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,REFERENCES') THEN
    problems := problems || 'anon tem privilégio em leads: aplique a 012';
  END IF;

  -- service_role precisa manter o que o formulário de contato e a limpeza usam.
  IF NOT (has_table_privilege('service_role', 'public.leads', 'SELECT')
          AND has_table_privilege('service_role', 'public.leads', 'INSERT')
          AND has_table_privilege('service_role', 'public.leads', 'UPDATE')
          AND has_table_privilege('service_role', 'public.leads', 'DELETE')) THEN
    problems := problems || 'service_role sem SELECT/INSERT/UPDATE/DELETE em leads';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.leads'::regclass) THEN
    problems := problems || 'RLS desligada em leads';
  END IF;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'016 ABORTADA — estado inesperado:\n - %', array_to_string(problems, E'\n - ');
  END IF;
END
$guard$;

-- ─── Fingerprint ANTES (hashes apenas, na própria transação) ─────────────────
DO $before$
BEGIN
  PERFORM set_config('rc2_m016.leads_rows', (SELECT count(*) FROM public.leads)::text, true);
  PERFORM set_config('rc2_m016.leads_data',
    (SELECT md5(coalesce(string_agg(md5(to_jsonb(l)::text), ',' ORDER BY l.id), '')) FROM public.leads l), true);
  PERFORM set_config('rc2_m016.kept_policies',
    (SELECT md5(coalesce(string_agg(p.policyname || '|' || p.permissive || '|' || p.roles::text || '|' || p.cmd
                                    || '|' || coalesce(p.qual, '') || '|' || coalesce(p.with_check, ''), ';' ORDER BY p.policyname), ''))
       FROM pg_catalog.pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = 'leads' AND p.policyname <> 'leads_e2_admin_delete'), true);
  PERFORM set_config('rc2_m016.other_acl',
    (SELECT md5(coalesce(string_agg(c.relname || '|' || coalesce(c.relacl::text, '') || '|' || c.relrowsecurity::text, ';' ORDER BY c.relname), ''))
       FROM pg_catalog.pg_class c WHERE c.oid IN ('public.lead_notes'::regclass, 'public.lead_activity'::regclass)), true);
  PERFORM set_config('rc2_m016.other_policies',
    (SELECT md5(coalesce(string_agg(p.tablename || '|' || p.policyname || '|' || p.roles::text || '|' || p.cmd
                                    || '|' || coalesce(p.qual, '') || '|' || coalesce(p.with_check, ''), ';' ORDER BY p.tablename, p.policyname), ''))
       FROM pg_catalog.pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename IN ('lead_notes', 'lead_activity')), true);
  PERFORM set_config('rc2_m016.triggers',
    (SELECT md5(coalesce(string_agg(t.tgname || '|' || t.tgenabled::text || '|' || pg_get_triggerdef(t.oid), ';' ORDER BY t.tgname), ''))
       FROM pg_catalog.pg_trigger t WHERE t.tgrelid = 'public.leads'::regclass AND NOT t.tgisinternal), true);
  PERFORM set_config('rc2_m016.service_acl',
    (SELECT string_agg(p, ',' ORDER BY p)
       FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS p
      WHERE has_table_privilege('service_role', 'public.leads', p)), true);
END
$before$;

-- ─── A mudança (e só ela) ────────────────────────────────────────────────────
REVOKE DELETE ON TABLE public.leads FROM authenticated;
DROP POLICY leads_e2_admin_delete ON public.leads;

-- ─── Autoverificação: qualquer divergência aborta e reverte tudo ─────────────
DO $after$
DECLARE
  problems text[] := ARRAY[]::text[];
  update_cols text;
BEGIN
  -- authenticated: sem DELETE; SELECT e UPDATE por coluna preservados.
  IF has_table_privilege('authenticated', 'public.leads', 'DELETE') THEN problems := problems || 'authenticated ainda tem DELETE em leads'; END IF;
  IF NOT has_table_privilege('authenticated', 'public.leads', 'SELECT') THEN problems := problems || 'authenticated perdeu SELECT em leads'; END IF;
  IF has_table_privilege('authenticated', 'public.leads', 'INSERT,UPDATE,TRUNCATE,REFERENCES,TRIGGER') THEN
    problems := problems || 'authenticated com privilégio de tabela inesperado em leads';
  END IF;
  SELECT string_agg(a.attname::text, ',' ORDER BY a.attname) INTO update_cols
    FROM pg_catalog.pg_attribute a
   WHERE a.attrelid = 'public.leads'::regclass AND a.attnum > 0 AND NOT a.attisdropped
     AND has_column_privilege('authenticated', 'public.leads'::regclass, a.attnum, 'UPDATE');
  IF update_cols IS DISTINCT FROM 'archived_at,next_action,next_action_at,status' THEN
    problems := problems || 'UPDATE por coluna de authenticated mudou';
  END IF;

  -- policies: só select e update E2, nenhuma que permita DELETE; RLS ligada.
  IF (SELECT string_agg(policyname || ':' || cmd || ':' || roles::text, ';' ORDER BY policyname)
        FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = 'leads')
     IS DISTINCT FROM 'leads_e2_admin_select:SELECT:{authenticated};leads_e2_admin_update:UPDATE:{authenticated}' THEN
    problems := problems || 'policies de leads diferem do esperado após a 016';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = 'leads' AND cmd IN ('DELETE', 'ALL')) THEN
    problems := problems || 'ainda há policy de DELETE/ALL em leads';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.leads'::regclass) THEN
    problems := problems || 'RLS desligada em leads';
  END IF;
  IF current_setting('rc2_m016.kept_policies') IS DISTINCT FROM
     (SELECT md5(coalesce(string_agg(p.policyname || '|' || p.permissive || '|' || p.roles::text || '|' || p.cmd
                                     || '|' || coalesce(p.qual, '') || '|' || coalesce(p.with_check, ''), ';' ORDER BY p.policyname), ''))
        FROM pg_catalog.pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'leads') THEN
    problems := problems || 'as policies preservadas de leads mudaram';
  END IF;

  -- anon continua sem nada.
  IF has_table_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_any_column_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,REFERENCES') THEN
    problems := problems || 'anon ganhou privilégio em leads';
  END IF;

  -- service_role preservado (formulário de contato e limpeza).
  IF current_setting('rc2_m016.service_acl') IS DISTINCT FROM
     (SELECT string_agg(p, ',' ORDER BY p) FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS p
       WHERE has_table_privilege('service_role', 'public.leads', p)) THEN
    problems := problems || 'privilégios de service_role em leads mudaram';
  END IF;

  -- Dados e demais objetos inalterados.
  IF current_setting('rc2_m016.leads_rows') IS DISTINCT FROM (SELECT count(*) FROM public.leads)::text THEN
    problems := problems || 'a contagem de leads mudou';
  END IF;
  IF current_setting('rc2_m016.leads_data') IS DISTINCT FROM
     (SELECT md5(coalesce(string_agg(md5(to_jsonb(l)::text), ',' ORDER BY l.id), '')) FROM public.leads l) THEN
    problems := problems || 'o conteúdo de leads mudou';
  END IF;
  IF current_setting('rc2_m016.other_acl') IS DISTINCT FROM
     (SELECT md5(coalesce(string_agg(c.relname || '|' || coalesce(c.relacl::text, '') || '|' || c.relrowsecurity::text, ';' ORDER BY c.relname), ''))
        FROM pg_catalog.pg_class c WHERE c.oid IN ('public.lead_notes'::regclass, 'public.lead_activity'::regclass)) THEN
    problems := problems || 'ACL ou RLS de lead_notes/lead_activity mudou';
  END IF;
  IF current_setting('rc2_m016.other_policies') IS DISTINCT FROM
     (SELECT md5(coalesce(string_agg(p.tablename || '|' || p.policyname || '|' || p.roles::text || '|' || p.cmd
                                     || '|' || coalesce(p.qual, '') || '|' || coalesce(p.with_check, ''), ';' ORDER BY p.tablename, p.policyname), ''))
        FROM pg_catalog.pg_policies p WHERE p.schemaname = 'public' AND p.tablename IN ('lead_notes', 'lead_activity')) THEN
    problems := problems || 'policies de lead_notes/lead_activity mudaram';
  END IF;
  IF current_setting('rc2_m016.triggers') IS DISTINCT FROM
     (SELECT md5(coalesce(string_agg(t.tgname || '|' || t.tgenabled::text || '|' || pg_get_triggerdef(t.oid), ';' ORDER BY t.tgname), ''))
        FROM pg_catalog.pg_trigger t WHERE t.tgrelid = 'public.leads'::regclass AND NOT t.tgisinternal) THEN
    problems := problems || 'os triggers de leads mudaram';
  END IF;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'016 ABORTADA na autoverificação — transação revertida:\n - %', array_to_string(problems, E'\n - ');
  END IF;
END
$after$;

COMMIT;
