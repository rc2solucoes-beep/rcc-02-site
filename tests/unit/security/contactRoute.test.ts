import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Regressão da rota de contato com mocks: nenhum formulário real, e-mail ou rede é usado.
const state = vi.hoisted(() => ({
  inserts: [] as Array<Record<string, unknown>>,
  rateCount: 0,
  rateFilters: [] as string[],
  insertError: null as unknown,
  rateThrows: false,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        or: (filter: string) => {
          state.rateFilters.push(filter);
          return {
            gte: () =>
              state.rateThrows ? Promise.reject(new Error("db")) : Promise.resolve({ count: state.rateCount }),
          };
        },
      }),
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
  state.rateCount = 0;
  state.rateFilters = [];
  state.insertError = null;
  state.rateThrows = false;
  vi.stubEnv("RESEND_API_KEY", "xxxx");
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
    expect(state.rateFilters[0]).toBe("email.eq.maria@example.test");
  });

  it("cabeçalho de IP forjado/malformado é descartado", async () => {
    await POST(request(validBody, { "x-real-ip": "1.2.3.4; DROP TABLE leads" }));
    expect(state.inserts[0].ip_hash).toBeNull();
  });

  it("com IP válido grava o hash e filtra por e-mail e IP", async () => {
    await POST(request(validBody, { "x-real-ip": "203.0.113.5" }));
    expect(typeof state.inserts[0].ip_hash).toBe("string");
    expect(state.rateFilters[0]).toMatch(/^email\.eq\.maria@example\.test,ip_hash\.eq\.[0-9a-f]{16}$/);
  });

  it("não confia em cf-connecting-ip por padrão", async () => {
    await POST(request(validBody, { "cf-connecting-ip": "192.0.2.50" }));
    expect(state.inserts[0].ip_hash).toBeNull();
  });

  it("honeypot preenchido não grava (o schema já o rejeita com 400)", async () => {
    const res = await POST(request({ ...validBody, website: "http://spam" }));
    expect(res.status).toBe(400);
    expect(state.inserts).toHaveLength(0);
  });

  it("origem inválida continua 403", async () => {
    const res = await POST(request(validBody, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("campos inválidos continuam 400", async () => {
    const res = await POST(request({ ...validBody, email: "x" }));
    expect(res.status).toBe(400);
  });

  it("limite excedido continua 429 e erro de banco no limite fecha em 429", async () => {
    state.rateCount = 3;
    expect((await POST(request(validBody))).status).toBe(429);
    state.rateCount = 0;
    state.rateThrows = true;
    expect((await POST(request(validBody))).status).toBe(429);
    expect(state.inserts).toHaveLength(0);
  });

  it("falha ao gravar continua 500", async () => {
    state.insertError = new Error("db");
    expect((await POST(request(validBody))).status).toBe(500);
  });
});
