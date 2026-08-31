# SEO pós-Fase 5 — Migração SAFE_NOW — Implementation Plan

> **For agentic workers:** execute task-by-task with review gates. Follow
> `docs/16-post-phase-5-seo-migration-design.md` as authoritative specification.

**Goal:** migrar apenas as URLs legadas com equivalência comprovada para a nova
arquitetura de `/solucoes`, eliminando chains controláveis e preservando todas
as URLs ainda dependentes de Zapbox ou dados SEO.

**Architecture:** redirects permanentes em `next.config.ts`; sitemap filtrado
localmente sem mutilar as coleções legadas; internal links apontam ao destino
final; llms.txt acompanha a nova descoberta; robots permanece intacto.

**Spec:** `docs/16-post-phase-5-seo-migration-design.md`

**Baseline documental:** `main @ aef739e`; branch
`design/post-phase-5-seo-migration`; commit `adc668e` intacto.

---

## 0. Decisões de arquitetura deste plano

### 0.1 Mecanismo — `next.config.ts` apenas

Os cinco redirects vivem em `redirects()` com `permanent: true`, produzindo
**308** em runtime (`docs/16` §12). **Proibido:** middleware, route handler,
redirect client-side, navegação por JavaScript, `meta refresh`.

### 0.2 Ordem atômica — o n8n vem antes do redirect

O redirect de `/servicos/automacao-de-processos` **não pode ser habilitado**
antes da absorção do n8n (`RULING 3`). Por isso a Task 3 precede a Task 10, e
o commit dos redirects é posterior ao commit do conteúdo.

### 0.3 Três achados da inspeção que definem tasks

| # | Achado `OBSERVED` | Consequência |
|---|---|---|
| **A-1** | `src/app/(public)/servicos/[slug]/page.tsx:53-55` usa `solution.relatedServices[].href === "/servicos/<slug>"` como **chave de lookup reverso**, não só como link. O mesmo campo é renderizado como link em `/solucoes/[slug]:172,222`. | Reapontar `href` sem verificar quebraria o bloco "solução relacionada". Task 4 traz **teste-guarda**. |
| **A-2** | `prev`/`next` em `/servicos/[slug]:51-52` percorrem o array `services` inteiro. Depois da migração, `automacoes-com-ia → next` e `e-commerce → prev` apontariam para URLs que redirecionam. | Task 6 filtra os slugs migrados da navegação sequencial. |
| **A-3** | **`tests/e2e/services.spec.ts:31` já falha hoje.** Ele exige o link "Solicitar diagnóstico" nas páginas de serviço; o CTA foi descontinuado na Fase 2 e **não existe mais** (verificado em Production). Como `npm run test` roda só Vitest, a suíte e2e está vermelha desde então sem ninguém notar. | Task 1 mede o baseline real do e2e; Task 8 corrige, porque sem isso o gate desta unidade nunca fecha. **Dívida pré-existente, reparada porque bloqueia.** |

### 0.4 Verificação do lookup reverso (A-1)

`OBSERVED` — quem depende do lookup são apenas as páginas que **continuam
renderizando**:

| `/servicos/<slug>` que renderiza | Casa com | Depende de href migrado? |
|---|---|---|
| `automacoes-com-ia` | `atendimento-lento` | **não** |
| `e-commerce` | `sistemas-desconectados` | **não** |
| `sites-e-landing-pages` | `leads-sem-resposta` | **não** |

Nenhuma das três depende de `/servicos/agentes-de-ia` ou
`/servicos/automacao-de-processos`. **Reapontar é seguro** — e a Task 4 prova
isso com teste, em vez de confiar na leitura.

---

## 1. Escopo — o que entra e o que não entra

### Entra (5 redirects)

| # | Source | Target | Tipo |
|---|---|---|---|
| 1 | `/servicos/agentes-de-ia` | `/solucoes#ia-para-operacoes` | canônica, **novo** |
| 2 | `/servicos/automacao-de-processos` | `/solucoes#automacao-de-processos` | canônica, **novo**, após n8n |
| 3 | `/servicos/integracao-de-sistemas` | `/solucoes#integracao-de-sistemas` | alias, **reapontado** |
| 4 | `/servicos/operacoes-digitais` | `/solucoes#operacoes-digitais-commerce` | alias, **reapontado** |
| 5 | `/services` | `/solucoes` | alias, **reapontado** |

