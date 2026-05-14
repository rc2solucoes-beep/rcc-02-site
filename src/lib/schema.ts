import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import type {
  OrgSettings,
  WebPageInfo,
  Organization,
  LocalBusiness,
  WebPage,
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

  const areaServed = settings.business_area
    ? [{ "@type": "City" as const, name: settings.business_area }]
    : [{ "@type": "Country" as const, name: "Brazil" }];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RC2 Soluções",
    url: baseUrl,
    logo: `${baseUrl}/images/logo-base.png`,
    email: settings.contact_email || undefined,
    telephone: settings.phone || undefined,
    address: address,
    areaServed: areaServed,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    contactPoint: contactPoints.length > 0 ? contactPoints : undefined,
  };
}

export function getLocalBusinessSchema(
  settings: OrgSettings,
  baseUrl: string
): LocalBusiness {
  const sameAs: string[] = [];

  if (settings.instagram_url) sameAs.push(settings.instagram_url);
  if (settings.linkedin_url) sameAs.push(settings.linkedin_url);
  if (settings.facebook_url) sameAs.push(settings.facebook_url);
  if (settings.youtube_url) sameAs.push(settings.youtube_url);
  if (settings.gmb_url) sameAs.push(settings.gmb_url);

  const address = settings.address
    ? {
        "@type": "PostalAddress" as const,
        streetAddress: settings.address,
        addressLocality: settings.address_locality || undefined,
        postalCode: settings.postal_code || undefined,
        addressCountry: "BR",
      }
    : undefined;

  const geo =
    settings.address_lat && settings.address_lng
      ? {
          "@type": "GeoCoordinates" as const,
          latitude: parseFloat(String(settings.address_lat)),
          longitude: parseFloat(String(settings.address_lng)),
        }
      : undefined;

  const areaServed = settings.business_area
    ? [{ "@type": "City" as const, name: settings.business_area }]
    : [{ "@type": "Country" as const, name: "Brazil" }];

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "RC2 Soluções",
    url: baseUrl,
    logo: `${baseUrl}/images/logo-base.png`,
    email: settings.contact_email || undefined,
    telephone: settings.phone || undefined,
    address: address,
    geo: geo,
    areaServed: areaServed,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

export function getWebPageSchema(
  settings: OrgSettings,
  page: WebPageInfo,
  baseUrl: string
): WebPage {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: page.url,
    keywords: page.keywords || undefined,
    image: page.image || `${baseUrl}${settings.og_image_url}`,
    isPartOf: {
      "@type": "WebSite",
      url: baseUrl,
      name: "RC2 Soluções",
    },
    publisher: {
      "@type": "Organization",
      name: "RC2 Soluções",
      url: baseUrl,
      logo: `${baseUrl}/images/logo-base.png`,
    },
  };
}
