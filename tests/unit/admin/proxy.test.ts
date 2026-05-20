import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";

const getSession = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession },
  })),
}));

async function loadProxyModule() {
  return import("@/proxy");
}

describe("admin proxy", () => {
  beforeEach(() => {
    vi.resetModules();
    getSession.mockReset();
  });

  it("matches only admin routes", async () => {
    const { config } = await loadProxyModule();

    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/admin",
      })
    ).toBe(true);

    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/admin/dashboard",
      })
    ).toBe(true);

    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/api/admin/init",
      })
    ).toBe(false);
  });

  it("does not redirect authenticated users away from /admin", async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });

    const { proxy } = await loadProxyModule();
    const response = await proxy(new NextRequest("http://localhost/admin"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated users from protected admin subpaths to /admin", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
    });

    const { proxy } = await loadProxyModule();
    const response = await proxy(
      new NextRequest("http://localhost/admin/dashboard")
    );

    expect(response.status).toBe(307);
    expect(getRedirectUrl(response)).toBe("http://localhost/admin");
  });
});
