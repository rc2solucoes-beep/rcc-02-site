# Fase 6D — Ponte RC2 → Zapbox — Implementation Plan

> Execute task-by-task. `docs/19-fase-6-zapbox-handoff-decision.md` is the
> authoritative commercial/architectural decision for this unit.

**Goal:** criar uma única página `/zapbox`, indexável e mensurável, que explique
a relação entre RC2 e Zapbox e encaminhe o visitante ao produto sem duplicar a
landing externa.

**Architecture:** página RC2 curta, WebPage schema, canonical própria, sitemap e
llms discovery; nenhum redirect ou mudança de navegação nesta unidade.

**Decisões autoritativas:** `CD-1 = BRIDGE_FIRST` · `CD-3 = CHANNEL_AND_OBJECT`
(`docs/19`).

**Baseline:** `main @ 2a0d67f`; branch `design/phase-6-zapbox-handoff`; commit
`f4ee8b2` intacto.

---

## 0. Achado que define o destino externo

`OBSERVED` — medido nesta tarefa:

| URL | Resposta |
|---|---|
| `https://zapbox.cloud/` (apex) | **308** |
| `https://www.zapbox.cloud/` | **200** |
| `https://www.zapbox.cloud/sales-ai` · `/crm-vendas` · `/automacoes` · `/integracoes` | **200** |

O canonical do produto é **`https://www.zapbox.cloud`**, com `www`.

`OBSERVED` — **os 6 links atuais da RC2 para o Zapbox usam o apex** e, portanto,
custam um salto extra cada:

| Arquivo | Linha |
|---|---|
| `src/lib/content/home.ts` | 167, 254 |
| `src/lib/content/navigation.ts` | 53 |
| `src/components/marketing/solucoes/SolutionsCompetencies.tsx` | 160 |
| `src/components/marketing/solucoes/SolutionsManagedOps.tsx` | 90 |
| `src/app/llms.txt/route.ts` | 28 |

`INFERRED` — **a ponte usa o `www` desde o primeiro dia.** Os 6 links
existentes **não são corrigidos aqui**: quatro deles mudam de destino na
unidade 6E (passam a apontar para `/zapbox`), e tocá-los agora violaria o
isolamento desta unidade. Registrado como **`ZAPBOX_APEX_HOP_DEBT`**, a ser
resolvido em 6E.

---

## 1. Escopo

### Entra

Uma rota nova, `/zapbox`, com metadata, schema, analytics, sitemap, `llms.txt`
e testes.

### Não entra

Migração de URL · redirect de qualquer tipo · alteração de Header, Footer, Home,
`/solucoes`, `/contato` ou `/solucoes-com-ia` · correção dos 6 links apex ·
Agenda Confirmada · `CD-2` · `CD-4`.

**A ponte precisa poder ser publicada e validada isoladamente**, antes de
receber tráfego. É isso que torna a decisão reversível.

---

## 2. Arquitetura de conteúdo

`INFERRED` — **6 seções**, uma `<h1>` e **5 `<h2>`**, na ordem que responde às
seis perguntas de `docs/19` §5.1:

| # | Seção | Responde |
|---|---|---|
| 1 | Hero | por que estou vendo Zapbox no site da RC2? |
| 2 | Contexto de marca | qual é a relação entre os dois? |
| 3 | Quando o Zapbox é a solução | que problema ele resolve? |
| 4 | O que continua com a RC2 | o que **não** é território do produto? |
| 5 | Como os dois se conectam | e a integração entre eles? |
| 6 | CTA final | para onde vou agora? |

Sem seção de preços, de features completas, de demonstração, de formulário ou
de Operação Gerenciada.

---

## 3. Copy fechada

Toda a copy abaixo é literal e vai para o código sem paráfrase.

### 3.1 Hero

- **eyebrow:** `Produto próprio`
- **h1:** **`Quando o problema é o WhatsApp, a resposta da RC2 chama-se Zapbox.`**
- **subheadline:** `O Zapbox é o produto da RC2 para atendimento e vendas pelo WhatsApp — equipe no mesmo número, histórico, CRM comercial e Sales AI. Esta página explica o que pertence a ele, o que continua sendo trabalho da RC2 e para onde ir a partir daqui.`

`INFERRED` — o H1 evita `"Conheça o Zapbox"` (genérico e fraco) e **não repete
a tagline do produto** (`"Transforme seu WhatsApp em uma operação organizada"`),
o que transformaria a ponte em landing duplicada. Ele nomeia a relação — que é
justamente o que só existe no domínio da RC2.

