-- E3 / 018 — Newsletter: fundação N1 (assinantes, consentimento, tokens, outbox).
-- PROPOSTA NÃO APLICADA. NÃO EXECUTAR em nenhum ambiente sem autorização específica
-- (preflight do alvo → apply → verify). O histórico remoto é manual: NÃO usar db push, pull ou
-- repair. Nenhuma migration anterior é modificada.
--
-- Fonte: docs/superpowers/specs/2026-10-13-newsletter-design.md (§4, §6, §7, §8, §11.1).
--
-- O QUE FAZ:
--   1. Cria newsletter_subscribers, newsletter_outbox, newsletter_tokens,
--      newsletter_outbox_payload e newsletter_consents, com CHECKs de coerência, FKs com
--      ON DELETE CASCADE/SET NULL conforme o SDD e o índice parcial de "uma mensagem em aberto
--      por assinante e tipo".
--   2. RLS ligado nas cinco tabelas. REVOKE ALL de PUBLIC/anon/authenticated; service_role com
--      SELECT/INSERT/UPDATE/DELETE. O admin autenticado ganha SELECT (e só SELECT) em
--      subscribers, consents e outbox, por policy. tokens e outbox_payload: ninguém além de
--      service_role (nem o admin).
--   3. Funções do fluxo público e do outbox (SECURITY INVOKER, search_path fixo, EXECUTE só
--      para service_role): newsletter_request_subscription, newsletter_request_unsubscribe_link,
--      newsletter_confirm, newsletter_unsubscribe, newsletter_outbox_claim/_prepare/_complete/
--      _expire.
-- O QUE NÃO FAZ (deliberadamente):
--   * Não cria jobs pg_cron nem usa pg_net: o processamento do outbox (BL-03, PV-04) e as
--     purgas (P-RET-01/02/04, pendentes de validação jurídica, BL-01) ficam para migration
--     própria. Até lá nenhum dado é apagado automaticamente.
--   * Não cria as funções administrativas SECURITY DEFINER (§11.3) nem o papel newsletter_ops
--     (PV-26): pertencem à E4-essencial.
--   * Não toca leads, lead_notes, lead_activity, posts, settings nem rate_limit_counters (a E0c
--     é reutilizada pela aplicação via rate_limit_hit). Não há FK nem JOIN com leads (RF-NL-10).
--
-- DADOS PESSOAIS: e-mail do assinante e ip_hash (HMAC com pepper, prefixo consent-ip) são dados
-- pessoais; o hash é pseudonimizado, não anônimo (DEC-23). O token bruto só existe em
-- newsletter_outbox_payload (transitório, somente service_role); em newsletter_tokens há apenas
-- o SHA-256.
--
-- ORDEM COM A APLICAÇÃO: nenhuma rota depende desta migration enquanto
-- NEWSLETTER_SIGNUP_ENABLED e NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED estiverem desligados.
--
-- PRIMEIRA APLICAÇÃO ESTRITA: não é idempotente. Se algum objeto já existir, o guard aborta
-- (transação inteira revertida). Nenhum CREATE usa IF NOT EXISTS, como segunda barreira.
--
-- IMPACTO: cria objetos novos e não toma lock em tabelas existentes. lock_timeout de 5 s.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ─── Guard: pré-requisitos presentes e nada da 018 ainda ─────────────────────
DO $guard$
DECLARE
  problems text[] := ARRAY[]::text[];
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['newsletter_subscribers','newsletter_outbox','newsletter_tokens','newsletter_outbox_payload','newsletter_consents'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      problems := array_append(problems, 'public.' || t || ' já existe');
    END IF;
  END LOOP;
  IF to_regprocedure('public.newsletter_request_subscription(text,text,text,text,text,text)') IS NOT NULL THEN
    problems := array_append(problems, 'newsletter_request_subscription já existe');
  END IF;
  IF to_regclass('public.admin_users') IS NULL THEN
    problems := array_append(problems, 'public.admin_users inexistente');
  END IF;
  IF to_regclass('public.rate_limit_counters') IS NULL THEN
    problems := array_append(problems, 'public.rate_limit_counters inexistente (a 017/E0c é pré-requisito)');
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

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'018 ABORTADA — pré-requisitos ausentes ou objetos já existentes:\n - %',
      array_to_string(problems, E'\n - ');
  END IF;
END
$guard$;

-- ─── Trigger de updated_at (próprio da newsletter) ───────────────────────────
CREATE FUNCTION public.newsletter_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$fn$;

-- ─── Assinantes ──────────────────────────────────────────────────────────────
CREATE TABLE public.newsletter_subscribers (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  email            text        NOT NULL,
  email_normalized text        NOT NULL,
  status           text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  confirmed_at     timestamptz,
  unsubscribed_at  timestamptz,
  last_request_at  timestamptz,
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT newsletter_subscribers_email_normalized_key UNIQUE (email_normalized),
  CONSTRAINT newsletter_subscribers_email_length CHECK (char_length(email) BETWEEN 3 AND 254),
  CONSTRAINT newsletter_subscribers_email_normalized_matches CHECK (email_normalized = lower(btrim(email_normalized)) AND email_normalized = lower(btrim(email))),
  CONSTRAINT newsletter_subscribers_status_check CHECK (status IN ('pending', 'active', 'unsubscribed')),
  CONSTRAINT newsletter_subscribers_pending_coherent CHECK (status <> 'pending' OR confirmed_at IS NULL),
  CONSTRAINT newsletter_subscribers_active_coherent CHECK (status <> 'active' OR (confirmed_at IS NOT NULL AND unsubscribed_at IS NULL)),
  CONSTRAINT newsletter_subscribers_unsubscribed_coherent CHECK (status <> 'unsubscribed' OR unsubscribed_at IS NOT NULL)
);

COMMENT ON TABLE public.newsletter_subscribers IS
  'E3: assinantes da newsletter (double opt-in). Independente de leads. Escrita só por service_role.';

CREATE TRIGGER newsletter_subscribers_touch_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.newsletter_touch_updated_at();

-- ─── Outbox ──────────────────────────────────────────────────────────────────
CREATE TABLE public.newsletter_outbox (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  subscriber_id       uuid        NOT NULL,
  kind                text        NOT NULL,
  consent_text_version text,
  policy_version      text,
  status              text        NOT NULL DEFAULT 'queued',
  attempts            integer     NOT NULL DEFAULT 0,
  first_attempt_at    timestamptz,
  next_attempt_at     timestamptz NOT NULL DEFAULT now(),
  lease_until         timestamptz,
  deadline_at         timestamptz NOT NULL DEFAULT now() + interval '20 hours',
  idempotency_key     text        GENERATED ALWAYS AS ('nl-' || id::text) STORED,
  provider_message_id text,
  last_error_code     text,
  outcome_unknown     boolean     NOT NULL DEFAULT false,
  dead_reason         text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  sent_at             timestamptz,
  CONSTRAINT newsletter_outbox_pkey PRIMARY KEY (id),
  CONSTRAINT newsletter_outbox_idempotency_key_key UNIQUE (idempotency_key),
  CONSTRAINT newsletter_outbox_subscriber_fkey FOREIGN KEY (subscriber_id) REFERENCES public.newsletter_subscribers (id) ON DELETE CASCADE,
  CONSTRAINT newsletter_outbox_kind_check CHECK (kind IN ('confirmation', 'unsubscribe_link')),
  CONSTRAINT newsletter_outbox_status_check CHECK (status IN ('queued', 'sending', 'retry', 'sent', 'dead')),
  CONSTRAINT newsletter_outbox_attempts_check CHECK (attempts >= 0),
  CONSTRAINT newsletter_outbox_confirmation_versions CHECK (kind <> 'confirmation' OR (consent_text_version IS NOT NULL AND policy_version IS NOT NULL)),
  CONSTRAINT newsletter_outbox_dead_reason_check CHECK (dead_reason IS NULL OR dead_reason IN ('deadline_elapsed', 'attempts_exhausted', 'permanent_error', 'superseded', 'invalid_state')),
  CONSTRAINT newsletter_outbox_dead_reason_coherent CHECK ((status = 'dead') = (dead_reason IS NOT NULL)),
  CONSTRAINT newsletter_outbox_sent_coherent CHECK ((status = 'sent') = (sent_at IS NOT NULL)),
  CONSTRAINT newsletter_outbox_sending_lease CHECK (status <> 'sending' OR lease_until IS NOT NULL),
  CONSTRAINT newsletter_outbox_last_error_code_check CHECK (last_error_code IS NULL OR last_error_code IN (
    'validation_error', 'invalid_from_address', 'invalid_parameter', 'missing_required_field',
    'missing_api_key', 'invalid_api_key', 'restricted_api_key', 'invalid_access', 'security_error',
    'rate_limit_exceeded', 'daily_quota_exceeded', 'monthly_quota_exceeded',
    'concurrent_idempotent_requests', 'invalid_idempotent_request',
    'application_error', 'internal_server_error', 'network_error', 'timeout', 'aborted',
    'process_crash', 'unknown'
  ))
);

COMMENT ON TABLE public.newsletter_outbox IS
  'E3: fila persistente de e-mails da newsletter. Sem texto livre de erro. Escrita só por service_role.';

-- No máximo uma mensagem em aberto por assinante e tipo.
CREATE UNIQUE INDEX newsletter_outbox_one_open_per_kind
  ON public.newsletter_outbox (subscriber_id, kind)
  WHERE status IN ('queued', 'sending', 'retry');
CREATE INDEX newsletter_outbox_ready_idx
  ON public.newsletter_outbox (next_attempt_at)
  WHERE status IN ('queued', 'retry');
CREATE INDEX newsletter_outbox_lease_idx
  ON public.newsletter_outbox (lease_until)
  WHERE status = 'sending';
CREATE INDEX newsletter_outbox_subscriber_created_idx
  ON public.newsletter_outbox (subscriber_id, kind, created_at);

CREATE TRIGGER newsletter_outbox_touch_updated_at
  BEFORE UPDATE ON public.newsletter_outbox
  FOR EACH ROW EXECUTE FUNCTION public.newsletter_touch_updated_at();

-- ─── Tokens (somente credenciais vivas; só o hash) ───────────────────────────
CREATE TABLE public.newsletter_tokens (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
  subscriber_id        uuid        NOT NULL,
  kind                 text        NOT NULL,
  token_hash           text        NOT NULL,
  expires_at           timestamptz,
  consent_text_version text,
  policy_version       text,
  last_used_at         timestamptz,
  outbox_id            uuid,
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT newsletter_tokens_token_hash_key UNIQUE (token_hash),
  CONSTRAINT newsletter_tokens_subscriber_fkey FOREIGN KEY (subscriber_id) REFERENCES public.newsletter_subscribers (id) ON DELETE CASCADE,
  CONSTRAINT newsletter_tokens_outbox_fkey FOREIGN KEY (outbox_id) REFERENCES public.newsletter_outbox (id) ON DELETE SET NULL,
  CONSTRAINT newsletter_tokens_kind_check CHECK (kind IN ('confirm', 'unsubscribe')),
  CONSTRAINT newsletter_tokens_hash_format CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT newsletter_tokens_confirm_fields CHECK (kind <> 'confirm' OR (expires_at IS NOT NULL AND consent_text_version IS NOT NULL AND policy_version IS NOT NULL)),
  CONSTRAINT newsletter_tokens_unsubscribe_fields CHECK (kind <> 'unsubscribe' OR (expires_at IS NULL AND consent_text_version IS NULL AND policy_version IS NULL))
);

COMMENT ON TABLE public.newsletter_tokens IS
  'E3: credenciais vivas (SHA-256 do token opaco). Token consumido/revogado é removido. Sem acesso para o admin.';

CREATE INDEX newsletter_tokens_subscriber_kind_idx ON public.newsletter_tokens (subscriber_id, kind);
CREATE INDEX newsletter_tokens_outbox_idx ON public.newsletter_tokens (outbox_id);

-- ─── Payload transitório do outbox (token bruto) ─────────────────────────────
CREATE TABLE public.newsletter_outbox_payload (
  outbox_id         uuid        NOT NULL,
  confirm_token     text,
  unsubscribe_token text        NOT NULL,
  template_version  text        NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_outbox_payload_pkey PRIMARY KEY (outbox_id),
  CONSTRAINT newsletter_outbox_payload_outbox_fkey FOREIGN KEY (outbox_id) REFERENCES public.newsletter_outbox (id) ON DELETE CASCADE,
  CONSTRAINT newsletter_outbox_payload_confirm_format CHECK (confirm_token IS NULL OR confirm_token ~ '^nlt_[A-Za-z0-9_-]{43}$'),
  CONSTRAINT newsletter_outbox_payload_unsubscribe_format CHECK (unsubscribe_token ~ '^nlt_[A-Za-z0-9_-]{43}$')
);

COMMENT ON TABLE public.newsletter_outbox_payload IS
  'E3: token bruto transitório, apagado no estado terminal do item. Somente service_role (nem o admin).';

-- ─── Consentimento (append-only na prática; FK obrigatória) ──────────────────
CREATE TABLE public.newsletter_consents (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
  subscriber_id        uuid        NOT NULL,
  event                text        NOT NULL,
  consent_text_version text,
  policy_version       text,
  source_path          text,
  ip_hash              text,
  reason               text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_consents_pkey PRIMARY KEY (id),
  CONSTRAINT newsletter_consents_subscriber_fkey FOREIGN KEY (subscriber_id) REFERENCES public.newsletter_subscribers (id) ON DELETE CASCADE,
  CONSTRAINT newsletter_consents_event_check CHECK (event IN ('consent_requested', 'consent_confirmed', 'unsubscribed_link', 'unsubscribed_one_click', 'unsubscribed_admin')),
  CONSTRAINT newsletter_consents_versions CHECK (event NOT IN ('consent_requested', 'consent_confirmed') OR (consent_text_version IS NOT NULL AND policy_version IS NOT NULL)),
  CONSTRAINT newsletter_consents_source_path CHECK (source_path IS NULL OR (char_length(source_path) <= 200 AND source_path NOT LIKE '%?%' AND source_path NOT LIKE '%#%')),
  CONSTRAINT newsletter_consents_reason_check CHECK (reason IS NULL OR (event = 'unsubscribed_admin' AND reason IN ('titular_request', 'bounce_or_complaint', 'other')))
);

COMMENT ON TABLE public.newsletter_consents IS
  'E3: eventos de consentimento. Sem registro do navegador do titular (RNF-07). ip_hash é pseudonimizado, não anônimo.';

CREATE INDEX newsletter_consents_subscriber_created_idx ON public.newsletter_consents (subscriber_id, created_at, id);

-- ─── RLS e privilégios ───────────────────────────────────────────────────────
ALTER TABLE public.newsletter_subscribers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_outbox         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_outbox_payload ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_consents       ENABLE ROW LEVEL SECURITY;

-- Os default privileges do Supabase concedem ALL a anon/authenticated em tabelas novas do schema
-- public: a revogação explícita é obrigatória (EV-22).
REVOKE ALL ON TABLE public.newsletter_subscribers, public.newsletter_outbox, public.newsletter_tokens,
  public.newsletter_outbox_payload, public.newsletter_consents FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.newsletter_subscribers, public.newsletter_outbox,
  public.newsletter_tokens, public.newsletter_outbox_payload, public.newsletter_consents TO service_role;

-- Admin autenticado: SELECT apenas, em três tabelas. Nenhum privilégio de escrita (DEC-19 revisada).
GRANT SELECT ON TABLE public.newsletter_subscribers, public.newsletter_outbox, public.newsletter_consents TO authenticated;

CREATE POLICY newsletter_subscribers_admin_select ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));
CREATE POLICY newsletter_outbox_admin_select ON public.newsletter_outbox
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));
CREATE POLICY newsletter_consents_admin_select ON public.newsletter_consents
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM public.admin_users));

