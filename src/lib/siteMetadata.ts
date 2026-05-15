/**
 * Shared Open Graph helper.
 *
 * In Next.js App Router, a child page's `openGraph` object REPLACES the
 * root layout's entirely — fields are NOT merged. Use `buildOg` on every
 * page that exports its own `openGraph` so that the shared fields
 * (type, locale, siteName, images) are never lost.
 */

export const SITE_NAME = "RC2 Soluções";
export const BASE_URL = "https://rc2solucoes.com.br";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "RC2 Soluções — IA e Automações para PMEs",
} as const;

export function buildOg(opts: {
  title: string;
  description: string;
  url: string;
  /** URL da OG Image — vinda do banco (og_image_url). Se omitida usa o fallback estático. */
  imageUrl?: string;
}) {
  const { imageUrl, ...rest } = opts;
  const image = imageUrl
    ? { url: imageUrl, width: 1200, height: 630, alt: OG_IMAGE.alt }
    : OG_IMAGE;

  return {
    type: "website" as const,
    locale: "pt_BR",
    siteName: SITE_NAME,
    images: [image],
    ...rest,
  };
}
