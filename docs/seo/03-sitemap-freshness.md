# F-7 — `sitemap.xml` desatualizado (post publicado ausente)

**Status: F-7 — corrigido localmente, aguardando PR/deploy.**

Fase A (seções 1–10): diagnóstico causal. Fase B (seção 11): estratégia B
implementada — `force-dynamic` + falha explícita quando o banco falha.

| | |
|---|---|
| Data | 2026-09-29 |
| Base | `main` @ `9d74862` (PR #35) — deployment `dpl_5AwfRWRs5c6G6GQrCDpcfUtT3BvG`, criado 2026-09-29 11:40:51 UTC |
| Next.js | 16.3.3 · `cacheComponents` desligado (modelo tradicional de ISR) |
| Origem | auditoria pós-IDX-02 (`docs/seo/02`, seção 11, F-7) |

---

## 1. Evidência de origem

Em 2026-09-29 ~11:20 UTC: **16 posts publicados**, **15 no sitemap**. Ausente:
`/blog/o-que-e-agente-de-ia` (publicado 2026-09-28 17:00 UTC, 200, em `/blog`,
`index, follow`). O `sitemap.xml` respondia `x-vercel-cache: HIT` com `age`
≈ 83 000 s (~23 h) — gerado logo depois do deploy da PR #34
(2026-09-28 12:15 UTC) e nunca mais regenerado.

## 2. Arquitetura atual

- `src/app/sitemap.ts` — `export const revalidate = 60`; consulta
  `posts` (`status = published`, exclui `seo_index_status = noindex`) via
  `createPublicClient()` (`@supabase/supabase-js`, anon key, sem config de
  cache do Next). Se as duas consultas falharem, `getBlogRoutes()` devolve `[]`.
- **Admin** (`src/app/admin/(protected)/posts/actions.ts`) — `createPost`,
  `updatePost` e `deletePost` chamam `revalidatePath("/admin/posts")` e
  `revalidatePath("/blog")`. **Não** chamam `revalidatePath("/sitemap.xml")`.
- **Publicação agendada** — `supabase/migrations/011_scheduled_publish_cron.sql`:
  job pg_cron `publish-scheduled-posts` (`*/5 * * * *`, ativo) faz `UPDATE
  posts SET status='published'` direto no banco. **Não passa pelo Next**:
  nenhuma Server Action, nenhum `revalidatePath`.
- O post ausente foi publicado **por esse caminho**: `scheduled_publish_at`
  = `published_at` = 17:00:00, `updated_at` = 17:00:00.19.

## 3. Baseline de produção (depois da PR #35)

O deploy da PR #35 regenerou o sitemap: agora **26 URLs, 16 posts, post novo
presente**. Isso é **fresh-by-deploy**, não prova de que o ISR funciona.

**Sequência em `/sitemap.xml`** (sem seguir cache do cliente):

| Req | Hora (UTC) | x-vercel-cache | Age (s) | SHA-256 (16) | URLs | Posts |
|---:|---|---|---:|---|---:|---:|
| 1 | 11:49:05 | MISS | 0 | `e852c2127dd3ca5d` | 26 | 16 |
| 2 | 11:49:09 | HIT | 4 | `e852c2127dd3ca5d` | 26 | 16 |
| 3 | 11:50:15 | HIT | 69 | `e852c2127dd3ca5d` | 26 | 16 |
| 4 | 11:50:19 | HIT | 74 | `e852c2127dd3ca5d` | 26 | 16 |
| 5 | 11:51:25 | HIT | 139 | `e852c2127dd3ca5d` | 26 | 16 |
| 6 | 11:51:29 | HIT | 144 | `e852c2127dd3ca5d` | 26 | 16 |

Headers constantes: `Cache-Control: public, max-age=0, must-revalidate`,
`ETag: W/"1f5670f0…"`, `x-matched-path: /sitemap.xml`. Sem `CDN-Cache-Control`.
**Depois de 60 s não há `STALE`**: o `age` só cresce.

**Controles no mesmo deployment:**

| Rota | Sequência | Resultado |
|---|---|---|
| `/blog` (página, `revalidate = 60`) | PRERENDER → HIT (2 s) → **STALE (67 s)** → HIT (3 s) | ISR funciona |
| `/api/posts` (route handler, `revalidate = 60`) | PRERENDER → HIT (3 s) → **STALE (68 s)** → HIT (3 s) | ISR funciona |
| `/sitemap.xml` (metadata route, `revalidate = 60`) | MISS → HIT → HIT (69 s) → HIT (144 s) | **nunca regenera** |

**Runtime logs da Vercel** (deployment atual, última hora, só leitura):
`/blog` 4 e `/api/posts` 4 eventos (cache/função); **`/sitemap.xml`: nenhum
evento** — nem no `MISS`, nem depois de 60 s. O sitemap é entregue pela CDN
sem invocar função e sem ciclo de ISR.

## 4. Build local (`next build`)

- Saída do build: `○ /sitemap.xml  1m  1y`.
- `.next/prerender-manifest.json` → `/sitemap.xml`:
  `initialRevalidateSeconds: 60`, `initialExpireSeconds: 31536000`,
  `srcRoute: /sitemap.xml`, `compute: static`, cache tags
  `_N_T_/sitemap.xml/route`.
- `.next/server/app/sitemap.xml.body`: 26 URLs, 16 posts, post novo presente.

**`revalidate = 60` foi compilado** (resultado A da pergunta crítica).

**Runtime local** (`next start`, mesmo build): `/sitemap.xml` faz
STALE → HIT → (65 s) **STALE** → HIT, e cada regeneração dispara uma consulta
de rede real ao Supabase (`posts?select=slug,updated_at,seo_index_status&status=eq.published`,
medida com um logger de `fetch` pré-carregado). O Next honra o `revalidate` e
lê o banco atual.

## 5. Onde o post aparece e onde some

| Fonte | Posts | Post novo |
|---|---:|---|
| Supabase (read-only) | 16 publicados · 16 indexáveis | sim (`published`, `index`) |
| `sitemap()` executado (runtime local, regeneração) | 16 | sim |
| Build local (`sitemap.xml.body`) | 16 | sim |
| Produção antes da PR #35 (build de 2026-09-28 12:15) | 15 | **não** |
| Produção depois da PR #35 (build de 2026-09-29 11:40) | 16 | sim |

A consulta e o builder estão corretos. O post só faltava na **saída servida
pela Vercel**, congelada desde o build anterior à publicação.

## 6. Hipóteses

| Hipótese | Resultado | Evidência |
|---|---|---|
| **H1** — ISR por tempo funciona no sitemap | **Rejeitada em produção** (válida só no Next local) | nenhum `STALE` além de 60 s; nenhum evento de runtime; `age` de ~23 h no deployment anterior |
| **H2** — `revalidate` do source não é aplicado ao output servido | **Confirmada na camada Vercel**, não na compilação | manifest com 60 s; runtime local regenera; na Vercel o output se comporta como estático até o próximo deploy |
| **H3** — regenera, mas lê dado velho | **Rejeitada** | regeneração local faz consulta de rede ao Supabase; builder retorna 16 |
| **H4** — falta invalidação por evento | **Verdadeira, mas não é a causa dos 23 h** | admin não invalida `/sitemap.xml`; pg_cron não invalida nada. Com ISR funcionando, o atraso seria ≤ 60 s + 1 request |

## 7. Causa

**Causa principal (comprovada pelo comportamento):** na Vercel, `/sitemap.xml`
é servido como saída de build sem ciclo de ISR — `x-vercel-cache: HIT`
indefinido, sem `STALE`, sem invocação de função — apesar de o Next 16.3.3
compilar `revalidate = 60` para a rota e honrá-lo no runtime local. Na
prática o sitemap é **fresh-by-deploy**: só muda quando há deploy. O post
publicado às 17:00 ficou de fora até o deploy seguinte.

O mecanismo interno exato (como o builder da Vercel trata a metadata route
`sitemap.xml` com `revalidate`) **não foi determinado**: o output de build de
deployments via Git não é acessível pela API (404) e a documentação da Vercel
e do Next não descreve o caso. Registrado como comportamento observado,
reproduzível com a sequência da seção 3.

**Fragilidades adicionais:**

1. **Sem invalidação por evento** — admin revalida `/blog`, não `/sitemap.xml`.
2. **pg_cron fora do Next** — publicação agendada não dispara nenhuma
   invalidação; qualquer estratégia só com `revalidatePath` nas Server Actions
   deixa esse caminho descoberto.
3. **Falha do banco vira sitemap sem posts** — `getBlogRoutes()` devolve `[]`
   se as consultas falharem. Hoje isso seria congelado até o próximo deploy
   (build durante indisponibilidade do Supabase = sitemap sem os 16 posts).

## 8. Estratégias — decision gate

Caminhos que alteram indexabilidade e precisam ser cobertos: novo post
publicado, draft → published, scheduled → published (**pg_cron**),
published → draft, post deletado, `index` ↔ `noindex`, slug alterado.

| Estratégia | Freshness | Cobre admin | Cobre pg_cron | Dependência de request | Complexidade | Risco |
|---|---|---|---|---|---|---|
| **A** — manter `revalidate = 60` e "consertar" o ISR | depende de fazer a Vercel respeitar o ISR — causa não controlável pelo código | sim, se funcionar | sim, se funcionar | 1 request após expirar | **desconhecida** (sem mecanismo determinado) | alto: sem correção comprovada; pode voltar a congelar em silêncio |
| **B** — `export const dynamic = "force-dynamic"` | **imediata** (cada request lê o banco) | sim | **sim** (lê o estado atual; não precisa de callback) | toda request executa função + 1 consulta PostgREST | baixa (1 linha) | custo/latência por request (baixo: rota de crawler); Supabase fora do ar → sitemap sem posts **só naquela resposta** (hoje fica congelado); precisa decidir o comportamento em falha |
| **C** — `revalidatePath("/sitemap.xml")` nas Server Actions | imediata para o admin | sim | **não** | — | baixa | não resolve pg_cron; e só funciona se a Vercel tratar a rota como ISR (a mesma causa da A) |
| **D** — híbrida (ISR + `revalidatePath` + gatilho do cron) | imediata no admin; cron via webhook | sim | só com endpoint HTTP autenticado chamado pelo banco (`pg_net`) | — | alta (endpoint, segredo, rate limit, pg_net) | superfície de segurança nova; ainda depende do ISR da Vercel |

**Custo da B:** o volume de `/sitemap.xml` não aparece nos runtime logs (hoje
é entregue como estático); em site deste porte é tráfego de crawlers, da
ordem de dezenas de requests por dia. Cada request faria 1 consulta PostgREST
(16 linhas, 3 colunas). Não medido em produção — a latência real deve ser
medida na Fase B.

## 9. Recomendação (não implementada)

**Estratégia B — `force-dynamic` em `src/app/sitemap.ts`.** É a única que
(1) não depende do ISR da Vercel, cuja falha é a causa comprovada; (2) cobre o
pg_cron sem callback, endpoint ou segredo; (3) cobre todos os caminhos de
indexabilidade da seção 8 de uma vez, porque lê o estado atual a cada
request; e (4) é mínima. O custo é pequeno para uma rota de crawler.

Condição para a Fase B: definir o comportamento com o Supabase indisponível
(fragilidade 3) — por exemplo, responder erro (5xx) em vez de um sitemap sem
posts, para o crawler manter a versão anterior.

**Testes da futura implementação:** post publicado aparece; post `noindex`
não aparece; post despublicado não aparece; post novo aparece **sem rebuild**
(publicação via pg_cron incluída); falha do banco com comportamento definido;
e a verificação em produção de que duas requests seguidas retornam `MISS`/sem
cache de longa duração e o XML reflete o banco.

## 10. Fora do escopo

IDX-03 (`lastModified` fixo das páginas estáticas), IDX-04 (`llms*.txt` no
sitemap) e F-6 (ordem de relacionados) não foram alterados.

---

## 11. Fase B — implementação (2026-09-29)

Branch `fix/seo-sitemap-freshness`. Estratégia **B** aprovada no decision gate.

### 11.1 O que mudou

Só `src/app/sitemap.ts` (+15 −29):

- `export const revalidate = 60` → **`export const dynamic = "force-dynamic"`**.
  Sem `revalidate = 0`, sem `fetchCache`.
- `getBlogRoutes()` virou **uma consulta** (`posts`, `status = published`,
  colunas `slug,updated_at,seo_index_status`). Removidos a consulta de fallback
  e o `catch` externo que devolvia `[]`.
- **Fail-fast:** `error` do Supabase → `console.error` + `throw new Error("Failed
  to generate sitemap from published posts")`. Nenhum status HTTP codificado à
  mão — o 500 vem do próprio Next ao falhar a rota.
- **Consulta bem-sucedida com zero posts continua válida:** sitemap com as
  rotas estáticas.

Preservado sem alteração: filtro `noindex` (posts `nofollow` continuam no
sitemap), páginas estáticas com `lastModified` fixo (IDX-03), `llms*.txt`
(IDX-04), serviços/soluções, dedupe e ordenação, `createPublicClient()`.

**Fora do escopo, intocados:** Server Actions do admin (sem
`revalidatePath("/sitemap.xml")` — desnecessário com rota dinâmica),
`supabase/migrations/011_scheduled_publish_cron.sql`, `next.config.ts`,
`getRelatedPosts` (F-6).

### 11.2 Testes unitários

`tests/unit/seo/sitemapFreshness.test.ts` — 11 testes, com o cliente Supabase
mockado:

| Caso | Resultado |
|---|---|
| `dynamic === "force-dynamic"` | PASS |
| sem `revalidate` e sem `fetchCache` exportados | PASS |
| 16 posts publicados → 16 URLs | PASS |
| 1 consulta por geração, filtro `status=published` | PASS |
| post novo aparece na chamada seguinte, sem rebuild | PASS |
| post despublicado some na chamada seguinte | PASS |
| `noindex` fora | PASS |
| `nofollow` dentro | PASS |
| forma da entrada (`lastModified`, `weekly`, `0.7`) | PASS |
| erro do Supabase → rejeita, sem consulta de fallback | PASS |
| zero posts com sucesso → rotas estáticas, inclusive `/blog` | PASS |

Controle negativo: a mesma suíte contra o `sitemap.ts` do `HEAD` falha
exatamente 3 testes (dynamic, revalidate, erro). `sitemapMigration.test.ts`
continua verde.

### 11.3 Build

| | Antes (Fase A) | Depois |
|---|---|---|
| Saída do `next build` | `○ /sitemap.xml  1m  1y` | **`ƒ /sitemap.xml`** |
| `prerender-manifest.json` | rota com `initialRevalidateSeconds: 60` | rota **ausente** (nem em `routes`, nem em `dynamicRoutes`) |
| `.next/server/app/sitemap.xml.body` | existe | **não existe** |
| `app-paths-manifest.json` | — | `/sitemap.xml/route → app/sitemap.xml/route.js` |

### 11.4 HTTP local (`next start`)

8 requests seguidas:

- todas `200`, `cache-control: public, max-age=0, must-revalidate`, sem
  `x-nextjs-cache`;
- XML válido, 26 URLs, 16 posts;
- **1 consulta ao Supabase por request** (logger de `fetch` pré-carregado);
- corpo **byte a byte idêntico** ao baseline de produção (`e852c2127dd3ca5d`) —
  0 diferença de conteúdo.

Tempo: **min 46 ms · mediana 53 ms · max 256 ms** (o máximo é a primeira
request, a frio).

**Falha simulada** (harness de teste pré-carregado fora do código da
aplicação, que responde 503 para `/rest/v1/posts`; nenhuma flag de produção):
2 requests → **HTTP 500, corpo vazio, sem `<urlset>` nem `<loc>`**. Log do
servidor: `[sitemap] Failed to load published posts` e
`Error: Failed to generate sitemap from published posts`.

Não se afirma aqui como cada crawler trata o 500; a decisão é que uma falha
transitória explícita é preferível a um 200 com um sitemap sem posts.

**Regressão:** 24 páginas públicas comparadas (build local × produção) —
0 diferenças em status, title, canonical, robots/googlebot, OG/Twitter,
JSON-LD, H1 e texto. `/blog`, `/robots.txt` e o post novo respondem 200.
Nenhum outro módulo importa `src/app/sitemap.ts`.

### 11.5 Preview

**Não validado.** O Preview da Vercel é criado pelo push da branch; o escopo
desta execução proíbe push. Pendente para o ciclo de PR:

1. no Preview, duas requests seguidas a `/sitemap.xml` devem **não** retornar
   `HIT` com `age` crescente (esperado `MISS`/sem cache de longa duração) e
   gerar evento de função nos runtime logs;
2. XML com os 16 posts atuais;
3. depois do merge, repetir em produção e confirmar um post publicado pelo
   pg_cron aparecendo sem deploy.

### 11.6 Riscos residuais

- Custo: 1 invocação de função + 1 consulta PostgREST por request de sitemap
  (rota de crawler; volume baixo — medir em produção).
- Supabase indisponível → `/sitemap.xml` responde 500 **só enquanto durar a
  falha**; não há mais congelamento de um sitemap vazio.
- O mecanismo interno da Vercel que ignorava o ISR da metadata route segue não
  determinado (seção 7); a correção não depende dele.