-- ─── newsletter_request_subscription (§7.1) ──────────────────────────────────
CREATE FUNCTION public.newsletter_request_subscription(
  p_email text,
  p_email_normalized text,
  p_consent_text_version text,
  p_policy_version text,
  p_source_path text,
  p_ip_hash text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  v_sub public.newsletter_subscribers%ROWTYPE;
  v_inserted integer;
BEGIN
  IF p_email IS NULL OR p_email_normalized IS NULL OR p_consent_text_version IS NULL OR p_policy_version IS NULL THEN
    RAISE EXCEPTION 'newsletter_request_subscription: parametro obrigatorio nulo' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.newsletter_subscribers (email, email_normalized, status, last_request_at)
  VALUES (p_email, p_email_normalized, 'pending', now())
  ON CONFLICT (email_normalized) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  SELECT * INTO v_sub FROM public.newsletter_subscribers WHERE email_normalized = p_email_normalized FOR UPDATE;

  IF v_inserted = 0 THEN
    -- Já existia: aplica os cooldowns do §5.3. Qualquer bloqueio é silencioso.
    IF v_sub.status = 'active' THEN
      RETURN;
    END IF;
    IF v_sub.status = 'unsubscribed' AND now() < v_sub.unsubscribed_at + interval '7 days' THEN
      RETURN;
    END IF;
    IF v_sub.last_request_at IS NOT NULL AND now() < v_sub.last_request_at + interval '10 minutes' THEN
      RETURN;
    END IF;
    IF (SELECT count(*) FROM public.newsletter_outbox o
         WHERE o.subscriber_id = v_sub.id AND o.kind = 'confirmation' AND o.created_at > now() - interval '24 hours') >= 3 THEN
      RETURN;
    END IF;
    IF EXISTS (SELECT 1 FROM public.newsletter_outbox o
                WHERE o.subscriber_id = v_sub.id AND o.kind = 'confirmation' AND o.status IN ('queued', 'sending', 'retry')) THEN
      RETURN;
    END IF;

    UPDATE public.newsletter_subscribers SET last_request_at = now() WHERE id = v_sub.id;
    -- Novo pedido invalida os C anteriores; os U (descadastro) continuam.
    DELETE FROM public.newsletter_tokens WHERE subscriber_id = v_sub.id AND kind = 'confirm';
  END IF;

  INSERT INTO public.newsletter_consents (subscriber_id, event, consent_text_version, policy_version, source_path, ip_hash)
  VALUES (v_sub.id, 'consent_requested', p_consent_text_version, p_policy_version, p_source_path, p_ip_hash);

  INSERT INTO public.newsletter_outbox (subscriber_id, kind, consent_text_version, policy_version)
  VALUES (v_sub.id, 'confirmation', p_consent_text_version, p_policy_version);
END
$fn$;

-- ─── newsletter_request_unsubscribe_link (§7.4) ──────────────────────────────
-- Nunca altera o status pelo e-mail digitado; só enfileira o link. Resposta uniforme na aplicação.
CREATE FUNCTION public.newsletter_request_unsubscribe_link(p_email_normalized text)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  v_sub public.newsletter_subscribers%ROWTYPE;
BEGIN
  IF p_email_normalized IS NULL THEN
    RAISE EXCEPTION 'newsletter_request_unsubscribe_link: parametro obrigatorio nulo' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_sub FROM public.newsletter_subscribers WHERE email_normalized = p_email_normalized FOR UPDATE;
  IF NOT FOUND OR v_sub.status NOT IN ('pending', 'active') THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.newsletter_outbox o
              WHERE o.subscriber_id = v_sub.id AND o.kind = 'unsubscribe_link'
                AND (o.status IN ('queued', 'sending', 'retry') OR o.created_at > now() - interval '10 minutes')) THEN
    RETURN;
  END IF;

  INSERT INTO public.newsletter_outbox (subscriber_id, kind) VALUES (v_sub.id, 'unsubscribe_link');
