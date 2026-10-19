import type { SupabaseClient } from "@supabase/supabase-js";
import { createSessionClient } from "@/lib/supabase/server";
import { PAGE_SIZE, buildSearchOrFilter, pageCount, pageRange } from "@/lib/admin/listParams";
import {
  POST_LIST_COLUMNS,
  POST_SEARCH_COLUMNS,
  postListDateBounds,
  type PostListItem,
  type PostListParams,
} from "@/lib/admin/postList";

export type ListAdminPostsResult =
  | {
      ok: true;
      items: PostListItem[];
      total: number;
      /** Página pedida. Se > pageCount (e total > 0), o chamador redireciona à última. */
      page: number;
      pageSize: number;
      pageCount: number;
    }
  | { ok: false; error: "query_failed" };

/** Código do PostgREST para faixa fora do alcance (HTTP 416). */
const RANGE_NOT_SATISFIABLE = "PGRST103";

function buildQuery(supabase: SupabaseClient, params: PostListParams, head: boolean) {
  let query = supabase.from("posts").select(POST_LIST_COLUMNS, { count: "exact", head });

  if (params.status) query = query.eq("status", params.status);
  if (params.q) query = query.or(buildSearchOrFilter(params.q, POST_SEARCH_COLUMNS));

  const { gte, lt } = postListDateBounds(params);
  if (gte) query = query.gte("sort_at", gte);
  if (lt) query = query.lt("sort_at", lt);

  return query;
}

function logFailure(code: string | undefined, params: PostListParams): void {
  // Sem termo de busca nem conteúdo: só o código do Postgres e os NOMES dos filtros usados.
  const filters = [
    params.q ? "q" : null,
    params.status ? "status" : null,
    params.from ? "from" : null,
    params.to ? "to" : null,
  ].filter(Boolean);
  console.error("[listAdminPosts] consulta falhou", { code: code ?? "unknown", filters, page: params.page });
}

/**
 * Lista posts para o admin: paginada no servidor, ordenada por `sort_at` e `id` na mesma
 * direção, sem `content`. Usa o cliente de sessão (a RLS de `posts` é a barreira).
 * Falha vira `{ ok: false }`, nunca uma lista vazia.
 */
export async function listAdminPosts(
  params: PostListParams,
  client?: SupabaseClient,
): Promise<ListAdminPostsResult> {
  try {
    const supabase = client ?? (await createSessionClient());
    const ascending = params.dir === "asc";
    const { from, to } = pageRange(params.page);

    const { data, error, count } = await buildQuery(supabase, params, false)
      .order("sort_at", { ascending })
      .order("id", { ascending })
      .range(from, to);

    if (error) {
      if (error.code === RANGE_NOT_SATISFIABLE) {
        // Página além do total: descobre o total para o chamador redirecionar à última página.
        const counted = await buildQuery(supabase, params, true);
        if (!counted.error && typeof counted.count === "number") {
          return {
            ok: true,
            items: [],
            total: counted.count,
            page: params.page,
            pageSize: PAGE_SIZE,
            pageCount: pageCount(counted.count),
          };
        }
        logFailure(counted.error?.code, params);
        return { ok: false, error: "query_failed" };
      }
      logFailure(error.code, params);
      return { ok: false, error: "query_failed" };
    }

    const total = typeof count === "number" ? count : 0;
    return {
      ok: true,
      items: (data ?? []) as unknown as PostListItem[],
      total,
      page: params.page,
      pageSize: PAGE_SIZE,
      pageCount: pageCount(total),
    };
  } catch (thrown) {
    logFailure(thrown instanceof Error ? thrown.name : undefined, params);
    return { ok: false, error: "query_failed" };
  }
}