`/services/` → `/services` → `/solucoes`: **NORMALIZATION_ONLY**, 2 saltos
aceitos, sem middleware.

### Não entra

`/solucoes-com-ia` (`RULING 1`) · `/servicos` (`RULING 7`) ·
`/servicos/automacao-de-atendimento`, `/servicos/automacoes-com-ia`,
`/solucoes/atendimento-lento`, `/solucoes/leads-sem-resposta`,
`/solucoes/whatsapp-desorganizado` (`RULING 8`) · `/servicos/e-commerce`,
`/solucoes/processos-manuais`, `/solucoes/sistemas-desconectados`
(`RULING 9`) · `/servicos/sites-e-landing-pages` (`RULING 10`).

**A regra morta de `/services/` em `next.config.ts` não é removida** — mexer
nela não muda comportamento e só aumentaria a superfície do diff. Fica
registrada em `docs/16` §3.3.

---

## 2. Estrutura de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/lib/content/solucoesPage.ts` | MODIFY | absorver n8n na competência de Automação |
| `src/lib/content/solutions.ts` | MODIFY | reapontar 10 `href` para as âncoras |
| `src/lib/content/services.ts` | MODIFY | reapontar 2 `href` de `relatedLinks` |
| `src/app/(public)/servicos/page.tsx` | MODIFY | 2 cards → âncoras |
| `src/app/(public)/servicos/[slug]/page.tsx` | MODIFY | prev/next pula slugs migrados |
| `next.config.ts` | MODIFY | 3 reapontamentos + 2 novos redirects |
| `src/app/sitemap.ts` | MODIFY | filtro `MIGRATED_SERVICE_SLUGS` |
| `src/app/llms.txt/route.ts` | MODIFY | descoberta na arquitetura vigente |
| `docs/BLOG_INTERNAL_LINKING_GUIDE.md` | MODIFY | guia operacional |
| `tests/e2e/services.spec.ts` | MODIFY | destinos novos + reparo de A-3 |
| `tests/unit/seo/redirects.test.ts` | CREATE | contrato dos 5 redirects |
| `tests/unit/seo/sitemapMigration.test.ts` | CREATE | ausências e presenças no sitemap |
| `tests/unit/seo/internalLinks.test.ts` | CREATE | zero link para URL migrada + guarda do lookup A-1 |
| `tests/unit/solucoes/solucoesContent.test.ts` | MODIFY | n8n presente na competência |

**Nunca tocar:** `src/app/robots.ts` · `src/app/llms-full.txt/route.ts` ·
`src/app/(public)/solucoes-com-ia/` · `src/app/(public)/solucoes/[slug]/` ·
qualquer página física das URLs migradas (`PRESERVE_IMPLEMENTATION_FOR_ROLLBACK`).

**Nenhum arquivo é deletado.**

---

## 3. Copy da absorção do n8n

`APPROVED` (`RULING 3`) — mínima, factual, natural. Entra em
`SOLUCOES_COMPETENCIES[0]` (Automação de Processos), campo `interventions`,
como **quinto item**:

```
Construção dos fluxos em ferramentas de orquestração como o n8n, integradas
aos sistemas que já rodam na operação.
```

**Por que em Automação e não em Integração:** o redirect de
`/servicos/automacao-de-processos` aterrissa em `#automacao-de-processos`, e o
`seoTitle` da origem lidera com "Automação de Processos". O visitante encontra
o termo na seção onde chega.

**Proibido** nesta copy: "especialistas certificados n8n" · "parceiros n8n" ·
"n8n é melhor que Zapier/Make" · qualquer número, percentual ou benchmark ·
qualquer claim de parceria ou certificação.

**Verificação obrigatória:** o termo tem de aparecer no **HTML renderizado da
página**, não apenas em `<meta name="keywords">` — foi exatamente a distinção
que reprovou o estado atual (`docs/16` §8.2).

---

## 4. `next.config.ts` — diff exato planejado

