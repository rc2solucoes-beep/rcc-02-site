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
    (SELECT NOT pg_has_role('postgres','newsletter_ops','SET')) AS role_set_denied,
    has_column_privilege('newsletter_ops','public.newsletter_outbox_payload','outbox_id','SELECT') AS payload_id_select,
    NOT has_column_privilege('newsletter_ops','public.newsletter_outbox_payload','confirm_token','SELECT') AS no_confirm_token_read,
    NOT has_column_privilege('newsletter_ops','public.newsletter_outbox_payload','unsubscribe_token','SELECT') AS no_unsubscribe_token_read,
    NOT has_column_privilege('newsletter_ops','public.newsletter_outbox_payload','template_version','SELECT') AS no_template_read,
    has_table_privilege('newsletter_ops','public.newsletter_outbox_payload','DELETE') AS payload_delete,
    NOT has_schema_privilege('newsletter_ops','public','CREATE') AS no_schema_create,
    NOT has_column_privilege('newsletter_ops','public.newsletter_subscribers','email','SELECT') AS no_subscriber_email_read,
    NOT has_column_privilege('newsletter_ops','public.newsletter_outbox','provider_message_id','SELECT') AS no_provider_id_read,
    NOT has_column_privilege('newsletter_ops','public.newsletter_tokens','token_hash','SELECT') AS no_token_hash_read,
    has_column_privilege('newsletter_ops','public.newsletter_subscribers','status','UPDATE') AS can_update_status,
    NOT has_table_privilege('anon','public.newsletter_subscribers','SELECT') AS anon_no_subscribers,
    NOT has_table_privilege('authenticated','public.newsletter_subscribers','DELETE') AS auth_no_subscriber_delete,
    NOT has_table_privilege('authenticated','public.newsletter_subscribers','UPDATE') AS auth_no_subscriber_update,
    NOT has_table_privilege('newsletter_ops','public.leads','SELECT') AS no_leads_read,
    NOT has_table_privilege('newsletter_ops','public.posts','SELECT') AS no_posts_read,
    NOT has_table_privilege('newsletter_ops','public.settings','SELECT') AS no_settings_read
)
SELECT '020-N4' AS migration,
       CASE WHEN role_safe AND functions_owned AND exec_unsub AND exec_delete AND anon_denied AND role_set_denied AND payload_id_select AND no_confirm_token_read
        AND no_unsubscribe_token_read AND no_template_read AND payload_delete AND no_schema_create
        AND anon_no_subscribers AND auth_no_subscriber_delete AND auth_no_subscriber_update
        AND no_leads_read AND no_posts_read AND no_settings_read
        AND no_subscriber_email_read AND no_provider_id_read AND no_token_hash_read AND can_update_status
       THEN 'APROVADO' ELSE 'REPROVADO' END AS resultado,
       to_jsonb(x) AS checks FROM x;
ROLLBACK;
