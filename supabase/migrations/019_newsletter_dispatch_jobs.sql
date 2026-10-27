-- E3 / 019 (N2) — Jobs de dispatch e manutenção do outbox da newsletter.
-- PROPOSTA NÃO APLICADA. NÃO EXECUTAR em nenhum ambiente sem autorização específica
-- (preflight do alvo → apply → verify) e SÓ depois de o mecanismo ser demonstrado (LC-01, BL-03).
-- O histórico remoto é manual: NÃO usar db push, pull ou repair. Nenhuma migration anterior
-- (011, 017, 018) é modificada.
--
-- Fonte: docs/superpowers/specs/2026-10-13-newsletter-design.md §8.8, §8.9 e §18.2;
--        src/lib/newsletter/README.md (especificação da N2).
--
-- O QUE FAZ:
--   1. Agenda o job pg_cron 'newsletter-dispatch' (a cada minuto): net.http_post para
--      POST /api/internal/newsletter/dispatch, com a URL e o segredo LIDOS DO VAULT em tempo de
--      execução. timeout_milliseconds = 125000 (> maxDuration de 120 s da rota).
--      OPCIONAL: se existir o segredo do Vault 'newsletter_dispatch_bypass', o job também envia o
--      cabeçalho x-vercel-protection-bypass (acesso automatizado a um deployment PROTEGIDO da Vercel,
--      p.ex. o Preview no isolado). Em Production (domínio próprio, sem proteção) o segredo não existe
--      e o cabeçalho não é enviado. NUNCA na URL (query) e NUNCA literal.
--   2. Agenda o job pg_cron 'newsletter-maintenance' (a cada 5 minutos): newsletter_outbox_expire().
-- O QUE NÃO FAZ (deliberadamente):
--   * NÃO instala pg_cron, pg_net nem Vault (são pré-requisitos, instalados à parte, com
--     autorização específica) e NÃO escreve segredos no Vault: o operador os cria antes.
--   * NENHUMA credencial literal no SQL. O segredo nunca aparece no comando do job nem na migration.
--   * Não cria jobs de purga (N3, depende de BL-01) nem funções administrativas (N4, E4).
--   * Não toca tabelas, funções ou os jobs 'publish-scheduled-posts' (011) e
--     'purge-rate-limit-counters' (017).
--
-- ORDEM COM A APLICAÇÃO: enquanto NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED estiver desligada o
-- dispatch só processa 'unsubscribe_link'. Sem RESEND_API_KEY a rota responde 503 sem reivindicar
-- nada. Com a rota inacessível (ex.: deployment protegido sem bypass) os jobs apenas falham no
-- pg_net, sem efeito no banco. Veja o runbook para o acesso ao Preview protegido.
--
-- ATENÇÃO — DADOS EM TRÂNSITO: pg_net grava a requisição (inclusive o cabeçalho Authorization) em
-- net.http_request_queue até enviá-la, e a resposta (só contagens, sem PII) em net._http_response.
-- Quem lê essas tabelas enxerga o bearer: restrinja o acesso ao schema net (ver runbook).
--
-- PRIMEIRA APLICAÇÃO ESTRITA: não é idempotente. Se algum objeto já existir, o guard aborta
-- (transação inteira revertida). cron.schedule NÃO é usado de forma convergente: o guard exige
-- a ausência dos jobs antes de agendá-los.
--
-- IMPACTO: cria dois jobs; não toma lock em tabela existente. lock_timeout de 5 s.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ─── Guard: pré-requisitos presentes e nada da 019 ainda ─────────────────────
DO $guard$
DECLARE
  problems text[] := ARRAY[]::text[];
  v_url text;
  v_secret text;
  v_bypass text;
BEGIN
  -- 018 (N1) aplicada: tabelas e funções do outbox.
  IF to_regclass('public.newsletter_outbox') IS NULL THEN
    problems := array_append(problems, 'migration 018 ausente: public.newsletter_outbox não existe');
  END IF;
  IF to_regprocedure('public.newsletter_outbox_expire()') IS NULL THEN
    problems := array_append(problems, 'migration 018 ausente: newsletter_outbox_expire() não existe');
  END IF;
  IF to_regprocedure('public.newsletter_outbox_claim(integer,integer,text[])') IS NULL THEN
    problems := array_append(problems, 'migration 018 ausente: newsletter_outbox_claim não existe');
  END IF;

  -- Extensões: instaladas ANTES, com autorização específica. Esta migration não as cria.
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'pg_cron') THEN
    problems := array_append(problems, 'extensão pg_cron ausente (a 011 a cria)');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'pg_net') THEN
    problems := array_append(problems, 'extensão pg_net ausente (instalar antes, com autorização específica)');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'supabase_vault') THEN
    problems := array_append(problems, 'extensão supabase_vault ausente');
  END IF;

  -- Jobs existentes preservados e jobs desta migration ainda ausentes (guard estrito).
  IF to_regclass('cron.job') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-posts') THEN
      problems := array_append(problems, 'job publish-scheduled-posts (011) ausente');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-rate-limit-counters') THEN
      problems := array_append(problems, 'job purge-rate-limit-counters (017) ausente');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'newsletter-dispatch') THEN
      problems := array_append(problems, 'job newsletter-dispatch já existe');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'newsletter-maintenance') THEN
      problems := array_append(problems, 'job newsletter-maintenance já existe');
    END IF;
  END IF;

  -- Segredos do Vault criados ANTES pelo operador. Validados sem nunca expor o valor.
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    problems := array_append(problems, 'vault.decrypted_secrets inexistente');
  ELSE
    SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'newsletter_dispatch_url';
    SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'newsletter_dispatch_secret';
    IF v_url IS NULL THEN
      problems := array_append(problems, 'segredo do Vault newsletter_dispatch_url ausente');
    ELSIF v_url !~ '^https://[^/?#@ ]+/api/internal/newsletter/dispatch$' THEN
      problems := array_append(problems, 'newsletter_dispatch_url inválida (esperado https://<host>/api/internal/newsletter/dispatch, sem query nem credenciais)');
    END IF;
    IF v_secret IS NULL THEN
      problems := array_append(problems, 'segredo do Vault newsletter_dispatch_secret ausente');
    ELSIF char_length(v_secret) < 32 THEN
      problems := array_append(problems, 'newsletter_dispatch_secret curto demais (mínimo 32 caracteres, como a rota exige)');
    END IF;
    -- Opcional: só se existir é validado (nunca exposto). Vazio/curto seria enviado como cabeçalho inútil.
    SELECT decrypted_secret INTO v_bypass FROM vault.decrypted_secrets WHERE name = 'newsletter_dispatch_bypass';
    IF v_bypass IS NOT NULL AND char_length(v_bypass) < 32 THEN
      problems := array_append(problems, 'newsletter_dispatch_bypass curto demais (o bypass da Vercel tem 32 caracteres)');
    END IF;
  END IF;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'019 ABORTADA — pré-requisitos ausentes ou objetos já existentes:\n - %',
      array_to_string(problems, E'\n - ');
  END IF;