Dentro de `redirects()`, **sem tocar em nada mais do arquivo**:

| Ação | Entrada |
|---|---|
| **Reapontar** | `{ source: "/services", destination: "/servicos" }` → `destination: "/solucoes"` |
| **Reapontar** | `{ source: "/servicos/integracao-de-sistemas", destination: "/servicos/automacao-de-processos" }` → `destination: "/solucoes#integracao-de-sistemas"` |
| **Reapontar** | `{ source: "/servicos/operacoes-digitais", destination: "/servicos/automacao-de-processos" }` → `destination: "/solucoes#operacoes-digitais-commerce"` |
| **Adicionar** | `{ source: "/servicos/agentes-de-ia", destination: "/solucoes#ia-para-operacoes", permanent: true }` |
| **Adicionar** | `{ source: "/servicos/automacao-de-processos", destination: "/solucoes#automacao-de-processos", permanent: true }` |
| **Não tocar** | apex → www · `/index.htm` · `/about` · `/about/` · `/services/` · `/servicos/automacao-de-atendimento` |

Todas as cinco com `permanent: true`. **Nenhuma entrada é removida.**

---

## 5. Tasks

### Task 1 — Preflight e baseline real, incluindo e2e

**Files** — Create: — · Modify: — · Test: —

**Consumes** — estado do repositório.

**Produces** — baseline observado e feature branch.

- [ ] `git status && git branch --show-current && git log --oneline -3` — confirmar `design/post-phase-5-seo-migration @ adc668e`, tree limpa
- [ ] `git checkout main && git pull --ff-only && git checkout -b seo/post-phase-5-migration`
- [ ] registrar valores **reais**: `npm run typecheck` · `npm run lint` · `npm run test` · `npm run audit:brand` · `npm run build`
      *(referência da Fase 5: typecheck PASS · lint 0 erros/11 warnings · 25 arquivos/189 testes · brand PASS · build PASS)*
- [ ] **`npm run test:e2e`** — registrar o resultado real. **Espera-se vermelho** por A-3. Anotar exatamente quais testes falham e por quê, **antes** de qualquer edição
- [ ] confirmar que `playwright.config.ts` sobe o servidor com `npm run dev` e usa `http://localhost:3000` — os redirects de `next.config.ts` valem em dev
- [ ] se algum gate **além** do e2e estiver pior que a referência: **PARE**

---

### Task 2 — RED: contrato do n8n

**Files** — Modify: `tests/unit/solucoes/solucoesContent.test.ts`

**Consumes** — §3.

**Produces** — teste vermelho pela ausência do termo.

- [ ] acrescentar ao bloco "competências":
  - `SOLUCOES_COMPETENCIES[0].interventions` contém um item com `"n8n"`
  - esse item **não** contém `certificad`, `parceir`, `melhor que`, `%`
  - `SOLUCOES_COMPETENCIES[0].interventions.length >= 5`
- [ ] `npx vitest run tests/unit/solucoes/solucoesContent.test.ts` → **falha por n8n ausente**

---

### Task 3 — GREEN: absorver o n8n

**Files** — Modify: `src/lib/content/solucoesPage.ts`

**Consumes** — §3.

**Produces** — n8n na copy visível da competência de Automação.

- [ ] inserir o quinto `interventions` de `SOLUCOES_COMPETENCIES[0]` com a copy **literal** da §3
- [ ] `npx vitest run tests/unit/solucoes/` → **verde**
- [ ] `npm run typecheck`
- [ ] `npm run build && npm run start` e confirmar por HTTP que `n8n` aparece **fora** de `<meta name="keywords">`:

```bash
curl -s http://localhost:3000/solucoes \
  | python -c "import sys,re; t=sys.stdin.read(); \
      body=t[t.find('<body'):]; \
      print('n8n no corpo:', 'n8n' in body)"
```

- [ ] `npm run audit:brand`
- [ ] `git commit -m "content: absorb n8n into automation competency"`

---

### Task 4 — Internal links nas coleções, com guarda do lookup

**Files**
- Modify: `src/lib/content/solutions.ts`, `src/lib/content/services.ts`
- Create: `tests/unit/seo/internalLinks.test.ts`

