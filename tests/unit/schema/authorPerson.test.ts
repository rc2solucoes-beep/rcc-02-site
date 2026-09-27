import { describe, expect, it } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { BASE_URL } from "@/lib/siteMetadata";
import { SCHEMA_IDS, schemaPersonId } from "@/lib/schemaIds";
import { getBlogAuthorSchema, getBlogPostingSchema, personSlug } from "@/lib/blogSchema";
import { blogPostUrl } from "@/lib/blog/url";
import { BlogPostArticle } from "@/components/blog/BlogPostArticle";
import type { Post } from "@/lib/types/post";

/**
 * SDD Schema.org — Fase 5: Author / Person (`docs/schema/baseline.md`).
 *
 * Autoria institucional (ou sem autor) → `#organization`, sem Person.
 * Autor individual → Person em bloco próprio, `#person-{slug}`, referenciado
 * por `@id`, com `jobTitle`/`image`/`sameAs` só quando há dado real.
 */

const BASE: Post = {
  id: "p1",
  slug: "post-um",
  title: "Post um",
  summary: "Resumo.",
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
  author_name: null,
  author_title: null,
  author_photo: null,
  author_bio: null,
  author_linkedin: null,
  related_post_ids: null,
  faq_items: null,
  cta_block: null,
};

const ORG = { "@id": SCHEMA_IDS.organization };
const ROBSON_ID = `${BASE_URL}/#person-robson-azevedo`;

const withAuthor = (fields: Partial<Post>): Post => ({ ...BASE, ...fields });

describe("Autoria institucional", () => {
  it("T01 — author_name = 'RC2 Soluções' → #organization, sem Person", () => {
    const r = getBlogAuthorSchema(withAuthor({ author_name: "RC2 Soluções" }));
    expect(r).toEqual({ author: ORG, person: null });
  });

  it("T01b — variações só de espaço/normalização Unicode continuam institucionais", () => {
    for (const name of ["  RC2 Soluções  ", "RC2 Soluções".normalize("NFD")]) {
      expect(getBlogAuthorSchema(withAuthor({ author_name: name })).person).toBeNull();
    }
  });

  it("T02 — autor ausente (null, '', só espaços) → #organization", () => {
    for (const author_name of [null, "", "   "]) {
      expect(getBlogAuthorSchema(withAuthor({ author_name }))).toEqual({
        author: ORG,
        person: null,
      });
    }
  });
});

