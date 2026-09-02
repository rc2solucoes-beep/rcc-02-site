# Fase 6F — Migração de URLs legadas Zapbox → /zapbox — Implementation Plan

> Execute task-by-task. `AGENTS.md`, `PRODUCT.md`,
> `docs/19-fase-6-zapbox-handoff-decision.md` and
> `.agents/skills/rc2-site-migration/SKILL.md` govern this unit.

**Goal:** consolidar as URLs RC2 de intenção integralmente Zapbox na bridge
interna `/zapbox`, preservando o destino institucional, eliminando chains e
retirando do sitemap somente as sources que passam a redirecionar.

**Architecture:** permanent internal redirects (`308`) to `/zapbox`; bridge
remains indexable and self-canonical; no external redirect to zapbox.cloud.

**Baseline:** `main @ 1d48ffa` · Fase 6D publicada · Fase 6E publicada ·
`ZAPBOX_APEX_HOP_DEBT = CLOSED` · `CD-1 = BRIDGE_FIRST` ·
`CD-3 = CHANNEL_AND_OBJECT`.

---

## 1. Escopo — 4 canônicas + 1 alias

| # | Source | Tipo | Status hoje | Status futuro | Destino |
|---|---|---|---|---|---|
| 1 | `/servicos/automacoes-com-ia` | canônica | 200 | **308** | `/zapbox` |
| 2 | `/solucoes/atendimento-lento` | canônica | 200 | **308** | `/zapbox` |
| 3 | `/solucoes/leads-sem-resposta` | canônica | 200 | **308** | `/zapbox` |
| 4 | `/solucoes/whatsapp-desorganizado` | canônica | 200 | **308** | `/zapbox` |
| 5 | `/servicos/automacao-de-atendimento` | alias | 308 → `automacoes-com-ia` | **308** | `/zapbox` |

**Fora desta unidade, sem exceção:** `/solucoes-com-ia` (`SPLIT_INTENT`) ·
`/servicos/sites-e-landing-pages` (`KEEP`) · `/servicos/e-commerce`,
`/solucoes/processos-manuais`, `/solucoes/sistemas-desconectados`
(`NEEDS_SEO_DATA`) · Agenda Confirmada (`CD-2`) · `CD-4`.

---

## 2. Baseline HTTP

`OBSERVED` — medido em Production nesta tarefa.

| Source | Status | Location | Final | Hops |
|---|---|---|---|---|
| `/servicos/automacoes-com-ia` | **200** | — | própria | 0 |
| `/solucoes/atendimento-lento` | **200** | — | própria | 0 |
| `/solucoes/leads-sem-resposta` | **200** | — | própria | 0 |
| `/solucoes/whatsapp-desorganizado` | **200** | — | própria | 0 |
| `/servicos/automacao-de-atendimento` | **308** | `…/servicos/automacoes-com-ia` | `automacoes-com-ia` | 1 |

### 2.1 Trailing slash

`OBSERVED` — a normalização do framework roda **antes** de `redirects()`.

| Source com barra | Status | Destino da normalização | Hops totais |
|---|---|---|---|
| `/servicos/automacoes-com-ia/` | 308 | `/servicos/automacoes-com-ia` | 1 |
| `/solucoes/atendimento-lento/` | 308 | `/solucoes/atendimento-lento` | 1 |
| `/solucoes/leads-sem-resposta/` | 308 | `/solucoes/leads-sem-resposta` | 1 |
| `/solucoes/whatsapp-desorganizado/` | 308 | `/solucoes/whatsapp-desorganizado` | 1 |
| `/servicos/automacao-de-atendimento/` | 308 | `/servicos/automacao-de-atendimento` | **2** |

`INFERRED` — **`TRAILING_SLASH_NORMALIZATION_HOP`**: o alias com barra já custa
**2 saltos hoje**, antes desta unidade, e continuará custando 2 depois
(normalização → `/zapbox`). Não é regressão e **não** se corrige com middleware
(§15 do briefing). As quatro canônicas com barra permanecem em 1 salto de
normalização + 1 de redirect = 2, pela mesma razão estrutural.

O contrato de "1 salto" desta unidade vale para a **forma canônica sem barra**,
que é a indexada e a linkada.

### 2.2 Formato do `Location`

`OBSERVED` — o alias hoje devolve `Location` **absoluto**
(`https://www.rc2solucoes.com.br/servicos/automacoes-com-ia`), embora a regra em
`next.config.ts` declare destino relativo. O contrato semântico desta unidade é
**destino `/zapbox`**; o formato absoluto é o comportamento real do framework em
Production e **não** deve ser tratado como erro.

---

## 3. Baseline SEO das quatro canônicas

`OBSERVED`.

| Source | robots | canonical | Sitemap | Schema |
|---|---|---|---|---|
| `/servicos/automacoes-com-ia` | `index, follow` | self | **presente** | `Service`, `FAQPage`, `BreadcrumbList`, `WebPage`, +LocalBusiness/Organization globais |
| `/solucoes/atendimento-lento` | `index, follow` | self | **presente** | `FAQPage`, `BreadcrumbList`, `WebPage`, + globais |
| `/solucoes/leads-sem-resposta` | `index, follow` | self | **presente** | `FAQPage`, `BreadcrumbList`, `WebPage`, + globais |
| `/solucoes/whatsapp-desorganizado` | `index, follow` | self | **presente** | `FAQPage`, `BreadcrumbList`, `WebPage`, + globais |

**H1 e title** (`OBSERVED`):

