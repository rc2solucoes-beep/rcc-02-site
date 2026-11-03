/**
 * Lógica pura do índice do blog: busca, paginação e URLs.
 *
 * Opera em memória sobre a lista já carregada por `getPosts`; não consulta
 * banco. O estado vive na URL (`?q=` e `?pagina=`), então é compartilhável e
 * o histórico do navegador funciona sem JavaScript.
 */

export const POSTS_PER_PAGE = 6;
export const MAX_QUERY_LENGTH = 100;
export const BLOG_PATH = "/blog";

export interface ArchivePost {
  slug: string;
  title: string;
  summary: string;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface ArchiveState<T extends ArchivePost> {
  /** Termo normalizado para exibição (trim, espaços colapsados). */
  query: string;
  page: number;
  totalPages: number;
  /** Posts que casam com a busca (todos, quando não há busca). */
  totalMatches: number;
  /** Destaque: só na página 1 sem busca. */
  featured: T | null;
  /** Posts da grade na página atual. */
  items: T[];
  /** Posição (1-based) do primeiro e do último item exibido, destaque incluso. */
  rangeStart: number;
  rangeEnd: number;
  /** Quando a página pedida não é válida, a URL para onde redirecionar. */
  redirectTo: string | null;
}

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/** Minúsculas e sem acentos: "Automação" casa com "automacao". */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function cleanQuery(raw: string | string[] | undefined): string {
  return firstValue(raw).replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH).trim();
}

/** Só inteiros positivos em dígitos; qualquer outra coisa vira `null`. */
export function parsePageParam(raw: string | string[] | undefined): number | null {
  const value = firstValue(raw).trim();
  if (!/^\d{1,6}$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 ? n : null;
}

export function buildArchiveHref(query: string, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("pagina", String(page));
  const qs = params.toString();
  return qs ? `${BLOG_PATH}?${qs}` : BLOG_PATH;
}

/** Todos os termos precisam aparecer no título ou no resumo. */
export function filterPosts<T extends ArchivePost>(posts: T[], query: string): T[] {
  const terms = normalizeForSearch(query).split(" ").filter(Boolean);
  if (terms.length === 0) return posts;
  return posts.filter((post) => {
    const haystack = normalizeForSearch(`${post.title} ${post.summary}`);
    return terms.every((term) => haystack.includes(term));
  });
}

export function resolveArchive<T extends ArchivePost>(
  posts: T[],
  params: RawSearchParams
): ArchiveState<T> {
  const query = cleanQuery(params.q);
  const matches = filterPosts(posts, query);
  const hasFeatured = !query && matches.length > 0;
  const listed = hasFeatured ? matches.slice(1) : matches;

  const totalPages = Math.max(1, Math.ceil(listed.length / POSTS_PER_PAGE));
  const requested = parsePageParam(params.pagina);
  const page = Math.min(requested ?? 1, totalPages);

  // `pagina=1`, `pagina=abc` ou `pagina=99` não têm URL própria: redirecionam
  // para a forma canônica, em vez de servir o mesmo conteúdo em várias URLs.
  const rawPage = firstValue(params.pagina);
  const pageIsNonCanonical =
    params.pagina !== undefined && (requested === null || requested !== page || page === 1 || rawPage !== String(page));
  const redirectTo = pageIsNonCanonical ? buildArchiveHref(query, page) : null;

  const start = (page - 1) * POSTS_PER_PAGE;
  const items = listed.slice(start, start + POSTS_PER_PAGE);
  const featured = hasFeatured && page === 1 ? matches[0] : null;

  const offset = hasFeatured ? 1 : 0;
  const rangeStart = items.length || featured ? (featured ? 1 : start + offset + 1) : 0;
  const rangeEnd = items.length ? start + offset + items.length : featured ? 1 : 0;

  return {
    query,
    page,
    totalPages,
    totalMatches: matches.length,
    featured,
    items,
    rangeStart,
    rangeEnd,
    redirectTo,
  };
}

export interface ArchiveSeo {
  /** Caminho (com query) do canonical. */
  canonicalPath: string;
  /** Resultados de busca não são indexados; os links seguem sendo rastreados. */
  noindex: boolean;
}

/**
 * Canonical e indexação do índice.
 * - primeira página: `/blog`;
 * - páginas `?pagina=N` (sem busca): canonical próprio, para não sugerir que
 *   seus artigos duplicam a primeira página;
 * - busca: `noindex, follow` e canonical `/blog`.
 */
export function resolveArchiveSeo(state: Pick<ArchiveState<ArchivePost>, "query" | "page">): ArchiveSeo {
  if (state.query) return { canonicalPath: BLOG_PATH, noindex: true };
  return { canonicalPath: buildArchiveHref("", state.page), noindex: false };
}

/** Páginas a exibir na navegação; `null` marca reticências. */
export function pageWindow(current: number, total: number): Array<number | null> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | null> = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}
