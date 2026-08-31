# Fase 4 — Nova Home RC2 — Implementation Plan

> **For agentic workers:** execute task-by-task with review gates. Follow
> `docs/12-fase-4-home-design.md` as the authoritative spec.

**Goal:** reconstruir a Home da RC2 segundo o posicionamento aprovado, sem
alterar rotas, banco ou arquitetura comercial já fechada.

**Architecture:** composição server-first em `page.tsx`, com componentes
extraídos apenas para unidades que tenham responsabilidade própria; analytics
usa eventos existentes; conteúdo vem de fontes existentes sempre que possível.

**Tech Stack:** Next.js 16.3.3, React 19.2.4, TypeScript, Tailwind/CSS
existente, Lucide, Playwright MCP, Vitest/test stack já existente.

**Spec:** `docs/12-fase-4-home-design.md`

**Baseline:** `main @ 1897ca9` · plano escrito em `design/phase-4-home @ 5fb93cd`

---

## Global Constraints

**Não alterar:** `/servicos` · `/servicos/*` · `/solucoes` · `/solucoes/*` ·
`/solucoes-com-ia` · `/contato` · `next.config.ts` · `sitemap.ts` · `robots.ts`
· redirects · Supabase/banco · `package.json` · `package-lock.json` ·
`.env.local` · `.mcp.json` · `docs/08`–`docs/12`.

**Não criar:** rota nova · API · CMS · tabela · dependência · tracking kind ·
evento de analytics · fonte · paleta.

**Preservar (baseline Fase 0):** canonical `https://www.rc2solucoes.com.br/` ·
self-canonicals · `noindex,nofollow` nas legais · 8 campos `required` ·
honeypot · `noValidate` · Zod/RHF · `break-words` do Footer · ausência de
overflow em 390/768/1024/1440.

**Preservar (Fases 2 e 3):** CTAs aprovados · ausência de "Solicitar
diagnóstico" e "diagnóstico gratuito" · fronteira RC2 × Zapbox · conversa
gratuita sem promessa de Discovery · faixa de preço **apenas** em `/contato`.

**Preservar (docs/10):** os 15 labels históricos de analytics. Nenhum evento
renomeado ou removido. Zapbox segue sem tracking kind próprio.

**Claims:** somente fatos da proposta §16. Proibido inventar cliente, case,
métrica, prazo, SLA, garantia ou percentual.

**Design:** Barlow única · tokens `--rc2-*` · nenhum hex literal em componente ·
Safety Orange < 10% da área · anel de foco do sistema · sem robôs/cérebros/
chips/blobs/glassmorphism/dashboard fictício.

**Release:** commits incrementais na branch, mas **um único PR** com as 10
seções completas. Nunca publicar narrativa parcialmente migrada.

---

## Descobertas técnicas que condicionam o plano

`OBSERVED` — verificado no código nesta tarefa:

1. **`ServiceCard` tem um único consumidor: a Home** (`page.tsx:283`).
   `/servicos/page.tsx` **não** o usa. Ele é tipado a `Service` e tem
   `serviceResolveMap` com chave nos 5 slugs legados — contrato incompatível
   com as 4 competências.
2. **Não existe helper compartilhado de posts.** `/blog`, `/blog/[slug]` e o
   preview fazem `.from("posts")` inline. `src/lib/blog/` só tem
   `sanitize.ts`.
3. **`vitest.config.ts` inclui apenas `tests/unit/**/*.test.ts`.** Arquivos
   `.test.tsx` **não são executados**: `tests/unit/admin/security-page-sanitization.test.tsx`
   existe e nunca roda (19 arquivos executados, 20 no disco). **Isto é
   pré-existente e não será corrigido na Fase 4** — apenas registrado. Todo
   teste novo desta fase usa extensão **`.test.ts`** com `createElement`,
   seguindo o padrão que efetivamente roda.
4. **A Home é `async function HomePage()`** (Server Component com `await`).
   Testing Library não renderiza RSC assíncrono. Consequência: a verificação de
   markup composto é feita por **Playwright**, e a verificação de copy/CTA/
   destino por **testes unitários sobre constantes exportadas**.
5. **`HeroActions`** hoje: CTA primário "Ver onde minha operação trava" com
   `location: hero_${variant}` e label `solicitar_diagnostico`; CTA secundário é
   **WhatsApp**, não `/solucoes`.
6. **`HomeCtaBlock`** hoje emite `location: "home_cta_block"`.
7. **`HomeReviews`** é conteúdo estático, sem query. Reutilizável sem alteração.

### Decisões que divergem da spec, com justificativa

| Item | Spec `docs/12` | Plano | Motivo |
|---|---|---|---|
| `location` do CTA final | `home_final_cta` | **`home_cta_block`** (preservado) | O componente e sua posição não mudam — só a copy. Trocar a `location` quebraria a série sem ganho. Coerente com `docs/10`. |
| `CompetencyCard` | — | interno a `HomeCompetencies`, **sem arquivo próprio** | Não tem consumidor fora da Home; arquivo separado não gera clareza. |
| `ServiceCard` | "REFATORAR" | **remover** ao final da Task 14 | Único consumidor é a Home; o contrato `Service` não serve às competências. Refatorar seria reescrever inteiro. Remover evita dead code. |
| Demonstrações e Filosofia | seções | **inline em `page.tsx`** | Blocos editoriais curtos, sem dados nem estado. Extrair não gera clareza (YAGNI). A spec §11 já não os listava como componentes. |
| Copy da Home | — | extraída para **`src/lib/content/home.ts`** | Torna H1, CTAs, destinos e claims proibidos testáveis sem renderizar RSC assíncrono. Habilita TDD real. |

---