### 3.2 Contexto de marca

- **h2:** `Zapbox é um produto da RC2 Soluções`
- **corpo:**

```
O Zapbox é desenvolvido e mantido pela RC2. É a mesma equipe, a mesma forma de
trabalhar e o mesmo canal de contato — o produto apenas tem site e ambiente
próprios, porque tem operação própria.

Quando a necessidade é atendimento ou vendas pelo WhatsApp, a RC2 não monta uma
solução sob medida: encaminha para o produto que já resolve isso.
```

`OBSERVED` — consistente com o que `zapbox.cloud` publica: `"Zapbox by RC2
Soluções"` no rodapé, `parentOrganization: RC2 Soluções` no JSON-LD,
`publisher: RC2 Soluções` na metadata e `contato@rc2solucoes.com.br` como
e-mail do produto.

**Proibido:** "empresa separada", "subsidiária", "spin-off", ou qualquer
estrutura societária — nenhuma fonte a descreve.

### 3.3 Quando o Zapbox é a solução

- **h2:** `Quando o Zapbox é a solução adequada`
- **lead:** `Se o objeto do problema é uma conversa, um lead ou uma venda, o lugar é o Zapbox.`

**`CORE_CAPABILITIES`** — cinco itens, todos verificados em `zapbox.cloud`:

```
Vários atendentes trabalhando no mesmo número, com histórico e responsável por conversa.
Leads que chegam pelo WhatsApp organizados em pipeline comercial.
CRM ligado ao atendimento, em vez de planilha paralela.
Sales AI que atende, qualifica e passa para uma pessoa quando o caso exige.
Automações dentro do próprio fluxo de atendimento e vendas.
```

**Roteamento por intenção** — três links externos, com `label` = slug:

| Intenção | Destino |
|---|---|
| `Atendimento e qualificação com IA` | `https://www.zapbox.cloud/sales-ai` |
| `Leads, pipeline e CRM comercial` | `https://www.zapbox.cloud/crm-vendas` |
| `Automações no fluxo de atendimento` | `https://www.zapbox.cloud/automacoes` |

`INFERRED` — isso é **roteamento, não catálogo**: três destinos por intenção, e
não a lista de features do produto. É o que `docs/19` §10 já previa ao definir
`label` = slug da rota de destino.

**`OPTIONAL_DETAIL` — deliberadamente fora:** planos, preços, número de
usuários, integrações nominais, capturas de tela, comparativos.

### 3.4 O que continua com a RC2

- **h2:** `Quando o trabalho continua sendo da RC2`
- **lead:** `Se o objeto do problema é um processo, um sistema ou um dado, o Zapbox não resolve — e não deveria.`

```
O processo roda no braço e depende de quem lembra da regra.
Os sistemas não conversam e alguém faz a ponte digitando duas vezes.
Há interesse em IA, mas sobre processo interno, não sobre conversa com cliente.
A operação digital cresceu em partes: plataforma, ERP, logística e dados separados.
O que já foi implantado precisa de acompanhamento técnico contínuo.
```

- **link interno:** `Ver as competências da RC2` → `/solucoes`

`INFERRED` — enquadramento **complementar, nunca comparativo**. Nada de
"RC2 versus Zapbox": a pergunta é qual caminho serve a qual problema.

### 3.5 Como os dois se conectam

- **h2:** `Quando o Zapbox precisa conversar com os outros sistemas`
- **corpo:**

```
O Zapbox opera o atendimento e o funil comercial. Os pedidos, cadastros e dados
que nascem ali normalmente precisam chegar ao ERP, ao financeiro ou às demais
ferramentas da operação.

Essa ligação entre plataformas é trabalho de integração — e é aí que a RC2
entra, quando contratada para isso. O fluxo entre os sistemas é da RC2; o
atendimento que roda dentro do Zapbox continua sendo do produto, operado pela
sua equipe.
```

- **link interno:** `Ver Integração de Sistemas` → `/solucoes#integracao-de-sistemas`

`APPROVED` — redação alinhada a `docs/14` §5.8 e `docs/11`, e à `SHARED
BOUNDARY` de `docs/19` §3.6. **Não** afirma que a RC2 opera atendimento, CRM,
equipe, vendas ou conversas.

### 3.6 CTA final

- **h2:** `O Zapbox fica em outro endereço`
- **corpo:** `O produto tem site próprio, com planos e detalhes de cada recurso.`
- **CTA:** `Ir para o Zapbox` → `https://www.zapbox.cloud/`