| Source | H1 |
|---|---|
| `automacoes-com-ia` | "Automações com IA para atendimento, vendas e operação" |
| `atendimento-lento` | "Atendimento lento está fazendo sua empresa perder clientes?" |
| `leads-sem-resposta` | "Leads sem resposta estão virando vendas perdidas?" |
| `whatsapp-desorganizado` | "WhatsApp desorganizado está prejudicando seu atendimento e suas vendas?" |

---

## 4. Estabilidade de `/zapbox` — pré-condição

`OBSERVED`, medido nesta tarefa: HTTP **200** · canonical **self**
(`https://www.rc2solucoes.com.br/zapbox`) · robots **index** · **presente** no
sitemap · schema **WebPage** · **1 H1, 5 H2, 6 sections** · CTA
"Ir para o Zapbox" → `https://www.zapbox.cloud/` · analytics
`zapbox_bridge` / `ir_para_zapbox` **intacto** · **5 links internos** vigentes
(Home ×2, Footer ×1, `/solucoes` ×2).

`INFERRED` — a bridge está estável. A migração pode começar.

---

## 5. Matriz de equivalência

`OBSERVED` + `INFERRED`. Blocos classificados contra o conteúdo publicado de
`/zapbox` (`docs/20` §3).

| Bloco | `automacoes-com-ia` | `atendimento-lento` | `leads-sem-resposta` | `whatsapp-desorganizado` |
|---|---|---|---|---|
| **Intent** | atendimento/vendas por WhatsApp com IA | atendimento lento | leads sem resposta | WhatsApp desorganizado |
| Intent → `/zapbox` | `COVERED` | `COVERED` | `COVERED` | `COVERED` |
| **Entity** (produto/canal) | `ROUTED` | `ROUTED` | `ROUTED` | `ROUTED` |
| **CTA** | `ROUTED` | `ROUTED` | `ROUTED` | `ROUTED` |
| **Claims** | `COVERED` | `COVERED` | `COVERED` | `COVERED` |
| **FAQ** | `OBSOLETE` (5 perguntas) | `OBSOLETE` (3) | `OBSOLETE` (3) | `OBSOLETE` (3) |
| **Conflicting** | nenhum | nenhum | nenhum | nenhum |

**Por que `COVERED` e não `UNIQUE_AND_REQUIRED`:** as quatro páginas descrevem
conversa, atendimento, lead, CRM e IA sobre conversa. Pelo critério de `CD-3`
(objeto principal do trabalho), esse é território **Zapbox**, e `/zapbox`
publica exatamente esse recorte — `ZAPBOX_TERRITORY` (5 itens) cobre equipe no
mesmo número, pipeline, CRM ligado ao atendimento, Sales AI e automações do
fluxo.

**A pergunta que exigia verificação** — "É possível integrar a automação com
WhatsApp e CRM?" (`automacoes-com-ia`) — toca a **fronteira compartilhada**, não
o produto puro. `/zapbox` publica `ZAPBOX_SHARED_BOUNDARY`, que declara
integração entre Zapbox e demais sistemas como trabalho da RC2 quando
contratada. **Coberto.** Nenhum conteúdo fica sem destino coerente.

**Consequência registrada, sem número:** as quatro sources hoje são elegíveis a
rich result de FAQ; `/zapbox` não publica `FAQPage`. Classificação:
**`FAQ_RICH_RESULT_ELIGIBILITY_ENDS`**. Não é blocker — é consequência aceita da
decisão de território, e a bridge foi desenhada para rotear, não para vender
(`docs/20` §3). Nenhuma estimativa de impacto é feita aqui.

**Blockers de equivalência: nenhum.**

---

## 6. Auditoria de `next.config.ts`

`OBSERVED` — regras atuais relacionadas às cinco sources.

| Regra atual | Classificação |
|---|---|
| `/servicos/automacao-de-atendimento` → `/servicos/automacoes-com-ia` | **`REPOINT`** → `/zapbox` |
| *(nenhuma para as 4 canônicas)* | **`ADD`** ×4 |
| `/servicos/agentes-de-ia` → `/solucoes#ia-para-operacoes` | `PRESERVE` |
| `/servicos/automacao-de-processos` → `/solucoes#automacao-de-processos` | `PRESERVE` |
| `/servicos/operacoes-digitais` → `/solucoes#operacoes-digitais-commerce` | `PRESERVE` |
| `/servicos/integracao-de-sistemas` → `/solucoes#integracao-de-sistemas` | `PRESERVE` |
| `/services` → `/solucoes` · `/services/` → `/servicos` | `PRESERVE` |
| `/about`, `/about/`, `/index.htm` | `PRESERVE` |
| apex → `www` (`/:path*` com `has: host`) | `PRESERVE` |

**`REMOVE_DEAD_RULE`: nenhuma.** Nenhuma regra fica órfã.

### 6.1 Ordem e shadowing

`OBSERVED` — **não existe** regra genérica `/servicos/:slug` ou `/solucoes/:slug`.
A única regra com wildcard é a de apex (`/:path*`), condicionada por
`has: [{ type: "host" }]`, que só dispara no host apex e apenas troca de host,
preservando o path — não captura nem encurta nenhuma das cinco.

`INFERRED` — as cinco regras podem ser adicionadas junto às demais sem risco de
shadowing. **Regra de ordenação adotada:** o alias `automacao-de-atendimento`
fica **imediatamente antes** da regra de `automacoes-com-ia`, ambos apontando a
`/zapbox`, para que a leitura do arquivo torne óbvio que não há chain.

---

## 7. Chain zero — o alias

`OBSERVED` — hoje: `alias → /servicos/automacoes-com-ia` (1 salto), e a página
final responde 200.

