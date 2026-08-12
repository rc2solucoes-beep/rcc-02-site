# Tipografia e Ritmo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o sistema tipográfico e introduzir ritmo semântico em `/sobre` e `/servicos` sem alterar conteúdo ou estrutura.

**Architecture:** O CSS global expõe modificadores de seção e uma utility de Barlow Bold regular. Componentes compartilhados recebem apenas trocas de classe; as páginas aplicam os modificadores por `className` já existente.

**Tech Stack:** Next.js 16, React, Tailwind CSS, CSS utilities, Playwright.

## Global Constraints

- Não alterar copy, DOM ou APIs de componentes.
- Não aplicar variantes de ritmo à home.
- Manter 404 e erro em Barlow Condensed ExtraBold.
- Validar em 1440px e 390px.

---

### Task 1: Contratos tipográficos e de ritmo

**Files:**
- Create: `tests/e2e/typography-rhythm.spec.ts`

- [x] Escrever testes de estilos computados para tracking, família/peso e paddings semânticos.
- [x] Executar `npx playwright test tests/e2e/typography-rhythm.spec.ts` e confirmar falha contra o estado anterior.

### Task 2: Sistema tipográfico

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/marketing/CTABlock.tsx`
- Modify: `src/components/marketing/StepList.tsx`
- Modify: `src/components/GoogleReviews.tsx`
- Modify: `src/app/(public)/page.tsx`

- [x] Fixar tracking negativo em H1/H2/display.
- [x] Criar utility Barlow Bold regular.
- [x] Remover display de CTA, numerais auxiliares e H2 “Diferencial”.

### Task 3: Ritmo semântico

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/(public)/sobre/page.tsx`
- Modify: `src/app/(public)/servicos/page.tsx`

- [x] Criar `opening`, `argument`, `proof` e `closing` com os valores aprovados.
- [x] Aplicar as variantes apenas em `/sobre` e `/servicos`.
- [x] Executar o teste específico e confirmar passagem.

### Task 4: Evidência e regressão

- [x] Capturar depois em todos os viewports solicitados.
- [x] Medir escala tipográfica dentro de `main`.
- [x] Executar `npm run build`.
- [x] Executar `npx playwright test`.
- [x] Executar `npm run audit:brand`.
- [x] Executar `git diff --check` e revisar que nenhum arquivo fora do escopo mudou.
