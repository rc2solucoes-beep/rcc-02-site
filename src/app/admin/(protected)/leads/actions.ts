"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { writeAdminAuditLog } from "@/lib/admin/auditLog";
import { isLeadDeletionEnabled } from "@/lib/admin/leadFeatures";
import { createSessionClient } from "@/lib/supabase/server";
import {
  LEAD_DELETE_CONFIRMATION,
  leadArchiveInput,
  leadDeleteInput,
  leadNextActionInput,
  leadNoteInput,
  leadStatusInput,
  normalizeNextAction,
  normalizeNextActionAt,
  normalizeNoteBody,
} from "@/lib/validations/lead";
import type { LeadMutationResult, LeadStatus } from "@/lib/types/lead";

// Server Actions da gestão de leads (E2, SDD §10.2). Todas: requireAdmin → Zod (lista fixa de
// campos) → sessão do admin e RLS (nenhum service_role aqui) → auditoria sem PII →
// revalidatePath. Auditoria só leva `resource_id` e NOMES de campos: nunca nome, e-mail,
// telefone nem texto de nota/próxima ação.

const LIST_PATH = "/admin/leads";
const AUDIT_PATH = LIST_PATH;

type Admin = { userId: string | null; email: string | null };
type AuditSeverity = "info" | "warning" | "error";

async function requireAdminForLeads(): Promise<
  { ok: true; admin: Admin } | { ok: false; result: Extract<LeadMutationResult, { ok: false }> }
> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    await writeAdminAuditLog({
      event: "admin_lead_action_denied",
      severity: "warning",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: admin.status === 401 ? "unknown" : "authenticated",
      path: AUDIT_PATH,
      method: "SERVER_ACTION",
      status: admin.status,
      resourceType: "lead",
    });
    return { ok: false, result: { ok: false, error: admin.status === 401 ? "unauthorized" : "forbidden" } };
  }
  return { ok: true, admin: { userId: admin.userId, email: admin.email } };
}

function audit(
  admin: Admin,
  event: string,
  leadId: string,
  status: number,
  metadata: Record<string, unknown> | null = null,
  severity: AuditSeverity = "info",
) {
  return writeAdminAuditLog({
    event,
    severity,
    actorUserId: admin.userId,
    actorEmail: admin.email,
    actorType: "admin",
    path: AUDIT_PATH,
    method: "SERVER_ACTION",
    status,
    resourceType: "lead",
    resourceId: leadId,
    metadata,
  });
}