`INFERRED` — o label diz **para onde** o usuário vai, e o corpo avisa que o
destino é outro domínio. Escolhido em vez de "Conhecer o Zapbox" — usado hoje na
Home e no Footer — justamente para diferenciar: aqueles **entram na ponte**,
este **sai para o produto**.

---

## 4. Decisões de arquitetura

### 4.1 Sem CTA secundário — `NO_SECONDARY_CTA`

`INFERRED` — a página tem **um** botão. Os dois caminhos internos (§3.4 e §3.5)
são **links de texto dentro do contexto que os justifica**, não botões.

Motivo: um segundo botão competiria com o único objetivo da página. E `/contato`
está a um clique no Header — a ponte não precisa duplicá-lo, nem deve virar
porta de suporte comercial do produto.

### 4.2 Módulo de conteúdo — `src/lib/content/zapboxBridge.ts`

`CREATE`. A página tem H1, subheadline, dois blocos de território com 5 itens
cada, três rotas de destino, dois links internos, um CTA e os identificadores
de analytics. É conteúdo estruturado suficiente para justificar um módulo
testável, coerente com `home.ts` e `solucoesPage.ts`.

### 4.3 Componentização — zero componentes novos

| Elemento | Solução |
|---|---|
| Hero | `PageHero` existente (aceita `label`, `title`, `description`, `action`) |
| Rótulos de seção | `SectionLabel` |
| Animação | `ScrollReveal` |
| Links medidos | `TrackedLink` — já suporta `target`/`rel`, como no `FOOTER_PRODUCT_LINK` |
| CTA final | `TrackedLink` inline, **não** `CTABlockBase` |

`INFERRED` — `CTABlockBase` **não é usado**: ele não expõe `target`/`rel`, e
adaptá-lo para um link externo mudaria um componente compartilhado por três
páginas para servir a um caso só. Um `TrackedLink` inline resolve sem tocar em
nada existente.

**Nenhum componente por seção.**

---

## 5. Estrutura de arquivos

| Arquivo | Ação | Responsabilidade | Server/Client | Teste |
|---|---|---|---|---|
| `src/lib/content/zapboxBridge.ts` | CREATE | copy, territórios, destinos, CTAs, analytics | módulo puro | `zapboxBridgeContent.test.ts` |
| `src/app/(public)/zapbox/page.tsx` | CREATE | rota, metadata, schema, as 6 seções | Server | `zapboxBridgeMetadata.test.ts` |
| `src/app/sitemap.ts` | MODIFY | acrescenta `/zapbox` a `staticPages` | — | `zapboxBridgeSitemap.test.ts` |
| `src/app/llms.txt/route.ts` | MODIFY | acrescenta `/zapbox` à descoberta | — | verificação em runtime |
| `tests/unit/zapbox/zapboxBridgeContent.test.ts` | CREATE | contrato de copy e território | — | — |
| `tests/unit/zapbox/zapboxBridgeMetadata.test.ts` | CREATE | metadata, canonical, schema | — | — |
| `tests/unit/zapbox/zapboxBridgeSitemap.test.ts` | CREATE | `/zapbox` presente; nada removido | — | — |
| `tests/e2e/zapbox-bridge.spec.ts` | CREATE | rota, H1, CTA, `target`/`rel`, ausências | — | — |

**Nenhum outro arquivo.** Em especial: `robots.ts`, `next.config.ts`,
`home.ts`, `navigation.ts`, `solucoesPage.ts`, `services.ts`, `solutions.ts`,
`tracking.ts` e `components/tracking/` **não são tocados**.

---

## 6. Metadata

| Campo | Valor |
|---|---|
| `title` | `Zapbox — o produto da RC2 para WhatsApp, atendimento e vendas` |
| `description` | `O Zapbox é o produto próprio da RC2 para atendimento e vendas pelo WhatsApp. Entenda o que pertence ao produto, o que continua sendo trabalho de automação e integração da RC2, e como os dois se conectam.` |
| `og:title` | igual ao `title` |
| `og:description` | `O produto da RC2 para WhatsApp, atendimento e vendas — e onde termina o território dele.` |
| `canonical` | `https://www.rc2solucoes.com.br/zapbox` |
| `og:url` | `https://www.rc2solucoes.com.br/zapbox` |

`INFERRED` — **não** duplica o title do produto (`"Zapbox | Atendimento em
equipe pelo WhatsApp"`). O título da ponte é **relacional** — nomeia RC2 e
Zapbox juntos —, o que a coloca numa intenção de busca diferente: quem procura
"zapbox rc2" ou "zapbox é de quem" chega aqui; quem procura "atendimento
whatsapp equipe" chega no produto.

