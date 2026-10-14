# SDD — CMS: listagem editorial do admin

**Data:** 2026-10-13
**Status:** Rascunho para revisão final de engenharia. **Sem autorização de implementação.**
**PRD:** `2026-10-13-admin-evolution-prd.md` · **Entrega:** E1 · **Requisitos:** RF-CMS-01 a RF-CMS-13

As especificações de esquema abaixo são **descritivas**, não scripts executáveis. Nenhuma migration foi criada.

## 1. Decisões aprovadas aplicáveis

DEC-01, DEC-02, DEC-04, DEC-05, DEC-06, DEC-09 (padrão de verificação), DEC-16, DEC-18, DEC-20. Definições no PRD §4.

## 2. Evidências verificadas

| ID | Evidência |
|---|---|
| EV-01 | `posts/page.tsx` seleciona `content` e todos os posts, ordena por `created_at`, mostra sempre `created_at` e engole erros (`catch { return [] }`). |
| EV-02 | `actions.ts`: `updatePost` define `published_at = null` se `status !== 'published'`; `deletePost` ignora o erro e audita sucesso. |
| EV-03 | `PublicationTab.tsx` tem inputs `published_at` e `updated_at`; a action não os lê (o objeto `raw` não os inclui). `PostFormRefactored.tsx` não foi lido por inteiro. |
| EV-04 | `PostStatus = draft \| scheduled \| published`; o CHECK remoto é o mesmo (sem `archived`, que a UI de lista ainda referencia). |
| EV-05 | O cron `publish-scheduled-posts` (`011_scheduled_publish_cron.sql`) faz `UPDATE … SET status='published', published_at = scheduled_publish_at WHERE status='scheduled' AND scheduled_publish_at IS NOT NULL AND scheduled_publish_at <= NOW()` a cada 5 minutos. |
| EV-06 | `src/lib/datetime.ts` converte entre `datetime-local` (Brasília, −03:00 fixo) e UTC. |
| EV-07 | `searchParams` é `Promise` no Next 16 (`node_modules/next/dist/docs`). |
| EV-08 | O remoto tem 18 posts (`list_tables`). Policies de `posts`: leitura pública de `published` e acesso total para admin (baseline 30/08). |

## 3. Premissas ainda não validadas

| ID | Premissa | Validação |
|---|---|---|
| PV-13 | Há posts com `published_at`/`scheduled_publish_at` nulos nos estados que os exigem. | Preflight de contagem (§12). |
| PV-14 | O cron não revalida o cache do blog. | Teste em ambiente isolado. |
| PV-15 | Ambiente Supabase isolado disponível. | DEP-01. |
| PV-17 | `ADD COLUMN … GENERATED … STORED` com expressão imutável é aceito pelo Postgres do projeto e o PostgREST expõe a coluna sem ajuste. | Teste de integração. |
| PV-18 | Nenhum código público faz `select('*')` de forma que a nova coluna cause efeito colateral. | Busca no código durante o plano; efeito esperado: nenhum. |

## 4. Arquitetura atual e proposta

### 4.1 Atual

Server Component `posts/page.tsx` → `createSessionClient()` → `select` sem `limit` → lista renderizada inteira. Erro vira lista vazia.

### 4.2 Proposta

```
/admin/posts?q&status&from&to&page&dir
        │
page.tsx (Server Component, await searchParams)
        │  parsePostListParams()          ← valida e normaliza (puro)
        │  listAdminPosts(params)         ← consulta paginada → {ok,…} | {ok:false}
        ▼
PostsFilterBar (form GET, sem JS obrigatório)
PostsList (grupos por mês) → PostRow (badge, data rotulada, anomalias, ações)
Pagination (compartilhado: CMS, Leads, Newsletter admin)
loading.tsx · error.tsx
```

Unidades e responsabilidades:

| Unidade | Faz | Depende de |
|---|---|---|
| `parsePostListParams` | transforma `searchParams` em parâmetros válidos | nada (puro) |
| `escapeSearchTerm` | escapa termo para `ilike` e para o filtro PostgREST | nada (puro) |
| `listAdminPosts` | consulta o Supabase e devolve itens, total e página | sessão admin, RLS |
| `groupByMonth` | agrupa itens por `YYYY-MM` em Brasília | `datetime.ts` |
| `validatePostSchedule` | decide se um agendamento é aceitável | nada (puro) |
| `Pagination` | navegação por links | nada |

