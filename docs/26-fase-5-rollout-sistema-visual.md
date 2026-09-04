# Fase 5 — Rollout do sistema visual

Fonte: `documentos-base/RC2_Direcao_de_Arte_e_Sistema_Visual.md` §§8 e 9.

Escopo reduzido pela Fase 3: `/servicos` e `/solucoes/[slug]` redirecionam e
não recebem tratamento visual.

---

## 1. Componentes formalizados

Todos em `src/components/ui/`, com contrato em
`tests/unit/design-system/components.test.ts`.

| Componente | Origem | Nota |
|---|---|---|
| `NumberedList` | Era `marketing/StepList` | §8 pede formalizar o Numerado. O `StepList` foi **removido**. |
| `StatCounter` | **Novo** | Único componente genuinamente novo da direção de arte. |
| `SignalList` | Criado na Fase 2 | Já era a lista de sinais/intervenções de `/solucoes`. |
| `FaqList` | Extraído de `BlogPostArticle` | `<details>` nativo mantido: abre sem JS. |
| `ShareRow` | Extraído de `BlogPostArticle` | Os três links repetiam o payload de analytics à mão e já haviam divergido no `label`. |
| `AuthorByline` | Extraído de `BlogPostArticle` | Variantes `card` (sidebar) e `inline`. |

**`FaqList`, `ShareRow` e `AuthorByline` não estão nas §§8 e 9.** A tarefa os
nomeou como se estivessem; o §8 lista botões, link com seta, eyebrow, input,
estrelas, divisor, os cards, Numerado, Stat/Counter, stepper e nav item. Foram
tratados como extração dos ad-hoc do blog, com tratamento visual derivado das
regras gerais da §6 — não inventei especificação de design para eles.

**`Breadcrumb` já existia** (`ui/Breadcrumb.tsx`) e é `className="hidden"`:
existe só para o JSON-LD. O breadcrumb visível do artigo é markup próprio de
`BlogPostArticle`. Unificar os dois é trabalho separado, fora do que as §§8 e 9
pedem.

## 2. Correções de regra encontradas no caminho

A implementação anterior violava duas regras que o próprio documento enuncia:

| Violação | Onde | Regra |
|---|---|---|
| Numeral em laranja | `StepList` (`--rc2-brand-text/20`), `HomeMethod` (`text-rc2-brand`), `HomeCompetencies` e `SolutionsCompetencies` (`text-rc2-brand-text`) | §11 Do/Don't: "Numeral outline navy/muted" ✅ contra "Numeral em Safety Orange sólido" ❌ |
| Título de card em `#FF5F1F` no hover | `BlogCard` (`group-hover:text-rc2-brand`) | Regra inviolável nº 2: texto laranja pequeno em fundo claro usa `--rc2-brand-text` |

Também corrigido: `"min read"` em português no `BlogCard`.

## 3. Home

- **Módulo diagramático removido.** `HomeHeroDiagram.tsx` foi deletado. §11
  lista "fluxograma, nó-e-seta ou mockup de dashboard no hero" como coisa a
  evitar; o hero passa a ser um gesto único.
- **Gesto cinético** — `KineticHeadline`. Ver §4.
- **Ritmo de assinatura** — hero e seção de prova usam `.rc2-section--signature`
  (o token que a Fase 1 criou sem aplicar).
- **Stat/Counter** nos números do case Uno Healthcare, acima dos cards de fato.
- **Ícone fino** por sintoma e por competência, mapeado por título fora da copy.
- Sintomas passaram a usar `SignalList` em vez de bullets próprios.

## 4. O gesto cinético — três garantias

O mecanismo é `KineticHeadline`. A §12 deixava a lista de palavras em aberto
como decisão de copy; ela foi **aprovada em 03/09/2026**: `sistemas`,
`planilhas`, terminando em `ferramentas` — a palavra do H1 aprovado.

1. **O SSR renderiza a copy aprovada.** Verificado no HTML servido: o `<h1>`
   sai com `ferramentas` e `aria-label` com a frase inteira. Sem JS, com
   `prefers-reduced-motion` ou para o crawler, o H1 é exatamente `HOME_COPY.h1`.
2. **A sequência termina na palavra aprovada.** As provisórias passam; a última
   troca volta para `ferramentas`.
