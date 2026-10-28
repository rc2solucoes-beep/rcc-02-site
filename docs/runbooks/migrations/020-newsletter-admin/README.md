# N4 / 020 — Administração essencial da newsletter (E4)

**STATUS: 020 APLICADA NO ISOLADO, ACL CORRIGIDA MANUALMENTE E VERIFY APROVADO. PR #48 DRAFT.** Alvo inicial exclusivo: `rc2-test-isolated` (`pyhhygvdjokddphftuua`). Não aplicar em Production. A N4 é independente dos jobs da 019, mas requer N1/018.

## Entrega
- Papel PostgreSQL dedicado `newsletter_ops` sem LOGIN/BYPASSRLS, policies e privilégios restritos.
- `newsletter_admin_unsubscribe(uuid,text)`: admin autenticado, motivo em whitelist, revoga confirmação pendente, registra consentimento e auditoria na transação.
- `newsletter_admin_delete_subscriber(uuid,text)`: admin autenticado, confirmação literal EXCLUIR, exclusão em cascata e auditoria transacional.
- Server Actions usam sessão/RLS e estão **desligadas por padrão**, exigem `NEWSLETTER_ADMIN_MUTATIONS_ENABLED=true` somente após homologação isolada.
- Sem enviar e-mail, criar cron ou disponibilizar ação fora da administração. Complemento (reenviar confirmação e revogar tokens U) excluído.

## Pré-condições e pontos de decisão
1. Evidência do marcador de isolamento e 018 aplicada, tabelas `admin_users` e `admin_audit_logs` existentes.
2. Conferir que `postgres` pode transferir ownership para role `newsletter_ops` (PV-26). `CREATEROLE=true` **não prova** que pode `ALTER FUNCTION ... OWNER`; testar em ambiente descartável, nunca resolver com `BYPASSRLS` ou ownership de `postgres`.
3. Confirmar privilégios efetivos do owner sobre `auth.uid()` e RLS de `admin_users`, `newsletter_subscribers`, `newsletter_tokens`, `newsletter_outbox`, `admin_audit_logs`.
4. Revisar comportamento de cascata e corrida com `sending`: descadastro não cancela item já reivindicado; processador deve revalidar o status. Para exclusão, excluir assinante enquanto há envio em andamento pode exigir nova contenção; cobrir em testes.
5. Testar status e auditoria sob JWT admin, usuário autenticado não-admin, e ausência de JWT; validar que `authenticated` só tem EXECUTE e não escrita em tabelas; `newsletter_ops` não toca `leads`, `posts`, `settings`.
6. Sem backup/PITR no isolado, qualquer tentativa deve ser autorizada explicitamente para esse projeto e deve ser recuperável por reconstrução. Não executar SQL sem novo GO.

## Verificação proposta antes de aplicar
- `BEGIN READ ONLY` com identificação do marcador, checagem de objetos e roles inexistentes, ownership existente, grants e policies relevantes.
- Inventário das funções `SECURITY DEFINER`: `prosecdef=true`, owner dedicado, `search_path=pg_catalog,public`, EXECUTE para `authenticated`, sem PUBLIC/anon.
- Testes T-NL-I16/I17/I30 com JWT de administrador e não-admin, mais teste de auditoria falhando (ação tem que reverter).
- `typecheck`, `lint`, unitários afetados e build. A presença do arquivo no GitHub **não significa aprovação**.

## Apply e rollback
- `supabase/migrations/020_newsletter_admin_essential.sql`: **primeira aplicação estrita**, transação única. Não reaplicar.
- Rollback pré-ativação só mediante autorização; deve revogar EXECUTE, remover policies, funções, grants e role apenas após verificar dependências. Com assinantes reais, avaliar auditoria/retencão com jurídico.
- Nenhuma alteração na migration 018, jobs 019, flags públicas, produção ou credenciais.

## Revisão 28/10/2026 — ownership PostgreSQL 17

A migration concede temporariamente `newsletter_ops TO postgres WITH SET TRUE, INHERIT FALSE` para a transferência de propriedade e revoga a associação explícita antes do COMMIT. No PostgreSQL 17, o criador de uma role pode conservar associação administrativa automática (`SET FALSE`): o verify exige **negação efetiva de `pg_has_role('postgres','newsletter_ops','SET')`**, não ausência absoluta de linhas em `pg_auth_members`. Essa condição requer teste real antes do apply, pois `GRANT/REVOKE` não foram executados no isolado.

O identificador do chamador utiliza `request.jwt.claim.sub` com fallback para `request.jwt.claims->>'sub'`, equivalente à implementação de `auth.uid()` observada no isolado (Postgres 17.11). A aplicação permanece bloqueada por padrão. **Preflight estrutural não é homologação de JWT, ownership nem auditoria.**

## Revisão de integridade — 28/10/2026

