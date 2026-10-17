import { afterEach, describe, expect, it, vi } from "vitest";
import { TURNSTILE_TIMEOUT_MS, verifyTurnstile } from "@/lib/security/turnstile";

const REAL = "real-secret-value";
const ok = () => Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));

type Env = { VERCEL_ENV?: string; NODE_ENV?: string; TURNSTILE_SECRET_KEY?: string };
const env = (e: Env) => e;

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("verifyTurnstile — ambiente × segredo (T-SEG-U01)", () => {
  it.each([
    ["production", undefined],
    ["production", "xxxx"],
    ["production", "  "],
    ["preview", undefined],
    ["preview", "xxxx"],
  ])("nega em VERCEL_ENV=%s com segredo %j e registra a má configuração", async (vercelEnv, secret) => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn();
    const r = await verifyTurnstile("tok", {
      env: env({ VERCEL_ENV: vercelEnv, NODE_ENV: "production", TURNSTILE_SECRET_KEY: secret }),
      fetchImpl,
    });
    expect(r).toEqual({ ok: false, reason: "misconfigured" });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[turnstile] turnstile_misconfigured");
  });

  it("nega em build de produção fora da Vercel sem segredo (NODE_ENV=production)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await verifyTurnstile("tok", { env: env({ NODE_ENV: "production" }) });
    expect(r).toEqual({ ok: false, reason: "misconfigured" });
  });

  it.each([
    [undefined, "development"],
    [undefined, "test"],
    ["development", "development"],
  ])("permite bypass local sem segredo (VERCEL_ENV=%s, NODE_ENV=%s)", async (vercelEnv, nodeEnv) => {
    const fetchImpl = vi.fn();
    const r = await verifyTurnstile(undefined, {
      env: env({ VERCEL_ENV: vercelEnv, NODE_ENV: nodeEnv }),
      fetchImpl,
    });
    expect(r).toEqual({ ok: true, bypassed: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    ["staging", "development"],
    ["development", "production"],
    ["preview", "development"],
  ])("não trata classificação ambígua como local (VERCEL_ENV=%s, NODE_ENV=%s)", async (vercelEnv, nodeEnv) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await verifyTurnstile("tok", { env: env({ VERCEL_ENV: vercelEnv, NODE_ENV: nodeEnv }) });
    expect(r).toEqual({ ok: false, reason: "misconfigured" });
  });

  it("não faz bypass local quando há segredo real: exige token", async () => {
    const r = await verifyTurnstile("", { env: env({ NODE_ENV: "development", TURNSTILE_SECRET_KEY: REAL }) });
    expect(r).toEqual({ ok: false, reason: "missing_token" });
  });
});

describe("verifyTurnstile — token e resposta do Cloudflare", () => {
  const prod = env({ VERCEL_ENV: "production", NODE_ENV: "production", TURNSTILE_SECRET_KEY: REAL });

  it("permite quando o Cloudflare confirma success=true", async () => {
    expect(await verifyTurnstile("tok", { env: prod, fetchImpl: ok })).toEqual({ ok: true, bypassed: false });
  });

  it.each([null, undefined, "", "   "])("nega token ausente (%j) sem chamar a rede", async (token) => {
    const fetchImpl = vi.fn();
    expect(await verifyTurnstile(token, { env: prod, fetchImpl })).toEqual({ ok: false, reason: "missing_token" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([[{ success: false }], [{}], [{ success: "true" }], [{ success: 1 }]])(
    "nega resposta %j",
    async (body) => {
      const fetchImpl = () => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
      expect(await verifyTurnstile("tok", { env: prod, fetchImpl })).toEqual({ ok: false, reason: "rejected" });
    },
  );

  it.each([400, 403, 500, 503])("nega HTTP %i", async (status) => {
    const fetchImpl = () => Promise.resolve(new Response("{}", { status }));
    expect(await verifyTurnstile("tok", { env: prod, fetchImpl })).toEqual({ ok: false, reason: "unavailable" });
  });

  it("nega erro de rede", async () => {
    const fetchImpl = () => Promise.reject(new TypeError("fetch failed"));
    expect(await verifyTurnstile("tok", { env: prod, fetchImpl })).toEqual({ ok: false, reason: "unavailable" });
  });

  it("nega corpo malformado", async () => {
    const fetchImpl = () => Promise.resolve(new Response("não é json", { status: 200 }));
    expect(await verifyTurnstile("tok", { env: prod, fetchImpl })).toEqual({ ok: false, reason: "unavailable" });
  });

  it("nega por timeout: o sinal enviado ao fetch aborta em 5 s", async () => {
    expect(TURNSTILE_TIMEOUT_MS).toBe(5000);
    let signal: AbortSignal | undefined;
    const fetchImpl = (_url: unknown, init?: RequestInit) => {
      signal = init?.signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => {
        signal!.addEventListener("abort", () => reject(signal!.reason));
      });
    };
    vi.useFakeTimers();
    const pending = verifyTurnstile("tok", { env: prod, fetchImpl });
    await vi.advanceTimersByTimeAsync(TURNSTILE_TIMEOUT_MS + 1);
    expect(await pending).toEqual({ ok: false, reason: "unavailable" });
    expect(signal?.aborted).toBe(true);
  });

  it("envia remoteip só quando há IP e nunca registra token nem segredo no log", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const bodies: string[] = [];
    const fetchImpl = (_u: unknown, init?: RequestInit) => {
      bodies.push(String(init?.body));
      return ok();
    };
    await verifyTurnstile("tok-1", { env: prod, fetchImpl, ip: "203.0.113.9" });
    await verifyTurnstile("tok-2", { env: prod, fetchImpl, ip: null });
    expect(JSON.parse(bodies[0]).remoteip).toBe("203.0.113.9");
    expect("remoteip" in JSON.parse(bodies[1])).toBe(false);
    await verifyTurnstile("tok", { env: env({ VERCEL_ENV: "production", NODE_ENV: "production" }) });
    expect(JSON.stringify(spy.mock.calls)).not.toContain(REAL);
  });
});