**Consumes** — `docs/16` §9.1; achado A-1.

**Produces** — zero link versionado para as duas URLs migradas, com o lookup
reverso provado intacto.

- [ ] RED — escrever `internalLinks.test.ts`:
  - nenhum `href` em `solutions.ts` (`relatedServices` e `relatedLinks`) é `/servicos/agentes-de-ia` ou `/servicos/automacao-de-processos`
  - nenhum `href` em `services.ts` (`relatedLinks`) aponta para as duas
  - **guarda de A-1:** para cada slug que **continua renderizando**
    (`automacoes-com-ia`, `e-commerce`, `sites-e-landing-pages`),
    `solutions.find(s => s.relatedServices.some(r => r.href === "/servicos/" + slug))` continua **definido**
  - `href` de `/solucoes-com-ia` em `solutions.ts` e `services.ts` **permanece** (é `DEFER`)
  - `href` para `automacoes-com-ia`, `e-commerce`, `sites-e-landing-pages` **permanecem**
- [ ] `npx vitest run tests/unit/seo/internalLinks.test.ts` → **falha**
- [ ] GREEN — reapontar exatamente **12 ocorrências**:
  - `solutions.ts` · `relatedServices`: `automacao-de-processos` em `atendimento-lento`, `leads-sem-resposta`, `processos-manuais`, `sistemas-desconectados`, `whatsapp-desorganizado` (5) e `agentes-de-ia` em `processos-manuais` (1) → âncoras correspondentes
  - `solutions.ts` · `relatedLinks`: `automacao-de-processos` em `processos-manuais`, `sistemas-desconectados`, `whatsapp-desorganizado` (3) e `agentes-de-ia` em `processos-manuais` (1) → âncoras
  - `services.ts` · `relatedLinks`: `automacao-de-processos` (2) → `/solucoes#automacao-de-processos`
- [ ] **não** alterar `label`, `description` nem remover qualquer entrada — só o `href`
- [ ] `npx vitest run tests/unit/seo/` → **verde**
- [ ] `git commit -m "seo: repoint internal links to solucoes anchors"`

---

### Task 5 — Hub `/servicos`: cards para as âncoras

**Files** — Modify: `src/app/(public)/servicos/page.tsx`

**Consumes** — `docs/16` §10 (abordagem A).

**Produces** — hub sem salto voluntário.

- [ ] introduzir um mapa local de destinos migrados, aplicado ao `href` do card:
      `agentes-de-ia → /solucoes#ia-para-operacoes`,
      `automacao-de-processos → /solucoes#automacao-de-processos`; os demais
      mantêm `/servicos/<slug>`
- [ ] **não remover nenhum card**; **não redirecionar o hub**; **não alterar**
      `id={service.slug}`, o texto `Ver serviço`, o layout nem as classes
- [ ] `npm run build` e conferir visualmente em `npm run dev`
- [ ] `git commit -m "seo: point migrated hub cards to final anchors"`

---

### Task 6 — prev/next sem salto (achado A-2)

**Files** — Modify: `src/app/(public)/servicos/[slug]/page.tsx`

**Consumes** — achado A-2.

**Produces** — navegação sequencial que nunca aponta para um redirect.

- [ ] derivar `prev`/`next` de uma lista **filtrada**, sem os dois slugs
      migrados, em vez do array `services` completo
- [ ] consequência esperada e aceita: em `/servicos/e-commerce`, o `prev` passa
      a ser `automacoes-com-ia`
- [ ] **preservar** o tracking `service_navigation_prev` / `service_navigation_next`
      e os labels por `shortTitle` das páginas remanescentes
- [ ] **não** alterar o bloco `relatedSolution` — a guarda da Task 4 já provou
      que ele continua resolvendo
- [ ] `npm run typecheck && npm run build`
- [ ] `git commit -m "seo: skip migrated slugs in service navigation"`

---

### Task 7 — Guia de interlinking do blog

**Files** — Modify: `docs/BLOG_INTERNAL_LINKING_GUIDE.md`

**Consumes** — `docs/16` §9.3.

**Produces** — guia que deixa de gerar dívida a cada artigo novo.

