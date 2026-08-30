import { describe, expect, it } from "vitest";
import {
  HOME_COPY,
  HOME_CTAS,
  HOME_BLOG_SLUGS,
  FORBIDDEN_HOME_CLAIMS,
} from "@/lib/content/home";

function allStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") acc.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, acc));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => allStrings(v, acc));
  return acc;
}

describe("Home — copy aprovada", () => {
  it("usa o H1 aprovado", () => {
    expect(HOME_COPY.h1).toBe(
      "Sua operação não precisa de mais ferramentas. Precisa funcionar melhor."
    );
  });

  it("usa a subheadline aprovada", () => {
    expect(HOME_COPY.subheadline).toBe(
      "A RC2 conecta sistemas, automatiza processos e aplica inteligência artificial para reduzir trabalho manual, retrabalho e gargalos na operação."
    );
  });

  it("preserva a assinatura institucional", () => {
    expect(HOME_COPY.signature).toBe(
      "Tecnologia que funciona. Operação que entrega."
    );
  });
});

describe("Home — CTAs", () => {
  it("CTA primário do hero leva a /contato", () => {
    expect(HOME_CTAS.heroPrimary.label).toBe("Falar sobre minha operação");
    expect(HOME_CTAS.heroPrimary.href).toBe("/contato");
  });

  it("CTA secundário do hero leva a /solucoes", () => {
    expect(HOME_CTAS.heroSecondary.label).toBe("Conhecer soluções");
    expect(HOME_CTAS.heroSecondary.href).toBe("/solucoes");
  });

  it("preserva o label histórico de analytics do CTA primário", () => {
    expect(HOME_CTAS.heroPrimary.analyticsLabel).toBe("solicitar_diagnostico");
  });
});

describe("Home — claims proibidos", () => {
  it("nenhuma copy contém claim descontinuado", () => {
    const haystack = [
      ...allStrings(HOME_COPY),
      ...allStrings(HOME_CTAS),
    ].join(" | ").toLowerCase();

    for (const claim of FORBIDDEN_HOME_CLAIMS) {
      expect(haystack).not.toContain(claim.toLowerCase());
    }
  });

  it("a lista de claims proibidos cobre os termos da spec", () => {
    const lower = FORBIDDEN_HOME_CLAIMS.map((c) => c.toLowerCase());
    for (const term of [
      "diagnóstico gratuito",
      "solicitar diagnóstico",
      "menos de 2 minutos",
      "24h por dia",
      "30 dias",
      "sem contratar mais ninguém",
      "cases de sucesso",
    ]) {
      expect(lower).toContain(term);
    }
  });
});

describe("Home — artigos", () => {
  it("usa exatamente os três slugs aprovados", () => {
    expect(HOME_BLOG_SLUGS).toEqual([
      "processos-manuais-o-que-automatizar",
      "custo-de-agente-de-ia",
      "governanca-agentes-ia-pmes",
    ]);
  });

  it("não usa o slug corrompido", () => {
    expect(HOME_BLOG_SLUGS.join(" ")).not.toContain("solucosolucoes");
  });
});
