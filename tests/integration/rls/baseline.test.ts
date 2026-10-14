import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CleanupRegistry } from "../support/cleanup";
import { createRoleClients, type RoleClients } from "../support/clients";
import { makeAuthor, makeLead, makePost, makeSetting } from "../support/fixtures";
import {
  matrixEntries,
  mismatches,
  writeMatrixReport,
  type Operation,
  type Outcome,
  type Role,
} from "../support/matrix";
import {
  check,
  observeDelete,
  observeInsert,
  observeSelect,
  observeUpdate,
  type Fixture,
} from "../support/probes";

// Matriz do harness (E0a) sobre tabelas de política estável. NÃO fixa o INSERT
// anônimo em `leads` (R1, E0b.2), o DELETE de `leads` (E2) nem
// `admin_audit_logs` (E0b.3). Todo efeito é confirmado pelo cliente service_role
// do ambiente isolado; negação exige fixture confirmada e estado inalterado.

type Expectation = [anon: Outcome, nonAdmin: Outcome, admin: Outcome, service: Outcome];
type Observation = Outcome | "error";

const ALLOW: Outcome = "allow";
const DENY: Outcome = "deny";
const ROLE_ORDER: Role[] = ["anon", "authenticated_non_admin", "authenticated_admin", "service_role"];

const registry = new CleanupRegistry();
let c: RoleClients | undefined;
let torn = false;
let adminEmail = "";
let fxPostPublished: Fixture;
let fxPostDraft: Fixture;
let fxSetting: Fixture;
let fxLead: Fixture;
let fxAdminUser: Fixture;

function clients(): RoleClients {
  if (!c) throw new Error("clientes não inicializados");
  return c;
}
const svc = (): SupabaseClient => clients().service;
const tag = (): string => clients().tag;

function roles(): Array<[Role, SupabaseClient]> {
  const k = clients();
  return [
    ["anon", k.anon],
    ["authenticated_non_admin", k.nonAdmin],
    ["authenticated_admin", k.admin],
    ["service_role", k.service],
  ];
}

// Limpeza idempotente. Nunca silenciosa: devolve todas as falhas.
async function teardown(): Promise<string[]> {
  if (torn || !c) return [];
  torn = true;
  const service = c.service;
  return [...(await registry.run(service)), ...(await registry.inspectResidue(service)), ...(await c.cleanup())];
}

type Case = {
  table: string;
  operation: Operation;
  expected: Expectation;
  only?: Role[];
  run: (role: Role, client: SupabaseClient) => Promise<Observation>;
};

async function runCases(cases: Case[]): Promise<void> {
  for (const spec of cases) {
    for (const [role, client] of roles()) {
      if (spec.only && !spec.only.includes(role)) continue;
      await check({
        table: spec.table,
        role,
        operation: spec.operation,
        expected: spec.expected[ROLE_ORDER.indexOf(role)],
        observe: () => spec.run(role, client),
      });
    }
  }
}

beforeAll(async () => {
  try {
    c = await createRoleClients();
    const k = clients();

    fxPostPublished = await makePost(k.service, registry, k.tag, "published");
    fxPostDraft = await makePost(k.service, registry, k.tag, "draft");
    fxSetting = await makeSetting(k.service, registry, k.tag);
    fxLead = await makeLead(k.service, registry, k.tag);
    fxAdminUser = { table: "admin_users", idColumn: "id", id: k.adminUserId };

    const adminRow = await k.service.from("admin_users").select("email").eq("id", k.adminUserId);
    if (adminRow.error || !adminRow.data?.[0]) throw new Error("admin sintético não encontrado");
    adminEmail = String(adminRow.data[0].email);
  } catch (error) {
    const problems = await teardown();
    if (problems.length > 0) {
      throw new AggregateError([error, new Error(problems.join(" | "))], "O setup falhou e a limpeza também");
    }
    throw error;
  }
});

afterAll(async () => {
  const problems = await teardown();
  writeMatrixReport("baseline");
  // Falha de limpeza reprova a suíte: nunca é silenciosa.
  if (problems.length > 0) throw new Error(`Falha de limpeza (${problems.length}): ${problems.join(" | ")}`);
});

describe("identidades do harness", () => {
  it("cria identidades coerentes para os quatro papéis", async () => {
    const k = clients();
    const adminRow = await k.service.from("admin_users").select("id").eq("id", k.adminUserId);
    const memberRow = await k.service.from("admin_users").select("id").eq("id", k.nonAdminUserId);
    expect(adminRow.data).toHaveLength(1);
    expect(memberRow.data).toHaveLength(0);
    expect((await k.anon.auth.getUser()).data.user).toBeNull();
    expect(registry.size).toBeGreaterThan(0);
  });
});

