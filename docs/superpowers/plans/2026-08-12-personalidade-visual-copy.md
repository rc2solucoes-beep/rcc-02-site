# Personalidade Visual por Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reforçar o posicionamento operacional da RC2 com uma nova seção na home, prova do fundador e CTAs contextualizados sem alterar CSS, tokens, destinos ou componentes compartilhados.

**Architecture:** A nova seção será adicionada diretamente à home usando `SectionLabel` e utilities já existentes. Os rótulos hardcoded serão alterados em seus pontos de renderização; usos de `CTABlock` receberão `primaryLabel` nas chamadas, preservando o valor padrão do componente.

**Tech Stack:** Next.js 16.2.4, React 19, TypeScript, Tailwind CSS 4, Vitest, Playwright.

## Global Constraints

- Não alterar `src/app/globals.css`, tokens ou definições de classes.
- Não alterar a estrutura interna de componentes compartilhados.
- Não criar componente novo.
- A única nova estrutura é a seção “O que a RC2 não é” na home.
- Não alterar destinos, tracking ou comportamento dos CTAs.
- Preservar o CTA do header e o submit do formulário.
- A prova principal do fundador deve ocupar no máximo três linhas em 390 px.
- “Mapear meus gargalos” deve permanecer em uma linha em 1440 px e 390 px.
- Nenhum texto novo pode usar palavras da lista de evitar da seção 3 do guia de marca.

---

### Task 1: Registrar os contratos visíveis de copy e navegação

**Files:**
- Create: `tests/e2e/personality-copy.spec.ts`
- Test: `tests/e2e/personality-copy.spec.ts`

**Interfaces:**
- Consumes: rotas públicas da aplicação em `http://127.0.0.1:3000`.
- Produces: cobertura de aceitação para a nova seção e para os rótulos/destinos alterados.

- [ ] **Step 1: Escrever o teste de aceitação que falha**

Criar testes Playwright que:

- carreguem `/` e verifiquem o heading “O que a RC2 não é” e os três itens;
- verifiquem a prova do fundador;
- verifiquem os CTAs da home pelos nomes aprovados e `href="/contato"`;
- carreguem `/servicos/automacoes-com-ia` e verifiquem os rótulos intermediário e final distintos;
- carreguem `/solucoes/atendimento-lento` e verifiquem “Aplicar isso na minha operação”;
- carreguem `/blog/automacao-whatsapp-ia` e verifiquem “Falar sobre o meu caso” no CTA padrão;
- confirmem que “Solicitar diagnóstico” continua no header e no submit de `/contato`.

- [ ] **Step 2: Executar o teste para verificar RED**

Run: `npx playwright test tests/e2e/personality-copy.spec.ts`

Expected: FAIL porque a nova seção e os novos rótulos ainda não existem.

---

### Task 2: Implementar a copy e o posicionamento na home

**Files:**
- Modify: `src/app/(public)/page.tsx:120-347`
- Modify: `src/components/marketing/HeroActions.tsx:33`
- Test: `tests/e2e/personality-copy.spec.ts`

**Interfaces:**
- Consumes: `SectionLabel`, `.rc2-rule`, `.rc2-section`, `TrackedLink` e `CTABlock` existentes.
- Produces: nova seção visível e rótulos contextuais da home.

- [ ] **Step 1: Atualizar a prova do fundador no hero**

Substituir o apoio atual por duas linhas dentro do mesmo ponto do fluxo:

```tsx
<div className="mt-5 text-sm text-rc2-text/70 max-w-2xl">
  <p className="font-semibold text-rc2-text">
    A RC2 usa no próprio comercial o que implementa nos clientes: um agente de IA filtra, e quem conversa com você é o Robson.
  </p>
  <p className="mt-1">20+ anos em TI, e-commerce e operação digital.</p>
</div>
```

- [ ] **Step 2: Adicionar a seção de posicionamento antes de “Diferencial”**

Usar `bg-rc2-bg-alt`, `SectionLabel`, `rc2-h2`, `.rc2-rule` e classes já presentes no projeto. Renderizar os três itens e o fechamento exatamente como aprovado.

- [ ] **Step 3: Atualizar os CTAs da home sem alterar destinos**

- `HeroActions.tsx`: “Ver onde minha operação trava”.
- Link `/contato` em “Escolha pela sua dor”: “Diagnosticar minha dor”.
- Sexto card do grid: “Mapear meus gargalos”.
- `CTABlock` final: `primaryLabel="Começar pelo diagnóstico"`.

- [ ] **Step 4: Executar o teste da home**

Run: `npx playwright test tests/e2e/personality-copy.spec.ts --grep "home"`

Expected: PASS para os cenários da home.

---

### Task 3: Contextualizar CTAs de serviços, soluções e blog

**Files:**
- Modify: `src/app/(public)/servicos/[slug]/page.tsx:299-418`
- Modify: `src/app/(public)/solucoes/[slug]/page.tsx:313`
- Modify: `src/components/blog/BlogPostArticle.tsx:351-357`
- Test: `tests/e2e/personality-copy.spec.ts`

**Interfaces:**
- Consumes: prop existente `CTABlock.primaryLabel?: string`.
- Produces: rótulos contextuais com destinos `/contato` preservados.

- [ ] **Step 1: Atualizar a página individual de serviço**

- CTA intermediário hardcoded: “Ver se serve para o meu caso”.
- CTA final: `primaryLabel="Aplicar isso na minha operação"`.

- [ ] **Step 2: Atualizar a página individual de solução**

Adicionar `primaryLabel="Aplicar isso na minha operação"` à chamada existente de `CTABlock`.

- [ ] **Step 3: Atualizar o CTA padrão do blog**

Substituir o texto hardcoded por “Falar sobre o meu caso →”, preservando link e tracking.

- [ ] **Step 4: Executar toda a cobertura de aceitação**

Run: `npx playwright test tests/e2e/personality-copy.spec.ts`

Expected: PASS.

---

### Task 4: Verificar marca, build, responsividade e evidências visuais

**Files:**
- Verify: `documentos-base/RC2_Brand_Guide_v2.1.md`
- Create: `.playwright-mcp/audit/personalidade-home-after-desktop-1440.png`
- Create: `.playwright-mcp/audit/personalidade-home-after-mobile-390.png`

**Interfaces:**
- Consumes: site compilado e servidor local.
- Produces: evidência de build, auditoria de marca, capturas e relatório de quebra de linhas.

- [ ] **Step 1: Verificar palavras proibidas nos textos novos**

Comparar todos os novos textos com a lista da seção 3 do guia de marca. A busca deve excluir o próprio guia e documentos que citam a lista.

- [ ] **Step 2: Executar build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 3: Executar auditoria de marca**

Run: `npm run audit:brand`

Expected: exit code 0 e nenhuma violação.

- [ ] **Step 4: Capturar a home após a implementação**

Usar MCP Playwright em 1440 px e 390 px, página inteira, mantendo as capturas anteriores para comparação.

- [ ] **Step 5: Medir quebra de linha de cada novo CTA em 390 px**

Para cada CTA novo visível nas rotas afetadas, comparar `getBoundingClientRect().height` com `line-height`. Relatar uma linha ou quebra; não encurtar nenhum rótulo sem autorização.
