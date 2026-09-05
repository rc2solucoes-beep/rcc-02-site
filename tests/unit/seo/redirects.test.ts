import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

/**
 * Contrato dos redirects da migração SEO pós-Fase 5 — docs/16 §13.
 *
 * O teste lê a configuração real em vez de reescrever as regras, para não
 * virar uma cópia da implementação.
 */

type Rule = { source: string; destination: string; permanent?: boolean };

const rules = (await nextConfig.redirects!()) as unknown as Rule[];

const bySource = (source: string) =>
  rules.filter((rule) => rule.source === source);

const MIGRATION = [
  ["/servicos/agentes-de-ia", "/solucoes#ia-para-operacoes"],
  ["/servicos/automacao-de-processos", "/solucoes#automacao-de-processos"],
  ["/servicos/integracao-de-sistemas", "/solucoes#integracao-de-sistemas"],
  ["/servicos/operacoes-digitais", "/solucoes#operacoes-digitais-commerce"],
  ["/services", "/solucoes"],
] as const;

describe("Redirects — as cinco sources migradas", () => {
  it.each(MIGRATION)("%s redireciona para %s", (source, destination) => {
    const matches = bySource(source);
    expect(matches).toHaveLength(1);
    expect(matches[0].destination).toBe(destination);
  });

  it.each(MIGRATION)("%s é permanente", (source) => {
    expect(bySource(source)[0].permanent).toBe(true);
  });
});

describe("Redirects — anti-chain", () => {
  it("nenhum destino das cinco é source de outra regra", () => {
    const sources = new Set(rules.map((rule) => rule.source));
    for (const [, destination] of MIGRATION) {
      const semHash = destination.split("#")[0];
      expect(sources.has(destination)).toBe(false);
      expect(sources.has(semHash)).toBe(false);
    }
  });

  it("nenhuma das cinco aponta para uma página de /servicos", () => {
    for (const [, destination] of MIGRATION) {
      expect(destination.startsWith("/servicos")).toBe(false);
    }
  });
});

describe("Redirects — território preservado", () => {
  it("o alias de automação de atendimento aponta direto para a ponte", () => {
    // Fase 6F (docs/22 §7): reapontado na mesma unidade em que a URL canônica
    // migra, para não criar chain pelo slug antigo.
    const matches = bySource("/servicos/automacao-de-atendimento");
    expect(matches).toHaveLength(1);
    expect(matches[0].destination).toBe("/zapbox");
  });

  it("nenhuma URL legada continua sem destino decidido", () => {
    // `/solucoes-com-ia` era a última. O `SPLIT_INTENT` foi encerrado: a
    // metade RC2 da página vive em `/solucoes`.
    expect(bySource("/solucoes-com-ia")[0].destination).toBe("/solucoes");
    expect(bySource("/solucoes-com-ia")[0].permanent).toBe(true);
  });
});

/**
 * Fase 3 — consolidação de `/servicos` em `/solucoes`
 * (`RC2_Correcoes_Recomendadas_Site.md` §12, `docs/24`).
 */
describe("Redirects — consolidação de /servicos", () => {
  const CONSOLIDACAO = [
    ["/servicos", "/solucoes"],
    ["/servicos/e-commerce", "/solucoes#operacoes-digitais-commerce"],
    ["/servicos/sites-e-landing-pages", "/solucoes"],
    // Fase 3B — §20 das Correções.
    ["/solucoes/processos-manuais", "/solucoes"],
    ["/solucoes/sistemas-desconectados", "/solucoes"],
  ] as const;

  it.each(CONSOLIDACAO)("%s redireciona permanentemente para %s", (source, destination) => {
    const matches = bySource(source);
    expect(matches).toHaveLength(1);
    expect(matches[0].destination).toBe(destination);
    expect(matches[0].permanent).toBe(true);
  });

  it("nenhuma URL sob /servicos continua respondendo como destino", () => {
    const destinos = rules.map((rule) => rule.destination);
    for (const destino of destinos) {
      expect(destino.startsWith("/servicos")).toBe(false);
    }
  });

  it("o alias /services/ vai direto ao destino final, em um salto", () => {
    // Fase 7 (§21): com `skipTrailingSlashRedirect`, a variante com barra é
    // avaliada por `redirects()` em vez de ser normalizada antes — antes
    // custava dois saltos (`/services/` → `/services` → `/solucoes`).
    expect(bySource("/services/")[0].destination).toBe("/solucoes");
  });

  it("toda consolidação tem a variante com barra, apontando ao mesmo destino", () => {
    const semBarra = rules.filter(
      (r) => !r.source.endsWith("/") && !r.source.includes(":path")
    );
    for (const regra of semBarra) {
      const comBarra = bySource(`${regra.source}/`);
      expect(comBarra).toHaveLength(1);
      expect(comBarra[0].destination).toBe(regra.destination);
    }
  });

  it("o catch-all de barra final vem por último", () => {
    // Se viesse antes, capturaria `/servicos/` e criaria a chain que a Fase 7
    // acabou de eliminar.
    const i = rules.findIndex((r) => r.source === "/:path+/");
    expect(i).toBe(rules.length - 1);
  });

  it("nenhum destino da consolidação é source de outra regra", () => {
    const sources = new Set(rules.map((rule) => rule.source));
    for (const [, destination] of CONSOLIDACAO) {
      expect(sources.has(destination.split("#")[0])).toBe(false);
    }
  });
});

describe("Redirects — regras anteriores intactas", () => {
  it.each([
    ["/index.htm", "/"],
    ["/about", "/sobre"],
    ["/about/", "/sobre"],
  ])("%s continua indo para %s", (source, destination) => {
    expect(bySource(source)[0]?.destination).toBe(destination);
  });

  it("preserva o redirect de apex para www", () => {
    expect(
      rules.some((rule) => rule.destination.includes("https://www.rc2solucoes.com.br"))
    ).toBe(true);
  });
});
