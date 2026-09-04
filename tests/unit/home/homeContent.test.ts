import { describe, expect, it } from "vitest";
import {
  HOME_COMPETENCIES,
  HOME_METHOD,
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
      // Fase 5: o destino passou de /solucoes para a âncora da competência.
      expect(c.href.startsWith("/solucoes#")).toBe(true);
      labels.add(c.linkLabel);
    }
    expect(labels.size).toBe(4);
  });
});

describe("Home — produtos", () => {
  it("Zapbox aponta para a ponte interna, não para o domínio do produto", async () => {
    // Fase 6E: BRIDGE_FIRST — a saída para o produto acontece em `/zapbox`.
    const { HOME_PRODUCTS } = await import("@/lib/content/home");
    expect(HOME_PRODUCTS.zapbox.href).toBe("/zapbox");
    expect(HOME_PRODUCTS.zapbox.external).toBe(false);
  });

  it("Agenda Confirmada leva à própria página", async () => {
    // Fase 6: a rota existe. `docs/18` §13.2 previa que o CTA "Ver Agenda
    // Confirmada" só voltaria a ser aplicável quando houvesse o que ver.
    const { HOME_PRODUCTS } = await import("@/lib/content/home");
    expect(HOME_PRODUCTS.agendaConfirmada.ctaLabel).toBe(
      "Ver Agenda Confirmada"
    );
    expect(HOME_PRODUCTS.agendaConfirmada.href).toBe(
      "/solucoes/agenda-confirmada"
    );
    expect(HOME_PRODUCTS.agendaConfirmada.external).toBe(false);
  });

  it("nenhum produto promete redução de faltas como resultado garantido", async () => {
    // §5 das Correções: efeito esperado não é resultado garantido, e não há
    // métrica documentada que sustente a promessa.
    const { HOME_PRODUCTS } = await import("@/lib/content/home");
    const copy = JSON.stringify(HOME_PRODUCTS).toLowerCase();
    expect(copy).not.toContain("reduzindo faltas");
    expect(copy).not.toContain("reduz faltas");
  });

  it("aponta para a rota da Agenda Confirmada, que agora existe", async () => {
    const home = await import("@/lib/content/home");
    expect(JSON.stringify(home)).toContain("/solucoes/agenda-confirmada");
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
  /**
   * `DE-1` (`docs/12` §19) barrava a Valéria por falta de descrição aprovada e
   * de destino verificável — na época, "zero ocorrências" nas fontes.
   *
   * A dependência caiu na Fase 4: ela aparece na `RC2_PROPOSTA_ATUALIZACAO`
   * (autoridade nº 1) e o §11 das Correções define copy e CTA aprovados. O
   * destino é o WhatsApp comercial que já estava publicado — a demonstração
   * nomeia quem responde, não cria canal novo.
   */
  it("tem apenas itens verificáveis", async () => {
    const { HOME_DEMOS } = await import("@/lib/content/home");
    expect(HOME_DEMOS).toHaveLength(2);
  });

  it("todo item com CTA tem destino e rótulo de analytics", async () => {
    const { HOME_DEMOS } = await import("@/lib/content/home");
    for (const demo of HOME_DEMOS) {
      if (!demo.ctaLabel) continue;
      expect(demo.href).toBeTruthy();
      expect(demo.analyticsLabel).toBeTruthy();
    }
  });

  it("a Valéria é apresentada pelo nome, não pela arquitetura interna", async () => {
    const { HOME_DEMOS } = await import("@/lib/content/home");
    const valeria = HOME_DEMOS.find((d) => d.title.includes("Valéria"));
    expect(valeria).toBeDefined();
    expect(valeria!.ctaLabel).toBe("Conversar com a Valéria");
    // Canal próprio dela, confirmado em 03/09/2026. NÃO é o WhatsApp comercial
    // geral do site — apontar para lá prometeria uma conversa que não acontece.
    expect(valeria!.href).toContain("wa.me/5511966958192");
    expect(valeria!.href).not.toContain("5511988028550");
    expect(valeria!.external).toBe(true);
    expect(valeria!.analyticsLabel).toBe("conversar_valeria");
    // §11: a formulação antiga descrevia o mecanismo, não a experiência.
    expect(JSON.stringify(HOME_DEMOS)).not.toContain(
      "agente de IA do nosso comercial"
    );
  });

  it("todo destino que sai do domínio é marcado como externo", async () => {
    const { HOME_DEMOS } = await import("@/lib/content/home");
    for (const demo of HOME_DEMOS) {
      if (demo.href?.startsWith("http")) expect(demo.external).toBe(true);
    }
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

describe("Home — competências apontam para as âncoras de /solucoes", () => {
  it("usa as quatro âncoras publicadas na Fase 5", () => {
    expect(HOME_COMPETENCIES.map((c) => c.href)).toEqual([
      "/solucoes#automacao-de-processos",
      "/solucoes#integracao-de-sistemas",
      "/solucoes#ia-para-operacoes",
      "/solucoes#operacoes-digitais-commerce",
    ]);
  });

  it("preserva os labels históricos de analytics — só o destination muda", () => {
    expect(HOME_COMPETENCIES.map((c) => c.analyticsLabel)).toEqual([
      "automacao_de_processos",
      "integracao_de_sistemas",
      "ia_para_operacoes",
      "operacoes_digitais_commerce",
    ]);
  });

  it("preserva os títulos das competências", () => {
    expect(HOME_COMPETENCIES.map((c) => c.title)).toEqual([
      "Automação de Processos",
      "Integração de Sistemas",
      "IA para Operações",
      "Operações Digitais & Commerce",
    ]);
  });

  it("mantém a âncora da Operação Gerenciada publicada desde a Fase 3", () => {
    expect(HOME_METHOD.managedOpsHref).toBe("/solucoes#operacao-gerenciada");
  });
});
