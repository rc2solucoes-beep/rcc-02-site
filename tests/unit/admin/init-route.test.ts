import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireAdmin = vi.fn();
const createServiceClient = vi.fn();
const rpc = vi.fn();

let warnSpy: ReturnType<typeof vi.spyOn>;
let infoSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

vi.mock("@/lib/admin/requireAdmin", () => ({
  requireAdmin,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient,
}));

function mockNoAuthenticatedUser() {
  requireAdmin.mockResolvedValue({
    ok: false,
    status: 401,
    user: null,
    email: null,
    userId: null,
  });
}

function mockExistingAdmin() {
  requireAdmin.mockResolvedValue({
    ok: true,
    status: 200,
    user: { id: "admin-1", email: "admin@example.com" },
    email: "admin@example.com",
    userId: "admin-1",
  });
}

function mockAuthenticatedNonAdmin(email: string | null = "user@example.com") {
  requireAdmin.mockResolvedValue({
    ok: false,
    status: 403,
    user: email ? { id: "user-1", email } : { id: "user-1" },
    email,
    userId: "user-1",
  });
}

async function loadPost() {
  const { POST } = await import("@/app/api/admin/init/route");
  return POST;
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function createPostRequest(headers?: HeadersInit) {
  return new NextRequest("http://localhost/api/admin/init", {
    method: "POST",
    headers,
  });
}

function expectSpyCallsNotToContain(spy: ReturnType<typeof vi.spyOn>, value: string) {
  expect(JSON.stringify(spy.mock.calls)).not.toContain(value);
}

describe("POST /api/admin/init", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();

    requireAdmin.mockReset();
    createServiceClient.mockReset();
    rpc.mockReset();

    createServiceClient.mockReturnValue({ rpc });
    rpc.mockResolvedValue({ data: false, error: null });

    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 401 with no authenticated user or session", async () => {
    vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
    mockNoAuthenticatedUser();

    const POST = await loadPost();
    const response = await POST(
      createPostRequest({ "x-admin-bootstrap-token": "request-token" })
    );

    expect(response.status).toBe(401);
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(await readJson(response)).toEqual({ error: "Unauthorized" });
    expect(warnSpy).toHaveBeenCalledWith("[/api/admin/init] Access denied: no active session");
    expectSpyCallsNotToContain(warnSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(warnSpy, "request-token");
    expectSpyCallsNotToContain(infoSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(infoSpy, "request-token");
    expectSpyCallsNotToContain(errorSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(errorSpy, "request-token");
  });

  it("returns 200 for an existing admin", async () => {
    mockExistingAdmin();

    const POST = await loadPost();
    const response = await POST(createPostRequest());

    expect(response.status).toBe(200);
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(await readJson(response)).toEqual({ success: true });
  });

  it("returns 403 when admin bootstrap is not configured", async () => {
    mockAuthenticatedNonAdmin();

    const POST = await loadPost();
    const response = await POST(createPostRequest());

    expect(response.status).toBe(403);
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(await readJson(response)).toEqual({ error: "Forbidden" });
  });

  it("returns 403 when the bootstrap token header is missing", async () => {
    vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
    mockAuthenticatedNonAdmin();

    const POST = await loadPost();
    const response = await POST(createPostRequest());

    expect(response.status).toBe(403);
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(await readJson(response)).toEqual({ error: "Forbidden" });
    expect(warnSpy).toHaveBeenCalledWith("[/api/admin/init] Bootstrap denied: missing token");
    expectSpyCallsNotToContain(warnSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(infoSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(errorSpy, "secret-bootstrap");
  });

  it("returns 403 when the bootstrap token is invalid", async () => {
    vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
    mockAuthenticatedNonAdmin();

    const POST = await loadPost();
    const response = await POST(
      createPostRequest({ "x-admin-bootstrap-token": "wrong-token" })
    );

    expect(response.status).toBe(403);
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();

    const body = await readJson(response);
    expect(body).toEqual({ error: "Forbidden" });
    expect(JSON.stringify(body)).not.toContain("secret-bootstrap");
    expect(JSON.stringify(body)).not.toContain("wrong-token");
    expect(warnSpy).toHaveBeenCalledWith("[/api/admin/init] Bootstrap denied: invalid token");
    expectSpyCallsNotToContain(warnSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(warnSpy, "wrong-token");
    expectSpyCallsNotToContain(infoSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(infoSpy, "wrong-token");
    expectSpyCallsNotToContain(errorSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(errorSpy, "wrong-token");
  });

  it("returns 403 when the bootstrap candidate has no email", async () => {
    vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
    mockAuthenticatedNonAdmin(null);

    const POST = await loadPost();
    const response = await POST(
      createPostRequest({ "x-admin-bootstrap-token": "secret-bootstrap" })
    );

    expect(response.status).toBe(403);
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(await readJson(response)).toEqual({ error: "Forbidden" });
    expect(warnSpy).toHaveBeenCalledWith(
      "[/api/admin/init] Bootstrap denied: authenticated user missing email"
    );
    expectSpyCallsNotToContain(warnSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(infoSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(errorSpy, "secret-bootstrap");
  });

  it("returns 403 when the atomic bootstrap rpc reports an admin already exists", async () => {
    vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
    mockAuthenticatedNonAdmin();
    rpc.mockResolvedValue({ data: false, error: null });

    const POST = await loadPost();
    const response = await POST(
      createPostRequest({ "x-admin-bootstrap-token": "secret-bootstrap" })
    );

    expect(response.status).toBe(403);
    expect(createServiceClient).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("bootstrap_first_admin", {
      bootstrap_user_id: "user-1",
      bootstrap_email: "user@example.com",
    });
    expect(await readJson(response)).toEqual({ error: "Forbidden" });
    expect(warnSpy).toHaveBeenCalledWith("[/api/admin/init] Bootstrap denied: admin already exists");
    expectSpyCallsNotToContain(warnSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(infoSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(errorSpy, "secret-bootstrap");
  });

  it("returns 201 only when the atomic bootstrap rpc succeeds", async () => {
    vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
    mockAuthenticatedNonAdmin();
    rpc.mockResolvedValue({ data: true, error: null });

    const POST = await loadPost();
    const response = await POST(
      createPostRequest({ "x-admin-bootstrap-token": "secret-bootstrap" })
    );

    expect(response.status).toBe(201);
    expect(createServiceClient).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("bootstrap_first_admin", {
      bootstrap_user_id: "user-1",
      bootstrap_email: "user@example.com",
    });

    const body = await readJson(response);
    expect(body).toEqual({ success: true });
    expect(JSON.stringify(body)).not.toContain("secret-bootstrap");
    expect(infoSpy).toHaveBeenCalledWith("[/api/admin/init] First admin created");
    expectSpyCallsNotToContain(warnSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(infoSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(errorSpy, "secret-bootstrap");
  });

  it("returns 500 when the atomic bootstrap rpc returns an error without leaking the token", async () => {
    vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
    mockAuthenticatedNonAdmin();
    rpc.mockResolvedValue({
      data: null,
      error: { message: "rpc failed with secret-bootstrap" },
    });

    const POST = await loadPost();
    const response = await POST(
      createPostRequest({ "x-admin-bootstrap-token": "secret-bootstrap" })
    );

    expect(response.status).toBe(500);
    expect(createServiceClient).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(await readJson(response)).toEqual({ error: "Internal server error" });
    expect(errorSpy).toHaveBeenCalledWith("[/api/admin/init] Unexpected server error");
    expectSpyCallsNotToContain(warnSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(infoSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(errorSpy, "secret-bootstrap");
  });

  it("returns 500 when the atomic bootstrap rpc throws without leaking the token", async () => {
    vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
    mockAuthenticatedNonAdmin();
    rpc.mockRejectedValue(new Error("boom secret-bootstrap"));

    const POST = await loadPost();
    const response = await POST(
      createPostRequest({ "x-admin-bootstrap-token": "secret-bootstrap" })
    );

    expect(response.status).toBe(500);
    expect(createServiceClient).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(await readJson(response)).toEqual({ error: "Internal server error" });
    expect(errorSpy).toHaveBeenCalledWith("[/api/admin/init] Unexpected server error");
    expectSpyCallsNotToContain(warnSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(infoSpy, "secret-bootstrap");
    expectSpyCallsNotToContain(errorSpy, "secret-bootstrap");
  });
});