END
$fn$;

-- ─── newsletter_confirm (§7.2) ───────────────────────────────────────────────
-- Não recebe versão de consentimento: usa as do token (as do pedido original).
CREATE FUNCTION public.newsletter_confirm(p_token_hash text, p_ip_hash text)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  v_token public.newsletter_tokens%ROWTYPE;
  v_sub public.newsletter_subscribers%ROWTYPE;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'newsletter_confirm: hash invalido' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_token FROM public.newsletter_tokens
   WHERE token_hash = p_token_hash AND kind = 'confirm' FOR UPDATE;
  IF NOT FOUND OR v_token.expires_at <= now() THEN
    RETURN 'invalid';
  END IF;

  SELECT * INTO v_sub FROM public.newsletter_subscribers WHERE id = v_token.subscriber_id FOR UPDATE;
  IF NOT FOUND OR v_sub.status NOT IN ('pending', 'unsubscribed') THEN
    RETURN 'invalid';
  END IF;

  -- Uso único: remove este e os demais C do assinante.
  DELETE FROM public.newsletter_tokens WHERE subscriber_id = v_sub.id AND kind = 'confirm';

  UPDATE public.newsletter_subscribers
     SET status = 'active', confirmed_at = now(), unsubscribed_at = NULL
   WHERE id = v_sub.id;

  INSERT INTO public.newsletter_consents (subscriber_id, event, consent_text_version, policy_version, ip_hash)
  VALUES (v_sub.id, 'consent_confirmed', v_token.consent_text_version, v_token.policy_version, p_ip_hash);

  RETURN 'confirmed';