**Proibido na metadata:** preço · plano · "chatbot" · métrica · "melhor" ·
"líder".

---

## 7. Indexabilidade e competição orgânica

`APPROVED` (`docs/19` §5.3) — **`INDEXABLE`**: `index, follow`, canonical
própria, **PRESENTE no sitemap**.

`INFERRED` — quatro mecanismos evitam competir com `www.zapbox.cloud`:

1. **intenção diferente** — a ponte responde "que relação existe entre RC2 e
   Zapbox"; o produto responde "como organizo meu WhatsApp";
2. **título e description relacionais**, não de produto;
3. **conteúdo não reproduzido** — sem features completas, sem planos, sem
   preços, sem screenshots;
4. **CTA explícito para o domínio principal**, deixando claro qual é a página
   canônica do produto.

`INFERRED` — a página é curta **por decisão**, não por falta de conteúdo: uma
ponte longa viraria landing paralela e passaria a competir.

---

## 8. Schema

`APPROVED` — **`WebPage` apenas**, com `isPartOf` do `WebSite`, no mesmo padrão
de `/solucoes`.

**Proibidos:** `Product` · `Offer` · `SoftwareApplication` · `Service` ·
`FAQPage`.

`INFERRED` — a RC2 **não publica o produto como oferta no seu domínio**: preço
e disponibilidade vivem em `www.zapbox.cloud`. Declarar `Product`/`Offer` aqui
criaria duas entidades comerciais concorrentes para o mesmo produto e obrigaria
a manter preço sincronizado entre domínios.

`Organization`, `LocalBusiness` e `WebSite` continuam vindo do layout raiz.

---

## 9. Sitemap

`INFERRED` — `/zapbox` entra em `staticPages` de `src/app/sitemap.ts`, **na
mesma unidade** que cria a rota.

| Item | Valor |
|---|---|
| `path` | `/zapbox` |
| `changeFrequency` | `monthly` |
| `priority` | `0.8` — mesmo peso das páginas de serviço |

**Nenhuma URL é removida nesta unidade.** Contagem esperada: **29 → 30**,
validada por **conteúdo**, não só por número.

---

## 10. Robots

`APPROVED` — **`ROBOTS_NO_CHANGE`**. `git diff -- src/app/robots.ts` deve ser
vazio. A rota herda a política pública normal.

---

## 11. `llms.txt`

`INFERRED` — **sim, `/zapbox` entra na 6D.** É superfície pública, indexável e
recém-criada; deixá-la fora criaria uma inconsistência já no primeiro dia.

**Posição:** na seção **Produto**, que já existe, substituindo o link direto
para o domínio externo:

```
## Produto

- [Zapbox](https://www.rc2solucoes.com.br/zapbox): produto próprio da RC2 para
  atendimento e vendas pelo WhatsApp, com equipe, CRM comercial e Sales AI.
  A página explica a fronteira entre o produto e as competências de consultoria
  da RC2, e encaminha para https://www.zapbox.cloud/.
```

**Nenhuma URL legada é removida** — as migrações são de 6G.

---

## 12. Links internos

`INFERRED` — a ponte tem exatamente **dois** links internos, ambos de retorno e
ambos dentro do contexto que os justifica:

| Origem na página | Destino | Papel |
|---|---|---|
| §3.4 — território RC2 | `/solucoes` | quem chegou por engano encontra as competências |
| §3.5 — fronteira | `/solucoes#integracao-de-sistemas` | quem precisa integrar o Zapbox ao resto |

**Nenhum link para `/contato`** — está no Header.
**Nenhum link para `/solucoes-com-ia`** — continua `SPLIT_INTENT` e é assunto
de 6F.
**Nenhuma referência à Agenda Confirmada.**

Na 6D, **nada aponta para a ponte**. Isso é intencional: ela é publicada, medida
e revisada antes de receber tráfego, em 6E.

---

## 13. Analytics

`APPROVED` (`docs/19` §10) — evento único `cta_click`, `kind: "cta"`, **nenhum
event kind novo**, nenhum identificador histórico reutilizado.