function refresh(leadId: string): void {
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${leadId}`);
}

type CurrentLead = {
  status: LeadStatus;
  next_action: string | null;
  next_action_at: string | null;
  archived_at: string | null;
};

async function readCurrent(supabase: SupabaseClient, id: string): Promise<
  { state: "found"; lead: CurrentLead } | { state: "missing" } | { state: "failed" }
> {
  const { data, error } = await supabase
    .from("leads")
    .select("status,next_action,next_action_at,archived_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[leads/actions] leitura", { code: error.code ?? "unknown", resource_id: id });
    return { state: "failed" };
  }
  return data ? { state: "found", lead: data as unknown as CurrentLead } : { state: "missing" };
}

type GuardedUpdate = { ok: true } | Extract<LeadMutationResult, { ok: false }>;

/**
 * `UPDATE … WHERE id AND updated_at = expected` com `.select('id')` (RF-LEAD-10). Zero linhas:
 * relê — lead inexistente é "não encontrado", existente é conflito. O valor esperado trafega como
 * texto opaco, sem passar por `Date`.
 */
async function updateWithExpectedVersion(
  supabase: SupabaseClient,
  id: string,
  expectedUpdatedAt: string,
  patch: Record<string, unknown>,
): Promise<GuardedUpdate> {
  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .eq("updated_at", expectedUpdatedAt)
    .select("id");
  if (error) {
    console.error("[leads/actions] update", { code: error.code ?? "unknown", resource_id: id });
    return { ok: false, error: "failed" };
  }
  if ((data?.length ?? 0) === 1) return { ok: true };
  if ((data?.length ?? 0) > 1) return { ok: false, error: "failed" };
  const current = await readCurrent(supabase, id);
  if (current.state === "failed") return { ok: false, error: "failed" };
  return { ok: false, error: current.state === "missing" ? "not_found" : "conflict" };
}

export async function updateLeadStatus(input: {
  id: string;
  status: string;
  expectedUpdatedAt: string;
}): Promise<LeadMutationResult> {
  const guard = await requireAdminForLeads();
  if (!guard.ok) return guard.result;
  const parsed = leadStatusInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { id, status, expectedUpdatedAt } = parsed.data;

  const supabase = await createSessionClient();
  const current = await readCurrent(supabase, id);
  if (current.state === "failed") return { ok: false, error: "failed" };
  if (current.state === "missing") return { ok: false, error: "not_found" };
  if (current.lead.status === status) return { ok: true, unchanged: true };

  const written = await updateWithExpectedVersion(supabase, id, expectedUpdatedAt, { status });
  if (!written.ok) return written;
  await audit(guard.admin, "admin_lead_status_changed", id, 200, { fields: ["status"], from: current.lead.status, to: status });
  refresh(id);
  return { ok: true };
}

export async function setLeadNextAction(input: {
  id: string;
  nextAction?: string | null;
  nextActionAt?: string | null;
  expectedUpdatedAt: string;
}): Promise<LeadMutationResult> {
  const guard = await requireAdminForLeads();
  if (!guard.ok) return guard.result;
  const parsed = leadNextActionInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const action = normalizeNextAction(parsed.data.nextAction);
  const at = normalizeNextActionAt(parsed.data.nextActionAt);
  if (!action.ok || !at.ok) return { ok: false, error: "invalid" };
  const { id, expectedUpdatedAt } = parsed.data;

  const supabase = await createSessionClient();
  const current = await readCurrent(supabase, id);
  if (current.state === "failed") return { ok: false, error: "failed" };
  if (current.state === "missing") return { ok: false, error: "not_found" };

  const sameAction = (current.lead.next_action ?? null) === action.value;
  const sameAt =
    current.lead.next_action_at === null || at.value === null
      ? current.lead.next_action_at === at.value
      : new Date(current.lead.next_action_at).getTime() === new Date(at.value).getTime();
  if (sameAction && sameAt) return { ok: true, unchanged: true };

  const written = await updateWithExpectedVersion(supabase, id, expectedUpdatedAt, {
    next_action: action.value,
    next_action_at: at.value,
  });
  if (!written.ok) return written;
  await audit(guard.admin, "admin_lead_next_action_changed", id, 200, { fields: ["next_action", "next_action_at"] });
  refresh(id);
  return { ok: true };
}

export async function addLeadNote(input: { id: string; body: string }): Promise<LeadMutationResult> {
  const guard = await requireAdminForLeads();
  if (!guard.ok) return guard.result;
  const parsed = leadNoteInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const body = normalizeNoteBody(parsed.data.body);
  if (!body.ok) return { ok: false, error: "invalid" };
  const { id } = parsed.data;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("lead_notes")
    .insert({ lead_id: id, author_id: guard.admin.userId, body: body.value })
    .select("id");
  if (error) {
    console.error("[leads/actions] nota", { code: error.code ?? "unknown", resource_id: id });
    // 23503 = lead inexistente (FK); a RLS nunca revela o conteúdo.
    return { ok: false, error: error.code === "23503" ? "not_found" : "failed" };
  }
  if ((data?.length ?? 0) !== 1) return { ok: false, error: "failed" };
  await audit(guard.admin, "admin_lead_note_added", id, 200, { fields: ["body"] });
  refresh(id);
  return { ok: true };
}

async function setArchived(
  input: { id: string; expectedUpdatedAt: string },
  archive: boolean,
): Promise<LeadMutationResult> {
  const guard = await requireAdminForLeads();
  if (!guard.ok) return guard.result;
  const parsed = leadArchiveInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { id, expectedUpdatedAt } = parsed.data;

  const supabase = await createSessionClient();
  const current = await readCurrent(supabase, id);
  if (current.state === "failed") return { ok: false, error: "failed" };
  if (current.state === "missing") return { ok: false, error: "not_found" };
  if ((current.lead.archived_at !== null) === archive) return { ok: true, unchanged: true };

  const written = await updateWithExpectedVersion(supabase, id, expectedUpdatedAt, {
    archived_at: archive ? new Date().toISOString() : null,
  });
  if (!written.ok) return written;
  await audit(guard.admin, archive ? "admin_lead_archived" : "admin_lead_restored", id, 200, { fields: ["archived_at"] });
  refresh(id);
  return { ok: true };
}

export async function archiveLead(input: { id: string; expectedUpdatedAt: string }): Promise<LeadMutationResult> {
  return setArchived(input, true);
}

export async function restoreLead(input: { id: string; expectedUpdatedAt: string }): Promise<LeadMutationResult> {
  return setArchived(input, false);
}

/**
 * Exclusão permanente (RF-LEAD-07, DEC-09). Suspensa por padrão (`LEADS_DELETE_ENABLED`, ver
 * `leadFeatures.ts`). A confirmação literal é validada AQUI, no servidor.
 * Sucesso = exatamente 1 linha devolvida pelo DELETE; qualquer outro resultado é falha e gera
 * `admin_lead_delete_failed`. Em sucesso redireciona à lista.
 */
export async function deleteLead(input: { id: string; confirmation: string }): Promise<LeadMutationResult> {
  const guard = await requireAdminForLeads();
  if (!guard.ok) return guard.result;
  const parsed = leadDeleteInput.safeParse(input);
  if (!parsed.success || parsed.data.confirmation !== LEAD_DELETE_CONFIRMATION) return { ok: false, error: "invalid" };
  const { id } = parsed.data;

  // Suspensa (fail-closed): recusa ANTES de abrir o cliente do banco. A camada 2 é a migration 016.
  if (!isLeadDeletionEnabled()) {
    await audit(guard.admin, "admin_lead_delete_blocked", id, 403, null, "warning");
    return { ok: false, error: "disabled" };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("leads").delete().eq("id", id).select("id");
  if (error || (data?.length ?? 0) !== 1) {
    if (error) console.error("[leads/actions] delete", { code: error.code ?? "unknown", resource_id: id });
    const notFound = !error && (data?.length ?? 0) === 0;
    await audit(guard.admin, "admin_lead_delete_failed", id, notFound ? 404 : 500, null, "error");
    return { ok: false, error: notFound ? "not_found" : "failed" };
  }
  await audit(guard.admin, "admin_lead_deleted", id, 200, null, "warning");
  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}