## Estrutura de arquivos planejada

| Arquivo | Ação | Responsabilidade | Server/Client | Dependências |
|---|---|---|---|---|
| `src/lib/content/home.ts` | **Criar** | copy, CTAs, destinos e slugs da Home, tipados | — (módulo) | nenhuma |
| `src/app/(public)/page.tsx` | **Modificar** | composição das 10 seções + metadata + schema | Server | todos abaixo |
| `src/components/marketing/home/HomeHeroDiagram.tsx` | **Criar** | diagrama Processos+Sistemas+Dados → RC2 → Operação | Server | Lucide, tokens |
| `src/components/marketing/home/HomeProblems.tsx` | **Criar** | 4 territórios de problema | Server | `SectionLabel`, `ScrollReveal`, `home.ts` |
| `src/components/marketing/home/HomeCompetencies.tsx` | **Criar** | 4 competências (card interno) | Server | `SectionLabel`, `TrackedLink`, `home.ts` |
| `src/components/marketing/home/HomeProducts.tsx` | **Criar** | Zapbox (externo) + Agenda Confirmada (`/contato`) | Server | `TrackedLink`, `home.ts` |
| `src/components/marketing/home/HomeMethod.tsx` | **Criar** | 5 etapas + link Operação Gerenciada | Server | `SectionLabel`, `TrackedLink`, `home.ts` |
| `src/components/marketing/home/HomeAuthority.tsx` | **Criar** | fatos da proposta §16 + `HomeReviews` | Server | `HomeReviews`, `TrackedLink` |
| `src/components/marketing/home/HomeContent.tsx` | **Criar** | 3 artigos | Server (async) | `BlogCard`, `createPublicClient` |
| `src/components/marketing/HeroActions.tsx` | **Modificar** | CTAs do hero | Client | `tracking.ts` |
| `src/components/marketing/HomeCtaBlock.tsx` | **Modificar** | CTA final (copy) | Server | `CTABlockBase` |
| `src/components/marketing/ServiceCard.tsx` | **Remover** | — | — | — |
| `tests/unit/home/homeContent.test.ts` | **Criar** | copy, CTAs, destinos, claims proibidos | — | `home.ts` |
| `tests/unit/home/homeMetadata.test.ts` | **Criar** | title, description, OG, canonical | — | `page.tsx` |

**Reutilizados sem alteração:** `SectionLabel` · `ScrollReveal` · `FadeIn` ·
`TrackedLink` · `HomeReviews` · `BlogCard` · `buttonVariants` · `Header` ·
`Footer` · `getOrgSettings` · `getWebPageSchema` · `buildOg` · `BASE_URL`.

---

## Matriz de analytics — nomes finais fechados

Evento único: **`cta_click`** (via `trackCtaClick` / `TrackedLink kind="cta"`).
Nenhum evento ou kind novo.

| Superfície | Event | Location | Label | Destination | Histórico/Novo |
|---|---|---|---|---|---|
| Hero — CTA primário | `cta_click` | `home_hero` | `solicitar_diagnostico` | `/contato` | **HISTÓRICO** (label preservado) |
| Hero — CTA secundário | `cta_click` | `home_hero` | `conhecer_solucoes` | `/solucoes` | NOVO |
| Competências — Automação | `cta_click` | `home_solutions` | `automacao_de_processos` | `/solucoes` | NOVO |
| Competências — Integração | `cta_click` | `home_solutions` | `integracao_de_sistemas` | `/solucoes` | NOVO |
| Competências — IA | `cta_click` | `home_solutions` | `ia_para_operacoes` | `/solucoes` | NOVO |
| Competências — Commerce | `cta_click` | `home_solutions` | `operacoes_digitais_commerce` | `/solucoes` | NOVO |
| Competências — CTA geral | `cta_click` | `home_solutions` | `conhecer_solucoes` | `/solucoes` | NOVO |
| Produtos — Zapbox | `cta_click` | `home_products` | `conhecer_zapbox` | `https://zapbox.cloud/` | NOVO |
| Produtos — Agenda Confirmada | `cta_click` | `home_products` | `agenda_confirmada` | `/contato` | NOVO |
| Método — Operação Gerenciada | `cta_click` | `home_method` | `operacao_gerenciada` | `/solucoes#operacao-gerenciada` | NOVO |
| Autoridade — avaliações | `cta_click` | `home_proof` | `avaliacoes` | `/avaliacoes` | NOVO |
| Demonstrações — Zapbox | `cta_click` | `home_demos` | `conhecer_zapbox` | `https://zapbox.cloud/` | NOVO |
| Conteúdo — artigo 1 | `cta_click` | `home_content` | `processos-manuais-o-que-automatizar` | `/blog/processos-manuais-o-que-automatizar` | NOVO |
| Conteúdo — artigo 2 | `cta_click` | `home_content` | `custo-de-agente-de-ia` | `/blog/custo-de-agente-de-ia` | NOVO |
| Conteúdo — artigo 3 | `cta_click` | `home_content` | `governanca-agentes-ia-pmes` | `/blog/governanca-agentes-ia-pmes` | NOVO |
| Conteúdo — ver todos | `cta_click` | `home_content` | `ver_todos_artigos` | `/blog` | NOVO |
| CTA final — primário | `cta_click` | `home_cta_block` | `comenzar_diagnostico` | `/contato` | **HISTÓRICO** (label e location preservados) |
| CTA final — WhatsApp | `whatsapp_click` | `home_cta_block` | `whatsapp` | wa.me | **HISTÓRICO** |

### Consequências conhecidas, a registrar — não corrigir nesta fase