| Superfície | Location | Label | Destination |
|---|---|---|---|
| CTA final | `zapbox_bridge` | `ir_para_zapbox` | `https://www.zapbox.cloud/` |
| Roteamento — Sales AI | `zapbox_bridge` | `sales_ai` | `https://www.zapbox.cloud/sales-ai` |
| Roteamento — CRM e vendas | `zapbox_bridge` | `crm_vendas` | `https://www.zapbox.cloud/crm-vendas` |
| Roteamento — Automações | `zapbox_bridge` | `automacoes` | `https://www.zapbox.cloud/automacoes` |
| Retorno — competências | `zapbox_bridge` | `ver_solucoes` | `/solucoes` |
| Retorno — integração | `zapbox_bridge` | `integracao_de_sistemas` | `/solucoes#integracao-de-sistemas` |

`INFERRED` — **sem evento de pageview próprio.** O GTM já cobre navegação; a
ponte instrumenta **interações**, que é exatamente o que hoje não se mede.

**Ganho medido a partir da 6D:** o clique de saída para o Zapbox passa a
existir como dado. Hoje ele não existe em nenhuma superfície.

---

## 14. Tasks

### Task 1 — Preflight e baseline

**Files** — Create: — · Modify: — · Test: —

**Consumes** — estado do repositório.

**Produces** — baseline observado e feature branch.

- [ ] `git status && git branch --show-current && git log --oneline -3`
- [ ] `git checkout main && git pull --ff-only && git checkout -b feat/phase-6-zapbox-bridge`
- [ ] registrar valores reais: `npm run typecheck` · `npm run lint` · `npm run test` · `npm run audit:brand` · `npm run build`
- [ ] `npm run test:e2e` — registrar. Referência: 42 passed / 2 skipped / 0 failed
- [ ] `curl -s -o /dev/null -w "%{http_code}\n" https://www.rc2solucoes.com.br/zapbox` — confirmar **404** antes de criar
- [ ] confirmar que as 4 rotas do Zapbox seguem **200 com `www`**:

```bash
for u in / /sales-ai /crm-vendas /automacoes; do
  printf "%-14s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code} hops=%{num_redirects}' https://www.zapbox.cloud$u)"
done
```

- [ ] divergência não bloqueia, mas precisa ser registrada antes de qualquer edição

---

### Task 2 — RED: contrato de conteúdo

**Files**
- Create: `tests/unit/zapbox/zapboxBridgeContent.test.ts`
- Test: o próprio arquivo

**Consumes** — §3 deste plano; `docs/19` §3.6 e §5.

**Produces** — suíte vermelha por módulo inexistente.

- [ ] escrever contra `@/lib/content/zapboxBridge` (ainda inexistente):
  - `ZAPBOX_BRIDGE_COPY.h1` === a string da §3.1
  - `ZAPBOX_BRIDGE_COPY.subheadline` === a string da §3.1
  - `ZAPBOX_BRIDGE_COPY.eyebrow` === `"Produto próprio"`
  - o H1 **não** é `"Conheça o Zapbox"` nem contém `"Transforme seu WhatsApp"`
  - `ZAPBOX_BRIDGE_BRAND.title` === `"Zapbox é um produto da RC2 Soluções"`
  - o texto de marca **não** contém `subsidiária`, `spin-off`, `empresa separada`
  - `ZAPBOX_TERRITORY.items` tem 5 entradas
  - `RC2_TERRITORY.items` tem 5 entradas
  - `ZAPBOX_BRIDGE_ROUTES` tem 3 entradas, todas começando em `https://www.zapbox.cloud/`
  - **nenhum destino externo usa o apex** — `href.startsWith("https://www.zapbox.cloud")` para todos
  - `ZAPBOX_BRIDGE_CTA.href` === `"https://www.zapbox.cloud/"` e `.label` === `"Ir para o Zapbox"`
  - `ZAPBOX_BRIDGE_CTA.secondary` é `undefined`
  - `ZAPBOX_BRIDGE_INTERNAL_LINKS` tem 2 entradas: `/solucoes` e `/solucoes#integracao-de-sistemas`
  - a fronteira menciona `integração` e **não** afirma que a RC2 opera atendimento, CRM, equipe ou vendas
  - **claims proibidos** — nenhuma string do módulo contém, em minúsculas: `chatbot`, `garante`, `melhor crm`, `líder`, `certificad`, `parceiro oficial`, `%`
  - nenhuma string contém `R$`, `plano`, `preço`
  - nenhuma string menciona `Agenda Confirmada`
- [ ] `npx vitest run tests/unit/zapbox/zapboxBridgeContent.test.ts` → **falha por módulo não encontrado**

---

### Task 3 — GREEN: `src/lib/content/zapboxBridge.ts`

**Files**
- Create: `src/lib/content/zapboxBridge.ts`
- Test: `tests/unit/zapbox/zapboxBridgeContent.test.ts`

