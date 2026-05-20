import "server-only";

import { createSessionClient } from "@/lib/supabase/server";
import { sanitizeAuditMetadata } from "@/lib/admin/auditLogSanitizer";
import { normalizeAuditSeverity } from "@/lib/admin/securityRisk";

export type AdminAuditSeverity = "info" | "warn" | "error";

export type AdminActorType =
  | "anonymous"
  | "authenticated"
  | "admin"
  | "system"
  | "unknown";

export type AdminAuditEvent = {
  id: string;
  created_at: string;
  event: string;
  severity: AdminAuditSeverity;
  actor_user_id: string | null;
  actor_email_hash: string | null;
  actor_type: AdminActorType;
  path: string | null;
  method: string | null;
  status: number | null;
  ip_hash: string | null;
  user_agent: string | null;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
};

export type AdminAuditSummary = {
  events24h: number;
  warn24h: number;
  error24h: number;
  denied24h: number;
  bootstrapBlocked24h: number;
  uploads24h: number;
};

type EventFilters = {
  severity?: "info" | "warn" | "error";
  event?: string;
  actorType?: "anonymous" | "authenticated" | "admin" | "system" | "unknown";
  from?: string;
  to?: string;
  limit?: number;
};

const DENIED_EVENTS = new Set([
  "admin_access_no_session",
  "admin_access_forbidden",
  "admin_init_no_session",
  "admin_init_forbidden_existing_admin",
  "admin_bootstrap_missing_token",
  "admin_bootstrap_invalid_token",
  "admin_bootstrap_not_configured",
  "admin_action_forbidden",
  "admin_init_denied_no_session",
  "admin_bootstrap_denied_missing_token",
  "admin_bootstrap_denied_invalid_token",
  "admin_bootstrap_denied_admin_exists",
  "admin_author_action_denied",
  "admin_post_action_denied",
  "admin_upload_denied_no_session",
  "admin_upload_denied_not_admin",
]);

const BOOTSTRAP_BLOCKED_EVENTS = new Set([
  "admin_bootstrap_missing_token",
  "admin_bootstrap_invalid_token",
  "admin_bootstrap_not_configured",
  "admin_bootstrap_denied_missing_token",
  "admin_bootstrap_denied_invalid_token",
]);

const UPLOAD_EVENTS = new Set([
  "admin_upload_success",
  "admin_upload_rejected_type",
  "admin_upload_rejected_size",
  "admin_upload_empty_file",
  "admin_upload_invalid_mime",
  "admin_upload_too_large",
]);

function parseIsoDate(date: string | undefined, isEnd = false): Date | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const value = new Date(`${date}T${isEnd ? "23:59:59.999" : "00:00:00.000"}Z`);
  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value;
}

function resolveDateRange(from?: string, to?: string): { fromIso: string; toIso: string } {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const parsedFrom = parseIsoDate(from, false);
  const parsedTo = parseIsoDate(to, true);

  let rangeFrom = parsedFrom ?? defaultFrom;
  let rangeTo = parsedTo ?? now;

  if (rangeFrom > rangeTo) {
    const swap = rangeFrom;
    rangeFrom = rangeTo;
    rangeTo = swap;
  }

  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  if (rangeTo.getTime() - rangeFrom.getTime() > ninetyDaysMs) {
    rangeFrom = new Date(rangeTo.getTime() - ninetyDaysMs);
  }

  return {
    fromIso: rangeFrom.toISOString(),
    toIso: rangeTo.toISOString(),
  };
}

function toActorType(value: string | null): AdminActorType {
  if (
    value === "anonymous" ||
    value === "authenticated" ||
    value === "admin" ||
    value === "system" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}

function normalizeEventRecord(record: Record<string, unknown>): AdminAuditEvent {
  return {
    id: String(record.id ?? ""),
    created_at: String(record.created_at ?? ""),
    event: String(record.event ?? "unknown_event"),
    severity: normalizeAuditSeverity(typeof record.severity === "string" ? record.severity : null),
    actor_user_id: typeof record.actor_user_id === "string" ? record.actor_user_id : null,
    actor_email_hash: typeof record.actor_email_hash === "string" ? record.actor_email_hash : null,
    actor_type: toActorType(typeof record.actor_type === "string" ? record.actor_type : null),
    path: typeof record.path === "string" ? record.path : null,
    method: typeof record.method === "string" ? record.method : null,
    status: typeof record.status === "number" ? record.status : null,
    ip_hash: typeof record.ip_hash === "string" ? record.ip_hash : null,
    user_agent: typeof record.user_agent === "string" ? record.user_agent : null,
    resource_type: typeof record.resource_type === "string" ? record.resource_type : null,
    resource_id: typeof record.resource_id === "string" ? record.resource_id : null,
    metadata: sanitizeAuditMetadata(
      record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)
        ? (record.metadata as Record<string, unknown>)
        : null
    ),
  };
}

export async function getAdminAuditSummary(options?: {
  from?: string;
  to?: string;
}): Promise<AdminAuditSummary> {
  const supabase = await createSessionClient();
  const { fromIso, toIso } = resolveDateRange(options?.from, options?.to);

  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("event,severity")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .limit(5000);

  if (error || !data) {
    return {
      events24h: 0,
      warn24h: 0,
      error24h: 0,
      denied24h: 0,
      bootstrapBlocked24h: 0,
      uploads24h: 0,
    };
  }

  let warn24h = 0;
  let error24h = 0;
  let denied24h = 0;
  let bootstrapBlocked24h = 0;
  let uploads24h = 0;

  for (const row of data) {
    const event = typeof row.event === "string" ? row.event : "";
    const severity = normalizeAuditSeverity(typeof row.severity === "string" ? row.severity : null);

    if (severity === "warn") {
      warn24h += 1;
    }
    if (severity === "error") {
      error24h += 1;
    }
    if (DENIED_EVENTS.has(event)) {
      denied24h += 1;
    }
    if (BOOTSTRAP_BLOCKED_EVENTS.has(event)) {
      bootstrapBlocked24h += 1;
    }
    if (UPLOAD_EVENTS.has(event)) {
      uploads24h += 1;
    }
  }

  return {
    events24h: data.length,
    warn24h,
    error24h,
    denied24h,
    bootstrapBlocked24h,
    uploads24h,
  };
}

export async function getAdminAuditEvents(filters: EventFilters = {}): Promise<AdminAuditEvent[]> {
  const supabase = await createSessionClient();
  const { fromIso, toIso } = resolveDateRange(filters.from, filters.to);
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 100);

  let query = supabase
    .from("admin_audit_logs")
    .select(
      "id,created_at,event,severity,actor_user_id,actor_email_hash,actor_type,path,method,status,ip_hash,user_agent,resource_type,resource_id,metadata"
    )
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.severity === "info") {
    query = query.in("severity", ["info"]);
  } else if (filters.severity === "warn") {
    query = query.in("severity", ["warn", "warning"]);
  } else if (filters.severity === "error") {
    query = query.in("severity", ["error", "critical"]);
  }

  if (filters.event && filters.event.trim()) {
    query = query.eq("event", filters.event.trim());
  }

  if (
    filters.actorType === "anonymous" ||
    filters.actorType === "authenticated" ||
    filters.actorType === "admin" ||
    filters.actorType === "system" ||
    filters.actorType === "unknown"
  ) {
    query = query.eq("actor_type", filters.actorType);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((item) => normalizeEventRecord(item as Record<string, unknown>));
}
