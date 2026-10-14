import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Ensaio com o @supabase/supabase-js REAL instalado, sem rede: o único ponto de
// saída é um fetch global substituído por um espião. Nenhuma credencial real; as
// chaves abaixo são opacas e fictícias. Nenhuma requisição externa é possível:
// rota desconhecida do espião falha o teste.

const TEST_REF = "abcdefghijklmnopqrst";
const OTHER_REF = "bcdefghijklmnopqrstu"; // outro alvo VÁLIDO
const PROD_REF = "uvwxyzabcdefghijklmn";

vi.mock("../../integration/support/env", () => ({ loadTestEnvFile: () => {} }));

import { createRoleClients } from "../../integration/support/clients";
import { IntegrationGuardError } from "../../integration/support/guard";

type Call = { method: string; host: string; path: string };
const calls: Call[] = [];

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const fakeFetch = vi.fn(async (input: unknown, init?: { method?: string }) => {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.href : (input as { url: string }).url;
  const url = new URL(raw);
  const method = (init?.method ?? (input as { method?: string }).method ?? "GET").toUpperCase();
  calls.push({ method, host: url.host, path: url.pathname });

  const { pathname: path } = url;
  if (method === "GET" && path === "/rest/v1/settings") return json([{ value: url.host.split(".")[0] }]);
  if (method === "GET" && path.startsWith("/rest/v1/")) return json([]);
  if (method === "POST" && path === "/rest/v1/admin_users") return new Response(null, { status: 201 });
  if (method === "DELETE" && path.startsWith("/rest/v1/")) return new Response(null, { status: 204 });
  if (method === "POST" && path === "/auth/v1/admin/users") {
    return json({ id: randomUUID(), aud: "authenticated", email: "sintetico@example.test" });
  }
  if (method === "POST" && path === "/auth/v1/token") {
    const id = randomUUID();
    return json({
      access_token: `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({ sub: id, exp: 4102444800 })}.assinatura-ficticia`,
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "refresh-ficticio",
      user: { id, aud: "authenticated" },
    });
  }
  if (method === "GET" && path === "/auth/v1/admin/users") return json({ users: [], aud: "authenticated" });
  if (method === "DELETE" && path.startsWith("/auth/v1/admin/users/")) return json({});
  throw new Error(`rota inesperada no ensaio: ${method} ${path}`);
});

function stubTarget(ref: string, serviceKey: string): void {
  vi.stubEnv("RC2_TEST_SUPABASE_URL", `https://${ref}.supabase.co`);
  vi.stubEnv("RC2_TEST_PROJECT_REF", ref);
  vi.stubEnv("RC2_TEST_PROJECT_REF_ALLOWLIST", ref);
  vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", PROD_REF);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("RC2_TEST_SUPABASE_ANON_KEY", "anon-key-opaca");
  vi.stubEnv("RC2_TEST_SUPABASE_SERVICE_ROLE_KEY", serviceKey);
}

const adminCalls = () => calls.filter((call) => call.path.startsWith("/auth/v1/admin/"));

beforeEach(() => {
  calls.length = 0;
  fakeFetch.mockClear();
  vi.stubGlobal("fetch", fakeFetch);
  stubTarget(TEST_REF, "service-key-opaca-A");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("supabase-js real + fetch interceptado: revalidação do cliente privilegiado", () => {
  it("consulta encadeada executa normalmente com o alvo válido (uma requisição, só no await)", async () => {
    const clients = await createRoleClients();
    const before = calls.length;

    const query = clients.service.from("posts").select("id").eq("id", "x");
    expect(calls.length).toBe(before); // construir não dispara fetch
    const result = await query;

    expect(result.error).toBeNull();
    expect(calls.slice(before)).toEqual([{ method: "GET", host: `${TEST_REF}.supabase.co`, path: "/rest/v1/posts" }]);
    await clients.cleanup();
  });

  it("consulta construída com o alvo válido e executada depois da invalidação NÃO dispara fetch", async () => {
    const clients = await createRoleClients();
    const query = clients.service.from("posts").select("id").eq("id", "x");
    const before = fakeFetch.mock.calls.length;

    vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", TEST_REF); // o alvo passa a ser "produção"
    await expect(
      (async () => {
        await query;
      })(),
    ).rejects.toBeInstanceOf(IntegrationGuardError);
    expect(fakeFetch.mock.calls.length).toBe(before);

    // outros modos de execução do mesmo construtor real também são bloqueados
    expect(() => query.limit(1)).toThrow(IntegrationGuardError);
    expect(() => query.then(() => undefined)).toThrow(IntegrationGuardError);
    expect(() => clients.service.from("posts").delete().eq("id", "x")).toThrow(IntegrationGuardError);
    expect(fakeFetch.mock.calls.length).toBe(before);
  });

  it("trocar A por B (ambos válidos) bloqueia as referências do cliente original", async () => {
    const clients = await createRoleClients();
    const retained = clients.service;
    const query = retained.from("posts").select("id");
    const before = fakeFetch.mock.calls.length;

    stubTarget(OTHER_REF, "service-key-opaca-B"); // B passa na guarda estática
    expect(() => retained.from("posts")).toThrow(expect.objectContaining({ reason: "target_changed" }));
    expect(() => clients.service).toThrow(expect.objectContaining({ reason: "target_changed" }));
    await expect(
      (async () => {
        await query;
      })(),
    ).rejects.toMatchObject({ reason: "target_changed" });
    expect(() => retained.auth.admin.listUsers()).toThrow(expect.objectContaining({ reason: "target_changed" }));
    expect(fakeFetch.mock.calls.length).toBe(before);
  });

  it("auth.admin: controle positivo e bloqueio após a invalidação", async () => {
    const clients = await createRoleClients();
    const retained = clients.service;
    const before = calls.length;

    // com o alvo válido, cada chamada dispara exatamente uma requisição de administração
    await retained.auth.admin.listUsers({ page: 1, perPage: 10 });
    await retained.auth.admin.createUser({ email: "novo@example.test", password: "x", email_confirm: true });
    await retained.auth.admin.deleteUser(randomUUID());
    expect(calls.slice(before).map((c) => `${c.method} ${c.path.replace(/[0-9a-f-]{36}$/, ":id")}`)).toEqual([
      "GET /auth/v1/admin/users",
      "POST /auth/v1/admin/users",
      "DELETE /auth/v1/admin/users/:id",
    ]);

    const adminBefore = adminCalls().length;
    vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", TEST_REF);
    expect(() => retained.auth.admin.listUsers()).toThrow(IntegrationGuardError);
    expect(() => retained.auth.admin.createUser({ email: "x@example.test" })).toThrow(IntegrationGuardError);
    expect(() => retained.auth.admin.deleteUser(randomUUID())).toThrow(IntegrationGuardError);
    expect(adminCalls().length).toBe(adminBefore);
  });
});