Se apenas as quatro canônicas migrassem, o alias produziria:

```
alias → /servicos/automacoes-com-ia → /zapbox     (2 saltos — PROIBIDO)
```

`INFERRED` — **o alias é repontado para `/zapbox` na mesma unidade**, não
depois. Resultado: **1 salto**, mesmo contrato das quatro canônicas.

---

## 8. Tipo de redirect

`permanent: true` → **308** no Next.js.

Justificativa: mudança estrutural permanente · destino equivalente no mesmo
domínio · bridge publicada e estável · links internos institucionais já migrados
na 6E · reversibilidade por código preservada.

**`PERMANENT_REDIRECT_EXTERNAL_CACHE_RISK`** — registrado mesmo sendo redirect
interno: navegador, crawler e CDN podem memorizar um 308. Ver §17 e §18.

**Proibido nesta unidade:** `301`, `302`, `307`, e qualquer solução de
`200 + canonical apontando para /zapbox` como substituto do redirect.

---

## 9. Sitemap

`OBSERVED` — baseline **30 URLs**. As quatro canônicas estão **todas
presentes**; o alias está **ausente** (correto).

`INFERRED` — contagem futura **REAL: 26 URLs** (30 − 4). `/zapbox` permanece.

### 9.1 Como as URLs entram hoje

`OBSERVED` — `src/app/sitemap.ts`:

- `serviceRoutes` mapeia `services` e **já filtra** por
  `MIGRATED_SERVICE_SLUGS = new Set(["agentes-de-ia", "automacao-de-processos"])`;
- `solutionRoutes` mapeia `solutions` **sem filtro nenhum**.

`INFERRED` — reusar o padrão da migração SAFE_NOW: acrescentar
`"automacoes-com-ia"` ao set de serviços e **criar** o set equivalente para
soluções. **Nenhum objeto é removido** de `services.ts` ou `solutions.ts` — as
coleções seguem alimentando `/servicos`, `/servicos/[slug]`, `/solucoes/[slug]`
e conteúdo relacionado.

### 9.2 Regra de simultaneidade

Uma source **sai do sitemap na mesma unidade** em que passa a redirecionar.
Nunca publicar URL que redireciona e continua listada.

---

## 10. Duplicação da constante — decisão

`OBSERVED` — `MIGRATED_SERVICE_SLUGS` está **duplicada**, com o mesmo valor, em
dois arquivos: `src/app/sitemap.ts:114` e
`src/app/(public)/servicos/[slug]/page.tsx:22`.

`INFERRED` — esta unidade acrescenta um slug de serviço **e** um conjunto novo de
soluções. Mantida a duplicação, seriam **4 constantes em 3 arquivos**, e uma
divergência entre elas produziria exatamente a falha que §9.2 e §12 proíbem — um
slug fora do sitemap mas ainda em prev/next, ou o inverso.

**Decisão: centralizar em `src/lib/content/migratedRoutes.ts`**, exportando
`MIGRATED_SERVICE_SLUGS` e `MIGRATED_SOLUTION_SLUGS`, e importar nos
consumidores. É a única alteração estrutural desta unidade, e existe para
impedir drift, não por estética.

---

## 11. `services.ts` / `solutions.ts` — consumidores

`OBSERVED` — consumidores das coleções: `servicos/page.tsx`,
`servicos/[slug]/page.tsx`, `solucoes/[slug]/page.tsx`, `sitemap.ts`,
`llms-full.txt/route.ts`, `solucoesPage.ts` (não referencia as migradas) e testes.

### 11.1 Referências às URLs migradas

`OBSERVED` — `solutions.ts` referencia `/servicos/automacoes-com-ia` **6 vezes**,
e **todas as seis vivem dentro das três soluções que também migram**:

| Linha | Solução dona | Campo |
|---|---|---|
| 85 | `atendimento-lento` | `relatedServices` |
| 122 | `atendimento-lento` | `relatedLinks` |
| 178 | `leads-sem-resposta` | `relatedServices` |
| 222 | `leads-sem-resposta` | `relatedLinks` |
| 475 | `whatsapp-desorganizado` | `relatedServices` |
| 518 | `whatsapp-desorganizado` | `relatedLinks` |

As duas soluções sobreviventes — `processos-manuais` e
`sistemas-desconectados` — **não referenciam nenhuma URL migrada**.

`INFERRED` — **`solutions.ts` = `PRESERVE_DATA`, zero edição.** Páginas que
redirecionam não renderizam; seus links relacionados nunca chegam ao usuário.

`OBSERVED` — `services.ts` referencia `/servicos/automacoes-com-ia` **3 vezes**:

| Linha | Service dono | Estado do dono | Classificação |
|---|---|---|---|
| 248 | `agentes-de-ia` | já redireciona (Fase 5) | `PRESERVE_DATA` |
| 361 | `automacao-de-processos` | já redireciona (Fase 5) | `PRESERVE_DATA` |
| **589** | **`sites-e-landing-pages`** | **200, `KEEP`** | **`REPOINT_HREF`** → `/zapbox` |

`INFERRED` — apenas a **linha 589** exige edição: é uma página que continua
renderizando e que passaria a linkar para uma URL que redireciona.

---

## 12. `relatedServices[].href` — a armadilha, verificada

`OBSERVED` — `src/app/(public)/servicos/[slug]/page.tsx:62-63`:

```ts
const relatedSolution = solutions.find((solution) =>
  solution.relatedServices.some((relatedService) => relatedService.href === `/servicos/${slug}`)
);
```

O campo `href` funciona como **chave de lookup reverso**. Resolução atual:

