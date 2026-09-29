import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * F-7 — sitemap sempre fresco (docs/seo/03-sitemap-freshness.md).
 *
 * Na Vercel, o sitemap com `revalidate` ficava congelado no deploy. Agora a
 * rota é dinâmica: cada chamada lê os posts do banco. Falha do banco lança em
 * vez de publicar um sitemap sem posts.
 */

type Row = { slug: string; updated_at: string; seo_index_status: string | null };

const h = vi.hoisted(() => ({
  rows: [] as unknown[],
  error: null as { message: string } | null,
  queries: 0,
  filtros: [] as string[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => ({
    from: (tabela: string) => ({
      select: (colunas: string) => ({
        eq: async (coluna: string, valor: string) => {
          h.queries++;
          h.filtros.push(`${tabela}:${colunas}:${coluna}=${valor}`);
          return h.error ? { data: null, error: h.error } : { data: h.rows, error: null };
        },
      }),
    }),
  }),
}));
vi.spyOn(console, "error").mockImplementation(() => {});

const modulo = await import("@/app/sitemap");
const sitemap = modulo.default;
const { BASE_URL } = await import("@/lib/siteMetadata");

const post = (slug: string, seo: string | null = "index"): Row => ({
  slug, updated_at: "2026-09-28T17:00:00.190301+00:00", seo_index_status: seo,
});
const dezesseis = Array.from({ length: 16 }, (_, i) => post(`post-${String(i + 1).padStart(2, "0")}`));
const postsNoSitemap = async () =>
  (await sitemap()).map((e) => e.url.replace(BASE_URL, "")).filter((p) => p.startsWith("/blog/"));

beforeEach(() => {
  h.rows = dezesseis;
  h.error = null;
  h.queries = 0;
  h.filtros = [];
});

describe("sitemap — configuração da rota", () => {
  it("é dinâmica (force-dynamic)", () => {
    expect(modulo.dynamic).toBe("force-dynamic");
  });

  it("não declara mais revalidate (nem fetchCache redundante)", () => {
    expect("revalidate" in modulo).toBe(false);
    expect("fetchCache" in modulo).toBe(false);
  });
});

describe("sitemap — conteúdo a partir do banco", () => {
  it("16 posts publicados e indexáveis → 16 URLs de post", async () => {
    expect(await postsNoSitemap()).toHaveLength(16);
  });

  it("uma única consulta por geração, só de posts publicados", async () => {
    await sitemap();
    expect(h.queries).toBe(1);
    expect(h.filtros).toEqual(["posts:slug,updated_at,seo_index_status:status=published"]);
  });

  it("post novo aparece na chamada seguinte, sem rebuild", async () => {
    expect(await postsNoSitemap()).toHaveLength(16);
    h.rows = [...dezesseis, post("o-post-novo")];
    const depois = await postsNoSitemap();
    expect(depois).toHaveLength(17);
    expect(depois).toContain("/blog/o-post-novo");
  });

  it("post despublicado some na chamada seguinte", async () => {
    expect(await postsNoSitemap()).toContain("/blog/post-01");
    h.rows = dezesseis.filter((p) => p.slug !== "post-01");
    expect(await postsNoSitemap()).not.toContain("/blog/post-01");
  });

  it("post noindex fica fora", async () => {
    h.rows = [...dezesseis, post("post-noindex", "noindex")];
    expect(await postsNoSitemap()).not.toContain("/blog/post-noindex");
  });

  it("post nofollow continua dentro", async () => {
    h.rows = [...dezesseis, post("post-nofollow", "nofollow")];
    expect(await postsNoSitemap()).toContain("/blog/post-nofollow");
  });

  it("mantém lastModified, changeFrequency e priority dos posts", async () => {
    const entrada = (await sitemap()).find((e) => e.url === `${BASE_URL}/blog/post-01`);
    expect(entrada).toEqual({
      url: `${BASE_URL}/blog/post-01`,
      lastModified: new Date("2026-09-28T17:00:00.190301+00:00"),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });
});

describe("sitemap — falha do banco", () => {
  it("erro do Supabase rejeita (não devolve sitemap sem posts)", async () => {
    h.error = { message: "connection refused" };
    await expect(sitemap()).rejects.toThrow("Failed to generate sitemap from published posts");
    expect(h.queries).toBe(1); // sem consulta de fallback
  });

  it("consulta bem-sucedida com zero posts continua válida (rotas estáticas)", async () => {
    h.rows = [];
    const entradas = await sitemap();
    expect(entradas.length).toBeGreaterThan(0);
    expect(entradas.some((e) => e.url.includes("/blog/"))).toBe(false);
    expect(entradas.map((e) => e.url)).toContain(`${BASE_URL}/blog`);
  });
});
