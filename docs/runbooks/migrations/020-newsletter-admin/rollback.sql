-- N4/020 rollback PROPOSTO. NÃO EXECUTAR sem autorização específica.
-- Reverte só objetos e grants criados por 020; NÃO desfaz ações administrativas já realizadas.
-- Antes de executar, verificar dependências de role/funções e retenção de auditoria.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $guard$
BEGIN
  IF to_regrole('newsletter_ops') IS NULL OR
     to_regprocedure('public.newsletter_admin_unsubscribe(uuid,text)') IS NULL OR
     to_regprocedure('public.newsletter_admin_delete_subscriber(uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'Rollback 020 impedido: estado esperado ausente';
  END IF;
END $guard$;

REVOKE EXECUTE ON FUNCTION public.newsletter_admin_unsubscribe(uuid,text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.newsletter_admin_delete_subscriber(uuid,text) FROM authenticated;
DROP FUNCTION public.newsletter_admin_unsubscribe(uuid,text);
DROP FUNCTION public.newsletter_admin_delete_subscriber(uuid,text);

DROP POLICY newsletter_ops_admin_self ON public.admin_users;
DROP POLICY newsletter_ops_subscribers_select ON public.newsletter_subscribers;
DROP POLICY newsletter_ops_subscribers_update ON public.newsletter_subscribers;
DROP POLICY newsletter_ops_subscribers_delete ON public.newsletter_subscribers;
DROP POLICY newsletter_ops_outbox_select ON public.newsletter_outbox;
DROP POLICY newsletter_ops_outbox_update ON public.newsletter_outbox;
DROP POLICY newsletter_ops_tokens_select ON public.newsletter_tokens;
DROP POLICY newsletter_ops_tokens_delete ON public.newsletter_tokens;
DROP POLICY newsletter_ops_payload_id_select ON public.newsletter_outbox_payload;
DROP POLICY newsletter_ops_payload_delete ON public.newsletter_outbox_payload;
DROP POLICY newsletter_ops_consents_insert ON public.newsletter_consents;
DROP POLICY newsletter_ops_audit_insert ON public.admin_audit_logs;

REVOKE SELECT (id) ON public.admin_users FROM newsletter_ops;
REVOKE SELECT (id,status), UPDATE (status,unsubscribed_at), DELETE ON public.newsletter_subscribers FROM newsletter_ops;
REVOKE SELECT (id,subscriber_id,kind,status), UPDATE (status,dead_reason,lease_until) ON public.newsletter_outbox FROM newsletter_ops;
REVOKE SELECT (subscriber_id,kind), DELETE ON public.newsletter_tokens FROM newsletter_ops;
REVOKE SELECT (outbox_id), DELETE ON public.newsletter_outbox_payload FROM newsletter_ops;
REVOKE INSERT (subscriber_id,event,reason) ON public.newsletter_consents FROM newsletter_ops;
REVOKE INSERT (event,severity,actor_user_id,actor_type,path,method,status,resource_type,resource_id,metadata)
  ON public.admin_audit_logs FROM newsletter_ops;
REVOKE USAGE ON SCHEMA public FROM newsletter_ops;
DROP ROLE newsletter_ops;
COMMIT;