| Página de serviço | `relatedSolution` resolvida | Estado futuro |
|---|---|---|
| `/servicos/automacoes-com-ia` | `atendimento-lento` | irrelevante — a página redireciona |
| `/servicos/agentes-de-ia` | nenhuma | — |
| `/servicos/automacao-de-processos` | nenhuma | — |
| `/servicos/e-commerce` | `sistemas-desconectados` | **ok**, sobrevivente |
| **`/servicos/sites-e-landing-pages`** | **`leads-sem-resposta`** | **quebra §21** |

`INFERRED` — `/servicos/sites-e-landing-pages` é `KEEP`, continua 200, e hoje
renderiza um card apontando para `/solucoes/leads-sem-resposta`, que passará a
redirecionar. Sem correção, cria-se exatamente
`RC2 page → legacy redirect → /zapbox`.

**Correção: `FILTER_FROM_NAV_SEQUENCE`** — o lookup passa a ignorar soluções
migradas:

```ts
const relatedSolution = solutions.find(
  (solution) =>
    !MIGRATED_SOLUTION_SLUGS.has(solution.slug) &&
    solution.relatedServices.some((rs) => rs.href === `/servicos/${slug}`)
);
```

**Teste-guarda obrigatório ANTES da edição** (Task 2): provar que
`/servicos/e-commerce` **mantém** o bloco relacionado (`sistemas-desconectados`)
e que `/servicos/sites-e-landing-pages` **deixa de exibir** destino que
redireciona — sem que o bloco desapareça por acidente em outras páginas.

---

## 13. prev/next

`OBSERVED` — `servicos/[slug]/page.tsx:55-61` já filtra por
`MIGRATED_SERVICE_SLUGS` antes de calcular `prev`/`next` (padrão `docs/16` §10).
`solucoes/[slug]/page.tsx` **não tem** navegação sequencial.

`INFERRED` — basta que `automacoes-com-ia` entre no set compartilhado: o filtro
existente passa a excluí-lo automaticamente. Nenhuma página 200 apontará em
prev/next para URL que redireciona.

---

## 14. Hub `/servicos`

`OBSERVED` — `servicos/page.tsx` mapeia **todos** os serviços e resolve o href do
card por `MIGRATED_SERVICE_HREFS[service.slug] ?? "/servicos/${slug}"` — o padrão
de reaponte direto já criado na Fase 5.

`INFERRED` — **opção A**: acrescentar `"automacoes-com-ia": "/zapbox"` ao mapa. O
card continua existindo (o serviço segue sendo oferta real da RC2 no hub) e passa
a levar direto à bridge, sem salto.

**`/servicos` não é redirecionado nesta unidade** e continua 200.

---

## 15. Links internos — inventário

`OBSERVED` — classificação de todas as ocorrências das cinco sources.

| Local | Classificação | Ação |
|---|---|---|
| `services.ts:589` (`sites-e-landing-pages`) | `EXECUTABLE_RUNTIME` | **`REPOINT_HREF`** → `/zapbox` |
| `servicos/page.tsx` (hub, card) | `EXECUTABLE_RUNTIME` | **`REPOINT_HREF`** via `MIGRATED_SERVICE_HREFS` |
| `servicos/[slug]/page.tsx:62` (lookup reverso) | `EXECUTABLE_RUNTIME` | **`FILTER_FROM_NAV_SEQUENCE`** |
| `services.ts:248`, `:361` | `EXECUTABLE_RUNTIME` em página que já redireciona | `PRESERVE_DATA` |
| `solutions.ts` ×6 | `EXECUTABLE_RUNTIME` em páginas que passam a redirecionar | `PRESERVE_DATA` |
| `llms-full.txt/route.ts` | `EXECUTABLE_RUNTIME` (discovery) | **filtrar** — ver §16 |
| `tests/unit/seo/*.ts`, `tests/e2e/*.spec.ts` | `TEST_EXPECTATION` | converter — §19 |
| `docs/08`, `docs/09`, `docs/brand/MIGRACAO.md`, `docs/SOLUTIONS_PAGES_GUIDE.md`, `docs/superpowers/plans/*` | `HISTORICAL_DOCUMENTATION` | **não alterar** |

`OBSERVED` — `src/app/llms.txt/route.ts` **não menciona** nenhuma das cinco:
**`LLMS_NO_CHANGE`**.

---

## 16. `llms-full.txt` — dívida pré-existente

`OBSERVED` — `llms-full.txt/route.ts` itera `services` e `solutions` **sem
filtro** e publica `URL: …/servicos/{slug}`. Em Production isso já publica as
**2 URLs migradas na Fase 5** (`agentes-de-ia`, `automacao-de-processos`) e
publicaria as 4 desta unidade.

`INFERRED` — **`LLMS_FULL_MIGRATED_URL_DEBT`**: dívida **pré-existente**, não
criada aqui. A 6F aplica o mesmo filtro compartilhado, o que impede a unidade de
**acrescentar** 4 URLs redirecionando a uma superfície de descoberta e, como
efeito colateral, **resolve as 2 antigas**. Custo: uma linha por coleção.

Se essa limpeza incidental não for desejada, a alternativa é filtrar apenas as 4
novas — mas isso exigiria dois conjuntos divergentes, contrariando §10. **A
recomendação é aplicar o filtro compartilhado.**

---

## 17. Canonical, robots, analytics

**Canonical** — as sources deixam de renderizar; não haverá mais canonical nelas.
`/zapbox` mantém self-canonical. Proibido substituir redirect por
`200 + canonical`.

**Robots** — `ROBOTS_NO_CHANGE`. Nenhuma das cinco é bloqueada: o crawler
**precisa** acessar o redirect para processá-lo.

