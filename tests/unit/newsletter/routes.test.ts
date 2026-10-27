import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Rotas públicas da newsletter (T-NL-U03, U09, U11, U13, U15, U17). O banco e o Turnstile são
// simulados; nenhuma rede é acessada. As regras transacionais são das RPCs (migration 018).

type Rpc = { fn: string; args: Record<string, unknown> };
const state = vi.hoisted(() => ({
  calls: [] as Rpc[],
  rateAllowed: true,
  rateError: false,
  results: {} as Record<string, unknown>,
  rpcError: {} as Record<string, boolean>,
  turnstileOk: true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      state.calls.push({ fn, args });
      if (fn === "rate_limit_hit") {
        if (state.rateError) return { data: null, error: { message: "boom" } };
        return { data: [{ allowed: state.rateAllowed, count: 1, reset_at: "2026-10-27T14:00:00Z" }], error: null };
      }
      if (state.rpcError[fn]) return { data: null, error: { message: "boom" } };
      return { data: state.results[fn] ?? null, error: null };
    },
  }),
}));
vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstile: async () => (state.turnstileOk ? { ok: true, bypassed: false } : { ok: false, reason: "rejected" }),
}));

import { POST as subscribe } from "@/app/api/newsletter/subscribe/route";
import { POST as unsubscribeRequest } from "@/app/api/newsletter/unsubscribe-request/route";
import { GET as oneClickGet, POST as oneClick } from "@/app/api/newsletter/unsubscribe/route";
import { CONSENT_TEXT_VERSION, POLICY_VERSION } from "@/lib/newsletter/consent";
import { generateToken, hashToken } from "@/lib/newsletter/tokens";

const ORIGIN = "https://www.rc2solucoes.com.br";
const IP = "203.0.113.9";
const EMAIL = "Pessoa.Teste@Exemplo.com";

function json(body: unknown, headers: Record<string, string> = {}, url = "https://www.rc2solucoes.com.br/api/newsletter/subscribe") {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, "x-real-ip": IP, ...headers },
    body: JSON.stringify(body),
  });
}
const goodSubscribe = (over: Record<string, unknown> = {}) => ({
  email: EMAIL,
  consent: true,
  consentTextVersion: CONSENT_TEXT_VERSION,
  sourcePath: "/?utm=x",
  turnstileToken: "tok",
  ...over,
});
const newsletterCalls = () => state.calls.filter((c) => c.fn.startsWith("newsletter_"));
const rateCalls = () => state.calls.filter((c) => c.fn === "rate_limit_hit");

let errorSpy: ReturnType<typeof vi.spyOn>;
let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  state.calls = [];
  state.rateAllowed = true;
  state.rateError = false;
  state.results = {};
  state.rpcError = {};
  state.turnstileOk = true;
  vi.stubEnv("RATE_LIMIT_PEPPER", "p".repeat(40));
  vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "true");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "real");
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function loggedText() {
  return JSON.stringify([...errorSpy.mock.calls, ...logSpy.mock.calls]);
}

