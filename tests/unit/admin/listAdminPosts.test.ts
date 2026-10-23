import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/server", () => ({ createSessionClient: vi.fn() }));

import { listAdminPosts } from "@/lib/admin/listAdminPosts";
import { POST_LIST_COLUMNS, parsePostListParams } from "@/lib/admin/postList";

type Result = { data: unknown[] | null; error: { code: string } | null; count: number | null };

// Construtor de consulta falso: registra as chamadas e resolve com os resultados enfileirados.
function fakeClient(results: Result[]) {
  const calls: Array<[string, unknown[]]> = [];
  const queue = [...results];
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "or", "gte", "lt", "order", "range"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  builder.then = (resolve: (value: Result) => unknown) => resolve(queue.shift() ?? { data: [], error: null, count: 0 });
  const client = { from: (table: string) => (calls.push(["from", [table]]), builder) } as unknown as SupabaseClient;
  return { client, calls };
}

const row = (n: number) => ({ id: String(n), slug: `s${n}`, title: `t${n}`, status: "draft" });

describe("listAdminPosts (T-CMS-I04 no nível da consulta, RF-CMS-07)", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  it("seleciona só as colunas da listagem (sem content), ordena por sort_at e id e pagina em 20", async () => {
    const { client, calls } = fakeClient([{ data: [row(1)], error: null, count: 45 }]);
    const result = await listAdminPosts(parsePostListParams({ page: "2" }), client);

    expect(result).toMatchObject({ ok: true, total: 45, page: 2, pageSize: 20, pageCount: 3 });
    const select = calls.find(([m]) => m === "select")!;
    expect(select[1][0]).toBe(POST_LIST_COLUMNS);
    expect(String(select[1][0])).not.toContain("content");
    expect(calls.filter(([m]) => m === "order").map(([, a]) => a)).toEqual([
      ["sort_at", { ascending: false }],
      ["id", { ascending: false }],
    ]);
    expect(calls.find(([m]) => m === "range")![1]).toEqual([20, 39]);
  });

  it("direção asc ordena as duas chaves em asc", async () => {
    const { client, calls } = fakeClient([{ data: [], error: null, count: 0 }]);
    await listAdminPosts(parsePostListParams({ dir: "asc" }), client);
    expect(calls.filter(([m]) => m === "order").map(([, a]) => a)).toEqual([
      ["sort_at", { ascending: true }],
      ["id", { ascending: true }],
    ]);
  });

  it("aplica status, busca literal e período de Brasília", async () => {
    const { client, calls } = fakeClient([{ data: [], error: null, count: 0 }]);
    await listAdminPosts(
      parsePostListParams({ status: "scheduled", q: "50%_off", from: "2026-10-13", to: "2026-10-13" }),
      client,
    );
    const by = (m: string) => calls.filter(([n]) => n === m).map(([, a]) => a);
    expect(by("eq")).toEqual([["status", "scheduled"]]);
    expect(by("or")[0][0]).toContain('title.ilike."%50\\\\%\\\\_off%"');
    expect(by("gte")).toEqual([["sort_at", "2026-10-13T03:00:00.000Z"]]);
    expect(by("lt")).toEqual([["sort_at", "2026-10-14T03:00:00.000Z"]]);
  });

  it("sem filtros não chama eq/or/gte/lt", async () => {
    const { client, calls } = fakeClient([{ data: [], error: null, count: 0 }]);
    await listAdminPosts(parsePostListParams({}), client);
    for (const m of ["eq", "or", "gte", "lt"]) expect(calls.some(([n]) => n === m)).toBe(false);
  });

  it("erro de consulta vira ok:false (nunca lista vazia) e o log não carrega o termo", async () => {
    const { client } = fakeClient([{ data: null, error: { code: "42703" }, count: null }]);
    const result = await listAdminPosts(parsePostListParams({ q: "segredo-de-busca", status: "draft" }), client);
    expect(result).toEqual({ ok: false, error: "query_failed" });
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).toContain("42703");
    expect(logged).toContain('"q"');
    expect(logged).not.toContain("segredo-de-busca");
  });

  it("exceção vira ok:false", async () => {
    const client = {
      from: () => {
        throw new Error("boom com termo secreto");
      },
    } as unknown as SupabaseClient;
    expect(await listAdminPosts(parsePostListParams({ q: "abc" }), client)).toEqual({ ok: false, error: "query_failed" });
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("termo secreto");
  });

  it("D3: PGRST103 busca o total e devolve página vazia para o chamador redirecionar", async () => {
    const { client } = fakeClient([
      { data: null, error: { code: "PGRST103" }, count: null },
      { data: null, error: null, count: 41 },
    ]);
    const result = await listAdminPosts(parsePostListParams({ page: "9" }), client);
    expect(result).toEqual({ ok: true, items: [], total: 41, page: 9, pageSize: 20, pageCount: 3 });
  });

  it("D3: PGRST103 seguido de falha na contagem vira ok:false", async () => {
    const { client } = fakeClient([
      { data: null, error: { code: "PGRST103" }, count: null },
      { data: null, error: { code: "XX000" }, count: null },
    ]);
    expect(await listAdminPosts(parsePostListParams({ page: "9" }), client)).toEqual({ ok: false, error: "query_failed" });
  });

  it("D3: página vazia sem erro (lista vazia além do total) devolve total e pageCount", async () => {
    const { client } = fakeClient([{ data: [], error: null, count: 41 }]);
    const result = await listAdminPosts(parsePostListParams({ page: "9" }), client);
    expect(result).toMatchObject({ ok: true, items: [], total: 41, pageCount: 3, page: 9 });
  });
});
