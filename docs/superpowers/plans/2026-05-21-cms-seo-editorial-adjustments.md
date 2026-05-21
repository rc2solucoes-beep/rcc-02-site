# CMS SEO Editorial Adjustments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar validação e UX editorial de SEO no CMS de posts sem criar conteúdo, sem migrations e sem dependências novas, mantendo rascunhos flexíveis.

**Architecture:** A implementação mantém `CreatePostSchema` como fonte server-side de validação estrutural e adiciona reforços de UX não bloqueantes no formulário/tabs para qualidade editorial em publicação. Regras de operação são consolidadas em dois documentos novos para reduzir erro humano no fluxo de edição. Não há alteração de banco nem de rotas públicas.

**Tech Stack:** Next.js 16 App Router, TypeScript, Zod, React Server Actions, Tailwind CSS.

---

## File Structure Map

### Create
- `docs/CMS_SEO_EDITORIAL_GUIDE.md`: guia de preenchimento SEO no CMS.
- `docs/CMS_SEO_QA_CHECKLIST.md`: checklist de revisão editorial pré-publicação.

### Modify
- `src/lib/validations/post.ts`: reforço de slug estrutural e mensagens claras.
- `src/components/admin/PostFormRefactored.tsx`: ampliar warnings não bloqueantes conforme status/campos.
- `src/components/admin/PostFormTabs/SeoTab.tsx`: contadores e microcopy SEO.
- `src/components/admin/PostFormTabs/ImageTab.tsx`: reforço de orientação de alt/OG.
- `docs/SEO_CHECKLIST.md`: seção CMS SEO Editorial.
- `README.md`: links de documentação nova.

### Keep unchanged (explicitly)
- `src/app/admin/(protected)/posts/actions.ts` (sem bloqueios novos de qualidade editorial)
- Tabela `posts`/migrations
- Rotas públicas/blog/sitemap/robots/llms

---

### Task 1: Baseline e cobertura de validação estrutural

**Files:**
- Modify: `src/lib/validations/post.ts`

- [ ] **Step 1: Escrever teste unitário para regex de slug (se houver suíte para validações)**

```ts
// Exemplo de casos para schema safeParse:
const valid = ["post-valido", "ia-2026", "guia-seo"];
const invalid = ["-inicio", "fim-", "duplo--hifen", "Com-Maiuscula", "com acento", "com_underscore"];
```

- [ ] **Step 2: Rodar teste focal para confirmar falha inicial (ou pular com evidência se suíte inexistente)**

Run: `npm run test -- post`
Expected: pelo menos um caso inválido passando indevidamente antes do ajuste (quando aplicável).

- [ ] **Step 3: Ajustar regex do slug no Zod para padrão estrito**

```ts
slug: z
  .string()
  .min(1, "Slug é obrigatório")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use apenas letras minúsculas, números e hífens. Não use acentos, espaços ou caracteres especiais."
  ),
```

- [ ] **Step 4: Rodar typecheck + teste focal**

Run:
```bash
npm run typecheck
npm run test -- post
```
Expected: typecheck ok; casos de slug inválido rejeitados.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/post.ts
git commit -m "feat: tighten slug structural validation with clear SEO message"
```

---

### Task 2: Expandir warnings editoriais não bloqueantes no formulário

**Files:**
- Modify: `src/components/admin/PostFormRefactored.tsx`

- [ ] **Step 1: Escrever teste de função de warnings (ou extrair função local para facilitar cobertura)**

```ts
// Casos esperados:
// - published sem keyword primária => warning
// - cover_url com alt vazio => warning
// - guia/tutorial com FAQ < 3 => warning
// - meta description fora da faixa => warning
```

- [ ] **Step 2: Ajustar regras de warnings para cobrir itens aprovados**

Implementar/confirmar warnings não bloqueantes para:
- meta title ausente/longo
- meta description ausente/faixa não ideal
- keyword primária ausente
- cover sem alt
- FAQ fraco para guia/tutorial
- CTA ausente
- slug fora do padrão (checar por regex local de exibição)

- [ ] **Step 3: Garantir que warnings não bloqueiem `handleSubmit`**

Verificar que o submit continua chamando `formAction(fd)` independentemente dos warnings.

- [ ] **Step 4: Rodar validação local do componente**

Run: `npm run typecheck`
Expected: sem erros; comportamento de submit intacto.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/PostFormRefactored.tsx
git commit -m "feat: expand non-blocking SEO editorial warnings in post form"
```

---

### Task 3: Melhorar UX da aba SEO com contadores e microcopy

**Files:**
- Modify: `src/components/admin/PostFormTabs/SeoTab.tsx`

- [ ] **Step 1: Adicionar contadores de caractere contextuais**

Adicionar feedback para:
- `seo_meta_title` (ideal <= 60)
- `seo_meta_description` (ideal 120-160)
- `seo_keyword_primary` (tamanho e objetivo)

- [ ] **Step 2: Ajustar textos de ajuda aprovados**

Incluir microcopy:
- slug curto sem acento/espaço/hífen duplo
- keyword primária para intenção de busca
- noindex/nofollow com uso cauteloso

- [ ] **Step 3: Revisar acessibilidade de mensagens**

Garantir classes legíveis e sem contraste insuficiente para texto auxiliar.

