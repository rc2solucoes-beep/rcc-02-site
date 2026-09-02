import { describe, expect, it, vi } from "vitest";
import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";

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
