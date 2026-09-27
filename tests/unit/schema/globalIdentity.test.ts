import { describe, expect, it, vi } from "vitest";

/**
 * SDD Schema.org — Fase 1: identidade global (`docs/schema/baseline.md`).
 *
 * Organization, logo e WebSite ganham `@id` estável, e o WebSite aponta para a
 * organização. Os builders são puros; o acesso ao banco (`getOrgSettings`) não
 * participa destes contratos.
 */

vi.mock("@/lib/supabase/server", () => ({ createPublicClient: vi.fn() }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

const { BASE_URL } = await import("@/lib/siteMetadata");
const { SCHEMA_IDS } = await import("@/lib/schemaIds");
const schemaModule = await import("@/lib/schema");
const { getOrganizationSchema, getWebSiteSchema } = schemaModule;
type OrgSettings = import("@/lib/types/schema").OrgSettings;

const EMPTY: OrgSettings = {
  contact_email: "",
  whatsapp: "",
  phone: "",
  address: "",
  business_area: "",
  gmb_url: "",
  instagram_url: "",
  linkedin_url: "",
  facebook_url: "",
  youtube_url: "",
  og_image_url: "",
};

const FULL: OrgSettings = {
  ...EMPTY,
  contact_email: "contato@exemplo.com",
  phone: "+550000000000",
  address: "Rua Exemplo",
  address_locality: "Cidade",
  postal_code: "00000000",
  business_area: "Região",
  instagram_url: "https://instagram.com/exemplo",
};

const organization = getOrganizationSchema(FULL, BASE_URL);
const website = getWebSiteSchema(BASE_URL);

describe("Schema — identidade global", () => {
  it("T01 — Organization usa #organization", () => {
    expect(organization["@id"]).toBe(`${BASE_URL}/#organization`);
  });

  it("T02 — logo é um ImageObject com #logo", () => {
    expect(organization.logo["@type"]).toBe("ImageObject");
    expect(organization.logo["@id"]).toBe(`${BASE_URL}/#logo`);
  });

  it("T03 — o logo continua sendo a imagem atual, em URL absoluta", () => {
    expect(organization.logo.url).toBe(
      `${BASE_URL}/images/logo-base-transparente-preto.png`
    );
    expect(organization.logo).toEqual({
      "@type": "ImageObject",
      "@id": `${BASE_URL}/#logo`,
      url: `${BASE_URL}/images/logo-base-transparente-preto.png`,
    });
  });

  it("T04 — WebSite usa #website", () => {
    expect(website["@id"]).toBe(`${BASE_URL}/#website`);
  });

  it("T05 — WebSite.publisher referencia a organização só por @id", () => {
    expect(website.publisher).toEqual({ "@id": organization["@id"] });
  });

  it("T06 — os IDs são determinísticos e não dependem dos settings", () => {
    const semSettings = getOrganizationSchema(EMPTY, BASE_URL);
    expect(semSettings["@id"]).toBe(organization["@id"]);
    expect(semSettings.logo).toEqual(organization.logo);
    expect(getWebSiteSchema(BASE_URL)).toEqual(website);
    expect(SCHEMA_IDS).toEqual({
      organization: `${BASE_URL}/#organization`,
      website: `${BASE_URL}/#website`,
      logo: `${BASE_URL}/#logo`,
    });
    for (const id of Object.values(SCHEMA_IDS)) {
      expect(id.startsWith("https://www.rc2solucoes.com.br/#")).toBe(true);
    }
  });

  it("os três @id são distintos", () => {
    expect(new Set(Object.values(SCHEMA_IDS)).size).toBe(3);
  });

  it("preserva as propriedades alimentadas pelos settings", () => {
    expect(organization.name).toBe("RC2 Soluções");
    expect(organization.url).toBe(BASE_URL);
    expect(organization.email).toBe("contato@exemplo.com");
    expect(organization.telephone).toBe("+550000000000");
    expect(organization.address?.streetAddress).toBe("Rua Exemplo");
    expect(organization.sameAs).toEqual(["https://instagram.com/exemplo"]);
    expect(organization.contactPoint).toHaveLength(2);
  });
});

// Fase 7: o LocalBusiness, que a Fase 1 deixava intacto, foi removido.
describe("Schema — LocalBusiness removido (Fase 7)", () => {
  it("o módulo de schema não oferece mais um builder de LocalBusiness", () => {
    expect(schemaModule).not.toHaveProperty("getLocalBusinessSchema");
  });
});
