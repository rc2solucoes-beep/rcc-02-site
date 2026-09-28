import { test, expect } from "@playwright/test";

/**
 * SEO-ROBOTS-BLOG-01 (docs/seo/01-indexacao-rastreamento.md).
 *
 * O post trocava o `robots` do layout pelo seu e perdia a tag `googlebot`
 * (`max-image-preview:large`, `max-snippet:-1`) que o resto do site emite.
 * Aqui se lê o HTML servido, não o objeto de metadata.
 */

const POST = "/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores";
const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

/** Diretivas de cada `<meta name=…>` pedido, já separadas. */
function directives(html: string, name: string) {
  return [...html.matchAll(/<meta\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => new RegExp(`\\bname="${name}"`, "i").test(tag))
    .map((tag) => ((tag.match(/content="([^"]*)"/) || [])[1] ?? "").split(",").map((s) => s.trim()));
}

const PREVIEW = ["index", "follow", "max-image-preview:large", "max-snippet:-1"];

test.describe("SEO-ROBOTS-BLOG-01 — diretivas do Googlebot no post", () => {
  test("post index: robots index, follow e googlebot com preview completo", async ({ request }) => {
    const res = await request.get(POST, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const html = await res.text();

    expect(directives(html, "robots")).toEqual([["index", "follow"]]);
    const googlebot = directives(html, "googlebot");
    expect(googlebot).toHaveLength(1);
    expect(googlebot[0]).toEqual(PREVIEW);
  });

  test("mesmo HTML para o User-Agent do Googlebot", async ({ request }) => {
    const res = await request.get(POST, { maxRedirects: 0, headers: { "user-agent": GOOGLEBOT_UA } });
    expect(res.status()).toBe(200);
    expect(directives(await res.text(), "googlebot")).toEqual([PREVIEW]);
  });

  test("controle: Home mantém as mesmas diretivas do layout", async ({ request }) => {
    const res = await request.get("/", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(directives(html, "robots")).toEqual([["index", "follow"]]);
    expect(directives(html, "googlebot")).toEqual([PREVIEW]);
  });

  test("controle: post inexistente segue sem googlebot indexável", async ({ request }) => {
    const res = await request.get("/blog/slug-inexistente-idx01", { maxRedirects: 0 });
    expect(res.status()).toBe(404);
    for (const d of directives(await res.text(), "googlebot")) expect(d).toContain("noindex");
  });
});