**Analytics** — `SOURCE_PAGE_SERIES_ENDED_BY_REDIRECT`. As páginas deixam de
emitir eventos próprios (`service_related_links`, `solution_related_services`,
`solution_related_links` e demais locations dessas superfícies). Esses
identificadores **não podem ser reutilizados** em `/zapbox`. Nenhum evento é
criado no redirect — não há página renderizada para medir. O funil segue medido
em `superfícies internas → /zapbox → produto`, e
`zapbox_bridge` / `ir_para_zapbox` permanece intacto.

---

## 18. Search Console e backlinks

`INFERRED` — a decisão de destino já está fechada por `CD-3`: não existe destino
alternativo entre o qual escolher. Dado do Search Console pode informar
**quando** migrar e o que monitorar, mas não muda **para onde**. Por isso, para
esta unidade — redirect **interno**, mesmo domínio, destino indexável — o dado é
informativo, não bloqueante:

| Source | Classificação |
|---|---|
| `/servicos/automacoes-com-ia` | **`SEARCH_CONSOLE_RECOMMENDED`** — é a mais rica em schema (`Service` + `FAQPage`) e o ativo orgânico mais provável do grupo |
| `/solucoes/atendimento-lento` | `NO_DATA_REQUIRED` |
| `/solucoes/leads-sem-resposta` | `NO_DATA_REQUIRED` |
| `/solucoes/whatsapp-desorganizado` | `NO_DATA_REQUIRED` |
| `/servicos/automacao-de-atendimento` | `NO_DATA_REQUIRED` — alias, já redireciona |

**Backlinks** — o redirect preserva o domínio, então sinal externo apontando às
sources continua chegando à RC2 e é repassado à bridge. Registrado como risco
observável apenas para `automacoes-com-ia`, pela mesma razão acima.
**Não se afirma aqui a ausência de backlinks** — não há fonte para isso.

---

## 19. Testes

`OBSERVED` — arquivos afetados e o padrão já existente em cada um.

| Arquivo | Situação | Conversão |
|---|---|---|
| `tests/unit/seo/redirects.test.ts` | as 4 estão na lista "NÃO recebe redirect" (linhas 63-72); alias afirma destino `automacoes-com-ia` (l. 57-59) | **remover as 4 da lista negativa**, criar asserções positivas, **repontar a asserção do alias** para `/zapbox` |
| `tests/unit/seo/sitemapMigration.test.ts` | lista aliases ausentes do sitemap | acrescentar as **4** como ausentes |
| `tests/unit/seo/internalLinks.test.ts` | lista de aliases proibidos como destino de link | acrescentar as **4** |
| `tests/e2e/services.spec.ts` | `automacoes-com-ia` está em `RENDERED_SLUGS` (l. 17) | **mover** para `REDIRECTED_SLUGS` com destino `/zapbox` — padrão já existente no arquivo |
| `tests/e2e/personality-copy.spec.ts:67` | navega para `/solucoes/atendimento-lento` | trocar por solução **sobrevivente** (`/solucoes/processos-manuais`), preservando a asserção de CTA |
| `tests/unit/services.test.ts`, `services/sitesLandingTerminology.test.ts`, `services/zapboxTerritoryTerminology.test.ts`, `zapbox/zapboxBridgeSitemap.test.ts` | tocam os slugs | **auditar na Task 2**; converter só o que quebrar, sem apagar cobertura |

**Nenhuma cobertura é removida.** Expectativa de *página renderizada* vira
expectativa de *contrato de redirect*.

---

## 20. Arquivos planejados

| Arquivo | Ação |
|---|---|
| `src/lib/content/migratedRoutes.ts` | **CREATE** — sets compartilhados (§10) |
| `next.config.ts` | MODIFY — `ADD` ×4, `REPOINT` ×1 |
| `src/app/sitemap.ts` | MODIFY — importar sets; filtrar `solutionRoutes` |
| `src/app/(public)/servicos/[slug]/page.tsx` | MODIFY — importar set; filtrar lookup reverso |
| `src/app/(public)/servicos/page.tsx` | MODIFY — `MIGRATED_SERVICE_HREFS` |
| `src/lib/content/services.ts` | MODIFY — **só a linha 589** |
| `src/app/llms-full.txt/route.ts` | MODIFY — filtro (§16) |
| `tests/unit/seo/redirects.test.ts` | TEST |
| `tests/unit/seo/sitemapMigration.test.ts` | TEST |
| `tests/unit/seo/internalLinks.test.ts` | TEST |
| `tests/unit/seo/zapboxUrlMigration.test.ts` | **CREATE** — contrato agregado |
| `tests/e2e/services.spec.ts` | TEST |
| `tests/e2e/personality-copy.spec.ts` | TEST |
| `tests/e2e/zapbox-url-migration.spec.ts` | **CREATE** — redirects + negativas |

**`src/lib/content/solutions.ts` NÃO é alterado** (§11.1).

### 20.1 Negative file gates

Zero alteração em: `AGENTS.md` · `PRODUCT.md` · Home (`page.tsx`, `home.ts`) ·
`Footer.tsx` · `Header.tsx` · `navigation.ts` · `zapbox/page.tsx` ·
`zapboxBridge.ts` · `contato/` · `solucoes-com-ia/` · `solucoes/[slug]/page.tsx`
· `solutions.ts` · `tracking.ts` · `TrackedLink.tsx` · `robots.ts` ·
`llms.txt/route.ts` · `package*.json` · `supabase/` · `migrations/`.

---

## 21. Tasks

### Task 1 — Preflight e baseline

