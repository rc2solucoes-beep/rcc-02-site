import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_REF = "abcdefghijklmnopqrst";
const PROD_REF = "uvwxyzabcdefghijklmn";
const SERVICE_KEY = "service-key-opaca";

const h = vi.hoisted(() => ({
  calls: [] as Array<{ key: string }>,
  marker: { value: null as string | null },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (_url: string, key: string) => {
    h.calls.push({ key });
    return {
      from: () => ({
        select: () => ({
          eq: async () => ({
            data: h.marker.value === null ? [] : [{ value: h.marker.value }],
            error: null,
          }),
        }),
        insert: async () => ({ error: null }),
        delete: () => ({ eq: async () => ({ error: null }) }),
      }),
      auth: {
        signInWithPassword: async () => ({ error: null }),
        admin: {
          createUser: async () => ({
            data: { user: { id: `00000000-0000-4000-8000-${String(h.calls.length).padStart(12, "0")}` } },
            error: null,
          }),
          deleteUser: async () => ({ error: null }),
          listUsers: async () => ({ data: { users: [] }, error: null }),
        },
      },
    };
  },
}));

// Hermético: nunca ler o .env.test.local real durante o teste unitário.
vi.mock("../../integration/support/env", () => ({ loadTestEnvFile: () => {} }));

import { IntegrationGuardError } from "../../integration/support/guard";
import { createRoleClients } from "../../integration/support/clients";

function stubSafeEnv(): void {
  vi.stubEnv("RC2_TEST_SUPABASE_URL", `https://${TEST_REF}.supabase.co`);
  vi.stubEnv("RC2_TEST_PROJECT_REF", TEST_REF);
  vi.stubEnv("RC2_TEST_PROJECT_REF_ALLOWLIST", TEST_REF);
  vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", PROD_REF);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("RC2_TEST_SUPABASE_ANON_KEY", "anon-key-opaca");
  vi.stubEnv("RC2_TEST_SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY);
}

beforeEach(() => {
  h.calls.length = 0;
  h.marker.value = TEST_REF;
  stubSafeEnv();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("guarda no caminho de criação de clientes (RF-OPS-02)", () => {
  it("alvo reconhecido como produção: recusa e não cria nenhum cliente", async () => {
    vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", TEST_REF);
    await expect(createRoleClients()).rejects.toMatchObject({ reason: "is_production" });
    expect(h.calls).toHaveLength(0);
  });

  it("marcador ausente: recusa antes de criar o cliente service_role", async () => {
    h.marker.value = null;
    await expect(createRoleClients()).rejects.toMatchObject({ reason: "missing_marker" });
    expect(h.calls).toHaveLength(1); // somente o cliente anon, para ler o marcador
    expect(h.calls.some((call) => call.key === SERVICE_KEY)).toBe(false);
  });

  it("marcador com valor diferente do ref de teste: recusa antes do service_role", async () => {
    h.marker.value = PROD_REF;
    await expect(createRoleClients()).rejects.toBeInstanceOf(IntegrationGuardError);
    expect(h.calls.some((call) => call.key === SERVICE_KEY)).toBe(false);
  });

  it("o acesso ao service_role revalida o alvo: mudar o ambiente depois da criação é detectado", async () => {
    const clients = await createRoleClients();
    expect(() => clients.service).not.toThrow();

    vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", TEST_REF);
    expect(() => clients.service).toThrow(IntegrationGuardError);

    vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", PROD_REF);
    await expect(clients.cleanup()).resolves.toEqual([]);
  });

  it("uma referência guardada do service_role NÃO permite uso fora do caminho validado", async () => {
    const clients = await createRoleClients();
    const retained = clients.service; // referência guardada, como um teste poderia fazer

    expect(() => retained.from("posts")).not.toThrow();

    vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", TEST_REF); // o ambiente deixa de ser seguro
    expect(() => retained.from("posts")).toThrow(IntegrationGuardError);
    expect(() => retained.auth.admin.listUsers()).toThrow(IntegrationGuardError);

    vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", PROD_REF);
    await expect(clients.cleanup()).resolves.toEqual([]);
  });
});

describe("varreduras estáticas da suíte de integração", () => {
  const root = resolve(process.cwd(), "tests/integration");

  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? sources(full) : full.endsWith(".ts") ? [full] : [];
    });
  }

  it("somente support/clients.ts chama createClient", () => {
    const offenders = sources(root).filter(
      (file) => /createClient\s*\(/.test(readFileSync(file, "utf8")) && !file.endsWith("clients.ts"),
    );
    expect(offenders).toEqual([]);
  });

  it("a chave service_role só é referenciada em guard.ts e target.ts", () => {
    const offenders = sources(root).filter(
      (file) =>
        readFileSync(file, "utf8").includes("SERVICE_ROLE_KEY") &&
        !/[\\/]support[\\/](guard|target)\.ts$/.test(file),
    );
    expect(offenders).toEqual([]);
  });
});
