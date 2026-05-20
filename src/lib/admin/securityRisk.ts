type AdminAuditSeverity = "info" | "warn" | "error";

const HIGH_RISK_EVENTS = new Set([
  "admin_bootstrap_invalid_token",
  "admin_bootstrap_not_configured",
  "admin_bootstrap_success",
  "admin_init_forbidden_existing_admin",
  "admin_action_forbidden",
]);

const MEDIUM_RISK_EVENTS = new Set([
  "admin_access_forbidden",
  "admin_access_no_session",
  "admin_init_no_session",
  "admin_upload_rejected_type",
  "admin_upload_rejected_size",
]);

const LOW_RISK_EVENTS = new Set([
  "admin_init_admin_verified",
  "admin_upload_success",
  "admin_post_created",
  "admin_post_updated",
  "admin_settings_updated",
]);

export function getAuditEventRiskLevel(
  event: string,
  severity: string
): "low" | "medium" | "high" {
  if (severity === "error") {
    return "high";
  }

  if (HIGH_RISK_EVENTS.has(event)) {
    return "high";
  }

  if (MEDIUM_RISK_EVENTS.has(event)) {
    return "medium";
  }

  if (LOW_RISK_EVENTS.has(event)) {
    return "low";
  }

  if (severity === "warn") {
    return "medium";
  }

  return "low";
}

export function normalizeAuditSeverity(
  severity: string | null | undefined
): AdminAuditSeverity {
  if (severity === "warn" || severity === "warning") {
    return "warn";
  }

  if (severity === "error" || severity === "critical") {
    return "error";
  }

  return "info";
}
