import "server-only";

import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendSecurityAlert } from "@/lib/admin/securityAlerts";
import { sanitizeAuditMetadata } from "@/lib/admin/auditLogSanitizer";
import { normalizeAuditSeverity } from "@/lib/admin/securityRisk";

type AuditSeverity = "info" | "warn" | "warning" | "error" | "critical";
type AuditActorType = "admin" | "authenticated" | "unknown" | "system";

type AuditLogInput = {
  event: string;
  severity?: AuditSeverity;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorType?: AuditActorType;
  path?: string | null;
  method?: string | null;
  status?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
};

const ALERT_EVENT_WHITELIST = new Set([
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

function toAlertSeverity(
  severity: "info" | "warn" | "error"
): "warn" | "error" | null {
  if (severity === "error") {
    return "error";
  }
  if (severity === "warn") {
    return "warn";
  }
  return null;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function getAuditSalt(): string | undefined {
  return (
    process.env.AUDIT_LOG_SALT ??
    process.env.IP_SALT ??
    (process.env.NODE_ENV === "development" ? "rc2-dev-only" : undefined)
  );
}

function normalizeIp(ip: string): string {
  return ip.split(",")[0]?.trim() ?? ip.trim();
}

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return input.slice(0, max);
}

export function extractRequestContext(request: Request): {
  path: string;
  method: string;
  ip: string | null;
  userAgent: string | null;
} {
  const url = new URL(request.url);
  const method = request.method || "UNKNOWN";
  const path = url.pathname;
  const userAgent = request.headers.get("user-agent");
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");
  const ip = cfIp ?? realIp ?? xForwardedFor ?? null;

  return {
    path,
    method,
    ip: ip ? normalizeIp(ip) : null,
    userAgent: userAgent ? truncate(userAgent, 1024) : null,
  };
}

export async function writeAdminAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const serviceClient = createServiceClient();
    const auditSalt = getAuditSalt();
    const isProdWithoutSalt = process.env.NODE_ENV === "production" && !auditSalt;
    if (isProdWithoutSalt) {
      console.error("[auditLog] Missing AUDIT_LOG_SALT/IP_SALT in production; hashes will be omitted");
    }

    const actorEmailHash =
      input.actorEmail && auditSalt
        ? sha256(`${auditSalt}:${input.actorEmail.toLowerCase()}`)
        : null;
    const ipHash =
      input.ip && auditSalt
        ? sha256(`${auditSalt}:${normalizeIp(input.ip)}`)
        : null;
    const severity = normalizeAuditSeverity(input.severity ?? "info");
    const metadata = sanitizeAuditMetadata(input.metadata ?? null);

    await serviceClient.from("admin_audit_logs").insert({
      event: input.event,
      severity,
      actor_user_id: input.actorUserId ?? null,
      actor_email_hash: actorEmailHash,
      actor_type: input.actorType ?? "unknown",
      path: input.path ?? null,
      method: input.method ?? null,
      status: input.status ?? null,
      ip_hash: ipHash,
      user_agent: input.userAgent ?? null,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      metadata,
    });

    const alertSeverity = toAlertSeverity(severity);
    if (
      alertSeverity &&
      ALERT_EVENT_WHITELIST.has(input.event) &&
      !INTERNAL_ALERT_EVENTS.has(input.event)
    ) {
      await sendSecurityAlert({
        event: input.event,
        severity: alertSeverity,
        status: input.status ?? null,
        path: input.path ?? null,
        actorUserId: input.actorUserId ?? null,
        actorEmailHash,
        ipHash,
        metadata,
      });
    }
  } catch {
    // Never block admin flows on audit write failure.
  }
}