**Consumes** — §3, literalmente.

**Produces** — módulo tipado e verde.

- [ ] declarar os tipos **antes** das constantes, para evitar a narrowing trap
      do `as const` que apareceu na Fase 4 com `HOME_DEMOS`
- [ ] exportar `ZAPBOX_BRIDGE_COPY`, `ZAPBOX_BRIDGE_BRAND`, `ZAPBOX_TERRITORY`,
      `RC2_TERRITORY`, `ZAPBOX_SHARED_BOUNDARY`, `ZAPBOX_BRIDGE_ROUTES`,
      `ZAPBOX_BRIDGE_CTA`, `ZAPBOX_BRIDGE_INTERNAL_LINKS`,
      `ZAPBOX_BRIDGE_METADATA`
- [ ] copiar a copy da §3 **sem paráfrase**; todos os destinos externos com `www`
- [ ] `npx vitest run tests/unit/zapbox/` → **verde**
- [ ] `npm run typecheck`
- [ ] `git commit -m "test: define Zapbox bridge contracts"`

---

### Task 4 — RED: metadata e schema

**Files**
- Create: `tests/unit/zapbox/zapboxBridgeMetadata.test.ts`

**Consumes** — §6, §8.

**Produces** — teste vermelho antes da rota existir.

- [ ] no modelo de `tests/unit/solucoes/solucoesMetadata.test.ts`, importando
      `@/app/(public)/zapbox/page`:
  - `meta.title` === a string da §6
  - `meta.description` === a string da §6
  - `meta.alternates?.canonical` === `"https://www.rc2solucoes.com.br/zapbox"`
  - `meta.openGraph?.url` === o mesmo
  - `title` **não** é igual ao do produto (`"Zapbox | Atendimento em equipe pelo WhatsApp"`)
  - `title + description` em minúsculas não contém `chatbot`, `plano`, `preço`, `r$`
- [ ] `npx vitest run tests/unit/zapbox/zapboxBridgeMetadata.test.ts` → **falha por rota inexistente**

---

### Task 5 — GREEN: a rota `/zapbox`

**Files**
- Create: `src/app/(public)/zapbox/page.tsx`

**Consumes** — §2, §3, §6, §8, §12, §13.

**Produces** — a ponte renderizando.

- [ ] Server Component, no padrão de `src/app/(public)/solucoes/page.tsx`
- [ ] `generateMetadata` conforme §6, usando `buildOg` e `BASE_URL`
- [ ] **um** `<script type="application/ld+json">` com `WebPage` + `isPartOf`.
      **Nenhum** `Product`, `Offer`, `SoftwareApplication`, `Service` ou `FAQPage`
- [ ] seção 1 — `PageHero` com `label`, `title`, `description` e `action` =
      `TrackedLink` do CTA final
- [ ] seções 2 a 5 — `SectionLabel` + `<h2>` + `ScrollReveal`, uma `<section>` por bloco
- [ ] os 3 links de roteamento e o CTA final usam `TrackedLink` com
      `target="_blank"` e `rel="noopener noreferrer"`
- [ ] os 2 links internos usam `TrackedLink` sem `target`
- [ ] tracking exatamente conforme a tabela da §13
- [ ] **nenhum hex literal**; tokens `--rc2-*` e Barlow, conforme o Brand Guide
- [ ] **`NO_PRODUCT_SCREENSHOT`** — nenhuma imagem, mock ou captura do produto
- [ ] `npx vitest run tests/unit/zapbox/` → **verde**
- [ ] `npm run build && npm run start`; `curl -s -o /dev/null -w "%{http_code}" localhost:3000/zapbox` → **200**
- [ ] `npm run audit:brand`
- [ ] `git commit -m "feat: add Zapbox bridge page"`

---

### Task 6 — Sitemap e `llms.txt`

**Files**
- Modify: `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`
- Create: `tests/unit/zapbox/zapboxBridgeSitemap.test.ts`

**Consumes** — §9, §11.

**Produces** — a ponte descobrível.

- [ ] RED — escrever `zapboxBridgeSitemap.test.ts`:
  - o sitemap contém `/zapbox`
  - continua contendo `/solucoes`, `/servicos`, `/solucoes-com-ia`,
    `/servicos/automacoes-com-ia`, `/servicos/e-commerce`,
    `/servicos/sites-e-landing-pages` e as 5 subpáginas de `/solucoes`
  - **não** contém `/servicos/agentes-de-ia` nem `/servicos/automacao-de-processos`
  - nenhuma URL contém `#`; nenhuma duplicada
