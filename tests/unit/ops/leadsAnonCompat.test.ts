import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Compatibilidade da remoção do acesso anon a `leads` (RF-SEG-01, E0b.2) — offline, com mocks.
// Prova que o formulário de contato grava pelo servidor (service_role) e que nenhum outro
// código de src/ escreve em `leads`. Nenhum formulário real é enviado e nenhum banco é acessado.
const state = vi.hoisted(() => ({
  serviceInserts: [] as Array<Record<string, unknown>>,
  sessionCalls: 0,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ or: () => ({ gte: () => Promise.resolve({ count: 0 }) }) }),
      insert: (row: Record<string, unknown>) => {
        state.serviceInserts.push(row);
        return Promise.resolve({ error: null });
      },
    }),
  }),
  // Se a rota passasse a usar o cliente de sessão/anon para gravar, este mock acusaria.
  createSessionClient: () => {
    state.sessionCalls += 1;
    throw new Error("a rota de contato não pode usar o cliente de sessão");
  },
}));

vi.mock("resend", () => ({ Resend: class {} }));

import { POST } from "@/app/api/contact/route";

const body = {
  name: "Maria Teste",
  company: "Empresa Teste",
  email: "maria@example.test",
  whatsapp: "11999990000",
  segment: "Indústria",
  size: "11-50",
  solution: "automacao",
  message: "Preciso integrar meus sistemas internos.",
};

beforeEach(() => {
  state.serviceInserts = [];
  state.sessionCalls = 0;
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  vi.stubEnv("RESEND_API_KEY", "xxxx");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/contact continua gravando leads sem a chave anônima", () => {
  it("grava pelo cliente de serviço e nunca pelo de sessão", async () => {
    const res = await POST(
      new NextRequest("https://www.rc2solucoes.com.br/api/contact", {
        method: "POST",
        headers: { origin: "https://www.rc2solucoes.com.br", "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    expect(res.status).toBe(200);
    expect(state.serviceInserts).toHaveLength(1);
    expect(state.serviceInserts[0]).toMatchObject({ email: "maria@example.test", source: "website" });
    expect(state.sessionCalls).toBe(0);
  });
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("nenhum outro código de src/ escreve em leads (EV-07)", () => {
  const root = resolve(process.cwd(), "src");
  const files = walk(root).filter((f) => /\.(ts|tsx)$/.test(f));

  it("só a rota de contato escreve em leads, e com o cliente de serviço", () => {
    const writers = files.filter((f) => {
      const text = readFileSync(f, "utf8");
      return /from\(\s*["']leads["']\s*\)[\s\S]{0,80}\.(insert|update|delete|upsert)\(/.test(text);
    });
    expect(writers.map((f) => relative(root, f).replaceAll("\\", "/"))).toEqual(["app/api/contact/route.ts"]);
    const route = readFileSync(resolve(root, "app/api/contact/route.ts"), "utf8");
    expect(route).toMatch(/createServiceClient\(\)/);
    expect(route).not.toMatch(/createSessionClient|createBrowserClient|NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("os leitores do admin (dashboard e listagem) usam a sessão autenticada, não a chave anônima direta", () => {
    for (const rel of ["app/admin/(protected)/dashboard/page.tsx", "app/admin/(protected)/leads/page.tsx"]) {
      const text = readFileSync(resolve(root, rel), "utf8");
      expect(text, rel).not.toMatch(/createBrowserClient|NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    }
  });
});
