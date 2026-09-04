import { describe, expect, it, vi } from "vitest";
import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";
import { MIGRATED_SOLUTION_SLUGS } from "@/lib/content/migratedRoutes";

/**
 * Sitemap após a migração SEO pós-Fase 5 — docs/16 §11.
 *
 * Saem apenas as duas URLs canônicas que passam a redirecionar. Tudo o que
 * continua 200, indexável e self-canonical permanece publicado — inclusive
 * `/servicos` e `/solucoes-com-ia`, que ficaram fora da navegação.
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

describe("Sitemap — URLs migradas saem", () => {
  it.each(["/servicos/agentes-de-ia", "/servicos/automacao-de-processos"])(
    "%s não é mais publicada",
    (path) => {
      expect(paths).not.toContain(path);
    }
  );
});

describe("Sitemap — URLs preservadas permanecem", () => {
  it.each([
    // Fase 3 (`docs/24`) removeu `/servicos` e seus dois últimos slugs: eles
    // passaram a redirecionar e não podem seguir publicados como destino.
    "/solucoes",
    "/solucoes-com-ia",
  ])("%s continua publicada", (path) => {
    expect(paths).toContain(path);
  });

  it("nenhuma URL de /servicos permanece no sitemap", () => {
    expect(paths.filter((path) => path.startsWith("/servicos"))).toEqual([]);
  });

  it("as subpáginas de /solucoes que não migraram continuam publicadas", () => {
    // Fase 6F: as três de território Zapbox saíram (docs/22 §9).
    for (const solution of solutions.filter(
      (s) => !MIGRATED_SOLUTION_SLUGS.has(s.slug)
    )) {
      expect(paths).toContain(`/solucoes/${solution.slug}`);
    }
  });
});

describe("Sitemap — higiene", () => {
  it.each([
    "/services",
    "/services/",
    "/servicos/integracao-de-sistemas",
    "/servicos/operacoes-digitais",
    "/servicos/automacao-de-atendimento",
    // Fase 6F — território Zapbox consolidado na ponte (docs/22 §9).
    "/servicos/automacoes-com-ia",
    "/solucoes/atendimento-lento",
    "/solucoes/leads-sem-resposta",
    "/solucoes/whatsapp-desorganizado",
  ])("o alias %s continua fora do sitemap", (path) => {
    expect(paths).not.toContain(path);
  });

  it("nenhuma entrada usa fragmento de âncora", () => {
    for (const path of paths) {
      expect(path).not.toContain("#");
    }
  });

  it("não há URLs duplicadas", () => {
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("a coleção de serviços não foi mutilada para controlar o sitemap", () => {
    expect(services).toHaveLength(5);
  });
});
