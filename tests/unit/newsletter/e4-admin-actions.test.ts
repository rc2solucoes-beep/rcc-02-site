import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// T-NL-U/E4: Server Actions com dublês. NENHUM acesso à rede, Supabase ou Vercel.
const ID = "450ceabd-d97d-484a-b927-00bce606e87a";
const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const rpc = vi.fn();
const audit = vi.fn();
const revalidate = vi.fn();
const state = {
  admin: { ok: true, status: 200, userId: ADMIN_ID, email: "admin@example.test" } as {
    ok: boolean; status: number; userId: string | null; email: string | null;
  },
  sessionCreates: 0,
};

vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidate(path) }));
vi.mock("@/lib/admin/requireAdmin", () => ({ requireAdmin: async () => state.admin }));
vi.mock("@/lib/admin/auditLog", () => ({ writeAdminAuditLog: (value: unknown) => audit(value) }));
vi.mock("@/lib/admin/newsletterAdmin", () => ({ NEWSLETTER_PATH: "/admin/newsletter" }));
vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => {
    state.sessionCreates++;
    return { rpc };
  },
}));

import { deleteNewsletterSubscriber, unsubscribeNewsletterSubscriber } from "@/app/admin/(protected)/newsletter/actions";

beforeEach(() => {
  vi.stubEnv("NEWSLETTER_ADMIN_MUTATIONS_ENABLED", "false");
  rpc.mockReset().mockResolvedValue({ data: "unsubscribed", error: null });
  audit.mockReset().mockResolvedValue(undefined);
  revalidate.mockReset();
  state.sessionCreates = 0;
  state.admin = { ok: true, status: 200, userId: ADMIN_ID, email: "admin@example.test" };
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("E4 — bloqueio de mutações", () => {
  it("flag ausente ou false bloqueia AMBAS as ações antes de autenticar e abrir sessão", async () => {
    for (const env of ["false", "", "TRUE"]) {
      vi.stubEnv("NEWSLETTER_ADMIN_MUTATIONS_ENABLED", env);
      expect(await unsubscribeNewsletterSubscriber({ id: ID, reason: "titular_request" }))
        .toEqual({ ok: false, code: "not_enabled" });
      expect(await deleteNewsletterSubscriber({ id: ID, confirmation: "EXCLUIR" }))
        .toEqual({ ok: false, code: "not_enabled" });
    }
    expect(state.sessionCreates).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it.each([401, 403])("flag ativa mas acesso %s: nega e audita sem RPC", async (status) => {
    vi.stubEnv("NEWSLETTER_ADMIN_MUTATIONS_ENABLED", "true");
    state.admin = { ok: false, status, userId: null, email: null };
    expect(await unsubscribeNewsletterSubscriber({ id: ID, reason: "titular_request" }))
      .toEqual({ ok: false, code: "forbidden" });
    expect(await deleteNewsletterSubscriber({ id: ID, confirmation: "EXCLUIR" }))
      .toEqual({ ok: false, code: "forbidden" });
    expect(audit).toHaveBeenCalledTimes(2);
    expect(audit.mock.calls[0][0]).toMatchObject({
      event: "admin_newsletter_action_denied",
      resourceType: "newsletter_subscriber",
      status,
    });
    expect(rpc).not.toHaveBeenCalled();
    expect(state.sessionCreates).toBe(0);
  });

  it("entradas inválidas e motivo fora da whitelist não invocam o banco", async () => {
    vi.stubEnv("NEWSLETTER_ADMIN_MUTATIONS_ENABLED", "true");
    expect(await unsubscribeNewsletterSubscriber({ id: ID, reason: "invalid" }))
      .toEqual({ ok: false, code: "invalid" });
    expect(await unsubscribeNewsletterSubscriber({ id: "x", reason: "other" }))
      .toEqual({ ok: false, code: "invalid" });
    expect(await deleteNewsletterSubscriber({ id: ID, confirmation: "excluir" }))
      .toEqual({ ok: false, code: "invalid" });
    expect(rpc).not.toHaveBeenCalled();
    expect(state.sessionCreates).toBe(0);
  });

  it("descadastro envia somente UUID e motivo validado; auditoria fica na RPC transacional", async () => {
    vi.stubEnv("NEWSLETTER_ADMIN_MUTATIONS_ENABLED", "true");
    const result = await unsubscribeNewsletterSubscriber({ id: ID, reason: "bounce_or_complaint" });
    expect(result).toEqual({ ok: true, code: "unsubscribed" });
    expect(rpc).toHaveBeenCalledWith("newsletter_admin_unsubscribe", {
      p_subscriber_id: ID, p_reason: "bounce_or_complaint",
    });
    expect(revalidate).toHaveBeenCalledWith("/admin/newsletter");
    expect(revalidate).toHaveBeenCalledWith("/admin/newsletter/" + ID);
    expect(audit).not.toHaveBeenCalled(); // sucesso auditado dentro do PostgreSQL
  });

  it("exclusão usa apenas a RPC e exige confirmação literal", async () => {
    vi.stubEnv("NEWSLETTER_ADMIN_MUTATIONS_ENABLED", "true");
    rpc.mockResolvedValueOnce({ data: "deleted", error: null });
    expect(await deleteNewsletterSubscriber({ id: ID, confirmation: "EXCLUIR" }))
      .toEqual({ ok: true, code: "deleted" });
    expect(rpc).toHaveBeenCalledWith("newsletter_admin_delete_subscriber", {
      p_subscriber_id: ID, p_confirmation: "EXCLUIR",
    });
    expect(revalidate).toHaveBeenCalledTimes(2);
    expect(audit).not.toHaveBeenCalled();
  });

  it("erro da RPC, exceção ou resultado inesperado nunca reportam sucesso", async () => {
    vi.stubEnv("NEWSLETTER_ADMIN_MUTATIONS_ENABLED", "true");
    for (const response of [
      { data: null, error: { code: "42501" } },
      { data: "unexpected", error: null },
    ]) {
      rpc.mockResolvedValueOnce(response);
      expect(await unsubscribeNewsletterSubscriber({ id: ID, reason: "other" }))
        .toEqual({ ok: false, code: "failed" });
    }
    rpc.mockRejectedValueOnce(new Error("network"));
    expect(await deleteNewsletterSubscriber({ id: ID, confirmation: "EXCLUIR" }))
      .toEqual({ ok: false, code: "failed" });
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("códigos controlados não revalidam o detalhe ausente", async () => {
    vi.stubEnv("NEWSLETTER_ADMIN_MUTATIONS_ENABLED", "true");
    rpc.mockResolvedValueOnce({ data: "not_found", error: null });
    rpc.mockResolvedValueOnce({ data: "confirmation_invalid", error: null });
    expect(await unsubscribeNewsletterSubscriber({ id: ID, reason: "other" }))
      .toEqual({ ok: false, code: "not_found" });
    expect(await deleteNewsletterSubscriber({ id: ID, confirmation: "EXCLUIR" }))
      .toEqual({ ok: false, code: "confirmation_invalid" });
    expect(revalidate).not.toHaveBeenCalled();
  });
});
