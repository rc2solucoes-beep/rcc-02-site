import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
