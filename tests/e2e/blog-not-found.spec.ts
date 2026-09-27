import { test, expect } from "@playwright/test";

/**
 * IDX-01 — soft 404 em /blog/[slug] (docs/seo/01-indexacao-rastreamento.md).
 *
 * Status medido por HTTP, não por navegação: o que o crawler recebe é o
 * código da resposta. Antes da correção, `loading.tsx` fazia a resposta
 * começar em streaming e o post inexistente saía 200 com `noindex`.
 */

const VALID_POST = "/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores";

const robotsOf = (html: string) =>
  [...html.matchAll(/<meta name="robots" content="([^"]*)"/g)].map((m) => m[1]);
const canonicalOf = (html: string) =>
  (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] ?? null;

test.describe("IDX-01 — status HTTP do blog", () => {
  test("post publicado → 200, indexável, canonical próprio", async ({ request }) => {
    const res = await request.get(VALID_POST, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(robotsOf(html)).toEqual(["index, follow"]);
    expect(canonicalOf(html)).toMatch(new RegExp(`${VALID_POST}$`));
  });

  for (const path of ["/blog/slug-inexistente-idx01", "/blog/outro-inexistente-idx01"]) {
    test(`${path} → 404 real, noindex coerente, sem canonical`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(404);
      const html = await res.text();
      const robots = robotsOf(html);
      expect(robots.length).toBeGreaterThan(0);
      for (const r of robots) expect(r).toMatch(/noindex/);
      expect(canonicalOf(html)).toBeNull();
    });
  }

  test("preview de slug inexistente → 404", async ({ request }) => {
    const res = await request.get("/blog/slug-inexistente-idx01/preview", { maxRedirects: 0 });
    expect(res.status()).toBe(404);
  });

  test("preview sem sessão admin → 404, mesmo para post existente", async ({ request }) => {
    const res = await request.get(`${VALID_POST}/preview`, { maxRedirects: 0 });
    expect(res.status()).toBe(404);
    for (const r of robotsOf(await res.text())) expect(r).toMatch(/noindex/);
  });

  test("índice /blog segue 200", async ({ request }) => {
    const res = await request.get("/blog", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });
});
