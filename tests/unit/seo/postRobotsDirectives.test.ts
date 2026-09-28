import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Robots } from "next/dist/lib/metadata/types/metadata-types";
import type { Post, SeoIndexStatus } from "@/lib/types/post";

/**
 * SEO-ROBOTS-BLOG-01 (docs/seo/01-indexacao-rastreamento.md).
 *
 * O `robots` do post substitui o do layout raiz inteiro (merge raso), e com
 * ele sumia o `googleBot` com `max-image-preview:large` e `max-snippet:-1`.
 * O post agora repete essas diretivas, com index/follow iguais aos do robots
 * genérico em qualquer estado editorial.
 *
 * O HTML real é provado por `tests/e2e/blog-robots-directives.spec.ts`.
 */

const h = vi.hoisted(() => ({ post: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => {
    const b = {
      from: () => b,
      select: () => b,
      eq: () => b,
      maybeSingle: async () => ({ data: h.post, error: null }),
    };
    return b;
  },
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));
vi.mock("@/components/blog/BlogPostArticle", () => ({ BlogPostArticle: () => null }));

const { generateMetadata } = await import("@/app/(public)/blog/[slug]/page");

const POST = {
  id: "p1",
  slug: "post-valido",
  title: "Post válido",
  summary: "Resumo.",
  cover_url: null,
  cover_url_alt: null,
  og_image: null,
  og_title: null,
  og_description: null,
  seo_meta_title: null,
  seo_meta_description: null,
  published_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  author_name: null,
} as unknown as Post;

async function robotsFor(status: SeoIndexStatus) {
  h.post = { ...POST, seo_index_status: status };
  const meta = await generateMetadata({ params: Promise.resolve({ slug: "post-valido" }) });
  const robots = meta.robots as Robots;
  const googleBot = robots.googleBot as Exclude<Robots["googleBot"], string | undefined>;
  return { robots, googleBot };
}

const ESTADOS: [SeoIndexStatus, boolean, boolean][] = [
  ["index", true, true],
  ["noindex", false, true],
  ["nofollow", true, false],
];

beforeEach(() => {
  h.post = null;
});

describe("robots do post por estado editorial", () => {
  it("T01 — index: index/follow no genérico e no googleBot, com preview completo", async () => {
    const { robots, googleBot } = await robotsFor("index");
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
    expect(googleBot).toEqual({ index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 });
  });

  it("T02 — noindex: segue noindex/follow, também no googleBot", async () => {
    const { robots, googleBot } = await robotsFor("noindex");
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(true);
    expect(googleBot).toEqual({ index: false, follow: true, "max-image-preview": "large", "max-snippet": -1 });
  });

  it("T03 — nofollow: segue index/nofollow, também no googleBot", async () => {
    const { robots, googleBot } = await robotsFor("nofollow");
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(false);
    expect(googleBot).toEqual({ index: true, follow: false, "max-image-preview": "large", "max-snippet": -1 });
  });

  it.each(ESTADOS)("T04 — %s: genérico e googleBot nunca divergem em index/follow", async (status, index, follow) => {
    const { robots, googleBot } = await robotsFor(status);
    expect(googleBot.index).toBe(robots.index);
    expect(googleBot.follow).toBe(robots.follow);
    expect([robots.index, robots.follow]).toEqual([index, follow]);
  });

  it.each(ESTADOS)("T05 — %s: max-image-preview:large e max-snippet:-1", async (status) => {
    const { googleBot } = await robotsFor(status);
    expect(googleBot["max-image-preview"]).toBe("large");
    expect(googleBot["max-snippet"]).toBe(-1);
  });

  it("nenhuma diretiva além das que o layout raiz já usa", async () => {
    const { robots, googleBot } = await robotsFor("index");
    expect(Object.keys(robots).sort()).toEqual(["follow", "googleBot", "index"]);
    expect(Object.keys(googleBot).sort()).toEqual(["follow", "index", "max-image-preview", "max-snippet"]);
  });
});
