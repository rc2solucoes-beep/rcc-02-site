# E2 — Preflight técnico estático de Gestão de Leads (23/10/2026)

**Classificação:** revisão **READ ONLY de arquivos e histórico GitHub** na `main` (`b19391ec811bee261089c574224d66a32e129fed`). **Nenhuma conexão ao banco Supabase, query remota, execução de testes, alteração de código/SQL, migration, merge ou deploy.**

**Resultado:** **GO para detalhamento do plano técnico da E2; NÃO é GO para implementação, execução de migrations, integração ou deploy.**

## 1. Documentos de referência

- PRD: `docs/superpowers/specs/2026-10-13-admin-evolution-prd.md`, §§6.3 e 14 — `RF-LEAD-01..11`.
- SDD: `docs/superpowers/specs/2026-10-13-admin-leads-management-design.md`, Parte II, §§8–17.
- Rastreabilidade: `docs/superpowers/specs/2026-10-13-admin-evolution-traceability.md`, §§1.3, 4 e 6.1.
- Runbooks E0b: `docs/runbooks/migrations/012-leads-remove-anon-access/`, `013-admin-audit-logs-admin-select/`, `docs/runbooks/evidence/E0b-2026-10-17.md`.
- E1: PR #40 integrado em 23/10/2026 (commit `b19391ec`); PR #41 é encerramento documental separado, não pré-requisito funcional para E2.

## 2. Constatações no código da `main`

| Verificação | Evidência estática | Resultado |
|---|---|---|
| Listagem atual de leads | `src/app/admin/(protected)/leads/page.tsx` usa `select("*")`, `created_at DESC`, sem filtro/paginação, e captura exceção retornando `[]` | **E2 ainda não implementada.** Corrigir diferenciação de erro × vazio; substituir consulta integral por campos explícitos e paginação no servidor |
| Proteção de acesso | `src/app/admin/(protected)/layout.tsx` usa `requireAdmin()`, que verifica sessão e `admin_users`; listagem usa `createSessionClient()` | **Base disponível**; E2 deve verificar `requireAdmin` novamente em cada Server Action e confiar na RLS para operações |
| Utilitários E1 | `src/lib/admin/listParams.ts`: `parsePage`, `parseSearchTerm`, `buildSearchOrFilter`, `pageRange`, `clampPage`, `buildListHref`; `src/components/admin/Pagination.tsx` presente | **Reaproveitáveis**, sem novo framework. Busca literal com `*` utiliza via `imatch`; executar os testes de regressão para as colunas de leads |
| Tipos | `Lead` em `src/lib/types/post.ts` contém 12 campos históricos, `ip_hash: string` não nulável | **Ajustar** conforme schema efetivo: `ip_hash` é nulável no esquema histórico; campos novos previstos ainda não existem no tipo |
| API de contato | `src/app/api/contact/route.ts`: `createServiceClient()` para `leads.insert`; SQL de E2 deve ser aditivo para preservar payload e notificação | **Compatibilidade prevista**, mas exigir regressão. Não alterar `/api/contact` na E2 |
| Auditoria | `src/lib/admin/auditLog.ts` chama `writeAdminAuditLog` pelo servidor; `auditLogSanitizer.ts` elimina chaves sensíveis conhecidas, mas **não é uma lista positiva de metadados sem PII** | **Atenção:** ações da E2 devem montar metadados estritamente por allowlist (`resource_id`, nomes de campos, motivo técnico), nunca enviar nome, email, telefone, `message`, notas ou próxima ação em texto |
| Admin security | `/admin/security` consulta `admin_audit_logs` via sessão; migration 013 ainda não aplicada em produção | Leitura de eventos administrativos depende de aplicação separadamente autorizada da 013 |
| Exclusão de lead | E2 prevê `delete().eq(...).select("id")` com sessão autenticada, confirmação literal `EXCLUIR` e sucesso somente com **1 linha** | Exigir teste negativo (0 linhas/erro), auditoria sem sucesso falso e verificação de `ON DELETE CASCADE` no isolado |

O SDD da E2 prevê status, próxima ação, arquivamento, notas imutáveis e histórico operacional em tabelas dedicadas, com triggers, proteção por RLS/privilégio de coluna e trava otimista por `updated_at` preservando **microssegundos**. Nada disso foi implantado ou testado nesta consulta.

## 3. Estado de banco e migrations (somente documentado)