**Files** — Create: — · Modify: — · Test: —

**Consumes** — estado do repositório.

**Produces** — baseline registrado e feature branch.

- [ ] `git status && git log -1 --oneline` — confirmar `main @ 1d48ffa`, tree limpa
- [ ] `git switch -c feat/phase-6-zapbox-url-migration`
- [ ] registrar valores reais de `npm run typecheck`, `npm run lint`,
      `npm run test`, `npm run test:e2e`, `npm run audit:brand`, `npm run build`
      *(referência: lint 0 erros/11 warnings · Vitest 310 · E2E 58 passed/2 skipped)*
- [ ] confirmar o baseline HTTP das cinco sources:

```bash
for u in /servicos/automacoes-com-ia /solucoes/atendimento-lento \
         /solucoes/leads-sem-resposta /solucoes/whatsapp-desorganizado \
         /servicos/automacao-de-atendimento; do
  printf "%-40s %s\n" "$u" \
    "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://www.rc2solucoes.com.br$u")"
done
```

- [ ] esperado: 4× `200`, alias `308` → `automacoes-com-ia`
- [ ] `curl -s https://www.rc2solucoes.com.br/sitemap.xml | grep -c "<loc>"` → **30**

---

### Task 2 — RED: contratos de migração e teste-guarda

**Files**
- Create: `tests/unit/seo/zapboxUrlMigration.test.ts`
- Modify: `tests/unit/seo/redirects.test.ts`,
  `tests/unit/seo/sitemapMigration.test.ts`,
  `tests/unit/seo/internalLinks.test.ts`

**Consumes** — §1, §6, §9, §12.

**Produces** — suíte vermelha pelos motivos corretos, com a armadilha coberta.

- [ ] em `zapboxUrlMigration.test.ts`, contra `next.config.ts` e `sitemap.ts`:
  - cada uma das **5** sources tem **exatamente 1** regra, `permanent: true`,
    `destination === "/zapbox"`
  - o alias **não** aponta para `/servicos/automacoes-com-ia` (chain zero)
  - as 4 canônicas **não** estão no sitemap; `/zapbox` **está**
  - sitemap tem **26** URLs
  - `/solucoes-com-ia`, `/servicos`, `/servicos/sites-e-landing-pages`,
    `/servicos/e-commerce`, `/solucoes/processos-manuais`,
    `/solucoes/sistemas-desconectados` **continuam no sitemap e sem redirect**
- [ ] **teste-guarda da armadilha** (§12), antes de qualquer edição de runtime:
  - `/servicos/e-commerce` resolve `relatedSolution === "sistemas-desconectados"`
    — o bloco **não** desaparece
  - `/servicos/sites-e-landing-pages` **não** resolve solução migrada
  - nenhum `relatedLinks`/`relatedServices` de página que permanece 200 aponta
    para as 4 sources
- [ ] em `redirects.test.ts`: remover as 4 da lista "NÃO recebe redirect";
      repontar a asserção do alias
- [ ] em `sitemapMigration.test.ts` e `internalLinks.test.ts`: acrescentar as 4
- [ ] auditar `services.test.ts`, `sitesLandingTerminology.test.ts`,
      `zapboxTerritoryTerminology.test.ts`, `zapboxBridgeSitemap.test.ts`;
      converter **apenas** o que quebrar
- [ ] `npx vitest run tests/unit/seo/ tests/unit/services/ tests/unit/zapbox/`
      → **VERIFY RED**: falha por destino/sitemap/lookup, nunca por copy

---

### Task 3 — GREEN: sets compartilhados e dependências de dados

**Files**
- Create: `src/lib/content/migratedRoutes.ts`
- Modify: `src/app/sitemap.ts`,
  `src/app/(public)/servicos/[slug]/page.tsx`,
  `src/app/(public)/servicos/page.tsx`,
  `src/lib/content/services.ts`,
  `src/app/llms-full.txt/route.ts`

**Consumes** — §10, §11, §12, §13, §14, §16.

**Produces** — nenhuma página 200 apontando para URL que vai redirecionar.

- [ ] criar `migratedRoutes.ts` exportando
      `MIGRATED_SERVICE_SLUGS = new Set(["agentes-de-ia", "automacao-de-processos", "automacoes-com-ia"])`
      e
      `MIGRATED_SOLUTION_SLUGS = new Set(["atendimento-lento", "leads-sem-resposta", "whatsapp-desorganizado"])`,
      com comentário citando `docs/22` e `docs/16` §10
- [ ] `sitemap.ts`: remover a const local, importar ambos, filtrar
      `solutionRoutes` por `MIGRATED_SOLUTION_SLUGS`
- [ ] `servicos/[slug]/page.tsx`: remover a const local, importar; aplicar o
      filtro do lookup reverso (§12)
- [ ] `servicos/page.tsx`: `MIGRATED_SERVICE_HREFS["automacoes-com-ia"] = "/zapbox"`
- [ ] `services.ts` **linha 589**: `href` → `/zapbox`; **não** tocar nas linhas
      248 e 361 nem em qualquer outro campo
- [ ] `llms-full.txt/route.ts`: filtrar ambas as coleções pelos sets
- [ ] **não** alterar `solutions.ts`
- [ ] `npm run typecheck && npm run lint`
- [ ] `git commit -m "test: define Zapbox URL migration contracts"` *(Task 2)*
- [ ] `git commit -m "refactor: remove internal links to Zapbox legacy URLs"` *(Task 3)*

---

### Task 4 — GREEN: regras de redirect

**Files** — Modify: `next.config.ts`

**Consumes** — §6, §7, §8.

**Produces** — as cinco sources redirecionando com 1 salto.

