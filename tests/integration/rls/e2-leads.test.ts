import { randomUUID } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CleanupRegistry, runTeardownPhases } from "../support/cleanup";
import { createRoleClients, type RoleClients } from "../support/clients";
import {
  LEGACY_MANIFEST_PATH,
  LEGACY_SELECT,
  activityOf,
  e2PhaseIn,
  e2PhaseIs,
  legacyFingerprint,
  makeActivity,
  makeDisposableUser,
  makeNote,
  notesOf,
  readLead,
  sleep,
} from "../support/e2Fixtures";
import { HarnessError, describeError, sanitizeThrown } from "../support/errors";
import { makeLead, makePost, makeSetting } from "../support/fixtures";
import {
  matrixEntries,
  mismatches,
  writeMatrixReport,
  type Operation,
  type Outcome,
  type Role,
} from "../support/matrix";
import { check, observeDelete, observeInsert, observeSelect, observeUpdate, type Fixture } from "../support/probes";
import {
  LEAD_ACTIVITY_KINDS,
  LEAD_NEXT_ACTION_MAX_LENGTH,
  LEAD_NOTE_MAX_LENGTH,
  LEAD_STATUSES,
} from "../../../src/lib/types/lead";

// E2 (Gestão de Leads) — T-LEAD-I01 a I16 do SDD (2026-10-13-admin-leads-management-design.md §Testes).
// ESCRITO, NÃO EXECUTADO. A numeração é a OFICIAL do SDD e não pode ser alterada.
//
// Só roda com RC2_E2_PHASE=post015 (015 aplicada, 016 NÃO) ou post016 (015 e 016 aplicadas), no ambiente
// ISOLADO, DEPOIS de a migration correspondente ser aplicada manualmente (runbook docs/runbooks/migrations/015-leads-management/) e com autorização expressa.
// Sem a variável, tudo é ignorado. O T-LEAD-I07 exige a fase pré-015 (e2-leads-pre015.test.ts).
// Só dados sintéticos (example.test). Todo recurso é registrado ANTES de criado; notas e atividades
// saem por CASCADE com o lead. Erros do Supabase nunca são reproduzidos (só códigos controlados).
//
// Mapa SDD → este arquivo:  PV-05 → I06 · PV-06 → I08 (+ I03 e I16, lado negativo) · PV-28 → I15.
// A constraint de lead_activity (NULL e combinações) é coberta em I09; a escrita direta em I11;
// a escrita direta de updated_at/status_updated_at em I16.

type Observation = Outcome | "error";

const ANON = "anon" as const satisfies Role;
const NON_ADMIN = "authenticated_non_admin" as const satisfies Role;
const ADMIN = "authenticated_admin" as const satisfies Role;
const SERVICE = "service_role" as const satisfies Role;
const ALLOW: Outcome = "allow";
const DENY: Outcome = "deny";
const OPERATIONS: Operation[] = ["SELECT", "INSERT", "UPDATE", "DELETE"];
const TABLES = ["leads", "lead_notes", "lead_activity"] as const;
type LeadTable = (typeof TABLES)[number];

const registry = new CleanupRegistry();
let c: RoleClients | undefined;
let tearing: Promise<string[]> | undefined;
let legacySeedIds: string[] = [];
let fxLead: Fixture;
let fxNote: Fixture;
let fxActivity: Fixture;

function clients(): RoleClients {
  if (!c) throw new Error("clientes não inicializados");
  return c;
}
const svc = (): SupabaseClient => clients().service;
const admin = (): SupabaseClient => clients().admin;
const tag = (): string => clients().tag;

function clientFor(role: Role): SupabaseClient {
  const k = clients();
  if (role === ANON) return k.anon;
  if (role === NON_ADMIN) return k.nonAdmin;
  if (role === ADMIN) return k.admin;
  return k.service;
}

function authorFor(role: Role): string | null {
  if (role === ADMIN) return clients().adminUserId;
  if (role === NON_ADMIN) return clients().nonAdminUserId;
  return null;
}

function teardown(): Promise<string[]> {
  const current = c;
  if (!current) return Promise.resolve([]);
  tearing ??= runTeardownPhases([
    { name: "remoção dos recursos registrados", run: async () => registry.run(current.service), evidence: () => registry.describePending() },
    { name: "inspeção de resíduos", run: async () => registry.inspectResidue(current.service), evidence: () => registry.describePending() },
    { name: "leads históricos semeados (T-LEAD-I07)", run: () => removeLegacySeeds(current.service), evidence: () => legacySeedIds },
    { name: "usuários sintéticos", run: () => current.cleanup() },
  ]);
  return tearing;
}

async function removeLegacySeeds(service: SupabaseClient): Promise<string[]> {
  if (legacySeedIds.length === 0) return [];
  const problems: string[] = [];
  const removed = await service.from("leads").delete().in("id", legacySeedIds);
  if (removed.error) problems.push(`leads históricos: ${describeError(removed.error)}`);
  const left = await service.from("leads").select("id").in("id", legacySeedIds);
  if (left.error || (left.data?.length ?? 0) > 0) problems.push("leads históricos remanescentes");
  if (problems.length === 0) rmSync(LEGACY_MANIFEST_PATH, { force: true });
  return problems;
}

// ─── utilitários ────────────────────────────────────────────────────────────

type MatrixSpec = {
  id: string;
  table: string;
  operation: Operation;
  expected: Partial<Record<Role, Outcome>>;
  run: (role: Role, client: SupabaseClient) => Promise<Observation>;
};

