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

describe("Home — problemas operacionais", () => {
  it("tem exatamente os 4 territórios aprovados", async () => {
    const { HOME_PROBLEMS } = await import("@/lib/content/home");
    expect(HOME_PROBLEMS).toHaveLength(4);
    expect(HOME_PROBLEMS.map((p) => p.title)).toEqual([
      "Trabalho manual",
      "Sistemas desconectados",
      "Informação espalhada",
      "Operação digital fragmentada",
    ]);
  });

  it("não usa WhatsApp, leads ou atendimento como título de território", async () => {
    const { HOME_PROBLEMS } = await import("@/lib/content/home");
    const titles = HOME_PROBLEMS.map((p) => p.title.toLowerCase()).join(" ");
    for (const term of ["whatsapp", "lead", "atendimento"]) {
      expect(titles).not.toContain(term);
    }
  });
});

describe("Home — competências", () => {
  it("tem exatamente as 4 competências aprovadas", async () => {
    const { HOME_COMPETENCIES } = await import("@/lib/content/home");
    expect(HOME_COMPETENCIES.map((c) => c.title)).toEqual([
      "Automação de Processos",
      "Integração de Sistemas",
      "IA para Operações",
      "Operações Digitais & Commerce",
    ]);
  });

  it("todas apontam para /solucoes e têm rótulo específico", async () => {
    const { HOME_COMPETENCIES } = await import("@/lib/content/home");
    const labels = new Set<string>();
    for (const c of HOME_COMPETENCIES) {
      expect(c.href).toBe("/solucoes");
      labels.add(c.linkLabel);
    }
    expect(labels.size).toBe(4);
  });
});

describe("Home — produtos", () => {
  it("Zapbox aponta para o domínio externo do produto", async () => {
    const { HOME_PRODUCTS } = await import("@/lib/content/home");
    expect(HOME_PRODUCTS.zapbox.href).toBe("https://zapbox.cloud/");
    expect(HOME_PRODUCTS.zapbox.external).toBe(true);
  });

  it("Agenda Confirmada usa CTA temporário para /contato", async () => {
    const { HOME_PRODUCTS } = await import("@/lib/content/home");
    expect(HOME_PRODUCTS.agendaConfirmada.ctaLabel).toBe(
      "Falar sobre agenda e confirmações"
    );
    expect(HOME_PRODUCTS.agendaConfirmada.href).toBe("/contato");
  });

  it("nunca aponta para a rota inexistente de Agenda Confirmada", async () => {
    const home = await import("@/lib/content/home");
    expect(JSON.stringify(home)).not.toContain("/solucoes/agenda-confirmada");
  });
});

describe("Home — método", () => {
  it("tem as 5 etapas na ordem aprovada", async () => {
    const { HOME_METHOD } = await import("@/lib/content/home");
    expect(HOME_METHOD.steps.map((s) => s.name)).toEqual([
      "Entender",
      "Desenhar",
      "Implantar",
      "Medir",
      "Evoluir",
    ]);
  });

  it("não repete a faixa de preço do Discovery na Home", async () => {
    const { HOME_METHOD } = await import("@/lib/content/home");
    expect(JSON.stringify(HOME_METHOD)).not.toContain("R$");
  });

  it("delimita a conversa inicial contra o Discovery", async () => {
    const { HOME_METHOD } = await import("@/lib/content/home");
    const entender = HOME_METHOD.steps[0];
    expect(entender.description).toContain("Discovery");
  });

  it("liga Operação Gerenciada à âncora de /solucoes", async () => {
    const { HOME_METHOD } = await import("@/lib/content/home");
    expect(HOME_METHOD.managedOpsHref).toBe("/solucoes#operacao-gerenciada");
  });
});

describe("Home — autoridade", () => {
  it("usa apenas fatos aprovados da proposta", async () => {
    const { HOME_AUTHORITY } = await import("@/lib/content/home");
    const flat = JSON.stringify(HOME_AUTHORITY);
    for (const fact of ["Edenred", "Uno Healthcare", "Forta Tech"]) {
      expect(flat).toContain(fact);
    }
  });

  it("não usa a expressão vetada Cases de Sucesso", async () => {
    const { HOME_AUTHORITY } = await import("@/lib/content/home");
    expect(JSON.stringify(HOME_AUTHORITY).toLowerCase()).not.toContain(
      "cases de sucesso"
    );
  });
});

describe("Home — demonstrações", () => {
  it("tem apenas itens verificáveis e nenhum menciona Valéria", async () => {
    const { HOME_DEMOS } = await import("@/lib/content/home");
    expect(HOME_DEMOS).toHaveLength(2);
    expect(JSON.stringify(HOME_DEMOS)).not.toContain("Val");
  });

  it("item sem ativo navegável não tem href", async () => {
    const { HOME_DEMOS } = await import("@/lib/content/home");
    const semLink = HOME_DEMOS.filter((d) => !d.href);
    expect(semLink).toHaveLength(1);
  });
});

describe("Home — filosofia", () => {
  it("preserva a tese de marca", async () => {
    const { HOME_PHILOSOPHY } = await import("@/lib/content/home");
    expect(HOME_PHILOSOPHY.thesis).toBe(
      "A IA não substitui uma operação mal estruturada."
    );
  });

  it("é curta: no máximo 4 pontos", async () => {
    const { HOME_PHILOSOPHY } = await import("@/lib/content/home");
    expect(HOME_PHILOSOPHY.points.length).toBeLessThanOrEqual(4);
  });
});

describe("Home — tracking dos artigos", () => {
  it("produz a matriz de analytics aprovada para cada slug", async () => {
    const { homeArticleTracking, HOME_BLOG_SLUGS } = await import(
      "@/lib/content/home"
    );

    for (const slug of HOME_BLOG_SLUGS) {
      expect(homeArticleTracking(slug)).toEqual({
        location: "home_content",
        label: slug,
        destination: `/blog/${slug}`,
      });
    }
  });

  it("cobre exatamente os três artigos da Home", async () => {
    const { homeArticleTracking, HOME_BLOG_SLUGS } = await import(
      "@/lib/content/home"
    );

    expect(HOME_BLOG_SLUGS.map((s) => homeArticleTracking(s).label)).toEqual([
      "processos-manuais-o-que-automatizar",
      "custo-de-agente-de-ia",
      "governanca-agentes-ia-pmes",
    ]);
  });

  it("mantém o CTA da seção com o label próprio", async () => {
    const { HOME_CTAS } = await import("@/lib/content/home");
    expect(HOME_CTAS.content.analyticsLabel).toBe("ver_todos_artigos");
    expect(HOME_CTAS.content.href).toBe("/blog");
  });
});
