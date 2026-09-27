import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * SDD Schema.org — Fase 2: WebPage (`docs/schema/baseline.md`).
 *
 * Todo WebPage publicado ganha `{canonical}#webpage`, referencia o WebSite e a
 * Organization globais por `@id` e resolve imagens sem concatenar BASE_URL com
 * uma URL que já era absoluta.
 */

vi.mock("@/lib/supabase/server", () => ({ createPublicClient: vi.fn() }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

const { BASE_URL } = await import("@/lib/siteMetadata");
const { SCHEMA_IDS, schemaWebPageId } = await import("@/lib/schemaIds");
const { getWebPageSchema, resolveSchemaUrl } = await import("@/lib/schema");
type OrgSettings = import("@/lib/types/schema").OrgSettings;

const SETTINGS: OrgSettings = {
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
  og_image_url: "/og-image.png",
};

const CONTATO = {
  title: "Contato",
  description: "Fale com a RC2.",
  url: `${BASE_URL}/contato`,
  keywords: "contato",
};

const page = getWebPageSchema(SETTINGS, CONTATO, BASE_URL);

describe("WebPage — identidade e referências", () => {
  it("T01 — @id é {canonical}#webpage", () => {
    expect(page["@id"]).toBe("https://www.rc2solucoes.com.br/contato#webpage");
    expect(page.url).toBe(`${BASE_URL}/contato`);
  });

  it("T02 — isPartOf referencia o WebSite global só por @id", () => {
    expect(page.isPartOf).toEqual({ "@id": SCHEMA_IDS.website });
  });

  it("T03 — publisher referencia a Organization global só por @id", () => {
    expect(page.publisher).toEqual({ "@id": SCHEMA_IDS.organization });
  });

  it("preserva as propriedades existentes", () => {
    expect(page.name).toBe("Contato");
    expect(page.description).toBe("Fale com a RC2.");
    expect(page.keywords).toBe("contato");
  });

  it("a raiz resolve como …/#webpage, sem barra acrescentada em outros paths", () => {
    expect(schemaWebPageId(BASE_URL)).toBe(`${BASE_URL}/#webpage`);
    expect(schemaWebPageId(`${BASE_URL}/`)).toBe(`${BASE_URL}/#webpage`);
    expect(schemaWebPageId(`${BASE_URL}/solucoes/agenda-confirmada`)).toBe(
      `${BASE_URL}/solucoes/agenda-confirmada#webpage`
    );
    expect(schemaWebPageId(`${BASE_URL}/sobre#metodo`)).toBe(
      `${BASE_URL}/sobre#webpage`
    );
  });
});

describe("WebPage — imagem", () => {
  it("T04 — relativa resolve contra BASE_URL", () => {
    expect(resolveSchemaUrl("/og-image.png", BASE_URL)).toBe(
      "https://www.rc2solucoes.com.br/og-image.png"
    );
  });

  it("T05 — absoluta é preservada exatamente", () => {
    expect(resolveSchemaUrl("https://example-cdn.com/image.png", BASE_URL)).toBe(
      "https://example-cdn.com/image.png"
    );
    expect(resolveSchemaUrl("http://example-cdn.com/a.png?v=1", BASE_URL)).toBe(
      "http://example-cdn.com/a.png?v=1"
    );
  });

  it("T06 — regressão: settings com URL absoluta não gera com.brhttps://", () => {
    const blob = "https://ccaonec11w7vkoy6.public.blob.vercel-storage.com/og_image_home.png";
    const semImagem = { ...CONTATO, image: undefined };
    const result = getWebPageSchema({ ...SETTINGS, og_image_url: blob }, semImagem, BASE_URL);
    expect(result.image).toBe(blob);
    expect(result.image).not.toContain("com.brhttps://");
  });

  it("T07 — sem imagem configurada, cai na imagem padrão do site", () => {
    const semImagem = { ...CONTATO, image: undefined };
    for (const og of ["", "   "]) {
      const result = getWebPageSchema({ ...SETTINGS, og_image_url: og }, semImagem, BASE_URL);
      expect(result.image).toBe(`${BASE_URL}/og-image.png`);
    }
    expect(resolveSchemaUrl("", BASE_URL)).toBeUndefined();
    expect(resolveSchemaUrl(undefined, BASE_URL)).toBeUndefined();
  });

  it("a imagem explícita da página vence os settings", () => {
    const result = getWebPageSchema(
      { ...SETTINGS, og_image_url: "https://cdn.example.com/x.png" },
      { ...CONTATO, image: `${BASE_URL}/og-image.png` },
      BASE_URL
    );
    expect(result.image).toBe(`${BASE_URL}/og-image.png`);
  });

  it("T08 — @id depende só da URL canônica, não dos settings", () => {
    const outro = getWebPageSchema(
      { ...SETTINGS, og_image_url: "https://cdn.example.com/x.png", phone: "1" },
      CONTATO,
      BASE_URL
    );
    expect(outro["@id"]).toBe(page["@id"]);
    expect(getWebPageSchema(SETTINGS, CONTATO, BASE_URL)).toEqual(page);
  });
});

/**
 * Produtores manuais publicados. Ler o código-fonte é o mesmo padrão de
 * `tests/unit/brand`: as páginas são Server Components com dados do banco.
 */
describe("WebPage — produtores manuais", () => {
  const root = process.cwd();
  const MANUAIS = [
    "src/app/(public)/zapbox/page.tsx",
    "src/app/(public)/solucoes/page.tsx",
    "src/app/(public)/solucoes/agenda-confirmada/page.tsx",
  ];

  it.each(MANUAIS)("%s referencia #website e usa o helper de @id", (file) => {
    const src = readFileSync(join(root, file), "utf-8");
    expect(src).not.toContain('"@type": "WebSite"');
    expect(src).toContain('isPartOf: { "@id": SCHEMA_IDS.website }');
    expect(src).toContain('"@id": schemaWebPageId(pageUrl)');
  });
});
