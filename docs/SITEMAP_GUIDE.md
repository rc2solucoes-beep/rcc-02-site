# SITEMAP Guide

## Objetivo
Garantir que o sitemap do projeto seja previsível, indexável e fácil de manter, cobrindo rotas públicas estáticas, serviços, soluções e posts publicados.

## Arquivo principal
- `src/app/sitemap.ts`

## Como rotas estáticas são cadastradas
As rotas estáticas ficam em `staticPages` com:
- `path`
- `lastModified` (data fixa)
- `changeFrequency`
- `priority`

Depois são convertidas por `mapStaticRoutes()`.

## Como serviços entram automaticamente
As rotas de serviço são geradas a partir de:
- `src/lib/content/services.ts`

Cada slug gera uma URL `/servicos/{slug}` sem hardcode manual individual.

## Como soluções entram automaticamente
As rotas de solução são geradas a partir de:
- `src/lib/content/solutions.ts`

Cada slug gera uma URL `/solucoes/{slug}` e o hub `/solucoes` entra no registry estático.

## Como posts entram via Supabase
O sitemap tenta primeiro consultar:
- `slug`
- `updated_at`
- `seo_index_status`

Filtra `status = published` e remove `seo_index_status = noindex`.

Se a query com `seo_index_status` falhar (ex.: coluna ausente), há fallback para consulta com `slug,updated_at`, mantendo o sitemap funcional.

## Regras de indexação no sitemap
- Incluir somente rotas públicas e indexáveis.
- Posts devem estar com `status = published`.
- Posts com `seo_index_status = noindex` devem ser excluídos.
- Posts com `seo_index_status = nofollow` podem permanecer no sitemap se estiverem publicados.
- Rotas administrativas e APIs nunca devem entrar no sitemap.

## Por que não usar `new Date()` em rotas estáticas
`new Date()` para páginas estáticas gera sinal falso de atualização diária. Para previsibilidade de crawl e manutenção, use datas fixas por rota estática.

## Como adicionar nova rota pública
1. Se for página estática institucional, adicione em `staticPages`.
2. Se for serviço/solução, adicione no arquivo de conteúdo correspondente (`services.ts`/`solutions.ts`).
3. Rode validações e confira `sitemap.xml` local.

## Checklist de validação
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run dev` e abrir `/sitemap.xml`
- [ ] Verificar ausência de `/admin` e `/api`
- [ ] Verificar presença de serviços
- [ ] Verificar presença de soluções (quando existir `solutions.ts`)
- [ ] Verificar presença de posts publicados
- [ ] Verificar ausência de URLs duplicadas