import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const limit = vi.fn();
const order = vi.fn(() => ({ limit }));
const eq = vi.fn(() => ({ order, limit, eq, gte, lte, in: inFilter }));
const inFilter = vi.fn(() => ({ order, limit, eq, gte, lte, in: inFilter }));
const gte = vi.fn(() => ({ lte, order, limit, eq, in: inFilter }));
const lte = vi.fn(() => ({ order, limit, eq, in: inFilter }));
const select = vi.fn(() => ({ gte, lte, order, limit, eq, in: inFilter }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: vi.fn(async () => ({ from })),
}));

describe("auditLogQueries", () => {
  beforeEach(() => {
    vi.resetModules();
    from.mockReset();
    select.mockReset();
    gte.mockReset();
    lte.mockReset();
    eq.mockReset();
    inFilter.mockReset();
    order.mockReset();
    limit.mockReset();

    const terminal = Promise.resolve({ data: [], error: null });
    limit.mockReturnValue(terminal);
    order.mockReturnValue({ limit });
    eq.mockReturnValue({ order, limit, eq, gte, lte, in: inFilter });
    inFilter.mockReturnValue({ order, limit, eq, gte, lte, in: inFilter });
    gte.mockReturnValue({ lte, order, limit, eq, in: inFilter });
    lte.mockReturnValue({ order, limit, eq, in: inFilter });
    select.mockReturnValue({ gte, lte, order, limit, eq, in: inFilter });
    from.mockReturnValue({ select });
  });

  it("caps event query limit to 100", async () => {
    const { getAdminAuditEvents } = await import("@/lib/admin/auditLogQueries");
    await getAdminAuditEvents({ limit: 999 });

    expect(limit).toHaveBeenCalledWith(100);
  });

  it("ignores invalid filters", async () => {
    const { getAdminAuditEvents } = await import("@/lib/admin/auditLogQueries");
    await getAdminAuditEvents({ severity: "invalid" as never, actorType: "bad" as never });

    expect(inFilter).not.toHaveBeenCalledWith("severity", expect.anything());
    expect(eq).not.toHaveBeenCalledWith("actor_type", expect.anything());
  });

  it("applies date range filters", async () => {
    const { getAdminAuditEvents } = await import("@/lib/admin/auditLogQueries");
    await getAdminAuditEvents({ from: "2026-01-01", to: "2026-05-20" });

    const gteCall = gte.mock.calls.find(
      (call) => (call as unknown[])[0] === "created_at"
    );
    const lteCall = lte.mock.calls.find(
      (call) => (call as unknown[])[0] === "created_at"
    );

    expect(gteCall).toBeTruthy();
    expect(lteCall).toBeTruthy();

    if (gteCall && lteCall) {
      const fromValue = (gteCall as unknown as [string, string])[1];
      const toValue = (lteCall as unknown as [string, string])[1];
      const fromDate = new Date(fromValue);
      const toDate = new Date(toValue);
      const diffDays = (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBeLessThanOrEqual(90);
    }
  });
});
