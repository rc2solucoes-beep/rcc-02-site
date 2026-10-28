# N4 / 020 — Administração essencial da newsletter (E4)

**STATUS: PROPOSTA — NÃO APLICADA. PR #48 DRAFT.** Alvo inicial exclusivo: \`rc2-test-isolated\` (\`pyhhygvdjokddphftuua\`). Não aplicar em Production. A N4 é independente dos jobs da 019, mas requer N1/018.

## Entrega
- Papel PostgreSQL dedicado \`newsletter_ops\` sem LOGIN/BYPASSRLS, policies e privilégios restritos.
- \`newsletter_admin_unsubscribe(uuid,text)\`: admin autenticado, motivo em whitelist, revoga confirmação pendente, registra consentimento e auditoria na transação.
- \`newsletter_admin_delete_subscriber(uuid,text)\`: admin autenticado, confirmação literal EXCLUIR, exclusão em cascata e auditoria transacional.
- Server Actions usam sessão/RLS e estão **desligadas por padrão**, exigem \`NEWSLETTER_ADMIN_MUTATIONS_ENABLED=true\` somente após homologação isolada.
- Sem enviar e-mail, criar cron ou disponibilizar ação fora da administração. Complemento (reenviar confirmação e revogar tokens U) excluído.

## Pré-condições e pontos de decisão
1. Evidência do marcador de isolamento e 018 aplicada, tabelas \`admin_users\` e \`admin_audit_logs\` existentes.
2. Conferir que \`postgres\` pode transferir ownership para role \`newsletter_ops\` (PV-26). \`CREATEROLE=true\` **não prova** que pode \`ALTER FUNCTION ... OWNER\`; testar em ambiente descartável, nunca resolver com \`BYPASSRLS\` ou ownership de \`postgres\`.
3. Confirmar privilégios efetivos do owner sobre \`auth.uid()\` e RLS de \`admin_users\`, \`newsletter_subscribers\`, \`newsletter_tokens\`, \`newsletter_outbox\`, \`admin_audit_logs\`.
4. Revisar comportamento de cascata e corrida com \`sending\`: descadastro não cancela item já reivindicado; processador deve revalidar o status. Para exclusão, excluir assinante enquanto há envio em andamento pode exigir nova contenção; cobrir em testes.
5. Testar status e auditoria sob JWT admin, usuário autenticado não-admin, e ausência de JWT; validar que \`authenticated\` só tem EXECUTE e não escrita em tabelas; \`newsletter_ops\` não toca \`leads\`, \`posts\`, \`settings\`.
6. Sem backup/PITR no isolado, qualquer tentativa deve ser autorizada explicitamente para esse projeto e deve ser recuperável por reconstrução. Não executar SQL sem novo GO.

## Verificação proposta antes de aplicar
- \`BEGIN READ ONLY\` com identificação do marcador, checagem de objetos e roles inexistentes, ownership existente, grants e policies relevantes.
- Inventário das funções \`SECURITY DEFINER\`: \`prosecdef=true\`, owner dedicado, \`search_path=pg_catalog,public\`, EXECUTE para \`authenticated\`, sem PUBLIC/anon.
- Testes T-NL-I16/I17/I30 com JWT de administrador e não-admin, mais teste de auditoria falhando (ação tem que reverter).
- \`typecheck\`, \`lint\`, unitários afetados e build. A presença do arquivo no GitHub **não significa aprovação**.

## Apply e rollback
- \`supabase/migrations/020_newsletter_admin_essential.sql\`: **primeira aplicação estrita**, transação única. Não reaplicar.
- Rollback pré-ativação só mediante autorização; deve revogar EXECUTE, remover policies, funções, grants e role apenas após verificar dependências. Com assinantes reais, avaliar auditoria/retencão com jurídico.
- Nenhuma alteração na migration 018, jobs 019, flags públicas, produção ou credenciais.
