import { describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * SDD Schema.org — Fase 2.1: hardening do fallback de WebPage.
 *
 * Antes, uma falha de `getOrgSettings()` fazia as páginas emitirem só
 * `{"@context":"https://schema.org","@type":"WebPage"}`. A identidade do WebPage
 * não pode depender do banco: só a imagem configurável depende dos settings.
 */

// Falha real: o cliente Supabase lança, então `getOrgSettings()` rejeita.
vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => {
    throw new Error("supabase indisponível (teste)");
  },
}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.spyOn(console, "error").mockImplementation(() => {});

const { BASE_URL } = await import("@/lib/siteMetadata");
const { SCHEMA_IDS } = await import("@/lib/schemaIds");
const { getWebPageSchema, getOrgSettingsOrNull } = await import("@/lib/schema");

const MINIMO = JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage" });

describe("WebPage sem settings — builder", () => {
  const page = { title: "Contato", description: "Fale com a RC2.", url: `${BASE_URL}/contato`, keywords: "contato" };
  const schema = getWebPageSchema(null, page, BASE_URL);

  it("getOrgSettingsOrNull devolve null quando o banco falha, sem lançar", async () => {
    await expect(getOrgSettingsOrNull()).resolves.toBeNull();
  });

  it("T01 — mantém tipo, nome, descrição e url", () => {
    expect(schema["@type"]).toBe("WebPage");
    expect(schema.name).toBe("Contato");
    expect(schema.description).toBe("Fale com a RC2.");
    expect(schema.url).toBe(`${BASE_URL}/contato`);
    expect(schema.keywords).toBe("contato");
  });

  it("T02 — mantém @id = {canonical}#webpage", () => {
    expect(schema["@id"]).toBe(`${BASE_URL}/contato#webpage`);
  });

  it("T03 — mantém isPartOf → #website", () => {
    expect(schema.isPartOf).toEqual({ "@id": SCHEMA_IDS.website });
  });

  it("T04 — mantém publisher → #organization", () => {
    expect(schema.publisher).toEqual({ "@id": SCHEMA_IDS.organization });
  });

  it("T05 — sem imagem da página nem settings, usa /og-image.png absoluta", () => {
    expect(schema.image).toBe(`${BASE_URL}/og-image.png`);
  });

  it("T06 — nunca é o objeto mínimo vazio", () => {
    expect(JSON.stringify(schema)).not.toBe(MINIMO);
  });
});

/** Procura, na árvore devolvida pelo Server Component, o script JSON-LD do WebPage. */
function findWebPageJsonLd(node: ReactNode): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findWebPageJsonLd(child);
      if (found) return found;
    }
    return null;
  }
  if (!isValidElement(node)) return null;
  const el = node as ReactElement<{
    type?: string;
    dangerouslySetInnerHTML?: { __html: string };
    children?: ReactNode;
  }>;
  if (el.type === "script" && el.props.type === "application/ld+json") {
    const json = JSON.parse(el.props.dangerouslySetInnerHTML?.__html ?? "null");
    if (json?.["@type"] === "WebPage") return json;
  }
  return findWebPageJsonLd(el.props.children);
}

/**
 * Teste de falha real, página por página: com o Supabase lançando, o
 * componente da página ainda emite o WebPage completo.
 */
describe("WebPage sem settings — páginas publicadas", () => {
  // [rota, módulo, @id esperado, url esperada]. Na Home a url é BASE_URL sem
  // barra (inalterada desde o baseline) e o @id resolve como …/#webpage.
  const PAGINAS = [
    ["/", "@/app/(public)/page", `${BASE_URL}/#webpage`, BASE_URL],
    ["/blog", "@/app/(public)/blog/page", `${BASE_URL}/blog#webpage`, `${BASE_URL}/blog`],
    ["/sobre", "@/app/(public)/sobre/page", `${BASE_URL}/sobre#webpage`, `${BASE_URL}/sobre`],
    ["/contato", "@/app/(public)/contato/page", `${BASE_URL}/contato#webpage`, `${BASE_URL}/contato`],
    ["/privacidade", "@/app/(public)/privacidade/page", `${BASE_URL}/privacidade#webpage`, `${BASE_URL}/privacidade`],
    ["/termos", "@/app/(public)/termos/page", `${BASE_URL}/termos#webpage`, `${BASE_URL}/termos`],
    ["/avaliacoes", "@/app/(public)/avaliacoes/page", `${BASE_URL}/avaliacoes#webpage`, `${BASE_URL}/avaliacoes`],
  ] as const;

  it.each(PAGINAS)("%s emite WebPage completo", async (_rota, modulo, id, url) => {
    const { default: Page } = (await import(/* @vite-ignore */ modulo)) as {
      default: () => Promise<ReactNode>;
    };
    const schema = findWebPageJsonLd(await Page());

    expect(schema).not.toBeNull();
    expect(JSON.stringify(schema)).not.toBe(MINIMO);
    expect(schema?.["@id"]).toBe(id);
    expect(schema?.url).toBe(url);
    expect(typeof schema?.name).toBe("string");
    expect(typeof schema?.description).toBe("string");
    expect(schema?.isPartOf).toEqual({ "@id": SCHEMA_IDS.website });
    expect(schema?.publisher).toEqual({ "@id": SCHEMA_IDS.organization });
    expect(typeof schema?.image).toBe("string");
    expect(String(schema?.image)).toMatch(/^https:\/\//);
  });
});