Não há framework genérico de listagem (DEC-20). `Pagination`, o padrão de `parse…` e `escapeSearchTerm` são compartilhados com Leads e com o admin da Newsletter por terem três consumidores reais. **A E1 é quem os entrega**; E2 e E4 dependem dela para reutilizá-los (PRD §14).

## 5. Modelo de dados

### 5.1 Coluna `posts.sort_at` (DEC-04)

| Propriedade | Valor |
|---|---|
| Tipo | `timestamptz`, `NOT NULL` (garantido pela expressão) |
| Geração | `GENERATED ALWAYS AS (…) STORED` |
| Expressão | `CASE status WHEN 'published' THEN coalesce(published_at, created_at) WHEN 'scheduled' THEN coalesce(scheduled_publish_at, updated_at) ELSE updated_at END` |
| Imutável? | Sim (só `CASE`/`coalesce` sobre colunas da linha) |
| Índice | `(sort_at DESC, id DESC)` |
| Índices existentes | `posts_status_published_at` e os demais permanecem |

**Tabela de verdade**

| status | `published_at` | `scheduled_publish_at` | `sort_at` | Origem da data (`date_source`) | Anomalia sinalizada |
|---|---|---|---|---|---|
| published | preenchido | — | `published_at` | `published_at` | — |
| published | nulo | — | `created_at` | **`created_at`** (fallback) | "Publicado sem data de publicação" |
| scheduled | — | preenchido | `scheduled_publish_at` | `scheduled_publish_at` | "Agendamento vencido" se a data passou há mais de 15 min |
| scheduled | — | nulo | `updated_at` | **`updated_at`** (fallback) | "Agendado sem data: não será publicado" |
| draft | — | — | `updated_at` | `updated_at` | — |

`created_at` e `updated_at` são `NOT NULL` com default; portanto `sort_at` nunca é nulo.

**`date_source` é calculado na aplicação** a partir das colunas já selecionadas (mesma lógica da expressão, sem coluna nova no banco). Ele decide o rótulo exibido (§6.5): **uma data de fallback nunca aparece como data de publicação ou de agendamento** (RN-15).

**Efeitos**

- O motor `pg_cron` não é alterado: ao publicar, a linha é atualizada e a coluna gerada se recalcula.
- A coluna não é gravável. As actions atuais usam `...parsed.data`, que não inclui `sort_at`.
- Visibilidade pública: a policy de leitura pública só libera `status='published'`, cujo `sort_at` é a data de publicação já pública. Sem vazamento.
- Adicionar coluna gerada reescreve a tabela com bloqueio exclusivo breve; com 18 linhas o impacto é desprezível. Executar fora de horário de pico.

### 5.2 Rejeitado: view e RPC

Ver §14.

## 6. Interfaces e contratos

### 6.1 Parâmetros da URL

| Param | Regra | Padrão |
|---|---|---|
| `q` | trim; 2 a 80 caracteres; menor que 2 é ignorado | vazio |
| `status` | `draft` \| `scheduled` \| `published`; outro valor é ignorado | todos |
| `from`, `to` | `YYYY-MM-DD` válido; se `from > to`, ambos são ignorados e a página mostra aviso | vazio |
| `page` | inteiro ≥ 1; valor inválido vira 1; acima do total redireciona para a última | 1 |
| `dir` | `desc` \| `asc` | `desc` |

Tamanho de página: 20 (PRP-03).

### 6.2 `listAdminPosts`

Entrada: parâmetros normalizados.
Saída: `{ ok: true, items, total, page, pageSize, pageCount }` ou `{ ok: false, error: 'query_failed' }`.

Colunas selecionadas: `id, slug, title, status, published_at, scheduled_publish_at, created_at, updated_at, sort_at`. **Nunca `content`.** O resumo é consultado apenas no filtro, não selecionado.