1. **`location: hero_a` / `hero_b` deixam de ser emitidos.** A variante A/B do
   hero (`searchParams.hero`) é aposentada: seu único diferencial eram os
   `socialProofItems`, que migram para a seção Autoridade. A nova location é
   `home_hero`.
2. **O evento de WhatsApp do hero deixa de existir** (`falar_no_whatsapp` em
   `hero_*`): o CTA secundário do hero passa a ser "Conhecer soluções". O
   WhatsApp permanece no CTA final e no botão flutuante.
3. **Zapbox continua sem tracking kind próprio** — dívida `docs/11` §8 / `docs/10`.

---

## Task 1 — Baseline automatizado da Home

**Files**
- Create: `src/lib/content/home.ts`, `tests/unit/home/homeContent.test.ts`
- Modify: —
- Test: `tests/unit/home/homeContent.test.ts`

**Interfaces**
- Consumes: nada
- Produces: `HOME_COPY` (H1, subheadline, eyebrow, assinatura), `HOME_CTAS`
  (label + href + analytics label por CTA), `HOME_BLOG_SLUGS`,
  `FORBIDDEN_HOME_CLAIMS`

`home.ts` exporta objetos `as const` tipados. Nenhum JSX.

- [ ] `mkdir -p tests/unit/home`
- [ ] Escrever `tests/unit/home/homeContent.test.ts` cobrindo: H1 exatamente
      `"Sua operação não precisa de mais ferramentas. Precisa funcionar melhor."`;
      CTA primário label `"Falar sobre minha operação"` → `/contato`; CTA
      secundário `"Conhecer soluções"` → `/solucoes`; nenhuma string de
      `HOME_COPY`/`HOME_CTAS` contém os claims proibidos
      (`menos de 2 minutos`, `24h por dia`, `30 dias`, `sem contratar mais
      ninguém`, `diagnóstico gratuito`, `Solicitar diagnóstico`,
      `Cases de Sucesso`); os 3 slugs de blog são exatamente os aprovados
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → **deve falhar**
      (módulo inexistente)
- [ ] Criar `src/lib/content/home.ts` com o mínimo para passar
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → deve passar
- [ ] `npm run typecheck`
- [ ] `git diff` — revisar
- [ ] `git add src/lib/content/home.ts tests/unit/home/homeContent.test.ts`
- [ ] `git commit -m "test: add home content baseline"`

---

## Task 2 — Metadata e schema

**Files**
- Create: `tests/unit/home/homeMetadata.test.ts`
- Modify: `src/app/(public)/page.tsx` (apenas `generateMetadata` e o objeto de
  schema)
- Test: `tests/unit/home/homeMetadata.test.ts`

**Interfaces**
- Consumes: `buildOg`, `BASE_URL`, `getOrgSettings`
- Produces: `Metadata` da Home

Valores finais:

- `title`: `"RC2 Soluções — Automação, Integrações e IA para Operações"`
- `description`: `"Consultoria e implementação de automação de processos, integração de sistemas e IA para operações de PMEs que cresceram e precisam funcionar melhor."`
- `og:title`: igual ao `title`
- `og:description`: `"Automação de processos, integração de sistemas e IA para operações. Para PMEs cuja operação cresceu e precisa funcionar melhor."`
- `alternates.canonical`: `` `${BASE_URL}/` `` — **inalterado**
- `keywords` do schema: `"automação de processos, integração de sistemas, IA para operações, operações digitais e commerce, consultoria de operação, PME"`

- [ ] Escrever `tests/unit/home/homeMetadata.test.ts` que faz `vi.mock` de
      `@/lib/schema` (`getOrgSettings`) e chama `generateMetadata()`; asserta
      title, description, `og.url`, `alternates.canonical`, e ausência dos
      termos `lead`, `chatbot`, `WhatsApp`, `atendimento automático` no title e
      na description
- [ ] `npm run test -- tests/unit/home/homeMetadata.test.ts` → **deve falhar**
- [ ] Atualizar `generateMetadata` e o `getWebPageSchema` da Home
- [ ] `npm run test -- tests/unit/home/homeMetadata.test.ts` → deve passar
- [ ] `npm run typecheck && npm run build`
- [ ] `git add "src/app/(public)/page.tsx" tests/unit/home/homeMetadata.test.ts`
- [ ] `git commit -m "feat: update home metadata to operations positioning"`

---

## Task 3 — Hero

**Files**
- Create: `src/components/marketing/home/HomeHeroDiagram.tsx`
- Modify: `src/app/(public)/page.tsx` (bloco hero), `src/components/marketing/HeroActions.tsx`
- Test: `tests/unit/home/homeContent.test.ts` (estende)

**Interfaces**
- Consumes: `HOME_COPY`, `HOME_CTAS`, `SectionLabel`, `HeroActions`, `ScrollReveal`
- Produces: seção `<section>` do hero com `<h1>` único

Composição do hero (inline em `page.tsx`): `SectionLabel` (eyebrow) → `<h1>` →
subheadline → `HeroActions` → assinatura *"Tecnologia que funciona. Operação que
entrega."* → `HomeHeroDiagram`.

`HomeHeroDiagram`: SVG inline com `role="img"` e `aria-label="Processos,
sistemas e dados convergem para a RC2 e resultam em uma operação integrada."`.
Sem `<canvas>`, sem dependência nova. Três nós de entrada → nó RC2 → nó saída.
Cores só por token. Em `< 768px` empilha na vertical (setas viram `rotate-90`
via classe utilitária, não JS). `prefers-reduced-motion` já é tratado pelo
sistema de reveals; o diagrama é estático.

`HeroActions`: remove a prop `variant`; primário passa a
`"Falar sobre minha operação"` → `/contato` com **label histórico
`solicitar_diagnostico`** e `location: "home_hero"`; secundário passa de
WhatsApp para `"Conhecer soluções"` → `/solucoes`, label `conhecer_solucoes`.

