import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_REF = "abcdefghijklmnopqrst";
const OTHER_REF = "bcdefghijklmnopqrstu"; // outro alvo VÁLIDO (também de teste)
const PROD_REF = "uvwxyzabcdefghijklmn";
const SERVICE_KEY = "service-key-opaca-A";
const OTHER_SERVICE_KEY = "service-key-opaca-B";

// Fake fiel ao Supabase: os construtores de consulta são "thenables" PREGUIÇOSOS,
// isto é, a "requisição" só é registrada quando o then é chamado (await).
// As chamadas de auth.admin disparam no momento da chamada.
const h = vi.hoisted(() => ({
  requests: [] as string[],
  marker: { value: null as string | null },
  users: [] as Array<{ id: string; email: string }>,
  createMode: "ok" as "ok" | "lost-response" | "throws",
  deleteThrows: false,
  deleteIgnored: false,
  listThrows: false,
  seq: 0,
}));

vi.mock("@supabase/supabase-js", () => {
  class Builder {
    constructor(private readonly op: string) {}
    select() {
      return new Builder(`${this.op}.select`);
    }
    insert() {
      return new Builder(`${this.op}.insert`);
    }
    delete() {
      return new Builder(`${this.op}.delete`);
    }
    eq() {
      return new Builder(`${this.op}.eq`);
    }
    then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
      h.requests.push(this.op);
      const data = this.op === "settings.select.eq" ? (h.marker.value === null ? [] : [{ value: h.marker.value }]) : [];
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    }
  }
  return {
    createClient: () => ({
      from: (table: string) => new Builder(table),
      auth: {
        signInWithPassword: async () => ({ error: null }),
        admin: {
          createUser: async (args: { email: string }) => {
            h.requests.push("createUser");
            const user = { id: `00000000-0000-4000-8000-${String(++h.seq).padStart(12, "0")}`, email: args.email };
            h.users.push(user);
            if (h.createMode === "lost-response") return { data: { user: null }, error: { message: "timeout de rede" } };
            if (h.createMode === "throws") throw new Error("conexão encerrada");
            return { data: { user }, error: null };
          },
          deleteUser: async (id: string) => {
            h.requests.push("deleteUser");
            if (h.deleteThrows) throw new Error("falha ao excluir");
            if (!h.deleteIgnored) h.users = h.users.filter((user) => user.id !== id);
            return { error: null };
          },
          listUsers: async (params: { page: number; perPage: number }) => {
            h.requests.push(`listUsers:${params.page}`);
            if (h.listThrows) throw new Error("falha ao listar");
            const start = (params.page - 1) * params.perPage;
            return { data: { users: h.users.slice(start, start + params.perPage) }, error: null };
          },
        },
      },
    }),
  };
});

vi.mock("../../integration/support/env", () => ({ loadTestEnvFile: () => {} }));

import { USER_PAGE_SIZE, createRoleClients } from "../../integration/support/clients";
import { IntegrationGuardError } from "../../integration/support/guard";

function stubTarget(ref: string, serviceKey: string): void {
  vi.stubEnv("RC2_TEST_SUPABASE_URL", `https://${ref}.supabase.co`);
  vi.stubEnv("RC2_TEST_PROJECT_REF", ref);
  vi.stubEnv("RC2_TEST_PROJECT_REF_ALLOWLIST", ref);
  vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", PROD_REF);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("RC2_TEST_SUPABASE_ANON_KEY", "anon-key-opaca");
  vi.stubEnv("RC2_TEST_SUPABASE_SERVICE_ROLE_KEY", serviceKey);
}

function invalidateTarget(): void {
  vi.stubEnv("RC2_PRODUCTION_PROJECT_REF", TEST_REF); // o alvo passa a ser "produção"
}

function requestsAfter(count: number): string[] {
  return h.requests.slice(count);
}

