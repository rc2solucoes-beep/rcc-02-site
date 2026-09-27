import { describe, expect, it } from "vitest";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { serializeJsonLd } from "@/lib/jsonLd";
import { BlogPostArticle } from "@/components/blog/BlogPostArticle";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import type { Post } from "@/lib/types/post";

/**
 * SDD Schema.org — Fase 4.1: serialização segura de JSON-LD.
 *
 * `JSON.stringify` não escapa `<`; um valor com `</script>` fecharia a tag do
 * JSON-LD. `serializeJsonLd` troca `<` por `\u003c`, mantendo o JSON válido.
 */

const PAYLOAD = "</script><script>alert(1)</script>";
const XSS = "</script><script>window.__xss_test__=true</script>";

describe("serializeJsonLd — unidade", () => {
  it("T01 — objeto simples vira JSON válido e equivalente", () => {
    const value = { "@type": "WebPage", name: "Teste" };
    const out = serializeJsonLd(value);
    expect(out).toBe(JSON.stringify(value));
    expect(JSON.parse(out)).toEqual(value);
  });

  it("T02 — nenhum </script> literal no resultado", () => {
    expect(serializeJsonLd({ name: "a</script>b" })).not.toContain("</script>");
  });

  it("T03 — payload de injeção não gera <script> literal", () => {
    const out = serializeJsonLd({ name: PAYLOAD });
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<");
    expect(out).toContain("\\u003c/script>\\u003cscript>alert(1)\\u003c/script>");
  });

  it("T04 — continua parseável e recupera o valor original", () => {
    const value = { name: PAYLOAD, nested: [{ text: "<!-- x -->" }] };
    expect(JSON.parse(serializeJsonLd(value))).toEqual(value);
  });

  it("T05 — preserva acentos, emoji, quebras de linha, aspas, URLs e HTML comum", () => {
    const value = {
      acentos: "Operação, integração, ç ã é",
      emoji: "✅ 🚀",
      linhas: "linha 1\nlinha 2",
      aspas: 'ele disse "ok" e \'tchau\'',
      url: "https://www.rc2solucoes.com.br/blog?a=1&b=2#x",
      html: "<strong>negrito</strong> & 1 > 0",
    };
    const out = serializeJsonLd(value);
    expect(JSON.parse(out)).toEqual(value);
    expect(out).toContain("Operação, integração, ç ã é");
    expect(out).toContain("✅ 🚀");
    expect(out).toContain("https://www.rc2solucoes.com.br/blog?a=1&b=2#x");
    // Só `<` é escapado: `>`, `&`, `"` e `/` seguem como no JSON.stringify.
    expect(out).toContain("\\u003cstrong>negrito\\u003c/strong> & 1 > 0");
  });

  it("T06 — não muta o objeto recebido", () => {
    const value = { name: PAYLOAD, list: [PAYLOAD] };
    const copy = structuredClone(value);
    serializeJsonLd(value);
    expect(value).toEqual(copy);
  });
});

/** Coleta os <script type="application/ld+json"> de uma árvore React. */
function collectScripts(node: ReactNode, acc: ReactElement[] = []) {
  if (Array.isArray(node)) {
    node.forEach((child) => collectScripts(child, acc));
    return acc;
  }
  if (!isValidElement(node)) return acc;
  const el = node as ReactElement<{ type?: string; children?: ReactNode }>;
  if (el.type === "script" && el.props.type === "application/ld+json") acc.push(el);
  collectScripts(el.props.children, acc);
  return acc;
}

/**
 * Renderiza os scripts para HTML e o analisa como o navegador faria: se algum
 * dado fechasse a tag, apareceriam scripts a mais ou um JSON quebrado.
 */
function parseRendered(scripts: ReactElement[]) {
  const html = renderToStaticMarkup(createElement("div", null, ...scripts));
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const found = [...doc.querySelectorAll("script")];
  return { html, found, json: found.map((s) => JSON.parse(s.textContent ?? "")) };
}

const POST: Post = {
  id: "teste",
  slug: "post-de-teste",
  title: `Título ${XSS}`,
  summary: `Resumo ${PAYLOAD}`,
  content: "<p>Texto.</p>",
  cover_url: null,
  cover_url_alt: null,
  cover_url_caption: null,
  og_image: null,
  og_title: null,
  og_description: null,
  status: "published",
  published_at: "2026-08-17T11:00:00+00:00",
  updated_at: "2026-09-05T13:38:37+00:00",
  scheduled_publish_at: null,
  reading_time_minutes: 3,
  created_at: "2026-08-10T00:00:00+00:00",
  seo_keyword_primary: null,
  seo_keyword_secondary: null,
  seo_meta_title: null,
  seo_meta_description: null,
  seo_index_status: "index",
  category: null,
  tags: null,
  content_type: null,
  author_id: null,
  author_name: `Autor ${PAYLOAD}`,
  author_title: null,
  author_photo: null,
  author_bio: null,
  author_linkedin: null,
  related_post_ids: null,
  faq_items: [{ question: `Pergunta ${PAYLOAD}?`, answer: `Resposta ${XSS}` }],
  cta_block: null,
};

describe("serializeJsonLd — HTML renderizado", () => {
  it("post do blog: título, resumo, autor e FAQ maliciosos não quebram os scripts", () => {
    const scripts = collectScripts(BlogPostArticle({ post: POST, relatedPosts: [] }));
    // WebPage, BreadcrumbList (Fase 6), BlogPosting, Person (Fase 5), FAQPage
    expect(scripts).toHaveLength(5);

    const { html, found, json } = parseRendered(scripts);

    // Nenhum script extra injetado pelos dados, nenhum </script> vindo deles.
    expect(found).toHaveLength(5);
    expect(html.match(/<\/script>/g)).toHaveLength(5);
    expect(html).not.toContain("<script>alert(1)");
    expect(html).not.toContain("<script>window.__xss_test__");

    // Os valores continuam recuperáveis, intactos.
    const [webPage, breadcrumb, article, person, faq] = json;
    expect(breadcrumb.itemListElement[2].name).toBe(POST.title);
    expect(webPage.name).toBe(POST.title);
    expect(webPage.description).toBe(POST.summary);
    expect(article.headline).toBe(POST.title);
    expect(article.description).toBe(POST.summary);
    expect(person.name).toBe(POST.author_name);
    expect(article.author).toEqual({ "@id": person["@id"] });
    expect(faq.mainEntity[0].name).toBe(`Pergunta ${PAYLOAD}?`);
    expect(faq.mainEntity[0].acceptedAnswer.text).toBe(`Resposta ${XSS}`);
  });

  it("breadcrumb: rótulo malicioso não quebra o BreadcrumbList", () => {
    const scripts = collectScripts(Breadcrumb({ items: [{ label: PAYLOAD }] }));
    const { found, json } = parseRendered(scripts);
    expect(found).toHaveLength(1);
    expect(json[0].itemListElement[1].name).toBe(PAYLOAD);
  });

  it("controle: sem o serializador, o mesmo dado injetaria um script", () => {
    const inseguro = createElement("script", {
      type: "application/ld+json",
      dangerouslySetInnerHTML: { __html: JSON.stringify({ name: XSS }) },
    });
    const { found } = (() => {
      const html = renderToStaticMarkup(createElement("div", null, inseguro));
      const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
      return { found: [...doc.querySelectorAll("script")] };
    })();
    // O HTML resultante tem mais de um script: a tag foi fechada pelos dados.
    expect(found.length).toBeGreaterThan(1);
  });
});
