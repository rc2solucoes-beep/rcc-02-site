// Utilitários compartilhados pelas listas administrativas (E1). Há três
// consumidores previstos (CMS, Leads, Newsletter): parsing de página/busca,
// escape de termo de busca para o filtro PostgREST e montagem de links.
// Não é um framework de listagem (DEC-20): só o que tem consumidor real.

export const PAGE_SIZE = 20;
export const SEARCH_MIN = 2;
export const SEARCH_MAX = 80;

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Primeiro valor de um parâmetro (Next entrega `string | string[]`). */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Página ≥ 1; qualquer valor inválido vira 1. */
export function parsePage(value: string | string[] | undefined): number {
  const raw = firstParam(value)?.trim();
  if (!raw || !/^\d{1,9}$/.test(raw)) return 1;
  const n = Number(raw);
  return n >= 1 ? n : 1;
}

/**
 * Termo de busca: troca caracteres de controle por espaço, apara e limita a 80
 * caracteres. Termo com menos de 2 caracteres é ignorado (devolve string vazia).
 */
export function parseSearchTerm(value: string | string[] | undefined): string {
  const raw = firstParam(value);
  if (!raw) return "";
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  const chars = Array.from(cleaned);
  if (chars.length < SEARCH_MIN) return "";
  return chars.slice(0, SEARCH_MAX).join("").trim();
}

export function pageCount(total: number, pageSize: number = PAGE_SIZE): number {
  if (!Number.isFinite(total) || total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Página pedida limitada ao intervalo [1, pageCount]. */
export function clampPage(page: number, total: number, pageSize: number = PAGE_SIZE): number {
  return Math.min(Math.max(1, page), pageCount(total, pageSize));
}

/** Índices (inclusivos) para `range()` do PostgREST. */
export function pageRange(page: number, pageSize: number = PAGE_SIZE): { from: number; to: number } {
  const from = (Math.max(1, page) - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

// ─── Busca literal via filtro PostgREST (PRP-07) ──────────────────────────────

/** Escapa `\`, `%` e `_` para uso literal em LIKE/ILIKE. */
export function escapeLikeTerm(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Escapa metacaracteres de regex POSIX (ARE) para uso literal em `imatch`. */
export function escapeRegexTerm(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, (c) => `\\${c}`);
}

/**
 * Envolve um valor em aspas duplas para o filtro PostgREST, escapando `\` e `"`.
 * Dentro das aspas, vírgula, parênteses, ponto e dois-pontos perdem o significado.
 */
export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/[\\"]/g, (c) => `\\${c}`)}"`;
}

/**
 * Monta o argumento de `.or(...)` para busca literal em `columns`.
 *
 * Caminho padrão: `ilike` com padrão `%termo%`, escapado em duas camadas (LIKE e
 * depois aspas do PostgREST — a ordem importa).
 *
 * Exceção para `*`: o PostgREST converte `*` em `%` nos operadores like/ilike, e
 * essa conversão não tem escape; um `*` digitado viraria curinga. Termos com `*`
 * usam `imatch` (regex), operador que não passa por essa conversão. Isto é uma
 * HIPÓTESE ainda não comprovada em banco: T-CMS-I03 decide. Se falhar, a
 * contingência aprovada é a RPC parametrizada (docs/runbooks/migrations/014-posts-sort-at/).
 */
export function buildSearchOrFilter(term: string, columns: readonly string[]): string {
  if (term.includes("*")) {
    const value = quotePostgrestValue(escapeRegexTerm(term));
    return columns.map((column) => `${column}.imatch.${value}`).join(",");
  }
  const value = quotePostgrestValue(`%${escapeLikeTerm(term)}%`);
  return columns.map((column) => `${column}.ilike.${value}`).join(",");
}

// ─── Links ────────────────────────────────────────────────────────────────────

/** Monta `base?a=1&b=2` omitindo valores vazios/nulos. */
export function buildListHref(
  base: string,
  params: Record<string, string | number | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}
