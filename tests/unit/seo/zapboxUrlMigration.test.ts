import { describe, expect, it, vi } from "vitest";
import nextConfig from "../../../next.config";
import { services } from "@/lib/content/services";
import { solutions } from "@/lib/content/solutions";

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

/** Continuam renderizando: SPLIT_INTENT, KEEP e NEEDS_SEO_DATA. */
const PRESERVED = [
  "/solucoes-com-ia",
  "/servicos",
  "/servicos/sites-e-landing-pages",
  "/servicos/e-commerce",
  "/solucoes/processos-manuais",
  "/solucoes/sistemas-desconectados",
] as const;

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

  it("existem exatamente cinco regras com destino /zapbox", () => {
    expect(rules.filter((r) => r.destination === "/zapbox")).toHaveLength(5);
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

  it("o sitemap fica com 26 URLs", async () => {
    // 30 no baseline (docs/22 §9) menos as quatro canônicas migradas.
    expect(await paths()).toHaveLength(26);
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

  it("/servicos/e-commerce mantém o bloco relacionado", () => {
    expect(relatedSolutionFor("e-commerce")?.slug).toBe("sistemas-desconectados");
  });

  it("/servicos/sites-e-landing-pages não oferece destino que redireciona", () => {
    const related = relatedSolutionFor("sites-e-landing-pages");
    if (related) expect(MIGRATED_SOLUTION_SLUGS.has(related.slug)).toBe(false);
  });

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