END
$fn$;

-- ─── newsletter_unsubscribe (§7.3) ───────────────────────────────────────────
CREATE FUNCTION public.newsletter_unsubscribe(p_token_hash text, p_channel text)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  v_token public.newsletter_tokens%ROWTYPE;
  v_sub public.newsletter_subscribers%ROWTYPE;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'newsletter_unsubscribe: hash invalido' USING ERRCODE = '22023';
  END IF;
  IF p_channel IS NULL OR p_channel NOT IN ('link', 'one_click') THEN
    RAISE EXCEPTION 'newsletter_unsubscribe: canal invalido' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_token FROM public.newsletter_tokens
   WHERE token_hash = p_token_hash AND kind = 'unsubscribe' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  SELECT * INTO v_sub FROM public.newsletter_subscribers WHERE id = v_token.subscriber_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  UPDATE public.newsletter_tokens SET last_used_at = now() WHERE id = v_token.id;

  IF v_sub.status = 'unsubscribed' THEN
    RETURN 'already_unsubscribed';
  END IF;

  UPDATE public.newsletter_subscribers
     SET status = 'unsubscribed', unsubscribed_at = now()
   WHERE id = v_sub.id;
  -- Quem saiu não pode mais confirmar com um C antigo.
  DELETE FROM public.newsletter_tokens WHERE subscriber_id = v_sub.id AND kind = 'confirm';

  INSERT INTO public.newsletter_consents (subscriber_id, event)
  VALUES (v_sub.id, CASE p_channel WHEN 'one_click' THEN 'unsubscribed_one_click' ELSE 'unsubscribed_link' END);

  RETURN 'unsubscribed';
