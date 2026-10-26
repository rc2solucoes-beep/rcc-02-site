-- E0c / 017 — Rate limit atômico do contato (RF-SEG-05, DEC-12).
-- PROPOSTA NÃO APLICADA. NÃO EXECUTAR sem autorização específica por ambiente
-- (preflight do alvo → apply → verify). O histórico remoto é manual: NÃO usar
-- db push, pull ou repair. Nenhuma migration anterior é modificada.
--
-- O QUE FAZ:
--   1. Cria public.rate_limit_counters (key, window_start, count), PK (key, window_start),
--      RLS ligado SEM policies, sem acesso de PUBLIC/anon/authenticated.
--   2. Cria public.rate_limit_hit(p_key, p_limit, p_window_seconds): incremento atômico por
--      INSERT … ON CONFLICT DO UPDATE; SECURITY INVOKER; search_path fixo; EXECUTE só para
--      service_role; devolve (allowed, count, reset_at).
--   3. Agenda o job pg_cron 'purge-rate-limit-counters' (horário) que remove contadores com
--      window_start há mais de 2 dias.
-- O QUE NÃO FAZ: não toca public.leads, lead_notes, lead_activity, policies ou grants de
-- outras tabelas, nem nenhuma linha de dados existente. Não altera a migration 011 (job
-- publish-scheduled-posts).
--
-- DADOS PESSOAIS: as chaves são HMAC-SHA256 (RATE_LIMIT_PEPPER, na aplicação) do e-mail/IP
-- normalizado: dado pseudonimizado, não anônimo. Retenção máxima de 2 dias pelo job.
--
-- ORDEM COM A APLICAÇÃO: aplicar esta migration ANTES do deploy do código da E0c (a rota passa
-- a chamar rate_limit_hit e FECHA com 429 se a função não existir). Rollback: reverter o
-- código ANTES de remover a função (ver o runbook).
--
-- PRIMEIRA APLICAÇÃO ESTRITA: não é idempotente. Se algum objeto já existir, o guard aborta
-- (transação inteira revertida). Nenhum CREATE usa IF NOT EXISTS, como segunda barreira.
--
-- IMPACTO: cria objetos novos e não toma lock em tabelas existentes. lock_timeout de 5 s
-- protege o CREATE contra catálogo bloqueado.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ─── Guard: pré-requisitos presentes e nada da 017 ainda ─────────────────────
DO $guard$
DECLARE
  problems text[] := ARRAY[]::text[];
