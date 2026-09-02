import { describe, expect, it, vi } from "vitest";
import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";

/**
 * Fase 6D — descoberta da ponte (docs/20 §9).
 *
 * `/zapbox` entra no sitemap **na mesma unidade** que cria a rota. Nenhuma URL
 * é removida aqui: as migrações de território Zapbox pertencem à 6G.
 */

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ order: async () => ({ data: [], error: null }) }),
      }),
    }),
  }),
}));

const sitemap = (await import("@/app/sitemap")).default;
const entries = await sitemap();
const paths = entries.map((entry) =>
  entry.url.replace("https://www.rc2solucoes.com.br", "")
);

describe("Sitemap — a ponte entra", () => {
  it("publica /zapbox", () => {
    expect(paths).toContain("/zapbox");
  });
});

describe("Sitemap — nada é removido na 6D", () => {
  it.each([
    "/solucoes",
    "/servicos",
    "/solucoes-com-ia",
    "/servicos/automacoes-com-ia",
    "/servicos/e-commerce",
    "/servicos/sites-e-landing-pages",
  ])("%s continua publicada", (path) => {
    expect(paths).toContain(path);
  });

  it("as cinco subpáginas de /solucoes continuam publicadas", () => {
    for (const solution of solutions) {
      expect(paths).toContain(`/solucoes/${solution.slug}`);
    }
  });

  it("as URLs migradas na Fase 5 continuam fora", () => {
    expect(paths).not.toContain("/servicos/agentes-de-ia");
    expect(paths).not.toContain("/servicos/automacao-de-processos");
  });
});

describe("Sitemap — higiene", () => {
  it("nenhuma entrada usa fragmento de âncora", () => {
    for (const path of paths) {
      expect(path).not.toContain("#");
    }
  });

  it("não há URLs duplicadas", () => {
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("nenhuma entrada aponta para domínio externo", () => {
    for (const entry of entries) {
      expect(entry.url.startsWith("https://www.rc2solucoes.com.br")).toBe(true);
    }
  });

  it("as coleções legadas não foram mutiladas", () => {
    expect(services).toHaveLength(5);
    expect(solutions).toHaveLength(5);
  });
});
