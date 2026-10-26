import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Regressão da rota de contato com mocks: nenhum formulário real, e-mail ou rede é usado.
// O banco é simulado: `rpc` faz o papel de rate_limit_hit (contador por chave) e `from("leads")`
// só aceita insert. Qualquer tentativa de consultar leads para limitar quebraria o teste.
const state = vi.hoisted(() => ({
  inserts: [] as Array<Record<string, unknown>>,
  counters: new Map<string, number>(),
  rpcCalls: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  rpcError: null as unknown,
  rpcThrows: false,
  insertError: null as unknown,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      state.rpcCalls.push({ fn, args });
      if (state.rpcThrows) throw new Error("db");
      if (state.rpcError) return { data: null, error: state.rpcError };
      const key = String(args.p_key);
      const count = (state.counters.get(key) ?? 0) + 1;
      state.counters.set(key, count);
      return { data: [{ allowed: count <= Number(args.p_limit), count, reset_at: "2026-10-27T00:00:00.000Z" }], error: null };
    },
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        state.inserts.push(row);
        return Promise.resolve({ error: state.insertError });
      },
    }),
  }),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn().mockResolvedValue({}) };
  },
}));

import { POST } from "@/app/api/contact/route";

const validBody = {
  name: "Maria Teste",
  company: "Empresa Teste",
  email: "maria@example.test",
  whatsapp: "11999990000",
  segment: "Indústria",
  size: "11-50",
  solution: "automacao",
  message: "Preciso integrar meus sistemas internos.",
  turnstileToken: "tok",
};

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://www.rc2solucoes.com.br/api/contact", {
    method: "POST",
    headers: { origin: "https://www.rc2solucoes.com.br", "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  state.inserts = [];
  state.counters = new Map();
  state.rpcCalls = [];
  state.rpcError = null;
  state.rpcThrows = false;
  state.insertError = null;
  vi.stubEnv("RESEND_API_KEY", "xxxx");
  vi.stubEnv("RATE_LIMIT_PEPPER", "test-pepper-".padEnd(40, "x"));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/contact — Turnstile (E0b.4)", () => {
  it.each(["production", "preview"])("nega em %s sem segredo válido e não grava o lead", async (vercelEnv) => {
    vi.stubEnv("VERCEL_ENV", vercelEnv);
    vi.stubEnv("VERCEL_URL", "preview.example.vercel.app");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "xxxx");
    const origin = vercelEnv === "preview" ? "https://preview.example.vercel.app" : "https://www.rc2solucoes.com.br";
    const res = await POST(request(validBody, { origin }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/verificação de segurança/);
    expect(state.inserts).toHaveLength(0);
  });

  it("permite o bypass local e grava o lead", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const res = await POST(request(validBody, { "x-real-ip": "203.0.113.5" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(state.inserts).toHaveLength(1);
    expect(state.inserts[0]).toMatchObject({ email: "maria@example.test", source: "website" });
  });

  it("nega quando o Cloudflare rejeita o token", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real-secret-value");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }))));
    const res = await POST(request(validBody));
    expect(res.status).toBe(400);
    expect(state.inserts).toHaveLength(0);
  });

  it("grava o lead quando o Cloudflare confirma", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real-secret-value");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))));
    const res = await POST(request(validBody, { "x-real-ip": "203.0.113.5" }));
    expect(res.status).toBe(200);
    expect(state.inserts).toHaveLength(1);
  });
});

