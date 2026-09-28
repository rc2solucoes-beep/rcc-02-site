import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement } from "react";
import type { Post } from "@/lib/types/post";

/**
 * IDX-01 — soft 404 em /blog/[slug] (docs/seo/01-indexacao-rastreamento.md).
 *
 * O status HTTP real é provado por `tests/e2e/blog-not-found.spec.ts`. Aqui
 * ficam as regras que produzem esse status:
 *   - só "post não existe" vira 404; falha de banco lança;
 *   - uma consulta por request, compartilhada por metadata e página;
 *   - nenhum `loading.tsx` acima da página (streaming fixa o 200);
 *   - slugs novos continuam renderizando sob demanda.
 */

const h = vi.hoisted(() => ({
  db: {
    post: null as unknown,
    error: null as { message: string } | null,
    throwOnCreate: false,
    queries: [] as string[],
  },
  admin: { ok: false },
  memos: [] as Map<string, unknown>[],
}));

function builder() {
  const filters: Record<string, unknown> = {};
  const b = {
    select: () => b,
    eq: (k: string, v: unknown) => ((filters[k] = v), b),
    in: (k: string, v: unknown) => ((filters[k] = v), b),
    order: () => b,
    maybeSingle: async () => {
      h.db.queries.push(`slug=${filters.slug}`);
      return h.db.error ? { data: null, error: h.db.error } : { data: h.db.post, error: null };
    },
    then: (ok: (v: unknown) => unknown, ko: (e: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(ok, ko),
  };
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => {
    if (h.db.throwOnCreate) throw new Error("supabase indisponível (teste)");
    return { from: () => builder() };
  },
  createSessionClient: async () => ({ from: () => builder() }),
}));
vi.mock("@/lib/admin/requireAdmin", () => ({ requireAdmin: async () => h.admin }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));
vi.mock("@/components/blog/BlogPostArticle", () => ({ BlogPostArticle: () => null }));
vi.mock("@/components/blog/PreviewBanner", () => ({ PreviewBanner: () => null }));
// Fora do runtime RSC, `cache` do React não memoiza. Este mock reproduz o
// contrato (mesmos argumentos → mesma promessa) para provar que `getPost` usa.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <A extends unknown[], R>(fn: (...args: A) => R) => {
      const memo = new Map<string, R>();
      h.memos.push(memo as Map<string, unknown>);
      return (...args: A) => {
        const key = JSON.stringify(args);
        if (!memo.has(key)) memo.set(key, fn(...args));
        return memo.get(key) as R;
      };
    },
  };
});

const postModule = await import("@/app/(public)/blog/[slug]/page");
const previewModule = await import("@/app/(public)/blog/[slug]/preview/page");
const notFoundModule = await import("@/app/(public)/blog/[slug]/not-found");
const { default: GlobalNotFound } = await import("@/app/not-found");
const { blogPostUrl } = await import("@/lib/blog/url");

const NOT_FOUND = "NEXT_HTTP_ERROR_FALLBACK;404";
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

const POST = {
  id: "p1",
  slug: "post-valido",
  title: "Post válido",
  summary: "Resumo.",
  content: "<p>Conteúdo</p>",
  cover_url: null,
  cover_url_alt: null,
  og_image: null,
  og_title: null,
  og_description: null,
  seo_meta_title: null,
  seo_meta_description: null,
  seo_index_status: "index",
  status: "published",
  published_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  author_name: null,
  related_post_ids: null,
} as unknown as Post;

beforeEach(() => {
  h.db.post = null;
  h.db.error = null;
  h.db.throwOnCreate = false;
  h.db.queries = [];
  h.admin = { ok: false };
  h.memos.forEach((m) => m.clear());
});

describe("/blog/[slug] — post existente", () => {
  beforeEach(() => {
    h.db.post = POST;
  });

  it("renderiza o artigo com o post", async () => {
    const el = await postModule.default(params("post-valido"));
    expect(isValidElement(el)).toBe(true);
    expect((el as ReactElement<{ post: Post }>).props.post).toBe(POST);
  });

  it("metadata mantém canonical, robots e Open Graph do post", async () => {
    const meta = await postModule.generateMetadata(params("post-valido"));
    expect(meta.alternates?.canonical).toBe(blogPostUrl("post-valido"));
    // googleBot: tests/unit/seo/postRobotsDirectives.test.ts (SEO-ROBOTS-BLOG-01)
    expect(meta.robots).toMatchObject({ index: true, follow: true });
    expect(meta.openGraph).toMatchObject({ url: blogPostUrl("post-valido"), type: "article" });
  });

  it("metadata + página fazem uma única consulta ao post", async () => {
    await postModule.generateMetadata(params("post-valido"));
    await postModule.default(params("post-valido"));
    expect(h.db.queries).toEqual(["slug=post-valido"]);
  });
});

