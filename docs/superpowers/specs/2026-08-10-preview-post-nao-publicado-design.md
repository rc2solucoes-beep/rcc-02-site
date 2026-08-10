# Preview de post não publicado (admin-only)

**Data:** 2026-08-10
**Status:** Aprovado

## Problema

O CMS permite posts com status `draft` e `scheduled`, mas não há como
**visualizar** como um post não publicado ficará no blog antes de publicar. A
página pública (`/blog/[slug]`) filtra `status = 'published'` e a RLS do Supabase
também só libera `published` ao cliente anônimo, então o post simplesmente
retorna 404 até publicar.

Necessidade: editores logados no `/admin` precisam pré-visualizar o post
renderizado (com o visual real do site) antes da publicação.

## Decisão de acesso

Preview **apenas para admin logado** (sem link compartilhável para terceiros
nesta iteração). A proteção reutiliza `requireAdmin()`
(`src/lib/admin/requireAdmin.ts`), que valida a sessão Supabase + a tabela
`admin_users`.

## Abordagem

Rota dedicada e protegida, em vez de Next Draft Mode. Motivo principal:
**isolamento de segurança** — o caminho de dados público permanece estritamente
`published`; conteúdo não publicado só é alcançável por uma rota explicitamente
autenticada. Sem cookie, sem estado.

## Componentes

### 1. `src/components/blog/BlogPostArticle.tsx` (novo)

Componente de renderização puro, extraído do corpo atual de
`src/app/(public)/blog/[slug]/page.tsx` (hoje inline no default export, ~linhas
110–540): scripts JSON-LD, `BackToTopButton`, e o `<article>` completo
(breadcrumb, header, TOC, conteúdo sanitizado, FAQ, compartilhamento, CTA, posts
relacionados, sidebar do autor), incluindo o parsing de `sanitizeAndAddIds`,
`faq_items` e `cta_block`.

- Props: `post: Post`, `relatedPosts: Post[]`.
- Responsabilidade única: renderizar um post. **Não busca dados.**

### 2. `src/app/(public)/blog/[slug]/page.tsx` (refatorado)

Mantém `getPost` (só `published`), `getRelatedPosts`, `generateStaticParams`,
`generateMetadata` e `revalidate = 60`. O default export encolhe para:
buscar → `notFound()` se null → buscar relacionados → `<BlogPostArticle …/>`.
Comportamento público **idêntico** (verificação de regressão no browser).

### 3. `src/app/(public)/blog/[slug]/preview/page.tsx` (novo)

- `const admin = await requireAdmin(); if (!admin.ok) notFound();` → 404 para
  não-admin (não revela existência).
- Busca o post por slug via `createSessionClient()` **sem** filtro de status
  (a RLS libera admin autenticado a ler qualquer status — é o que a lista do
  admin já faz). `notFound()` se o post não existir.
- Busca relacionados (mantém filtro `published`, como no público).
- Renderiza `<PreviewBanner post={post} />` + `<BlogPostArticle …/>`.
- `export const dynamic = "force-dynamic"` (sempre fresco).
- Metadata `robots: { index: false, follow: false }` (cinto e suspensório — a
  rota já é 404 para crawler não autenticado).
- Está no grupo `(public)`, então herda header/footer do site → fidelidade
  visual real.

### 4. `src/components/blog/PreviewBanner.tsx` (novo)

Barra fixa no topo, visual âmbar/laranja distinto do restante do site:
"🔒 Pré-visualização — não publicado • Status: <label> • Publica em <data BRT>"
+ link "Editar" de volta para `/admin/posts/<id>`. A data de agendamento é
exibida no horário de Brasília (reutiliza a formatação BRT de `src/lib/datetime`).

### 5. `src/app/admin/(protected)/posts/page.tsx` (ajuste)

- Botão **"Visualizar"** ao lado de "Editar", apontando para
  `/blog/[slug]/preview` (abre em nova aba), para todos os posts.
- Correção relacionada: `STATUS_STYLES`/`STATUS_LABEL` não têm `scheduled` (o
  badge sai sem estilo/label hoje). Adicionar "Agendado".

## Segurança

- Caminho de dados público (`getPost`, `getRelatedPosts`, `sitemap`, API) segue
  estritamente `status = 'published'`. Nenhum ramo novo que retorne não
  publicado.
- A rota `/preview` é a única a servir conteúdo não publicado, atrás de
  `requireAdmin()` e retornando 404 (não redirect) para não-admin.
- `noindex/nofollow` na rota de preview.

## Verificação

- `tsc --noEmit` limpo.
- Browser: (a) `/blog/<slug-publicado>` renderiza idêntico após a extração
  (regressão); (b) `/blog/<slug>/preview` retorna 404 sem sessão de admin.
- O caminho autenticado completo (admin vê o post renderizado + banner) exige
  login de admin — validado pelo usuário ou com acesso fornecido.

## Fora de escopo

- Link de preview compartilhável para terceiros sem login (token assinado com
  validade). Fica para uma iteração futura, se necessário.
