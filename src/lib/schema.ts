import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import { LOGO_URL, SCHEMA_IDS, schemaWebPageId } from "@/lib/schemaIds";
import { resolveSchemaUrl } from "@/lib/schemaUrl";
import type {
  OrgSettings,
  WebPageInfo,
  Organization,
  AreaServed,
  WebPage,
  WebSite,
  ImageObject,
} from "@/lib/types/schema";

const getSettingsFromDb = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("settings").select("key,value");

    const settings: Record<string, string> = {};
    (data ?? []).forEach(({ key, value }: { key: string; value: string }) => {
      settings[key] = value;
    });

    return settings as Record<keyof OrgSettings, string>;
  },
  ["org-settings"],
  { revalidate: 300 }
);

export async function getOrgSettings(): Promise<OrgSettings> {
  const settings = await getSettingsFromDb();

  return {
    contact_email: settings.contact_email || "",
    whatsapp: settings.whatsapp || "",
    phone: settings.phone || "",
    address: settings.address || "",
    postal_code: settings.postal_code,
    address_locality: settings.address_locality,
    address_lat: settings.address_lat || "",
    address_lng: settings.address_lng || "",
    business_area: settings.business_area || "",
    gmb_url: settings.gmb_url || "",
    instagram_url: settings.instagram_url || "",
    linkedin_url: settings.linkedin_url || "",
    facebook_url: settings.facebook_url || "",
    youtube_url: settings.youtube_url || "",
    og_image_url: settings.og_image_url || "/og-image.png",
  };
}

/** Logo da organização como entidade própria (`#logo`). */
export function getLogoSchema(): ImageObject {
  return {
    "@type": "ImageObject",
    "@id": SCHEMA_IDS.logo,
    url: LOGO_URL,
  };
}

/** WebSite global (`#website`), publicado pela organização global. */
export function getWebSiteSchema(baseUrl: string): WebSite {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SCHEMA_IDS.website,
    name: "RC2 Soluções",
    url: baseUrl,
    publisher: { "@id": SCHEMA_IDS.organization },
  };
}

/**
 * `getOrgSettings()` sem lançar: em caso de falha registra o erro e devolve
 * `null`. Para quem só usa os settings como dado opcional — a identidade do
 * WebPage não pode depender da disponibilidade do banco.
 */
export async function getOrgSettingsOrNull(): Promise<OrgSettings | null> {
  try {
    return await getOrgSettings();
  } catch (error) {
    console.error("Error loading organization settings for schema:", error);
    return null;
  }
}

/** Valores de `business_area` que designam o país (comparação normalizada). */
const COUNTRY_NAMES: ReadonlySet<string> = new Set(["brasil", "brazil"]);

/**
 * `areaServed` da organização, a partir de `settings.business_area`.
 *
 * - vazio, ou "Brasil" (e variações de caixa, espaço e a grafia "Brazil") →
 *   `Country` "Brasil" — a RC2 atende o país;
 * - qualquer outro valor → texto simples. Sem regra que o classifique, não
 *   se afirma que é cidade, estado ou país (antes, todo valor virava `City`,
 *   inclusive "Brasil").
 */
export function getAreaServed(businessArea: string | null | undefined): AreaServed[] {
  const value = businessArea?.trim().normalize("NFC") ?? "";
  if (!value || COUNTRY_NAMES.has(value.toLowerCase())) {
    return [{ "@type": "Country", name: "Brasil" }];
  }
  return [value];
}

export function getOrganizationSchema(
  settings: OrgSettings,
  baseUrl: string
): Organization {
  const sameAs: string[] = [];

  if (settings.instagram_url) sameAs.push(settings.instagram_url);
  if (settings.linkedin_url) sameAs.push(settings.linkedin_url);
  if (settings.facebook_url) sameAs.push(settings.facebook_url);
  if (settings.youtube_url) sameAs.push(settings.youtube_url);
  if (settings.gmb_url) sameAs.push(settings.gmb_url);

  const contactPoints: NonNullable<Organization["contactPoint"]> = [];

  if (settings.contact_email) {
    contactPoints.push({
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "Portuguese",
      email: settings.contact_email,
      url: `${baseUrl}/contato`,
    });
  }

  if (settings.phone) {
    contactPoints.push({
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "Portuguese",
      telephone: settings.phone,
      url: `${baseUrl}/contato`,
    });
  }

  const address = settings.address
    ? {
        "@type": "PostalAddress" as const,
        streetAddress: settings.address,
        addressLocality: settings.address_locality || undefined,
        postalCode: settings.postal_code || undefined,
        addressCountry: "BR",
      }
    : undefined;

  const areaServed = getAreaServed(settings.business_area);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": SCHEMA_IDS.organization,
    name: "RC2 Soluções",
    url: baseUrl,
    logo: getLogoSchema(),
    email: settings.contact_email || undefined,
    telephone: settings.phone || undefined,
    address: address,
    areaServed: areaServed,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    contactPoint: contactPoints.length > 0 ? contactPoints : undefined,
  };
}

/** Imagem padrão do site, usada quando nem a página nem os settings trazem uma. */
const DEFAULT_OG_IMAGE = "/og-image.png";

// Implementação em módulo puro; reexportada para os consumidores existentes.
export { resolveSchemaUrl };

/**
 * WebPage da página. Identidade e relações vêm só da página e de SCHEMA_IDS;
 * `settings` é opcional e alimenta apenas a imagem de fallback — sem settings
 * (banco indisponível), cai na imagem padrão do site.
 */
export function getWebPageSchema(
  settings: OrgSettings | null,
  page: WebPageInfo,
  baseUrl: string
): WebPage {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": schemaWebPageId(page.url),
    name: page.title,
    description: page.description,
    url: page.url,
    keywords: page.keywords || undefined,
    image:
      resolveSchemaUrl(page.image, baseUrl) ??
      resolveSchemaUrl(settings?.og_image_url, baseUrl) ??
      resolveSchemaUrl(DEFAULT_OG_IMAGE, baseUrl),
    isPartOf: { "@id": SCHEMA_IDS.website },
    publisher: { "@id": SCHEMA_IDS.organization },
  };
}
