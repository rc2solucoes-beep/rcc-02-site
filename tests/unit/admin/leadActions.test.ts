import { beforeEach, describe, expect, it, vi } from "vitest";

// Server Actions de leads (SDD §10.2, T-LEAD-U01..U05). Tudo com dublês: nenhum banco é acessado.

const ID = "450ceabd-d97d-484a-b927-00bce606e87a";
const EXPECTED = "2026-01-15T12:00:00.123456+00:00";
const ADMIN_ID = "11111111-1111-4111-8111-111111111111";

const audit = vi.fn();
const revalidate = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

type Rows = { data: unknown; error: { code: string } | null };
const state = {
  admin: { ok: true, status: 200, userId: ADMIN_ID, email: "admin@example.test" } as Record<string, unknown>,
  current: { status: "new", next_action: null, next_action_at: null, archived_at: null } as Record<string, unknown> | null,
  readError: null as null | { code: string },
  update: { data: [{ id: ID }], error: null } as Rows,
  insert: { data: [{ id: "n1" }], error: null } as Rows,
  remove: { data: [{ id: ID }], error: null } as Rows,
  calls: [] as Array<{ op: string; table: string; args: unknown[] }>,
  filters: [] as Array<[string, unknown]>,
  readsAfterUpdate: 0,
};

vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidate(p) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));
vi.mock("@/lib/admin/requireAdmin", () => ({ requireAdmin: async () => state.admin }));
vi.mock("@/lib/admin/auditLog", () => ({ writeAdminAuditLog: (input: unknown) => audit(input) }));
vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => ({
    from: (table: string) => {
      let op = "select";
      const builder: Record<string, unknown> = {};
      const result = (): Rows => {
        if (op === "update") return state.update;
        if (op === "insert") return state.insert;
        if (op === "delete") return state.remove;
        if (state.readError) return { data: null, error: state.readError };
        if (state.calls.some((c) => c.op === "update")) state.readsAfterUpdate++;
        return { data: state.current, error: null };
      };
      for (const method of ["select", "update", "insert", "delete", "eq"]) {
        builder[method] = (...args: unknown[]) => {
          if (["update", "insert", "delete"].includes(method)) {
            op = method;
            state.calls.push({ op: method, table, args });
          }
          if (method === "eq") state.filters.push([String(args[0]), args[1]]);
          return builder;
        };
      }
      builder.maybeSingle = async () => result();
      builder.then = (resolve: (v: unknown) => unknown) => resolve(result());
      return builder;
    },
  }),
}));

import {
  addLeadNote,
  archiveLead,
  deleteLead,
  restoreLead,
  setLeadNextAction,
  updateLeadStatus,
} from "@/app/admin/(protected)/leads/actions";

const events = () => audit.mock.calls.map(([input]) => (input as { event: string }).event);
const writes = () => state.calls.filter((c) => ["update", "insert", "delete"].includes(c.op));

beforeEach(() => {
  audit.mockClear();
  revalidate.mockClear();
  redirectMock.mockClear();
  state.admin = { ok: true, status: 200, userId: ADMIN_ID, email: "admin@example.test" };
  state.current = { status: "new", next_action: null, next_action_at: null, archived_at: null };
  state.readError = null;
  state.update = { data: [{ id: ID }], error: null };
  state.insert = { data: [{ id: "n1" }], error: null };
  state.remove = { data: [{ id: ID }], error: null };
  state.calls = [];
  state.filters = [];
  state.readsAfterUpdate = 0;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("autorização (requireAdmin antes de tudo)", () => {
  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
  ])("sem admin (%s): nega, audita a negação e não toca no banco", async (status, error) => {
    state.admin = { ok: false, status, userId: null, email: null };
    const results = await Promise.all([
      updateLeadStatus({ id: ID, status: "contacted", expectedUpdatedAt: EXPECTED }),
      setLeadNextAction({ id: ID, nextAction: "x", expectedUpdatedAt: EXPECTED }),
      addLeadNote({ id: ID, body: "oi" }),
      archiveLead({ id: ID, expectedUpdatedAt: EXPECTED }),
      restoreLead({ id: ID, expectedUpdatedAt: EXPECTED }),
      deleteLead({ id: ID, confirmation: "EXCLUIR" }),
    ]);
    for (const r of results) expect(r).toEqual({ ok: false, error });
    expect(state.calls).toHaveLength(0);
    expect(events()).toEqual(Array(6).fill("admin_lead_action_denied"));
  });
});

