import type { SupabaseClient } from "@supabase/supabase-js";
import { createSessionClient } from "@/lib/supabase/server";
import { LEAD_DETAIL_COLUMNS } from "@/lib/admin/leadList";
import type { LeadActivity, LeadNote, LeadRecord } from "@/lib/types/lead";

/** Limite de notas e eventos carregados no detalhe; acima disso a tela avisa. */
export const LEAD_DETAIL_HISTORY_LIMIT = 200;

export type LeadDetail = {
  lead: Omit<LeadRecord, "ip_hash">;
  notes: LeadNote[];
  activity: LeadActivity[];
  notesTruncated: boolean;
  activityTruncated: boolean;
};

export type GetLeadDetailResult =
  | ({ ok: true } & LeadDetail)
  | { ok: false; error: "not_found" | "query_failed" };

/**
 * Detalhe do lead com notas e histórico, pela sessão do admin (RLS). Lead inexistente (ou
 * escondido pela RLS) é `not_found`; qualquer erro de consulta é `query_failed`, nunca vazio.
 */
export async function getLeadDetail(id: string, client?: SupabaseClient): Promise<GetLeadDetailResult> {
  try {
    const supabase = client ?? (await createSessionClient());

    const leadResult = await supabase.from("leads").select(LEAD_DETAIL_COLUMNS).eq("id", id).maybeSingle();
    if (leadResult.error) {
      console.error("[getLeadDetail] lead", { code: leadResult.error.code ?? "unknown", resource_id: id });
      return { ok: false, error: "query_failed" };
    }
    if (!leadResult.data) return { ok: false, error: "not_found" };

    const [notesResult, activityResult] = await Promise.all([
      supabase
        .from("lead_notes")
        .select("id,lead_id,author_id,body,created_at")
        .eq("lead_id", id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(LEAD_DETAIL_HISTORY_LIMIT + 1),
      supabase
        .from("lead_activity")
        .select("id,lead_id,actor_id,kind,from_value,to_value,created_at")
        .eq("lead_id", id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(LEAD_DETAIL_HISTORY_LIMIT + 1),
    ]);
    if (notesResult.error || activityResult.error) {
      console.error("[getLeadDetail] histórico", {
        notes: notesResult.error?.code ?? null,
        activity: activityResult.error?.code ?? null,
        resource_id: id,
      });
      return { ok: false, error: "query_failed" };
    }

    const notes = (notesResult.data ?? []) as unknown as LeadNote[];
    const activity = (activityResult.data ?? []) as unknown as LeadActivity[];
    return {
      ok: true,
      lead: leadResult.data as unknown as LeadDetail["lead"],
      notes: notes.slice(0, LEAD_DETAIL_HISTORY_LIMIT),
      activity: activity.slice(0, LEAD_DETAIL_HISTORY_LIMIT),
      notesTruncated: notes.length > LEAD_DETAIL_HISTORY_LIMIT,
      activityTruncated: activity.length > LEAD_DETAIL_HISTORY_LIMIT,
    };
  } catch (thrown) {
    console.error("[getLeadDetail] exceção", { name: thrown instanceof Error ? thrown.name : "unknown", resource_id: id });
    return { ok: false, error: "query_failed" };
  }
}