/** Registra cada observação na matriz com a etiqueta oficial `[Ixx]` no nome da tabela. */
async function runMatrix(spec: MatrixSpec): Promise<void> {
  for (const [role, expected] of Object.entries(spec.expected) as Array<[Role, Outcome]>) {
    await check({
      table: `${spec.table} [${spec.id}]`,
      role,
      operation: spec.operation,
      expected,
      observe: () => spec.run(role, clientFor(role)),
    });
  }
}

function expectMatrixClean(id: string): void {
  const own = matrixEntries().filter((entry) => entry.table.endsWith(`[${id}]`));
  expect(own.length, `nenhuma observação registrada para ${id}`).toBeGreaterThan(0);
  expect(mismatches().filter((entry) => entry.table.endsWith(`[${id}]`))).toEqual([]);
}

function leadRow(): Record<string, unknown> {
  const id = randomUUID();
  return {
    id,
    name: "Teste E2",
    company: "Sintético",
    email: `e2-${tag()}-${id.slice(0, 8)}@example.test`,
    whatsapp: "5500000000000",
    segment: "teste",
    size: "1",
    solution: "teste",
    message: "dado sintético da suíte E2",
  };
}

/** Casos de acesso por tabela e operação, comuns a I01, I02, I04, I05 e I11. */
function accessCases(table: LeadTable): Record<Operation, (role: Role, client: SupabaseClient) => Promise<Observation>> {
  if (table === "leads") {
    return {
      SELECT: (_r, cl) => observeSelect(cl, svc(), fxLead),
      INSERT: (_r, cl) => observeInsert(cl, svc(), registry, "leads", "id", leadRow()),
      UPDATE: async (_r, cl) => observeUpdate(cl, svc(), await makeLead(svc(), registry, tag()), "status", "in_review"),
      DELETE: async (_r, cl) => observeDelete(cl, svc(), await makeLead(svc(), registry, tag())),
    };
  }
  if (table === "lead_notes") {
    return {
      SELECT: (_r, cl) => observeSelect(cl, svc(), fxNote),
      INSERT: (role, cl) =>
        observeInsert(cl, svc(), registry, "lead_notes", "id", {
          id: randomUUID(),
          lead_id: fxLead.id,
          author_id: authorFor(role),
          body: "nota sintética E2",
        }),
      UPDATE: async (_r, cl) =>
        observeUpdate(cl, svc(), await makeNote(svc(), registry, fxLead.id, null), "body", `alterada-${randomUUID().slice(0, 6)}`),
      DELETE: async (_r, cl) => observeDelete(cl, svc(), await makeNote(svc(), registry, fxLead.id, null)),
    };
  }
  return {
    SELECT: (_r, cl) => observeSelect(cl, svc(), fxActivity),
    INSERT: (_r, cl) =>
      observeInsert(cl, svc(), registry, "lead_activity", "id", { id: randomUUID(), lead_id: fxLead.id, kind: "archived" }),
    UPDATE: async (_r, cl) => observeUpdate(cl, svc(), await makeActivity(svc(), registry, fxLead.id), "kind", "restored"),
    DELETE: async (_r, cl) => observeDelete(cl, svc(), await makeActivity(svc(), registry, fxLead.id)),
  };
}

type PatchResult = { data: Array<{ id: string; updated_at: string }> | null; error: { code?: string } | null };

/** UPDATE pela SESSÃO do admin, com a trava otimista opcional (`expectedUpdatedAt` é texto opaco, nunca Date). */
async function adminUpdate(id: string, patch: Record<string, unknown>, expectedUpdatedAt?: string): Promise<PatchResult> {
  const base = admin().from("leads").update(patch).eq("id", id);
  const query = expectedUpdatedAt === undefined ? base : base.eq("updated_at", expectedUpdatedAt);
  return (await query.select("id,updated_at")) as unknown as PatchResult;
}

async function legacyRow(client: SupabaseClient, id: string): Promise<Record<string, unknown>> {
  const { data, error } = await client.from("leads").select(LEGACY_SELECT).eq("id", id);
  if (error || !data || data.length !== 1) throw new HarnessError(`Leitura das colunas históricas falhou: ${describeError(error)}`);
  return data[0] as unknown as Record<string, unknown>;
}

async function newLeadId(): Promise<string> {
  return (await makeLead(svc(), registry, tag())).id;
}

async function columnOf(table: string, idColumn: string, id: string, column: string): Promise<string> {
  const { data, error } = await svc().from(table).select(column).eq(idColumn, id);
  const rows = data as unknown as Array<Record<string, unknown>> | null;
  if (error || !rows || rows.length !== 1) throw new HarnessError(`Leitura de ${table}.${column} falhou: ${describeError(error)}`);
  return String(rows[0][column]);
}

// ─── suíte ──────────────────────────────────────────────────────────────────