describe("updateLeadStatus", () => {
  it("entrada inválida: nada é lido nem escrito", async () => {
    expect(await updateLeadStatus({ id: ID, status: "won", expectedUpdatedAt: EXPECTED })).toEqual({ ok: false, error: "invalid" });
    expect(await updateLeadStatus({ id: "x", status: "new", expectedUpdatedAt: EXPECTED })).toEqual({ ok: false, error: "invalid" });
    expect(state.calls).toHaveLength(0);
  });

  it("status igual ao atual: unchanged, sem UPDATE e sem auditoria (SDD §10.2)", async () => {
    expect(await updateLeadStatus({ id: ID, status: "new", expectedUpdatedAt: EXPECTED })).toEqual({ ok: true, unchanged: true });
    expect(writes()).toHaveLength(0);
    expect(audit).not.toHaveBeenCalled();
  });

  it("mudança real: UPDATE só de status, com trava por id e updated_at textual, auditoria e revalidação", async () => {
    expect(await updateLeadStatus({ id: ID, status: "contacted", expectedUpdatedAt: EXPECTED })).toEqual({ ok: true });
    expect(writes()).toEqual([{ op: "update", table: "leads", args: [{ status: "contacted" }] }]);
    expect(state.filters).toContainEqual(["id", ID]);
    expect(state.filters).toContainEqual(["updated_at", EXPECTED]);
    expect(events()).toEqual(["admin_lead_status_changed"]);
    expect(audit.mock.calls[0][0]).toMatchObject({ resourceType: "lead", resourceId: ID, severity: "info" });
    expect(revalidate).toHaveBeenCalledWith("/admin/leads");
    expect(revalidate).toHaveBeenCalledWith(`/admin/leads/${ID}`);
  });

  it("T-LEAD-U02: 0 linhas com lead existente = conflito; sem lead = não encontrado; sem auditar sucesso", async () => {
    state.update = { data: [], error: null };
    expect(await updateLeadStatus({ id: ID, status: "contacted", expectedUpdatedAt: EXPECTED })).toEqual({ ok: false, error: "conflict" });
    expect(state.readsAfterUpdate).toBe(1);
    expect(audit).not.toHaveBeenCalled();

    // Lead inexistente (ou escondido pela RLS): não encontrado, sem escrever.
    state.current = null;
    state.calls = [];
    expect(await updateLeadStatus({ id: ID, status: "contacted", expectedUpdatedAt: EXPECTED })).toEqual({ ok: false, error: "not_found" });
    expect(writes()).toHaveLength(0);
  });

  it("erro do banco no UPDATE ou na leitura: failed, sem sucesso auditado", async () => {
    state.update = { data: null, error: { code: "42501" } };
    expect(await updateLeadStatus({ id: ID, status: "contacted", expectedUpdatedAt: EXPECTED })).toEqual({ ok: false, error: "failed" });
    state.readError = { code: "XX000" };
    expect(await updateLeadStatus({ id: ID, status: "contacted", expectedUpdatedAt: EXPECTED })).toEqual({ ok: false, error: "failed" });
    expect(audit).not.toHaveBeenCalled();
  });
});