- [ ] substituir, nas recomendações de link:
      `/servicos/automacao-de-processos` → `/solucoes#automacao-de-processos`
- [ ] onde o contexto for **IA aplicada à operação**:
      `/solucoes-com-ia` → `/solucoes#ia-para-operacoes`
- [ ] onde o contexto for **WhatsApp, atendimento, vendas ou leads**: **não**
      redirecionar o autor para `#ia-para-operacoes`. Registrar no guia que o
      destino desse território **depende do Zapbox e da Fase 6**, e manter o
      link atual até lá
- [ ] substituir o CTA descontinuado *"Diagnóstico de atendimento e
      qualificação de leads"* pelo vigente **"Falar sobre minha operação"**
      → `/contato` (`docs/11`, `docs/14`)
- [ ] **não reescrever o guia inteiro** — só as instruções afetadas
- [ ] `git commit -m "docs: update blog interlinking guide to current architecture"`

---

### Task 8 — E2E: destinos novos e reparo da dívida A-3

**Files** — Modify: `tests/e2e/services.spec.ts`

**Consumes** — achado A-3; baseline medido na Task 1.

**Produces** — suíte e2e que volta a ter significado.

- [ ] **linha 31** — trocar a asserção do CTA descontinuado
      `/Solicitar diagnóstico/i` pelo CTA vigente das páginas de serviço
      (**verificar no HTML real** qual é, antes de escrever; em Production hoje
      as páginas expõem "Falar com a RC2" e "Ver se serve para o meu caso").
      **Dívida pré-existente**, corrigida porque bloqueia o gate
- [ ] separar os slugs em duas listas:
      `RENDERED_SLUGS` = `automacoes-com-ia`, `e-commerce`, `sites-e-landing-pages`
      `REDIRECTED_SLUGS` = `agentes-de-ia`, `automacao-de-processos`
- [ ] **listagem do hub:** manter `toHaveCount(5)`; para `RENDERED_SLUGS`
      exigir `a[href="/servicos/<slug>"]`; para `REDIRECTED_SLUGS` exigir
      `a[href="/solucoes#<âncora>"]`
- [ ] **carregamento:** `RENDERED_SLUGS` seguem 200 com `<h1>` e CTA vigente;
      `REDIRECTED_SLUGS` ganham teste próprio afirmando que `page.goto` termina
      em `/solucoes#<âncora>`
- [ ] **navegação (linha 41):** o antigo `toHaveURL(/agentes-de-ia/)` passa a
      exigir o destino final. Como `agentes-de-ia` sai da sequência (Task 6),
      reescrever o teste para o par remanescente, sem enfraquecê-lo
- [ ] `npm run test:e2e` → **verde**
- [ ] `git commit -m "test: update service e2e for migrated URLs"`

---

### Task 9 — RED: contrato dos redirects

**Files** — Create: `tests/unit/seo/redirects.test.ts`

**Consumes** — §1 e §4.

**Produces** — teste vermelho antes de tocar `next.config.ts`.

- [ ] importar a configuração real e chamar `redirects()`, **sem duplicar as
      regras** no teste:

```ts
import nextConfig from "../../../next.config";
const rules = await nextConfig.redirects!();
```

*(se a importação do `next.config.ts` não resolver sob o Vitest, registrar o
erro observado e cair para leitura da fonte com `readFileSync`, como em
`tests/unit/admin/ctaPresets.test.ts` — decidir pelo resultado real, não por
suposição.)*

- [ ] asserções:
  - existe exatamente uma regra por source, para as cinco da §1
  - cada destination é o alvo exato da §1
  - as cinco têm `permanent: true`
  - **anti-chain:** nenhum `destination` das cinco é o `source` de outra regra
  - `/servicos/automacao-de-atendimento` continua apontando para
    `/servicos/automacoes-com-ia`
  - **não existe** regra cujo source seja `/servicos`, `/solucoes-com-ia`,
    `/servicos/automacoes-com-ia`, `/servicos/e-commerce`,
    `/servicos/sites-e-landing-pages` ou qualquer `/solucoes/<slug>`
  - `/about` e `/about/` intactos
- [ ] `npx vitest run tests/unit/seo/redirects.test.ts` → **falha**