3. **`prefix` e `suffix` são fatiados de `HOME_COPY.h1`** em tempo de execução —
   não existe segunda cópia da copy para divergir.

`HOME_HERO_KINETIC` guarda a lista e o flag `copyApproved: true`. Um contrato
fixa as três palavras e verifica que nenhuma provisória vazou para
`HOME_COPY.h1` — mudar a lista passa a exigir decisão explícita.

O comportamento de motion não mudou: gesto único, sem loop.

## 5. Demais páginas

| Página | Aplicado |
|---|---|
| **Soluções** | Ícones por item de lista já vieram do `SignalList` (Fase 2). Numeral do bloco Commerce corrigido para navy/muted. |
| **Sobre** | `NumberedList` no lugar do `StepList`; pull quote e fundo já corretos desde as Fases 1 e 4. |
| **Blog — índice** | Thumbnail de 300px → 400px, na proporção 4:3 da §6. Hover do título corrigido para `--rc2-brand-text`. |
| **Blog — artigo** | Coluna de leitura de **680px** (§5.1), `FaqList`, `ShareRow` e `AuthorByline`. |
| **Avaliações e Projetos** | Estrutura reconstruída na Fase 4; herda tipografia e ritmo. |

### 5.1. A coluna de leitura precisou de mais que um `max-width`

O primeiro ajuste foi `max-w-[680px]` na prosa. Medido no navegador: **544px** —
o cap não fazia nada, porque a coluna já era mais estreita que o alvo. Com o
container em `max-w-6xl` e quatro colunas de largura igual (TOC, texto, autor),
o texto ficava com um quarto do espaço.

Correção: container em `max-w-7xl` e colunas explícitas
`[200px_minmax(0,1fr)_280px]` — o texto passa a ser a coluna elástica, TOC e
autor ficam com a largura que de fato precisam. Medido de novo: **680px**.

## 6. Verificação no navegador

Além de `build`/`lint`/`test`, medi o resultado renderizado:

- H1 da Home no HTML servido: copy aprovada, sem depender de JS.
- `StatCounter`: conta até `US$ 384 mil`, `636`, `20+` e vira Safety Orange ao
  completar; `aria-label` com o valor final durante a contagem.
- Coluna de leitura: 680px.
- **Zero overflow horizontal** em 390 · 768 · 1024 · 1440 px, nas seis páginas
  do escopo — 24 checagens.

## 6.1. Rodada de acabamento — os cinco itens que faltavam

Uma auditoria item a item das §§8 e 9, depois do rollout principal, mostrou
cinco pendências. Todas fechadas.

### Bug funcional na barra de progresso do Contato

O maior dos cinco, e não era um problema visual.

```tsx
// antes — step é `1 | 2`, então a condição é SEMPRE verdadeira
<div className={cn("w-24 h-1", step >= 1 ? "bg-rc2-brand" : "bg-rc2-border")} />
```

A barra ficava cheia e laranja desde a etapa 1 e **nunca comunicava onde a
pessoa estava**. Passava em qualquer teste de comportamento: o valor
funcionava, só não significava nada. Apareceu numa auditoria de spec visual
justamente porque a pergunta era "isto comunica o quê?", não "isto roda?".

Agora o trilho é neutro, o preenchimento é elemento próprio com largura
`(step / TOTAL_STEPS) * 100`, e o bloco expõe `role="progressbar"` com
`aria-valuenow`/`aria-valuemax`. Transição de 300ms ao avançar, com
`motion-reduce:transition-none`.

Verificado no navegador, percorrendo o formulário de verdade:

| | `aria-valuenow` | Preenchimento | Rótulo ativo |
|---|---|---|---|
| Etapa 1 | `1` | 48px de 96 (50%) | "Etapa 1 de 2" em `#C2410C` |
| Etapa 2 | `2` | 96px de 96 (100%) | "Etapa 2 de 2" em `#C2410C` |

### Os outros quatro