describe("setLeadNextAction", () => {
  it("normaliza (apara; vazio vira nulo; data de Brasília vira UTC) e grava só os dois campos", async () => {
    expect(
      await setLeadNextAction({ id: ID, nextAction: "  Ligar  ", nextActionAt: "2026-10-20T09:30", expectedUpdatedAt: EXPECTED }),
    ).toEqual({ ok: true });
    expect(writes()[0].args[0]).toEqual({ next_action: "Ligar", next_action_at: "2026-10-20T12:30:00.000Z" });
    expect(events()).toEqual(["admin_lead_next_action_changed"]);
  });

  it("sem mudança real (inclusive '' → nulo): unchanged, sem escrita", async () => {
    expect(await setLeadNextAction({ id: ID, nextAction: "   ", nextActionAt: "", expectedUpdatedAt: EXPECTED })).toEqual({ ok: true, unchanged: true });
    state.current = { ...state.current, next_action: "Ligar", next_action_at: "2026-10-20T12:30:00+00:00" };
    expect(
      await setLeadNextAction({ id: ID, nextAction: "Ligar", nextActionAt: "2026-10-20T09:30", expectedUpdatedAt: EXPECTED }),
    ).toEqual({ ok: true, unchanged: true });
    expect(writes()).toHaveLength(0);
    expect(audit).not.toHaveBeenCalled();
  });

  it("limpar a próxima ação grava nulos", async () => {
    state.current = { ...state.current, next_action: "Ligar", next_action_at: "2026-10-20T12:30:00+00:00" };
    expect(await setLeadNextAction({ id: ID, nextAction: "", nextActionAt: "", expectedUpdatedAt: EXPECTED })).toEqual({ ok: true });
    expect(writes()[0].args[0]).toEqual({ next_action: null, next_action_at: null });
  });

  it("inválido: mais de 280 caracteres ou data ilegível", async () => {
    expect(await setLeadNextAction({ id: ID, nextAction: "a".repeat(281), expectedUpdatedAt: EXPECTED })).toEqual({ ok: false, error: "invalid" });
    expect(await setLeadNextAction({ id: ID, nextAction: "a", nextActionAt: "amanhã", expectedUpdatedAt: EXPECTED })).toEqual({ ok: false, error: "invalid" });
    expect(state.calls).toHaveLength(0);
  });

  it("conflito de versão", async () => {
    state.update = { data: [], error: null };
    expect(await setLeadNextAction({ id: ID, nextAction: "x", expectedUpdatedAt: EXPECTED })).toEqual({ ok: false, error: "conflict" });
  });
});

describe("addLeadNote", () => {
  it("insere com author_id do admin da sessão e audita sem o texto", async () => {
    expect(await addLeadNote({ id: ID, body: "  Cliente pediu retorno na sexta  " })).toEqual({ ok: true });
    expect(writes()).toEqual([
      { op: "insert", table: "lead_notes", args: [{ lead_id: ID, author_id: ADMIN_ID, body: "Cliente pediu retorno na sexta" }] },
    ]);
    expect(events()).toEqual(["admin_lead_note_added"]);
  });

  it("inválida: vazia ou com mais de 2000 caracteres", async () => {
    expect(await addLeadNote({ id: ID, body: "   " })).toEqual({ ok: false, error: "invalid" });
    expect(await addLeadNote({ id: ID, body: "a".repeat(2001) })).toEqual({ ok: false, error: "invalid" });
    expect(state.calls).toHaveLength(0);
  });

  it("lead inexistente (FK 23503) = não encontrado; outro erro = failed; 0 linhas = failed", async () => {
    state.insert = { data: null, error: { code: "23503" } };
    expect(await addLeadNote({ id: ID, body: "oi" })).toEqual({ ok: false, error: "not_found" });
    state.insert = { data: null, error: { code: "42501" } };
    expect(await addLeadNote({ id: ID, body: "oi" })).toEqual({ ok: false, error: "failed" });
    state.insert = { data: [], error: null };
    expect(await addLeadNote({ id: ID, body: "oi" })).toEqual({ ok: false, error: "failed" });
    expect(audit).not.toHaveBeenCalled();
  });
});

describe("archiveLead / restoreLead", () => {
  it("arquiva: grava archived_at, audita; restaura: grava nulo", async () => {
    expect(await archiveLead({ id: ID, expectedUpdatedAt: EXPECTED })).toEqual({ ok: true });
    const patch = writes()[0].args[0] as { archived_at: string };
    expect(Number.isNaN(Date.parse(patch.archived_at))).toBe(false);

    state.calls = [];
    state.current = { ...state.current, archived_at: "2026-10-20T00:00:00+00:00" };
    expect(await restoreLead({ id: ID, expectedUpdatedAt: EXPECTED })).toEqual({ ok: true });
    expect(writes()[0].args[0]).toEqual({ archived_at: null });
    expect(events()).toEqual(["admin_lead_archived", "admin_lead_restored"]);
  });

  it("já no estado pedido: unchanged, sem escrita nem auditoria", async () => {
    expect(await restoreLead({ id: ID, expectedUpdatedAt: EXPECTED })).toEqual({ ok: true, unchanged: true });
    state.current = { ...state.current, archived_at: "2026-10-20T00:00:00+00:00" };
    expect(await archiveLead({ id: ID, expectedUpdatedAt: EXPECTED })).toEqual({ ok: true, unchanged: true });
    expect(writes()).toHaveLength(0);
    expect(audit).not.toHaveBeenCalled();
  });

  it("conflito de versão", async () => {
    state.update = { data: [], error: null };
    expect(await archiveLead({ id: ID, expectedUpdatedAt: EXPECTED })).toEqual({ ok: false, error: "conflict" });
  });
});

