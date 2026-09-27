import { describe, expect, it } from "vitest";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BASE_URL } from "@/lib/siteMetadata";
import { SCHEMA_IDS } from "@/lib/schemaIds";
import { blogPostUrl } from "@/lib/blog/url";
import {
  getBlogBreadcrumbSchema,
  getBlogPostWebPageSchema,
  getBlogPostingSchema,
} from "@/lib/blogSchema";
import { BlogPostArticle } from "@/components/blog/BlogPostArticle";
import type { Post } from "@/lib/types/post";

/**
 * SDD Schema.org — Fase 6: BreadcrumbList em `/blog/[slug]`.
 *
 * Home → Blog → título do post, espelhando o breadcrumb visível — com o mesmo
 * rótulo "Home" da tela — sem a categoria. `WebPage.breadcrumb` aponta para
 * `{canonical}#breadcrumb`.
 */

const POST: Post = {
  id: "d049fc80-5e04-4944-8000-5f417f881b14",
  slug: "solucoes-automatizadas-7-criterios-para-avaliar-fornecedores",
  title: "Soluções automatizadas: 7 critérios para avaliar fornecedores",
  summary: "Resumo do post.",
  content: "<h2>Critério 1</h2><p>Texto.</p>",
  cover_url: "https://cdn.example.com/capa.png",
  cover_url_alt: null,
  cover_url_caption: null,
  og_image: null,
  og_title: null,
  og_description: null,
  status: "published",
  published_at: "2026-08-17T11:00:00+00:00",
  updated_at: "2026-09-05T13:38:37.305778+00:00",
  scheduled_publish_at: null,
  reading_time_minutes: 6,
  created_at: "2026-08-10T00:00:00+00:00",
  seo_keyword_primary: null,
  seo_keyword_secondary: null,
  seo_meta_title: "Título SEO diferente",
  seo_meta_description: null,
  seo_index_status: "index",
  category: "Automação",
  tags: null,
  content_type: null,
  author_id: null,
  author_name: "RC2 Soluções",
  author_title: null,
  author_photo: null,
  author_bio: null,
  author_linkedin: null,
  related_post_ids: null,
  faq_items: [
    { question: "Pergunta 1?", answer: "Resposta 1." },
    { question: "Pergunta 2?", answer: "Resposta 2." },
  ],
  cta_block: null,
};

const canonical = blogPostUrl(POST.slug);
const breadcrumb = getBlogBreadcrumbSchema(POST, canonical);
const webPage = getBlogPostWebPageSchema(POST, canonical);

describe("BreadcrumbList do post", () => {
  it("T01 — @id = {canonical}#breadcrumb", () => {
    expect(getBlogBreadcrumbSchema(POST, `${BASE_URL}/blog/exemplo`)["@id"]).toBe(
      "https://www.rc2solucoes.com.br/blog/exemplo#breadcrumb"
    );
    expect(breadcrumb["@id"]).toBe(`${canonical}#breadcrumb`);
  });

  it("T02 — exatamente três itens", () => {
    expect(breadcrumb.itemListElement).toHaveLength(3);
  });

  it("T03 — posições 1, 2, 3", () => {
    expect(breadcrumb.itemListElement.map((i) => i.position)).toEqual([1, 2, 3]);
  });

  it("T04 — primeiro item: Home → BASE_URL (mesmo rótulo da tela)", () => {
    expect(breadcrumb.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.rc2solucoes.com.br",
    });
  });

  it("os três rótulos batem com o breadcrumb visível (menos a categoria)", () => {
    expect(breadcrumb.itemListElement.map((i) => i.name)).toEqual([
      "Home",
      "Blog",
      POST.title,
    ]);
  });

  it("T05 — segundo item: Blog → /blog", () => {
    expect(breadcrumb.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: "https://www.rc2solucoes.com.br/blog",
    });
  });

  it("T06 — terceiro item: título real do post, sem item", () => {
    expect(breadcrumb.itemListElement[2]).toEqual({
      "@type": "ListItem",
      position: 3,
      name: POST.title,
    });
    expect(breadcrumb.itemListElement[2]).not.toHaveProperty("item");
    expect(breadcrumb.itemListElement[2].name).not.toBe(POST.seo_meta_title);
  });

  it("T07 — a categoria não entra, mesmo quando o post tem uma", () => {
    expect(JSON.stringify(breadcrumb)).not.toContain(String(POST.category));
  });

  it("T08 — WebPage.breadcrumb aponta para o BreadcrumbList", () => {
    expect(webPage.breadcrumb).toEqual({ "@id": breadcrumb["@id"] });
  });

  it("WebPage fora de breadcrumb continua como na Fase 4", () => {
    const { breadcrumb: _ref, ...resto } = webPage;
    expect(_ref).toBeDefined();
    expect(resto).toEqual({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: POST.title,
      description: POST.summary,
      isPartOf: { "@id": SCHEMA_IDS.website },
      publisher: { "@id": SCHEMA_IDS.organization },
      mainEntity: { "@id": `${canonical}#article` },
    });
  });
});

