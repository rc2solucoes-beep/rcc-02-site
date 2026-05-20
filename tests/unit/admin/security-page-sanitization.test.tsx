import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/admin/auditLogQueries", () => ({
  getAdminAuditSummary: vi.fn(async () => ({
    events24h: 1,
    warn24h: 1,
    error24h: 0,
    denied24h: 0,
    bootstrapBlocked24h: 0,
    uploads24h: 0,
  })),
  getAdminAuditEvents: vi.fn(async () => [
    {
      id: "1",
      created_at: new Date().toISOString(),
      event: "admin_access_forbidden",
      severity: "warn",
      actor_user_id: "user-1",
      actor_email_hash: null,
      actor_type: "authenticated",
      path: "/api/upload",
      method: "POST",
      status: 403,
      ip_hash: "hash",
      user_agent: "ua",
      resource_type: null,
      resource_id: null,
      metadata: {
        token: "secret",
        safe: "ok",
      },
    },
  ]),
}));

describe("/admin/security page", () => {
  it("does not render sensitive metadata values", async () => {
    const { default: SecurityPage } = await import("@/app/admin/(protected)/security/page");
    const element = await SecurityPage({ searchParams: Promise.resolve({}) });

    render(createElement("div", null, element));

    const text = screen.getByText(/safe/i).textContent ?? "";
    expect(text).toContain("safe");
    expect(text).not.toContain("secret");
    expect(screen.queryByText(/token/i)).not.toBeInTheDocument();
  });

  it("renders GET filter form", async () => {
    const { default: SecurityPage } = await import("@/app/admin/(protected)/security/page");
    const element = await SecurityPage({ searchParams: Promise.resolve({ severity: "warn", event: "admin_access_forbidden" }) });

    render(createElement("div", null, element));

    expect(screen.getByRole("button", { name: "Filtrar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpar filtros" })).toHaveAttribute("href", "/admin/security");
    expect(screen.getByDisplayValue("warn")).toBeInTheDocument();
    expect(screen.getByDisplayValue("admin_access_forbidden")).toBeInTheDocument();
  });
});
