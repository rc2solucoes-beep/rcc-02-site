import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CleanupRegistry, runTeardownPhases } from "../support/cleanup";
import { describeError, sanitizeThrown } from "../support/errors";
import { createRoleClients, type RoleClients } from "../support/clients";
import { makeAuditLog, makeLead } from "../support/fixtures";
import { requireLegacyLeadPhase, type E2Phase } from "../support/e2Fixtures";
import {
  matrixEntries,
  mismatches,
  writeMatrixReport,
  type Operation,
  type Outcome,
  type Role,
} from "../support/matrix";
import { check, observeDelete, observeInsert, observeSelect, observeUpdate, type Fixture } from "../support/probes";

// E0b.2 (RF-SEG-01, T-SEG-I01) e E0b.3 (RF-SEG-02, T-SEG-I03).
// SÓ faz sentido DEPOIS de aplicar as migrations 012 e 013 no ambiente isolado; antes disso
// a matriz diverge de propósito (leads_anon_insert ainda existe, admin_audit_logs sem policy).
// Segue o harness da E0a: todo efeito é confirmado pelo cliente service_role do ambiente
// isolado; negação exige fixture confirmada e estado inalterado. `INSERT` usa observeInsert.
//
// FASE EXPLÍCITA (A5): a migration 015 muda UMA linha desta matriz — o DELETE de `leads` pelo
// admin (SDD §9.4). RC2_E2_PHASE=pre015 (015 NÃO aplicada: admin DENY), post015 (015 aplicada:
// admin ALLOW) ou post016 (015 e 016 aplicadas: a 016 retira o DELETE: admin DENY). Sem a variável a suíte FALHA; nada é detectado por sondagem de privilégio. Em
// ambas as fases anon e não-admin seguem DENY em tudo, e INSERT em `leads` segue só do service_role.
// O pré-requisito 012/013 acima continua valendo para as duas fases.

type Expectation = [anon: Outcome, nonAdmin: Outcome, admin: Outcome, service: Outcome];
type Observation = Outcome | "error";

const ALLOW: Outcome = "allow";
const DENY: Outcome = "deny";
const ROLE_ORDER: Role[] = ["anon", "authenticated_non_admin", "authenticated_admin", "service_role"];

const registry = new CleanupRegistry();
let c: RoleClients | undefined;
let phase: E2Phase | undefined;
let tearing: Promise<string[]> | undefined;
let fxLead: Fixture;
let fxAudit: Fixture;

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

function teardown(): Promise<string[]> {
  const current = c;
  if (!current) return Promise.resolve([]);
  tearing ??= runTeardownPhases([
    { name: "remoção dos recursos registrados", run: async () => registry.run(current.service), evidence: () => registry.describePending() },
    { name: "inspeção de resíduos", run: async () => registry.inspectResidue(current.service), evidence: () => registry.describePending() },
    { name: "usuários sintéticos", run: () => current.cleanup() },
  ]);
  return tearing;
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

function leadRow(): Record<string, unknown> {
  const id = randomUUID();
  return {
    id,
    name: "Teste E0b",
    company: "Sintético",
    email: `e0b-${tag()}-${id.slice(0, 8)}@example.test`,
    whatsapp: "5500000000000",
    segment: "teste",
    size: "1",
    solution: "teste",
    message: "dado sintético da suíte E0b",
  };
}

beforeAll(async () => {
  try {
    phase = requireLegacyLeadPhase();
    c = await createRoleClients();
    const k = clients();
    fxLead = await makeLead(k.service, registry, k.tag);
    fxAudit = await makeAuditLog(k.service, registry, k.tag);
  } catch (error) {
    const problems = [...(await teardown())];
    if (problems.length > 0) {
      throw new AggregateError([sanitizeThrown(error, "setup"), new Error(problems.join(" | "))], "O setup falhou e a limpeza também");
    }
    throw sanitizeThrown(error, "setup");
  }
});

afterAll(async () => {
  const problems = [...(await teardown())];
  try {
    writeMatrixReport("e0b-security");
  } catch (thrown) {
    problems.push(`relatório da matriz falhou: ${describeError(thrown)}`);
  }
  if (problems.length > 0) throw new Error(`Falha de limpeza (${problems.length}): ${problems.join(" | ")}`);
});

describe("E0b.2 — leads: anon sem acesso (T-SEG-I01)", () => {
  it("SELECT, INSERT, UPDATE e DELETE", async () => {
    const unique = () => `e0b-${randomUUID().slice(0, 8)}`;
    await runCases([
      // O admin continua lendo (painel e dashboard); anon e não-admin não.
      { table: "leads", operation: "SELECT", expected: [DENY, DENY, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxLead) },
      // INSERT: a rota de contato grava como service_role (T-SEG-I02 no nível do banco); ninguém mais.
      { table: "leads", operation: "INSERT", expected: [DENY, DENY, DENY, ALLOW], run: (_r, cl) => observeInsert(cl, svc(), registry, "leads", "id", leadRow()) },
      // UPDATE e DELETE: efeito real confirmado pelo cliente privilegiado, uma fixture nova por papel.
      {
        table: "leads",
        operation: "UPDATE",
        expected: [DENY, DENY, ALLOW, ALLOW],
        only: ["anon"],
        run: async (_r, cl) => observeUpdate(cl, svc(), await makeLead(svc(), registry, tag()), "message", unique()),
      },
      {
        table: "leads",
        operation: "DELETE",
        // Admin: pré-015 DENY (sem privilégio DELETE); post015 ALLOW (policy e grant da E2); post016 DENY (016).
        expected: phase === "post015" ? [DENY, DENY, ALLOW, ALLOW] : [DENY, DENY, DENY, ALLOW],
        run: async (_r, cl) => observeDelete(cl, svc(), await makeLead(svc(), registry, tag())),
      },
    ]);
  });
});

describe("E0b.3 — admin_audit_logs: leitura só de admin (T-SEG-I03)", () => {
  it("SELECT, INSERT, UPDATE e DELETE", async () => {
    const unique = () => `/e0b/${randomUUID().slice(0, 8)}`;
    await runCases([
      { table: "admin_audit_logs", operation: "SELECT", expected: [DENY, DENY, ALLOW, ALLOW], run: (_r, cl) => observeSelect(cl, svc(), fxAudit) },
      {
        table: "admin_audit_logs",
        operation: "INSERT",
        expected: [DENY, DENY, DENY, ALLOW],
        run: (_r, cl) => {
          const id = randomUUID();
          return observeInsert(cl, svc(), registry, "admin_audit_logs", "id", {
            id,
            event: "e0a_synthetic",
            severity: "info",
            actor_type: "system",
            path: `/e0b/${tag()}`,
          });
        },
      },
      {
        table: "admin_audit_logs",
        operation: "UPDATE",
        expected: [DENY, DENY, DENY, ALLOW],
        run: async (_r, cl) => observeUpdate(cl, svc(), await makeAuditLog(svc(), registry, tag()), "path", unique()),
      },
      {
        table: "admin_audit_logs",
        operation: "DELETE",
        expected: [DENY, DENY, DENY, ALLOW],
        run: async (_r, cl) => observeDelete(cl, svc(), await makeAuditLog(svc(), registry, tag())),
      },
    ]);
  });
});

describe("resumo da matriz E0b", () => {
  it("29 verificações, sem divergência e sem resultado inconclusivo", () => {
    // leads: 4 + 4 + 1 + 4 = 13; admin_audit_logs: 4 + 4 + 4 + 4 = 16.
    expect(matrixEntries()).toHaveLength(13 + 16);
    expect(mismatches()).toEqual([]);
  });
});
