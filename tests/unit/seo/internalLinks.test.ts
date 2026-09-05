import { describe, expect, it } from "vitest";
import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";
import {
  MIGRATED_SERVICE_SLUGS,
  MIGRATED_SOLUTION_SLUGS,
} from "@/lib/content/migratedRoutes";

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
  // Fase 3 (`docs/24`) — consolidação de `/servicos` em `/solucoes`.
  "/servicos",
  "/servicos/e-commerce",
  "/servicos/sites-e-landing-pages",
] as const;

/**
 * Slugs de serviço que continuam respondendo 200 após a migração.
 *
 * Fase 3 esvaziou esta lista: com `e-commerce` e `sites-e-landing-pages`
 * migrados, nenhuma URL sob `/servicos` responde 200. O array vazio é o
 * estado correto, não um esquecimento — e o contrato abaixo passou a afirmar
 * a ausência.
 */
const RENDERED_SERVICE_SLUGS = [] as const;

/**
 * Só os links efetivamente alcançáveis.
 *
 * Uma entidade cuja URL redireciona nunca renderiza os próprios links
 * relacionados; contá-los produziria falso positivo. Por isso os dados dessas
 * entidades são preservados (`PRESERVE_DATA`, docs/22 §11.1) sem que os hrefs
 * internos contem como link publicado.
 */
function allHrefs(): string[] {
  const out: string[] = [];
  for (const solution of solutions) {
    if (MIGRATED_SOLUTION_SLUGS.has(solution.slug)) continue;
    solution.relatedServices.forEach((item) => out.push(item.href));
    solution.relatedLinks.forEach((item) => out.push(item.href));
  }
  for (const service of services) {
    if (MIGRATED_SERVICE_SLUGS.has(service.slug)) continue;
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

  /**
   * Fase 3B esvaziou `allHrefs()`: todo serviço e toda solução por problema
   * passaram a redirecionar, então nenhuma entidade renderiza os próprios
   * links relacionados.
   *
   * Isso torna VACUOS os contratos "nenhum link aponta para X" deste arquivo —
   * eles passam sobre uma lista vazia. O teste abaixo existe para que essa
   * condição seja explícita: se algum slug voltar a renderizar, `allHrefs()`
   * deixa de ser vazio e os outros contratos voltam a ter efeito.
   */
  it("nenhuma entidade de serviço ou solução continua alcançável", () => {
    expect(allHrefs()).toEqual([]);
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
      // Fase 3 — consolidação de /servicos (docs/24).
      "/servicos",
      "/servicos/e-commerce",
      "/servicos/sites-e-landing-pages",
    ];
    for (const href of allHrefs()) {
      expect(aliases).not.toContain(href);
    }
  });
});

describe("Internal links — URLs preservadas", () => {
  /**
   * `SPLIT_INTENT_INTERNAL_LINK_ORPHANED` — achado da Fase 6F.
   *
   * `/solucoes-com-ia` continua 200, indexável e no sitemap, mas os três links
   * internos que restavam viviam dentro de `automacoes-com-ia`, `agentes-de-ia`
   * e `atendimento-lento` — todas migradas. A página saiu da navegação na
   * Fase 5, então deixa de receber link interno.
   *
   * Não é regressão desta unidade nem autoriza inventar um link novo: onde
   * ligá-la é decisão de arquitetura, junto com o destino do `SPLIT_INTENT`.
   * O teste fixa o estado para que qualquer mudança seja deliberada.
   */
  // Deixou de ser dívida: a página passou a redirecionar para `/solucoes` ao
  // encerrar o `SPLIT_INTENT`. Nenhum link para ela é o estado correto agora.
  it("nenhum link aponta para a URL do SPLIT_INTENT encerrado", () => {
    expect(allHrefs()).not.toContain("/solucoes-com-ia");
  });

  it("nenhum slug de serviço continua renderizando após a consolidação", () => {
    expect(RENDERED_SERVICE_SLUGS).toEqual([]);
  });

  it("nenhum link interno alcançável aponta para /servicos", () => {
    // Um link interno para URL que redireciona faz o usuário — e o crawler —
    // pagar um 301 evitável.
    expect(allHrefs().filter((href) => href.startsWith("/servicos"))).toEqual([]);
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
