import { describe, expect, it } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { SCHEMA_IDS } from "@/lib/schemaIds";
import { blogPostUrl } from "@/lib/blog/url";
import { getBlogPostWebPageSchema, getBlogPostingSchema } from "@/lib/blogSchema";
import { BlogPostArticle } from "@/components/blog/BlogPostArticle";
import type { Post } from "@/lib/types/post";

/**
 * SDD Schema.org — Fase 4: BlogPosting + WebPage do artigo
 * (`docs/schema/baseline.md`).
 *
 * O post passa a emitir um WebPage próprio, ligado ao BlogPosting por
 * `mainEntity` ↔ `mainEntityOfPage`, ambos com `isPartOf → #website` e
 * `publisher → #organization`. Autor e FAQ ficam como no baseline.
 */

// Post do baseline, com os campos editoriais exatamente como em produção.
const POST: Post = {
  id: "d049fc80-5e04-4944-8000-5f417f881b14",
  slug: "solucoes-automatizadas-7-criterios-para-avaliar-fornecedores",
  title: "Soluções automatizadas: 7 critérios para avaliar fornecedores",
  summary:
    "Compare propostas de automação por critérios operacionais, avalie como cada fornecedor trata integrações, exceções e suporte e reconheça riscos antes de iniciar um piloto na sua empresa.",
  content: "<h2>Critério 1</h2><p>Texto.</p>",
  cover_url:
    "https://ccaonec11w7vkoy6.public.blob.vercel-storage.com/blog/covers/1786844989996-v02.png",
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
  seo_meta_title: null,
  seo_meta_description: null,
  seo_index_status: "index",
  category: null,
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
const webPage = getBlogPostWebPageSchema(POST, canonical);
const article = getBlogPostingSchema(POST, canonical);

describe("Post — identidade e relações", () => {
  it("a canonical do post é a mesma URL pública", () => {
    expect(canonical).toBe(
      "https://www.rc2solucoes.com.br/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores"
    );
  });

  it("T01 — WebPage.@id = {canonical}#webpage", () => {
    expect(webPage["@id"]).toBe(`${canonical}#webpage`);
  });

  it("T02 — BlogPosting.@id = {canonical}#article", () => {
    expect(article["@id"]).toBe(`${canonical}#article`);
  });

  it("T03 — WebPage.mainEntity → BlogPosting", () => {
    expect(webPage.mainEntity).toEqual({ "@id": article["@id"] });
  });

  it("T04 — BlogPosting.mainEntityOfPage → WebPage", () => {
    expect(article.mainEntityOfPage).toEqual({ "@id": webPage["@id"] });
  });

  it("T05 — BlogPosting.isPartOf → #website", () => {
    expect(article.isPartOf).toEqual({ "@id": SCHEMA_IDS.website });
  });

  it("T06 — WebPage.isPartOf → #website", () => {
    expect(webPage.isPartOf).toEqual({ "@id": SCHEMA_IDS.website });
  });

  it("T07 — BlogPosting.publisher → #organization, sem recriar a organização", () => {
    expect(article.publisher).toEqual({ "@id": SCHEMA_IDS.organization });
  });

  it("T08 — WebPage.publisher → #organization", () => {
    expect(webPage.publisher).toEqual({ "@id": SCHEMA_IDS.organization });
  });

  it("T09 — url das duas entidades é a canonical", () => {
    expect(article.url).toBe(canonical);
    expect(webPage.url).toBe(canonical);
  });

  it("WebPage usa título e resumo do post", () => {
    expect(webPage.name).toBe(POST.title);
    expect(webPage.description).toBe(POST.summary);
  });
});

describe("Post — dados editoriais preservados", () => {
  it("T10 — headline, description, image e datas iguais ao baseline", () => {
    expect(article.headline).toBe(POST.title);
    expect(article.description).toBe(POST.summary);
    expect(article.image).toBe(POST.cover_url);
    expect(article.datePublished).toBe("2026-08-17T11:00:00+00:00");
    expect(article.dateModified).toBe("2026-09-05T13:38:37.305778+00:00");
  });

  // Fase 5: o `author` deixou de ser o Person "RC2 Soluções" do baseline.
  // Os contratos de autoria vivem em `authorPerson.test.ts`.
  it("autor institucional referencia a Organization global", () => {
    expect(article.author).toEqual({ "@id": SCHEMA_IDS.organization });
    const semAutor = getBlogPostingSchema({ ...POST, author_name: null }, canonical);
    expect(semAutor.author).toEqual({ "@id": SCHEMA_IDS.organization });
  });

  it("sem published_at, datePublished cai em created_at", () => {
    const rascunho = getBlogPostingSchema({ ...POST, published_at: null }, canonical);
    expect(rascunho.datePublished).toBe(POST.created_at);
  });

  it("sem capa, image fica ausente", () => {
    expect(getBlogPostingSchema({ ...POST, cover_url: null }, canonical).image).toBeUndefined();
  });
});

/** Coleta os JSON-LD emitidos diretamente pelo componente. */
function collectJsonLd(node: ReactNode, acc: Record<string, unknown>[] = []) {
  if (Array.isArray(node)) {
    node.forEach((child) => collectJsonLd(child, acc));
    return acc;
  }
  if (!isValidElement(node)) return acc;
  const el = node as ReactElement<{
    type?: string;
    dangerouslySetInnerHTML?: { __html: string };
    children?: ReactNode;
  }>;
  if (el.type === "script" && el.props.type === "application/ld+json") {
    acc.push(JSON.parse(el.props.dangerouslySetInnerHTML?.__html ?? "null"));
  }
  collectJsonLd(el.props.children, acc);
  return acc;
}

function render(post: Post) {
  const blocks = collectJsonLd(BlogPostArticle({ post, relatedPosts: [] }));
  const ofType = (t: string) => blocks.filter((b) => b["@type"] === t);
  return { blocks, ofType };
}

describe("Post — componente renderizado", () => {
  it("emite exatamente 1 WebPage, 1 BlogPosting e 1 FAQPage, na ordem de leitura", () => {
    const { blocks, ofType } = render(POST);
    expect(ofType("WebPage")).toHaveLength(1);
    expect(ofType("BlogPosting")).toHaveLength(1);
    expect(ofType("FAQPage")).toHaveLength(1);
    // BreadcrumbList entrou na Fase 6 (`breadcrumbList.test.ts`).
    expect(blocks.map((b) => b["@type"])).toEqual([
      "WebPage",
      "BreadcrumbList",
      "BlogPosting",
      "FAQPage",
    ]);
    expect(ofType("WebPage")[0]).toEqual(webPage);
    expect(ofType("BlogPosting")[0]).toEqual(article);
  });

  it("T11 — FAQPage preservado: mesmas perguntas, mesmo conteúdo, sem @id", () => {
    const [faq] = render(POST).ofType("FAQPage");
    expect(faq).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Pergunta 1?", acceptedAnswer: { "@type": "Answer", text: "Resposta 1." } },
        { "@type": "Question", name: "Pergunta 2?", acceptedAnswer: { "@type": "Answer", text: "Resposta 2." } },
      ],
    });
  });

  it("T12 — post sem FAQ não emite FAQPage", () => {
    for (const faq_items of [null, []]) {
      const { ofType } = render({ ...POST, faq_items });
      expect(ofType("FAQPage")).toHaveLength(0);
      expect(ofType("WebPage")).toHaveLength(1);
      expect(ofType("BlogPosting")).toHaveLength(1);
    }
  });
});