Ordenação: `sort_at` na direção pedida, depois `id` na mesma direção.
Período: `sort_at >= início do dia 'from' em Brasília` e `sort_at < início do dia seguinte a 'to'`.
Contagem: `count: 'exact'` (escala atual de dezenas de linhas; reavaliar acima de alguns milhares).

### 6.3 Escape de busca (PRP-07)

1. Escapar `\`, `%` e `_` do termo para uso literal em `ilike`.
2. Montar o padrão `%termo%`.
3. Envolver o padrão em aspas duplas no filtro `or(title.ilike."…",slug.ilike."…",summary.ilike."…")`, escapando `\` e `"` conforme as regras de valor entre aspas do PostgREST.
4. Teste hostil obrigatório: `%`, `_`, `\`, `"`, `,`, `(`, `)`, `.`, `*`, `--`, espaços e Unicode.

Se o teste de integração mostrar qualquer interpretação indevida, a alternativa aprovada é uma RPC parametrizada (§14).

### 6.4 Agrupamento

`groupByMonth(items)` agrupa por `YYYY-MM` de `sort_at` em `America/Sao_Paulo`. O rótulo usa `Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })`. O agrupamento é feito sobre a página já ordenada. Um mês que cruza a fronteira de página repete o cabeçalho na página seguinte.

### 6.5 Rótulos de data pela origem real (`date_source`)

| `date_source` | Rótulo exibido |
|---|---|
| `published_at` | "Publicado em {sort_at}" |
| `scheduled_publish_at` | "Agendado para {sort_at}" |
| `updated_at` (rascunho) | "Atualizado em {sort_at}" |
| `created_at` (fallback de publicado sem `published_at`) | "Criado em {sort_at}" + aviso "Publicado sem data de publicação" |
| `updated_at` (fallback de agendado sem data) | "Atualizado em {sort_at}" + aviso "Agendado sem data: não será publicado" |

Os rótulos "Publicado em" e "Agendado para" só aparecem quando a data é de fato a de publicação ou de agendamento. A ordenação e o agrupamento continuam usando `sort_at` (a data efetiva, inclusive de fallback), mas o rótulo nunca afirma o que o dado não contém.

### 6.6 Estados da tela

| Estado | Condição | Exibição |
|---|---|---|
| Carregando | navegação em andamento | `loading.tsx` próprio de `/admin/posts` |
| Vazio sem filtro | `total = 0` sem `q`/`status`/`from`/`to` | convite a criar o primeiro post |
| Vazio com filtro | `total = 0` com algum filtro | "Nenhum post encontrado" e botão "Limpar filtros" |
| Erro | `ok: false` | `error.tsx`/bloco de erro com tentar novamente; **nunca** lista vazia |
| Normal | `total > 0` | grupos por mês, paginação |

### 6.7 Regra de data de agendamento (DEC-18)

`validatePostSchedule({ status, scheduledPublishAt, existing, now })` — função pura chamada por `createPost` e `updatePost` depois do Zod. Para `updatePost`, `existing` vem de uma leitura que passa a incluir `status` e `scheduled_publish_at` (a leitura de `status,published_at` já existe).

| Situação | Resultado |
|---|---|
| `status ≠ scheduled` | não se aplica |
| Criação com `scheduled`, data ausente | **erro**: "Informe a data do agendamento." |
| Criação com `scheduled`, data ≤ agora | **erro**: "A data de agendamento deve estar no futuro." |
| Atualização, post antes não agendado → `scheduled` | exige data presente e futura |
| Atualização, já `scheduled`, **data alterada** (incluindo apagar a data) | exige data presente e futura |
| Atualização, já `scheduled`, **data inalterada** (mesmo valor, mesmo se vencida ou nula legada) | **aceita**; não revalida |
| Atualização, `scheduled` → `published` ou `draft` | não se aplica |

"Futuro" = estritamente maior que o instante do servidor em UTC, comparando o valor convertido por `saoPauloInputToUtcIso`. Nenhuma tolerância adicional. Como o cron roda a cada 5 minutos, uma data próxima publica em até cerca de 10 minutos; isso é comportamento existente.

Registros históricos (agendado sem data, agendado vencido) **não são migrados nem alterados**; ficam sinalizados na lista (RF-CMS-13).