describe("POST /api/newsletter/subscribe", () => {
  it("desligada por padrão: 503 e nenhuma chamada ao banco", async () => {
    vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "");
    const res = await subscribe(json(goodSubscribe()));
    expect(res.status).toBe(503);
    expect(state.calls).toHaveLength(0);
    vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "false");
    expect((await subscribe(json(goodSubscribe()))).status).toBe(503);
  });

  it("origem inválida → 403; JSON inválido ou grande → 400", async () => {
    expect((await subscribe(json(goodSubscribe(), { origin: "https://evil.example" }))).status).toBe(403);
    const bad = new NextRequest("https://www.rc2solucoes.com.br/api/newsletter/subscribe", { method: "POST", headers: { origin: ORIGIN }, body: "{nao-json" });
    expect((await subscribe(bad)).status).toBe(400);
    expect((await subscribe(json(goodSubscribe({ email: "a@b.com", website: "x".repeat(10) }, ), { "content-length": "999999" }))).status).toBe(400);
    expect(state.calls).toHaveLength(0);
  });

  it("consentimento obrigatório e versão vigente do servidor (T-NL-U09)", async () => {
    expect((await subscribe(json(goodSubscribe({ consent: false })))).status).toBe(400);
    expect((await subscribe(json(goodSubscribe({ consent: undefined })))).status).toBe(400);
    expect((await subscribe(json(goodSubscribe({ consentTextVersion: "draft-0" })))).status).toBe(400);
    expect(newsletterCalls()).toHaveLength(0);
  });

  it("honeypot: resposta idêntica à de sucesso e nada é gravado", async () => {
    const ok = await subscribe(json(goodSubscribe()));
    state.calls = [];
    const bot = await subscribe(json(goodSubscribe({ website: "http://spam" })));
    expect(bot.status).toBe(202);
    expect(await bot.json()).toEqual({ status: "received" });
    expect(state.calls).toHaveLength(0);
    expect(bot.headers.get("cache-control")).toBe(ok.headers.get("cache-control"));
    expect(bot.headers.get("content-type")).toBe(ok.headers.get("content-type"));
  });

  it("Turnstile reprovado → 400 sem gravar nem contar", async () => {
    state.turnstileOk = false;
    const res = await subscribe(json(goodSubscribe()));
    expect(res.status).toBe(400);
    expect(state.calls).toHaveLength(0);
  });

  it("rate limit estourado → 429 genérico, RPC da newsletter não é chamada, contadores incrementados (T-NL-U13)", async () => {
    state.rateAllowed = false;
    const res = await subscribe(json(goodSubscribe()));
    expect(res.status).toBe(429);
    expect(newsletterCalls()).toHaveLength(0);
    expect(rateCalls().map((c) => String(c.args.p_key).split(":").slice(0, 3).join(":"))).toEqual(["nl:sub:email", "nl:sub:ip"]);
  });

  it("falha do rate limit FECHA (429), nunca grava", async () => {
    state.rateError = true;
    expect((await subscribe(json(goodSubscribe()))).status).toBe(429);
    expect(newsletterCalls()).toHaveLength(0);
    vi.stubEnv("RATE_LIMIT_PEPPER", "");
    state.rateError = false;
    expect((await subscribe(json(goodSubscribe()))).status).toBe(429);
    expect(newsletterCalls()).toHaveLength(0);
  });

  it("sucesso: 202 uniforme; RPC recebe versões do servidor, e-mail normalizado, caminho sem query e IP só como hash", async () => {
    const res = await subscribe(json(goodSubscribe()));
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ status: "received" });
    const [call] = newsletterCalls();
    expect(call.fn).toBe("newsletter_request_subscription");
    expect(call.args).toMatchObject({
      p_email: EMAIL,
      p_email_normalized: "pessoa.teste@exemplo.com",
      p_consent_text_version: CONSENT_TEXT_VERSION,
      p_policy_version: POLICY_VERSION,
      p_source_path: "/",
    });
    expect(String(call.args.p_ip_hash)).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(call.args)).not.toContain(IP);
  });

  it("resposta de sucesso é a mesma para qualquer resultado da RPC (estado do endereço não vaza) (T-NL-U03)", async () => {
    const shapes = new Set<string>();
    for (const outcome of [null, "pending", "active", "unsubscribed"]) {
      state.results = { newsletter_request_subscription: outcome };
      const res = await subscribe(json(goodSubscribe()));
      shapes.add(JSON.stringify([res.status, await res.json(), res.headers.get("content-type"), res.headers.get("cache-control")]));
    }
    expect(shapes.size).toBe(1);
  });

  it("erro do banco → 500 genérico sem detalhes; nada sensível em log (T-NL-U11)", async () => {
    state.rpcError = { newsletter_request_subscription: true };
    const res = await subscribe(json(goodSubscribe()));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/boom|exemplo|203\.0/i);
    const text = loggedText();
    expect(text).not.toContain("exemplo");
    expect(text).not.toContain(IP);
    expect(text).not.toContain("boom");
  });
});

describe("POST /api/newsletter/unsubscribe-request", () => {
  it("funciona com a inscrição DESLIGADA (endpoint de manutenção) e responde 202 uniforme", async () => {
    vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "false");
    const res = await unsubscribeRequest(json({ email: EMAIL, turnstileToken: "t" }, {}, "https://www.rc2solucoes.com.br/api/newsletter/unsubscribe-request"));
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ status: "received" });
    const [call] = newsletterCalls();
    expect(call).toEqual({ fn: "newsletter_request_unsubscribe_link", args: { p_email_normalized: "pessoa.teste@exemplo.com" } });
    expect(rateCalls().map((c) => String(c.args.p_key).split(":").slice(0, 3).join(":"))).toEqual(["nl:unreq:email", "nl:unreq:ip"]);
  });

  it("origem, honeypot, Turnstile, rate limit e banco seguem a mesma cadeia", async () => {
    const url = "https://www.rc2solucoes.com.br/api/newsletter/unsubscribe-request";
    expect((await unsubscribeRequest(json({ email: EMAIL }, { origin: "https://evil.example" }, url))).status).toBe(403);
    expect((await unsubscribeRequest(json({ email: EMAIL, website: "spam" }, {}, url))).status).toBe(202);
    expect(state.calls).toHaveLength(0);
    state.turnstileOk = false;
    expect((await unsubscribeRequest(json({ email: EMAIL }, {}, url))).status).toBe(400);
    state.turnstileOk = true;
    state.rateAllowed = false;
    expect((await unsubscribeRequest(json({ email: EMAIL }, {}, url))).status).toBe(429);
    expect(newsletterCalls()).toHaveLength(0);
    state.rateAllowed = true;
    state.rpcError = { newsletter_request_unsubscribe_link: true };
    expect((await unsubscribeRequest(json({ email: EMAIL }, {}, url))).status).toBe(500);
  });
});