- [ ] Estender `homeContent.test.ts` com asserts do eyebrow e da assinatura
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → falha
- [ ] Criar `HomeHeroDiagram.tsx`
- [ ] Modificar `HeroActions.tsx` (remover `variant`, novos rótulos/destinos)
- [ ] Substituir o bloco hero em `page.tsx`; remover `heroVariant`,
      `searchParams`, `socialProofItems` e o tipo `Props` se ficarem sem uso
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → passa
- [ ] `npm run typecheck && npm run lint`
- [ ] Validação visual: dev server + Playwright em 390/768/1440, conferir H1
      único, diagrama legível e `scrollWidth == innerWidth`
- [ ] `git commit -m "feat: rebuild home hero around operations positioning"`

---

## Task 4 — Problemas operacionais

**Files**
- Create: `src/components/marketing/home/HomeProblems.tsx`
- Modify: `src/app/(public)/page.tsx`, `src/lib/content/home.ts`
- Test: `tests/unit/home/homeContent.test.ts`

**Interfaces**
- Consumes: `HOME_PROBLEMS` de `home.ts`, `SectionLabel`, `ScrollReveal`, `FadeIn`
- Produces: `<section>` com `<h2>` e `<ul>` de 4 territórios

Quatro territórios, cada um com título curto e 2–3 exemplos concretos:
trabalho manual · sistemas desconectados · informação espalhada · operação
digital fragmentada. Exemplos permitidos: copiar e colar entre sistemas ·
planilha usada como sistema · informação duplicada · sistemas isolados ·
tarefas dependentes de pessoas específicas · retrabalho · falta de
rastreabilidade.

Formato: **lista semântica**, não grid de cards — evita repetir a composição da
Task 5.

- [ ] Adicionar teste: `HOME_PROBLEMS` tem exatamente 4 territórios; nenhum
      título contém `WhatsApp`, `lead` ou `atendimento`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → falha
- [ ] Criar `HomeProblems.tsx` e `HOME_PROBLEMS`
- [ ] Substituir o bloco "Para quem é" em `page.tsx`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → passa
- [ ] `npm run typecheck && npm run lint`
- [ ] `git commit -m "feat: add home operational problems section"`

---

## Task 5 — Competências

**Files**
- Create: `src/components/marketing/home/HomeCompetencies.tsx`
- Modify: `src/app/(public)/page.tsx`, `src/lib/content/home.ts`
- Test: `tests/unit/home/homeContent.test.ts`

**Interfaces**
- Consumes: `HOME_COMPETENCIES`, `SectionLabel`, `TrackedLink`
- Produces: `<section>` com `<h2>` e 4 `<h3>`

**Decisão técnica:** não reutilizar `ServiceCard`. Ele é tipado a `Service` e
tem `serviceResolveMap` com os 5 slugs legados; adaptá-lo exigiria reescrever
seu contrato. Como seu **único consumidor é a Home**, cria-se um card mínimo
**interno** a `HomeCompetencies` (não exportado, sem arquivo próprio).

Cada competência: nome (`<h3>`), o problema que resolve, o que a RC2 faz.
**Sem preço, prazo ou métrica.** Rótulo de link **específico por competência**
(resolve A11Y-04) — nunca "Ver serviço" repetido. CTA geral "Conhecer soluções"
→ `/solucoes`.

- [ ] Teste: `HOME_COMPETENCIES` tem exatamente 4 itens com os nomes aprovados;
      nenhum item cita `site`, `landing page`, `chatbot` ou `e-commerce` como
      oferta; todos os `href` apontam para `/solucoes`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → falha
- [ ] Criar `HomeCompetencies.tsx` e `HOME_COMPETENCIES`
- [ ] Remover o grid de 5 `ServiceCard` de `page.tsx` e o import de `services`
      se ficar sem uso
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → passa
- [ ] `npm run typecheck && npm run lint`
- [ ] `git commit -m "feat: replace five services grid with four competencies"`

---

## Task 6 — Produtos

**Files**
- Create: `src/components/marketing/home/HomeProducts.tsx`
- Modify: `src/app/(public)/page.tsx`, `src/lib/content/home.ts`
- Test: `tests/unit/home/homeContent.test.ts`

**Interfaces**
- Consumes: `HOME_PRODUCTS`, `TrackedLink`
- Produces: `<section>` com dois blocos

**Zapbox:** produto próprio; `href="https://zapbox.cloud/"`,
`target="_blank"`, `rel="noopener noreferrer"`; `TrackedLink` com
`kind: "cta"`, `location: "home_products"`, `label: "conhecer_zapbox"`.
**Nenhum tracking kind novo.** Território declarado (WhatsApp, equipe,
atendimento, vendas, CRM, Sales AI). Proibido descrevê-lo como serviço RC2.

**Agenda Confirmada:** solução vertical para clínicas. Problema: confirmações
manuais, faltas, horários vagos, trabalho da recepção. CTA
**"Falar sobre agenda e confirmações"** → **`/contato`**.
**Proibido qualquer `href` contendo `/solucoes/agenda-confirmada`.**

- [ ] Teste: nenhum valor de `HOME_PRODUCTS` contém a string
      `/solucoes/agenda-confirmada`; o destino do Zapbox é exatamente
      `https://zapbox.cloud/`; o CTA da Agenda Confirmada aponta para `/contato`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → falha
- [ ] Criar `HomeProducts.tsx` e `HOME_PRODUCTS`
- [ ] Inserir a seção em `page.tsx`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → passa
- [ ] `npm run typecheck && npm run lint`
- [ ] `git commit -m "feat: add home products section"`