describe("Fase 6 — invariantes", () => {
  it("T09 — BlogPosting inalterado (sem breadcrumb)", () => {
    expect(getBlogPostingSchema(POST, canonical)).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${canonical}#article`,
      url: canonical,
      headline: POST.title,
      description: POST.summary,
      image: POST.cover_url,
      datePublished: POST.published_at,
      dateModified: POST.updated_at,
      author: { "@id": SCHEMA_IDS.organization },
      publisher: { "@id": SCHEMA_IDS.organization },
      isPartOf: { "@id": SCHEMA_IDS.website },
      mainEntityOfPage: { "@id": `${canonical}#webpage` },
    });
  });
});

/** Coleta os JSON-LD emitidos pelo componente. */
function collectScripts(node: ReactNode, acc: ReactElement[] = []) {
  if (Array.isArray(node)) {
    node.forEach((child) => collectScripts(child, acc));
    return acc;
  }
  if (!isValidElement(node)) return acc;
  const el = node as ReactElement<{
    type?: string;
    dangerouslySetInnerHTML?: { __html: string };
    children?: ReactNode;
  }>;
  if (el.type === "script" && el.props.type === "application/ld+json") acc.push(el);
  collectScripts(el.props.children, acc);
  return acc;
}

function jsonOf(el: ReactElement) {
  const props = el.props as { dangerouslySetInnerHTML?: { __html: string } };
  return JSON.parse(props.dangerouslySetInnerHTML?.__html ?? "null");
}

const blocksOf = (post: Post) =>
  collectScripts(BlogPostArticle({ post, relatedPosts: [] })).map(jsonOf) as Record<
    string,
    unknown
  >[];

describe("Fase 6 — componente renderizado", () => {
  it("emite 1 BreadcrumbList, igual ao builder, logo após o WebPage", () => {
    const blocks = blocksOf(POST);
    expect(blocks.map((b) => b["@type"])).toEqual([
      "WebPage",
      "BreadcrumbList",
      "BlogPosting",
      "FAQPage",
    ]);
    expect(blocks[1]).toEqual(breadcrumb);
  });

  it("T10 — FAQPage inalterado", () => {
    const faq = blocksOf(POST).find((b) => b["@type"] === "FAQPage");
    expect(faq).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Pergunta 1?", acceptedAnswer: { "@type": "Answer", text: "Resposta 1." } },
        { "@type": "Question", name: "Pergunta 2?", acceptedAnswer: { "@type": "Answer", text: "Resposta 2." } },
      ],
    });
  });

  it("T11 — autoria inalterada: institucional e individual (Fase 5.1)", () => {
    const inst = blocksOf(POST);
    expect(inst.find((b) => b["@type"] === "BlogPosting")?.author).toEqual({
      "@id": SCHEMA_IDS.organization,
    });
    expect(inst.some((b) => b["@type"] === "Person")).toBe(false);

    const authorId = "3f2b8c1e-7a4d-4e9b-9c2f-1a2b3c4d5e6f";
    const indiv = blocksOf({ ...POST, author_name: "Robson Azevedo", author_id: authorId });
    expect(indiv.find((b) => b["@type"] === "BlogPosting")?.author).toEqual({
      "@id": `${BASE_URL}/#person-${authorId}`,
    });
  });

  it("T12 — título malicioso não fecha o script do BreadcrumbList", () => {
    const payload = "</script><script>alert(1)</script>";
    const el = collectScripts(
      BlogPostArticle({ post: { ...POST, title: `Título ${payload}` }, relatedPosts: [] })
    ).find((s) => jsonOf(s)["@type"] === "BreadcrumbList");
    expect(el).toBeDefined();

    const html = renderToStaticMarkup(createElement("div", null, el));
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    const scripts = doc.querySelectorAll("script");
    expect(scripts).toHaveLength(1);
    expect(html).not.toContain("<script>alert(1)");
    expect(JSON.parse(scripts[0].textContent ?? "").itemListElement[2].name).toBe(
      `Título ${payload}`
    );
  });
});
