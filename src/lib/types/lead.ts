/**
 * Contratos de dados da E2 — Gestão de Leads.
 * Esta tipagem espelha a migration 015 PROPOSTA; não implica que o esquema
 * esteja aplicado em nenhum ambiente. Não importar em consultas de produção
 * até a homologação e o rollout da migration.
 */
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

export type LeadActivity = {
  id: string;
  lead_id: string;
  actor_id: string | null;
  kind: LeadActivityKind;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
};

export type LeadMutationResult =
  | { ok: true; unchanged?: boolean }
  | { ok: false; error: "invalid" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "failed" };