describe("matriz de RLS sobre tabelas de política estável (67 verificações)", () => {
  it("SELECT: 5 casos × 4 papéis", async () => {
    await runCases([
      { table: "posts", operation: "SELECT", expected: [ALLOW, ALLOW, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxPostPublished) },
      { table: "posts", operation: "SELECT", expected: [DENY, DENY, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxPostDraft) },
      { table: "settings", operation: "SELECT", expected: [ALLOW, ALLOW, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxSetting) },
      { table: "admin_users", operation: "SELECT", expected: [DENY, DENY, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxAdminUser) },
      { table: "leads", operation: "SELECT", expected: [DENY, DENY, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxLead) },
    ]);
  });

  it("INSERT: 3 casos × 4 papéis", async () => {
    await runCases([
      {
        table: "posts",
        operation: "INSERT",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: (_r, cl) => {
          const id = randomUUID();
          return observeInsert(cl, svc(), registry, "posts", "id", {
            id,
            slug: `e0a-${tag()}-i-${id.slice(0, 8)}`,
            title: "E0a insert",
            status: "draft",
          });
        },
      },
      {
        table: "settings",
        operation: "INSERT",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: (_r, cl) =>
          observeInsert(cl, svc(), registry, "settings", "key", { key: `__e0a_${tag()}_i_${randomUUID().slice(0, 8)}`, value: "" }),
      },
      {
        table: "authors",
        operation: "INSERT",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: (_r, cl) => observeInsert(cl, svc(), registry, "authors", "id", { id: randomUUID(), name: "E0a author insert" }),
      },
    ]);
  });

  it("UPDATE: 5 casos × 4 papéis", async () => {
    const unique = () => `upd-${randomUUID().slice(0, 8)}`;
    await runCases([
      {
        table: "posts",
        operation: "UPDATE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeUpdate(cl, svc(), await makePost(svc(), registry, tag(), "draft"), "summary", unique()),
      },
      {
        table: "settings",
        operation: "UPDATE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeUpdate(cl, svc(), await makeSetting(svc(), registry, tag()), "value", unique()),
      },
      {
        table: "authors",
        operation: "UPDATE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeUpdate(cl, svc(), await makeAuthor(svc(), registry, tag()), "title", unique()),
      },
      {
        table: "leads",
        operation: "UPDATE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeUpdate(cl, svc(), await makeLead(svc(), registry, tag()), "message", unique()),
      },
      {
        // Política "block update" de admin_users: ninguém altera, exceto o service_role.
        table: "admin_users",
        operation: "UPDATE",
        expected: [DENY, DENY, DENY, ALLOW],
        run: async (role, cl) => {
          const outcome = await observeUpdate(cl, svc(), fxAdminUser, "email", `e0a-${tag()}-${randomUUID().slice(0, 6)}@example.test`);
          if (role === "service_role") {
            const restored = await svc().from("admin_users").update({ email: adminEmail }).eq("id", fxAdminUser.id);
            if (restored.error) throw new Error(`Falha ao restaurar o admin sintético: ${restored.error.code}`);
          }
          return outcome;
        },
      },
    ]);
  });

  it("DELETE: 3 casos × 4 papéis + admin_users × 3 papéis", async () => {
    await runCases([
      {
        table: "posts",
        operation: "DELETE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeDelete(cl, svc(), await makePost(svc(), registry, tag(), "draft")),
      },
      {
        table: "settings",
        operation: "DELETE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeDelete(cl, svc(), await makeSetting(svc(), registry, tag())),
      },
      {
        table: "authors",
        operation: "DELETE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        run: async (_r, cl) => observeDelete(cl, svc(), await makeAuthor(svc(), registry, tag())),
      },
      {
        // Política "block delete": só a negação é observada; service_role fica de fora
        // para não destruir o admin sintético que sustenta o restante da suíte.
        table: "admin_users",
        operation: "DELETE",
        expected: [DENY, DENY, DENY, DENY],
        only: ["anon", "authenticated_non_admin", "authenticated_admin"],
        run: (_r, cl) => observeDelete(cl, svc(), fxAdminUser),
      },
    ]);
  });

  it("resumo: 67 verificações, sem divergência e sem resultado inconclusivo", () => {
    expect(matrixEntries()).toHaveLength(20 + 12 + 20 + 15);
    expect(mismatches()).toEqual([]);
  });
});