---

### Task 10 — GREEN: os cinco redirects

**Files** — Modify: `next.config.ts`

**Consumes** — §4.

**Produces** — a migration configurada.

- [ ] **pré-condição verificada:** a Task 3 está commitada e o n8n aparece no
      HTML renderizado. Sem isso, **não executar esta task**
- [ ] aplicar exatamente as cinco mudanças da tabela §4
- [ ] **nada mais do arquivo muda** — CSP, headers, `images`, `poweredByHeader`
      e as demais regras ficam byte-idênticos
- [ ] `npx vitest run tests/unit/seo/redirects.test.ts` → **verde**
- [ ] `git diff next.config.ts` — confirmar 3 linhas de `destination`
      alteradas e 2 blocos adicionados, e nada além disso

---

### Task 11 — Sitemap: filtro localizado

**Files**
- Modify: `src/app/sitemap.ts`
- Create: `tests/unit/seo/sitemapMigration.test.ts`

**Consumes** — `docs/16` §11; `RULING 13`.

**Produces** — as duas URLs migradas fora do sitemap, sem mutilar coleções.

- [ ] RED — escrever `sitemapMigration.test.ts` contra o sitemap gerado:
  - **ausentes:** `/servicos/agentes-de-ia`, `/servicos/automacao-de-processos`
  - **presentes:** `/solucoes`, `/solucoes-com-ia`, `/servicos`,
    `/servicos/automacoes-com-ia`, `/servicos/e-commerce`,
    `/servicos/sites-e-landing-pages` e os **cinco** `/solucoes/<slug>`
  - **ausentes:** os cinco aliases
  - nenhuma URL contém `#`
  - `services` em `services.ts` continua com **5** entradas — a coleção não
    foi mutilada
- [ ] `npx vitest run tests/unit/seo/sitemapMigration.test.ts` → **falha**
- [ ] GREEN — em `sitemap.ts`, declarar a constante local

```ts
/** Slugs migrados para âncoras de /solucoes — ver docs/16 §11. */
const MIGRATED_SERVICE_SLUGS = new Set(["agentes-de-ia", "automacao-de-processos"]);
```

      e filtrar antes de produzir `serviceRoutes`:
      `services.filter((s) => !MIGRATED_SERVICE_SLUGS.has(s.slug)).map(...)`
- [ ] **não** criar módulo novo; **não** remover entradas de `services.ts`;
      **não** tocar `staticPages` (`/solucoes-com-ia` fica, é `DEFER`)
- [ ] verificar a contagem **em runtime**, não por número hardcoded:
      `curl -s localhost:3000/sitemap.xml | grep -c "<loc>"` — esperado **29**
      se o baseline medido na Task 1 for 31
- [ ] `npx vitest run tests/unit/seo/` → **verde**
- [ ] `git commit -m "seo: add permanent redirects and sitemap filter"` *(inclui a Task 10)*

---

### Task 12 — llms.txt

**Files** — Modify: `src/app/llms.txt/route.ts`

**Consumes** — `docs/16` §17.

**Produces** — descoberta alinhada à arquitetura vigente.

- [ ] **Principais páginas** passam a ser, nesta ordem: `/` · `/solucoes` ·
      `/sobre` · `/blog` · `/avaliacoes` · `/contato`
- [ ] acrescentar as quatro competências por âncora de `/solucoes`, descritas
      com a copy já aprovada em `docs/14` §5 e `docs/15` §2 — **sem inventar**
- [ ] **remover** as linhas de `/servicos/agentes-de-ia` e
      `/servicos/automacao-de-processos` (passam a redirecionar)
- [ ] **remover** `/servicos` e `/solucoes-com-ia` da lista de arquitetura
      principal — as URLs continuam 200, mas não são a arquitetura vigente
- [ ] **não listar** nenhuma URL `DEFER_PHASE_6` como arquitetura principal
- [ ] citar **Zapbox** como produto externo (`https://zapbox.cloud/`), nunca
      como competência RC2
- [ ] atualizar **Temas principais**, removendo "Automação de atendimento com
      IA", "WhatsApp para vendas e suporte" e "Sites e landing pages de
      conversão" como temas RC2 — território Zapbox e serviço despriorizado