BEGIN
  IF to_regclass('public.rate_limit_counters') IS NOT NULL THEN
    problems := array_append(problems, 'public.rate_limit_counters já existe');
  END IF;
  IF to_regprocedure('public.rate_limit_hit(text,integer,integer)') IS NOT NULL THEN
    problems := array_append(problems, 'public.rate_limit_hit(text,integer,integer) já existe');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    problems := array_append(problems, 'papel anon inexistente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    problems := array_append(problems, 'papel authenticated inexistente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    problems := array_append(problems, 'papel service_role inexistente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'pg_cron') THEN
    problems := array_append(problems, 'extensão pg_cron ausente (habilite em Database > Extensions; a 011 a cria)');
  ELSIF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-rate-limit-counters') THEN
    problems := array_append(problems, 'job pg_cron purge-rate-limit-counters já existe');
  END IF;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'017 ABORTADA — pré-requisitos ausentes ou objetos já existentes:\n - %',
      array_to_string(problems, E'\n - ');
  END IF;
END
$guard$;

-- ─── Tabela de contadores ────────────────────────────────────────────────────
CREATE TABLE public.rate_limit_counters (
  key          text        NOT NULL,
  window_start timestamptz NOT NULL,
  count        integer     NOT NULL,
  CONSTRAINT rate_limit_counters_pkey PRIMARY KEY (key, window_start),
  CONSTRAINT rate_limit_counters_key_length CHECK (char_length(key) BETWEEN 1 AND 200),
  CONSTRAINT rate_limit_counters_count_positive CHECK (count >= 1)
);

COMMENT ON TABLE public.rate_limit_counters IS
  'E0c: contadores antiabuso por janela fixa. Chave = HMAC do e-mail/IP (pseudonimizado). Purga em 2 dias. Acesso só por service_role.';

-- Índice para a purga por window_start (a PK começa por key e não serve a esse filtro).
CREATE INDEX rate_limit_counters_window_start_idx ON public.rate_limit_counters (window_start);

ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- Os default privileges do Supabase concedem ALL a anon/authenticated em tabelas novas do schema
-- public: a revogação explícita é obrigatória. Sem policies, RLS nega o restante.
REVOKE ALL ON TABLE public.rate_limit_counters FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rate_limit_counters TO service_role;

-- ─── Função de incremento atômico ────────────────────────────────────────────
CREATE FUNCTION public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS TABLE (allowed boolean, count integer, reset_at timestamptz)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
#variable_conflict use_column
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  IF p_key IS NULL OR char_length(p_key) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'rate_limit_hit: p_key invalida' USING ERRCODE = '22023';
  END IF;
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'rate_limit_hit: p_limit fora de 1..10000' USING ERRCODE = '22023';
  END IF;
  IF p_window_seconds IS NULL OR p_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RAISE EXCEPTION 'rate_limit_hit: p_window_seconds fora de 1..86400' USING ERRCODE = '22023';
  END IF;

  -- Janela fixa alinhada ao múltiplo de p_window_seconds desde a época.
  v_window_start := to_timestamp(floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds);

  INSERT INTO public.rate_limit_counters AS c (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET count = least(c.count, 2147483646) + 1
  RETURNING c.count INTO v_count;

  RETURN QUERY SELECT v_count <= p_limit, v_count, v_window_start + (p_window_seconds * interval '1 second');
END
$fn$;

COMMENT ON FUNCTION public.rate_limit_hit(text, integer, integer) IS
  'E0c: incrementa o contador da janela e devolve allowed (count <= limit), count e reset_at. Só service_role.';

REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;

-- ─── Retenção: purga horária de contadores com mais de 2 dias ────────────────
SELECT cron.schedule(
  'purge-rate-limit-counters',
  '17 * * * *',
  $cron$DELETE FROM public.rate_limit_counters WHERE window_start < now() - interval '2 days'$cron$
);

-- ─── Autoverificação: qualquer divergência reverte a transação inteira ───────
DO $selfcheck$
DECLARE
  problems text[] := ARRAY[]::text[];
  fn oid := to_regprocedure('public.rate_limit_hit(text,integer,integer)');
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.rate_limit_counters'::regclass) THEN
    problems := array_append(problems, 'RLS desligado em rate_limit_counters');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = 'rate_limit_counters') THEN
    problems := array_append(problems, 'rate_limit_counters não deveria ter policies');
  END IF;
  IF pg_catalog.has_table_privilege('anon', 'public.rate_limit_counters', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR pg_catalog.has_table_privilege('authenticated', 'public.rate_limit_counters', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
    problems := array_append(problems, 'anon/authenticated com privilégio na tabela');
  END IF;
  IF NOT pg_catalog.has_table_privilege('service_role', 'public.rate_limit_counters', 'SELECT')
     OR NOT pg_catalog.has_table_privilege('service_role', 'public.rate_limit_counters', 'INSERT')
     OR NOT pg_catalog.has_table_privilege('service_role', 'public.rate_limit_counters', 'UPDATE') THEN
    problems := array_append(problems, 'service_role sem SELECT/INSERT/UPDATE na tabela');
  END IF;
  IF (SELECT prosecdef FROM pg_catalog.pg_proc WHERE oid = fn) THEN
    problems := array_append(problems, 'rate_limit_hit é SECURITY DEFINER (deveria ser INVOKER)');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE oid = fn AND proconfig @> ARRAY['search_path=pg_catalog, public']) THEN
    problems := array_append(problems, 'search_path da função não está fixo');
  END IF;
  IF pg_catalog.has_function_privilege('anon', fn, 'EXECUTE') OR pg_catalog.has_function_privilege('authenticated', fn, 'EXECUTE') THEN
    problems := array_append(problems, 'anon/authenticated podem executar rate_limit_hit');
  END IF;
  IF NOT pg_catalog.has_function_privilege('service_role', fn, 'EXECUTE') THEN
    problems := array_append(problems, 'service_role não executa rate_limit_hit');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_proc p, LATERAL pg_catalog.aclexplode(p.proacl) a WHERE p.oid = fn AND a.grantee = 0) THEN
    problems := array_append(problems, 'PUBLIC mantém EXECUTE em rate_limit_hit');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-rate-limit-counters' AND schedule = '17 * * * *') THEN
    problems := array_append(problems, 'job de purga não agendado');
  END IF;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'017 ABORTADA — autoverificação falhou (nada foi aplicado):\n - %',
      array_to_string(problems, E'\n - ');
  END IF;
END
$selfcheck$;

COMMIT;
