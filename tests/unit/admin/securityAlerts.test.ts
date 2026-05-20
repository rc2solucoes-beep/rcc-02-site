import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const send = vi.fn();
const insert = vi.fn();
const select = vi.fn();
const inFilter = vi.fn();
const gte = vi.fn();
const limit = vi.fn();
const from = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(function ResendMock() {
    return {
      emails: { send },
    };
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => ({ from })),
}));

describe("securityAlerts", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();

    send.mockReset();
    insert.mockReset();
    select.mockReset();
    inFilter.mockReset();
    gte.mockReset();
    limit.mockReset();
    from.mockReset();

    limit.mockResolvedValue({ data: [], error: null });
    gte.mockReturnValue({ limit });
    inFilter.mockReturnValue({ gte });
    select.mockReturnValue({ in: inFilter });
    insert.mockResolvedValue({ error: null });

    from.mockImplementation((table: string) => {
      if (table === "admin_audit_logs") {
        return {
          select,
          insert,
        };
      }
      return { select, insert };
    });
  });

  it("does not send alert when emails are not configured and logs skipped", async () => {
    const { sendSecurityAlert } = await import("@/lib/admin/securityAlerts");

    await sendSecurityAlert({
      event: "admin_access_forbidden",
      severity: "warn",
    });

    expect(send).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ event: "admin_security_alert_skipped_unconfigured" })
    );
  });

  it("does not leak sensitive metadata keys", async () => {
    vi.stubEnv("SECURITY_ALERT_EMAIL", "security@example.com");
    vi.stubEnv("RESEND_API_KEY", "re_test");

    const { sendSecurityAlert } = await import("@/lib/admin/securityAlerts");

    await sendSecurityAlert({
      event: "admin_upload_rejected_size",
      severity: "warn",
      metadata: {
        token: "secret",
        authorization: "Bearer x",
        password: "abc",
        safe: "ok",
      },
    });

    expect(send).toHaveBeenCalledTimes(1);
    const payload = JSON.stringify(send.mock.calls[0]?.[0] ?? {});
    expect(payload).not.toContain("secret");
    expect(payload).not.toContain("authorization");
    expect(payload).not.toContain("password");
    expect(payload).toContain("safe");
  });
});
