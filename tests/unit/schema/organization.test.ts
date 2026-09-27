import { describe, expect, it, vi, beforeEach } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * SDD Schema.org — Fase 7: Organization como única entidade da RC2.
 *
 * O LocalBusiness (mesma empresa, sem @id) foi removido; `areaServed` passou a
 * tipar o Brasil como `Country`. Endereço, sameAs, contactPoint e logo ficam
 * como estavam.
 */

// Liga/desliga a falha do banco por teste.
const db = vi.hoisted(() => ({ fail: false }));

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => {
    if (db.fail) throw new Error("supabase indisponível (teste)");
    return {
      from: () => ({
        select: async () => ({
          data: [
            { key: "contact_email", value: "contato@exemplo.com" },
            { key: "phone", value: "+550000000000" },
            { key: "address", value: "Av Exemplo" },
            { key: "address_locality", value: "Cidade" },
            { key: "postal_code", value: "00000000" },
            { key: "business_area", value: "Brasil" },
            { key: "instagram_url", value: "https://www.instagram.com/exemplo" },
            { key: "linkedin_url", value: "https://www.linkedin.com/company/exemplo" },
            { key: "gmb_url", value: "https://share.google/exemplo" },
          ],
        }),
      }),
    };
  },
}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("next/font/google", () => ({
  Barlow: () => ({ variable: "font-barlow" }),
  Barlow_Condensed: () => ({ variable: "font-barlow-condensed" }),
}));
vi.spyOn(console, "error").mockImplementation(() => {});

const { BASE_URL } = await import("@/lib/siteMetadata");
const { SCHEMA_IDS } = await import("@/lib/schemaIds");
const { getOrganizationSchema, getAreaServed } = await import("@/lib/schema");
const { default: RootLayout } = await import("@/app/layout");
type OrgSettings = import("@/lib/types/schema").OrgSettings;

const SETTINGS: OrgSettings = {
  contact_email: "contato@exemplo.com",
  whatsapp: "",
  phone: "+550000000000",
  address: "Av Exemplo",
  address_locality: "Cidade",
  postal_code: "00000000",
  business_area: "Brasil",
  gmb_url: "https://share.google/exemplo",
  instagram_url: "https://www.instagram.com/exemplo",
  linkedin_url: "https://www.linkedin.com/company/exemplo",
  facebook_url: "",
  youtube_url: "",
  og_image_url: "/og-image.png",
};

const org = getOrganizationSchema(SETTINGS, BASE_URL);

/** JSON-LD emitidos pelo RootLayout. */
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

async function renderLayout() {
  return collectJsonLd(await RootLayout({ children: null }));
}

beforeEach(() => {
  db.fail = false;
});

describe("Organization — entidade única", () => {
  it("T01 — Organization com #organization", () => {
    expect(org["@type"]).toBe("Organization");
    expect(org["@id"]).toBe(SCHEMA_IDS.organization);
  });

  it("T06 — propriedades preservadas", () => {
    expect(org.name).toBe("RC2 Soluções");
    expect(org.url).toBe(BASE_URL);
    expect(org.logo).toEqual({
      "@type": "ImageObject",
      "@id": SCHEMA_IDS.logo,
      url: `${BASE_URL}/images/logo-base-transparente-preto.png`,
    });
    expect(org.email).toBe("contato@exemplo.com");
    expect(org.telephone).toBe("+550000000000");
    expect(org.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Av Exemplo",
      addressLocality: "Cidade",
      postalCode: "00000000",
      addressCountry: "BR",
    });
    expect(org.sameAs).toEqual([
      "https://www.instagram.com/exemplo",
      "https://www.linkedin.com/company/exemplo",
      "https://share.google/exemplo",
    ]);
    expect(org.contactPoint).toHaveLength(2);
    expect(org).not.toHaveProperty("geo");
  });
});

describe("areaServed", () => {
  it("T04 — 'Brasil' vira Country / Brasil", () => {
    expect(org.areaServed).toEqual([{ "@type": "Country", name: "Brasil" }]);
  });

  it("variações normalizadas de Brasil também são o país", () => {
    for (const v of ["brasil", "  Brasil ", "BRASIL", "Brazil"]) {
      expect(getAreaServed(v)).toEqual([{ "@type": "Country", name: "Brasil" }]);
    }
  });

  it("T05 — vazio também é Country / Brasil, nunca City nem 'Brazil'", () => {
    for (const v of ["", "   ", null, undefined]) {
      const area = getAreaServed(v);
      expect(area).toEqual([{ "@type": "Country", name: "Brasil" }]);
      expect(JSON.stringify(area)).not.toMatch(/City|Brazil/);
    }
  });

  it("valor sem regra conhecida vira texto, sem se afirmar cidade", () => {
    expect(getAreaServed("Grande São Paulo")).toEqual(["Grande São Paulo"]);
  });
});

describe("RootLayout — JSON-LD global", () => {
  it("T02 — com settings: Organization e WebSite, nenhum LocalBusiness", async () => {
    const blocks = await renderLayout();
    expect(blocks.map((b) => b["@type"])).toEqual(["Organization", "WebSite"]);
    expect(blocks.find((b) => b["@type"] === "Organization")?.areaServed).toEqual([
      { "@type": "Country", name: "Brasil" },
    ]);
  });

  it("T07 — WebSite.publisher → #organization", async () => {
    const website = (await renderLayout()).find((b) => b["@type"] === "WebSite");
    expect(website?.publisher).toEqual({ "@id": SCHEMA_IDS.organization });
  });

  it("T09 — settings falham: Organization mínima com @id e logo, sem LocalBusiness", async () => {
    db.fail = true;
    const blocks = await renderLayout();
    expect(blocks.map((b) => b["@type"])).toEqual(["Organization", "WebSite"]);
    expect(blocks[0]).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": SCHEMA_IDS.organization,
      name: "RC2 Soluções",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        "@id": SCHEMA_IDS.logo,
        url: `${BASE_URL}/images/logo-base-transparente-preto.png`,
      },
    });
  });
});
