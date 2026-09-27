import { BASE_URL } from "@/lib/siteMetadata";
import {
  SCHEMA_IDS,
  schemaArticleId,
  schemaPersonId,
  schemaBreadcrumbId,
  schemaWebPageId,
} from "@/lib/schemaIds";
import { resolveSchemaUrl } from "@/lib/schemaUrl";
import { slugify } from "@/lib/utils";
import type { Post } from "@/lib/types/post";
import type {
  BlogPosting,
  BreadcrumbList,
  Person,
  SchemaReference,
  WebPage,
} from "@/lib/types/schema";

/**
 * JSON-LD de um post do blog: o WebPage da URL e o BlogPosting que ele
 * apresenta, ligados nos dois sentidos por `@id`.
 *
 * Puro: usa só o `post` já carregado e a URL canônica — nenhuma consulta
 * adicional ao banco.
 */

type PostFields = Pick<
  Post,
  | "title"
  | "summary"
  | "cover_url"
  | "published_at"
  | "created_at"
  | "updated_at"
  | "author_name"
  | "author_title"
  | "author_photo"
  | "author_linkedin"
  | "author_id"
>;

type AuthorFields = Pick<
  Post,
  "author_id" | "author_name" | "author_title" | "author_photo" | "author_linkedin"
>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * `author_id` normalizado para uso no `@id`, ou `undefined` se ausente ou fora
 * do formato. É o `id` UUID da tabela `authors` (gerado por
 * `gen_random_uuid()`, validado como UUID no admin) — identificador técnico,
 * sem papel de autenticação. Em 2026-09-26, os 14 posts com `author_id`
 * apontavam para `authors` e nenhum para `auth.users`.
 */
function authorIdKey(authorId: string | null | undefined): string | undefined {
  const normalized = authorId?.trim().toLowerCase();
  return normalized && UUID.test(normalized) ? normalized : undefined;
}

/**
 * Valores de `author_name` que representam a própria RC2, não uma pessoa.
 * Lista explícita, sem heurística: em 2026-09-26 os 15 posts publicados usavam
 * exatamente "RC2 Soluções" (`docs/schema/baseline.md`, Fase 5). Um novo nome
 * institucional entra aqui, deliberadamente.
 */
const INSTITUTIONAL_AUTHOR_NAMES: ReadonlySet<string> = new Set(["RC2 Soluções"]);

/** Campo de snapshot do autor: o CMS grava "" quando não há valor. */
function present(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Slug estável do autor, derivado só do nome (mesmo nome → mesmo slug). */
export function personSlug(name: string): string {
  return slugify(name.normalize("NFC"));
}

export interface BlogAuthorSchema {
  /** Valor de `BlogPosting.author`: sempre uma referência por `@id`. */
  author: SchemaReference;
  /** Entidade Person a emitir em bloco próprio — `null` na autoria institucional. */
  person: Person | null;
}

/**
 * Decide a autoria do post. Ordem de identidade:
 *
 * 1. sem `author_name`, ou nome institucional → `#organization`, sem Person
 *    (o `author_id` é ignorado);
 * 2. pessoa com `author_id` válido → `#person-{author_id}` — estável mesmo se o
 *    nome for corrigido, e distinto entre homônimos;
 * 3. pessoa sem `author_id` → `#person-{slug-do-nome}` (fallback para dados
 *    legados e fixtures).
 *
 * A Person só leva os campos opcionais com dado real (`jobTitle`, `image`,
 * `sameAs`).
 */
export function getBlogAuthorSchema(post: AuthorFields): BlogAuthorSchema {
  const name = present(post.author_name)?.normalize("NFC");

  if (!name || INSTITUTIONAL_AUTHOR_NAMES.has(name)) {
    return { author: { "@id": SCHEMA_IDS.organization }, person: null };
  }

  const key = authorIdKey(post.author_id) ?? personSlug(name);
  if (!key) {
    return { author: { "@id": SCHEMA_IDS.organization }, person: null };
  }

  const id = schemaPersonId(key);
  const jobTitle = present(post.author_title);
  const image = resolveSchemaUrl(post.author_photo, BASE_URL);
  const linkedin = present(post.author_linkedin);
  const sameAs = linkedin && /^https?:\/\//i.test(linkedin) ? [linkedin] : undefined;

  return {
    author: { "@id": id },
    person: {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": id,
      name,
      ...(jobTitle ? { jobTitle } : {}),
      ...(image ? { image } : {}),
      ...(sameAs ? { sameAs } : {}),
    },
  };
}

export function getBlogPostWebPageSchema(post: PostFields, canonicalUrl: string): WebPage {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": schemaWebPageId(canonicalUrl),
    url: canonicalUrl,
    name: post.title,
    description: post.summary,
    isPartOf: { "@id": SCHEMA_IDS.website },
    publisher: { "@id": SCHEMA_IDS.organization },
    mainEntity: { "@id": schemaArticleId(canonicalUrl) },
    breadcrumb: { "@id": schemaBreadcrumbId(canonicalUrl) },
  };
}

/**
 * Breadcrumb do post: Home → Blog → título. Espelha o breadcrumb visível
 * de `BlogPostArticle` — inclusive o rótulo "Home" do primeiro item, igual ao
 * da tela —, exceto a categoria, que não entra: não tem página
 * canônica própria (é filtro de `/blog`) e no próprio breadcrumb visível
 * aparece como texto, sem link. O último item — a página corrente — não leva
 * `item`.
 */
export function getBlogBreadcrumbSchema(
  post: Pick<Post, "title">,
  canonicalUrl: string
): BreadcrumbList {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": schemaBreadcrumbId(canonicalUrl),
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };
}

export function getBlogPostingSchema(post: PostFields, canonicalUrl: string): BlogPosting {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": schemaArticleId(canonicalUrl),
    url: canonicalUrl,
    headline: post.title,
    description: post.summary,
    image: post.cover_url ?? undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: getBlogAuthorSchema(post).author,
    publisher: { "@id": SCHEMA_IDS.organization },
    isPartOf: { "@id": SCHEMA_IDS.website },
    mainEntityOfPage: { "@id": schemaWebPageId(canonicalUrl) },
  };
}
