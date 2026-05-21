# Correções Recomendadas Pós-Validação SEO — Design

Data: 2026-05-21
Status: Aprovado em brainstorming
Escopo: correções pontuais e controladas, sem novas features

## Objetivo
Aplicar quatro correções técnicas pós-validação para remover inconsistências entre indexação, tracking e validação editorial, mantendo compatibilidade com a base atual.

## Restrições
- Não criar/alterar/publicar posts.
- Não criar migration.
- Não adicionar dependências.
- Não alterar layout visual.
- Não alterar `/robots.txt`.
- Não remover eventos legados `generate_lead_*`.
- Não alterar comportamento de `page_view`.

## Correção 1 — Sitemap sem URLs noindex

### Arquivo
- `src/app/sitemap.ts`

### Mudança
Remover de `staticPages`:
- `/privacidade`
- `/termos`

### Regra
Páginas com `robots: { index: false }` não entram no sitemap.

### Documentação
Atualizar `docs/SITEMAP_GUIDE.md` com regra explícita.

## Correção 2 — Separar share WhatsApp de clique comercial

### Arquivo
- `src/components/tracking/TrackedLink.tsx`

### Mudança
No branch `tracking.kind === "blog_share"`, remover disparo adicional de `trackWhatsappClick` quando `network === "whatsapp"`.

### Regra final
- Share de blog no WhatsApp: apenas `blog_share_click`.
- Clique comercial para WhatsApp: continua em `tracking.kind === "whatsapp"` via `whatsapp_click`.

### Documentação
Atualizar `docs/ANALYTICS_EVENTS.md` com separação conceitual entre evento comercial e compartilhamento.

## Correção 3 — Draft flexível por status

### Arquivos
- `src/lib/validations/post.ts`
- `src/app/admin/(protected)/posts/actions.ts`

### Decisão técnica
Implementar validação condicional centralizada (Abordagem A):
- nova função `validatePostInputByStatus(input)`
- `createPost` e `updatePost` passam a usá-la

### Regras por status

#### draft
- `slug` obrigatório e válido (formato técnico mantido)
- sem mínimos editoriais rígidos de `summary` e `content`
- campos SEO podem ficar vazios
- unicidade de slug segue no banco/action

#### published e scheduled
- validação editorial completa:
  - `title` mínimo
  - `slug` válido
  - `summary` mínimo
  - `content` mínimo
  - limites de meta title/meta description
  - regras de publicação/SEO mantidas

### Observação de compatibilidade
`slug` continua obrigatório em draft por restrição técnica do banco (`NOT NULL` + `UNIQUE`).

### Documentação
Atualizar `docs/CMS_SEO_EDITORIAL_GUIDE.md` explicando flexibilidade de draft e rigor de publicado/agendado.

## Correção 4 — Filtro noindex do llms-full aplicado em código

### Arquivo
- `src/app/llms-full.txt/route.ts`

### Mudança
- remover `.not("seo_index_status", "eq", "noindex")` da query
- filtrar no código após o fetch

### Regra final
- entra: `status === "published"`
- sai: `seo_index_status === "noindex"`
- permanece: `nofollow` e `null`/ausente

## Atualizações de documentação geral
- `docs/SEO_CHECKLIST.md`: bloco “Correções pós-validação” com os 4 itens.
- `docs/SITEMAP_GUIDE.md`, `docs/ANALYTICS_EVENTS.md`, `docs/CMS_SEO_EDITORIAL_GUIDE.md` ajustados conforme regras acima.

## QA e validação
Executar ao final:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test`

## Critérios de aceite desta rodada
1. `/privacidade` e `/termos` fora do sitemap.
2. `blog_share` WhatsApp sem `whatsapp_click` paralelo.
3. `/llms-full.txt` com filtro `noindex` em código.
4. Draft com flexibilidade editorial e mínimo técnico preservado.
5. Published/scheduled mantêm rigor editorial.
6. Sem post/migration/dependência criada.
7. Projeto compila e testa sem erro.

## Riscos e mitigação
- Risco: regressão de tracking em links WhatsApp.
  Mitigação: alterar apenas branch `blog_share`; manter branch `whatsapp` intacto.
- Risco: draft permissivo demais.
  Mitigação: preservar validação técnica de slug e base de tipos.
- Risco: divergência entre create e update.
  Mitigação: usar a mesma função `validatePostInputByStatus` nas duas actions.
