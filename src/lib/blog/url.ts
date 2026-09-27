import { BASE_URL } from "@/lib/siteMetadata";

/**
 * URL canônica de um post do blog. Fonte única para o canonical e o Open Graph
 * da página (`generateMetadata`), o link de compartilhamento e o JSON-LD.
 */
export function blogPostUrl(slug: string): string {
  return `${BASE_URL}/blog/${slug}`;
}
