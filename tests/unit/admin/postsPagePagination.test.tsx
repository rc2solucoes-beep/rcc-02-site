import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// D3 / RF-CMS-07 (SDD 6.1 e 9): página além do total redireciona para a última página.
// Exercita a página real com a camada de dados real; só o cliente Supabase é falso.

type Result = { data: unknown[] | null; error: { code: string } | null; count: number | null };

const state = vi.hoisted(() => ({ queue: [] as unknown[], redirects: [] as string[] }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    state.redirects.push(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => {
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "or", "gte", "lt", "order", "range"]) builder[method] = () => builder;
    builder.then = (resolve: (value: Result) => unknown) =>
      resolve((state.queue.shift() as Result | undefined) ?? { data: [], error: null, count: 0 });
    return { from: () => builder };
  },
}));

import PostsPage from "@/app/admin/(protected)/posts/page";

const row = (n: number) => ({ id: String(n), slug: `s${n}`, title: `t${n}`, status: "draft" });

async function visit(search: Record<string, string>): Promise<{ redirectedTo: string | null; thrown: unknown }> {
  state.redirects = [];
  try {
    render(await PostsPage({ searchParams: Promise.resolve(search) }));
    return { redirectedTo: null, thrown: null };
  } catch (thrown) {
    return { redirectedTo: state.redirects[0] ?? null, thrown };
  }
}

describe("/admin/posts: página fora do alcance (D3)", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    state.queue = [];
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
    cleanup();
  });

  it("page=99 com 3 páginas (lista vazia com total 41) redireciona para a página 3", async () => {
    state.queue = [{ data: [], error: null, count: 41 }];
    expect((await visit({ page: "99" })).redirectedTo).toBe("/admin/posts?page=3");
  });

  it("page=99 com PGRST103/416 obtém o total e redireciona para a página 3", async () => {
    state.queue = [
      { data: null, error: { code: "PGRST103" }, count: null },
      { data: null, error: null, count: 41 },
    ];
    expect((await visit({ page: "99" })).redirectedTo).toBe("/admin/posts?page=3");
  });

  it("page=3 com 3 páginas permanece na página 3, sem redirecionar", async () => {
    state.queue = [{ data: [row(1)], error: null, count: 41 }];
    const { redirectedTo, thrown } = await visit({ page: "3" });
    expect(redirectedTo).toBeNull();
    expect(thrown).toBeNull();
  });

  it("total=0 com page=5 (lista vazia) mostra o estado vazio, sem redirecionar nem laço", async () => {
    state.queue = [{ data: [], error: null, count: 0 }];
    const { redirectedTo, thrown } = await visit({ page: "5" });
    expect(redirectedTo).toBeNull();
    expect(thrown).toBeNull();
    expect(screen.getByText(/Nenhum post ainda/)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("total=0 com page=5 e PGRST103 mostra o estado vazio, sem redirecionar", async () => {
    state.queue = [
      { data: null, error: { code: "PGRST103" }, count: null },
      { data: null, error: null, count: 0 },
    ];
    const { redirectedTo, thrown } = await visit({ page: "5" });
    expect(redirectedTo).toBeNull();
    expect(thrown).toBeNull();
  });

  it("o redirecionamento preserva q, status, from, to e dir", async () => {
    state.queue = [{ data: [], error: null, count: 41 }];
    const { redirectedTo } = await visit({
      page: "99",
      q: "erp",
      status: "draft",
      from: "2026-01-01",
      to: "2026-03-31",
      dir: "asc",
    });
    const url = new URL(redirectedTo ?? "", "http://x");
    expect(url.pathname).toBe("/admin/posts");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      q: "erp",
      status: "draft",
      from: "2026-01-01",
      to: "2026-03-31",
      dir: "asc",
      page: "3",
    });
  });

  it("erro real de consulta mostra o estado de erro, não vazio nem redirecionamento", async () => {
    state.queue = [{ data: null, error: { code: "42703" }, count: null }];
    const { redirectedTo, thrown } = await visit({ page: "99" });
    expect(redirectedTo).toBeNull();
    expect(thrown).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("Não foi possível carregar os posts");
    expect(screen.queryByText(/Nenhum post/)).toBeNull();
    expect(JSON.stringify(errorSpy.mock.calls)).toContain("42703");
  });

  it("PGRST103 seguido de falha na contagem é erro, não redirecionamento", async () => {
    state.queue = [
      { data: null, error: { code: "PGRST103" }, count: null },
      { data: null, error: { code: "XX000" }, count: null },
    ];
    const { redirectedTo, thrown } = await visit({ page: "99" });
    expect(redirectedTo).toBeNull();
    expect(thrown).toBeNull();
  });
});
