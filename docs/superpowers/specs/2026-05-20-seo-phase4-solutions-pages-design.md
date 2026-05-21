# Fase 4 SEO — Páginas por Dor/Problema (Design)

## Contexto
A Fase 4 adiciona uma nova camada comercial orientada a dores reais do cliente, complementar às páginas de serviço existentes.

- `/servicos/[slug]`: camada de oferta (o que a RC2 implanta)
- `/solucoes/[slug]`: camada de problema (dor percebida e caminho recomendado)

Diretriz aprovada: `/solucoes` será hub comercial visível, sem alterar header/nav global nesta fase.

## Objetivo
Criar páginas públicas por dor/problema para capturar intenção de busca mais próxima da dor do cliente e direcionar para serviços existentes.

## Fora de escopo
- Alterações em CMS/admin/blog
- Criação/edição/publicação de posts
- Supabase/migrations
- Dependências novas
- Redesign amplo
- Alteração de `/solucoes-com-ia`
- Alteração de header/nav global

## Arquitetura

### Conteúdo hardcoded
Criar `src/lib/content/solutions.ts` com:
- Tipos: `SolutionFaq`, `SolutionRelatedLink`, `SolutionServiceLink`, `Solution`
- `solutions: Solution[]` com 5 slugs
- `getSolutionBySlug(slug)`

Slugs iniciais:
1. `atendimento-lento`
2. `leads-sem-resposta`
3. `processos-manuais`
4. `sistemas-desconectados`
5. `whatsapp-desorganizado`

### Rotas novas
1. `src/app/(public)/solucoes/page.tsx`
2. `src/app/(public)/solucoes/[slug]/page.tsx`

Sem dados dinâmicos externos; apenas leitura de `solutions.ts`.

## Página Hub `/solucoes`

### Função
Página pública listável e navegável, com narrativa “soluções por problema”.

### Conteúdo
- Introdução curta sobre abordagem por dor
- Lista das 5 soluções com resumo e CTA para rota individual
- Ponte explícita para serviços relacionados

### SEO
- `title`: `Soluções por Problema`
- `description`: conforme escopo aprovado
- canonical: `https://rc2solucoes.com.br/solucoes`
- Open Graph via `buildOg`

### Schema
- `WebPage` (obrigatório)
- `CollectionPage` (adicionado para reforço semântico)

## Página Dinâmica `/solucoes/[slug]`

### Requisitos de rota
- `generateStaticParams()` usando `solutions`
- `generateMetadata()` por slug
- `getSolutionBySlug(slug)` para leitura
- `notFound()` para slug inválido

### Ordem de seções
1. Breadcrumb
2. Hero
3. Para quem é esta solução (`targetAudience`)
4. Sinais do problema (`symptoms`)
5. Impacto no negócio (`businessImpact`)
6. Causas comuns (`rootCauses`)
7. Caminho recomendado (`recommendedApproach`)
8. Serviços relacionados (`relatedServices`)
9. Indicadores para acompanhar (`metrics`)
10. FAQ (`faq`)
11. Links relacionados (`relatedLinks`)
12. CTA final

### Reuso de componentes
- `Breadcrumb`
- `PageHero`
- `CTABlock` (ou bloco local consistente, mantendo identidade atual)
- `PageAnchorNav` quando útil para mobile
- `SectionLabel`/listas/grids simples já usados em `/servicos`

### SEO
- `title: solution.seoTitle || solution.title`
- `description: solution.summary`
- canonical: `${BASE_URL}/solucoes/${slug}`
- Open Graph com `buildOg`

### JSON-LD
- `WebPage` sempre
- `FAQPage` quando `solution.faq.length > 0`

## Interlinking interno

### `/servicos`
Adicionar bloco discreto e claro com link visível para `/solucoes`.

### Footer
Adicionar link para `/solucoes` se já existir área apropriada de links institucionais/serviços.

### Home
Adicionar link somente se houver seção apropriada sem redesign; caso contrário, não forçar.

### Restrição
Não alterar header/nav global nesta fase.

## Sitemap e LLM routes

### `src/app/sitemap.ts`
Adicionar:
- `/solucoes` (priority 0.8)
- `/solucoes/atendimento-lento`
- `/solucoes/leads-sem-resposta`
- `/solucoes/processos-manuais`
- `/solucoes/sistemas-desconectados`
- `/solucoes/whatsapp-desorganizado` (individuais priority 0.75)

Com:
- `lastModified: "2026-05-20"`
- `changeFrequency: "monthly"`

### `src/app/llms.txt/route.ts`
Adicionar item em “Principais páginas” para `/solucoes`.

### `src/app/llms-full.txt/route.ts`
Adicionar seção `## Soluções por Problema` com, para cada solução:
- título
- URL
- resumo
- sintomas
- impacto
- causas
- abordagem
- serviços relacionados
- indicadores
- FAQ

Manter regras atuais dos posts (published + excluir noindex + manter nofollow).

## Documentação

### Atualizar
- `docs/SEO_CHECKLIST.md` com seção “Páginas por Dor/Problema”

### Criar
- `docs/SOLUTIONS_PAGES_GUIDE.md` com:
  - objetivo
  - diferença entre `/servicos` e `/solucoes`
  - slugs criados
  - regra de manutenção em `solutions.ts`
  - como adicionar nova solução
  - checklist de nova solução

## Riscos e mitigação

1. Risco de duplicação excessiva com `/servicos`
- Mitigação: manter foco em dor nas páginas `/solucoes` e foco em oferta nas `/servicos`.

2. Risco de aumento de escopo visual
- Mitigação: reuso estrito de componentes e padrões existentes; sem redesign.

3. Risco de interlinking insuficiente
- Mitigação: link visível em `/servicos`, link no footer quando estrutura existir, inclusão no sitemap e llms.

## Validação
Executar:
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Critérios de aceite
1. `src/lib/content/solutions.ts` existe com 5 soluções completas.
2. `/solucoes` existe e lista as soluções.
3. `/solucoes/[slug]` renderiza corretamente por slug.
4. `generateStaticParams()` cobre os 5 slugs.
5. Slug inválido retorna `notFound()`.
6. Metadata e canonical estão corretos.
7. JSON-LD `WebPage` presente.
8. JSON-LD `FAQPage` presente quando houver FAQ.
9. Sitemap inclui `/solucoes` e as 5 páginas.
10. `/llms.txt` e `/llms-full.txt` atualizados.
11. Nenhum post criado/alterado.
12. Nenhuma migration criada.
13. Nenhuma dependência adicionada.
14. `/solucoes-com-ia` permanece funcional sem troca de rota.
15. Projeto compila sem erro.