describe("Autor individual", () => {
  it("T03 — nome de pessoa → Person #person-{slug}", () => {
    const r = getBlogAuthorSchema(withAuthor({ author_name: "Robson Azevedo" }));
    expect(r.author).toEqual({ "@id": ROBSON_ID });
    expect(r.person?.["@type"]).toBe("Person");
    expect(r.person?.["@id"]).toBe(ROBSON_ID);
    expect(r.person?.name).toBe("Robson Azevedo");
  });

  it("T04 — o mesmo autor em posts diferentes tem o mesmo @id", () => {
    const a = getBlogPostingSchema(
      withAuthor({ slug: "post-a", author_name: "Robson Azevedo" }),
      blogPostUrl("post-a")
    );
    const b = getBlogPostingSchema(
      withAuthor({ slug: "post-b", author_name: "  Robson Azevedo " }),
      blogPostUrl("post-b")
    );
    expect(a.author).toEqual(b.author);
    expect(a.author).toEqual({ "@id": ROBSON_ID });
  });

  it("slug: minúsculas, hífens e sem acentos, derivado só do nome", () => {
    expect(personSlug("Robson Azevedo")).toBe("robson-azevedo");
    expect(personSlug("João Conceição")).toBe("joao-conceicao");
    expect(personSlug("Ana  Maria-Souza")).toBe("ana-maria-souza");
    expect(schemaPersonId("robson-azevedo")).toBe(ROBSON_ID);
  });

  it("T05 — jobTitle real é emitido", () => {
    const { person } = getBlogAuthorSchema(
      withAuthor({ author_name: "Robson Azevedo", author_title: "Fundador" })
    );
    expect(person?.jobTitle).toBe("Fundador");
  });

  it("T06 — jobTitle null ou vazio não aparece", () => {
    for (const author_title of [null, "", "  "]) {
      const { person } = getBlogAuthorSchema(withAuthor({ author_name: "Robson Azevedo", author_title }));
      expect(person).not.toHaveProperty("jobTitle");
    }
  });

  it("T07 — image real é emitida (absoluta intacta, relativa resolvida)", () => {
    const abs = getBlogAuthorSchema(
      withAuthor({ author_name: "Robson Azevedo", author_photo: "https://cdn.example.com/r.jpg" })
    );
    expect(abs.person?.image).toBe("https://cdn.example.com/r.jpg");
    const rel = getBlogAuthorSchema(
      withAuthor({ author_name: "Robson Azevedo", author_photo: "/images/r.jpg" })
    );
    expect(rel.person?.image).toBe(`${BASE_URL}/images/r.jpg`);
  });

  it("T08 — image null ou vazia não aparece", () => {
    for (const author_photo of [null, ""]) {
      const { person } = getBlogAuthorSchema(withAuthor({ author_name: "Robson Azevedo", author_photo }));
      expect(person).not.toHaveProperty("image");
    }
  });

  it("T09 — LinkedIn real vira sameAs", () => {
    const { person } = getBlogAuthorSchema(
      withAuthor({
        author_name: "Robson Azevedo",
        author_linkedin: "https://www.linkedin.com/in/exemplo",
      })
    );
    expect(person?.sameAs).toEqual(["https://www.linkedin.com/in/exemplo"]);
  });

  it("T10 — sem LinkedIn real, nenhum sameAs (nem array vazio)", () => {
    for (const author_linkedin of [null, "", "linkedin.com/in/sem-esquema"]) {
      const { person } = getBlogAuthorSchema(withAuthor({ author_name: "Robson Azevedo", author_linkedin }));
      expect(person).not.toHaveProperty("sameAs");
    }
  });

  it("nenhuma propriedade null na Person; bio não é emitida", () => {
    const { person } = getBlogAuthorSchema(
      withAuthor({ author_name: "Robson Azevedo", author_bio: "Bio real." })
    );
    expect(person).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": ROBSON_ID,
      name: "Robson Azevedo",
    });
  });
});

/** Coleta os JSON-LD emitidos pelo componente. */
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

describe("Autoria no componente renderizado", () => {
  it("T11 — autor individual: BlogPosting.author aponta para o Person emitido", () => {
    const blocks = collectJsonLd(
      BlogPostArticle({
        post: withAuthor({ author_name: "Robson Azevedo", author_title: "Fundador" }),
        relatedPosts: [],
      })
    );
    const persons = blocks.filter((b) => b["@type"] === "Person");
    const article = blocks.find((b) => b["@type"] === "BlogPosting");
    expect(blocks.map((b) => b["@type"])).toEqual([
      "WebPage",
      "BreadcrumbList",
      "BlogPosting",
      "Person",
    ]);
    expect(persons).toHaveLength(1);
    expect(article?.author).toEqual({ "@id": ROBSON_ID });
    expect(persons[0]["@id"]).toBe(ROBSON_ID);
  });

  it("T12 — autoria institucional: nenhum Person, e nenhum Person 'RC2 Soluções'", () => {
    const blocks = collectJsonLd(
      BlogPostArticle({ post: withAuthor({ author_name: "RC2 Soluções" }), relatedPosts: [] })
    );
    const serialized = JSON.stringify(blocks);
    expect(blocks.some((b) => b["@type"] === "Person")).toBe(false);
    expect(serialized).not.toMatch(/"@type":"Person","name":"RC2 Soluções"/);
    expect(blocks.find((b) => b["@type"] === "BlogPosting")?.author).toEqual(ORG);
  });
});