- [ ] `npx vitest run tests/unit/zapbox/zapboxBridgeSitemap.test.ts` → **falha**
- [ ] GREEN — acrescentar a `staticPages`: `{ path: "/zapbox", changeFrequency: "monthly", priority: 0.8 }`.
      **Não remover nada**; não tocar em `MIGRATED_SERVICE_SLUGS`
- [ ] `llms.txt` — substituir o link direto na seção **Produto** pelo texto da §11.
      **Nenhuma URL legada é removida**
- [ ] `git diff -- src/app/robots.ts` → **vazio**
- [ ] verificar em runtime: `curl -s localhost:3000/sitemap.xml | grep -c "<loc>"` → **30**
- [ ] `curl -s localhost:3000/llms.txt | grep -c "rc2solucoes.com.br/zapbox"` → **1**
- [ ] `git commit -m "seo: expose Zapbox bridge discovery"`

---

### Task 7 — E2E

**Files**
- Create: `tests/e2e/zapbox-bridge.spec.ts`

**Consumes** — §3, §12, §13.

**Produces** — a jornada protegida.

- [ ] cobrir:
  - `/zapbox` responde **200** e tem **exatamente 1 `<h1>`**
  - o H1 contém `Zapbox`
  - existem **5 `<h2>`**
  - o CTA `Ir para o Zapbox` tem `href="https://www.zapbox.cloud/"`,
    `target="_blank"` e `rel` contendo `noopener` e `noreferrer`
  - os 3 links de roteamento existem, com `www` e `target="_blank"`
  - **nenhum** link externo usa o apex: `a[href^="https://zapbox.cloud"]` → `toHaveCount(0)`
  - os 2 links internos existem
  - **ausências:** nenhum `<form>`; nenhum texto `R$`; nenhum `Agenda Confirmada`;
    nenhum `chatbot`; nenhum link para `/solucoes/agenda-confirmada`
- [ ] **não navegar** para o domínio externo — validar apenas atributos, para não
      tornar o teste dependente de rede de terceiros
- [ ] usar `page.goto` e asserções auto-retry; **nenhum** `waitForTimeout`
- [ ] `npx playwright test tests/e2e/zapbox-bridge.spec.ts` → **verde**
- [ ] `npx playwright test tests/e2e/zapbox-bridge.spec.ts --repeat-each=10 --workers=6` → **100% verde**
- [ ] `git commit -m "test: validate Zapbox bridge"`

---

### Task 8 — Responsividade, acessibilidade e gate final

**Files** — Modify: apenas o que reprovar. Capturas em
`.playwright-mcp/phase-6-zapbox-bridge/` — **não versionadas**.

**Consumes** — tudo acima.

**Produces** — branch pronta para revisão. **Sem merge.**

- [ ] **Playwright MCP** em `/zapbox`, nos viewports **390×844**, **768×1024**,
      **1024×768** e **1440×900**:
  - `document.documentElement.scrollWidth <= clientWidth` — **zero overflow**
  - 1 `<h1>`, 5 `<h2>`, sem salto de hierarquia
  - o CTA externo é alcançável e clicável no mobile
  - snapshot de acessibilidade sem violação nova
- [ ] verificar **foco visível** em todos os links, e que **nenhum** usa texto
      genérico do tipo "clique aqui" ou "saiba mais"
- [ ] se houver ícone de link externo, ele é `aria-hidden` — o texto do link já
      diz o destino