- [ ] o parágrafo de abertura passa a descrever automação de processos,
      integração de sistemas, IA para operações e operações digitais &
      commerce
- [ ] **não criar** `llms-full.txt`; **não alterar** o existente
- [ ] `curl -s localhost:3000/llms.txt` — confirmar 200 e ausência das duas URLs migradas
- [ ] `git commit -m "seo: align llms.txt with current architecture"`

---

### Task 13 — Validação HTTP local

**Files** — Modify: apenas o que reprovar.

**Consumes** — `docs/16` §19.

**Produces** — prova de status, destino e contagem de saltos.

- [ ] `npm run build && npm run start`
- [ ] **positivos** — sem seguir o redirect, registrar `status` e `Location`:

```bash
for u in /servicos/agentes-de-ia /servicos/automacao-de-processos \
         /servicos/integracao-de-sistemas /servicos/operacoes-digitais /services; do
  echo "### $u"
  curl -s -o /dev/null -D - "http://localhost:3000$u" | grep -iE "^HTTP|^location"
  curl -sIL -o /dev/null -w "    saltos=%{num_redirects} final=%{url_effective} status=%{http_code}\n" "http://localhost:3000$u"
done
```

  esperado: **308** em todas · `Location` exato da §1 · **1 salto** cada ·
  final 200
- [ ] **`/services/`** — esperado **2 saltos**, terminando em `/solucoes`
- [ ] **negativos** — devem responder **200 sem redirect**: `/servicos` ·
      `/solucoes-com-ia` · `/servicos/automacoes-com-ia` ·
      `/servicos/e-commerce` · `/servicos/sites-e-landing-pages` ·
      `/solucoes/processos-manuais` · `/solucoes/sistemas-desconectados` ·
      `/solucoes/atendimento-lento` · `/solucoes/leads-sem-resposta` ·
      `/solucoes/whatsapp-desorganizado`
- [ ] **`/servicos/automacao-de-atendimento`** continua **308 →
      `/servicos/automacoes-com-ia`**, e **não** para `/solucoes`
- [ ] `/solucoes` e as cinco âncoras respondem 200 com os ids presentes
- [ ] `git diff -- src/app/robots.ts` → **vazio**

---

### Task 14 — Playwright MCP, quality gate e PR

**Files** — Modify: apenas o que reprovar. Capturas em
`.playwright-mcp/seo-migration/` — **não versionadas**.

**Consumes** — tudo acima.

**Produces** — branch pronta para revisão. **Sem merge.**

- [ ] **MCP em `/servicos`:** o hub continua renderizando os 5 cards; os dois
      migrados apontam para `/solucoes#…`; os outros três para `/servicos/…`;
      nenhuma regressão visual
- [ ] **MCP em `/solucoes`:** `n8n` visível na competência de Automação; as
      cinco âncoras presentes e únicas; zero overflow em 390×844 e 1440×900
