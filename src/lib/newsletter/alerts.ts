import "server-only";

// Alertas operacionais do processador (SDD Newsletter §8.6 e §8.7), sem inundação: no máximo UM
// alerta por tipo por hora; os demais viram evento de auditoria sem e-mail. Só contagens e códigos
// (nenhum e-mail, token, URL ou texto de erro). O throttle usa `rate_limit_hit` (E0c) com chaves
// que não contêm dado pessoal.

import { writeAdminAuditLog } from "@/lib/admin/auditLog";
import type { DispatchSummary } from "@/lib/newsletter/processor";
import { rateLimitHit, type RateLimitClient } from "@/lib/security/rateLimit";

export type AlertType = "config" | "bug" | "delivery" | "quota" | "unauthorized";

const ALERT_WINDOW_SECONDS = 3600;

const EVENT_BY_TYPE: Record<AlertType, string> = {
  config: "newsletter_outbox_dead",
  bug: "newsletter_outbox_dead",
  delivery: "newsletter_outbox_dead",
  quota: "newsletter_provider_quota",
  unauthorized: "newsletter_dispatch_unauthorized",
};

type AuditWriter = typeof writeAdminAuditLog;

/** Emite o alerta (whitelisted → e-mail de segurança) se for o primeiro da hora; senão só registra. */
export async function raiseAlert(
  client: RateLimitClient,
  type: AlertType,
  count: number,
  audit: AuditWriter = writeAdminAuditLog,
): Promise<"alerted" | "logged"> {
  let first = false;
  try {
    first = (await rateLimitHit(client, `nl:alert:${type}`, 1, ALERT_WINDOW_SECONDS)).allowed;
  } catch {
    first = false; // sem throttle confiável, registra sem e-mail (nunca inunda)
  }
  await audit({
    event: first ? EVENT_BY_TYPE[type] : `${EVENT_BY_TYPE[type]}_logged`,
    severity: first ? (type === "unauthorized" ? "warn" : "error") : "info",
    actorType: "system",
    resourceType: "newsletter_outbox",
    metadata: { alert_type: type, count },
  });
  return first ? "alerted" : "logged";
}

/** Alertas da invocação: configuração, bug, entrega (expirados) e cota. `superseded` NÃO alerta. */
export async function reportDispatchAlerts(
  client: RateLimitClient,
  summary: DispatchSummary,
  audit: AuditWriter = writeAdminAuditLog,
): Promise<AlertType[]> {
  const raised: AlertType[] = [];
  const candidates: Array<[AlertType, number]> = [
    ["config", summary.deadByReason.permanent_error],
    ["bug", summary.deadByReason.invalid_state],
    ["delivery", summary.expired],
    ["quota", summary.quotaHit ? 1 : 0],
  ];
  for (const [type, count] of candidates) {
    if (count > 0) {
      await raiseAlert(client, type, count, audit);
      raised.push(type);
    }
  }
  return raised;
}