- [ ] fresh run, nesta ordem:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run audit:brand
npm run build
```

- [ ] comparar com o baseline da Task 1. **E2E: zero falhas.** Se um flake
      aparecer, capturar `--trace on` **antes** de tentar corrigir
- [ ] `git diff main --stat` — confirmar **zero** alteração em `robots.ts`,
      `next.config.ts`, `home.ts`, `navigation.ts`, `solucoesPage.ts`,
      `services.ts`, `solutions.ts`, `tracking.ts`, `components/tracking/`,
      `package.json`, `package-lock.json`
- [ ] `git push -u origin feat/phase-6-zapbox-bridge`
- [ ] abrir **um** PR, `feat: add RC2 Zapbox bridge`, com o corpo da §16
- [ ] **PARAR antes do merge**

---

## 15. Commits planejados

Quatro unidades revisáveis, sem squash. `f4ee8b2` permanece intacto.

| # | Commit | Tasks |
|---|---|---|
| 1 | `test: define Zapbox bridge contracts` | 2–3 |
| 2 | `feat: add Zapbox bridge page` | 4–5 |
| 3 | `seo: expose Zapbox bridge discovery` | 6 |
| 4 | `test: validate Zapbox bridge` | 7–8 |

---

## 16. Corpo do PR futuro

**Título:** `feat: add RC2 Zapbox bridge`

Deve declarar:

- **cria** `/zapbox` — página curta, indexável, com canonical própria,
  `WebPage` schema, presente no sitemap e em `llms.txt`;
- **instrumenta** o clique de saída para o Zapbox, que hoje **não é medido em
  nenhuma superfície**;
- **usa o canonical `www.zapbox.cloud`**, evitando o salto extra do apex;
- **não migra** nenhuma URL; **não cria** redirect;
- **não altera** Header, Footer, Home, `/solucoes`, `/contato` nem
  `/solucoes-com-ia`;
- **não corrige** os 6 links apex existentes — `ZAPBOX_APEX_HOP_DEBT`, escopo de 6E;
- **não cria** Agenda Confirmada; `CD-2` e `CD-4` intocadas;
- prepara o handoff aprovado em `CD-1`/`CD-3`.

---

## 17. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R-1 | Duplicar conteúdo de `www.zapbox.cloud` | §3 fixa a copy e lista o que é `OPTIONAL_DETAIL` fora de escopo; sem features, planos ou capturas |
| R-2 | Competir organicamente com o produto | §7 — intenção, título e description relacionais; página curta; CTA para o domínio principal |
| R-3 | A ponte virar landing paralela | 6 seções fechadas; `NO_SECONDARY_CTA`; sem formulário |
| R-4 | Claim não suportado | Task 2 testa 8 termos proibidos; toda capacidade citada foi observada em `zapbox.cloud` |
| R-5 | Analytics incorreto ou duplicado | tabela da §13 fechada antes da implementação; sem pageview manual |
| R-6 | Link externo errado, com salto extra | `www` obrigatório, testado em unit **e** em E2E (`apex → toHaveCount(0)`) |
| R-7 | Rota do Zapbox mudar e quebrar um link | com ponte, o impacto é um link quebrado, não um redirect quebrado; Task 1 reconfere os 4 destinos |
| R-8 | Confusão RC2 × Zapbox na copy | §3.4 é complementar, nunca comparativa; §3.5 declara a fronteira |
| R-9 | Publicar a ponte sem tráfego e concluir que "não funciona" | **é esperado**: nada aponta para ela na 6D; a leitura de volume só faz sentido depois de 6E |
| R-10 | `Product`/`Offer` schema criando oferta concorrente | §8 proíbe; teste de metadata verifica o tipo |
| R-11 | Tocar Home/Footer por impulso de coerência | Task 8 verifica `git diff main --stat` arquivo a arquivo |

---

## 18. Fora do escopo

Migração das 5 URLs de território Zapbox · redirect de qualquer tipo ·
correção dos 6 links apex · Header, Footer, Home, `/solucoes`, `/contato` ·
`/solucoes-com-ia` · Agenda Confirmada e `CD-2` · `CD-4` · `/produtos` ·
`NEEDS_SEO_DATA` · hub `/servicos` · taxonomia global de analytics · qualquer
alteração em `zapbox.cloud`.

---

## 19. Decisões fechadas

1. **6 seções**, 1 H1 e 5 H2, na ordem da §2.
2. **H1:** "Quando o problema é o WhatsApp, a resposta da RC2 chama-se Zapbox."
3. **CTA único:** "Ir para o Zapbox" → `https://www.zapbox.cloud/`,
   `target="_blank"`, `rel="noopener noreferrer"`.
4. **`NO_SECONDARY_CTA`** — dois links internos de texto, nenhum segundo botão.
5. **Destino externo sempre com `www`** — o apex custa um salto.
6. **`ZAPBOX_APEX_HOP_DEBT` registrada**, resolvida em 6E.
7. **Módulo `zapboxBridge.ts`**; **zero componentes novos**; `CTABlockBase` não
   é usado nem alterado.
8. **`WebPage` apenas** — sem `Product`, `Offer`, `SoftwareApplication`,
   `Service` ou `FAQPage`.
9. **`INDEXABLE`**, canonical própria, sitemap **29 → 30**.
10. **`ROBOTS_NO_CHANGE`**.
11. **`llms.txt` atualizado** na seção Produto; nenhuma URL legada removida.
12. **`NO_PRODUCT_SCREENSHOT`**.
13. **Nada aponta para a ponte na 6D** — o tráfego é habilitado em 6E.
14. **`CD-2` e `CD-4` intocadas.**
