import type { SupabaseClient } from "@supabase/supabase-js";
import { createSessionClient } from "@/lib/supabase/server";
import {
  PAGE_SIZE,
  buildSearchOrFilter,
  pageCount,
  pageRange,
  quotePostgrestValue,
} from "@/lib/admin/listParams";
import {
  LEAD_LIST_COLUMNS,
  LEAD_SEARCH_COLUMNS,
  LEAD_SOLUTION_OPTIONS,
  LEAD_SOLUTION_OTHER,
  leadListDateBounds,
  type LeadListParams,
} from "@/lib/admin/leadList";
import type { LeadListItem } from "@/lib/types/lead";

export type ListAdminLeadsResult =
  | {
      ok: true;
      items: LeadListItem[];
      total: number;
      /** Página pedida. Se > pageCount (e total > 0), o chamador redireciona à última. */
      page: number;
      pageSize: number;
      pageCount: number;
    }
  | { ok: false; error: "query_failed" };

/** Código do PostgREST para faixa fora do alcance (HTTP 416). */
const RANGE_NOT_SATISFIABLE = "PGRST103";

function buildQuery(supabase: SupabaseClient, params: LeadListParams, head: boolean) {
  let query = supabase.from("leads").select(LEAD_LIST_COLUMNS, { count: "exact", head });

  if (params.archived === "no") query = query.is("archived_at", null);
  if (params.archived === "only") query = query.not("archived_at", "is", null);
  if (params.status) query = query.eq("status", params.status);
  if (params.solution === LEAD_SOLUTION_OTHER) {
    query = query.not("solution", "in", `(${LEAD_SOLUTION_OPTIONS.map(quotePostgrestValue).join(",")})`);
  } else if (params.solution) {
    query = query.eq("solution", params.solution);
  }
  if (params.q) query = query.or(buildSearchOrFilter(params.q, LEAD_SEARCH_COLUMNS));

  const { gte, lt } = leadListDateBounds(params);
  if (gte) query = query.gte("created_at", gte);
  if (lt) query = query.lt("created_at", lt);

  return query;
}

function logFailure(code: string | undefined, params: LeadListParams): void {
  // Sem termo de busca nem conteúdo: só o código do Postgres e os NOMES dos filtros usados.
  const filters = [
    params.q ? "q" : null,
    params.status ? "status" : null,
    params.solution ? "solution" : null,
    params.from ? "from" : null,
    params.to ? "to" : null,
  ].filter(Boolean);
  console.error("[listAdminLeads] consulta falhou", { code: code ?? "unknown", filters, page: params.page });
}

/**
 * Lista leads para o admin: paginada no servidor, desempate por `id`, sem `message` nem
 * `ip_hash`. Usa o cliente de sessão (a RLS de `leads` é a barreira; nenhum service_role).
 * Falha vira `{ ok: false }`, nunca uma lista vazia.
 */
export async function listAdminLeads(
  params: LeadListParams,
  client?: SupabaseClient,
): Promise<ListAdminLeadsResult> {
  try {
    const supabase = client ?? (await createSessionClient());
    const { from, to } = pageRange(params.page);

    const ordered = buildQuery(supabase, params, false);
    const sorted =
      params.sort === "next_action"
        ? ordered.order("next_action_at", { ascending: true, nullsFirst: false }).order("id", { ascending: true })
        : ordered.order("created_at", { ascending: false }).order("id", { ascending: false });
    const { data, error, count } = await sorted.range(from, to);

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
      items: (data ?? []) as unknown as LeadListItem[],
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
