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
  it("o alias de automação de atendimento continua no território Zapbox", () => {
    const matches = bySource("/servicos/automacao-de-atendimento");
    expect(matches).toHaveLength(1);
    expect(matches[0].destination).toBe("/servicos/automacoes-com-ia");
  });

  it.each([
    "/servicos",
    "/solucoes-com-ia",
    "/servicos/automacoes-com-ia",
    "/servicos/e-commerce",
    "/servicos/sites-e-landing-pages",
    "/solucoes/atendimento-lento",
    "/solucoes/leads-sem-resposta",
    "/solucoes/whatsapp-desorganizado",
    "/solucoes/processos-manuais",
    "/solucoes/sistemas-desconectados",
  ])("%s NÃO recebe redirect nesta migração", (source) => {
    expect(bySource(source)).toHaveLength(0);
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
