# Plano — índice do /blog (4 ajustes aprovados por Robson)

Executor: Claude. Revisor: Codex. Sem commit, push, deploy, banco ou dependências.

## Critérios aprovados

1. **Capas inteiras:** no índice, `object-contain` nos frames de marca (3:2 destaque, 4:3 grid). Opt-in via prop `editorial` no `BlogCard`; defaults e `compact` (Home) intocados.
2. **Abertura compacta:** mesma copy (label, h1, descrição), alinhada ao container da listagem (`max-w-5xl`). `PageHero` global não é alterado; a abertura é local ao índice.
3. **Hierarquia:** resumo ≥16px, metadados 14px `--rc2-text-secondary`, títulos em escala acima do resumo.
4. **Busca e paginação:**
   - Formulário GET (`q`), label visível, botão Buscar, link "Limpar busca", feedback de quantidade (`role="status"`), estado vazio com limpar.
   - Busca por título e resumo, ignorando caixa e acentos, em memória sobre o `getPosts` existente (query Supabase inalterada).
   - 6 artigos por página. O mais recente fica em destaque só na página 1 sem busca e não entra de novo na lista. Nenhum post duplicado nem omitido entre páginas.
   - Estado na URL (`?q=&pagina=`), links `<a>` server-rendered, `<nav aria-label>` com `aria-current="page"`, alvos ≥44px, foco global.
   - Página inválida ou fora do intervalo → redirect para a página válida mais próxima.
   - URLs de artigos inalteradas. Canonical de `/blog` permanece `${BASE_URL}/blog`.
   - Sem categorias.

## Correções da revisão Codex (paginação)

- **Canonical/robots** (`resolveArchiveSeo` + `generateMetadata`, que agora lê `searchParams`):
  - `/blog` → canonical `/blog`;
  - `?pagina=N` (N≥2, sem busca) → canonical próprio `/blog?pagina=N`, indexável, título "Blog — Página N";
  - qualquer busca (`?q=`, com ou sem `pagina`) → `robots: { index: false, follow: true }` e canonical `/blog`;
  - página inválida → metadata usa a página válida (a renderização redireciona).
- **Cache de 60s preservado.** Ler `searchParams` torna a rota dinâmica e o `export const revalidate = 60` deixa de valer. Docs instalados (Next 16.3.3): `use cache` exige `cacheComponents`, que o projeto não habilita (alterar config está fora de escopo); `unstable_cache` está marcado como substituído, mas é o mecanismo suportado nesta configuração e já é o padrão do repo (`src/lib/schema.ts`). `getPosts` envolve a mesma query, sem mudanças, em `unstable_cache` com chave fixa `["blog-index-posts"]` e `revalidate: 60`, compartilhada por todos os termos e páginas.
- **Erros não persistem:** o `error` do Supabase é lançado dentro da função cacheada (Next não guarda resultado de função que lança); o `catch` externo devolve `[]` só naquela requisição. Lista vazia *bem-sucedida* é cacheada 60s, como antes.
- `loading.tsx` ajustado só para espelhar a abertura clara compacta, a busca e os frames 3:2/4:3.
- Limitação: o cache é verificado por teste com `unstable_cache` simulado (chave, opção, não-cache de erro); o comportamento real do cache do Next só se observa em `next start`/produção.

## Arquivos

- `src/lib/blogArchive.ts` (novo): lógica pura (normalização, filtro, paginação, hrefs).
- `src/components/blog/BlogArchive.tsx` (novo): busca, feedback, lista e paginação.
- `src/components/blog/BlogCard.tsx`: prop opt-in `editorial`.
- `src/app/(public)/blog/(index)/page.tsx`: `searchParams`, abertura compacta, metadata, cache.
- `src/app/(public)/blog/(index)/loading.tsx`: skeleton alinhado ao novo índice.
- `tests/unit/blog/blogArchive.test.ts` e `tests/unit/blog/BlogArchive.test.tsx`: fixtures locais.

## Fora de escopo

Home, artigos individuais, header/footer, config, dependências, `PageHero`.

## Validação

ESLint do escopo, vitest focado, `typecheck`, `build`, `audit:brand`, verificação visual com mocks Playwright.
