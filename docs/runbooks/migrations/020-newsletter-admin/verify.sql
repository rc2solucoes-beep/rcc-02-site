-- N4 020 verify — somente leitura. NÃO confirma funcionamento; testes JWT são indispensáveis.
BEGIN READ ONLY;
WITH x AS (
  SELECT
    (SELECT rolcanlogin=false AND rolbypassrls=false AND rolsuper=false FROM pg_roles WHERE rolname='newsletter_ops') AS role_safe,
    (SELECT count(*)=2 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname IN ('newsletter_admin_unsubscribe','newsletter_admin_delete_subscriber')
       AND p.prosecdef AND p.proowner='newsletter_ops'::regrole) AS functions_owned,
    has_function_privilege('authenticated','public.newsletter_admin_unsubscribe(uuid,text)','EXECUTE') AS exec_unsub,
    has_function_privilege('authenticated','public.newsletter_admin_delete_subscriber(uuid,text)','EXECUTE') AS exec_delete,
    has_function_privilege('anon','public.newsletter_admin_unsubscribe(uuid,text)','EXECUTE')=false AS anon_denied,
    (SELECT NOT pg_has_role('postgres','newsletter_ops','SET')) AS role_set_denied
)
SELECT '020-N4' AS migration,
       CASE WHEN role_safe AND functions_owned AND exec_unsub AND exec_delete AND anon_denied AND role_set_denied
       THEN 'APROVADO' ELSE 'REPROVADO' END AS resultado,
       to_jsonb(x) AS checks FROM x;
ROLLBACK;
