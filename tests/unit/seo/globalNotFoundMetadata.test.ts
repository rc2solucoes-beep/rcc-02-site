import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";

/**
 * IDX-08 — metadata do 404 global (docs/seo/01-indexacao-rastreamento.md).
 *
 * O layout raiz declara `index, follow` (também no `googleBot`), canonical e
 * og:url da Home. O merge de metadata do Next é raso: cada chave que o
 * `not-found.tsx` define substitui a do layout inteira. Por isso o 404 precisa
 * definir `robots`, `alternates` e `openGraph` — não basta herdar.
 *
 * O HTML real (status, todas as tags robots, zero canonical) é provado por
 * `tests/e2e/global-not-found.spec.ts`.
 */

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => ({ from: () => ({ select: async () => ({ data: [] }) }) }),
}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("next/font/google", () => ({
  Barlow: () => ({ variable: "font-barlow" }),
  Barlow_Condensed: () => ({ variable: "font-barlow-condensed" }),
}));

const notFound = await import("@/app/not-found");
const blogNotFound = await import("@/app/(public)/blog/[slug]/not-found");
const rootLayout = await import("@/app/layout");
const home = await import("@/app/(public)/page");
const { BASE_URL } = await import("@/lib/siteMetadata");

describe("404 global — metadata", () => {
  const meta = notFound.metadata;

  it("T01 — robots.index = false", () => {
    expect(meta.robots).toMatchObject({ index: false });
  });

  it("T02 — robots.follow = false", () => {
    expect(meta.robots).toMatchObject({ follow: false });
  });

  it("T02b — sem googleBot próprio: o `index, follow` do layout não sobrevive ao merge raso", () => {
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("T03 — canonical explicitamente nulo, para não herdar o da Home", () => {
    expect(meta.alternates).toEqual({ canonical: null });
  });

  it("T03b — sem Open Graph, para não herdar og:url da Home", () => {
    expect(meta.openGraph).toBeNull();
  });

  it("título do 404 é o mesmo texto já visível na página", () => {
    expect(meta.title).toBe("Página não encontrada");
  });

  it("toda chave do layout que identifica a página é sobrescrita", () => {
    for (const key of ["robots", "alternates", "openGraph"] as const) {
      expect(meta).toHaveProperty(key);
    }
  });

  it("não consulta banco nem rede: metadata estática, sem imports de dados", () => {
    const src = readFileSync(resolve(__dirname, "../../../src/app/not-found.tsx"), "utf8");
    expect("generateMetadata" in notFound).toBe(false);
    expect(src).not.toMatch(/supabase|fetch\(|@\/lib\/schema/);
  });
});

describe("404 global — UI preservada", () => {
  it("T04 — mesmo conteúdo visível e CTA para a Home", () => {
    render(createElement(notFound.default));
    expect(screen.getByText("Erro 404")).toBeInTheDocument();
    expect(screen.getByText("Página não encontrada")).toBeInTheDocument();
    expect(screen.getByText("O endereço que você acessou não existe ou foi movido.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute("href", "/");
  });

  it("o 404 do blog (IDX-01) segue reaproveitando a mesma UI, com metadata própria", () => {
    expect(blogNotFound.default).toBe(notFound.default);
    expect(blogNotFound.metadata.robots).toEqual({ index: false, follow: false });
    expect(blogNotFound.metadata.alternates).toEqual({ canonical: null });
  });
});

describe("T05 — páginas reais mantêm a metadata do layout", () => {
  it("layout raiz continua indexável, com googleBot e canonical da Home", async () => {
    const meta = await rootLayout.generateMetadata();
    expect(meta.robots).toMatchObject({ index: true, follow: true, googleBot: { index: true, follow: true } });
    expect(meta.alternates).toEqual({ canonical: `${BASE_URL}/` });
    expect(meta.openGraph).toMatchObject({ url: BASE_URL });
  });

  it("Home continua com canonical próprio", async () => {
    const meta = await home.generateMetadata();
    expect(meta.alternates).toEqual({ canonical: `${BASE_URL}/` });
  });
});