describe("POST /api/newsletter/unsubscribe (RFC 8058, T-NL-U15 e U17)", () => {
  const token = generateToken();
  const form = "List-Unsubscribe=One-Click";
  const post = (body: string | null, t: string | null = token, headers: Record<string, string> = {}) => {
    const url = `https://www.rc2solucoes.com.br/api/newsletter/unsubscribe${t === null ? "" : `?t=${encodeURIComponent(t)}`}`;
    return new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", "x-real-ip": IP, ...headers },
      body: body ?? undefined,
    });
  };

  it("corpo ausente ou diferente de List-Unsubscribe=One-Click → 400 e conta em nl:tok:ip", async () => {
    expect((await oneClick(post(null))).status).toBe(400);
    expect((await oneClick(post("List-Unsubscribe=Outro"))).status).toBe(400);
    expect(newsletterCalls()).toHaveLength(0);
    expect(rateCalls()).toHaveLength(2);
    expect(String(rateCalls()[0].args.p_key)).toMatch(/^nl:tok:ip:/);
  });

  it("token malformado → 400, conta, e não toca nas RPCs da newsletter", async () => {
    for (const bad of ["", "nlt_curto", "x".repeat(47), null]) expect((await oneClick(post(form, bad))).status).toBe(400);
    expect(newsletterCalls()).toHaveLength(0);
  });

  it("token encontrado → 200 e NUNCA conta nem é limitado por IP, mesmo com o bucket estourado", async () => {
    state.rateAllowed = false;
    for (const result of ["unsubscribed", "already_unsubscribed"]) {
      state.results = { newsletter_unsubscribe: result };
      for (let i = 0; i < 40; i++) expect((await oneClick(post(form))).status).toBe(200);
    }
    expect(rateCalls()).toHaveLength(0);
    const call = newsletterCalls()[0];
    expect(call.args).toEqual({ p_token_hash: hashToken(token), p_channel: "one_click" });
  });

  it("token bem formado e NÃO encontrado → 200 neutro idêntico ao sucesso, mas conta; acima do limite → 429", async () => {
    state.results = { newsletter_unsubscribe: "not_found" };
    const notFound = await oneClick(post(form));
    state.results = { newsletter_unsubscribe: "unsubscribed" };
    const found = await oneClick(post(form));
    expect([notFound.status, await notFound.text(), notFound.headers.get("cache-control")]).toEqual([found.status, await found.text(), found.headers.get("cache-control")]);
    expect(rateCalls()).toHaveLength(1);

    state.results = { newsletter_unsubscribe: "not_found" };
    state.rateAllowed = false;
    expect((await oneClick(post(form))).status).toBe(429);
    expect((await oneClick(post(form, "nlt_curto"))).status).toBe(429);
  });

  it("falha do banco → 503, nunca 429", async () => {
    state.rpcError = { newsletter_unsubscribe: true };
    expect((await oneClick(post(form))).status).toBe(503);
    state.rpcError = {};
    state.results = { newsletter_unsubscribe: "not_found" };
    state.rateError = true;
    expect((await oneClick(post(form))).status).toBe(503);
  });

  it("200 sem redirecionamento, sem Set-Cookie, sem cache e sem token em log; endpoint independe da flag", async () => {
    vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "false");
    state.results = { newsletter_unsubscribe: "unsubscribed" };
    const res = await oneClick(post(form));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("cache-control")).toBe("no-store");
    state.rpcError = { newsletter_unsubscribe: true };
    await oneClick(post(form));
    expect(loggedText()).not.toContain(token);
    expect(loggedText()).not.toContain(hashToken(token));
  });

  it("GET nunca altera estado: 303 para a página interativa, sem chamar o banco", async () => {
    const res = await oneClickGet(new NextRequest(`https://www.rc2solucoes.com.br/api/newsletter/unsubscribe?t=${token}`));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`https://www.rc2solucoes.com.br/newsletter/descadastro#t=${token}`);
    const bad = await oneClickGet(new NextRequest("https://www.rc2solucoes.com.br/api/newsletter/unsubscribe?t=lixo"));
    expect(bad.headers.get("location")).toBe("https://www.rc2solucoes.com.br/newsletter/descadastro");
    expect(state.calls).toHaveLength(0);
  });
});
