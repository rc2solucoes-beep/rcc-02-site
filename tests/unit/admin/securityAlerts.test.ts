import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const send = vi.fn();
const insert = vi.fn();
const filter = vi.fn();
const gte = vi.fn();
const inFilter = vi.fn();
const select = vi.fn();
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
    filter.mockReset();
    gte.mockReset();
    inFilter.mockReset();
    select.mockReset();
    from.mockReset();

    filter.mockResolvedValue({ count: 0, error: null });
    const query = {
      in: inFilter,
      gte,
      select,
      filter,
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    gte.mockReturnValue(query);
    inFilter.mockReturnValue(query);
    select.mockReturnValue(query);
    insert.mockResolvedValue({ error: null });

    from.mockReturnValue({ select, insert, in: inFilter, gte });
  });

  it("does not send alert for internal alert events", async () => {
    const { sendSecurityAlert } = await import("@/lib/admin/securityAlerts");

    await sendSecurityAlert({ event: "admin_security_alert_sent", severity: "warn" });
    await sendSecurityAlert({ event: "admin_security_alert_skipped_unconfigured", severity: "warn" });

    expect(send).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
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

  it("dedupes by sourceEvent when recent alert already exists", async () => {
    vi.stubEnv("SECURITY_ALERT_EMAIL", "security@example.com");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    filter.mockResolvedValueOnce({ count: 1, error: null });
    const { sendSecurityAlert } = await import("@/lib/admin/securityAlerts");

    await sendSecurityAlert({
      event: "admin_access_forbidden",
      severity: "warn",
    });

    expect(send).not.toHaveBeenCalled();
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
        apiKey: "123",
        safe: "ok",
      },
    });

    expect(send).toHaveBeenCalledTimes(1);
    const payload = JSON.stringify(send.mock.calls[0]?.[0] ?? {});
    expect(payload).not.toContain("secret");
    expect(payload).not.toContain("authorization");
    expect(payload).not.toContain("password");
    expect(payload).not.toContain("apiKey");
    expect(payload).toContain("safe");
  });
});