END
$fn$;

-- ─── newsletter_outbox_claim (§8.1) ──────────────────────────────────────────
-- Inclui a recuperação de lease vencido. p_kinds permite ao dispatcher excluir 'confirmation'
-- enquanto NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED estiver desligado.
CREATE FUNCTION public.newsletter_outbox_claim(
  p_batch integer,
  p_lease_seconds integer,
  p_kinds text[] DEFAULT ARRAY['confirmation', 'unsubscribe_link']
)
RETURNS TABLE (
  id uuid,
  subscriber_id uuid,
  kind text,
  attempts integer,
  consent_text_version text,
  policy_version text,
  idempotency_key text,
  outcome_unknown boolean
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
#variable_conflict use_column
BEGIN
  IF p_batch IS NULL OR p_batch NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'newsletter_outbox_claim: p_batch fora de 1..50' USING ERRCODE = '22023';
  END IF;
  IF p_lease_seconds IS NULL OR p_lease_seconds NOT BETWEEN 10 AND 3600 THEN
    RAISE EXCEPTION 'newsletter_outbox_claim: p_lease_seconds fora de 10..3600' USING ERRCODE = '22023';
  END IF;
  IF p_kinds IS NULL OR cardinality(p_kinds) = 0 OR NOT (p_kinds <@ ARRAY['confirmation', 'unsubscribe_link']) THEN
    RAISE EXCEPTION 'newsletter_outbox_claim: p_kinds invalido' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH cand AS (
    SELECT o.id
      FROM public.newsletter_outbox o
     WHERE o.kind = ANY (p_kinds)
       AND o.deadline_at > now()
       AND o.attempts < 12
       AND ((o.status IN ('queued', 'retry') AND o.next_attempt_at <= now())
            OR (o.status = 'sending' AND o.lease_until <= now()))
     ORDER BY o.next_attempt_at
     LIMIT p_batch
       FOR UPDATE SKIP LOCKED
  )
  UPDATE public.newsletter_outbox o
     SET status = 'sending',
         attempts = o.attempts + 1,
         first_attempt_at = coalesce(o.first_attempt_at, now()),
         lease_until = now() + p_lease_seconds * interval '1 second',
         outcome_unknown = o.outcome_unknown OR o.status = 'sending'
    FROM cand
   WHERE o.id = cand.id
  RETURNING o.id, o.subscriber_id, o.kind, o.attempts, o.consent_text_version, o.policy_version,
            o.idempotency_key, o.outcome_unknown;
END
$fn$;

-- ─── newsletter_outbox_prepare (§8.1) ────────────────────────────────────────
-- Idempotente: se o payload já existe, não faz nada (a retentativa reutiliza). Copia as versões
-- do consentimento da linha do outbox; não as aceita como parâmetro.
CREATE FUNCTION public.newsletter_outbox_prepare(
  p_id uuid,
  p_attempt integer,
  p_confirm_hash text,
  p_confirm_raw text,
  p_unsub_hash text,
  p_unsub_raw text,
  p_template_version text
)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  v_out public.newsletter_outbox%ROWTYPE;
BEGIN
  IF p_id IS NULL OR p_attempt IS NULL OR p_unsub_hash IS NULL OR p_unsub_raw IS NULL OR p_template_version IS NULL THEN
    RAISE EXCEPTION 'newsletter_outbox_prepare: parametro obrigatorio nulo' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_out FROM public.newsletter_outbox WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR v_out.status <> 'sending' OR v_out.attempts <> p_attempt THEN
    RETURN 'stale';
  END IF;
  IF EXISTS (SELECT 1 FROM public.newsletter_outbox_payload WHERE outbox_id = p_id) THEN
    RETURN 'already_prepared';
  END IF;

  IF v_out.kind = 'confirmation' THEN
    IF p_confirm_hash IS NULL OR p_confirm_raw IS NULL THEN
      RAISE EXCEPTION 'newsletter_outbox_prepare: confirmacao exige token C' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.newsletter_tokens (subscriber_id, kind, token_hash, expires_at, consent_text_version, policy_version, outbox_id)
    VALUES (v_out.subscriber_id, 'confirm', p_confirm_hash, v_out.created_at + interval '48 hours',
            v_out.consent_text_version, v_out.policy_version, v_out.id);
  ELSIF p_confirm_hash IS NOT NULL OR p_confirm_raw IS NOT NULL THEN
    RAISE EXCEPTION 'newsletter_outbox_prepare: unsubscribe_link nao leva token C' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.newsletter_tokens (subscriber_id, kind, token_hash, outbox_id)
  VALUES (v_out.subscriber_id, 'unsubscribe', p_unsub_hash, v_out.id);

  INSERT INTO public.newsletter_outbox_payload (outbox_id, confirm_token, unsubscribe_token, template_version)
  VALUES (v_out.id, p_confirm_raw, p_unsub_raw, p_template_version);

  RETURN 'prepared';
END
$fn$;

-- ─── newsletter_outbox_complete (§8.1: comparação e troca) ───────────────────
CREATE FUNCTION public.newsletter_outbox_complete(
  p_id uuid,
  p_attempt integer,
  p_outcome text,
  p_provider_message_id text DEFAULT NULL,
  p_error_code text DEFAULT NULL,
  p_next_attempt_at timestamptz DEFAULT NULL,
  p_dead_reason text DEFAULT NULL,
  p_outcome_unknown boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  v_updated integer;
BEGIN
  IF p_id IS NULL OR p_attempt IS NULL OR p_outcome IS NULL OR p_outcome NOT IN ('sent', 'retry', 'dead') THEN
    RAISE EXCEPTION 'newsletter_outbox_complete: parametros invalidos' USING ERRCODE = '22023';
  END IF;

  IF p_outcome = 'sent' THEN
    IF p_provider_message_id IS NULL THEN
      RAISE EXCEPTION 'newsletter_outbox_complete: sent exige provider_message_id' USING ERRCODE = '22023';
    END IF;
    UPDATE public.newsletter_outbox
       SET status = 'sent', provider_message_id = p_provider_message_id, sent_at = now(),
           lease_until = NULL, outcome_unknown = false, last_error_code = NULL
     WHERE id = p_id AND status = 'sending' AND attempts = p_attempt;
  ELSIF p_outcome = 'retry' THEN
    IF p_next_attempt_at IS NULL THEN
      RAISE EXCEPTION 'newsletter_outbox_complete: retry exige next_attempt_at' USING ERRCODE = '22023';
    END IF;
    UPDATE public.newsletter_outbox
       SET status = 'retry', next_attempt_at = p_next_attempt_at, lease_until = NULL,
           last_error_code = p_error_code, outcome_unknown = coalesce(p_outcome_unknown, false)
     WHERE id = p_id AND status = 'sending' AND attempts = p_attempt;
  ELSE
    IF p_dead_reason IS NULL THEN
      RAISE EXCEPTION 'newsletter_outbox_complete: dead exige dead_reason' USING ERRCODE = '22023';
    END IF;
    UPDATE public.newsletter_outbox
       SET status = 'dead', dead_reason = p_dead_reason, lease_until = NULL,
           last_error_code = p_error_code, outcome_unknown = coalesce(p_outcome_unknown, false)
     WHERE id = p_id AND status = 'sending' AND attempts = p_attempt;
  END IF;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN 'stale';
  END IF;

  IF p_outcome IN ('sent', 'dead') THEN
    DELETE FROM public.newsletter_outbox_payload WHERE outbox_id = p_id;
  END IF;
  -- Mensagem morta sem entrega possível: os tokens dela são descartados (§6.3).
  IF p_outcome = 'dead' AND NOT coalesce(p_outcome_unknown, false) THEN
    DELETE FROM public.newsletter_tokens WHERE outbox_id = p_id;
  END IF;
  RETURN 'applied';
END
$fn$;

-- ─── newsletter_outbox_expire (§8.1) ─────────────────────────────────────────
-- Nunca toca um 'sending' com lease válido. Devolve quantos itens morreram.
CREATE FUNCTION public.newsletter_outbox_expire()
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  v_count integer;
BEGIN
  WITH dead AS (
    UPDATE public.newsletter_outbox o
       SET status = 'dead', lease_until = NULL,
           dead_reason = CASE WHEN o.deadline_at <= now() THEN 'deadline_elapsed' ELSE 'attempts_exhausted' END
     WHERE (o.status IN ('queued', 'retry') OR (o.status = 'sending' AND o.lease_until <= now()))
       AND (o.deadline_at <= now() OR o.attempts >= 12)
    RETURNING o.id, o.outcome_unknown
  ),
  purge_payload AS (
    DELETE FROM public.newsletter_outbox_payload WHERE outbox_id IN (SELECT id FROM dead)
  ),
  purge_tokens AS (
    DELETE FROM public.newsletter_tokens WHERE outbox_id IN (SELECT id FROM dead WHERE NOT outcome_unknown)
  )
  SELECT count(*)::integer INTO v_count FROM dead;
  RETURN v_count;
END
$fn$;

-- ─── EXECUTE: somente service_role ───────────────────────────────────────────
REVOKE ALL ON FUNCTION public.newsletter_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_request_subscription(text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_request_unsubscribe_link(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_confirm(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_unsubscribe(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_outbox_claim(integer, integer, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_outbox_prepare(uuid, integer, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_outbox_complete(uuid, integer, text, text, text, timestamptz, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_outbox_expire() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.newsletter_request_subscription(text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.newsletter_request_unsubscribe_link(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.newsletter_confirm(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.newsletter_unsubscribe(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.newsletter_outbox_claim(integer, integer, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.newsletter_outbox_prepare(uuid, integer, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.newsletter_outbox_complete(uuid, integer, text, text, text, timestamptz, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.newsletter_outbox_expire() TO service_role;

-- ─── Autoverificação: qualquer divergência reverte a transação inteira ───────
DO $selfcheck$
DECLARE
  problems text[] := ARRAY[]::text[];
  t text;
  f text;
  priv text;
BEGIN
  FOREACH t IN ARRAY ARRAY['newsletter_subscribers','newsletter_outbox','newsletter_tokens','newsletter_outbox_payload','newsletter_consents'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'public' AND c.relname = t AND c.relrowsecurity) THEN
      problems := array_append(problems, t || ': RLS desligado');
    END IF;
    FOREACH priv IN ARRAY ARRAY['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
      IF has_table_privilege('anon', 'public.' || t, priv) OR has_table_privilege('authenticated', 'public.' || t, priv) THEN
        problems := array_append(problems, t || ': anon/authenticated com ' || priv);
      END IF;
    END LOOP;
    IF has_table_privilege('anon', 'public.' || t, 'SELECT') THEN
      problems := array_append(problems, t || ': anon com SELECT');
    END IF;
    IF NOT has_table_privilege('service_role', 'public.' || t, 'SELECT') THEN
      problems := array_append(problems, t || ': service_role sem SELECT');
    END IF;
  END LOOP;

  FOREACH t IN ARRAY ARRAY['newsletter_tokens','newsletter_outbox_payload'] LOOP
    IF has_table_privilege('authenticated', 'public.' || t, 'SELECT') THEN
      problems := array_append(problems, t || ': authenticated com SELECT (admin não lê credenciais)');
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['newsletter_subscribers','newsletter_outbox','newsletter_consents'] LOOP
    IF NOT has_table_privilege('authenticated', 'public.' || t, 'SELECT') THEN
      problems := array_append(problems, t || ': authenticated sem SELECT');
    END IF;
    IF (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = t) <> 1 THEN
      problems := array_append(problems, t || ': esperada exatamente 1 policy');
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['newsletter_tokens','newsletter_outbox_payload'] LOOP
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = t) THEN
      problems := array_append(problems, t || ': não deve ter policies');
    END IF;
  END LOOP;

  FOR f IN SELECT p.oid::regprocedure::text
             FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname LIKE 'newsletter\_%' LOOP
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid = f::regprocedure AND p.prosecdef) THEN
      problems := array_append(problems, f || ': função com privilégios do dono (definer) inesperada');
    END IF;
    IF has_function_privilege('anon', f::regprocedure, 'EXECUTE')
       OR has_function_privilege('authenticated', f::regprocedure, 'EXECUTE') THEN
      problems := array_append(problems, f || ': EXECUTE para anon/authenticated');
    END IF;
    IF NOT has_function_privilege('service_role', f::regprocedure, 'EXECUTE') THEN
      problems := array_append(problems, f || ': service_role sem EXECUTE');
    END IF;
  END LOOP;

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION E'018 REVERTIDA — autoverificação falhou:\n - %', array_to_string(problems, E'\n - ');
  END IF;
END
$selfcheck$;

COMMIT;
