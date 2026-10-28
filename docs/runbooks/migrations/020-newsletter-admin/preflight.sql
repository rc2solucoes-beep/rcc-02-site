-- N4 020 preflight — somente leitura. O operador confere projeto e autoriza apply separadamente.
BEGIN READ ONLY;
WITH c AS (
 SELECT
  (SELECT btrim(value::text,'"') FROM public.settings WHERE key='__rc2_isolated_test_env__') AS marker,
  (SELECT rolcreaterole FROM pg_roles WHERE rolname='postgres') AS can_create_role,
  to_regrole('newsletter_ops') IS NULL AS role_absent,
  to_regclass('public.newsletter_subscribers') IS NOT NULL AS subscribers_exist,
  to_regclass('public.admin_users') IS NOT NULL AS admin_exist,
  to_regclass('public.admin_audit_logs') IS NOT NULL AS audit_exist,
  to_regprocedure('public.newsletter_admin_unsubscribe(uuid,text)') IS NULL AS unsubscribe_absent,
  to_regprocedure('public.newsletter_admin_delete_subscriber(uuid,text)') IS NULL AS delete_absent,
  (SELECT count(*)=0 FROM pg_policies WHERE schemaname='public' AND policyname LIKE 'newsletter_ops_%') AS policies_absent
)
SELECT '020-N4' AS migration,
       CASE WHEN marker='pyhhygvdjokddphftuua' AND can_create_role AND role_absent
         AND subscribers_exist AND admin_exist AND audit_exist AND unsubscribe_absent
         AND delete_absent AND policies_absent THEN 'APROVADO' ELSE 'REPROVADO' END AS resultado,
       jsonb_build_object('marker',marker,'createrole',can_create_role,'role_absent',role_absent,
         'subscribers',subscribers_exist,'admin',admin_exist,'audit',audit_exist,
         'unsubscribe_absent',unsubscribe_absent,'delete_absent',delete_absent,'policies_absent',policies_absent) AS checks
FROM c;
ROLLBACK;
