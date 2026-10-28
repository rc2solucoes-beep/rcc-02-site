-- E4 / N4 (020) — administração essencial da newsletter: duas ações de negócio atômicas.
-- PROPOSTA, NÃO APLICADA. NÃO executar sem autorização específica e PV-26 homologado.
-- Depende da 018 no mesmo ambiente; não altera 018/019, não cria jobs, não toca Production.
-- Primeira aplicação estrita: sem IF NOT EXISTS; erro aborta a transação inteira.
-- Owner dedicado newsletter_ops (NOLOGIN, NOINHERIT, NOBYPASSRLS); não usar postgres fallback.
-- Ambas as ações verificam o admin DENTRO do banco e gravam auditoria na mesma transação.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $guard$
DECLARE v_missing text[] := ARRAY[]::text[];
BEGIN
  IF to_regrole('newsletter_ops') IS NOT NULL THEN v_missing := array_append(v_missing,'role newsletter_ops já existe'); END IF;
  IF to_regclass('public.newsletter_subscribers') IS NULL OR
     to_regclass('public.newsletter_consents') IS NULL OR
     to_regclass('public.newsletter_tokens') IS NULL OR
     to_regclass('public.newsletter_outbox') IS NULL OR
     to_regclass('public.admin_users') IS NULL OR
     to_regclass('public.admin_audit_logs') IS NULL THEN
    v_missing := array_append(v_missing,'dependências da 018/admin ausentes');
  END IF;
  IF to_regprocedure('public.newsletter_admin_unsubscribe(uuid,text)') IS NOT NULL OR
     to_regprocedure('public.newsletter_admin_delete_subscriber(uuid,text)') IS NOT NULL THEN
    v_missing := array_append(v_missing,'funções N4 já existem');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND policyname LIKE 'newsletter_ops_%') THEN
    v_missing := array_append(v_missing,'policies newsletter_ops pré-existentes');
  END IF;
  IF array_length(v_missing,1) IS NOT NULL THEN
    RAISE EXCEPTION '020 first apply impedido: %', array_to_string(v_missing,'; ');
  END IF;
END
$guard$;

CREATE ROLE newsletter_ops NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
-- Membership temporária apenas durante a transferência de ownership nesta transação.
-- PG 17 exige que o operador seja membro do novo proprietário; revogar antes do COMMIT.
GRANT newsletter_ops TO postgres;

GRANT USAGE ON SCHEMA public TO newsletter_ops;
GRANT SELECT (id) ON public.admin_users TO newsletter_ops;
CREATE POLICY newsletter_ops_admin_self ON public.admin_users
  FOR SELECT TO newsletter_ops USING (id = NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid);

-- Menor superfície para as duas ações essenciais; nenhuma permissão em leads/posts/settings.
GRANT SELECT, UPDATE, DELETE ON public.newsletter_subscribers TO newsletter_ops;
CREATE POLICY newsletter_ops_subscribers_select ON public.newsletter_subscribers
  FOR SELECT TO newsletter_ops USING (true);
CREATE POLICY newsletter_ops_subscribers_update ON public.newsletter_subscribers
  FOR UPDATE TO newsletter_ops USING (true) WITH CHECK (true);
CREATE POLICY newsletter_ops_subscribers_delete ON public.newsletter_subscribers
  FOR DELETE TO newsletter_ops USING (true);

GRANT SELECT, UPDATE ON public.newsletter_outbox TO newsletter_ops;
CREATE POLICY newsletter_ops_outbox_select ON public.newsletter_outbox
  FOR SELECT TO newsletter_ops USING (true);
CREATE POLICY newsletter_ops_outbox_update ON public.newsletter_outbox
  FOR UPDATE TO newsletter_ops USING (true) WITH CHECK (true);

GRANT SELECT, DELETE ON public.newsletter_tokens TO newsletter_ops;
CREATE POLICY newsletter_ops_tokens_select ON public.newsletter_tokens
  FOR SELECT TO newsletter_ops USING (true);
CREATE POLICY newsletter_ops_tokens_delete ON public.newsletter_tokens
  FOR DELETE TO newsletter_ops USING (true);

GRANT INSERT (subscriber_id,event,reason) ON public.newsletter_consents TO newsletter_ops;
CREATE POLICY newsletter_ops_consents_insert ON public.newsletter_consents
  FOR INSERT TO newsletter_ops WITH CHECK (event='unsubscribed_admin' AND reason IN ('titular_request','bounce_or_complaint','other'));

