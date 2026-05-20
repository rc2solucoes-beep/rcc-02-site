import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(async () => ({
    url: "https://blob.example/image.jpg",
    pathname: "blog/123-image.jpg",
  })),
}));

const writeAdminAuditLog = vi.fn();
const requireAdmin = vi.fn();

vi.mock("@/lib/admin/auditLog", () => ({
  extractRequestContext: vi.fn(() => ({
    path: "/api/upload",
    method: "POST",
    ip: "127.0.0.1",
    userAgent: "vitest",
  })),
  writeAdminAuditLog,
}));

vi.mock("@/lib/admin/requireAdmin", () => ({
  requireAdmin,
}));

describe("POST /api/upload audit metadata", () => {
  beforeEach(() => {
    vi.resetModules();
    writeAdminAuditLog.mockReset();
    requireAdmin.mockReset();

    requireAdmin.mockResolvedValue({
      ok: true,
      status: 200,
      userId: "admin-1",
      email: "admin@example.com",
    });
  });

  it("does not log raw filename on invalid mime", async () => {
    const { POST } = await import("@/app/api/upload/route");
    const req = new NextRequest("http://localhost/api/upload?filename=secret-contract.pdf", {
      method: "POST",
      headers: { "content-type": "application/pdf" },
      body: new Uint8Array([1, 2, 3]),
    });

    await POST(req);

    const auditCall = writeAdminAuditLog.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> };
    expect(auditCall.metadata?.filename).toBeUndefined();
    expect(auditCall.metadata?.extension).toBeNull();
    expect(auditCall.metadata?.contentTypeHeader).toBe("application/pdf");
  });

  it("logs safe metadata fields on success", async () => {
    const { POST } = await import("@/app/api/upload/route");
    const req = new NextRequest("http://localhost/api/upload?filename=secret-contract.jpg&folder=blog", {
      method: "POST",
      headers: { "content-type": "image/jpeg" },
      body: new Uint8Array([1, 2, 3]),
    });

    await POST(req);

    const successCall = writeAdminAuditLog.mock.calls.find(
      (call) => call[0]?.event === "admin_upload_success"
    )?.[0] as { metadata?: Record<string, unknown> };

    expect(successCall.metadata?.filename).toBeUndefined();
    expect(successCall.metadata?.sanitizedFilename).toBeTypeOf("string");
    expect(successCall.metadata?.extension).toBe("jpg");
    expect(successCall.metadata?.mimeType).toBe("image/jpeg");
    expect(successCall.metadata?.sizeBytes).toBe(3);
    expect(successCall.metadata?.folder).toBe("blog");
  });
});