| Item | Antes | Agora |
|---|---|---|
| Ícone nos sinais (§9) | `Circle size={7}` — bullet disfarçado de ícone; só as intervenções tinham ícone de verdade | `AlertCircle` 16px, `strokeWidth 1.5`, igual ao par |
| Seta do link de ação (§8) | Só transição de cor | `translateX(2px)` em 150ms, só no `svg`, com saída para reduced-motion. Medido sob hover: `matrix(1, 0, 0, 1, 2, 0)` |
| Card Case (§8) | `gap-6`, o mesmo das grades de rotina | `gap-8 md:gap-10` — a prova social é seção de assinatura |
| Card Testemunho (§8) | `text-sm`/`text-xs` | `.rc2-caption`, em `HomeReviews` e `GoogleReviews` |

A `.rc2-caption` estava **definida e sem nenhum uso no site** — classe morta.
Ao entrar em uso, foi alinhada à escala da §6 (Light 300, 13px; estava em 12px).

## 7. Achado fora do código — CTA descontinuado em conteúdo publicado

O post `/blog/automacao-whatsapp-ia` renderiza o CTA:

> "Solicitar diagnóstico gratuito de automação WhatsApp →"

`AGENTS.md` proíbe "Solicitar diagnóstico" e "diagnóstico gratuito" como CTA
vigente em qualquer página. **Não é corrigível em código:** vem do
`cta_block` do post, no banco, editável pelo admin. Vale uma varredura dos
posts publicados — a Fase 2 tratou a copy do código, não a do CMS.

## 8. Validação

`npm run typecheck` · `npm run lint` (0 erros, 11 warnings pré-existentes) ·
`npm run test` (**417**, com os 32 contratos novos de design system) ·
`npm run build` · `npm run audit:brand` · `npx playwright test` contra
`next start` em porta limpa: **68 passando, 2 falhas pré-existentes**
(`admin.spec.ts:44`, `home-motion.spec.ts:4`).

---

## 9. Rodada de QA de estados e container de ícone (04/09/2026)

### 9.1. O anel de foco era invisível — em todo o site

`§12` da direção de arte registrava que os estados de interação não puderam ser
auditados a partir de screenshots. Auditados agora, no navegador, com foco por
teclado.

O achado: `.ui-focus-ring` usava as utilities `ring-*` do Tailwind e o anel saía
como

```
--tw-ring-color: color-mix(in oklab, #c2410c 20%, transparent)
box-shadow:      ... 1.47313px
```

**20% de opacidade a ~1,5px de espessura** — contraste perto de 1.2:1 contra o
fundo. O anel existia no DOM, passava em qualquer verificação de código, e não
era visível na tela. A regra inviolável nº 3 pede 2px sólidos com 2px de offset.

Correção em três partes, cada uma necessária:

1. **`outline` real no lugar de `box-shadow`** — não some sob `overflow:
   hidden`, acompanha o `border-radius`, não depende das variáveis de ring.
2. **Fora de `@layer`** — a primeira tentativa ficou em `@layer components` e
   não teve efeito: `focus-visible:outline-none` é utility, e utilities ganham
   de components. Estilo sem camada vence qualquer camada.
3. **`--rc2-focus-current`, que herda** — as superfícies navy trocam a cor para
   Safety Orange e todo componente dentro delas acompanha. Antes o footer servia
   anel `#C2410C` sobre `#081827`, abaixo de 3:1.

`.rc2-action-link` também trazia `focus-visible:outline-none` com o mesmo ring
quebrado; foi limpo.

**Nota de método:** `getComputedStyle().outlineColor` reportou `currentColor`
mesmo depois da correção, em leituras repetidas. A confirmação veio por
screenshot do elemento em foco — anel laranja no footer, anel `#C2410C` no
header. Quando a medição e a tela discordam, a tela decide.

### 9.2. Container de ícone

`IconBadge` (`components/ui/`), conforme a §6 atualizada: fundo Accent Soft
`#FFF0E9`, radius 8px, borda hairline, 32–36px, ícone Graphite Navy dentro. Em
área navy usa a borda escura do sistema, já que Accent Soft não existe como
superfície ali.

Aplicado em Sintomas, Competências e Sinais — os três que a §6 nomeia. O
container **não muda de cor por estado**, com contrato para isso: mudaria
competiria com o Princípio 1.

### 9.3. Itens que não precisaram de mudança

- **Tokens de assinatura (72/160px)** já estavam aplicados no hero e na seção de
  Stat/Counter desde a Fase 5. Nada a fazer.
- **`--rc2-bg` para `#FFFFFF`** não foi aplicado — ver `docs/28`.
