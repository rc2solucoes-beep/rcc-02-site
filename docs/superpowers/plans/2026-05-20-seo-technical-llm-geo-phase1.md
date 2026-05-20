# Phase 1 SEO Técnico + LLM/GEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a Fase 1 de SEO técnico + LLM/GEO com rotas `/llms.txt` e `/llms-full.txt`, ajustes de robots/sitemap/blog metadata e checklist atualizado, sem alterações visuais ou de conteúdo comercial principal.

**Architecture:** Implementação mínima orientada a rotas e metadata no App Router, reaproveitando `services`, `createPublicClient` e tipos existentes. As novas rotas são `text/plain` com cache controlado; filtros de publicação do blog são aplicados no backend para evitar exposição indevida. Mudanças em `robots`, `sitemap` e metadata são incrementais e compatíveis com a estrutura atual.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase client público, MetadataRoute API.

---

## File Structure Map

- Create: `src/app/llms.txt/route.ts`
  - manifesto curto curado para LLMs.
- Create: `src/app/llms-full.txt/route.ts`
  - manifesto completo com institucional + serviços + posts válidos.
- Modify: `src/app/robots.ts`
  - regras adicionais para bots LLM/search.
- Modify: `src/app/(public)/blog/[slug]/page.tsx`
  - canonical explícito + ajuste de logo no JSON-LD.
- Modify: `src/app/(public)/blog/page.tsx`
  - otimização de query sem `content`.
- Modify: `src/app/sitemap.ts`
  - `lastModified` fixo por rota estática + inclusão de llms routes.
- Modify: `docs/SEO_CHECKLIST.md`
  - seção LLM/GEO e sincronização de itens.

### Task 1: Criar rota `/llms.txt`

**Files:**
- Create: `src/app/llms.txt/route.ts`

- [ ] **Step 1: Escrever teste/manual contract da rota em comentário de implementação**

```ts
// GET /llms.txt => 200 text/plain; charset=utf-8 + cache headers
```

- [ ] **Step 2: Implementar route handler estático**

```ts
export const dynamic = "force-static";

export async function GET() {
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
```

- [ ] **Step 3: Verificação local de tipagem da nova rota**

Run: `npm run typecheck`
Expected: sem erro referente ao arquivo novo.

- [ ] **Step 4: Commit**

```bash
git add src/app/llms.txt/route.ts
git commit -m "feat: add static llms.txt route"
```

### Task 2: Criar rota `/llms-full.txt`

**Files:**
- Create: `src/app/llms-full.txt/route.ts`

- [ ] **Step 1: Implementar fetch de posts com regra de inclusão/exclusão**

- incluir somente `status = published`
- excluir `seo_index_status = noindex`
- manter `nofollow` se publicado

Query base esperada:

```ts
.from("posts")
.select("slug,title,summary,category,seo_keyword_primary,faq_items,status,seo_index_status,published_at")
.eq("status", "published")
.not("seo_index_status", "eq", "noindex")
```

- [ ] **Step 2: Implementar parser defensivo para `faq_items`**

- tratar `null`
- tratar array de objetos
- tratar string JSON
- fallback seguro para lista vazia

- [ ] **Step 3: Implementar montagem markdown final e headers**

```ts
export const revalidate = 3600;

return new Response(markdown, {
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
  },
});
```

- [ ] **Step 4: Implementar fallback quando Supabase falhar**

- manter bloco institucional + serviços
- suprimir apenas seção de posts quando erro

- [ ] **Step 5: Commit**

```bash
git add src/app/llms-full.txt/route.ts
git commit -m "feat: add llms-full.txt route with services and published posts"
```

### Task 3: Atualizar `robots.ts`

**Files:**
- Modify: `src/app/robots.ts`

- [ ] **Step 1: Extrair `disallowedRoutes` reutilizável**

```ts
const disallowedRoutes = ["/admin", "/admin/", "/api/"];
```

- [ ] **Step 2: Adicionar regras explícitas para bots LLM/search**