---

## Task 7 — Método

**Files**
- Create: `src/components/marketing/home/HomeMethod.tsx`
- Modify: `src/app/(public)/page.tsx`, `src/lib/content/home.ts`
- Test: `tests/unit/home/homeContent.test.ts`

**Interfaces**
- Consumes: `HOME_METHOD`, `SectionLabel`, `TrackedLink`
- Produces: `<section>` com `<h2>` e `<ol>` de 5 etapas

Etapas: Entender → Desenhar → Implantar → Medir → Evoluir. `<ol>` porque a
ordem é informação; conectores visuais com `aria-hidden`.

**"Entender"** deve dizer explicitamente que a conversa inicial serve para
contexto, problema, fit e próximo passo — e que levantamento estruturado,
arquitetura e roadmap pertencem ao **Discovery Operacional**, etapa paga.
**Não repetir a faixa de preço na Home.**

**"Evoluir"** menciona a **Operação Gerenciada** com link para
`/solucoes#operacao-gerenciada`.

- [ ] Teste: `HOME_METHOD` tem 5 etapas na ordem aprovada; nenhuma string do
      método contém `R$`; a etapa "Entender" contém a palavra `Discovery`; o
      link da Operação Gerenciada é `/solucoes#operacao-gerenciada`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → falha
- [ ] Criar `HomeMethod.tsx` e `HOME_METHOD`
- [ ] Inserir em `page.tsx`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → passa
- [ ] `npm run typecheck && npm run lint`
- [ ] `git commit -m "feat: add home method section"`

---

## Task 8 — Autoridade e prova

**Files**
- Create: `src/components/marketing/home/HomeAuthority.tsx`
- Modify: `src/app/(public)/page.tsx`, `src/lib/content/home.ts`
- Test: `tests/unit/home/homeContent.test.ts`

**Interfaces**
- Consumes: `HOME_AUTHORITY`, `HomeReviews`, `SectionLabel`, `TrackedLink`
- Produces: `<section>` com `<h2>`, fatos e avaliações

**Fatos autorizados — proposta §16, exatamente estes e nada além:**

- Robson Azevedo, **mais de 20 anos** em tecnologia e operações digitais
- **Edenred** — coordenou operação de suporte/monitoramento **24×7 para 10
  países** da América Latina
- **Uno Healthcare** — canal D2C nos EUA: **US$ 384 mil** em receita e **636
  pedidos** em **~11 meses**; liderou equipe de **10 profissionais**
- **Forta Tech** — Shopify, Tray, Totvs, logística, CRM e atendimento com IA

**Proibido na Home** (proposta §16, explícito): lista de cursos · dezenas de
ferramentas · formação completa · tecnologias individuais.

`HomeReviews` é renderizado **sem alteração**. Rótulo público da área de prova:
**"Avaliações e Projetos"**. CTA "Ver avaliações e projetos" → `/avaliacoes`.
**Proibido "Cases de Sucesso".**

- [ ] Teste: `HOME_AUTHORITY` não contém `Cases de Sucesso`; contém
      `Edenred`, `Uno Healthcare` e `Forta Tech`; o CTA aponta para
      `/avaliacoes`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → falha
- [ ] Criar `HomeAuthority.tsx` e `HOME_AUTHORITY`
- [ ] Substituir o bloco de avaliações atual em `page.tsx`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → passa
- [ ] `npm run typecheck && npm run lint`
- [ ] `git commit -m "feat: add home authority section"`

---

## Task 9 — Demonstrações

**Files**
- Create: —
- Modify: `src/app/(public)/page.tsx`, `src/lib/content/home.ts`
- Test: `tests/unit/home/homeContent.test.ts`

**Interfaces**
- Consumes: `HOME_DEMOS`, `TrackedLink`
- Produces: `<section>` inline

**Diferença funcional entre Produtos e Demonstrações — para evitar
redundância:**

- **Produtos (Task 6)** responde *"o que a RC2 oferece"*: catálogo, território
  e a quem se destina. Zapbox aparece como **oferta**.
- **Demonstrações (Task 9)** responde *"o que você pode verificar agora"*:
  prova de execução. Zapbox aparece como **ativo testável pelo visitante**, com
  ângulo diferente — não repete a descrição de produto.

Dois itens, ambos verificáveis:

1. **Zapbox** — produto no ar, testável. CTA para `zapbox.cloud`,
   `location: home_demos`, `label: conhecer_zapbox`.
2. **O agente de IA do próprio comercial da RC2** — já publicado hoje:
   *"A RC2 usa no próprio comercial o que implementa nos clientes: um agente de
   IA filtra, e quem conversa com você é o Robson."* **Sem CTA próprio** — o
   visitante verifica ao acionar o contato.

**Valéria fica fora** (`docs/12` §19 DE-1). **Agenda Confirmada não aparece
aqui** — não há ativo demonstrável.

**YAGNI:** dois itens sem dados nem estado; extrair componente não gera
clareza. Fica inline em `page.tsx`.

- [ ] Teste: `HOME_DEMOS` tem 2 itens; nenhum contém `Valéria`; nenhum item sem
      destino verificável tem `href`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → falha
- [ ] Implementar a seção inline e `HOME_DEMOS`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → passa
- [ ] `npm run typecheck && npm run lint`
- [ ] `git commit -m "feat: add home demonstrations section"`

---

## Task 10 — Filosofia

**Files**
- Create: —
- Modify: `src/app/(public)/page.tsx`, `src/lib/content/home.ts`
- Test: `tests/unit/home/homeContent.test.ts`

