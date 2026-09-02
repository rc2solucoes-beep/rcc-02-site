import { describe, expect, it } from "vitest";
import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";

/**
 * Migração SEO pós-Fase 5 — docs/16 §9.
 *
 * Duas URLs canônicas passam a redirecionar. Nenhum link controlado pelo
 * código pode continuar apontando para elas — princípio 5 de docs/16 §4.
 *
 * O teste-guarda de `relatedServices` existe porque esse campo é usado em
 * `/servicos/[slug]` como CHAVE DE LOOKUP REVERSO, não apenas como link
 * (achado A-1). Reapontar o href sem verificar apagaria o bloco "solução
 * relacionada" das páginas que continuam renderizando.
 */

const MIGRATED = [
  "/servicos/agentes-de-ia",
  "/servicos/automacao-de-processos",
] as const;

/** Slugs de serviço que continuam respondendo 200 após a migração. */
const RENDERED_SERVICE_SLUGS = [
  "automacoes-com-ia",
  "e-commerce",
  "sites-e-landing-pages",
] as const;

function allHrefs(): string[] {
  const out: string[] = [];
  for (const solution of solutions) {
    solution.relatedServices.forEach((item) => out.push(item.href));
    solution.relatedLinks.forEach((item) => out.push(item.href));
  }
  for (const service of services) {
    service.relatedLinks.forEach((item) => out.push(item.href));
  }
  return out;
}

describe("Internal links — URLs migradas", () => {
  it("nenhum link versionado aponta para as duas URLs que passam a redirecionar", () => {
    const ofensores = allHrefs().filter((href) =>
      MIGRATED.some((migrada) => href === migrada)
    );
    expect(ofensores).toEqual([]);
  });

  it("usa as âncoras finais como destino", () => {
    const hrefs = allHrefs();
    expect(hrefs).toContain("/solucoes#automacao-de-processos");
    expect(hrefs).toContain("/solucoes#ia-para-operacoes");
  });

  it("nunca usa um alias de redirect como destino de link", () => {
    const aliases = [
      "/services",
      "/servicos/integracao-de-sistemas",
      "/servicos/operacoes-digitais",
      "/servicos/automacao-de-atendimento",
      // Fase 6F — passam a redirecionar para a ponte (docs/22 §15).
      "/servicos/automacoes-com-ia",
      "/solucoes/atendimento-lento",
      "/solucoes/leads-sem-resposta",
      "/solucoes/whatsapp-desorganizado",
    ];
    for (const href of allHrefs()) {
      expect(aliases).not.toContain(href);
    }
  });
});

describe("Internal links — URLs preservadas", () => {
  it("mantém os links para /solucoes-com-ia, que não foi migrada", () => {
    expect(allHrefs()).toContain("/solucoes-com-ia");
  });

  it("mantém os links para os serviços DEFER, NEEDS_SEO_DATA e KEEP", () => {
    const hrefs = allHrefs();
    for (const slug of RENDERED_SERVICE_SLUGS) {
      expect(hrefs).toContain(`/servicos/${slug}`);
    }
  });
});

describe("Guarda A-1 — lookup reverso de relatedServices", () => {
  // Reproduz a lógica de src/app/(public)/servicos/[slug]/page.tsx:53-55.
  const lookup = (slug: string) =>
    solutions.find((solution) =>
      solution.relatedServices.some(
        (relatedService) => relatedService.href === `/servicos/${slug}`
      )
    );

  it.each(RENDERED_SERVICE_SLUGS)(
    "/servicos/%s continua encontrando a solução relacionada",
    (slug) => {
      expect(lookup(slug)).toBeDefined();
    }
  );

  it("as coleções legadas não foram mutiladas", () => {
    expect(services).toHaveLength(5);
    expect(solutions).toHaveLength(5);
    for (const slug of ["agentes-de-ia", "automacao-de-processos"]) {
      expect(services.some((service) => service.slug === slug)).toBe(true);
    }
  });

  it("toda solução mantém pelo menos um serviço relacionado", () => {
    for (const solution of solutions) {
      expect(solution.relatedServices.length).toBeGreaterThan(0);
    }
  });
});