- [ ] acrescentar, em bloco comentado citando `docs/22` §1:
  - `/servicos/automacoes-com-ia` → `/zapbox`, `permanent: true`
  - `/solucoes/atendimento-lento` → `/zapbox`, `permanent: true`
  - `/solucoes/leads-sem-resposta` → `/zapbox`, `permanent: true`
  - `/solucoes/whatsapp-desorganizado` → `/zapbox`, `permanent: true`
- [ ] **repontar** `/servicos/automacao-de-atendimento` → `/zapbox`, mantendo-o
      adjacente à regra de `automacoes-com-ia` (§6.1)
- [ ] **não** remover nenhuma regra existente
- [ ] `npx vitest run tests/unit/seo/` → **VERIFY GREEN**
- [ ] `npm run build`
- [ ] validação HTTP local:

```bash
npm run start &
for u in /servicos/automacoes-com-ia /solucoes/atendimento-lento \
         /solucoes/leads-sem-resposta /solucoes/whatsapp-desorganizado \
         /servicos/automacao-de-atendimento; do
  printf "%-40s %s\n" "$u" \
    "$(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url} | hops=%{num_redirects}' \
       -L "http://localhost:3000$u")"
done
```

- [ ] esperado: **308**, destino `/zapbox`, **hops=1** nas cinco
- [ ] `git commit -m "seo: redirect Zapbox legacy URLs to bridge"`

---

### Task 5 — Sitemap

**Files** — Modify: — *(o filtro já entrou na Task 3)* · Test: verificação

**Consumes** — §9.

**Produces** — sitemap coerente com os redirects, na mesma unidade.

- [ ] confirmar que nenhuma das 4 aparece e que `/zapbox` permanece:

```bash
curl -s http://localhost:3000/sitemap.xml > /tmp/sm.xml
grep -c "<loc>" /tmp/sm.xml
for u in automacoes-com-ia atendimento-lento leads-sem-resposta \
         whatsapp-desorganizado zapbox; do
  printf "%-26s %s\n" "$u" "$(grep -c "$u" /tmp/sm.xml)"
done
```

- [ ] esperado: **26** URLs · 0 para as quatro · 1 para `/zapbox`
- [ ] confirmar zero `#` e zero duplicata
- [ ] confirmar `/servicos`, `/solucoes-com-ia`, `/servicos/sites-e-landing-pages`,
      `/servicos/e-commerce`, `/solucoes/processos-manuais`,
      `/solucoes/sistemas-desconectados` **presentes**
- [ ] `git commit -m "seo: remove migrated Zapbox URLs from sitemap"`

---

### Task 6 — E2E: redirects, negativas e bridge

**Files**
- Create: `tests/e2e/zapbox-url-migration.spec.ts`
- Modify: `tests/e2e/services.spec.ts`, `tests/e2e/personality-copy.spec.ts`

**Consumes** — §19.

**Produces** — contrato de redirect protegido ponta a ponta.

- [ ] no spec novo, para **cada uma das 5 sources**: `request.get(url, { maxRedirects: 0 })`
      → status **308**, `location` terminando em `/zapbox`
- [ ] navegação real de **uma** source até a bridge, confirmando o H1
      ("Quando o problema é o WhatsApp…") — **sem** navegar ao domínio externo
- [ ] **negativas explícitas**, todas **200** e nenhuma terminando em `/zapbox`:
      `/solucoes-com-ia` · `/servicos` · `/servicos/sites-e-landing-pages` ·
      `/servicos/e-commerce` · `/solucoes/processos-manuais` ·
      `/solucoes/sistemas-desconectados`
- [ ] `/zapbox` continua **200** e **não** redireciona para `zapbox.cloud`
- [ ] `services.spec.ts`: mover `automacoes-com-ia` para `REDIRECTED_SLUGS` → `/zapbox`
- [ ] `personality-copy.spec.ts:67`: trocar para `/solucoes/processos-manuais`
- [ ] `npx playwright test tests/e2e/zapbox-url-migration.spec.ts tests/e2e/services.spec.ts tests/e2e/personality-copy.spec.ts`
- [ ] stress: `--repeat-each=10 --workers=6` → 100% verde; se houver flake,
      `--trace on` **antes** de qualquer correção
- [ ] `git commit -m "test: validate Zapbox URL migration"`

---

### Task 7 — Runtime, MCP e gate final

**Files** — Modify: apenas o que reprovar. Capturas em
`.playwright-mcp/phase-6-zapbox-url-migration/` — **não versionadas**.

**Consumes** — tudo acima.

**Produces** — branch pronta para revisão. **Sem merge.**

- [ ] **MCP** em `/zapbox`, `/servicos`, `/servicos/sites-e-landing-pages` e
      `/servicos/e-commerce`, nos viewports **390×844**, **768×1024**,
      **1024×768** e **1440×900**: zero overflow, bridge intacta, hub íntegro,
      páginas preservadas renderizando, nenhum bloco relacionado desaparecido
- [ ] confirmar que `/servicos/e-commerce` **ainda exibe** o card de
      `sistemas-desconectados` (§12)
- [ ] confirmar analytics da bridge inalterado: `zapbox_bridge` /
      `ir_para_zapbox` / `https://www.zapbox.cloud/`
- [ ] `git diff main --stat` — confirmar os arquivos de §20 e **zero** alteração
      nos gates de §20.1
- [ ] fresh: `npm run typecheck` · `npm run lint` · `npm run test` ·
      `npm run test:e2e` · `npm run audit:brand` · `npm run build`
- [ ] varredura de segurança do diff: nenhum secret, token, credencial ou
      connection string