GRANT INSERT (event,severity,actor_user_id,actor_type,path,method,status,resource_type,resource_id,metadata)
  ON public.admin_audit_logs TO newsletter_ops;
CREATE POLICY newsletter_ops_audit_insert ON public.admin_audit_logs
  FOR INSERT TO newsletter_ops WITH CHECK (
    actor_type='admin' AND actor_user_id=NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid AND
    event IN ('admin_newsletter_unsubscribed','admin_newsletter_deleted')
    AND resource_type='newsletter_subscriber'
  );

-- O schema auth não concede USAGE a newsletter_ops e pertence a supabase_admin;
-- usar claim JWT de PostgREST (SDD §11.4, alternativa) evita novos grants privilegiados.
-- PV-26 exige teste de role/JWT real; jamais promover newsletter_ops a BYPASSRLS.
CREATE FUNCTION public.newsletter_admin_unsubscribe(p_subscriber_id uuid, p_reason text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  v_actor uuid := NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
  v_status text;
BEGIN
  IF v_actor IS NULL OR NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = v_actor) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501';
  END IF;
  IF p_subscriber_id IS NULL OR p_reason IS NULL OR p_reason NOT IN ('titular_request','bounce_or_complaint','other') THEN
    RAISE EXCEPTION 'parâmetros inválidos' USING ERRCODE='22023';
  END IF;

  SELECT status INTO v_status FROM public.newsletter_subscribers
    WHERE id = p_subscriber_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_status='unsubscribed' THEN RETURN 'already_unsubscribed'; END IF;

  UPDATE public.newsletter_subscribers
    SET status='unsubscribed', unsubscribed_at=now()
    WHERE id=p_subscriber_id;
  -- Links de confirmação pendentes não devem ser usados após descadastro.
  DELETE FROM public.newsletter_tokens
    WHERE subscriber_id=p_subscriber_id AND kind='confirm';
  UPDATE public.newsletter_outbox
    SET status='dead',dead_reason='superseded',lease_until=NULL
    WHERE subscriber_id=p_subscriber_id AND kind='confirmation' AND status IN ('queued','retry');

  INSERT INTO public.newsletter_consents (subscriber_id,event,reason)
  VALUES (p_subscriber_id,'unsubscribed_admin',p_reason);
  INSERT INTO public.admin_audit_logs
    (event,severity,actor_user_id,actor_type,path,method,status,resource_type,resource_id,metadata)
  VALUES
    ('admin_newsletter_unsubscribed','info',v_actor,'admin','/admin/newsletter','RPC',200,
     'newsletter_subscriber',p_subscriber_id::text,jsonb_build_object('reason',p_reason,'result','unsubscribed'));
  RETURN 'unsubscribed';
END
$fn$;

CREATE FUNCTION public.newsletter_admin_delete_subscriber(p_subscriber_id uuid, p_confirmation text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  v_actor uuid := NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
  v_deleted uuid;
BEGIN
  IF v_actor IS NULL OR NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = v_actor) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE='42501';
  END IF;
  IF p_subscriber_id IS NULL THEN RAISE EXCEPTION 'id inválido' USING ERRCODE='22023'; END IF;
  IF p_confirmation IS DISTINCT FROM 'EXCLUIR' THEN RETURN 'confirmation_invalid'; END IF;
  DELETE FROM public.newsletter_subscribers WHERE id=p_subscriber_id RETURNING id INTO v_deleted;
  IF v_deleted IS NULL THEN RETURN 'not_found'; END IF;
  -- A FK ON DELETE CASCADE da 018 elimina consentimentos, tokens, outbox e payload;
  -- o evento de auditoria NÃO tem FK com assinantes e permanece.
  INSERT INTO public.admin_audit_logs
    (event,severity,actor_user_id,actor_type,path,method,status,resource_type,resource_id,metadata)
  VALUES
    ('admin_newsletter_deleted','warn',v_actor,'admin','/admin/newsletter','RPC',200,
     'newsletter_subscriber',p_subscriber_id::text,jsonb_build_object('result','deleted'));
  RETURN 'deleted';
END
$fn$;

ALTER FUNCTION public.newsletter_admin_unsubscribe(uuid,text) OWNER TO newsletter_ops;
ALTER FUNCTION public.newsletter_admin_delete_subscriber(uuid,text) OWNER TO newsletter_ops;
REVOKE ALL ON FUNCTION public.newsletter_admin_unsubscribe(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_admin_delete_subscriber(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.newsletter_admin_unsubscribe(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.newsletter_admin_delete_subscriber(uuid,text) TO authenticated;
REVOKE newsletter_ops FROM postgres;
COMMIT;
