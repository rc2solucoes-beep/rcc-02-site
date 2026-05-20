import "server-only";

import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";
import { sanitizeAuditMetadata } from "@/lib/admin/auditLogSanitizer";

type SecurityAlertSeverity = "warn" | "error";

const ALERT_EVENTS = new Set([
  "admin_bootstrap_success",
  "admin_bootstrap_invalid_token",
  "admin_bootstrap_not_configured",
  "admin_access_forbidden",
  "admin_action_forbidden",
  "admin_upload_rejected_type",
  "admin_upload_rejected_size",
  "admin_bootstrap_created_first_admin",
  "admin_bootstrap_denied_invalid_token",
  "admin_bootstrap_denied_missing_token",
  "admin_bootstrap_denied_admin_exists",
  "admin_post_action_denied",
  "admin_author_action_denied",
  "admin_upload_invalid_mime",
  "admin_upload_too_large",
  "admin_upload_denied_not_admin",
]);

const INTERNAL_ALERT_EVENTS = new Set([
  "admin_security_alert_sent",
  "admin_security_alert_skipped_unconfigured",
]);

type SendSecurityAlertInput = {
  event: string;
  severity: SecurityAlertSeverity;
  status?: number | null;
  path?: string | null;
  actorUserId?: string | null;
  actorEmailHash?: string | null;
  ipHash?: string | null;
  metadata?: Record<string, unknown> | null;
};

async function writeAlertLog(event: string, sourceEvent: string): Promise<void> {
  try {
    const service = createServiceClient();
    await service.from("admin_audit_logs").insert({
      event,
      severity: "info",
      actor_type: "system",
      metadata: { sourceEvent },
    });
  } catch {
    // best-effort
  }
}

async function hasRecentAlertEvent(sourceEvent: string): Promise<boolean> {
  try {
    const service = createServiceClient();
    const threshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count, error } = await service
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .in("event", ["admin_security_alert_sent", "admin_security_alert_skipped_unconfigured"])
      .gte("created_at", threshold)
      .filter("metadata->>sourceEvent", "eq", sourceEvent);

    if (!error) {
      return (count ?? 0) > 0;
    }

    // Fallback for clients that don't support JSON-path filters reliably.
    const { data, error: fallbackError } = await service
      .from("admin_audit_logs")
      .select("id,metadata")
      .in("event", ["admin_security_alert_sent", "admin_security_alert_skipped_unconfigured"])
      .gte("created_at", threshold)
      .limit(250);

    if (fallbackError || !data) {
      return false;
    }

    return data.some((row) => {
      if (!row.metadata || typeof row.metadata !== "object") {
        return false;
      }
      return (row.metadata as Record<string, unknown>).sourceEvent === sourceEvent;
    });
  } catch {
    return false;
  }
}

export async function sendSecurityAlert(input: SendSecurityAlertInput): Promise<void> {
  if (!ALERT_EVENTS.has(input.event) || INTERNAL_ALERT_EVENTS.has(input.event)) {
    return;
  }

  if (await hasRecentAlertEvent(input.event)) {
    return;
  }

  const destination = process.env.SECURITY_ALERT_EMAIL ?? process.env.LEAD_NOTIFICATION_EMAIL;

  if (!destination) {
    await writeAlertLog("admin_security_alert_skipped_unconfigured", input.event);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "xxxx") {
    await writeAlertLog("admin_security_alert_skipped_unconfigured", input.event);
    return;
  }

  const sanitizedMetadata = sanitizeAuditMetadata(input.metadata ?? null);

  const textLines = [
    `Evento: ${input.event}`,
    `Severidade: ${input.severity}`,
    `Status: ${input.status ?? "—"}`,
    `Path: ${input.path ?? "—"}`,
    `ActorUserId: ${input.actorUserId ?? "—"}`,
    `ActorEmailHash: ${input.actorEmailHash ?? "—"}`,
    `IpHash: ${input.ipHash ?? "—"}`,
    `Metadata: ${JSON.stringify(sanitizedMetadata ?? {})}`,
  ];

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "RC2 Security <notificacoes@rc2solucoes.com.br>",
      to: destination,
      subject: `[Admin Security] ${input.event}`,
      text: textLines.join("\n"),
    });

    await writeAlertLog("admin_security_alert_sent", input.event);
  } catch {
    // best-effort
  }
}

export const __internal = {
  hasRecentAlertEvent,
  ALERT_EVENTS,
  INTERNAL_ALERT_EVENTS,
};
