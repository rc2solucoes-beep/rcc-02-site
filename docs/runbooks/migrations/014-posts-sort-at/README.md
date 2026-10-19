# Migration 014 — `posts.sort_at` (data efetiva da listagem do CMS)

| Campo | Valor |
|---|---|
| Requisito(s) | RF-CMS-04, RF-CMS-05 (sustenta RF-CMS-03, 06, 07, 13) |
| Decisão(ões) | DEC-04, DEC-02 |
| Entrega | E1 |
| Arquivo de aplicação (`apply`) | `supabase/migrations/014_posts_sort_at.sql` (idempotente) |
| Depende de | `002` (tabela, trigger `posts_updated_at`), `add_blog_seo_fields.sql` (`scheduled_publish_at`, CHECK de status) |
| Janela e impacto | Reescrita da tabela com bloqueio exclusivo breve (18 posts no snapshot de 13/10). `lock_timeout` de 5 s. Fora do horário de pico |
| Risco | Baixo. Dado derivado; não altera dados, policies, cron nem a semântica de `published_at` |
| Quem aplica | A definir pelo responsável |
| Quem autoriza | Responsável pelo ambiente |

## Estado atual

**PREPARADA. NÃO APLICADA em nenhum ambiente** (nem isolado, nem produção). Nenhum SQL deste diretório foi executado.

## O que faz

Adiciona `posts.sort_at timestamptz GENERATED ALWAYS AS (…) STORED NOT NULL` e o índice `posts_sort_at_id_idx (sort_at DESC, id DESC)`.

| status | `sort_at` |
|---|---|
| published | `coalesce(published_at, created_at)` |
| scheduled | `coalesce(scheduled_publish_at, updated_at)` |
| draft | `updated_at` |

`NOT NULL` é explícito: o banco impõe a invariante que o SDD apenas presumia (D6). Ele só vale se `created_at` e `updated_at` forem `NOT NULL` no alvo; o preflight confere.

## Premissas que só o ambiente isolado confirma

| ID | Premissa | Como confirmar |
|---|---|---|
| PV-17 | `ADD COLUMN … GENERATED … STORED … NOT NULL` com expressão imutável é aceito e o PostgREST expõe a coluna sem ajuste | Aplicar no isolado, `verify.sql` e `tests/integration/rls/e1-posts-sort-at.test.ts` (T-CMS-I01, I07). Se a primeira consulta falhar com coluna inexistente (`PGRST204`), o cache de schema não recarregou: `NOTIFY pgrst, 'reload schema';` |
| PV-14 | O cron não revalida o cache do blog | Por leitura: o job é SQL puro e não chama o Next; as páginas do blog têm `revalidate = 60`. T-CMS-I05 confirma que o `UPDATE` do cron recalcula `sort_at` |
| D2 | Busca literal por filtro PostgREST, inclusive `*` | T-CMS-I03. Ver `DECISAO-D2.md` e `contingencia-rpc-busca.sql` |
| D3 | Página além do total devolve erro `PGRST103` (416) | T-CMS-I08 |

**PV-13** (posts com `published_at`/`scheduled_publish_at` nulos) só pode ser respondida no **preflight de produção**, porque o isolado não tem posts. **O preflight de produção NÃO está autorizado.** A pergunta não bloqueia a migration: só determina quantas anomalias a lista exibirá.

## Autorização (preencher antes de aplicar em cada ambiente)

| Ambiente | Autorizado por | Data | Observação |
|---|---|---|---|
| Isolado (teste) | | | Pendente |
| Produção | | | Pendente. Preflight de produção não autorizado |

## Ordem

1. `preflight.sql` (somente leitura, `BEGIN READ ONLY`) → estado esperado confirmado.
2. Revisão **humana** de `apply`, `preflight`, `verify` e `rollback` por um segundo engenheiro (o lint não basta).
3. `apply` no ambiente isolado → `verify.sql` → `npm run test:integration` (inclui `e1-posts-sort-at.test.ts`).
4. Autorização explícita → preflight de produção → `apply` → `verify.sql`.
5. **Deploy do código depois da migration.**
6. Registro em `migrations/REGISTRO.md` e evidências.

## Evidências

Nenhuma ainda.

## Reversão

**Segura e completa** (`rollback.sql`): remove o índice e a coluna; nada se perde porque o dado é derivado. **Ordem obrigatória: reverter o deploy do código primeiro**, senão a listagem do CMS cai no estado de erro. Ponto de não retorno: não há.