- [ ] `git push -u origin feat/phase-6-zapbox-url-migration`
- [ ] abrir **um** PR: `seo: redirect Zapbox legacy URLs to bridge`
- [ ] **PARAR antes do merge**

---

## 22. Unidade atômica — decisão

`INFERRED` — **SIM, um único PR** com redirects + links internos + sitemap +
testes.

Motivo: publicar redirect sem tirar do sitemap, ou tirar do sitemap sem
redirecionar, produz estado incoerente em Production; e repontar links internos
depois deixaria, no intervalo, páginas 200 apontando para URLs que já
redirecionam. Os quatro efeitos são partes da mesma mudança.

### 22.1 Ordem de implementação

1. baseline + guard tests
2. links internos e dependências de dados
3. regras de redirect
4. sitemap
5. testes/E2E
6. runtime
7. quality
8. PR

### 22.2 Commits — 5, sem squash

| # | Commit | Tasks |
|---|---|---|
| 1 | `test: define Zapbox URL migration contracts` | 2 |
| 2 | `refactor: remove internal links to Zapbox legacy URLs` | 3 |
| 3 | `seo: redirect Zapbox legacy URLs to bridge` | 4 |
| 4 | `seo: remove migrated Zapbox URLs from sitemap` | 5 |
| 5 | `test: validate Zapbox URL migration` | 6–7 |

---

## 23. Gate de Production

**Antes do merge:** as 4 canônicas ainda **200**; alias **308** para
`automacoes-com-ia`; sitemap **30**.

**Depois do merge:** as 4 canônicas **308 → `/zapbox`**; alias **308 → `/zapbox`**
(1 salto); sitemap **26**; `/zapbox` **200**.

**`SUCCESS_IS_NOT_200`** — depois desta unidade, um **200** em qualquer das
quatro sources é **FALHA**, não sucesso. O único 200 exigido é o de `/zapbox`.

---

## 24. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R-1 | Chain no alias | repontado na mesma unidade (§7); teste de destino direto |
| R-2 | Bloco relacionado some por lookup de `href` | teste-guarda **antes** da edição (§12, Task 2) |
| R-3 | Page 200 linkando para URL que redireciona | inventário §15; `services.ts:589` e hub corrigidos |
| R-4 | Sets divergirem entre arquivos | centralização em `migratedRoutes.ts` (§10) |
| R-5 | Sitemap fora de sincronia com redirects | mesma unidade, mesmo PR (§9.2, §22) |
| R-6 | Cache de 308 | `PERMANENT_REDIRECT_EXTERNAL_CACHE_RISK` (§8, §25) |
| R-7 | Perda de rich result de FAQ | registrado (§5) como consequência aceita, sem estimativa |
| R-8 | prev/next apontando para URL migrada | filtro existente + set compartilhado (§13) |
| R-9 | Testes stale (dívida repetida) | §19 mapeia os 9 arquivos antes de editar |
| R-10 | Salto extra por trailing slash | classificado como `TRAILING_SLASH_NORMALIZATION_HOP` (§2.1); sem middleware |
| R-11 | Redirecionar `/solucoes-com-ia` ou `/servicos` por engano | negativas explícitas em unit e E2E (§19, Task 6) |
| R-12 | Bridge alterada sem intenção | negative file gates (§20.1) |
| R-13 | Limpeza incidental de `llms-full` não desejada | declarada e vetável (§16) |

---

## 25. Rollback

`git revert` do merge restaura **o código** — regras, sitemap, links e testes
voltam ao estado anterior, e as quatro sources voltam a responder 200.

**O que o revert não faz:** desfazer instantaneamente o 308 já memorizado por
navegadores, CDNs e crawlers. Um redirect permanente pode ser cacheado por
tempo indeterminado no cliente.

`INFERRED` — **rollback operacional não equivale a reversão imediata do
comportamento de todos os clientes.** Por isso o merge desta unidade exige
revisão independente, e não deve ser tratado como mudança trivialmente
reversível.

---

## 26. Fora do escopo

Redirect externo `/zapbox` → `www.zapbox.cloud` permanece
**`OPTIONAL_FUTURE_OPTIMIZATION`** e **não** é executado aqui — `/zapbox`
continua 200, indexável e self-canonical.

Também fora: consolidação do hub `/servicos` · `/solucoes-com-ia`
(`SPLIT_INTENT`) · `/servicos/sites-e-landing-pages` (`KEEP`) · as três
`NEEDS_SEO_DATA` · Agenda Confirmada e `CD-2` · `CD-4` · taxonomia global de
analytics · qualquer alteração em `zapbox.cloud`.

---

## 27. Decisões fechadas

1. **4 sources canônicas + 1 alias.** `/solucoes-com-ia` **não** entra.
2. Destino único: **`/zapbox`**.
3. **308** via `permanent: true`; nunca 301/302/307.
4. **Alias repontado direto** — zero chain.
5. Sitemap **30 → 26** na mesma unidade dos redirects.
6. **`solutions.ts` intocado** — todas as referências vivem em páginas que migram.
7. **`services.ts` só na linha 589.**
8. **Lookup reverso filtrado** — a armadilha do `href` como chave, com
   teste-guarda antes da edição.
9. **Sets centralizados** em `migratedRoutes.ts`.
10. Hub mantém o card, apontando direto à bridge.
11. `LLMS_NO_CHANGE` para `llms.txt`; `llms-full.txt` recebe o filtro.
12. `ROBOTS_NO_CHANGE`.
13. **Um único PR**, 5 commits, sem squash.
14. Depois desta unidade, **200 nas sources é falha**.
