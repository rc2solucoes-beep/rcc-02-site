import { cleanup, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { posts, redirectMock, dbState, cacheSpy } = vi.hoisted(() => ({
  posts: [] as unknown[],
  dbState: { error: null as unknown, calls: 0 },
  cacheSpy: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
// Passthrough: registra opções do cache e executa a função a cada chamada.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>, keyParts: string[], options: unknown) => {
    cacheSpy(keyParts, options);
    return fn;
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => {
            dbState.calls += 1;
            return dbState.error ? { data: null, error: dbState.error } : { data: posts, error: null };
          },
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/schema", () => ({
  getOrgSettings: async () => ({ og_image_url: null }),
  getOrgSettingsOrNull: async () => null,
  getWebPageSchema: () => ({}),
}));

import BlogPage, { generateMetadata } from "@/app/(public)/blog/(index)/page";

function fixture(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `id-${i + 1}`,
    slug: `post-${i + 1}`,
    title: i === 2 ? "Automação de processos" : `Artigo ${i + 1}`,
    summary: i === 4 ? "Integração entre sistemas" : `Resumo ${i + 1}`,
    cover_url: null,
    author_name: null,
    published_at: "2026-10-01T10:00:00Z",
    reading_time_minutes: 3,
  }));
}

async function renderPage(params: Record<string, string | string[]> = {}) {
  render(await BlogPage({ searchParams: Promise.resolve(params) }));
}

beforeEach(() => {
  // jsdom não implementa matchMedia (usado pelo ScrollReveal do estado vazio).
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  );
  posts.length = 0;
  dbState.error = null;
  dbState.calls = 0;
  redirectMock.mockClear();
});

describe("/blog índice", () => {
  it("canonical e links de artigo permanecem", async () => {
    posts.push(...fixture(10));
    const meta = await generateMetadata({ searchParams: Promise.resolve({}) });
    expect(meta.alternates?.canonical).toBe("https://www.rc2solucoes.com.br/blog");
    await renderPage();
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/blog/post-1");
    expect(hrefs).toContain("/blog/post-7");
    expect(hrefs).not.toContain("/blog/post-8"); // vai para a página 2
  });

  it("formulário GET acessível e links de paginação server-rendered", async () => {
    posts.push(...fixture(10));
    await renderPage();
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/blog");
    expect(screen.getByLabelText("Buscar artigos")).toHaveAttribute("name", "q");
    expect(screen.getByRole("button", { name: "Buscar" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Paginação do blog" });
    expect(within(nav).getByRole("link", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Página 2" })).toHaveAttribute("href", "/blog?pagina=2");
    expect(within(nav).getByRole("link", { name: /Próxima/ })).toHaveAttribute("href", "/blog?pagina=2");
    expect(screen.queryByText("Limpar busca")).not.toBeInTheDocument();
  });

  it("busca sem acento mostra contagem e limpar", async () => {
    posts.push(...fixture(10));
    await renderPage({ q: "AUTOMACAO" });
    expect(screen.getByRole("status")).toHaveTextContent("1 artigo encontrado para “AUTOMACAO”.");
    expect(screen.getByText("Automação de processos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpar busca" })).toHaveAttribute("href", "/blog");
    expect(screen.queryByRole("navigation", { name: "Paginação do blog" })).not.toBeInTheDocument();
  });

  it("estado vazio oferece limpar busca", async () => {
    posts.push(...fixture(3));
    await renderPage({ q: "zzz" });
    expect(screen.getByText("Nenhum artigo encontrado")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Limpar busca" }).length).toBeGreaterThan(0);
  });

  it("última página: sem destaque, sem Próxima, com Anterior", async () => {
    posts.push(...fixture(10));
    await renderPage({ pagina: "2" });
    expect(screen.queryByText("Último artigo")).not.toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Paginação do blog" });
    expect(within(nav).queryByRole("link", { name: /Próxima/ })).not.toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: /Anterior/ })).toHaveAttribute("href", "/blog");
    expect(within(nav).getByRole("link", { name: "Página 2" })).toHaveAttribute("aria-current", "page");
  });

  it("página inválida redireciona", async () => {
    posts.push(...fixture(10));
    await expect(renderPage({ pagina: "9" })).rejects.toThrow("REDIRECT:/blog?pagina=2");
    await expect(renderPage({ pagina: "x" })).rejects.toThrow("REDIRECT:/blog");
  });

  it("sem artigos mantém o estado Em breve", async () => {
    await renderPage();
    expect(screen.getByText("Ainda não há artigos publicados")).toBeInTheDocument();
  });

  describe("metadata", () => {
    const meta = (params: Record<string, string | string[]> = {}) =>
      generateMetadata({ searchParams: Promise.resolve(params) });

    it("primeira página: canonical base e indexável", async () => {
      posts.push(...fixture(10));
      const m = await meta();
      expect(m.alternates?.canonical).toBe("https://www.rc2solucoes.com.br/blog");
      expect(m.robots).toBeUndefined();
      expect(m.title).toBe("Blog");
    });

    it("página paginada: canonical próprio e indexável", async () => {
      posts.push(...fixture(10));
      const m = await meta({ pagina: "2" });
      expect(m.alternates?.canonical).toBe("https://www.rc2solucoes.com.br/blog?pagina=2");
      expect(m.robots).toBeUndefined();
      expect(m.title).toBe("Blog — Página 2");
    });

    it("página inválida cai no canonical da página válida", async () => {
      posts.push(...fixture(10));
      const m = await meta({ pagina: "9" });
      expect(m.alternates?.canonical).toBe("https://www.rc2solucoes.com.br/blog?pagina=2");
    });

    it("busca: noindex,follow e canonical base", async () => {
      posts.push(...fixture(10));
      const m = await meta({ q: "automacao" });
      expect(m.robots).toEqual({ index: false, follow: true });
      expect(m.alternates?.canonical).toBe("https://www.rc2solucoes.com.br/blog");
    });

    it("busca com pagina: continua noindex e canonical base", async () => {
      posts.push(...fixture(20));
      const m = await meta({ q: "artigo", pagina: "2" });
      expect(m.robots).toEqual({ index: false, follow: true });
      expect(m.alternates?.canonical).toBe("https://www.rc2solucoes.com.br/blog");
    });
  });

  describe("cache da lista", () => {
    it("usa chave única, sem depender de termo ou página, com revalidate 60", async () => {
      // O cache é criado uma vez no carregamento do módulo.
      expect(cacheSpy).toHaveBeenCalledTimes(1);
      expect(cacheSpy).toHaveBeenCalledWith(["blog-index-posts"], { revalidate: 60 });
    });

    it("erro do banco não vira lista vazia cacheável: a função lança e a página degrada", async () => {
      dbState.error = new Error("falha");
      await renderPage();
      expect(screen.getByText("Ainda não há artigos publicados")).toBeInTheDocument();
      // sem erro, a mesma função volta a consultar e entrega os posts
      dbState.error = null;
      posts.push(...fixture(3));
      cleanup();
      await renderPage();
      expect(screen.queryByText("Ainda não há artigos publicados")).not.toBeInTheDocument();
    });
  });
});
