import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Turnstile fail-closed nas rotas públicas da newsletter, com o `verifyTurnstile` REAL
// (routes.test.ts o simula). Só a rede (fetch) e o banco são dublês. Em Preview e Production
// a falha do Turnstile nunca chega ao banco nem ao rate limit; o rate limit E0c segue como
// proteção complementar depois do Turnstile.

const rpcCalls = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    rpc: async (fn: string) => {
      rpcCalls.push(fn);
      if (fn === "rate_limit_hit") return { data: [{ allowed: true, count: 1, reset_at: "2026-10-27T14:00:00Z" }], error: null };
      return { data: null, error: null };
    },
  }),
}));

import { POST as subscribe } from "@/app/api/newsletter/subscribe/route";
import { POST as unsubscribeRequest } from "@/app/api/newsletter/unsubscribe-request/route";
import { CONSENT_TEXT_VERSION } from "@/lib/newsletter/consent";

const ORIGIN = "https://www.rc2solucoes.com.br";

function req(path: string, body: unknown) {
  return new NextRequest(`${ORIGIN}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, "x-real-ip": "203.0.113.9" },
    body: JSON.stringify(body),
  });
}
const subscribeBody = (over: Record<string, unknown> = {}) => ({
  email: "pessoa@exemplo.com",
  consent: true,
  consentTextVersion: CONSENT_TEXT_VERSION,
  turnstileToken: "tok",
  ...over,
});

const routes = [
  { name: "inscrição", path: "/api/newsletter/subscribe", post: subscribe, body: subscribeBody },
  {
    name: "pedido de novo link",
    path: "/api/newsletter/unsubscribe-request",
    post: unsubscribeRequest,
    body: (over: Record<string, unknown> = {}) => ({ email: "pessoa@exemplo.com", turnstileToken: "tok", ...over }),
  },
];

beforeEach(() => {
  rpcCalls.length = 0;
  vi.stubEnv("RATE_LIMIT_PEPPER", "p".repeat(40));
  vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "true");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.each(routes)("Turnstile fail-closed: $name", ({ path, post, body }) => {
  it.each(["production", "preview"])("segredo ausente em VERCEL_ENV=%s → 400, sem banco e sem rate limit", async (vercelEnv) => {
    vi.stubEnv("VERCEL_ENV", vercelEnv);
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await post(req(path, body()));
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(rpcCalls).toHaveLength(0);
  });

  it("segredo placeholder 'xxxx' em produção → 400", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "xxxx");
    expect((await post(req(path, body()))).status).toBe(400);
    expect(rpcCalls).toHaveLength(0);
  });

  it("token ausente com segredo válido → 400 sem consultar o Cloudflare", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect((await post(req(path, body({ turnstileToken: "" })))).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(rpcCalls).toHaveLength(0);
  });

  it.each([
    ["Cloudflare rejeita", () => new Response(JSON.stringify({ success: false }), { status: 200 })],
    ["Cloudflare responde HTTP 500", () => new Response("", { status: 500 })],
    ["resposta malformada", () => new Response("<html>", { status: 200 })],
  ])("%s → 400 sem banco", async (_label, make) => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real");
    vi.stubGlobal("fetch", vi.fn(async () => make()));
    expect((await post(req(path, body()))).status).toBe(400);
    expect(rpcCalls).toHaveLength(0);
  });

  it("erro de rede ou timeout → 400 sem banco", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect((await post(req(path, body()))).status).toBe(400);
    expect(rpcCalls).toHaveLength(0);
  });

  it("Turnstile aprovado → segue para o rate limit (proteção complementar) e a RPC", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })));
    const res = await post(req(path, body()));
    expect(res.status).toBe(202);
    expect(rpcCalls[0]).toBe("rate_limit_hit");
    expect(rpcCalls.length).toBeGreaterThan(1);
  });
});