describe("POST /api/contact — IP e contrato preservado", () => {
  beforeEach(() => vi.stubEnv("TURNSTILE_SECRET_KEY", ""));

  it("sem IP confiável não gera endereço artificial: ip_hash nulo e limite só por e-mail", async () => {
    const res = await POST(request(validBody));
    expect(res.status).toBe(200);
    expect(state.inserts[0].ip_hash).toBeNull();
    expect(state.rpcCalls).toHaveLength(1);
    expect(String(state.rpcCalls[0].args.p_key)).toMatch(/^contact:email:[0-9a-f]{64}$/);
  });

  it("cabeçalho de IP forjado/malformado é descartado", async () => {
    await POST(request(validBody, { "x-real-ip": "1.2.3.4; DROP TABLE leads" }));
    expect(state.inserts[0].ip_hash).toBeNull();
    expect(state.rpcCalls).toHaveLength(1);
  });

  it("com IP válido grava o hash em leads e limita por e-mail e por IP", async () => {
    await POST(request(validBody, { "x-real-ip": "203.0.113.5" }));
    expect(typeof state.inserts[0].ip_hash).toBe("string");
    expect(state.rpcCalls.map((call) => String(call.args.p_key).split(":")[1]).sort()).toEqual(["email", "ip"]);
  });

  it("não confia em cf-connecting-ip por padrão", async () => {
    await POST(request(validBody, { "cf-connecting-ip": "192.0.2.50" }));
    expect(state.inserts[0].ip_hash).toBeNull();
    expect(state.rpcCalls).toHaveLength(1);
  });

  it("honeypot preenchido não grava (o schema já o rejeita com 400)", async () => {
    const res = await POST(request({ ...validBody, website: "http://spam" }));
    expect(res.status).toBe(400);
    expect(state.inserts).toHaveLength(0);
    expect(state.rpcCalls).toHaveLength(0);
  });

  it("origem inválida continua 403", async () => {
    const res = await POST(request(validBody, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(state.rpcCalls).toHaveLength(0);
  });

  it("campos inválidos continuam 400", async () => {
    const res = await POST(request({ ...validBody, email: "x" }));
    expect(res.status).toBe(400);
    expect(state.rpcCalls).toHaveLength(0);
  });

  it("falha ao gravar continua 500", async () => {
    state.insertError = new Error("db");
    expect((await POST(request(validBody))).status).toBe(500);
  });
});

describe("POST /api/contact — rate limit atômico (E0c, T-RL-U01)", () => {
  const tooMany = /Muitas solicitações\. Aguarde alguns minutos e tente novamente\./;
  beforeEach(() => vi.stubEnv("TURNSTILE_SECRET_KEY", ""));

  it("permite 3 por e-mail por hora e responde 429 na 4ª, preservando a mensagem", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) statuses.push((await POST(request(validBody))).status);
    expect(statuses).toEqual([200, 200, 200, 429]);
    const res = await POST(request(validBody));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(tooMany);
    expect(state.inserts).toHaveLength(3);
  });

  it("tentativas rejeitadas também incrementam os contadores", async () => {
    for (let i = 0; i < 5; i += 1) await POST(request(validBody, { "x-real-ip": "203.0.113.5" }));
    expect([...state.counters.values()]).toEqual([5, 5]);
  });

  it("limita por IP mesmo com e-mails diferentes", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      statuses.push((await POST(request({ ...validBody, email: `pessoa${i}@example.test` }, { "x-real-ip": "203.0.113.5" }))).status);
    }
    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  it("as chaves são HMAC: não contêm e-mail nem IP e não dependem do IP_SALT de leads", async () => {
    vi.stubEnv("IP_SALT", "outro-sal");
    await POST(request(validBody, { "x-real-ip": "203.0.113.5" }));
    expect(state.rpcCalls).toHaveLength(2);
    for (const call of state.rpcCalls) {
      expect(call.fn).toBe("rate_limit_hit");
      expect(String(call.args.p_key)).toMatch(/^contact:(email|ip):[0-9a-f]{64}$/);
      expect(JSON.stringify(call.args)).not.toMatch(/maria|203\.0\.113/);
      expect(call.args.p_limit).toBe(3);
      expect(call.args.p_window_seconds).toBe(3600);
    }
  });

  it("a tabela leads não é consultada para limitar (só recebe o insert)", async () => {
    // O mock de `from` não tem select: se a rota ainda consultasse leads, cairia em 429 por erro.
    expect((await POST(request(validBody))).status).toBe(200);
    expect(state.inserts).toHaveLength(1);
  });

  it("FALHA FECHADA: erro do banco devolve 429 e não grava", async () => {
    state.rpcError = { message: "db" };
    const res = await POST(request(validBody));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(tooMany);
    expect(state.inserts).toHaveLength(0);
  });

  it("FALHA FECHADA: exceção do banco devolve 429 e não grava", async () => {
    state.rpcThrows = true;
    expect((await POST(request(validBody))).status).toBe(429);
    expect(state.inserts).toHaveLength(0);
  });

  it.each([undefined, "", "curto"])("FALHA FECHADA: RATE_LIMIT_PEPPER %j devolve 429 sem consultar o banco", async (pepper) => {
    vi.stubEnv("RATE_LIMIT_PEPPER", pepper);
    expect((await POST(request(validBody))).status).toBe(429);
    expect(state.rpcCalls).toHaveLength(0);
    expect(state.inserts).toHaveLength(0);
  });

  it("o log de falha não contém e-mail, IP, chave nem pepper", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    state.rpcError = { message: "erro com maria@example.test e 203.0.113.5" };
    await POST(request(validBody, { "x-real-ip": "203.0.113.5" }));
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).toMatch(/rate-limit/);
    expect(logged).not.toMatch(/maria|203\.0\.113|contact:|test-pepper/);
  });

  it("falha do Turnstile (400) não consome o limite", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real-secret-value");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }))));
    expect((await POST(request(validBody))).status).toBe(400);
    expect(state.rpcCalls).toHaveLength(0);
  });
});
