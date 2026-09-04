import { describe, expect, it, vi } from "vitest";
import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";
import { MIGRATED_SOLUTION_SLUGS } from "@/lib/content/migratedRoutes";

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
  // A 6D não removeu nada. As URLs de `/servicos` saíram depois, na Fase 3
  // (`docs/24`), ao passarem a redirecionar — decisão de outra unidade, com
  // contrato próprio em `tests/unit/seo/sitemapMigration.test.ts`.
  it.each([
    "/solucoes",
    "/solucoes-com-ia",
  ])("%s continua publicada", (path) => {
    expect(paths).toContain(path);
  });

  it("as subpáginas de /solucoes fora do território Zapbox continuam publicadas", () => {
    // A 6D não removeu nada; a 6F removeu as três de território Zapbox.
    for (const solution of solutions.filter(
      (s) => !MIGRATED_SOLUTION_SLUGS.has(s.slug)
    )) {
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
