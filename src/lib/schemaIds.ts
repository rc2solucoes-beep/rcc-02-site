import { BASE_URL } from "@/lib/siteMetadata";

/**
 * Identificadores `@id` das entidades globais do grafo Schema.org.
 *
 * Derivados só de `BASE_URL`: não dependem de rota, barra final, settings do
 * banco nem ambiente. Toda referência a essas entidades usa estes valores —
 * nunca uma string montada à parte.
 */
export const SCHEMA_IDS = {
  organization: `${BASE_URL}/#organization`,
  website: `${BASE_URL}/#website`,
  logo: `${BASE_URL}/#logo`,
} as const;

/**
 * `@id` do WebPage: `{canonical}#webpage`.
 *
 * Depende só da URL canônica recebida. Passa por `URL` para ignorar um
 * fragmento já presente e para que a raiz resolva como `…/#webpage` — a mesma
 * forma dos IDs globais —, sem acrescentar barra a nenhum outro path.
 */
export function schemaWebPageId(canonicalUrl: string): string {
  return withFragment(canonicalUrl, "webpage");
}

/** `@id` do artigo (BlogPosting): `{canonical}#article`, mesma normalização. */
export function schemaArticleId(canonicalUrl: string): string {
  return withFragment(canonicalUrl, "article");
}

/** `@id` do breadcrumb da página: `{canonical}#breadcrumb`, mesma normalização. */
export function schemaBreadcrumbId(canonicalUrl: string): string {
  return withFragment(canonicalUrl, "breadcrumb");
}

/**
 * `@id` de uma pessoa autora: `BASE_URL/#person-{chave}`. Global (não depende
 * do post), para que o mesmo autor tenha o mesmo `@id` em todos os artigos.
 * A chave é escolhida por `getBlogAuthorSchema()` (`src/lib/blogSchema.ts`):
 * o `author_id` quando existe, senão o slug do nome.
 */
export function schemaPersonId(key: string): string {
  return `${BASE_URL}/#person-${key}`;
}

function withFragment(canonicalUrl: string, fragment: string): string {
  const url = new URL(canonicalUrl);
  url.hash = "";
  return `${url.href}#${fragment}`;
}

/** Logo institucional — mesma imagem usada pelo site. */
export const LOGO_URL = `${BASE_URL}/images/logo-base-transparente-preto.png`;
