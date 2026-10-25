import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/server", () => ({ createSessionClient: vi.fn() }));

import { listAdminLeads } from "@/lib/admin/listAdminLeads";
import { getLeadDetail } from "@/lib/admin/getLeadDetail";
import { LEAD_LIST_COLUMNS, parseLeadListParams } from "@/lib/admin/leadList";

type Result = { data: unknown; error: { code: string } | null; count?: number | null };

// Construtor de consulta falso: registra as chamadas e resolve com os resultados enfileirados.
function fakeClient(results: Result[]) {
  const calls: Array<[string, unknown[]]> = [];
  const queue = [...results];
  const make = () => {
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "is", "not", "or", "gte", "lt", "order", "range", "limit"]) {
      builder[method] = (...args: unknown[]) => {
        calls.push([method, args]);
        return builder;
      };
    }
    builder.maybeSingle = async () => queue.shift() ?? { data: null, error: null };
    builder.then = (resolve: (value: Result) => unknown) => resolve(queue.shift() ?? { data: [], error: null, count: 0 });
    return builder;
  };
  const client = { from: (table: string) => (calls.push(["from", [table]]), make()) } as unknown as SupabaseClient;
  return { client, calls };
}
const names = (calls: Array<[string, unknown[]]>) => calls.map(([n]) => n);

describe("listAdminLeads (RF-LEAD-01, sessão do admin)", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  it("padrão: só ativos, colunas da lista, created_at e id decrescentes, 20 por página", async () => {
    const { client, calls } = fakeClient([{ data: [{ id: "1" }], error: null, count: 45 }]);
    const result = await listAdminLeads(parseLeadListParams({ page: "2" }), client);
    expect(result).toMatchObject({ ok: true, total: 45, page: 2, pageSize: 20, pageCount: 3 });
    expect(calls).toContainEqual(["from", ["leads"]]);
    expect(calls).toContainEqual(["select", [LEAD_LIST_COLUMNS, { count: "exact", head: false }]]);
    expect(calls).toContainEqual(["is", ["archived_at", null]]);
    expect(calls).toContainEqual(["order", ["created_at", { ascending: false }]]);
    expect(calls).toContainEqual(["order", ["id", { ascending: false }]]);
    expect(calls).toContainEqual(["range", [20, 39]]);
  });

  it("aplica status, solução, arquivados, período e busca literal", async () => {
    const { client, calls } = fakeClient([{ data: [], error: null, count: 0 }]);
    await listAdminLeads(
      parseLeadListParams({ q: "100%_ok", status: "new", solution: "E-commerce", archived: "only", from: "2026-10-01", to: "2026-10-02" }),
      client,
    );
    expect(calls).toContainEqual(["eq", ["status", "new"]]);
    expect(calls).toContainEqual(["eq", ["solution", "E-commerce"]]);
    expect(calls).toContainEqual(["not", ["archived_at", "is", null]]);
    expect(names(calls)).not.toContain("is");
    expect(calls).toContainEqual(["gte", ["created_at", "2026-10-01T03:00:00.000Z"]]);
    expect(calls).toContainEqual(["lt", ["created_at", "2026-10-03T03:00:00.000Z"]]);
    const or = calls.find(([n]) => n === "or")?.[1][0] as string;
    expect(or).toContain("name.ilike.");
    expect(or).toContain("message.ilike.");
    expect(or).toContain("\\\\%"); // `%` do termo escapado: busca literal
    expect(or).toContain("\\\\_");
  });

  it("solução `other` exclui todas as opções conhecidas", async () => {
    const { client, calls } = fakeClient([{ data: [], error: null, count: 0 }]);
    await listAdminLeads(parseLeadListParams({ solution: "other", archived: "all" }), client);
    const not = calls.find(([n, a]) => n === "not" && a[0] === "solution")?.[1];
    expect(not?.[1]).toBe("in");
    expect(not?.[2]).toContain('"E-commerce"');
    expect(not?.[2]).toContain('"Conectar sistemas, planilhas ou CRM"');
    expect(names(calls)).not.toContain("is");
  });

  it("ordenação por próxima ação: data crescente com nulos por último, desempate por id", async () => {
    const { client, calls } = fakeClient([{ data: [], error: null, count: 0 }]);
    await listAdminLeads(parseLeadListParams({ sort: "next_action" }), client);
    expect(calls).toContainEqual(["order", ["next_action_at", { ascending: true, nullsFirst: false }]]);
    expect(calls).toContainEqual(["order", ["id", { ascending: true }]]);
  });

  it("erro de consulta vira { ok:false }, nunca lista vazia, e o log não leva o termo de busca", async () => {
    const { client } = fakeClient([{ data: null, error: { code: "42501" } }]);
    const result = await listAdminLeads(parseLeadListParams({ q: "segredo@example.test" }), client);
    expect(result).toEqual({ ok: false, error: "query_failed" });
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("segredo");
  });

  it("página além do total (PGRST103): devolve o total para o chamador redirecionar", async () => {
    const { client } = fakeClient([
      { data: null, error: { code: "PGRST103" } },
      { data: null, error: null, count: 45 },
    ]);
    const result = await listAdminLeads(parseLeadListParams({ page: "9" }), client);
    expect(result).toMatchObject({ ok: true, items: [], total: 45, page: 9, pageCount: 3 });
  });
});

describe("getLeadDetail", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  it("lead inexistente (ou escondido pela RLS) é not_found", async () => {
    const { client } = fakeClient([{ data: null, error: null }]);
    expect(await getLeadDetail("450ceabd-d97d-484a-b927-00bce606e87a", client)).toEqual({ ok: false, error: "not_found" });
  });

  it("erro em qualquer consulta é query_failed", async () => {
    const lead = { data: { id: "1" }, error: null };
    expect(await getLeadDetail("x", fakeClient([{ data: null, error: { code: "XX000" } }]).client)).toEqual({ ok: false, error: "query_failed" });
    expect(
      await getLeadDetail("x", fakeClient([lead, { data: null, error: { code: "42501" } }, { data: [], error: null }]).client),
    ).toEqual({ ok: false, error: "query_failed" });
  });

  it("carrega lead, notas e histórico; sinaliza truncamento acima do limite", async () => {
    const many = Array.from({ length: 201 }, (_, i) => ({ id: String(i) }));
    const { client, calls } = fakeClient([{ data: { id: "1", name: "Ana" }, error: null }, { data: many, error: null }, { data: [], error: null }]);
    const result = await getLeadDetail("1", client);
    expect(result).toMatchObject({ ok: true, notesTruncated: true, activityTruncated: false });
    expect(result.ok && result.notes).toHaveLength(200);
    expect(JSON.stringify(calls)).not.toContain("ip_hash");
  });
});