No descadastro administrativo, mensagens de confirmação ainda em `queued` ou `retry` passam a `dead/superseded` e seus registros em `newsletter_outbox_payload` são removidos **na mesma transação**, sem ler os tokens brutos. O papel `newsletter_ops` recebe somente `SELECT(outbox_id)` e `DELETE` sobre payload, com policies dedicadas; não recebe `SELECT` das colunas com segredos. Mensagens `sending` não são alteradas por essa operação, pois dependem da revalidação do processador; verificar a corrida no teste de integração. Rollback cobre as policies e grants adicionais. Nenhuma operação foi habilitada ou aplicada.

**Limite de evidência:** o teste estático cobre a presença da limpeza e os grants declarados, mas não substitui T-NL-I16/I17/I30 nem a execução real com JWT. O build Vercel não homologa SQL.

## Roteiro de homologação funcional (a executar após GO para aplicar N4)

**Pré-condição:** N4/020 aplicada exclusivamente em `pyhhygvdjokddphftuua` após autorização; flags públicas e `NEWSLETTER_ADMIN_MUTATIONS_ENABLED` permanecem desligadas. Nenhum teste desta seção autoriza alterar o banco antecipadamente.

1. **PV-26 / dono:** verificar `proowner=newsletter_ops`, `prosecdef=true`, `search_path` fixo, role `NOLOGIN/NOBYPASSRLS` e ausência de `SET ROLE newsletter_ops` efetivo para `postgres`; executar `verify.sql`.
2. **Sem JWT:** chamar as duas RPCs com papel anônimo e confirmar `42501`/negação de EXECUTE, sem alteração no cadastro, fila ou auditoria.
3. **JWT não-admin autenticado:** chamar ambas as RPCs com UUID sintético e confirmar `42501`, sem qualquer efeito de dados ou auditoria de sucesso.
4. **Admin autenticado:** inserir assinante sintético `pending`, consentimento e item `queued` de confirmação (com payload sintético e token hash), descadastrar com `titular_request` e verificar: status `unsubscribed`, registro `unsubscribed_admin`, confirmação `dead/superseded`, payload removido, token de confirmação removido, exatamente uma linha `admin_newsletter_unsubscribed` com `actor_user_id`.
5. **Idempotência:** repetir descadastro; deve retornar `already_unsubscribed` e não duplicar consentimento ou auditoria; repetir exclusão retorna `not_found`.
6. **Exclusão:** exigir texto literal `EXCLUIR`. Validar FK cascata (outbox, payload, consentimento, tokens removidos) e auditoria `admin_newsletter_deleted` sobrevivente, sem ler tokens brutos.
7. **Auditoria obrigatória:** provocar falha de INSERT de auditoria dentro de transação controlada e garantir rollback integral de descadastro/exclusão; nunca executar teste de falha destrutiva fora do isolado.
8. **Concorrência:** `sending` deve ser revalidado pelo processador antes do envio; concorrer descadastro e processador, comprovando que confirmação posterior a descadastro não é enviada. Testar separadamente a janela entre revalidação e chamada externa.
9. **Encerramento:** remover exclusivamente registros sintéticos usados na homologação por procedimento aprovado; manter `NEWSLETTER_ADMIN_MUTATIONS_ENABLED` desligada até verificação e autorização de ativação.

Os testes unitários de Server Actions usam dublês (não substituem os testes de JWT, ACL/RLS, transação e concorrência). O status READY da Vercel comprova build, não homologação SQL.

## Execução real no isolado — 28/10/2026

- Projeto: `rc2-test-isolated` (`pyhhygvdjokddphftuua`). Migration `020_newsletter_admin_essential` aplicada via Supabase.
- Primeiro `verify.sql`: REPROVADO exclusivamente por EXECUTE indevido em `PUBLIC/anon`.
- A correção foi executada manualmente no SQL Editor sob `SET ROLE newsletter_ops`, com concessão transitória de SET e revogação antes de COMMIT.
- Verificação posterior diretamente no projeto: `verify.sql` **APROVADO**, `anon_exec=false` nas duas funções, `authenticated_exec=true`, owner `newsletter_ops`, `role_set_denied=true`.
- Não reaplicar `020` no isolado. A correção manual ainda precisa ser reproduzida em **nova migration de reconciliação** para ambientes futuros, sem editar histórico já aplicado.
- Testes unitários da E4 possuem workflow `.github/workflows/newsletter-e4-check.yml`; conferir resultado real no GitHub Actions (não presumir aprovação).
- Testes funcionais com JWT admin/não-admin, transações e auditoria ainda pendentes. Flags públicas e mutações administrativas continuam desligadas; Production intocada.

## Reconciliação versionada — migration 021

O arquivo `supabase/migrations/021_newsletter_admin_acl_reconcile.sql` reproduz a correção de `EXECUTE` executada manualmente no isolado. A migration 020 já aplicada não deve ser reexecutada ou alterada retroativamente. A 021 foi adicionada ao Git, mas **não aplicada pelo agente**. Antes de marcá-la aplicada no histórico do isolado ou executá-la em outros ambientes, conferir estado e autorização. O fluxo de CI da PR agora também contempla evento `pull_request`; sua execução real ainda deve ser confirmada.
