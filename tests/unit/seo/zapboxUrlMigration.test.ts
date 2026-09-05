import { describe, expect, it, vi } from "vitest";
import nextConfig from "../../../next.config";
import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";
import {
  MIGRATED_SERVICE_SLUGS,
  MIGRATED_SOLUTION_SLUGS as MIGRATED_SOLUTIONS,
} from "@/lib/content/migratedRoutes";

/**
 * Fase 6F — migração das URLs de território Zapbox para a ponte (docs/22).
 *
 * `CD-3` classifica pelo objeto do trabalho: conversa, lead e venda pertencem
 * ao Zapbox. Estas quatro URLs tratam exatamente disso, e passam a redirecionar
 * para `/zapbox`, que explica o território e faz o handoff externo.
 *
 * O teste lê a configuração real em vez de reescrever as regras.
 */

type Rule = { source: string; destination: string; permanent?: boolean };

const rules = (await nextConfig.redirects!()) as unknown as Rule[];
const bySource = (source: string) => rules.filter((r) => r.source === source);

/** As quatro canônicas mais o alias — docs/22 §1. */
const MIGRATED_SOURCES = [
  "/servicos/automacoes-com-ia",
  "/solucoes/atendimento-lento",
  "/solucoes/leads-sem-resposta",
  "/solucoes/whatsapp-desorganizado",
  "/servicos/automacao-de-atendimento",
] as const;

/**
 * Continuam renderizando: SPLIT_INTENT, KEEP e NEEDS_SEO_DATA.
 *
 * `/servicos`, `/servicos/e-commerce` e `/servicos/sites-e-landing-pages`
 * saíram desta lista na Fase 3 (`docs/24`), que consolidou `/servicos` em
 * `/solucoes`. O contrato delas passou para `redirects.test.ts`. O que
 * permanece aqui é o que a Fase 3 deliberadamente NÃO decidiu.
 */
/**
 * Vazio: `/solucoes-com-ia` era a última URL que a 6F preservava sem destino
 * decidido, e o `SPLIT_INTENT` foi encerrado. O contrato dela passou para
 * `redirects.test.ts` e `sitemapMigration.test.ts`.
 */
const PRESERVED: readonly string[] = [];

describe("Migração Zapbox — regras de redirect", () => {
  it.each(MIGRATED_SOURCES)("%s redireciona para a ponte", (source) => {
    const matches = bySource(source);
    expect(matches).toHaveLength(1);
    expect(matches[0].destination).toBe("/zapbox");
  });

  it.each(MIGRATED_SOURCES)("%s é permanente (308)", (source) => {
    expect(bySource(source)[0].permanent).toBe(true);
  });

  it("o alias aponta direto para a ponte, sem passar pelo slug antigo", () => {
    const alias = bySource("/servicos/automacao-de-atendimento")[0];
    expect(alias.destination).toBe("/zapbox");
    expect(alias.destination).not.toBe("/servicos/automacoes-com-ia");
  });

  it("nenhuma regra nova aponta para o domínio externo do produto", () => {
    for (const rule of rules) {
      expect(rule.destination).not.toContain("zapbox.cloud");
    }
  });

  it("existem cinco sources para /zapbox, cada uma com variante de barra", () => {
    // Fase 7 (§21): cada consolidação gera o par `/x` e `/x/`, ambos direto ao
    // destino final — antes a variante com barra custava dois saltos.
    const paraPonte = rules.filter((r) => r.destination === "/zapbox");
    expect(paraPonte).toHaveLength(10);

    const semBarra = paraPonte.filter((r) => !r.source.endsWith("/"));
    expect(semBarra).toHaveLength(5);
    for (const regra of semBarra) {
      expect(paraPonte.some((r) => r.source === `${regra.source}/`)).toBe(true);
    }
  });
});

describe("Migração Zapbox — o que não recebe redirect", () => {
  it.each(PRESERVED)("%s continua sem redirect", (source) => {
    expect(bySource(source)).toHaveLength(0);
  });

  it("a ponte nunca redireciona", () => {
    expect(bySource("/zapbox")).toHaveLength(0);
  });
});