- [ ] **Step 4: Rodar typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/PostFormTabs/SeoTab.tsx
git commit -m "feat: improve seo tab guidance and character counters"
```

---

### Task 4: Reforçar orientação de imagem/alt/OG

**Files:**
- Modify: `src/components/admin/PostFormTabs/ImageTab.tsx`

- [ ] **Step 1: Ajustar mensagens de apoio em `cover_url_alt` e OG**

Adicionar/revisar ajuda:
- ALT obrigatório para boa acessibilidade/SEO quando houver capa
- OG title/description com limites recomendados

- [ ] **Step 2: Confirmar que não há bloqueio novo**

Não adicionar validação impeditiva no componente.

- [ ] **Step 3: Rodar typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PostFormTabs/ImageTab.tsx
git commit -m "feat: refine image seo guidance for alt and og fields"
```

---

### Task 5: Confirmar ausência de bloqueios novos em actions

**Files:**
- Inspect only: `src/app/admin/(protected)/posts/actions.ts`

- [ ] **Step 1: Verificar que actions continuam usando `CreatePostSchema`**

Conferir `safeParse(raw)` em create/update.

- [ ] **Step 2: Verificar ausência de bloqueios editoriais subjetivos**

Não inserir validações adicionais de qualidade que impeçam publicação.

- [ ] **Step 3: Registrar evidência no changelog interno do PR/entrega**

Documentar que fluxo de draft/published foi preservado com warnings não bloqueantes.

- [ ] **Step 4: Commit (somente se houver ajuste mínimo necessário)**

```bash
# Se nenhum ajuste, pular commit desta task.
```

---

### Task 6: Criar documentação operacional CMS SEO

**Files:**
- Create: `docs/CMS_SEO_EDITORIAL_GUIDE.md`
- Create: `docs/CMS_SEO_QA_CHECKLIST.md`

- [ ] **Step 1: Criar `CMS_SEO_EDITORIAL_GUIDE.md` com seções obrigatórias**

Incluir:
1. Objetivo
2. Título
3. Slug
4. Summary
5. Meta title
6. Meta description
7. Keyword primária/secundárias
8. Categoria/tags
9. FAQ
10. CTA
11. Relacionados
12. Imagens/ALT/OG
13. Regras `index/noindex/nofollow`
14. Checklist final

- [ ] **Step 2: Criar `CMS_SEO_QA_CHECKLIST.md`**

Incluir checklist de Conteúdo, SEO, Conversão, Imagem, Publicação conforme spec aprovado.

- [ ] **Step 3: Revisão rápida de clareza e consistência**

Checar terminologia alinhada aos campos reais do `Post`.

- [ ] **Step 4: Commit**

```bash
git add docs/CMS_SEO_EDITORIAL_GUIDE.md docs/CMS_SEO_QA_CHECKLIST.md
git commit -m "docs: add cms seo editorial guide and qa checklist"
```

---

### Task 7: Atualizar checklist global e README

**Files:**
- Modify: `docs/SEO_CHECKLIST.md`
- Modify: `README.md`

- [ ] **Step 1: Atualizar `SEO_CHECKLIST.md` com seção CMS SEO Editorial**

Adicionar itens:
- validações editoriais revisadas
- mensagens de apoio/documentação
- padrão de slug reforçado
- regras meta title/meta description documentadas
- guia CMS SEO criado
- checklist QA criado

- [ ] **Step 2: Atualizar `README.md` (seção documentação)**

Adicionar linhas:
- `docs/CMS_SEO_EDITORIAL_GUIDE.md`
- `docs/CMS_SEO_QA_CHECKLIST.md`

- [ ] **Step 3: Commit**

```bash
git add docs/SEO_CHECKLIST.md README.md
git commit -m "docs: update seo checklist and readme for cms seo editorial phase"
```

---

### Task 8: Validação final obrigatória

**Files:**
- Modify (se necessário): qualquer arquivo impactado por correções finais

- [ ] **Step 1: Rodar validações principais**

Run:
```bash
npm run typecheck
npm run lint
npm run build
```
Expected:
- typecheck ok
- lint sem errors (warnings podem persistir se preexistentes)
- build ok

- [ ] **Step 2: Rodar testes unitários gerais**

Run: `npm run test`
Expected: passar; se falhar por casos preexistentes não relacionados, documentar claramente.

- [ ] **Step 3: Smoke check funcional do CMS (manual local)**

Checklist manual:
- abrir `/admin/posts/novo`
- validar warnings aparecendo sem bloquear rascunho
- salvar draft com campos incompletos
- confirmar mensagens de orientação nos campos SEO

- [ ] **Step 4: Commit de correções finais (se houver)**

```bash
git add -A
git commit -m "chore: finalize cms seo editorial adjustments validation fixes"
```

---

## Spec Coverage Check

- Tipos existentes revisados: coberto (Task 1 + inspeção)
- Validação Zod melhorada sem quebrar drafts: coberto (Task 1)
- Warnings editoriais não bloqueantes: coberto (Task 2)
- Mensagens de apoio e contadores: coberto (Tasks 3 e 4)
- Actions sem bloqueio novo: coberto (Task 5)
- Docs novas + checklist: coberto (Task 6)
- SEO checklist + README: coberto (Task 7)
- Validação final e teste: coberto (Task 8)

## Placeholder Scan

- Sem TODO/TBD
- Passos com comandos explícitos
- Comportamentos esperados descritos

## Type Consistency Check

- Campos de `Post` respeitados
- Sem campos novos fora do schema atual
- `CreatePostSchema` permanece contrato central de servidor