beforeEach(() => {
  h.requests = [];
  h.users = [];
  h.marker.value = TEST_REF;
  h.createMode = "ok";
  h.deleteThrows = false;
  h.deleteIgnored = false;
  h.listThrows = false;
  h.seq = 0;
  stubTarget(TEST_REF, SERVICE_KEY);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("B-01: consultas privilegiadas diferidas são revalidadas na execução", () => {
  it("controle: com o alvo válido, a cadeia from().select().eq() só gera requisição no await", async () => {
    const clients = await createRoleClients();
    const before = h.requests.length;
    const query = clients.service.from("posts").select("id").eq("id", "x");
    expect(requestsAfter(before)).toEqual([]); // construir não envia nada
    await query;
    expect(requestsAfter(before)).toEqual(["posts.select.eq"]);
    await clients.cleanup();
  });

  it("consulta construída com o alvo válido e aguardada depois de invalidá-lo: nenhuma requisição", async () => {
    const clients = await createRoleClients();
    const query = clients.service.from("posts").select("id").eq("id", "x"); // válido
    const before = h.requests.length;

    invalidateTarget();
    await expect(
      (async () => {
        await query;
      })(),
    ).rejects.toBeInstanceOf(IntegrationGuardError);
    expect(requestsAfter(before)).toEqual([]); // AUSÊNCIA de requisição, não só exceção

    // continuar a cadeia sobre o objeto capturado também é recusado
    expect(() => query.eq("id", "y")).toThrow(IntegrationGuardError);
    expect(requestsAfter(before)).toEqual([]);
  });

  it("referência privilegiada retida: construtor parcial e cliente não geram requisição após a invalidação", async () => {
    const clients = await createRoleClients();
    const retained = clients.service;
    const partial = retained.from("posts"); // construtor retido, ainda não executado
    const before = h.requests.length;

    invalidateTarget();
    expect(() => partial.delete()).toThrow(IntegrationGuardError);
    expect(() => retained.from("posts")).toThrow(IntegrationGuardError);
    expect(() => clients.service).toThrow(IntegrationGuardError);
    expect(requestsAfter(before)).toEqual([]);
  });

  it("auth.admin: createUser, deleteUser e listUsers não disparam requisição após a invalidação", async () => {
    const clients = await createRoleClients();
    const retained = clients.service;
    const before = h.requests.length;

    invalidateTarget();
    expect(() => retained.auth.admin.createUser({ email: "x@example.test" })).toThrow(IntegrationGuardError);
    expect(() => retained.auth.admin.deleteUser("00000000-0000-4000-8000-000000000001")).toThrow(IntegrationGuardError);
    expect(() => retained.auth.admin.listUsers({ page: 1, perPage: 10 })).toThrow(IntegrationGuardError);
    expect(requestsAfter(before)).toEqual([]);
  });
});

describe("I-01: o cliente privilegiado fica preso ao alvo original", () => {
  it("trocar o alvo A por outro alvo VÁLIDO B invalida a referência criada para A", async () => {
    const clients = await createRoleClients();
    const retained = clients.service;
    const query = retained.from("posts").select("id");
    const before = h.requests.length;

    stubTarget(OTHER_REF, OTHER_SERVICE_KEY); // B também passaria na guarda estática
    let caught: unknown;
    try {
      retained.from("posts");
    } catch (error) {
      caught = error;
    }
    expect(caught).toMatchObject({ reason: "target_changed" });
    expect(() => clients.service).toThrow(IntegrationGuardError);
    await expect(
      (async () => {
        await query;
      })(),
    ).rejects.toMatchObject({ reason: "target_changed" });
    expect(requestsAfter(before)).toEqual([]);

    const text = String((caught as Error).message);
    expect(text).not.toContain(SERVICE_KEY);
    expect(text).not.toContain(OTHER_SERVICE_KEY);
  });

  it("mesma URL e ref, mas outra chave service_role: também é recusado", async () => {
    const clients = await createRoleClients();
    const retained = clients.service;
    const before = h.requests.length;

    stubTarget(TEST_REF, OTHER_SERVICE_KEY);
    expect(() => retained.auth.admin.listUsers()).toThrow(expect.objectContaining({ reason: "target_changed" }));
    expect(requestsAfter(before)).toEqual([]);
  });
});

describe("I-02: usuários órfãos por resposta ambígua", () => {
  it("criação feita no Supabase com resposta perdida: a reconciliação por prefixo remove o órfão", async () => {
    h.createMode = "lost-response";
    await expect(createRoleClients()).rejects.toThrow(/Falha ao criar o usuário sintético/);
    expect(h.users).toEqual([]); // o usuário criado sem resposta foi encontrado e excluído
    expect(h.requests).toContain("deleteUser");
  });

  it("criação com exceção de rede (resposta perdida): também reconcilia", async () => {
    h.createMode = "throws";
    await expect(createRoleClients()).rejects.toThrow(/conexão encerrada/);
    expect(h.users).toEqual([]);
  });

  it("falha de limpeza do órfão não é silenciosa e preserva a identidade registrada", async () => {
    h.createMode = "lost-response";
    h.deleteThrows = true;
    const error = (await createRoleClients().catch((e: unknown) => e)) as AggregateError;
    expect(error).toBeInstanceOf(AggregateError);
    expect(error.message).toMatch(/O setup falhou e a limpeza também/);
    const text = error.errors.map((e: Error) => e.message).join(" ");
    expect(text).toMatch(/identidades registradas = \[e0a-[0-9a-f]{8}-admin@example\.test\]/);
    expect(text).not.toContain(SERVICE_KEY);
  });

  it("reconciliação e inspeção paginam: órfãos além da primeira página são removidos e verificados", async () => {
    const clients = await createRoleClients();
    const foreign = Array.from({ length: USER_PAGE_SIZE + 20 }, (_, i) => ({
      id: `f-${i}`,
      email: `outra-execucao-${i}@example.test`,
    }));
    const orphans = Array.from({ length: USER_PAGE_SIZE + 30 }, (_, i) => ({
      id: `o-${i}`,
      email: `e0a-${clients.tag}-orfao-${i}@example.test`,
    }));
    h.users.push(...foreign, ...orphans); // os órfãos ficam na 2ª e 3ª páginas
    h.requests = [];

    await expect(clients.cleanup()).resolves.toEqual([]);
    expect(h.users).toEqual(foreign); // só os desta execução foram removidos
    expect(h.requests.some((r) => r === "listUsers:3")).toBe(true);
  });

  it("a inspeção final alcança a 2ª página: resíduo lá é reportado mesmo com exclusão 'bem-sucedida'", async () => {
    const clients = await createRoleClients();
    h.users.unshift(
      ...Array.from({ length: USER_PAGE_SIZE + 5 }, (_, i) => ({ id: `f-${i}`, email: `outra-${i}@example.test` })),
    );
    h.users.push({ id: "o-1", email: `e0a-${clients.tag}-orfao@example.test` }); // fica na 2ª página
    h.deleteIgnored = true; // a API diz ok, mas não exclui

    const failures = await clients.cleanup();
    expect(failures.some((f) => f.includes("remanescente"))).toBe(true);
  });
});

describe("B-02: limpeza de usuários resiliente a exceções", () => {
  it("exceção ao excluir: cleanup não lança, tenta todos os usuários e reporta o resíduo", async () => {
    const clients = await createRoleClients();
    const before = h.requests.filter((r) => r === "deleteUser").length;
    h.deleteThrows = true;

    const failures = await clients.cleanup();
    expect(h.requests.filter((r) => r === "deleteUser").length - before).toBeGreaterThanOrEqual(2); // admin e membro
    expect(failures.some((f) => f.includes("exceção"))).toBe(true);
    expect(failures.some((f) => f.includes("remanescente"))).toBe(true); // a inspeção ainda rodou
    expect(failures.at(-1)).toMatch(/evidência: identidades registradas/);
  });

  it("exceção na listagem (reconciliação e inspeção): não lança e reporta", async () => {
    const clients = await createRoleClients();
    h.listThrows = true;
    const failures = await clients.cleanup();
    expect(failures.filter((f) => f.includes("falha ao listar")).length).toBeGreaterThanOrEqual(1);
  });

  it("alvo invalidado durante a limpeza: o relatório preserva a evidência e nada vaza", async () => {
    const clients = await createRoleClients();
    invalidateTarget();
    const failures = await clients.cleanup();
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.join(" ")).toContain("guarda:");
    expect(failures.at(-1)).toMatch(/ids conhecidos = \[/);
    expect(failures.join(" ")).not.toContain(SERVICE_KEY);
  });
});
