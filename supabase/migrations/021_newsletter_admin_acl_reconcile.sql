-- E4 N4: reconcile EXECUTE privileges after ownership transfer in 020.
-- Already performed manually on rc2-test-isolated; applies only to environments
-- where N4 exists. No data, scheduler or subscriber changes.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $guard$
BEGIN
  IF to_regprocedure('public.newsletter_admin_unsubscribe(uuid,text)') IS NULL OR
     to_regprocedure('public.newsletter_admin_delete_subscriber(uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'N4 functions missing';
  END IF;
END $guard$;
GRANT newsletter_ops TO postgres WITH SET TRUE, INHERIT FALSE;
SET ROLE newsletter_ops;
REVOKE EXECUTE ON FUNCTION public.newsletter_admin_unsubscribe(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.newsletter_admin_delete_subscriber(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.newsletter_admin_unsubscribe(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.newsletter_admin_delete_subscriber(uuid,text) TO authenticated;
RESET ROLE;
REVOKE newsletter_ops FROM postgres;
DO $check$
BEGIN
 IF has_function_privilege('anon','public.newsletter_admin_unsubscribe(uuid,text)','EXECUTE')
 OR has_function_privilege('anon','public.newsletter_admin_delete_subscriber(uuid,text)','EXECUTE')
 OR pg_has_role('postgres','newsletter_ops','SET') THEN
   RAISE EXCEPTION 'N4 privilege reconciliation failed';
 END IF;
END $check$;
COMMIT;