END
$guard$;

-- ─── Job de dispatch: a cada minuto (P = 60 s) ───────────────────────────────
-- URL e segredo vêm do Vault a cada execução; nada literal. O corpo é ignorado pela rota.
-- timeout_milliseconds = 125000 > D (120 s): a requisição não é cortada antes da rota terminar.
SELECT cron.schedule(
  'newsletter-dispatch',
  '* * * * *',
  $cron$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'newsletter_dispatch_url'),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'newsletter_dispatch_secret'),
        'Content-Type', 'application/json'
      ) || coalesce(
        (SELECT jsonb_build_object('x-vercel-protection-bypass', decrypted_secret) FROM vault.decrypted_secrets WHERE name = 'newsletter_dispatch_bypass'),
        '{}'::jsonb
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 125000
    )
  $cron$
);

-- ─── Job de manutenção: a cada 5 minutos ─────────────────────────────────────
-- Redundante com o expire() que o dispatch já executa, mas mantém o prazo de 20 h funcionando
-- mesmo com o dispatch pausado.
SELECT cron.schedule(
  'newsletter-maintenance',
  '*/5 * * * *',
  $cron$SELECT public.newsletter_outbox_expire()$cron$
);

-- ─── Autoverificação: qualquer divergência reverte a transação inteira ───────
DO $selfcheck$
DECLARE
  problems text[] := ARRAY[]::text[];
  v_dispatch cron.job%ROWTYPE;
  v_maint cron.job%ROWTYPE;
BEGIN
  SELECT * INTO v_dispatch FROM cron.job WHERE jobname = 'newsletter-dispatch';
  SELECT * INTO v_maint FROM cron.job WHERE jobname = 'newsletter-maintenance';

  IF v_dispatch.jobid IS NULL THEN
    problems := array_append(problems, 'newsletter-dispatch não foi agendado');
  ELSE
    IF v_dispatch.schedule <> '* * * * *' THEN problems := array_append(problems, 'newsletter-dispatch com horário inesperado'); END IF;
    IF v_dispatch.command NOT LIKE '%net.http_post%' OR v_dispatch.command NOT LIKE '%vault.decrypted_secrets%'
       OR v_dispatch.command NOT LIKE '%timeout_milliseconds := 125000%' THEN
      problems := array_append(problems, 'comando do newsletter-dispatch inesperado');
    END IF;
    -- Nenhuma credencial literal: o único "Bearer" é concatenado com o valor lido do Vault.
    IF v_dispatch.command ~* 'x-vercel-protection-bypass''\s*,\s*''[A-Za-z0-9]{16,}' THEN
      problems := array_append(problems, 'newsletter-dispatch contém bypass literal');
    END IF;
    IF v_dispatch.command ~ 'Bearer [A-Za-z0-9_-]{16,}' OR v_dispatch.command ~* 'nlt_|re_[A-Za-z0-9]{10,}' THEN
      problems := array_append(problems, 'newsletter-dispatch contém credencial literal');
    END IF;
  END IF;

  IF v_maint.jobid IS NULL THEN
    problems := array_append(problems, 'newsletter-maintenance não foi agendado');
  ELSE
    IF v_maint.schedule <> '*/5 * * * *' THEN problems := array_append(problems, 'newsletter-maintenance com horário inesperado'); END IF;
    IF v_maint.command NOT LIKE '%newsletter_outbox_expire()%' THEN problems := array_append(problems, 'comando do newsletter-maintenance inesperado'); END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-posts' AND schedule = '*/5 * * * *') THEN
    problems := array_append(problems, 'job da 011 alterado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-rate-limit-counters' AND schedule = '17 * * * *') THEN
    problems := array_append(problems, 'job da 017 alterado');
  END IF;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'019 REVERTIDA — autoverificação falhou:\n - %', array_to_string(problems, E'\n - ');
  END IF;
END
$selfcheck$;

COMMIT;