### 6.8 Campos de data do formulário (RF-CMS-12, DEC-06)

Na `PublicationTab`, `published_at` e `updated_at` deixam de ser `datetime-local` editáveis (EV-03: a action nunca os lê) e passam a ser **informação somente leitura**:

| Campo | Exibição |
|---|---|
| Publicado em | valor de `published_at` em Brasília; omitido enquanto o post nunca foi publicado |
| Atualizado em | valor de `updated_at` em Brasília; omitido na criação |
| Agendar publicação para | continua editável; sujeito à regra do §6.7 |

Nenhum input desses dois campos é enviado no `FormData`. O texto auxiliar antigo ("Atualizada automaticamente ao salvar") passa a descrever o comportamento real. Nenhuma mudança nas actions além do §6.7 e da verificação de exclusão (§9).

## 7. Segurança e autorização

- A listagem usa o cliente de sessão: a RLS de `posts` é a barreira. Não há `service_role` no módulo.
- Toda Server Action chama `requireAdmin()` (padrão existente); o layout não protege actions.
- `q` e demais parâmetros são entrada hostil: normalizados antes de qualquer uso e nunca interpolados fora do §6.3.
- Eventos de auditoria existentes de posts são mantidos; nenhum evento carrega conteúdo do post.
- Sem novos papéis, policies ou grants. Acesso `anon` a `posts` permanece restrito a `published`.

## 8. Integridade

- `sort_at` é derivada: não pode divergir das colunas-fonte.
- O desempate por `id` torna a paginação estável mesmo com `sort_at` repetido.
- Inserções concorrentes entre páginas podem deslocar itens; aceitável para listagem administrativa.
- A regra de data futura é validada no servidor; o `datetime-local` do cliente é só conveniência.

## 9. Falhas e recuperação

| Falha | Comportamento |
|---|---|
| Consulta falha | estado de erro com tentar novamente; `console.error` com contexto sem PII |
| Parâmetro inválido | normalizado ao padrão; nunca erro 500 |
| Página fora do alcance | redireciona para a última página |
| Exclusão retorna 0 linhas | mensagem de erro; **sem** evento `admin_post_deleted` |
| Exclusão retorna erro | evento `admin_post_delete_error`; sem sucesso |
| `sort_at` ausente (migration não aplicada) | `ok: false`; estado de erro, não crash |
| Escrita de auditoria falha | continua engolida por design; o resultado da operação não muda |

**Exclusão (RF-CMS-11):** `delete().eq('id', id).select('id')`; sucesso somente com exatamente 1 linha devolvida. Zero linhas é tratado como "não encontrado ou sem permissão".

## 10. Observabilidade

- Erro de listagem: `console.error` com `code` do Postgres e nomes de filtros usados, **sem** termo de busca nem conteúdo.
- Auditoria: `admin_post_deleted` só após verificação; `admin_post_delete_error` em falha.
- Anomalias de agendamento ficam visíveis na própria lista (RF-CMS-13).

## 11. Matriz de testes

### Unitários (`tests/unit`)

| ID | Teste | Requisito |
|---|---|---|
| T-CMS-U01 | `parsePostListParams`: padrões, valores inválidos, `from > to`, limites de `q` | RF-CMS-01..03 |
| T-CMS-U02 | `escapeSearchTerm` e montagem do filtro com entradas hostis | RF-CMS-01 |
| T-CMS-U03 | `groupByMonth` na virada de mês e às 23:30 −03:00 (UTC já no dia seguinte) | RF-CMS-03, 06 |
| T-CMS-U04 | `date_source` e rótulo por status e por fallback: publicado sem `published_at` mostra "Criado em", agendado sem data mostra "Atualizado em", nunca "Publicado em" nem "Agendado para" | RF-CMS-04 |
| T-CMS-U05 | `validatePostSchedule`: todas as linhas da tabela §6.7 | RF-CMS-10 |
| T-CMS-U06 | Resultado de exclusão: 0, 1 e erro mapeados corretamente | RF-CMS-11 |
| T-CMS-U07 | Clamp de página e cálculo de `pageCount` | RF-CMS-07 |
| T-CMS-U08 | Detecção de anomalias (três casos) | RF-CMS-13 |
| T-CMS-U09 | `PublicationTab` sem inputs editáveis de `published_at`/`updated_at` | RF-CMS-12 |

