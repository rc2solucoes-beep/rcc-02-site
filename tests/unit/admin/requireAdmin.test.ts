import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: vi.fn(async () => ({
    auth: { getUser },
    from,
  })),
}));

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.resetModules();
    getUser.mockReset();
    maybeSingle.mockReset();
    eq.mockClear();
    select.mockClear();
    from.mockClear();
  });

  it("returns 401 when there is no authenticated user", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { requireAdmin } = await import("@/lib/admin/requireAdmin");
    const result = await requireAdmin();

    expect(result).toEqual({
      ok: false,
      status: 401,
      user: null,
      email: null,
      userId: null,
    });
    expect(from).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(eq).not.toHaveBeenCalled();
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("returns 401 when loading the authenticated user errors", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("user failed"),
    });

    const { requireAdmin } = await import("@/lib/admin/requireAdmin");
    const result = await requireAdmin();

    expect(result).toEqual({
      ok: false,
      status: 401,
      user: null,
      email: null,
      userId: null,
    });
    expect(from).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(eq).not.toHaveBeenCalled();
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("returns 403 when the authenticated user is not in admin_users", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const { requireAdmin } = await import("@/lib/admin/requireAdmin");
    const result = await requireAdmin();

    expect(result).toEqual({
      ok: false,
      status: 403,
      user: { id: "user-1", email: "user@example.com" },
      email: "user@example.com",
      userId: "user-1",
    });
    expect(from).toHaveBeenCalledWith("admin_users");
    expect(select).toHaveBeenCalledWith("id,email");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("returns 403 when the admin_users query errors", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: null,
      error: new Error("query failed"),
    });

    const { requireAdmin } = await import("@/lib/admin/requireAdmin");
    const result = await requireAdmin();

    expect(result).toEqual({
      ok: false,
      status: 403,
      user: { id: "user-1", email: "user@example.com" },
      email: "user@example.com",
      userId: "user-1",
    });
    expect(from).toHaveBeenCalledWith("admin_users");
    expect(select).toHaveBeenCalledWith("id,email");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("normalizes a missing email to null for authenticated non-admin users", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-2" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const { requireAdmin } = await import("@/lib/admin/requireAdmin");
    const result = await requireAdmin();

    expect(result).toEqual({
      ok: false,
      status: 403,
      user: { id: "user-2" },
      email: null,
      userId: "user-2",
    });
    expect(from).toHaveBeenCalledWith("admin_users");
    expect(select).toHaveBeenCalledWith("id,email");
    expect(eq).toHaveBeenCalledWith("id", "user-2");
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("returns 200 when the authenticated user is present in admin_users", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { id: "admin-1", email: "admin@example.com" },
      error: null,
    });

    const { requireAdmin } = await import("@/lib/admin/requireAdmin");
    const result = await requireAdmin();

    expect(result).toEqual({
      ok: true,
      status: 200,
      user: { id: "admin-1", email: "admin@example.com" },
      email: "admin@example.com",
      userId: "admin-1",
    });
    expect(from).toHaveBeenCalledWith("admin_users");
    expect(select).toHaveBeenCalledWith("id,email");
    expect(eq).toHaveBeenCalledWith("id", "admin-1");
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("normalizes a missing email to null for authenticated admins", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "admin-2" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { id: "admin-2", email: null },
      error: null,
    });

    const { requireAdmin } = await import("@/lib/admin/requireAdmin");
    const result = await requireAdmin();

    expect(result).toEqual({
      ok: true,
      status: 200,
      user: { id: "admin-2" },
      email: null,
      userId: "admin-2",
    });
    expect(from).toHaveBeenCalledWith("admin_users");
    expect(select).toHaveBeenCalledWith("id,email");
    expect(eq).toHaveBeenCalledWith("id", "admin-2");
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });
});
