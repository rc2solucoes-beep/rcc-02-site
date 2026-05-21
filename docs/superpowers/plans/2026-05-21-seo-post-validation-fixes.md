# Plano de Implementação — Correções Recomendadas Pós-Validação SEO

Data: 2026-05-21
Spec base: `docs/superpowers/specs/2026-05-21-seo-post-validation-fixes-design.md`

## Objetivo
Aplicar as 4 correções pós-validação SEO com escopo técnico mínimo, sem novas funcionalidades e sem alterações de layout.

## Escopo
1. Remover URLs `noindex` do sitemap estático.
2. Separar compartilhamento de blog no WhatsApp de clique comercial WhatsApp.
3. Tornar drafts de CMS mais flexíveis (mantendo mínimo técnico).
4. Filtrar `noindex` em código na rota `/llms-full.txt`.
5. Atualizar documentação associada.

## Não-objetivos
- Não criar/alterar/publicar posts.
- Não criar migration.
- Não adicionar dependências.
- Não alterar `robots.ts`.
- Não refatorar tracking inteiro.

## Tarefas

### Tarefa 1 — Sitemap sem `/privacidade` e `/termos`
Arquivo:
- `src/app/sitemap.ts`

Ações:
- Remover entradas `/privacidade` e `/termos` de `staticPages`.

Critérios:
- URLs não aparecem em `/sitemap.xml`.
- Nenhuma alteração em páginas/metadata/robots dessas rotas.

### Tarefa 2 — Ajustar `blog_share` no WhatsApp
Arquivo:
- `src/components/tracking/TrackedLink.tsx`

Ações:
- No bloco `tracking.kind === "blog_share"`, remover disparo de `trackWhatsappClick` para `network === "whatsapp"`.
- Manter apenas `trackBlogShareClick` no fluxo de share.
- Preservar branch `tracking.kind === "whatsapp"` comercial.

Critérios:
- Share WhatsApp de blog => apenas `blog_share_click`.
- Links comerciais WhatsApp => continuam `whatsapp_click`.

### Tarefa 3 — Validação condicional por status (draft flexível)
Arquivos:
- `src/lib/validations/post.ts`
- `src/app/admin/(protected)/posts/actions.ts`

Ações:
- Introduzir função central `validatePostInputByStatus(input)`.
- `draft`:
  - exigir `slug` obrigatório e válido tecnicamente.
  - relaxar mínimos editoriais de `summary`/`content`.
  - permitir SEO vazio.
- `published` e `scheduled`:
  - aplicar validação editorial completa (title/slug/summary/content/meta).
- Trocar `CreatePostSchema.safeParse(raw)` por `validatePostInputByStatus(raw)` em `createPost` e `updatePost`.
- Manter validação de unicidade por banco/action.

Critérios:
- Draft salva com flexibilidade editorial.
- Published/scheduled continuam rigorosos.
- Sem quebra de tipagem/fluxo de action.

### Tarefa 4 — Filtro `noindex` em código no llms-full
Arquivo:
- `src/app/llms-full.txt/route.ts`

Ações:
- Remover `.not("seo_index_status", "eq", "noindex")` da query.
- Filtrar em código após fetch:
  - incluir `status === "published"`
  - excluir `seo_index_status === "noindex"`
  - manter `nofollow` e `null`/ausente.

Critérios:
- Regra final aplicada em código conforme aprovado.

### Tarefa 5 — Documentação
Arquivos:
- `docs/SITEMAP_GUIDE.md`
- `docs/ANALYTICS_EVENTS.md`
- `docs/CMS_SEO_EDITORIAL_GUIDE.md`
- `docs/SEO_CHECKLIST.md`

Ações:
- Explicitar regra de `noindex` fora do sitemap.
- Explicitar separação entre `whatsapp_click` (comercial) e `blog_share_click` (share de conteúdo).
- Explicitar flexibilidade de drafts vs rigor de publicados/agendados.
- Adicionar bloco “Correções pós-validação” no checklist geral.

## Ordem de execução
1. Tarefa 1
2. Tarefa 2
3. Tarefa 3
4. Tarefa 4
5. Tarefa 5
6. Validações finais

## Validações finais
Executar:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test`

## Evidências esperadas
- Lista de arquivos alterados.
- Resumo técnico por cada correção.
- Confirmações explícitas:
  - `/privacidade` e `/termos` fora do sitemap.
  - `blog_share` WhatsApp sem `whatsapp_click`.
  - Regra final do `/llms-full.txt` aplicada.
  - Draft flexível + published/scheduled rigorosos.
  - sem post/migration/dependência.
