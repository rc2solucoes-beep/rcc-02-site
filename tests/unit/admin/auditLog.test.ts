import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "crypto";

vi.mock("server-only", () => ({}));

const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const sendSecurityAlert = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => ({ from })),
}));

vi.mock("@/lib/admin/securityAlerts", () => ({
  sendSecurityAlert,
}));

describe("writeAdminAuditLog", () => {
  beforeEach(() => {
    vi.resetModules();
    insert.mockReset();
    from.mockClear();
    sendSecurityAlert.mockReset();
    insert.mockResolvedValue({ error: null });
  });

  it("does not throw if alert sending fails", async () => {
    sendSecurityAlert.mockRejectedValue(new Error("mail down"));
    const { writeAdminAuditLog } = await import("@/lib/admin/auditLog");

    await expect(
      writeAdminAuditLog({
        event: "admin_access_forbidden",
        severity: "warning",
      })
    ).resolves.toBeUndefined();
  });

  it("does not trigger alerts for internal alert events", async () => {
    const { writeAdminAuditLog } = await import("@/lib/admin/auditLog");

    await writeAdminAuditLog({
      event: "admin_security_alert_sent",
      severity: "info",
    });

    expect(sendSecurityAlert).not.toHaveBeenCalled();
  });

  it("uses salted hashes for email and ip", async () => {
    vi.stubEnv("AUDIT_LOG_SALT", "salt-123");
    const { writeAdminAuditLog } = await import("@/lib/admin/auditLog");

    await writeAdminAuditLog({
      event: "admin_access_forbidden",
      severity: "warning",
      actorEmail: "Admin@Example.com",
      ip: "127.0.0.1",
    });

    const payload = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    const expectedEmailHash = createHash("sha256")
      .update("salt-123:admin@example.com")
      .digest("hex");
    const expectedIpHash = createHash("sha256")
      .update("salt-123:127.0.0.1")
      .digest("hex");

    expect(payload.actor_email_hash).toBe(expectedEmailHash);
    expect(payload.ip_hash).toBe(expectedIpHash);
    expect(payload.actor_email_hash).not.toBe("admin@example.com");
    expect(payload.ip_hash).not.toBe("127.0.0.1");
  });

  it("omits hashes in production when salt is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUDIT_LOG_SALT", "");
    vi.stubEnv("IP_SALT", "");
    const { writeAdminAuditLog } = await import("@/lib/admin/auditLog");

    await writeAdminAuditLog({
      event: "admin_access_forbidden",
      severity: "warning",
      actorEmail: "admin@example.com",
      ip: "127.0.0.1",
    });

    const payload = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.actor_email_hash).toBeNull();
    expect(payload.ip_hash).toBeNull();
  });

  it("normalizes warning and critical severities before insert", async () => {
    const { writeAdminAuditLog } = await import("@/lib/admin/auditLog");

    await writeAdminAuditLog({ event: "a", severity: "warning" });
    await writeAdminAuditLog({ event: "b", severity: "critical" });

    const payload1 = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    const payload2 = insert.mock.calls[1]?.[0] as Record<string, unknown>;
    expect(payload1.severity).toBe("warn");
    expect(payload2.severity).toBe("error");
  });
});
