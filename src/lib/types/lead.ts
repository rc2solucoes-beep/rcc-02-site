/**
 * Contratos de dados da E2 — Gestão de Leads.
 * Esta tipagem espelha a migration 015 PROPOSTA; não implica que o esquema
 * esteja aplicado em nenhum ambiente. `LeadRecord` é o tipo canônico de
 * `public.leads`: os campos de gestão (status, próxima ação, arquivamento,
 * `updated_at`) só existem no banco depois da migration. Até lá, consultas
 * em produção devem usar apenas as colunas históricas.
 * A paridade com `supabase/migrations/015_leads_management.sql` é verificada
 * por `tests/unit/lib/leadContractParity.test.ts`.
 */

/** Limites espelhados dos CHECKs da migration 015. */
export const LEAD_NEXT_ACTION_MAX_LENGTH = 280;
export const LEAD_NOTE_MIN_LENGTH = 1;
export const LEAD_NOTE_MAX_LENGTH = 2000;
/** Confirmação literal da exclusão permanente (RF-LEAD-07, DEC-09). */
export const LEAD_DELETE_CONFIRMATION = "EXCLUIR";

export const LEAD_STATUSES = [
  "new",
  "in_review",
  "contacted",
  "qualified",
  "closed",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  in_review: "Em análise",
  contacted: "Contatado",
  qualified: "Qualificado",
  closed: "Encerrado",
};

export const LEAD_ACTIVITY_KINDS = [
  "status_changed",
  "next_action_changed",
  "archived",
  "restored",
] as const;

export type LeadActivityKind = (typeof LEAD_ACTIVITY_KINDS)[number];

export type LeadRecord = {
  id: string;
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  segment: string;
  size: string;
  solution: string;
  message: string;
  source: string;
  ip_hash: string | null;
  created_at: string;
  status: LeadStatus;
  status_updated_at: string | null;
  next_action: string | null;
  next_action_at: string | null;
  archived_at: string | null;
  /** Texto opaco do PostgREST: nunca passar por Date para lock otimista. */
  updated_at: string;
};

export type LeadListItem = Pick<
  LeadRecord,
  | "id"
  | "name"
  | "company"
  | "email"
  | "whatsapp"
  | "segment"
  | "size"
  | "solution"
  | "created_at"
  | "status"
  | "next_action"
  | "next_action_at"
  | "archived_at"
  | "updated_at"
>;

export type LeadNote = {
  id: string;
  lead_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

type LeadActivityBase = {
  id: string;
  lead_id: string;
  actor_id: string | null;
  created_at: string;
};

/**
 * Só `status_changed` carrega valores (enum, não PII); os demais eventos não
 * gravam `from_value`/`to_value`. Na migration 015 a constraint
 * `lead_activity_status_values_check` rejeita `status_changed` com valor nulo
 * e exige valores nulos nos demais eventos; o trigger `leads_30_activity`
 * (função `rc2_internal.leads_record_activity`) produz as linhas, mas a garantia final é da constraint.
 */
export type LeadActivity = LeadActivityBase &
  (
    | { kind: "status_changed"; from_value: LeadStatus; to_value: LeadStatus }
    | {
        kind: Exclude<LeadActivityKind, "status_changed">;
        from_value: null;
        to_value: null;
      }
  );

export type LeadMutationResult =
  | { ok: true; unchanged?: boolean }
  | { ok: false; error: "invalid" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "failed" | "disabled" };