describe("Migração Zapbox — sitemap", () => {
  vi.mock("@/lib/supabase/server", () => ({
    createPublicClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({ order: async () => ({ data: [], error: null }) }),
        }),
      }),
    }),
  }));

  const paths = async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const entries = await sitemap();
    return entries.map((e) => e.url.replace("https://www.rc2solucoes.com.br", ""));
  };

  it.each([
    "/servicos/automacoes-com-ia",
    "/solucoes/atendimento-lento",
    "/solucoes/leads-sem-resposta",
    "/solucoes/whatsapp-desorganizado",
  ])("%s sai do sitemap ao passar a redirecionar", async (path) => {
    expect(await paths()).not.toContain(path);
  });

  it("o alias continua fora do sitemap", async () => {
    expect(await paths()).not.toContain("/servicos/automacao-de-atendimento");
  });

  it("a ponte permanece publicada como destino final indexável", async () => {
    expect(await paths()).toContain("/zapbox");
  });

  it.each(PRESERVED)("%s continua publicada", async (path) => {
    expect(await paths()).toContain(path);
  });

  it("publica exatamente as coleções menos os slugs migrados", async () => {
    // A contagem absoluta de Production (30 → 26) depende dos posts do blog,
    // mockados aqui como vazio. O contrato verificável no unit é a exclusão.
    const p = await paths();
    // Fase 3: com `e-commerce` e `sites-e-landing-pages` migrados, nenhum
    // slug de serviço permanece publicado.
    expect(p.filter((x) => x.startsWith("/servicos/"))).toHaveLength(
      services.length - MIGRATED_SERVICE_SLUGS.size
    );
    // Fase 3B: as duas últimas soluções por problema migraram; nenhum slug de
    // `/solucoes/[slug]` permanece publicado.
    //
    // `/solucoes/agenda-confirmada` (Fase 6) é rota estática própria, não um
    // item da coleção `solutions` — por isso sai da contagem.
    const daColecao = p.filter(
      (x) => x.startsWith("/solucoes/") && x !== "/solucoes/agenda-confirmada"
    );
    expect(daColecao).toHaveLength(solutions.length - MIGRATED_SOLUTIONS.size);
    expect(p).toContain("/solucoes/agenda-confirmada");
  });

  it("nenhuma entrada usa fragmento nem duplica", async () => {
    const p = await paths();
    for (const path of p) expect(path).not.toContain("#");
    expect(new Set(p).size).toBe(p.length);
  });
});

/**
 * A armadilha de `docs/22` §12: `relatedServices[].href` é chave de lookup
 * reverso em `servicos/[slug]/page.tsx`. Filtrar soluções migradas não pode
 * fazer o bloco relacionado sumir das páginas que continuam renderizando.
 */
describe("Migração Zapbox — lookup reverso preservado", () => {
  const MIGRATED_SOLUTION_SLUGS = new Set([
    "atendimento-lento",
    "leads-sem-resposta",
    "whatsapp-desorganizado",
  ]);

  const relatedSolutionFor = (slug: string) =>
    solutions.find(
      (solution) =>
        !MIGRATED_SOLUTION_SLUGS.has(solution.slug) &&
        solution.relatedServices.some((rs) => rs.href === `/servicos/${slug}`)
    );

  /**
   * Fase 3 (`docs/24`) tornou este lookup inalcançável: `/servicos/e-commerce`
   * e `/servicos/sites-e-landing-pages` passaram a redirecionar, e uma página
   * que redireciona nunca renderiza o próprio bloco relacionado.
   *
   * A armadilha inverte de sinal: o risco agora não é o bloco sumir, é uma
   * página viva continuar OFERECENDO um destino que redireciona.
   */
  it.each(["e-commerce", "sites-e-landing-pages"])(
    "nenhuma página viva oferece /servicos/%s como destino",
    (slug) => {
      expect(relatedSolutionFor(slug)).toBeUndefined();
    }
  );

  it("nenhuma página que permanece 200 linka para uma source migrada", () => {
    const migradas = new Set<string>(MIGRATED_SOURCES);
    const vivos = services.filter(
      (s) => !["agentes-de-ia", "automacao-de-processos", "automacoes-com-ia"].includes(s.slug)
    );
    for (const service of vivos) {
      for (const link of service.relatedLinks) {
        expect(migradas.has(link.href)).toBe(false);
      }
    }
    for (const solution of solutions.filter((s) => !MIGRATED_SOLUTION_SLUGS.has(s.slug))) {
      for (const link of [...solution.relatedLinks, ...solution.relatedServices]) {
        expect(migradas.has(link.href)).toBe(false);
      }
    }
  });
});