### Integração (ambiente Supabase isolado, DEC-16)

| ID | Teste | Requisito |
|---|---|---|
| T-CMS-I01 | `sort_at` conforme tabela §5.1, nunca nula, incluindo linhas legadas | RF-CMS-04 |
| T-CMS-I02 | Ordem determinística com `sort_at` idêntico | RF-CMS-05 |
| T-CMS-I03 | Busca com entradas hostis retorna só correspondências literais | RF-CMS-01 |
| T-CMS-I04 | Seleção da listagem não retorna `content` | RF-CMS-07 |
| T-CMS-I05 | Atualização feita pelo SQL do cron recalcula `sort_at` | RF-CMS-09 |
| T-CMS-I06 | RLS: `anon` lê só `published`; admin lê tudo; não-admin autenticado não lê rascunho | RF-CMS-09 |
| T-CMS-I07 | Escrita direta em `sort_at` é rejeitada | RF-CMS-04 |

### E2E (Playwright)

| ID | Teste | Requisito |
|---|---|---|
| T-CMS-E01 | Busca, filtro de status e período refletidos na URL | RF-CMS-01..03 |
| T-CMS-E02 | Paginação e cabeçalhos de mês | RF-CMS-06, 07 |
| T-CMS-E03 | Estados vazio, vazio filtrado e erro | RF-CMS-08 |
| T-CMS-E04 | Criar agendado com data passada é rejeitado; futuro é aceito | RF-CMS-10 |
| T-CMS-E05 | Regressão: criar, editar, preview, excluir | RF-CMS-09 |

## 12. Operação, migração e rollback

### 12.1 Migração (artefatos exigidos por RF-OPS-01)

| Artefato | Conteúdo |
|---|---|
| `preflight` (somente leitura) | colunas esperadas em `posts`; ausência prévia de `sort_at`; contagem de posts com datas nulas por status (PV-13); extensões e versão |
| `apply` (idempotente) | adicionar a coluna gerada e o índice, se ainda não existirem |
| `verify` | coluna existe e é gerada; sem valores nulos; índice presente; contagem de linhas inalterada |
| `rollback` | remover índice e coluna |

### 12.2 Ordem de implantação

1. Aplicar a migration no ambiente isolado e rodar T-CMS-I*.
2. Preflight e aplicação em produção, com autorização explícita.
3. Deploy do código.

### 12.3 Rollback

1. Reverter o deploy do código (a UI deixa de referenciar `sort_at`).
2. Só depois remover índice e coluna.

A ordem inversa quebraria a listagem. O rollback não afeta o cron nem os dados dos posts.

## 13. Dependências e bloqueios

| Item | Situação |
|---|---|
| DEP-01 ambiente isolado | necessário para T-CMS-I* |
| Início da E1 | depende só da E0a; não depende de E0b, E0c nem da branch de tracking |
| Entregas que dependem da E1 | E2 (Leads) e E4 (admin da Newsletter), pelos utilitários compartilhados |
| BL-04 suíte de RLS verde | bloqueia o merge da E1 |
| PRP-03 | aprovada |
| PRP-07 | **aprovada, condicionada aos testes** (T-CMS-U02, T-CMS-I03); se falharem, a alternativa é a RPC parametrizada |
| Bloqueios jurídicos | nenhum (sem dado pessoal) |

## 14. Alternativas descartadas

| Alternativa | Motivo |
|---|---|
| View com `security_invoker` | exige reproduzir RLS e acesso, adiciona objeto e não simplifica a consulta. |
| RPC de listagem | mais código SQL e menos legível; fica como contingência se o escape do filtro (§6.3) falhar nos testes. |
| Ordenar no cliente | contraria o requisito de paginação no servidor. |
| `date_trunc` por mês no banco | agrupar a página no servidor basta; contagem por mês fica como evolução futura. |
| Alterar a semântica de `published_at` | fora do escopo (DEC-05, DT-01). |
| Refatorar `createPost`/`updatePost` | fora do escopo (DEC-20). |