**Interfaces**
- Consumes: `HOME_PHILOSOPHY`, `SectionLabel`
- Produces: `<section>` inline, bloco tipográfico

Tese: **"A IA não substitui uma operação mal estruturada."**

Corpo curto: tecnologia não corrige processo ruim sozinha · automação precisa de
processo · IA precisa de contexto, dados e governança · integração reduz a
dependência de pessoas como ponte entre sistemas.

Base editorial: o bloco "Diferencial" atual (*"Tecnologia com visão de
operação…"*), ajustando a menção a "do diagnóstico à implantação" para não
conflitar com a Fase 3.

**Proibido:** grid de cards · manifesto longo · claim adicional.

- [ ] Teste: `HOME_PHILOSOPHY.these` é exatamente a tese aprovada; o corpo tem
      no máximo 4 itens
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → falha
- [ ] Implementar inline e `HOME_PHILOSOPHY`; remover o bloco "Diferencial"
      antigo
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → passa
- [ ] `npm run typecheck && npm run lint`
- [ ] `git commit -m "feat: add home philosophy section"`

---

## Task 11 — Conteúdo

**Files**
- Create: `src/components/marketing/home/HomeContent.tsx`
- Modify: `src/app/(public)/page.tsx`
- Test: `tests/unit/home/homeContent.test.ts`

**Interfaces**
- Consumes: `HOME_BLOG_SLUGS`, `BlogCard`, `createPublicClient`
- Produces: `<section>` async com 3 `BlogCard`

**Os três slugs** `OBSERVED` — verificados em produção:

| # | Slug | Title | Tema | Motivo da seleção |
|---|---|---|---|---|
| 1 | `processos-manuais-o-que-automatizar` | Processos manuais: o que vale automatizar | Automação de processos | Cobre o pilar 1 diretamente |
| 2 | `custo-de-agente-de-ia` | Custo de agente de IA: onde o gasto se concentra | Operação / economia de IA | Melhor substituto disponível para o eixo "operação" |
| 3 | `governanca-agentes-ia-pmes` | Governança de agentes de IA para PMEs | IA aplicada / governança | Cobre o pilar 3 e a tese de governança |

**Lacuna registrada** `docs/12` §19 DE-2: **não existe artigo sobre integração
de sistemas**. A seleção usa o melhor disponível; pauta editorial futura.

**O slug corrompido não é usado** — há alternativas válidas.

`HomeContent` é **Server Component async** e faz a query diretamente com
`createPublicClient`, filtrando `.in("slug", HOME_BLOG_SLUGS)` e
`.eq("status","published")`, selecionando os mesmos campos que `/blog`.
**Não se cria helper compartilhado nesta fase**: `/blog`, `/blog/[slug]` e o
preview já fazem query inline, e extrair um helper exigiria refatorar páginas
fora do escopo da Fase 4. Registrar como possível melhoria futura.

Se a query retornar menos de 3 posts, a seção renderiza os que existirem — sem
placeholder e sem erro.

CTA "Ver todos os artigos" → `/blog`.

- [ ] Teste: `HOME_BLOG_SLUGS` tem exatamente os 3 slugs acima e **não** contém
      `solucosolucoes`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → falha
- [ ] Criar `HomeContent.tsx`
- [ ] Inserir em `page.tsx`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → passa
- [ ] Validar em dev que os 3 cards renderizam com dados reais
- [ ] `npm run typecheck && npm run lint`
- [ ] `git commit -m "feat: add home content section"`

---

## Task 12 — CTA final

**Files**
- Create: —
- Modify: `src/components/marketing/HomeCtaBlock.tsx`
- Test: `tests/unit/home/homeContent.test.ts`

**Interfaces**
- Consumes: `CTABlockBase`
- Produces: bloco de CTA final

Novo título: **"Tem um processo que ainda depende demais de planilha, copiar e
colar ou memória?"**

Nova description: reforça **conversa de 20 a 30 minutos, sem compromisso**, para
entender o contexto e indicar o próximo passo.

`primaryLabel` permanece **"Falar sobre minha operação"** → `/contato`
(já corrigido na Fase 2).

**Analytics preservado integralmente:** `location: "home_cta_block"`,
`label: "comenzar_diagnostico"`, e o bloco de WhatsApp inalterado. Divergência
consciente da spec §7 (`home_final_cta`), justificada acima.

**Proibido:** reintroduzir diagnóstico gratuito ou prometer roadmap,
arquitetura, mapeamento ou priorização.

- [ ] Teste: o título e a description de `HomeCtaBlock` não contêm
      `diagnóstico gratuito`, `roadmap`, `mapa de oportunidades` nem
      `Solicitar diagnóstico`
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → falha
- [ ] Modificar `HomeCtaBlock.tsx` (apenas `title` e `description`)
- [ ] `npm run test -- tests/unit/home/homeContent.test.ts` → passa
- [ ] `npm run typecheck && npm run lint`
- [ ] `git commit -m "feat: realign home final cta copy"`

---

## Task 13 — Integração da Home e limpeza

**Files**
- Modify: `src/app/(public)/page.tsx`
- Remove: `src/components/marketing/ServiceCard.tsx`
- Test: `npm run test`

Ordem final em `page.tsx`:

1. Hero · 2. Problemas · 3. Competências · 4. Produtos · 5. Método ·
6. Autoridade e prova · 7. Demonstrações · 8. Filosofia · 9. Conteúdo ·
10. CTA final

**Destino de cada bloco atual:**

| Bloco atual | Destino |
|---|---|
| Hero (leads/2min/24h/30dias) | **substituído** pela Task 3 |
| Frase institucional | **preservada** no hero |
| Agente de IA no comercial | **movido** para Demonstrações (Task 9) |
| "Para quem é" | **substituído** por Problemas (Task 4) |
| "Escolha pela sua dor" | **removido**; dores migram para Problemas; links para `/solucoes/*` saem da Home |
| Grid dos 5 serviços | **substituído** por Competências (Task 5) |
| Card "Próximo passo" do grid | **removido**; o próximo passo vive no Método e no CTA final |
| "O que a RC2 não é" | **preservado**, reposicionado junto à Filosofia |
| "Diferencial" | **refatorado** em Filosofia (Task 10) |
| Avaliações | **preservado** dentro de Autoridade (Task 8) |
| CTA final | **refatorado** (Task 12) |
| `socialProofItems` (variante B) | **movido** para Autoridade |

- [ ] Verificar que `ServiceCard` não tem mais consumidor:
      `grep -rn "ServiceCard" src/`
- [ ] `rm src/components/marketing/ServiceCard.tsx`
- [ ] Remover imports órfãos de `page.tsx` (`services`, `ServiceCard`,
      `Check`/`ArrowRight` se sem uso, `searchParams`, `heroVariant`)
- [ ] `npm run typecheck` → sem erro de import
- [ ] `npm run lint` → **0 errors**, e nenhum warning novo além dos 12
      preexistentes
- [ ] `npm run test` → 19 arquivos + os novos, todos passando
- [ ] `npm run build`
- [ ] `git diff` completo — revisar
- [ ] `git commit -m "refactor: compose new home and remove legacy service card"`

---

## Task 14 — Regressão responsiva (Playwright)

**Files**
- Create: `.playwright-mcp/phase-4/` (artefatos locais, **não versionados**)

Viewports: **390×844 · 768×1024 · 1024×768 · 1440×900**.

- [ ] `mkdir -p .playwright-mcp/phase-4`
- [ ] `git check-ignore -v .playwright-mcp/phase-4/` → confirmar ignorado
- [ ] Subir dev: `npm run dev`; aguardar `http://localhost:3000/`
- [ ] Para cada viewport: navegar `/`, screenshot `fullPage` em
      `.playwright-mcp/phase-4/home-<viewport>.png`, e avaliar
      `document.documentElement.scrollWidth === window.innerWidth`
- [ ] Verificar a ordem das 10 seções pelo DOM (sequência de `<section>` e seus
      `<h2>`)
- [ ] Conferir: hero, diagrama, CTAs, produtos, método, reviews, artigos, CTA
      final, Header e Footer em cada viewport
- [ ] **Não sobrescrever** `.playwright-mcp/baseline/` nem
      `.playwright-mcp/phase-0/`
- [ ] Registrar qualquer overflow como bloqueante

---

## Task 15 — Acessibilidade

- [ ] `browser_snapshot` da Home
- [ ] Confirmar **um único `<h1>`**
- [ ] Confirmar hierarquia `<h2>`/`<h3>` sem salto (nenhum H1→H3)
- [ ] Confirmar landmarks: `header`, `nav`, `main#main-content`, `footer`
- [ ] Confirmar skip link presente e funcional
- [ ] Confirmar que nenhum link tem rótulo genérico repetido
- [ ] Confirmar `aria-label`/`role="img"` no `HomeHeroDiagram`
- [ ] Teclado: `Tab`, `Shift+Tab`, `Enter`; no menu mobile, `Escape` fecha e
      devolve o foco ao gatilho
- [ ] Confirmar foco visível em todos os CTAs, incluindo os sobre navy
- [ ] Confirmar `aria-hidden` nos decorativos e conectores
- [ ] Confirmar que nenhuma informação depende só de cor
- [ ] Registrar qualquer regressão de Header/Footer como bloqueante

---

## Task 16 — Console e network

- [ ] Com dev rodando, abrir `/` e coletar `browser_console_messages` nível
      `warning`
- [ ] Coletar `browser_network_requests` e verificar ausência de 4xx/5xx
      próprios
- [ ] Classificar cada erro como **PREEXISTENTE** (Meta Pixel `PixelID: null`,
      Ahrefs bloqueado por CSP, DoubleClick bloqueado por CSP) ou
      **REGRESSÃO_FASE_4**
- [ ] Qualquer REGRESSÃO_FASE_4 é bloqueante
- [ ] **Não corrigir** os erros preexistentes nesta fase

---

## Task 17 — Revisão de copy automatizada (Unicode-safe)

`grep` com bracket expression acentuada falha neste ambiente (locale C trata
`[óo]` como bytes). **Usar Python com UTF-8**, como nas Fases 2 e 3.

- [ ] Criar script temporário **no scratchpad**, fora do repositório, que
      percorre `src/` lendo `.ts`/`.tsx` em UTF-8 e busca:
      `diagnóstico gratuito` · `Solicitar diagnóstico` ·
      `primeira resposta em menos de 2 minutos` · `24h por dia` ·
      `no ar em 30 dias` · `sem contratar mais ninguém` · `Cases de Sucesso` ·
      `chatbot`
- [ ] Resultado exigido nos arquivos da Home: **zero ocorrências**
- [ ] Buscar também `lead`, `WhatsApp`, `atendimento` — **não são proibidos**.
      Classificar cada ocorrência por contexto: legítima (canal auxiliar,
      território Zapbox nomeado corretamente, exemplo dentro de contexto
      operacional) ou regressão (território como eixo central da Home)
- [ ] **Não apagar cegamente.** Cada remoção precisa de justificativa
- [ ] Registrar o resultado no corpo do PR

---

## Task 18 — Qualidade final

- [ ] `npm run typecheck` → PASS
- [ ] `npm run lint` → **0 errors**, 12 warnings preexistentes, nenhum novo
- [ ] `npm run test` → todos os arquivos passando (19 preexistentes + novos)
- [ ] `npm run audit:brand` → nenhuma violação bloqueante
- [ ] `npm run build` → PASS
- [ ] **Não corrigir** warning não relacionado

**Regressão obrigatória — baseline Fase 0, verificar no código:**

- [ ] `grep -rn "https://rc2solucoes\.com\.br" src/` → **0**
- [ ] `grep -rn "alternates: { canonical" src/app/` → **10**
- [ ] `grep -c '^ *required$' src/components/marketing/ContactForm.tsx` → **8**
- [ ] `grep -c 'noValidate' src/components/marketing/ContactForm.tsx` → **1**
- [ ] `grep -c 'break-words' src/components/layout/Footer.tsx` → **1**
- [ ] `grep -rnoE '"(solicitar_diagnostico|diagnostico_gratuito|comenzar_diagnostico)"' src/ | wc -l` → **15**

---

## Task 19 — PR da Fase 4

- [ ] `git status` → working tree limpa
- [ ] `git log --oneline main..HEAD` → revisar todos os commits
- [ ] `git diff main..HEAD --stat` → revisar arquivos
- [ ] `git diff main..HEAD` → revisão completa do diff
- [ ] Confirmar zero alteração em: `package.json`, `package-lock.json`,
      `.env.local`, `.mcp.json`, `supabase/`, `migrations/`, `next.config.ts`,
      `sitemap.ts`, `robots.ts`, `docs/08`–`docs/12`
- [ ] Confirmar que nenhum screenshot foi versionado:
      `git ls-files ".playwright-mcp/**"` → vazio
- [ ] `git push -u origin <branch-de-implementacao>`
- [ ] `gh pr list --repo rc2solucoes-beep/rcc-02-site --head <branch> --state all`
      → confirmar que não existe PR
- [ ] `gh pr create` — PR único, com: antes/depois do posicionamento, as 10
      seções, matriz de analytics, o que foi preservado, o que saiu da Home sem
      remover URL, validações e riscos
- [ ] `gh pr checks <n> --watch` → Vercel PASS
- [ ] Preview: se `PREVIEW_RUNTIME_BLOQUEADO_POR_DEPLOYMENT_PROTECTION`, **não
      contornar**; usar checks + validação local como evidência
- [ ] **PARAR.** Não fazer merge — é tarefa separada

---

## Estratégia de commits

Sete commits revisáveis, um por unidade lógica:

1. `test: add home content baseline` (Task 1)
2. `feat: update home metadata to operations positioning` (Task 2)
3. `feat: rebuild home hero around operations positioning` (Task 3)
4. Problemas + Competências (Tasks 4–5)
5. Produtos + Método (Tasks 6–7)
6. Autoridade + Demonstrações + Filosofia (Tasks 8–10)
7. Conteúdo + CTA final + integração/limpeza (Tasks 11–13)

Cada commit deve deixar `npm run typecheck` e `npm run test` passando.

**Estados intermediários na branch podem ter narrativa mista** — hero novo
convivendo com blocos antigos. Isso é aceitável **na branch**; o release só
ocorre pelo PR final, com as 10 seções completas.

---

## Riscos de implementação

| # | Risco | Mitigação |
|---|---|---|
| 1 | Testes `.test.tsx` **não rodam** (config só inclui `.test.ts`) — um teste novo poderia passar despercebido sem nunca executar | Todo teste desta fase usa `.test.ts` + `createElement`. Verificar a contagem de arquivos na saída do `npm run test` após cada commit |
| 2 | A Home é RSC `async` — Testing Library não a renderiza | Testar constantes exportadas de `home.ts` e `generateMetadata`; markup composto via Playwright |
| 3 | Remover `ServiceCard` pode quebrar consumidor não mapeado | `grep -rn "ServiceCard" src/` antes de remover; hoje há **1** consumidor (a Home) |
| 4 | Aposentar a variante A/B do hero interrompe as séries `hero_a`/`hero_b` | Consequência registrada na matriz de analytics; nenhum evento é renomeado — a superfície deixa de existir |
| 5 | O diagrama do hero pode causar overflow em 768px | Container com `overflow-hidden`; validar `scrollWidth` nos 4 viewports (Task 14) |
| 6 | Query de 3 posts pode retornar menos que 3 | A seção renderiza o que existir, sem placeholder nem erro |
| 7 | Perda temporária de links internos para `/servicos/*` e `/solucoes/*` | Risco aceito e registrado em `docs/12` §13; a Fase 5 redistribui. **Nenhuma URL removida** |
| 8 | Refatorar `HeroActions` pode alterar analytics por engano | O label `solicitar_diagnostico` é preservado explicitamente; teste de payload |

---

## Dependências externas remanescentes

| ID | Dado | Status na Fase 4 |
|---|---|---|
| DE-1 | Valéria — ativo verificável | **Fora da fase.** Nenhuma menção |
| DE-2 | Artigo sobre integração de sistemas | Seleção usa o melhor disponível; pauta futura |
| DE-3 | Uso da narrativa curta da proposta §16 na íntegra | A Task 8 usa apenas os fatos; se autorizada, entra sem mudar escopo |

Nenhuma bloqueia a execução.

---

## Fora do escopo da execução

Criar `/solucoes/agenda-confirmada` · consolidar `/servicos` → `/solucoes` ·
redirects · sitemap · robots · migrar URLs de território Zapbox · renomear
`/avaliacoes` · corrigir o slug corrompido · revisar taxonomia de analytics ·
instrumentar o link do Zapbox · corrigir o teste órfão `.test.tsx` · alterar
`/contato`, preço do Discovery ou formato da Operação Gerenciada · merge do PR.