describe("deleteLead (T-LEAD-U03, RF-LEAD-07)", () => {
  it.each(["", "excluir", "EXCLUIR ", "Excluir", "SIM"])("confirmação %j é recusada no servidor sem excluir", async (confirmation) => {
    expect(await deleteLead({ id: ID, confirmation })).toEqual({ ok: false, error: "invalid" });
    expect(state.calls).toHaveLength(0);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("exatamente 1 linha: audita exclusão (warn) e redireciona à lista", async () => {
    await expect(deleteLead({ id: ID, confirmation: "EXCLUIR" })).rejects.toThrow("NEXT_REDIRECT:/admin/leads");
    expect(writes()).toEqual([{ op: "delete", table: "leads", args: [] }]);
    expect(state.filters).toContainEqual(["id", ID]);
    expect(events()).toEqual(["admin_lead_deleted"]);
    expect(audit.mock.calls[0][0]).toMatchObject({ severity: "warning", resourceId: ID });
  });

  it("0 linhas não é sucesso: not_found, audita a falha e não redireciona", async () => {
    state.remove = { data: [], error: null };
    expect(await deleteLead({ id: ID, confirmation: "EXCLUIR" })).toEqual({ ok: false, error: "not_found" });
    expect(events()).toEqual(["admin_lead_delete_failed"]);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("erro do banco não é sucesso: failed e audita a falha", async () => {
    state.remove = { data: null, error: { code: "42501" } };
    expect(await deleteLead({ id: ID, confirmation: "EXCLUIR" })).toEqual({ ok: false, error: "failed" });
    expect(events()).toEqual(["admin_lead_delete_failed"]);
    expect(audit.mock.calls[0][0]).toMatchObject({ severity: "error" });
  });

  it("mais de 1 linha também é falha", async () => {
    state.remove = { data: [{ id: ID }, { id: "outro" }], error: null };
    expect(await deleteLead({ id: ID, confirmation: "EXCLUIR" })).toEqual({ ok: false, error: "failed" });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("T-LEAD-U05: a auditoria não contém dados pessoais", () => {
  it("nenhuma action grava nome, e-mail, telefone, texto de nota nem de próxima ação", async () => {
    state.current = { status: "new", next_action: null, next_action_at: null, archived_at: null };
    await updateLeadStatus({ id: ID, status: "qualified", expectedUpdatedAt: EXPECTED });
    await setLeadNextAction({ id: ID, nextAction: "Ligar para Maria Souza 11999990000", nextActionAt: "2026-10-20T09:30", expectedUpdatedAt: EXPECTED });
    await addLeadNote({ id: ID, body: "Maria Souza pediu orçamento maria@example.test" });
    await archiveLead({ id: ID, expectedUpdatedAt: EXPECTED });
    await deleteLead({ id: ID, confirmation: "EXCLUIR" }).catch(() => undefined);

    expect(audit.mock.calls.length).toBeGreaterThanOrEqual(5);
    const serialized = JSON.stringify(audit.mock.calls);
    for (const forbidden of ["Maria", "Souza", "11999990000", "maria@example.test", "orçamento", "Ligar para"]) {
      expect(serialized).not.toContain(forbidden);
    }
    for (const [input] of audit.mock.calls) {
      expect(Object.keys((input as { metadata?: Record<string, unknown> }).metadata ?? {}).every((k) => ["fields", "from", "to"].includes(k))).toBe(true);
    }
  });
});