- [ ] fresh run, nesta ordem:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run audit:brand
npm run build
```

- [ ] comparar com o baseline **observado na Task 1** — inclusive o e2e, que
      parte de vermelho conhecido e deve terminar verde
- [ ] `git diff main --stat` — confirmar **zero** alteração em
      `src/app/robots.ts`, `src/app/llms-full.txt/route.ts`,
      `src/app/(public)/solucoes-com-ia/`, `package.json`, `package-lock.json`
- [ ] `git push -u origin seo/post-phase-5-migration`
- [ ] abrir **um** PR, `seo: migrate safe legacy solution URLs`, com o corpo da §7
- [ ] **PARAR antes do merge** — ver o gate da §8

---

## 6. Commits planejados

Cinco unidades revisáveis, sem squash. `adc668e` permanece intacto.

| # | Commit | Tasks |
|---|---|---|
| 1 | `content: absorb n8n into automation competency` | 2–3 |
| 2 | `seo: repoint internal links to solucoes anchors` · `seo: point migrated hub cards to final anchors` · `seo: skip migrated slugs in service navigation` | 4–6 |
| 3 | `docs: update blog interlinking guide to current architecture` · `test: update service e2e for migrated URLs` | 7–8 |
| 4 | `seo: add permanent redirects and sitemap filter` | 9–11 |
| 5 | `seo: align llms.txt with current architecture` | 12 |

A ordem é obrigatória: **o commit 1 precede o commit 4** (`RULING 3`).

---

## 7. Corpo do PR futuro

**Título:** `seo: migrate safe legacy solution URLs`

Deve declarar:

**REDIRECTED (5, todos 308, 1 salto):** `/servicos/agentes-de-ia` ·
`/servicos/automacao-de-processos` · `/servicos/integracao-de-sistemas` ·
`/servicos/operacoes-digitais` · `/services`

**DEFERRED:** `/solucoes-com-ia` (intenção metade Zapbox) · território Zapbox
completo · `NEEDS_SEO_DATA` (3) · hub `/servicos` · `KEEP`
(`/servicos/sites-e-landing-pages`)

**Também:** status `PERMANENT_308` medido · sitemap 31 → 29 com filtro local,
sem mutilar coleções · `llms.txt` atualizado · internal links sem salto
voluntário · e2e atualizado (incluindo o reparo da dívida A-3) · `/services/`
com **2 saltos aceitos** por normalização do framework · `robots.txt`
inalterado · nenhuma página removida fisicamente.

---

## 8. Rollback gate

**`PERMANENT_REDIRECT_EXTERNAL_CACHE_RISK`**

`git revert` restaura o código, mas **não** reverte: cache de navegador · cache
de CDN intermediário · estado do crawler · indexação já reprocessada.

Por isso o merge desta unidade **só ocorre após revisão independente da matriz
final** por quem responde pelo negócio. Não é um merge de rotina como os das
Fases 0 a 5.

---

## 9. Analytics

Nenhuma mudança de tracking nesta unidade.

| Série | Situação |
|---|---|
| `service_detail_*` e related de `/servicos/agentes-de-ia` e `/servicos/automacao-de-processos` | **`SOURCE_PAGE_SERIES_ENDED_BY_REDIRECT`** |
| `service_navigation_prev` / `_next` | **preservadas** para os três slugs remanescentes |
| aliases | não geram série — nunca renderizaram |
| `/solucoes` (`solutions_*`, `footer_solucoes`, `footer_produto`) e `home_solutions` | **intactas** |
| `solution_hub_card` | segue **encerrada** desde a Fase 5 |

`service_detail_*` e `service_navigation_*` **não são reutilizados** com outro
significado. Nenhum event kind novo.

---

## 10. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R-1 | Redirect permanente cacheado externamente, sem rollback real | §8; conjunto mínimo de 5; equivalência comprovada em `docs/16` |
| R-2 | Quebrar o bloco "solução relacionada" ao reapontar `relatedServices` (A-1) | Teste-guarda na Task 4, antes do GREEN |
| R-3 | `prev`/`next` apontando para URL que redireciona (A-2) | Task 6 filtra a sequência |
| R-4 | Gate declarado verde sem rodar e2e | `npm run test:e2e` é obrigatório nas Tasks 1, 8 e 14 |
| R-5 | Habilitar o redirect de `automacao-de-processos` antes do n8n | Pré-condição explícita na Task 10 e ordem dos commits |
| R-6 | Chain via `/servicos/automacao-de-processos` | Os aliases são reapontados na mesma unidade; teste anti-chain na Task 9 |
| R-7 | Remover slugs de `services.ts` para "limpar" o sitemap | `RULING 13`; teste que exige 5 entradas na coleção |
| R-8 | `/solucoes-com-ia` entrar por engano | Teste da Task 9 nega a existência da regra |
| R-9 | `robots.txt` alterado por descuido | `git diff` explícito nas Tasks 13 e 14 |
| R-10 | Copy do n8n virar claim de parceria | Termos proibidos testados na Task 2 |

---

## 11. Fora do escopo

Tudo o que `docs/16` §22 lista, mais: remover a regra morta de `/services/` ·
criar middleware · alterar `llms-full.txt` · remover páginas físicas ·
`/servicos` hub · qualquer URL de território Zapbox ou `NEEDS_SEO_DATA` ·
iniciar a Fase 6.
