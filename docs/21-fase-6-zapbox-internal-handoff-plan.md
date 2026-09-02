# Fase 6E — Handoff interno RC2 → /zapbox — Implementation Plan

> Execute task-by-task. `AGENTS.md`, `PRODUCT.md`,
> `docs/19-fase-6-zapbox-handoff-decision.md` and
> `.agents/skills/rc2-site-migration/SKILL.md` govern this unit.

**Goal:** migrar as cinco superfícies institucionais restantes do link externo
direto ao Zapbox para a bridge interna `/zapbox`, preservando tracking e
removendo semântica de navegação externa.

**Architecture:** destination-only handoff at the business level, but complete
semantic conversion at the UI level: href, target, rel, external flags and
external icons must agree that `/zapbox` is internal.

**Baseline:** `main @ 1c6e7b4` · Fase 6D publicada · governança alinhada
(PR #22) · `CD-1 = BRIDGE_FIRST` · `CD-3 = CHANNEL_AND_OBJECT`.

---

## 0. Correção de paths do briefing

`OBSERVED` — três caminhos citados no briefing não existem. Os reais:

| Briefing | Real |
|---|---|
| `src/lib/navigation.ts` | **`src/lib/content/navigation.ts`** |
| `src/components/solutions/` | **`src/components/marketing/solucoes/`** |
| `src/components/home/` | **`src/components/marketing/home/`** |

Todos os paths deste plano são os reais, verificados no disco.

---

## 1. Escopo — exatamente 5 superfícies

`OBSERVED` — medidas em `main @ 1c6e7b4` por **link executável**, não por
ocorrência textual:

| # | Superfície | Arquivo(s) | Linha |
|---|---|---|---|
| 1 | Home — Produtos | `src/lib/content/home.ts` + `HomeProducts.tsx` | 167 |
| 2 | Home — Demonstrações | `src/lib/content/home.ts` + `(public)/page.tsx` | 254 |
| 3 | Footer — Produto | `src/lib/content/navigation.ts` + `Footer.tsx` | 53 |
| 4 | `/solucoes` — fronteira IA | `SolutionsCompetencies.tsx` | 160 |
| 5 | `/solucoes` — Operação Gerenciada | `SolutionsManagedOps.tsx` | 90 |

**Fora da dívida, confirmado por inspeção:**

- `src/app/llms.txt/route.ts` — já aponta para `/zapbox`; cita
  `www.zapbox.cloud` apenas como destino explicado pela bridge;
- `src/lib/content/zapboxBridge.ts:13` — a string `zapbox.cloud` aparece num
  **comentário que proíbe o apex**, não num link;
- `src/app/(public)/zapbox/page.tsx` — a própria bridge, autorizada a apontar
  para `https://www.zapbox.cloud/`.

**São 5. Se a implementação encontrar 6, parar e investigar.**

---

## 2. Baseline runtime — BEFORE

`OBSERVED` — medido em Production nesta tarefa:

| Superfície | href | label | target | rel | ícone SVG |
|---|---|---|---|---|---|
| Home — Produtos | `https://zapbox.cloud/` | "Conhecer Zapbox" | `_blank` | `noopener noreferrer` | **sim** |
| Home — Demonstrações | `https://zapbox.cloud/` | "Conhecer Zapbox" | `_blank` | `noopener noreferrer` | **sim** |
| Footer — Produto | `https://zapbox.cloud/` | "Zapbox — atendimento e vendas pelo WhatsApp" | `_blank` | `noopener noreferrer` | não |
| `/solucoes` — fronteira IA | `https://zapbox.cloud/` | "Conhecer Zapbox" | `_blank` | `noopener noreferrer` | **sim** |
| `/solucoes` — Operação Gerenciada | `https://zapbox.cloud/` | "Zapbox" | `_blank` | `noopener noreferrer` | não |

**As cinco usam o apex**, que responde 308 — cada clique hoje custa um salto
extra antes mesmo de sair do domínio da RC2.

---

## 3. Matriz de migração — AFTER

| # | Superfície | Destino futuro | Remove target | Remove rel | Remove flag `external` | Remove ícone | Teste |
|---|---|---|---|---|---|---|---|
| 1 | Home — Produtos | `/zapbox` | ✅ (via flag) | ✅ (via flag) | **não** — vira `false` (§4.1) | ✅ (via flag) | unit + e2e |
| 2 | Home — Demonstrações | `/zapbox` | ✅ | ✅ | n/a | ✅ + import | unit + e2e |
| 3 | Footer — Produto | `/zapbox` | ✅ | ✅ | n/a | n/a | unit + e2e |
| 4 | `/solucoes` — fronteira IA | `/zapbox` | ✅ | ✅ | n/a | ✅ + import | e2e |
| 5 | `/solucoes` — Operação Gerenciada | `/zapbox` | ✅ | ✅ | n/a | n/a | e2e |

**Nenhuma copy visível muda.** Os cinco labels atuais permanecem — nenhum diz
"site externo" ou equivalente, então não há microajuste necessário (§43 do
briefing satisfeito sem alteração).

---

## 4. Decisões de arquitetura

### 4.1 A flag `external` permanece — Zapbox passa a `false`

`OBSERVED` — `HOME_PRODUCTS` tem 2 itens: `zapbox` (`external: true`) e
`agendaConfirmada` (`external: false`). `HomeProducts.tsx` usa a flag em **dois
pontos**: o spread de `target`/`rel` (linha 36) e a escolha do ícone
(linhas 48-49). O componente tem **um único consumidor**: a Home.

`INFERRED` — **manter a propriedade e virar `external: false`.**

Por quê, e não removê-la: virar `false` é uma linha; remover a API exigiria
mexer no tipo, nos dois itens de dados e nos dois condicionais do componente —
refatoração maior numa unidade cuja tese é mudança mínima. A capacidade de
expressar externalidade continua útil se a RC2 publicar um terceiro produto.

`ArrowUpRight` continua **referenciado** no ternário, então o import permanece
válido e nenhum warning novo aparece.

### 4.2 Demonstrações — remoção direta, sem flag nova

`OBSERVED` — em `page.tsx`, `target`, `rel` e `ArrowUpRight` são aplicados
**incondicionalmente** a qualquer demo com `href`. Hoje só o Zapbox tem `href`.

`INFERRED` — **remover os três**, sem introduzir `external?: boolean` no tipo
`Demo`. Adicionar uma flag para um item externo hipotético seria especulação;
`HOME_DEMOS` é uma lista curada de 2 itens. Um comentário no código registra
que uma demo externa futura precisa reintroduzir a semântica explicitamente.

`ArrowUpRight` fica sem uso em `page.tsx` → **remover também o import**, senão
o lint ganha um warning novo.

### 4.3 Footer — sem heurística

`OBSERVED` — `FOOTER_PRODUCT_LINK` não tem propriedade de externalidade;
`Footer.tsx` aplica `target`/`rel` **inline e sem condição**.

`INFERRED` — basta **remover as duas linhas** do JSX e trocar o `href` no
módulo. Nada de `href.startsWith("http")`: o link passa a ser interno por
construção, e o outro link externo do Footer (WhatsApp, `wa.me`) mantém a sua
própria semântica inline, intocada.

### 4.4 As duas superfícies de `/solucoes` não têm tracking

`OBSERVED` — **`SolutionsCompetencies.tsx:160` e `SolutionsManagedOps.tsx:90`
usam `<a>` puro, não `TrackedLink`.** Nenhuma das duas emite evento hoje. É a
confirmação, no código, do que `docs/18` §3.1 registrou: os cliques de saída
para o Zapbox não são medidos em lugar nenhum.

**Classificação: `TRACKING_GAP`.**

`INFERRED` — **preencher as duas nesta unidade**, e não deixar para a dívida
global de analytics:

| Superfície | Base |
|---|---|
| 4 — fronteira IA | `docs/19` §10 **já aprovou** `location: solutions_ia_boundary`, `label: conhecer_zapbox`, marcada `NEW_SURFACE_REQUIRED`. Não é invenção desta unidade. |
| 5 — Operação Gerenciada | Não consta em `docs/19` §10. **Decisão desta unidade:** reutilizar a `location: solutions_managed_ops` que já existe para o CTA da seção, com `label: conhecer_zapbox`. É a mesma seção; o label distingue o elemento. Nenhum identificador antigo muda de significado. |

Justificativa para não adiar: converter `<a>` em `TrackedLink` é **a mesma
edição** que remove `target`/`rel`. Fazer metade deixaria as duas únicas
entradas não medidas da bridge — anulando o ganho central do `BRIDGE_FIRST`,
que é justamente medir o funil.

`INFERRED` — **não é redesenho de taxonomia:** nenhum event kind novo, nenhuma
location renomeada, nenhum label reutilizado com outro sentido.

---

## 5. Matriz de analytics

`APPROVED` (`docs/19` §10) — evento único `cta_click`, `kind: "cta"`.

| # | Superfície | Event | Location | Label | OLD destination | NEW destination | Classificação |
|---|---|---|---|---|---|---|---|
| 1 | Home — Produtos | `cta_click` | `home_products` | `conhecer_zapbox` | `https://zapbox.cloud/` | **`/zapbox`** | `REPOINT_DESTINATION_ONLY` |
| 2 | Home — Demonstrações | `cta_click` | `home_demos` | `conhecer_zapbox` | `https://zapbox.cloud/` | **`/zapbox`** | `REPOINT_DESTINATION_ONLY` |
| 3 | Footer — Produto | `cta_click` | `footer_produto` | `conhecer_zapbox` | `https://zapbox.cloud/` | **`/zapbox`** | `REPOINT_DESTINATION_ONLY` |
| 4 | `/solucoes` — fronteira IA | `cta_click` | `solutions_ia_boundary` | `conhecer_zapbox` | *(sem tracking)* | **`/zapbox`** | `TRACKING_GAP` → preenchido, pré-aprovado em `docs/19` §10 |
| 5 | `/solucoes` — Operação Gerenciada | `cta_click` | `solutions_managed_ops` | `conhecer_zapbox` | *(sem tracking)* | **`/zapbox`** | `TRACKING_GAP` → preenchido, decisão desta unidade (§4.4) |

**`PRESERVE_EVENT` · `PRESERVE_LOCATION` · `PRESERVE_LABEL`** para as três
primeiras — muda **somente** o `destination`.

**Sem pageview customizado.** Nada de `zapbox_bridge_view`: a navegação para
`/zapbox` já é coberta pela infraestrutura existente.

### 5.1 Funil resultante

```
superfície RC2                      →  /zapbox                →  www.zapbox.cloud
(home_products, home_demos,            (zapbox_bridge,            
 footer_produto,                        ir_para_zapbox)           
 solutions_ia_boundary,
 solutions_managed_ops)
```

A instrumentação da bridge (`docs/20` §13) **permanece intacta**. A 6E mede a
**intenção** nas superfícies; a bridge mede a **saída**. Validação do
encadeamento: capturar o payload da superfície, navegar, capturar o payload do
CTA da bridge — sem criar event kind novo.

---

## 6. Estrutura de arquivos

| Arquivo | Ação | O que muda |
|---|---|---|
| `src/lib/content/home.ts` | MODIFY | 2 `href` → `/zapbox`; `external: true` → `false` |
| `src/components/marketing/home/HomeProducts.tsx` | MODIFY | nada — a flag resolve (§4.1) |
| `src/app/(public)/page.tsx` | MODIFY | remove `target`, `rel`, `ArrowUpRight` + import |
| `src/lib/content/navigation.ts` | MODIFY | `href` → `/zapbox`; comentário atualizado |
| `src/components/layout/Footer.tsx` | MODIFY | remove `target` e `rel` do link de produto |
| `src/components/marketing/solucoes/SolutionsCompetencies.tsx` | MODIFY | `<a>` → `TrackedLink` interno; remove `ArrowUpRight` + import |
| `src/components/marketing/solucoes/SolutionsManagedOps.tsx` | MODIFY | `<a>` → `TrackedLink` interno |
| `tests/unit/home/homeContent.test.ts` | MODIFY | destinos e semântica |
| `tests/unit/navigation/navigation.test.ts` | MODIFY | Footer interno |
| `tests/unit/zapbox/zapboxHandoff.test.ts` | CREATE | contrato agregado das 5 |
| `tests/e2e/zapbox-bridge.spec.ts` | MODIFY | jornada das superfícies → bridge |

**Nenhum outro.** Em especial: `next.config.ts`, `sitemap.ts`, `robots.ts`,
`llms.txt`, `tracking.ts`, `components/tracking/`, `Header.tsx`,
`(public)/contato/`, `(public)/solucoes-com-ia/`, `services.ts`, `solutions.ts`,
`package*.json` — **intocados**.

---

## 7. Tasks

### Task 1 — Preflight e baseline

**Files** — Modify: — · Test: —

**Consumes** — estado do repositório.

**Produces** — baseline observado e feature branch.

- [ ] `git status && git branch --show-current && git log -1 --oneline` — confirmar `main @ 1c6e7b4`, tree limpa
- [ ] `git checkout -b feat/phase-6-zapbox-internal-handoff`
- [ ] registrar valores reais: `npm run typecheck` · `npm run lint` · `npm run test` · `npm run audit:brand` · `npm run build` · `npm run test:e2e`
      *(referência: lint 0 erros/11 warnings · Vitest 299 · E2E 50 passed/2 skipped)*
- [ ] capturar o BEFORE em Production e confirmar que bate com a §2:

```bash
for u in / /solucoes; do
  curl -s "https://www.rc2solucoes.com.br$u" \
  | grep -oE '<a[^>]*href="https://(www\.)?zapbox\.cloud[^"]*"[^>]*>' | sed "s|^|$u |"
done
```

- [ ] confirmar que são **5** links executáveis (3 em `main`, e o do Footer conta uma vez por página)
- [ ] divergência não bloqueia, mas precisa ser registrada antes de editar

---

### Task 2 — RED: contrato agregado do handoff

**Files**
- Create: `tests/unit/zapbox/zapboxHandoff.test.ts`
- Modify: `tests/unit/home/homeContent.test.ts`, `tests/unit/navigation/navigation.test.ts`

**Consumes** — §3, §5.

**Produces** — suíte vermelha nas superfícies com contrato testável.

- [ ] em `zapboxHandoff.test.ts`, contra `home.ts` e `navigation.ts`:
  - `HOME_PRODUCTS.zapbox.href` === `"/zapbox"`
  - `HOME_PRODUCTS.zapbox.external` === `false`
  - `HOME_PRODUCTS.zapbox.analyticsLabel` === `"conhecer_zapbox"` *(preservado)*
  - `HOME_PRODUCTS.zapbox.ctaLabel` === `"Conhecer Zapbox"` *(preservado)*
  - `HOME_DEMOS[0].href` === `"/zapbox"`
  - `HOME_DEMOS[0].analyticsLabel` === `"conhecer_zapbox"` *(preservado)*
  - `FOOTER_PRODUCT_LINK.href` === `"/zapbox"`
  - `FOOTER_PRODUCT_LINK.analyticsLabel` === `"conhecer_zapbox"` *(preservado)*
  - **nenhum** destes contém `zapbox.cloud`
  - `HOME_PRODUCTS.agendaConfirmada` **inalterado** — `href` `/contato`, `external: false`
- [ ] em `homeContent.test.ts` e `navigation.test.ts`, ajustar as asserções que
      hoje fixam o domínio externo — **sem enfraquecê-las**: trocar por
      `/zapbox` e manter as de label e analytics
- [ ] `npx vitest run tests/unit/zapbox/ tests/unit/home/ tests/unit/navigation/` → **falha nas asserções de destino**

---

### Task 3 — GREEN: dados das superfícies 1, 2 e 3

**Files** — Modify: `src/lib/content/home.ts`, `src/lib/content/navigation.ts`

**Consumes** — §3, §4.1.

**Produces** — os três destinos apontando para a bridge.

- [ ] `home.ts:167` — `href: "/zapbox"`, `external: false`
- [ ] `home.ts:254` — `href: "/zapbox"`
- [ ] `navigation.ts:53` — `href: "/zapbox"`; atualizar o comentário para
      registrar que a bridge é o destino e o produto vive fora
- [ ] **não** alterar `ctaLabel`, `analyticsLabel`, `name`, `category`,
      `description` nem o item `agendaConfirmada`
- [ ] `npx vitest run tests/unit/` → **verde**
- [ ] `npm run typecheck`
- [ ] `git commit -m "test: define Zapbox internal handoff contracts"` *(inclui a Task 2)*

---

### Task 4 — Semântica: Demonstrações e Footer

**Files** — Modify: `src/app/(public)/page.tsx`, `src/components/layout/Footer.tsx`

**Consumes** — §4.2, §4.3.

**Produces** — os dois links deixam de se comportar como externos.

- [ ] `page.tsx` — no bloco de demos, remover `target="_blank"`,
      `rel="noopener noreferrer"` e `<ArrowUpRight size={14} />`; acrescentar
      comentário registrando que uma demo externa futura precisa reintroduzir a
      semântica explicitamente
- [ ] `page.tsx` — remover `ArrowUpRight` do import do `lucide-react`
      *(único uso do arquivo — verificado)*
- [ ] `Footer.tsx` — remover `target="_blank"` e `rel="noopener noreferrer"` do
      `TrackedLink` de produto
- [ ] **não** tocar no link de WhatsApp do Footer (`wa.me`), que continua
      externo com a sua própria semântica
- [ ] `npm run lint` — confirmar que **não** surgiu warning de import morto
- [ ] `npm run build`

---

### Task 5 — `/solucoes`: converter os dois `<a>` em `TrackedLink`

**Files** — Modify: `SolutionsCompetencies.tsx`, `SolutionsManagedOps.tsx`

**Consumes** — §4.4, §5.

**Produces** — as duas superfícies internas **e medidas**.

- [ ] `SolutionsCompetencies.tsx:160` — `<a>` → `TrackedLink` com
      `href="/zapbox"`, sem `target`/`rel`, tracking
      `{ kind: "cta", location: "solutions_ia_boundary", label: "conhecer_zapbox", destination: "/zapbox" }`;
      remover `<ArrowUpRight size={14} />` e o `ArrowUpRight` do import
- [ ] `SolutionsManagedOps.tsx:90` — `<a>` → `TrackedLink` com `href="/zapbox"`,
      sem `target`/`rel`, tracking
      `{ kind: "cta", location: "solutions_managed_ops", label: "conhecer_zapbox", destination: "/zapbox" }`
- [ ] **preservar integralmente** a copy: o texto da fronteira em
      `#ia-para-operacoes`, a frase sobre integrações Zapbox ↔ sistemas, os
      **nove entregáveis**, o "não é BPO", a contratação mensal e a ausência de
      preço
- [ ] preservar as classes visuais dos dois links
- [ ] `npm run typecheck && npm run lint && npm run build`
- [ ] `git commit -m "feat: route RC2 Zapbox links through bridge"` *(inclui a Task 4)*

---

### Task 6 — E2E

**Files** — Modify: `tests/e2e/zapbox-bridge.spec.ts`

**Consumes** — §3, §5.

**Produces** — a jornada superfície → bridge protegida.

- [ ] acrescentar um `describe` para o handoff interno:
  - na **Home**: `main a[href="/zapbox"]` → `toHaveCount(2)`;
    `main a[href^="https://zapbox.cloud"]` → `toHaveCount(0)`;
    `main a[href^="https://www.zapbox.cloud"]` → `toHaveCount(0)`
  - **nenhum** desses links tem `target` — verificar atributo ausente
  - no **Footer**: `contentinfo a[href="/zapbox"]` → `toHaveCount(1)`, sem `target`
  - em **`/solucoes`**: `main a[href="/zapbox"]` → `toHaveCount(2)`, ambos sem `target`
  - **navegação real, uma vez:** clicar no link da Home e confirmar `/zapbox`
    com o H1 da bridge, usando o helper de sincronização
    (`waitForURL` **antes** do clique — o padrão já estabelecido em
    `navigation.spec.ts`)
- [ ] **preservar** os 8 testes existentes da bridge, inclusive o que garante
      que ela **pode** apontar para `www.zapbox.cloud`
- [ ] `npx playwright test tests/e2e/zapbox-bridge.spec.ts` → **verde**
- [ ] `npx playwright test tests/e2e/zapbox-bridge.spec.ts --repeat-each=10 --workers=6` → **100% verde**
- [ ] `git commit -m "test: validate Zapbox internal handoff"`

---

### Task 7 — Analytics runtime, MCP e gate final

**Files** — Modify: apenas o que reprovar. Capturas em
`.playwright-mcp/phase-6-zapbox-handoff/` — **não versionadas**.

**Consumes** — tudo acima.

**Produces** — branch pronta para revisão. **Sem merge.**

- [ ] **analytics runtime** — para cada uma das 5, capturar o payload sem
      cancelar o evento. **Nunca usar `preventDefault`**: ele aciona o guard
      `if (event.defaultPrevented) return` do `TrackedLink` e o evento não sai.
      Neutralizar o `href` (`#__probe`) e clicar:

```js
const orig = window.dataLayer.push.bind(window.dataLayer);
window.__cap = [];
window.dataLayer.push = (...a) => { window.__cap.push(a[0]); return orig(...a); };
const el = document.querySelector('main a[href="/zapbox"]');
const antes = el.getAttribute('href');
el.setAttribute('href', '#__probe'); el.click(); el.setAttribute('href', antes);
```

  esperado: `event: cta_click`, `location` e `label` **iguais ao BEFORE**,
  `destination: "/zapbox"`
- [ ] **MCP** em `/`, `/solucoes` e `/zapbox`, nos viewports **390×844**,
      **768×1024**, **1024×768** e **1440×900**: zero overflow, sem regressão
      visual, nenhum ícone de saída remanescente nos links internos
- [ ] **acessibilidade** — nenhum link para `/zapbox` anuncia nova aba; nome
      acessível preservado; foco visível; navegação por teclado; Header mobile
      intacto
- [ ] **fechamento da dívida** — auditar **links executáveis** fora de `/zapbox`:

```bash
grep -rnE 'href="https://(www\.)?zapbox\.cloud' src --include=*.ts --include=*.tsx \
  | grep -v 'src/app/(public)/zapbox/page.tsx'
```

  esperado: **vazio**. Ocorrências em comentário, schema, teste ou documentação
  **não contam** — a auditoria é por `href` executável
- [ ] fresh run: `npm run typecheck` · `npm run lint` · `npm run test` ·
      `npm run test:e2e` · `npm run audit:brand` · `npm run build`
- [ ] `git diff main --stat` — confirmar **zero** alteração em `next.config.ts`,
      `sitemap.ts`, `robots.ts`, `llms.txt`, `tracking.ts`,
      `components/tracking/`, `Header.tsx`, `contato/`, `solucoes-com-ia/`,
      `services.ts`, `solutions.ts`, `package*.json`
- [ ] `git push -u origin feat/phase-6-zapbox-internal-handoff`
- [ ] abrir **um** PR, `feat: route RC2 Zapbox links through bridge`, com o
      corpo da §9
- [ ] **PARAR antes do merge**

---

## 8. Commits planejados

Três unidades revisáveis, sem squash:

| # | Commit | Tasks |
|---|---|---|
| 1 | `test: define Zapbox internal handoff contracts` | 2–3 |
| 2 | `feat: route RC2 Zapbox links through bridge` | 4–5 |
| 3 | `test: validate Zapbox internal handoff` | 6–7 |

---

## 9. Corpo do PR futuro

**Título:** `feat: route RC2 Zapbox links through bridge`

Deve declarar:

- **5 superfícies** migradas para `/zapbox`: Home Produtos, Home
  Demonstrações, Footer Produto, fronteira IA e Operação Gerenciada;
- **semântica externa removida** — `target`, `rel`, ícone de saída e flag
  `external`; a mudança não é só de `href`;
- **analytics preservado** — `event`, `location` e `label` idênticos nas três
  superfícies que já mediam; só o `destination` muda;
- **dois `TRACKING_GAP` preenchidos** — as duas superfícies de `/solucoes` não
  tinham tracking nenhum; `solutions_ia_boundary` estava pré-aprovada em
  `docs/19` §10;
- **`ZAPBOX_APEX_HOP_DEBT` fechada** — nenhum link executável para o domínio do
  produto fora da bridge;
- **nenhum redirect executado**; as URLs legadas seguem intactas;
- a bridge continua sendo **a única saída padrão** para `www.zapbox.cloud`.

---

## 10. `ZAPBOX_APEX_HOP_DEBT` — critério de fechamento

**Definição.** A dívida tem dois aspectos: **(A)** superfícies RC2 apontando
direto ao produto, contrariando `BRIDGE_FIRST`; e **(B)** o uso do apex
`https://zapbox.cloud/`, que responde 308.

**Fechamento.** A 6E resolve os dois de uma vez, porque o destino passa a ser
`/zapbox` — interno e sem salto.

**Critério verificável:** zero `href` executável para
`https://zapbox.cloud` ou `https://www.zapbox.cloud` em `src/`, **exceto**
dentro de `src/app/(public)/zapbox/page.tsx`.

Se aparecer link executável fora dessa exceção: **classificar e reportar**, não
presumir que pertence a esta unidade.

---

## 11. Negative gates

| Área | Estado exigido |
|---|---|
| **Header** | zero alteração — Zapbox não entra no Header (`docs/19` §7.1) |
| **`/contato`** | zero alteração — a linha de triagem é de unidade posterior |
| **`/solucoes-com-ia`** | zero alteração — segue `SPLIT_INTENT`; **não** apontar para a bridge nesta unidade |
| **URLs legadas** | zero redirect; as 5 candidatas permanecem como estão |
| **`sitemap.ts`** | zero alteração — `/zapbox` já está **PRESENTE no sitemap** |
| **`llms.txt`** | zero alteração — já alinhado à bridge |
| **`robots.ts`** | zero alteração — `ROBOTS_NO_CHANGE` |
| **`next.config.ts`** | zero alteração — nenhum redirect |
| **`tracking.ts` / `components/tracking/`** | zero alteração — nenhum kind novo |
| **CD-2 / CD-4** | intocadas |

---

## 12. SEO

Nenhuma metadata, canonical ou schema muda. A unidade altera **apenas internal
linking**.

Efeito registrado: **`INTERNAL_LINK_AUTHORITY_ENABLEMENT`** — a bridge passa a
receber links internos de Home, Footer e `/solucoes`, quando hoje **nada aponta
para ela**. Nenhum impacto quantitativo é estimado aqui.

---

## 13. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R-1 | Link interno abrindo em nova aba | Task 4/5 removem `target`; E2E verifica atributo ausente nas 5 |
| R-2 | Ícone `ArrowUpRight` enganoso sobrando | removido em 3 pontos; imports mortos removidos; lint compara com o baseline |
| R-3 | Identificador de analytics renomeado por acidente | §5 fixa os valores; Task 2 testa `location` e `label` explicitamente |
| R-4 | Perda de tracking numa superfície | Task 7 captura payload real das 5, com o método que não aciona o guard |
| R-5 | Alterar componente compartilhado além do necessário | `HomeProducts` tem 1 consumidor; `agendaConfirmada` protegido por teste; WhatsApp do Footer intocado |
| R-6 | URL externa residual | auditoria por `href` executável na Task 7 |
| R-7 | Regressão visual na Home ou no Footer | MCP em 4 viewports; nenhuma classe alterada |
| R-8 | Regressão mobile | 390×844 incluído; Header mobile verificado |
| R-9 | Link `/solucoes` → bridge quebrado | E2E navega de verdade uma vez e confirma o H1 |
| R-10 | Loop de link — a bridge apontar de volta | a bridge só linka `/solucoes` e `/solucoes#integracao-de-sistemas`; **não** cria ciclo com as superfícies migradas |
| R-11 | Confundir handoff interno com migração de URL | §11 e §14 são explícitos; nenhuma URL legada muda de status |
| R-12 | Flake de E2E | stress 10×/6 workers; se aparecer, `--trace on` **antes** de corrigir |

---

## 14. Fora do escopo

**Migração das URLs legadas** — `/servicos/automacoes-com-ia`,
`/servicos/automacao-de-atendimento`, `/solucoes/atendimento-lento`,
`/solucoes/leads-sem-resposta`, `/solucoes/whatsapp-desorganizado`. Elas
mudam de status numa unidade posterior, **não nesta**.

Também fora: `/solucoes-com-ia` como triagem · redirect externo permanente ·
Agenda Confirmada e `CD-2` · `CD-4` · `/produtos` · `NEEDS_SEO_DATA` · hub
`/servicos` · taxonomia global de analytics · qualquer alteração em
`zapbox.cloud`.

---

## 15. Decisões fechadas

1. **Exatamente 5 superfícies**, medidas por link executável.
2. **Destino único:** `/zapbox`.
3. **Conversão semântica completa** — `href`, `target`, `rel`, flag e ícone.
4. **`external` permanece** em `HOME_PRODUCTS`; Zapbox vira `false`.
5. **Demonstrações sem flag nova** — remoção direta, com comentário.
6. **Footer sem heurística** — remoção inline das duas linhas.
7. **Os dois `<a>` de `/solucoes` viram `TrackedLink`** e passam a ser medidos.
8. **`solutions_ia_boundary`** vem pré-aprovada de `docs/19` §10;
   **`solutions_managed_ops` + `conhecer_zapbox`** é decisão desta unidade.
9. **`location` e `label` preservados** nas três superfícies já instrumentadas.
10. **Nenhum pageview customizado**, nenhum event kind novo.
11. **Nenhuma copy visível muda.**
12. **Dívida fechada** por auditoria de `href` executável, com a bridge como
    única exceção.
13. **Nenhuma URL legada muda de status.**