describe.skipIf(!e2PhaseIn("post015", "post016"))("E2 — Gestão de Leads (T-LEAD-I01 a I16, pós-migration 015 e 016)", () => {
  beforeAll(async () => {
    try {
      c = await createRoleClients();
      const probe = await svc().from("leads").select("status,updated_at").limit(1);
      if (probe.error) {
        throw new HarnessError(`A migration 015 não parece aplicada neste alvo: ${describeError(probe.error)}`);
      }
      const k = clients();
      fxLead = await makeLead(k.service, registry, k.tag);
      fxNote = await makeNote(k.service, registry, fxLead.id, null);
      fxActivity = await makeActivity(k.service, registry, fxLead.id);
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
      writeMatrixReport("e2-leads");
    } catch (thrown) {
      problems.push(`relatório da matriz falhou: ${describeError(thrown)}`);
    }
    if (problems.length > 0) throw new Error(`Falha de limpeza (${problems.length}): ${problems.join(" | ")}`);
  });

  describe("pré-condição técnica da 012 (o estado que o guard da 015 exige)", () => {
    it("GUARD-012 — anon é barrado por PRIVILÉGIO (42501), não só por RLS, nas três tabelas", async () => {
      for (const table of TABLES) {
        const read = await clients().anon.from(table).select("id").limit(1);
        expect(read.error?.code, `SELECT anon em ${table}`).toBe("42501");
      }
      const insert = await clients().anon.from("leads").insert(leadRow());
      expect(insert.error?.code, "INSERT anon em leads").toBe("42501");
    });

    it.todo(
      "GUARD-012-EXECUCAO — executar a 015 contra alvo com leads_anon_insert ou privilégio de anon deve ABORTAR sem efeito (exige executor de SQL, ausente do harness PostgREST: procedimento manual no README)",
    );
    it.todo(
      "GUARD-REAPLICACAO — reexecutar a 015 já aplicada deve ABORTAR e o verify.sql seguir APROVADO (exige executor de SQL: procedimento manual no README)",
    );
  });

  describe("acesso, grants e RLS", () => {
    it("T-LEAD-I01 — anon sem acesso a leads, lead_notes e lead_activity", async () => {
      for (const table of TABLES) {
        const cases = accessCases(table);
        for (const operation of OPERATIONS) {
          await runMatrix({ id: "I01", table, operation, expected: { [ANON]: DENY }, run: cases[operation] });
        }
      }
      expectMatrixClean("I01");
    });

    it("T-LEAD-I02 — authenticated não-admin sem acesso às três tabelas", async () => {
      for (const table of TABLES) {
        const cases = accessCases(table);
        for (const operation of OPERATIONS) {
          await runMatrix({ id: "I02", table, operation, expected: { [NON_ADMIN]: DENY }, run: cases[operation] });
        }
      }
      expectMatrixClean("I02");
    });

    it("T-LEAD-I03 — admin lê e atualiza leads; coluna fora da lista da PRP-01 é rejeitada (PV-06, lado negativo)", async () => {
      const cases = accessCases("leads");
      await runMatrix({ id: "I03", table: "leads", operation: "SELECT", expected: { [ADMIN]: ALLOW, [SERVICE]: ALLOW }, run: cases.SELECT });
      await runMatrix({ id: "I03", table: "leads", operation: "UPDATE", expected: { [ADMIN]: ALLOW, [SERVICE]: ALLOW }, run: cases.UPDATE });
      expectMatrixClean("I03");

      const id = await newLeadId();
      const before = legacyFingerprint(await legacyRow(svc(), id));
      const forbidden: Array<[string, unknown]> = [
        ["name", "alterado"], ["company", "alterado"], ["email", "alterado@example.test"],
        ["whatsapp", "5511999999999"], ["segment", "alterado"], ["size", "99"],
        ["solution", "alterado"], ["message", "alterado"], ["source", "alterado"],
        ["ip_hash", "alterado"], ["created_at", "2020-01-01T00:00:00+00:00"], ["id", randomUUID()],
      ];
      for (const [column, value] of forbidden) {
        const { error } = await admin().from("leads").update({ [column]: value }).eq("id", id);
        expect(error?.code, `UPDATE de ${column} pelo admin`).toBe("42501");
      }
      // Misturar coluna permitida e proibida nega o comando inteiro (nada é gravado pela metade).
      const mixed = await admin().from("leads").update({ status: "in_review", message: "alterado" }).eq("id", id);
      expect(mixed.error?.code).toBe("42501");

      expect(legacyFingerprint(await legacyRow(svc(), id))).toBe(before);
      expect((await readLead(svc(), id)).status).toBe("new");
    });

    // Só na fase post015: a 016 retira o DELETE de `authenticated` (ver T-LEAD-016-01 a 016-03 abaixo).
    it.skipIf(!e2PhaseIs("post015"))("T-LEAD-I04 — admin exclui lead pela sessão (sucesso só com 1 linha); não-admin não exclui", async () => {
      const cases = accessCases("leads");
      await runMatrix({
        id: "I04",
        table: "leads",
        operation: "DELETE",
        expected: { [ANON]: DENY, [NON_ADMIN]: DENY, [ADMIN]: ALLOW, [SERVICE]: ALLOW },
        run: cases.DELETE,
      });
      expectMatrixClean("I04");

      const id = await newLeadId();
      const denied = await clients().nonAdmin.from("leads").delete().eq("id", id).select("id");
      expect(denied.data ?? []).toHaveLength(0);
      expect((await readLead(svc(), id)).id).toBe(id);

      const first = await admin().from("leads").delete().eq("id", id).select("id");
      expect(first.error).toBeNull();
      expect(first.data).toHaveLength(1);
      const second = await admin().from("leads").delete().eq("id", id).select("id");
      expect(second.error).toBeNull();
      expect(second.data).toHaveLength(0); // 0 linhas nunca é sucesso
    });

    it.skipIf(!e2PhaseIs("post016"))("T-LEAD-016-01 — DELETE de leads negado a admin e não-admin (negação efetiva, registro preservado)", async () => {
      const cases = accessCases("leads");
      await runMatrix({
        id: "016-01",
        table: "leads",
        operation: "DELETE",
        expected: { [ANON]: DENY, [NON_ADMIN]: DENY, [ADMIN]: DENY, [SERVICE]: ALLOW },
        run: cases.DELETE,
      });
      expectMatrixClean("016-01");

      const id = await newLeadId();
      const before = legacyFingerprint(await legacyRow(svc(), id));
      for (const [papel, cliente] of [["não-admin", clients().nonAdmin], ["admin", admin()]] as const) {
        const attempt = await cliente.from("leads").delete().eq("id", id).select("id");
        // Negação efetiva: nunca devolve a linha excluída; se houver erro, é de privilégio (42501).
        expect(attempt.data ?? [], `${papel}: nenhuma linha excluída`).toHaveLength(0);
        if (attempt.error) expect(attempt.error.code, `${papel}: código do erro`).toBe("42501");
      }
      expect((await readLead(svc(), id)).id).toBe(id);
      expect(legacyFingerprint(await legacyRow(svc(), id))).toBe(before); // nenhuma coluna mudou
    });

    it.skipIf(!e2PhaseIs("post016"))("T-LEAD-016-02 — service_role preserva INSERT e DELETE em leads (formulário de contato e limpeza)", async () => {
      const id = await newLeadId(); // INSERT pelo service_role, como faz o /api/contact
      const removed = await svc().from("leads").delete().eq("id", id).select("id");
      expect(removed.error).toBeNull();
      expect(removed.data).toHaveLength(1);
      expect((await svc().from("leads").select("id").eq("id", id)).data ?? []).toHaveLength(0);
    });

    it.skipIf(!e2PhaseIs("post016"))("T-LEAD-016-03 — arquivar e restaurar pelo admin e o UPDATE limitado continuam valendo", async () => {
      const id = await newLeadId();
      expect((await adminUpdate(id, { archived_at: new Date().toISOString() })).error).toBeNull();
      expect((await adminUpdate(id, { archived_at: null })).error).toBeNull();
      expect((await activityOf(svc(), id)).map((row) => row.kind)).toEqual(["archived", "restored"]);
      const outside = await admin().from("leads").update({ message: "alterado" }).eq("id", id);
      expect(outside.error?.code).toBe("42501"); // coluna fora da PRP-01
      const read = await admin().from("leads").select("id,status").eq("id", id); // SELECT preservado
      expect(read.error).toBeNull();
      expect(read.data).toHaveLength(1);
    });

    it("T-LEAD-I05 — notas: INSERT com author_id alheio é negado; UPDATE e DELETE são negados", async () => {
      const row = (authorId: string | null) => ({
        id: randomUUID(), lead_id: fxLead.id, author_id: authorId, body: "nota sintética E2",
      });
      const k = clients();
      await check({
        table: "lead_notes [I05]", role: ADMIN, operation: "INSERT", expected: ALLOW,
        observe: () => observeInsert(k.admin, svc(), registry, "lead_notes", "id", row(k.adminUserId)),
      });
      await check({
        table: "lead_notes [I05]", role: ADMIN, operation: "INSERT", expected: DENY,
        observe: () => observeInsert(k.admin, svc(), registry, "lead_notes", "id", row(k.nonAdminUserId)),
      });
      await check({
        table: "lead_notes [I05]", role: ADMIN, operation: "INSERT", expected: DENY,
        observe: () => observeInsert(k.admin, svc(), registry, "lead_notes", "id", row(null)),
      });
      await check({
        table: "lead_notes [I05]", role: NON_ADMIN, operation: "INSERT", expected: DENY,
        observe: () => observeInsert(k.nonAdmin, svc(), registry, "lead_notes", "id", row(k.nonAdminUserId)),
      });
      await check({
        table: "lead_notes [I05]", role: ADMIN, operation: "UPDATE", expected: DENY,
        observe: async () => observeUpdate(k.admin, svc(), await makeNote(svc(), registry, fxLead.id, k.adminUserId), "body", "alterada"),
      });
      await check({
        table: "lead_notes [I05]", role: ADMIN, operation: "DELETE", expected: DENY,
        observe: async () => observeDelete(k.admin, svc(), await makeNote(svc(), registry, fxLead.id, k.adminUserId)),
      });
      expectMatrixClean("I05");
    });

    it("T-LEAD-I11 — admin não insere, altera nem exclui lead_activity pela API; só o trigger escreve", async () => {
      const cases = accessCases("lead_activity");
      for (const operation of ["INSERT", "UPDATE", "DELETE"] as const) {
        await runMatrix({
          id: "I11", table: "lead_activity", operation,
          expected: { [ANON]: DENY, [NON_ADMIN]: DENY, [ADMIN]: DENY, [SERVICE]: ALLOW }, run: cases[operation],
        });
      }
      expectMatrixClean("I11");

      // O trigger, sim, escreve: um UPDATE legítimo do admin cria exatamente 1 linha de histórico.
      const id = await newLeadId();
      const before = (await activityOf(svc(), id)).length;
      expect((await adminUpdate(id, { status: "in_review" })).error).toBeNull();
      expect((await activityOf(svc(), id)).length).toBe(before + 1);

      // O schema `rc2_internal` não pode estar exposto na Data API. Uma chamada
      // sem schema falharia por qualquer motivo (a função é de trigger), então a
      // sonda mira o schema: o PostgREST responde PGRST106 (schema fora de
      // `db-schemas`) para qualquer papel, inclusive service_role.
      for (const [papel, cliente] of [["admin", admin()], ["service_role", svc()]] as const) {
        const rpc = await cliente.schema("rc2_internal").rpc("leads_record_activity");
        expect(rpc.error, `rc2_internal exposto na Data API (${papel}, rpc)`).not.toBeNull();
        expect(rpc.error?.code, `${papel}: o erro deve ser de schema não exposto (PGRST106), não de função/permissão`).toBe("PGRST106");

        const tabela = await cliente.schema("rc2_internal").from("leads_record_activity").select("*").limit(1);
        expect(tabela.error, `rc2_internal exposto na Data API (${papel}, from)`).not.toBeNull();
        expect(tabela.error?.code).toBe("PGRST106");
      }
    });

    it("T-LEAD-I16 — admin não grava updated_at nem status_updated_at diretamente (PRP-01, PV-06 lado negativo)", async () => {
      const id = await newLeadId();
      const before = await readLead(svc(), id);
      const attempts: Array<Record<string, unknown>> = [
        { updated_at: "2020-01-01T00:00:00+00:00" },
        { status_updated_at: "2020-01-01T00:00:00+00:00" },
        { updated_at: "2020-01-01T00:00:00+00:00", status_updated_at: "2020-01-01T00:00:00+00:00" },
        { status: "in_review", updated_at: "2020-01-01T00:00:00+00:00" },
      ];
      for (const patch of attempts) {
        const { error } = await admin().from("leads").update(patch).eq("id", id);
        expect(error?.code, `UPDATE direto de ${Object.keys(patch).join("+")}`).toBe("42501");
      }
      const after = await readLead(svc(), id);
      expect(after).toEqual(before); // nada mudou, inclusive o status da tentativa mista
      expect(await activityOf(svc(), id)).toHaveLength(0);
    });
  });

  describe("integridade, constraints e histórico", () => {
    it("T-LEAD-I06 — excluir lead remove notas e atividade (CASCADE com RLS ativa; PV-05)", async () => {
      const id = await newLeadId();
      await makeNote(svc(), registry, id, clients().adminUserId, "nota que deve sumir");
      expect((await adminUpdate(id, { status: "in_review" })).error).toBeNull(); // gera atividade pelo trigger
      expect((await notesOf(svc(), id)).length).toBe(1);
      expect((await activityOf(svc(), id)).length).toBe(1);

      // post015: o admin exclui pela sessão; post016: o DELETE de authenticated não existe mais, e o CASCADE
      // é provado com o service_role (a FK e o CASCADE independem do papel que exclui).
      const deleter = e2PhaseIs("post015") ? admin() : svc();
      const removed = await deleter.from("leads").delete().eq("id", id).select("id");
      expect(removed.error).toBeNull();
      expect(removed.data).toHaveLength(1);

      expect(await notesOf(svc(), id)).toHaveLength(0);
      expect(await activityOf(svc(), id)).toHaveLength(0);
      const left = await svc().from("leads").select("id").eq("id", id);
      expect(left.data ?? []).toHaveLength(0);
    });

    it("T-LEAD-I07 — migration sobre linhas existentes: todas `new`, updated_at = created_at, colunas antigas intactas", async () => {
      let manifest: { seeded: Array<{ id: string; created_at: string; fingerprint: string }> };
      try {
        manifest = JSON.parse(readFileSync(LEGACY_MANIFEST_PATH, "utf8"));
      } catch {
        throw new HarnessError(
          "Manifesto da fase pré-015 ausente: execute RC2_E2_PHASE=pre015 ANTES de aplicar a migration (e2-leads-pre015.test.ts).",
        );
      }
      expect(manifest.seeded.length).toBeGreaterThan(0);
      legacySeedIds = manifest.seeded.map((row) => row.id); // para a limpeza ao final

      for (const seed of manifest.seeded) {
        const legacy = await legacyRow(svc(), seed.id);
        expect(legacyFingerprint(legacy), `colunas históricas de ${seed.id.slice(0, 8)}`).toBe(seed.fingerprint);

        const lead = await readLead(svc(), seed.id);
        expect(lead.status).toBe("new");
        expect(lead.status_updated_at).toBeNull();
        expect(lead.next_action).toBeNull();
        expect(lead.next_action_at).toBeNull();
        expect(lead.archived_at).toBeNull();
        expect(lead.created_at).toBe(seed.created_at);
        // Backfill: updated_at é o created_at histórico, e NÃO o instante da migration.
        expect(lead.updated_at).toBe(lead.created_at);
        expect(lead.updated_at).toMatch(/^20(20|21)-/);

        expect(await activityOf(svc(), seed.id)).toHaveLength(0); // o backfill não gera atividade
        expect(await notesOf(svc(), seed.id)).toHaveLength(0);
      }
    });

    it("T-LEAD-I08 — o trigger registra atividade para status, próxima ação, arquivar e restaurar (PV-06, lado positivo)", async () => {
      const id = await newLeadId();
      const k = clients();
      const start = await readLead(svc(), id);

      await sleep(15);
      expect((await adminUpdate(id, { status: "in_review" })).error).toBeNull();
      const afterStatus = await readLead(svc(), id);
      expect(afterStatus.status).toBe("in_review");
      // PV-06: o admin não tem UPDATE em updated_at/status_updated_at e, ainda assim, o trigger os grava.
      expect(afterStatus.status_updated_at).not.toBeNull();
      expect(afterStatus.updated_at).not.toBe(start.updated_at);
      expect(afterStatus.status_updated_at).toBe(afterStatus.updated_at); // mesma transação, mesmo now()

      await sleep(15);
      expect((await adminUpdate(id, { next_action: "ligar amanhã", next_action_at: "2026-12-01T12:00:00+00:00" })).error).toBeNull();
      await sleep(15);
      expect((await adminUpdate(id, { archived_at: "2026-12-02T12:00:00+00:00" })).error).toBeNull();
      await sleep(15);
      expect((await adminUpdate(id, { archived_at: null })).error).toBeNull();

      const rows = await activityOf(svc(), id);
      expect(rows.map((row) => row.kind)).toEqual(["status_changed", "next_action_changed", "archived", "restored"]);
      expect(rows[0]).toMatchObject({ from_value: "new", to_value: "in_review", actor_id: k.adminUserId });
      for (const row of rows.slice(1)) {
        expect(row.actor_id).toBe(k.adminUserId);
        expect(row.from_value).toBeNull(); // o texto da próxima ação nunca é copiado (sem PII)
        expect(row.to_value).toBeNull();
      }
      const end = await readLead(svc(), id);
      expect(end.status_updated_at).toBe(afterStatus.status_updated_at); // só o status move esse campo

      // Rastreabilidade: escrita do service_role também gera histórico, com ator nulo.
      expect((await svc().from("leads").update({ status: "contacted" }).eq("id", id)).error).toBeNull();
      const last = (await activityOf(svc(), id)).at(-1);
      expect(last).toMatchObject({ kind: "status_changed", from_value: "in_review", to_value: "contacted", actor_id: null });
    });

    it("T-LEAD-I09 — constraints e nulabilidade rejeitam estados inválidos, incluindo NULL em lead_activity", async () => {
      const id = await newLeadId();
      const code = (error: { code?: string } | null): string | undefined => error?.code;

      // leads
      expect(code((await svc().from("leads").update({ status: "arquivado" }).eq("id", id)).error), "status inválido").toBe("23514");
      expect(code((await svc().from("leads").update({ status: null }).eq("id", id)).error), "status NULL").toBe("23502");
      for (const status of LEAD_STATUSES) {
        expect((await svc().from("leads").update({ status }).eq("id", id)).error, `status ${status}`).toBeNull();
      }
      expect(code((await svc().from("leads").update({ next_action: "x".repeat(LEAD_NEXT_ACTION_MAX_LENGTH + 1) }).eq("id", id)).error), "next_action 281").toBe("23514");
      expect((await svc().from("leads").update({ next_action: "x".repeat(LEAD_NEXT_ACTION_MAX_LENGTH) }).eq("id", id)).error, "next_action 280").toBeNull();

      // lead_notes
      const note = (body: string) => svc().from("lead_notes").insert({ id: randomUUID(), lead_id: id, author_id: null, body });
      expect(code((await note("")).error), "nota vazia").toBe("23514");
      expect(code((await note("x".repeat(LEAD_NOTE_MAX_LENGTH + 1))).error), "nota 2001").toBe("23514");
      expect((await note("x".repeat(LEAD_NOTE_MAX_LENGTH))).error, "nota 2000").toBeNull();
      expect(code((await svc().from("lead_notes").insert({ id: randomUUID(), lead_id: randomUUID(), author_id: null, body: "órfã" })).error), "FK de lead").toBe("23503");

      // lead_activity: contrato idêntico ao tipo LeadActivity (status_changed carrega os dois valores; os demais, nenhum)
      const activity = (row: Record<string, unknown>) =>
        svc().from("lead_activity").insert({ id: randomUUID(), lead_id: id, ...row });
      expect(code((await activity({ kind: "inexistente" })).error), "kind inválido").toBe("23514");
      expect(code((await activity({ kind: "status_changed", from_value: null, to_value: null })).error), "status_changed com NULL/NULL").toBe("23514");
      expect(code((await activity({ kind: "status_changed", from_value: "new", to_value: null })).error), "status_changed sem to_value").toBe("23514");
      expect(code((await activity({ kind: "status_changed", from_value: null, to_value: "closed" })).error), "status_changed sem from_value").toBe("23514");
      expect(code((await activity({ kind: "status_changed", from_value: "new", to_value: "invalido" })).error), "status_changed com valor inválido").toBe("23514");
      for (const kind of LEAD_ACTIVITY_KINDS.filter((k) => k !== "status_changed")) {
        expect(code((await activity({ kind, from_value: "new", to_value: null })).error), `${kind} com from_value`).toBe("23514");
        expect(code((await activity({ kind, from_value: null, to_value: "new" })).error), `${kind} com to_value`).toBe("23514");
        expect((await activity({ kind, from_value: null, to_value: null })).error, `${kind} válido`).toBeNull();
      }
      expect((await activity({ kind: "status_changed", from_value: "new", to_value: "closed" })).error, "status_changed válido").toBeNull();
    });

    it("T-LEAD-I10 — remover o usuário zera author_id/actor_id e preserva a nota e o histórico", async () => {
      const user = await makeDisposableUser(svc(), tag(), "autor");
      const id = await newLeadId();
      const note = await makeNote(svc(), registry, id, user.id, "nota que deve sobreviver ao autor");
      const activity = await makeActivity(svc(), registry, id, user.id);
      expect(await columnOf("lead_notes", "id", note.id, "author_id")).toBe(user.id);

      const removed = await svc().auth.admin.deleteUser(user.id);
      expect(removed.error).toBeNull();

      const rows = await notesOf(svc(), id);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ id: note.id, author_id: null, body: "nota que deve sobreviver ao autor" });
      const history = (await activityOf(svc(), id)).find((row) => row.id === activity.id);
      expect(history).toBeDefined();
      expect(history?.actor_id).toBeNull();
    });
  });

  describe("triggers, normalização e concorrência", () => {
    it("T-LEAD-I12 — UPDATE sem mudança real não gera atividade nem altera updated_at/status_updated_at", async () => {
      const id = await newLeadId();
      const stable = async (label: string, patch: Record<string, unknown>, expectChange = false) => {
        const before = await readLead(svc(), id);
        const eventsBefore = (await activityOf(svc(), id)).length;
        await sleep(15);
        expect((await adminUpdate(id, patch)).error, label).toBeNull();
        const after = await readLead(svc(), id);
        expect(after.status_updated_at, `${label}: status_updated_at`).toBe(before.status_updated_at);
        expect((await activityOf(svc(), id)).length, `${label}: atividade`).toBe(eventsBefore);
        if (expectChange) expect(after.updated_at, `${label}: updated_at`).not.toBe(before.updated_at);
        else expect(after.updated_at, `${label}: updated_at`).toBe(before.updated_at);
      };

      await stable("mesmo status", { status: "new" });
      await stable("'' vira NULL", { next_action: "" });
      await stable("espaços viram NULL", { next_action: "    " });
      await stable("mesma próxima ação NULL", { next_action: null, next_action_at: null });

      expect((await adminUpdate(id, { next_action: "retornar" })).error).toBeNull();
      await stable("mesma próxima ação com texto", { next_action: "retornar" });
      await stable("mesma próxima ação com espaços ao redor", { next_action: "  retornar  " });

      expect((await adminUpdate(id, { archived_at: "2026-12-01T10:00:00+00:00" })).error).toBeNull();
      // archived_at não nulo → outro não nulo é mudança REAL (SDD I12 e §9.3, esclarecidos na A5):
      // updated_at MUDA, status_updated_at fica intacto e nenhum evento (archived/restored) é gerado.
      await stable("archived_at de um valor para outro", { archived_at: "2026-12-02T10:00:00+00:00" }, true);
    });

    it("T-LEAD-I13 — mudança simultânea de next_action e next_action_at gera um único next_action_changed", async () => {
      const id = await newLeadId();
      expect((await adminUpdate(id, { next_action: "enviar proposta", next_action_at: "2026-12-10T09:00:00+00:00" })).error).toBeNull();
      const kinds = (await activityOf(svc(), id)).map((row) => row.kind);
      expect(kinds).toEqual(["next_action_changed"]);

      // Mudar só a data também é um único evento; mudar o texto e a data juntos de novo, idem.
      expect((await adminUpdate(id, { next_action_at: "2026-12-11T09:00:00+00:00" })).error).toBeNull();
      expect((await adminUpdate(id, { next_action: "ligar", next_action_at: "2026-12-12T09:00:00+00:00" })).error).toBeNull();
      expect((await activityOf(svc(), id)).map((row) => row.kind)).toEqual([
        "next_action_changed", "next_action_changed", "next_action_changed",
      ]);
    });

    it("T-LEAD-I14 — concorrência: mesmo expectedUpdatedAt, um sucesso e um conflito; no-op não causa conflito falso", async () => {
      const id = await newLeadId();
      const { updated_at: expected } = await readLead(svc(), id); // texto opaco, com microssegundos, nunca via Date

      const [a, b] = await Promise.all([
        adminUpdate(id, { status: "in_review" }, expected),
        adminUpdate(id, { status: "contacted" }, expected),
      ]);
      expect(a.error).toBeNull();
      expect(b.error).toBeNull();
      const winners = [a, b].filter((result) => (result.data?.length ?? 0) === 1);
      const conflicts = [a, b].filter((result) => (result.data?.length ?? 0) === 0);
      expect(winners).toHaveLength(1); // exatamente um sucesso
      expect(conflicts).toHaveLength(1); // o outro recebe 0 linhas (conflito), sem sobrescrever
      const winnerStatus = a.data?.length === 1 ? "in_review" : "contacted";
      expect((await readLead(svc(), id)).status).toBe(winnerStatus);
      const events = await activityOf(svc(), id);
      expect(events).toHaveLength(1);
      expect(events[0].to_value).toBe(winnerStatus);

      // Um UPDATE sem mudança real entre a leitura e a escrita não invalida a trava otimista.
      const other = await newLeadId();
      const { updated_at: token } = await readLead(svc(), other);
      expect((await adminUpdate(other, { status: "new" })).error).toBeNull(); // no-op feito por "outra pessoa"
      expect((await readLead(svc(), other)).updated_at).toBe(token);
      const real = await adminUpdate(other, { status: "qualified" }, token);
      expect(real.error).toBeNull();
      expect(real.data).toHaveLength(1);
    });

    it("T-LEAD-I15 — compatibilidade das fases dos triggers (PV-28): ordem, WHEN após a normalização, service_role e update_updated_at()", async () => {
      const k = clients();

      // (1) leads_10 normaliza ANTES de leads_20/leads_30 avaliarem o WHEN: espaços em NULL não é mudança.
      const idle = await newLeadId();
      const idleBefore = await readLead(svc(), idle);
      await sleep(15);
      expect((await adminUpdate(idle, { next_action: "   " })).error).toBeNull();
      expect(await readLead(svc(), idle)).toEqual(idleBefore);
      expect(await activityOf(svc(), idle)).toHaveLength(0);

      // (2) mudança real de texto: o valor gravado já está normalizado (trigger 1) e o histórico enxerga a linha final.
      const text = await newLeadId();
      const textBefore = await readLead(svc(), text);
      await sleep(15);
      expect((await adminUpdate(text, { next_action: "  ligar  " })).error).toBeNull();
      const textAfter = await readLead(svc(), text);
      expect(textAfter.next_action).toBe("ligar");
      expect(textAfter.updated_at).not.toBe(textBefore.updated_at);
      expect(textAfter.status_updated_at).toBe(textBefore.status_updated_at);
      expect((await activityOf(svc(), text)).map((row) => row.kind)).toEqual(["next_action_changed"]);

      // (3) mudança real de status: ajusta status_updated_at E updated_at e gera exatamente 1 atividade.
      const status = await newLeadId();
      const statusBefore = await readLead(svc(), status);
      await sleep(15);
      expect((await adminUpdate(status, { status: "qualified" })).error).toBeNull();
      const statusAfter = await readLead(svc(), status);
      expect(statusAfter.status_updated_at).not.toBeNull();
      expect(statusAfter.updated_at).not.toBe(statusBefore.updated_at);
      expect(statusAfter.status_updated_at).toBe(statusAfter.updated_at);
      const history = await activityOf(svc(), status);
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({ kind: "status_changed", from_value: "new", to_value: "qualified", actor_id: k.adminUserId });

      // (4) service_role em coluna não monitorada: updated_at muda, status_updated_at não, sem atividade.
      const service = await newLeadId();
      const serviceBefore = await readLead(svc(), service);
      await sleep(15);
      expect((await svc().from("leads").update({ message: "correção operacional sintética" }).eq("id", service)).error).toBeNull();
      const serviceAfter = await readLead(svc(), service);
      expect(serviceAfter.updated_at).not.toBe(serviceBefore.updated_at);
      expect(serviceAfter.status_updated_at).toBe(serviceBefore.status_updated_at);
      expect(await activityOf(svc(), service)).toHaveLength(0);

      // (5) update_updated_at() continua servindo posts e settings, sem alteração.
      const post = await makePost(svc(), registry, tag(), "draft");
      const postBefore = await columnOf("posts", "id", post.id, "updated_at");
      await sleep(15);
      expect((await svc().from("posts").update({ title: "E2 fixture alterada" }).eq("id", post.id)).error).toBeNull();
      expect(await columnOf("posts", "id", post.id, "updated_at")).not.toBe(postBefore);

      const setting = await makeSetting(svc(), registry, tag());
      const settingBefore = await columnOf("settings", "key", setting.id, "updated_at");
      await sleep(15);
      expect((await svc().from("settings").update({ value: "alterado" }).eq("key", setting.id)).error).toBeNull();
      expect(await columnOf("settings", "key", setting.id, "updated_at")).not.toBe(settingBefore);
    });
  });

  describe("regressão do formulário público (T-LEAD-E05 no nível do banco)", () => {
    it("REGRESSAO-CONTATO — o INSERT da rota (service_role, colunas explícitas) e a consulta de rate limit seguem válidos", async () => {
      const id = randomUUID();
      registry.track("leads", "id", id);
      const email = `e2-${tag()}-${id.slice(0, 8)}@example.test`;
      const ipHash = `e2ip${id.slice(0, 12)}`;
      // Exatamente as colunas que src/app/api/contact/route.ts grava; nenhuma coluna da 015 é informada.
      const inserted = await svc().from("leads").insert({
        id, name: "Teste E2", company: "Sintético", email, whatsapp: "5500000000000",
        segment: "teste", size: "1", solution: "teste", message: "dado sintético da suíte E2",
        source: "website", ip_hash: ipHash,
      });
      expect(inserted.error).toBeNull();

      const lead = await readLead(svc(), id);
      expect(lead.status).toBe("new");
      expect(lead.status_updated_at).toBeNull();
      expect(lead.next_action).toBeNull();
      expect(lead.next_action_at).toBeNull();
      expect(lead.archived_at).toBeNull();
      expect(lead.updated_at).toBeTruthy();
      expect(new Date(lead.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(lead.created_at).getTime());
      expect(await activityOf(svc(), id)).toHaveLength(0); // INSERT não aciona o histórico

      // Consulta do rate limit (isRateLimited): mesma forma, mesmos filtros.
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const limited = await svc()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .or(`email.eq.${email},ip_hash.eq.${ipHash}`)
        .gte("created_at", oneHourAgo);
      expect(limited.error).toBeNull();
      expect(limited.count).toBe(1);
    });
  });

  describe("resumo da matriz E2", () => {
    it("todas as observações de RLS/grants coincidem com o esperado, sem resultado inconclusivo", () => {
      expect(matrixEntries().length).toBeGreaterThan(0);
      expect(mismatches()).toEqual([]);
    });
  });
});
