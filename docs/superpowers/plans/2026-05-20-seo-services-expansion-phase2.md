# Phase 2 SEO Service Pages Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir SEO semântico das páginas `/servicos/[slug]` com novos blocos de conteúdo, metadata aprimorada, schemas enriquecidos e FAQ estruturado, sem redesign do site.

**Architecture:** Conteúdo de serviço permanece 100% hardcoded em `services.ts` como fonte única. A página dinâmica de serviço passa a renderizar novas seções em ordem definida e injeta JSON-LD adicional (`FAQPage`) condicional. Ajustes complementares em `llms-full.txt`, `sitemap.ts` e checklist garantem coerência de descoberta sem alterar CMS/blog/admin.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, JSON-LD inline.

---

## File Structure Map

- Modify: `src/lib/content/services.ts`
  - expandir tipos e conteúdo dos 5 serviços.
- Modify: `src/app/(public)/servicos/[slug]/page.tsx`
  - renderizar novas seções, atualizar metadata, anchors e schema.
- Modify: `src/app/(public)/servicos/page.tsx`
  - apenas ajustes de compatibilidade de tipo (se necessário).
- Modify: `src/app/llms-full.txt/route.ts`
  - incluir novos blocos de serviço na saída.
- Modify: `src/app/sitemap.ts`
  - atualizar `lastModified` de rotas de serviço para data fixa `2026-05-20`.
- Modify: `docs/SEO_CHECKLIST.md`
  - seção “Páginas de Serviço”.

### Task 1: Expandir tipos e conteúdo de `services.ts`

**Files:**
- Modify: `src/lib/content/services.ts`

- [ ] **Step 1: Introduzir novos tipos de serviço**

Adicionar:

```ts
export type ServiceFaq = { question: string; answer: string };
export type ServiceRelatedLink = { label: string; href: string };
```

E expandir `Service` com:
`seoTitle`, `painPoints`, `useCases`, `implementationSteps`, `integrations`, `metrics`, `faq`, `relatedLinks`.

- [ ] **Step 2: Preencher os 5 serviços com todos os novos campos**

Aplicar os conteúdos fornecidos no prompt para os slugs:
- `automacoes-com-ia`
- `agentes-de-ia`
- `automacao-de-processos`
- `e-commerce`
- `sites-e-landing-pages`

- [ ] **Step 3: Verificar invariantes**

- nenhum slug alterado
- nenhum serviço novo criado
- campos antigos preservados

- [ ] **Step 4: Commit**

```bash
git add src/lib/content/services.ts
git commit -m "feat: expand seo content model for service pages"
```

### Task 2: Atualizar template `/servicos/[slug]` com novas seções

**Files:**
- Modify: `src/app/(public)/servicos/[slug]/page.tsx`

- [ ] **Step 1: Atualizar metadata com `seoTitle`**

Em `generateMetadata`:
- `title: service.seoTitle || service.title`
- Open Graph title idem
- manter description/canonical/buildOg

- [ ] **Step 2: Renderizar novas seções na ordem exigida**

Adicionar blocos com IDs e listas para:
- `problemas`
- `casos-de-uso`
- `items`
- `implantacao`
- `integracoes`
- `indicadores`
- `beneficios`
- `faq`
- `links-relacionados`

Mantendo breadcrumb/hero, navegação entre serviços e CTA final existentes.

- [ ] **Step 3: Implementar FAQ visual acessível**

Usar `<details>`/`<summary>` (sem bibliotecas novas).

- [ ] **Step 4: Atualizar `PageAnchorNav`**

Usar anchors:
- `problemas`
- `casos-de-uso`
- `implantacao`
- `integracoes`
- `indicadores`
- `faq`

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(public)/servicos/[slug]/page.tsx'
git commit -m "feat: render expanded seo sections on service detail pages"
```

### Task 3: Enriquecer dados estruturados na página de serviço

**Files:**
- Modify: `src/app/(public)/servicos/[slug]/page.tsx`

- [ ] **Step 1: Enriquecer `schemaService`**

Adicionar campos:
- `alternateName`
- `serviceType`
- `audience` (`BusinessAudience`)
- `keywords`

Preservar campos atuais (`provider`, `url`, `areaServed`, etc.).

- [ ] **Step 2: Adicionar `schemaFaq` condicional**

Se `service.faq.length > 0`, renderizar script JSON-LD:

```ts
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ...
}
```

- [ ] **Step 3: Commit**

```bash
git add 'src/app/(public)/servicos/[slug]/page.tsx'
git commit -m "feat: enrich service structured data with FAQ schema"
```

### Task 4: Garantir compatibilidade da listagem `/servicos`

**Files:**
- Modify if needed: `src/app/(public)/servicos/page.tsx`

- [ ] **Step 1: Validar compilação com tipo `Service` expandido**

- confirmar que a listagem continua usando campos antigos sem mudanças de layout.

- [ ] **Step 2: Ajustar apenas typing se necessário**

- sem redesign.

- [ ] **Step 3: Commit (somente se houve alteração)**

```bash
git add 'src/app/(public)/servicos/page.tsx'
git commit -m "chore: keep services listing compatible with expanded service model"
```

### Task 5: Atualizar `/llms-full.txt` com novos blocos de serviço

**Files:**
- Modify: `src/app/llms-full.txt/route.ts`

- [ ] **Step 1: Expandir seção de serviços**

Para cada serviço incluir também:
- problemas que resolvemos
- casos de uso
- etapas de implantação
- integrações possíveis
- indicadores
- FAQ

- [ ] **Step 2: Preservar regra de posts da Fase 1**

- incluir `published`
- excluir `noindex`
- manter `nofollow` se publicado

- [ ] **Step 3: Commit**

```bash
git add src/app/llms-full.txt/route.ts
git commit -m "feat: expand llms-full service sections for phase-2 seo"
```

### Task 6: Atualizar `sitemap.ts` para rotas de serviço

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Ajustar `lastModified` das rotas de serviço para data fixa**

- usar `2026-05-20` nas rotas de serviço afetadas.
- manter demais rotas conforme estratégia vigente.

- [ ] **Step 2: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "chore: refresh service sitemap lastModified for phase-2 updates"
```

### Task 7: Atualizar `SEO_CHECKLIST.md`

**Files:**
- Modify: `docs/SEO_CHECKLIST.md`

- [ ] **Step 1: Adicionar seção “Páginas de Serviço”**

Itens marcados:
- serviços expandidos com novos blocos
- metadata com `seoTitle`
- schema `Service` enriquecido
- schema `FAQPage`
- links internos relacionados

- [ ] **Step 2: Preservar seção LLM/GEO da Fase 1**

- sem remoções.

- [ ] **Step 3: Commit**

```bash
git add docs/SEO_CHECKLIST.md
git commit -m "docs: update seo checklist for phase-2 service page expansion"
```

### Task 8: Validação final obrigatória

**Files:**
- Validate project-wide

- [ ] **Step 1: Rodar typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 2: Rodar lint**

Run: `npm run lint`
Expected: PASS sem errors.

- [ ] **Step 3: Rodar build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit final de correções residuais (se houver)**

```bash
git add -A
git commit -m "chore: finalize phase-2 seo service expansion validation"
```

## Self-Review

- Cobertura da spec: inclui expansão dos 5 serviços, renderização completa em `/servicos/[slug]`, FAQ visual, JSON-LD `Service`+`FAQPage`, metadata `seoTitle`, integração com `llms-full`, atualização de sitemap e checklist.
- Placeholder scan: sem TODO/TBD.
- Escopo preservado: sem redesign, sem CMS/admin/blog migrations, sem dependências novas, sem alteração de slugs.