- `*`
- `OAI-SearchBot`
- `GPTBot`
- `Google-Extended`

- [ ] **Step 3: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat: add explicit LLM bot directives to robots"
```

### Task 4: Ajustar metadata/schema no post do blog

**Files:**
- Modify: `src/app/(public)/blog/[slug]/page.tsx`

- [ ] **Step 1: Adicionar canonical em `generateMetadata`**

```ts
alternates: {
  canonical: `${BASE_URL}/blog/${slug}`,
},
```

- [ ] **Step 2: Ajustar logo de publisher no JSON-LD**

```ts
url: `${BASE_URL}/images/logo-base.png`,
```

- [ ] **Step 3: Verificar que `title/description/robots/openGraph/twitter` permanecem**

Run: inspeção no diff.
Expected: campos preservados.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/(public)/blog/[slug]/page.tsx'
git commit -m "feat: add canonical and update blogposting publisher logo"
```

### Task 5: Otimizar query da listagem do blog

**Files:**
- Modify: `src/app/(public)/blog/page.tsx`

- [ ] **Step 1: Trocar `.select(...)` por lista enxuta sem `content`**

```ts
.select("id,slug,title,summary,cover_url,cover_url_alt,published_at,created_at,updated_at,status,category,reading_time_minutes")
```

- [ ] **Step 2: Validar compatibilidade com tipo `Post`**

- manter cast existente ou ajustar typing local sem quebrar build.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/(public)/blog/page.tsx'
git commit -m "perf: reduce blog listing query payload"
```

### Task 6: Melhorar `sitemap.ts`

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Substituir estáticos com datas fixas por rota**

Criar estrutura `staticPages` com:
- `path`
- `lastModified` (string fixa)
- `changeFrequency`
- `priority`

- [ ] **Step 2: Mapear `staticPages` para `MetadataRoute.Sitemap`**

- converter `lastModified` string para `Date`
- preservar BASE_URL

- [ ] **Step 3: Manter posts dinâmicos do Supabase com `updated_at`**

- sem alterar lógica de publicação já existente.

- [ ] **Step 4: Adicionar `/llms.txt` e `/llms-full.txt`**

- `changeFrequency: "weekly"`
- `priority: 0.3`

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: improve sitemap freshness metadata and include llms routes"
```

### Task 7: Atualizar `docs/SEO_CHECKLIST.md`

**Files:**
- Modify: `docs/SEO_CHECKLIST.md`

- [ ] **Step 1: Adicionar seção `LLM / GEO` com itens marcados**

- `/llms.txt`
- `/llms-full.txt`
- robots com bots explícitos
- canonical nos posts
- sitemap com rotas llms

- [ ] **Step 2: Revisar itens que possam ter ficado desatualizados**

- ajustar bullets em "Sitemap e Robots" se necessário.

- [ ] **Step 3: Commit**

```bash
git add docs/SEO_CHECKLIST.md
git commit -m "docs: update seo checklist with llm geo phase-1 items"
```

### Task 8: Validação final obrigatória

**Files:**
- Validate project-wide

- [ ] **Step 1: Rodar typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 2: Rodar lint**

Run: `npm run lint`
Expected: PASS sem erros.

- [ ] **Step 3: Rodar build**

Run: `npm run build`
Expected: build concluído com sucesso.

- [ ] **Step 4: Commit final se houver ajustes pós-validação**

```bash
git add -A
git commit -m "chore: finalize phase-1 seo llm geo validation fixes"
```

## Self-Review

- Cobertura de spec: completa para `/llms.txt`, `/llms-full.txt`, `robots`, canonical+schema, query de `/blog`, `sitemap`, `SEO_CHECKLIST` e validações.
- Regra crítica confirmada no plano: **`published + nofollow` é incluído**; apenas `noindex` é excluído em `/llms-full.txt`.
- Placeholder scan: sem `TODO/TBD`.
- Escopo: focado em Fase 1 sem mudanças visuais, sem migrations, sem dependências novas.