describe("/blog/[slug] — post inexistente", () => {
  it("a página chama notFound()", async () => {
    await expect(postModule.default(params("nao-existe"))).rejects.toThrow(NOT_FOUND);
  });

  it("a metadata também chama notFound(): nada de canonical nem robots próprios", async () => {
    await expect(postModule.generateMetadata(params("nao-existe"))).rejects.toThrow(NOT_FOUND);
  });

  it("slug fora do build é consultado no banco — publicação dinâmica sem deploy", async () => {
    await expect(postModule.default(params("post-novo-sem-deploy"))).rejects.toThrow(NOT_FOUND);
    expect(h.db.queries).toEqual(["slug=post-novo-sem-deploy"]);
  });
});

describe("/blog/[slug] — falha de banco não vira 404", () => {
  it("erro da consulta lança erro, não notFound()", async () => {
    h.db.error = { message: "connection refused" };
    const run = postModule.default(params("post-valido"));
    await expect(run).rejects.toThrow(/Falha ao buscar o post/);
    await expect(run).rejects.not.toThrow(NOT_FOUND);
  });

  it("erro na metadata também lança, não notFound()", async () => {
    h.db.error = { message: "timeout" };
    await expect(postModule.generateMetadata(params("post-valido"))).rejects.toThrow(/Falha ao buscar o post/);
  });

  it("cliente indisponível lança, não notFound()", async () => {
    h.db.throwOnCreate = true;
    await expect(postModule.default(params("post-valido"))).rejects.toThrow("supabase indisponível");
  });
});

describe("/blog/[slug] — 404 do segmento", () => {
  it("usa a mesma UI do 404 global", () => {
    expect(notFoundModule.default).toBe(GlobalNotFound);
  });

  it("não herda canonical nem `index, follow` do layout raiz", () => {
    expect(notFoundModule.metadata.robots).toEqual({ index: false, follow: false });
    expect(notFoundModule.metadata.alternates).toEqual({ canonical: null });
  });
});

describe("/blog/[slug]/preview", () => {
  it("sem admin → notFound(), sem consultar o post", async () => {
    await expect(previewModule.default(params("post-valido"))).rejects.toThrow(NOT_FOUND);
    expect(h.db.queries).toEqual([]);
  });

  it("admin + slug inexistente → notFound()", async () => {
    h.admin = { ok: true };
    await expect(previewModule.default(params("nao-existe"))).rejects.toThrow(NOT_FOUND);
  });

  it("admin + post existente (inclusive rascunho) → renderiza", async () => {
    h.admin = { ok: true };
    h.db.post = { ...POST, status: "draft" };
    const el = await previewModule.default(params("post-valido"));
    expect(isValidElement(el)).toBe(true);
  });

  it("preview nunca é indexado", () => {
    expect(previewModule.metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("/blog/[slug] — estrutura que garante o 404 real", () => {
  const root = resolve(__dirname, "../../..");
  const read = (p: string) => readFileSync(resolve(root, p), "utf8");

  // Streaming começa quando um fallback de Suspense renderiza; `loading.tsx`
  // envolve a página e todos os segmentos filhos. Com ele, o status sai 200.
  it.each([
    "src/app/loading.tsx",
    "src/app/(public)/loading.tsx",
    "src/app/(public)/blog/loading.tsx",
    "src/app/(public)/blog/[slug]/loading.tsx",
    "src/app/(public)/blog/[slug]/preview/loading.tsx",
  ])("não existe %s acima do post", (p) => {
    expect(existsSync(resolve(root, p))).toBe(false);
  });

  it("o skeleton do índice fica restrito a /blog pelo route group", () => {
    expect(existsSync(resolve(root, "src/app/(public)/blog/(index)/loading.tsx"))).toBe(true);
    expect(existsSync(resolve(root, "src/app/(public)/blog/(index)/page.tsx"))).toBe(true);
  });

  it("não restringe slugs à lista do build (dynamicParams fica no padrão)", () => {
    expect("dynamicParams" in postModule).toBe(false);
    expect(read("src/app/(public)/blog/[slug]/page.tsx")).not.toMatch(/dynamicParams/);
  });

  it("mantém ISR de 60s", () => {
    expect(postModule.revalidate).toBe(60);
  });
});
