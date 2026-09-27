import { test, expect } from "@playwright/test";

/**
 * IDX-08 — metadata do 404 global (docs/seo/01-indexacao-rastreamento.md).
 *
 * O status já era 404; o problema era o HTML: `index, follow` (também na tag
 * `googlebot`) e canonical da Home herdados do layout raiz, ao lado do
 * `noindex` que o Next injeta. Aqui toda tag de robots é analisada — não basta
 * "conter noindex", porque o estado quebrado também continha.
 */

const GLOBAL_404 = ["/pagina-inexistente-idx08", "/nao-existe-rc2-idx08", "/foo/bar/inexistente-idx08"];
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

/** Todas as meta de robots: `robots`, `googlebot`, `bingbot` etc. */
function robotsTags(html: string) {
  return [...html.matchAll(/<meta\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /\bname="(robots|googlebot[\w-]*|bingbot)"/i.test(tag))
    .map((tag) => (tag.match(/content="([^"]*)"/) || [])[1] ?? "");
}

/** Uma tag permite indexar se não traz `noindex`/`none`, ou se afirma `index`/`all`. */
function allowsIndex(content: string) {
  const d = content.toLowerCase().split(",").map((s) => s.trim());
  const blocks = d.includes("noindex") || d.includes("none");
  const allows = d.includes("index") || d.includes("all");
  return allows || !blocks;
}

const canonicals = (html: string) => [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];

function expectNotIndexable(html: string) {
  const tags = robotsTags(html);
  expect(tags.length).toBeGreaterThan(0);
  for (const content of tags) expect(allowsIndex(content), `robots "${content}"`).toBe(false);
  expect(canonicals(html)).toHaveLength(0);
}

test.describe("IDX-08 — 404 global", () => {
  test("parser de robots reprova o estado anterior", () => {
    expect(allowsIndex("index, follow")).toBe(true);
    expect(allowsIndex("index, follow, max-image-preview:large, max-snippet:-1")).toBe(true);
    expect(allowsIndex("noindex")).toBe(false);
    expect(allowsIndex("noindex, nofollow")).toBe(false);
  });

  for (const path of GLOBAL_404) {
    test(`${path} → 404, nenhuma tag indexável, 0 canonical`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(404);
      expectNotIndexable(await res.text());
    });
  }

  test("Googlebot recebe o mesmo resultado", async ({ request }) => {
    const res = await request.get(GLOBAL_404[0], { maxRedirects: 0, headers: { "user-agent": GOOGLEBOT } });
    expect(res.status()).toBe(404);
    expectNotIndexable(await res.text());
  });

  test("controle positivo: Home segue 200, indexável e com canonical próprio", async ({ request }) => {
    const res = await request.get("/", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    const tags = robotsTags(html);
    expect(tags.length).toBeGreaterThan(0);
    for (const content of tags) expect(allowsIndex(content), `robots "${content}"`).toBe(true);
    const canon = canonicals(html);
    expect(canon).toHaveLength(1);
    expect(canon[0][0]).toMatch(/href="https:\/\/www\.rc2solucoes\.com\.br\/?"/);
  });

  test("controle do IDX-01: post inexistente segue 404, não indexável, sem canonical", async ({ request }) => {
    const res = await request.get("/blog/slug-inexistente-idx01", { maxRedirects: 0 });
    expect(res.status()).toBe(404);
    expectNotIndexable(await res.text());
  });
});
