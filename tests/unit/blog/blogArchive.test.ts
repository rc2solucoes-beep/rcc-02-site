import { describe, expect, it } from "vitest";
import {
  POSTS_PER_PAGE,
  buildArchiveHref,
  normalizeForSearch,
  pageWindow,
  resolveArchive,
  resolveArchiveSeo,
} from "@/lib/blogArchive";

function makePosts(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    slug: `post-${i + 1}`,
    title: `Artigo ${i + 1}`,
    summary: `Resumo do artigo ${i + 1}`,
  }));
}

const slugs = (xs: { slug: string }[]) => xs.map((x) => x.slug);

describe("busca", () => {
  it("ignora caixa e acentos, em título e resumo", () => {
    const posts = [
      { slug: "a", title: "Automação de Processos", summary: "Como começar" },
      { slug: "b", title: "Outro tema", summary: "Integração entre sistemas ERP" },
      { slug: "c", title: "Nada a ver", summary: "Texto" },
    ];
    expect(normalizeForSearch("AUTOMAÇÃO")).toBe("automacao");
    expect(slugs(resolveArchive(posts, { q: "automacao" }).items)).toEqual(["a"]);
    expect(slugs(resolveArchive(posts, { q: "INTEGRACAO erp" }).items)).toEqual(["b"]);
    expect(resolveArchive(posts, { q: "  automação   processos " }).query).toBe("automação processos");
  });

  it("sem resultado: total 0, sem destaque, página 1", () => {
    const s = resolveArchive(makePosts(3), { q: "inexistente" });
    expect(s.totalMatches).toBe(0);
    expect(s.featured).toBeNull();
    expect(s.items).toEqual([]);
    expect(s.page).toBe(1);
    expect(s.redirectTo).toBeNull();
  });

  it("busca não tem destaque", () => {
    const s = resolveArchive(makePosts(10), { q: "artigo" });
    expect(s.featured).toBeNull();
    expect(s.items).toHaveLength(POSTS_PER_PAGE);
  });
});

describe("paginação", () => {
  const posts = makePosts(20);

  it("página 1 tem destaque + 6, e nenhuma página duplica ou omite posts", () => {
    const first = resolveArchive(posts, {});
    expect(first.featured?.slug).toBe("post-1");
    expect(first.items).toHaveLength(6);
    const seen: string[] = [first.featured!.slug, ...slugs(first.items)];
    for (let p = 2; p <= first.totalPages; p++) {
      const s = resolveArchive(posts, { pagina: String(p) });
      expect(s.featured).toBeNull();
      seen.push(...slugs(s.items));
    }
    expect(seen).toEqual(slugs(posts));
    expect(first.totalPages).toBe(4); // 19 restantes / 6
  });

  it("sem perda na busca paginada", () => {
    const first = resolveArchive(posts, { q: "artigo" });
    const seen = [...slugs(first.items)];
    for (let p = 2; p <= first.totalPages; p++) {
      seen.push(...slugs(resolveArchive(posts, { q: "artigo", pagina: String(p) }).items));
    }
    expect(seen).toEqual(slugs(posts));
  });

  it("última página traz o resto", () => {
    const s = resolveArchive(posts, { pagina: "4" });
    expect(slugs(s.items)).toEqual(["post-20"]);
    expect(s.redirectTo).toBeNull();
    expect(s.rangeStart).toBe(20);
    expect(s.rangeEnd).toBe(20);
  });

  it("um único post: só destaque, uma página", () => {
    const s = resolveArchive(makePosts(1), {});
    expect(s.featured?.slug).toBe("post-1");
    expect(s.items).toEqual([]);
    expect(s.totalPages).toBe(1);
  });

  it("página inválida ou fora do intervalo redireciona para a forma canônica", () => {
    expect(resolveArchive(posts, { pagina: "99" })).toMatchObject({ page: 4, redirectTo: "/blog?pagina=4" });
    expect(resolveArchive(posts, { pagina: "abc" })).toMatchObject({ page: 1, redirectTo: "/blog" });
    expect(resolveArchive(posts, { pagina: "0" })).toMatchObject({ page: 1, redirectTo: "/blog" });
    expect(resolveArchive(posts, { pagina: "-2" })).toMatchObject({ page: 1, redirectTo: "/blog" });
    expect(resolveArchive(posts, { pagina: "1" })).toMatchObject({ page: 1, redirectTo: "/blog" });
    expect(resolveArchive(posts, { pagina: "02" })).toMatchObject({ page: 2, redirectTo: "/blog?pagina=2" });
    expect(resolveArchive(posts, { q: "artigo", pagina: "99" }).redirectTo).toBe("/blog?q=artigo&pagina=4");
    expect(resolveArchive(posts, { pagina: ["2", "3"] }).page).toBe(2);
  });

  it("lista vazia não quebra", () => {
    const s = resolveArchive([], { pagina: "3" });
    expect(s).toMatchObject({ page: 1, totalPages: 1, totalMatches: 0, featured: null });
  });
});

describe("URLs", () => {
  it("monta hrefs compartilháveis e codifica o termo", () => {
    expect(buildArchiveHref("", 1)).toBe("/blog");
    expect(buildArchiveHref("", 3)).toBe("/blog?pagina=3");
    expect(buildArchiveHref("integração erp", 1)).toBe("/blog?q=integra%C3%A7%C3%A3o+erp");
    expect(buildArchiveHref("erp", 2)).toBe("/blog?q=erp&pagina=2");
  });

  it("janela de páginas com reticências", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(5, 12)).toEqual([1, null, 4, 5, 6, null, 12]);
    expect(pageWindow(1, 12)).toEqual([1, 2, null, 12]);
  });
});

describe("resolveArchiveSeo", () => {
  it("primeira página: canonical base, indexável", () => {
    expect(resolveArchiveSeo({ query: "", page: 1 })).toEqual({ canonicalPath: "/blog", noindex: false });
  });
  it("página 2+: canonical próprio, indexável", () => {
    expect(resolveArchiveSeo({ query: "", page: 3 })).toEqual({ canonicalPath: "/blog?pagina=3", noindex: false });
  });
  it("busca: canonical base e noindex, mesmo paginada", () => {
    expect(resolveArchiveSeo({ query: "ia", page: 1 })).toEqual({ canonicalPath: "/blog", noindex: true });
    expect(resolveArchiveSeo({ query: "ia", page: 2 })).toEqual({ canonicalPath: "/blog", noindex: true });
  });
});
