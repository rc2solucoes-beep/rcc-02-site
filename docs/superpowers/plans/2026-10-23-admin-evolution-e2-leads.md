# Plano de implementação — E2 | Gestão de Leads

**Data:** 23/10/2026  
**Estado:** Plano executivo para revisão e autorização da execução. **Nenhum código, SQL, integração, merge, deploy, dado ou infraestrutura é autorizado por este documento.**  
**Baseline da leitura:** `main` no commit `b19391ec811bee261089c574224d66a32e129fed` (merge da E1).  
**Documentação de base:** PRD `2026-10-13-admin-evolution-prd.md` §§6.3/14, SDD `2026-10-13-admin-leads-management-design.md` Parte II §§8–17, matriz de rastreabilidade e `docs/runbooks/evidence/E2-preflight-estatico-2026-10-23.md` (PR #42).

## 1. Resultado pretendido e limites

E2 transforma `/admin/leads` de leitura estática em **acompanhamento operacional básico** (não CRM), cobrindo integralmente `RF-LEAD-01..11`:

1. Listagem pesquisável e paginada no servidor com filtros por status, solução, arquivamento, período e ordenação.
2. Detalhe de lead com leitura dos dados de contato, status, próxima ação, notas e linha do tempo.
3. Cinco status: `new`, `in_review`, `contacted`, `qualified`, `closed`; leads existentes recebem `new`.
4. Notas internas append-only com autoria de sessão; atividade operacional separada, derivada de alterações reais por triggers.
5. Próxima ação com texto opcional (até 280 caracteres) e data opcional, com destaque para vencidas.
6. Arquivamento e restauração reversíveis, independentes do status.
7. Exclusão definitiva apenas após confirmar literalmente `EXCLUIR`, permitida para leads ativos e arquivados; conferir exatamente uma linha afetada antes de auditar sucesso.
8. Concorrência otimista sem perda dos microssegundos de `updated_at` e sem atualização artificial de timestamps em operações sem mudança.
9. RLS, privilégio por coluna, auditoria sem PII e compatibilidade com os leads históricos e `POST /api/contact`.
10. Rótulos de “contatos recebidos” no admin, sem tratar todo lead como “diagnóstico”.

**Fora do escopo:** funil CRM, integração Zapbox, atribuição de responsáveis, SLA, disparos, newsletter/E3, mudanças na identidade visual, modificação da rota de contato, tracking e refatoração ampla do admin. `PV-14`, hardening de Preview e incidente de credenciais permanecem na governança transversal, sem reabertura automática como dependência de implementação da E2.

## 2. Baseline e dependências

| Referência | Situação registrada | Implicação |
|---|---|---|
| E1/PR #40 | Mergeado em produção em 23/10/2026; utilitários `src/lib/admin/listParams.ts`, `Pagination.tsx` disponíveis | Reusar; não criar framework de listagem |
| E1/PR #41 | Registro documental separado em Draft | Não bloqueia o início técnico da E2 |
| E2/PR #42 | Preflight estático em Draft; branch documental | Acrescentar este plano ao mesmo PR; **não utilizar essa branch como branch de implementação** |
| `src/app/admin/(protected)/leads/page.tsx` | `select("*")`, sem filtros/paginação, erros engolidos como lista vazia | Substituir em etapa própria e testar estado de erro distinto |
| `src/app/admin/(protected)/layout.tsx` + `requireAdmin()` | Proteção de rota existente e sessão Supabase | Verificar autorização novamente em **cada Server Action**; operações pela sessão/RLS |
| `src/lib/types/post.ts` | `Lead` antigo com `ip_hash` não nulável | Modelagem tipada nova deve refletir `ip_hash: string | null` e as colunas novas; revisar usos |
| `012_leads_remove_anon_access.sql` (E0b.2) | Aplicada no isolado segundo operador; **não em produção** | `PV-20` e autorização própria antes de produção; nunca restaurar escrita pública no rollback |
| `013_admin_audit_logs_admin_select.sql` (E0b.3) | Aplicada no isolado segundo operador; **não em produção** | Preflight próprio e índices por definição; autorização distinta |
| Migration E2 | Não versionada no baseline | **Próxima numeração provável: 015**, sujeita a checagem da `main` na criação; não assumir número se houver avanço |
| Base de dados de produção | Não acessada neste plano | Divergências entre documentação e estado real exigem parar e revisar, não adaptar SQL às cegas |
| Preview Vercel | Compartilha Supabase e Blob com produção | **Proibidos testes administrativos de escrita no Preview**; testar escrita apenas no Supabase isolado controlado |

**Política de migrations:** prevalece `docs/runbooks/migrations-manuais.md`: aplicar isolado antes de produção, `preflight` e `verify` em transações `BEGIN READ ONLY`, revisão independente do SQL, autorizações explícitas por ambiente e fase e registro de execução. **Não usar** `supabase db push`, `db pull` ou `migration repair` neste projeto.

## 3. Organização de trabalho e artefatos previstos

**Branch técnica proposta:** `feat/admin-e2-leads`, criada **a partir da `main` vigente**, após preflight Git (branch, status limpo, SHA, outros PRs, tracking). Se já existir, inspecionar antes de alterar. PR de implementação específico e inicialmente Draft. Não reutilizar PR #40/#41/#42 como PR funcional. Qualquer mudança na `main` entre planejamento e execução requer avaliar conflitos e regressão.

| Área | Caminhos candidatos | Entrega |
|---|---|---|
| Esquema E2 | `supabase/migrations/015_leads_management.sql` (nome **provisório**, confirmar sequência) | Colunas aditivas, tabelas filhas, índices, constraints, policies, grants, triggers e funções |
| Runbook E2 | `docs/runbooks/migrations/015-leads-management/{README.md,preflight.sql,verify.sql,rollback.sql}` | Fonte única de aplicação, checks, autorizações e recuperação |
| Tipos/regras | `src/lib/admin/leadList.ts`, `src/lib/types/lead.ts` e validações de lead, ou nomes coesos equivalentes | Tipos, parse de filtros, normalização, estados, mapeamento sem PII |
| Consultas | `src/lib/admin/listAdminLeads.ts`, `src/lib/admin/getLeadDetail.ts` ou equivalentes | SELECT explícito, count exato, filtros, ordenação e paginação; resultado `ok/error` |
| Listagem | `src/app/admin/(protected)/leads/page.tsx`, componentes em `src/components/admin/leads/` | Filtros na URL, cards/tabela responsivos, estados normal/vazio/erro/loading, links |
| Detalhe | `src/app/admin/(protected)/leads/[id]/page.tsx` e componentes próprios | Detalhe, status, próxima ação, notas, atividade, arquivo/restauração, exclusão |
| Operações | `src/app/admin/(protected)/leads/actions.ts` ou módulo server-only equivalente | Server Actions restritas, Zod, RLS, lock otimista, confirmação de efeitos, auditoria |
| Testes | `tests/unit/admin/*Lead*.test.{ts,tsx}`, `tests/integration/rls/e2-leads.test.ts`, `tests/e2e/admin-leads.spec.ts` | Matriz SDD `T-LEAD-U*`, `T-LEAD-I*`, `T-LEAD-E*` |
| Evidências | `docs/runbooks/evidence/E2-*.md`, `docs/runbooks/migrations/REGISTRO.md` | Relatos sem segredos/PII, declaração da origem do resultado |

Os caminhos são uma **proposta de organização**, não instrução para criar tudo antecipadamente; confirmar convenções atuais antes de implementar. Não adicionar dependência externa nem abstração nova sem justificativa.

## 4. Fases de execução e gates

### F0 — Handoff técnico e autorizações

- Confirmar `main` atual, worktree limpo, branch de tracking preservada e a existência das pastas/arquivos antes de criar `feat/admin-e2-leads`.
- Vincular cada `RF-LEAD-01..11` à especificação, testes e fase abaixo; conferir divergências entre SDD e implementação real.
- Expor a diferença entre **autorização de escrever arquivos locais** e **autorização de executar SQL isolado**, SQL de produção, merge e deploy.
- Revisão humana/engenharia do plano e definição de aplicador/revisor de SQL; nenhuma dispensa usada na E1 é transferida automaticamente.
- **Saída:** autorização escrita e limitada para iniciar o trabalho local da E2; sem alteração em produção.

### F1 — Contrato de dados e migration aditiva (sem executar)

- Conferir schema histórico e dependências de `leads`: manter todas as colunas existentes e o contrato de `POST /api/contact`.
- Planejar em `leads`: `status text NOT NULL DEFAULT 'new'` com CHECK (cinco valores), `status_updated_at`, `next_action`, `next_action_at`, `archived_at`, `updated_at timestamptz NOT NULL DEFAULT now()`. Backfill implícito de `new`; nenhuma mudança de payload do formulário.
- `lead_notes`: `id`, `lead_id` FK `ON DELETE CASCADE`, `author_id` FK a `auth.users` com `ON DELETE SET NULL`, `body` 1–2000, `created_at`, índice por lead/data. Notas append-only.
- `lead_activity`: `id`, `lead_id` FK cascade, `actor_id` FK set-null, `kind` limitado a `status_changed`, `next_action_changed`, `archived`, `restored`, estados anterior/novo **apenas quando status muda**; sem conteúdo de nota ou próxima ação.
- Propor triggers na sequência do SDD: `leads_10_before_update` (normaliza e controla `status_updated_at`); `leads_20_set_updated_at` (reusa `update_updated_at()` existente, com `WHEN` de mudança real); `leads_30_activity` (histórico **AFTER UPDATE** em transação).
- Exigir confirmação da **ordem dos BEFORE, normalização e semântica de `WHEN`** por `T-LEAD-I15` (`PV-28`); se não corresponder ao SDD, interromper, redesenhar e aprovar ajuste antes de aplicar.
- Garantir `CHECK` e índices adequados sem suposições sobre DDL de produção. Preflight deve comparar **definição real** de função, triggers, constraints, policies, grants e índices; `IF NOT EXISTS` por nome não valida equivalência.
- Produzir `README`, `preflight.sql`, `verify.sql`, `rollback.sql`. Identificar locks, janela, cópia recuperável e risco de destruição das notas/histórico caso se considere rollback após uso.

**Gate F1:** análise/revisão do SQL independente, `preflight`/ `verify` READ ONLY e planos de restauração definidos. **Sem execução de SQL por simples conclusão da F1.**

### F2 — Modelo de autorização, RLS e integridade no isolado

- Garantir nenhuma permissão de `anon` sobre `leads`, `lead_notes` ou `lead_activity`; admin é usuário `authenticated` presente em `admin_users`; autenticado não-admin sem acesso.
- `leads`: `SELECT`, `UPDATE` operacional e `DELETE` somente para admin; **sem `INSERT` via sessão**; `UPDATE` em colunas permitidas `status`, `next_action`, `next_action_at`, `archived_at` (`PRP-01/PV-06`). Não conceder atualização direta de `updated_at` ou `status_updated_at`.
- `lead_notes`: admin `SELECT` e `INSERT` apenas com `author_id = auth.uid()`; revogar `UPDATE`/`DELETE` e demais privilégios perigosos; não-admin negado.
- `lead_activity`: somente SELECT admin; sem INSERT/UPDATE/DELETE por `authenticated`. A função interna do trigger poderá requerer `SECURITY DEFINER`; revisão específica de owner, `search_path` fixo, grants e exposição à API, com testes de abuso. Não usar `SECURITY DEFINER` para contornar erros sem análise.
- Revogar explicitamente `TRUNCATE`, `REFERENCES`, `TRIGGER` e demais privilégios não necessários, pois RLS não protege operações não sujeitas a políticas por linha.
- Executar isolado **somente após autorização específica**, validando identidade/allowlist/marcador e impedindo qualquer uso acidental da produção.
- `T-LEAD-I01..I16`, incluindo: usuário não-admin, privilégio de coluna, nota com autor falsificado, no-op sem `updated_at`, dois updates simultâneos, trigger `AFTER` obrigatório, cascade e dados históricos `new`.

**Gate F2:** matriz RLS/integração verde, sem falhas inconclusivas e com limpeza de fixtures sintéticas verificada. Falha de cleanup reprova o gate; não usar dados reais em testes.

### F3 — Consultas e listagem do admin

- Reusar funções de `listParams.ts` e `Pagination.tsx`; definir `parseLeadListParams`: `q` 2–80 chars; `status` (cinco valores); `solution` (opções atuais + histórico classificado como “Outros”); `archived=no|only|all`; `from/to` com limite diário de `America/Sao_Paulo`; `page`; `sort=recent|next_action`.
- Implementar `listAdminLeads` no servidor com `createSessionClient`, `select` explícito (sem `message` na lista, salvo definição explícita da necessidade de exibição; busca por `message` pode ser feita sem selecioná-la), count exato, `range` 20 e desempate por `id`.
- Ordenação `recent` por `created_at DESC,id DESC`; `next_action` por `next_action_at ASC NULLS LAST,id ASC`. Verificar comportamento real no PostgREST, especialmente `nullsFirst` e desempate.
- Escapar termo de busca com `buildSearchOrFilter` cobrindo caracteres hostis (`%, _, \\, *, "`, vírgula e parênteses) e testar busca literal em `name,company,email,message`. Revalidar comportamento de `*` no banco isolado.
- Evitar falha silenciosa: resposta estruturada `ok=false` para consulta que falha; UI distingue carregamento, erro, nenhuma linha e nenhum resultado filtrado; página > total redireciona à última sem perder filtros.
- Suportar responsividade e rótulos “contatos recebidos”; verificar acessibilidade e `audit:brand`.

**Gate F3:** T-LEAD-U04/U06/U07 e E01 no isolado; nenhuma consulta carrega todo o volume de leads sem limite.

### F4 — Detalhe e operações do lead

- Implementar `/admin/leads/[id]`: conteúdo de contato acessível **somente a admin**, timeline, status, próxima ação e notas. Não encontrado mostra estado explícito, sem sugerir lead vazio.
- Cada action: `requireAdmin()` -> Zod por lista positiva -> cliente de sessão com RLS -> verificação de exatamente uma linha afetada ou tratamento específico -> auditoria restrita -> `revalidatePath`.
- `updateLeadStatus`, `setLeadNextAction`, `archiveLead`, `restoreLead`: aceitar `expectedUpdatedAt` como texto opaco do PostgREST (`timestamptz` com microssegundos), comparar `WHERE id AND updated_at`, nunca converter por `Date`; diferença entre registro inexistente e conflito requer leitura adicional autorizada.
- Em no-op real (inclusive normalização), retornar `unchanged` **sem UPDATE, sem auditoria de mudança e sem avanço de timestamp**.
- `addLeadNote`: validar 1–2000 caracteres; `author_id` derivado da sessão, não do cliente; confirmar inserção efetiva antes do log; sem edição/exclusão de notas.
- `deleteLead`: exigir confirmação server-side igual a `EXCLUIR`, `delete().eq(id).select("id")` pela sessão, **exatamente uma linha** para sucesso e `admin_lead_deleted`; falhas e 0 linhas só geram falha. Testar cascade e concorrência com outras actions.
- Auditoria administrativa (`admin_lead_*`) **somente UUID, nomes de campos, motivo/código técnico**, nunca `name`, `email`, `whatsapp`, `message`, corpo da nota ou texto da próxima ação. Usar allowlist positiva no chamador; o sanitizador atual usa blacklist e não substitui essa restrição.

**Gate F4:** testes unitários de auth/validação/conflito/no-op/exclusão/auditoria e E2E de detalhe, arquivo, notas e exclusão no **isolado**.

### F5 — Regressão, revisão e homologação isolada

- Executar `npm run check` (typecheck + lint + unit), `npm run audit:brand`, `npm run test:integration` e `npm run test:e2e:isolated`, com guardas anti-produção ativos.
- Confirmar a matriz do SDD: T-LEAD-U01..U09; T-LEAD-I01..I16 (IDs previstos no SDD); T-LEAD-E01..E05.
- Verificar API de contato com testes **mockados/isolados**: inserção pela `service_role`, campos antigos preservados, notificação sem regressão; não enviar formulário real para produção.
- Inspecionar falhas de consultas, revalidação, logs sem PII, RLS, permissões e consistência de auditoria. Garantir que testes não deixem usuários/linhas de teste.
- Publicar evidências sem segredos e revisão de engenharia do diff e de SQL. Privilégios e semântica dos triggers exigem verificação funcional, não apenas lint.

**Gate F5:** PR técnico pode ser proposto para revisão. Ainda **não** autoriza merge, aplicação em produção nem Preview administrativo.

### F6 — Preparação de produção (gates separados)

1. **E0b.2 / migration 012:** confirmar `PV-20` por escrito sobre scripts/automações externas (inclusive n8n) antes de autorizar preflight e apply em produção. Nunca reabrir `leads_anon_insert` como rollback.
2. **E0b.3 / migration 013:** preflight dedicado (policies, grants, índices por definição), revisão e aplicação manual somente se autorizada. Evitar índice duplicado equivalente e registrar verify.
3. **E2 / migration nova:** preflight dedicado no projeto correto, conferir estado real de `leads` e DDL existente; revisão SQL, proteção de dados e plano de recuperação. **Aplicação manual após GO específico**, seguida de `verify`; não executar cópia genérica de SQL sem confrontar a produção.
4. Confirmar operações existentes do contato e admin em leitura; confirmar que o deploy do código somente ocorre **depois** do novo esquema validado.
5. Decisão expressa e **separada de merge/deploy** do PR funcional. Merge na `main` inicia deployment automático da Vercel.

**NO-GO:** `PV-20` sem confirmação para 012; divergência de DDL não tratada; falha RLS, privilégio por coluna ou concorrência; credenciais/alvo de teste não conferidos; ausência de revisão/aceite específico dos scripts; backup/recuperação inadequados; testes inconsistentes; ausência de autorização de aplicação/merge; logs com PII.

### F7 — Smoke tests não destrutivos em produção e encerramento

- Site público e `POST /api/contact` **sem submissão real de formulário** no smoke; validar via regressão isolada e sinais operacionais não destrutivos.
- Admin: carregar lista, filtrar, buscar, paginação e abrir detalhe existente, **sem editar dados reais**.
- Conferir leitura de histórico e estado de notas sem criar/excluir registros.
- Mudanças de status, nota, arquivo/restauração e exclusão **somente** após decisão separada sobre teste operacional controlado; os testes de escrita completos pertencem ao isolado.
- Monitorar erros e regressão de `/admin/security`, posts e dashboard; evidenciar resultado, responsável, data e eventual rollback.
- Fechar E2 somente com smoke aprovado e pendências residuais devidamente registradas.

## 5. Matriz resumida de cobertura

| Entrega técnica | Requisitos | Testes âncora |
|---|---|---|
| Busca/filtros/paginação | RF-LEAD-01 e RF-LEAD-11 | U04, U06, E01 |
| Detalhe, status e próxima ação | RF-LEAD-02,03,05 | U01, U07, E02, I07, I09 |
| Notas/autoria | RF-LEAD-04 | I02, I05, I10, E02 |
| Arquivamento/restauração | RF-LEAD-06 | I08, E03 |
| Exclusão e cascade | RF-LEAD-07 | U03, I04, I06, E04 |
| História operacional e auditoria | RF-LEAD-08 | U05, U08, I08, I11, I12, I13, I15 |
| Compatibilidade do contato | RF-LEAD-09 | I07, E05 e teste existente `leadsAnonCompat` |
| Concorrência/microssegundos | RF-LEAD-10 | U02, U09, I14 |
| Segurança transversal | RF-SEG-01, RF-SEG-02, BL-04 | E0b/012,013 e I01, I02, I03, I16 |

Os IDs completos estão no SDD; esta tabela não cria cobertura nova ou altera seus critérios de aceite.

## 6. Exceções, decisões pendentes e entrega do próximo executor

**Não presumir autorização:** este plano está no PR documental #42, em Draft. Aprovar **o plano** é diferente de autorizar **criar/editar código local**; e ambas são diferentes de autorizar SQL no isolado, SQL de produção, alteração de variáveis, merge e deploy.

Antes de implementar, o responsável deve escolher explicitamente: (a) iniciar F0/F1 e desenvolvimento local na branch técnica da E2, (b) manter execução SQL isolado sujeita a autorização pontual, e (c) manter 012/013 como processos separados. Não importar para E2 as dispensas e aceitações de risco exclusivas da E1.

**Handoff mínimo para Claude Code/agente local:** conferir HEAD atualizado da `main`, PRs abertos #41/#42, ausência de branch conflitante, leitura integral do SDD e deste plano; reportar preflight; trabalhar com commits pequenos e testes por fase; **não fazer push, merge, executar SQL, tocar no Supabase ou alterar Vercel** sem delegação específica. Não tocar em `fix/tracking-p0-foundation`, `/api/contact`, PR #39 ou secrets.

**Saída esperada deste documento:** plano técnico auditável, sem execução. A próxima ação após aprovação explícita é preparar a branch funcional e os artefatos F1 (código e SQL em arquivo, não aplicados), com checkpoint antes de qualquer acesso a banco.
