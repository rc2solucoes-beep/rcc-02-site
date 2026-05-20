import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

type AuditSeverity = "info" | "warning" | "error" | "critical";
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

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
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
    const actorEmailHash = input.actorEmail ? sha256(input.actorEmail.toLowerCase()) : null;
    const ipHash = input.ip ? sha256(input.ip) : null;

    await serviceClient.from("admin_audit_logs").insert({
      event: input.event,
      severity: input.severity ?? "info",
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
      metadata: input.metadata ?? null,
    });
  } catch {
    // Never block admin flows on audit write failure.
  }
}