| Dependência | Estado previamente documentado | Gate futuro |
|---|---|---|
| `012_leads_remove_anon_access.sql` (E0b.2) | Aplicada e verificada **no Supabase isolado** em 17/10/2026, segundo o operador; **não aplicada em produção** | `PV-20` ainda pendente: responsável deve confirmar inexistência de consumidores externos da chave `anon` para escrita em `leads`; executar preflight, revisão e autorização próprias antes de produção |
| `013_admin_audit_logs_admin_select.sql` (E0b.3) | Aplicada e verificada **no isolado**, segundo o operador; **não aplicada em produção** | Preflight comparando policies e **definições**, não apenas nomes, dos índices; revisão e autorização própria antes de produção |
| `014_posts_sort_at.sql` (E1) | Aplicada e verificada em produção em 21/10/2026 (9/9 declarados); E1 implantada | **Não reaplicar**; sem dependência de schema da E2 |
| Schema novo E2 | Ainda não existe migration E2 versionada no inventário consultado | Planejar migration **aditiva** independente para `leads`, `lead_notes`, `lead_activity`, constraints, triggers, RLS, privilégios, índices, preflight, verify e rollback |

**Limite:** o estado de produção das migrations 012/013 provém de evidência versionada, **não foi revalidado por query remota em 23/10/2026**. A aplicação em isolado da 012/013 não autoriza aplicar automaticamente em produção.

## 4. Gates técnicos específicos da E2

1. **Isolamento:** confirmar identidade do Supabase de teste por proteção anti-produção antes de qualquer integração; nunca usar o Preview Vercel para escrita administrativa (Preview compartilha recursos de produção).
2. **Pré-requisitos RLS:** verificar novamente 012/013 no **isolado** e reproduzir testes de permissão `anon` / `authenticated` não-admin / admin; executar suíte `BL-04`.
3. **`PV-06` / `PRP-01`:** demonstrar em integração que privilégios de `UPDATE` apenas nas colunas `status`, `next_action`, `next_action_at`, `archived_at` permitem o trigger escrever `updated_at` e `status_updated_at` sem conceder escrita direta dessas colunas ao admin.
4. **`PV-28` e concorrência:** demonstrar sequência dos triggers `BEFORE` e `AFTER`, normalização de `next_action`, não alteração de timestamps para no-op; conferir conflitos paralelos com `expectedUpdatedAt` como string opaca preservando microssegundos.
5. **Histórico íntegro:** validar `lead_activity` append-only, sem `INSERT` de API; caso função `SECURITY DEFINER` seja indispensável, restringir owner, `search_path` e permissões `EXECUTE`, sem RPC exposta e sem bypass indevido. Exigir testes de escrita direta negada.
6. **Dados pessoais:** campos sensíveis nunca entram em `admin_audit_logs`; evidenciar allowlist estrita, limpeza de fixtures, e compatibilidade do formulário de contato; observar os requisitos de exclusão e retenção.
7. **Migração segura:** criar artefatos distintos `apply/preflight/verify/rollback`, identificar o banco-alvo e obter **autorizações separadas por ambiente e por fase**; sem `db push` ou reaplicação automática. O rollback de tabelas de notas/histórico seria destrutivo se já usadas: só considerar após exportação e autorização.
8. **Regressão funcional:** unitários, integração RLS no isolado e E2E no isolado conforme `T-LEAD-U01..U09`, `T-LEAD-I01..I16` e `T-LEAD-E01..E05`; testes de ausência de resultado, conflito, validação negativa e falha de banco.

## 5. Ordem proposta para a próxima etapa, ainda sem autorização executiva

1. Planejar a E2 em uma **branch própria baseada na `main`**, preservando a trilha de tracking e `/api/contact`.
2. Elaborar implementação incremental e contratos de entrada/saída com critérios do PRD `RF-LEAD-01..11`, mantendo lista e detalhe separados das actions.
3. Projetar migration aditiva E2 e artefatos de contingência; validar SQL, RLS, triggers, grants e `PV-06/PV-28` no ambiente isolado **somente após autorização**.
4. Reexecutar testes em ambiente isolado e revisar evidências antes de propor integração; produção e migrations 012/013 exigem gates separados.
5. Nenhum merge/deploy da E2 fica autorizado por este documento.

## 6. Resultado

**Preflight estático E2: CONCLUÍDO.** Base de código e especificações identificadas; sem mudança técnica. **Próxima ação recomendada:** elaborar o plano de implementação da E2, com fases e testes, e submeter para autorização específica de execução.
