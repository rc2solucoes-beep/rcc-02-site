import { describe, expect, it } from "vitest";
import { getAuditEventRiskLevel, normalizeAuditSeverity } from "@/lib/admin/securityRisk";

describe("securityRisk", () => {
  it("forces error events to high risk", () => {
    expect(getAuditEventRiskLevel("admin_upload_success", "error")).toBe("high");
  });

  it("maps known high risk events", () => {
    expect(getAuditEventRiskLevel("admin_action_forbidden", "warn")).toBe("high");
  });

  it("defaults warn to medium when event is unknown", () => {
    expect(getAuditEventRiskLevel("unknown_event", "warn")).toBe("medium");
  });

  it("normalizes legacy severities", () => {
    expect(normalizeAuditSeverity("warning")).toBe("warn");
    expect(normalizeAuditSeverity("critical")).toBe("error");
  });
});
