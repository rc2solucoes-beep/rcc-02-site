import { describe, expect, it } from "vitest";
import {
  SOLUCOES_COPY,
  SOLUCOES_CTAS,
  SOLUCOES_ORIENTATION,
  SOLUCOES_COMPETENCIES,
  SOLUCOES_METHOD,
  SOLUCOES_ANCHORS,
} from "@/lib/content/solucoesPage";

function allStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") acc.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, acc));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => allStrings(v, acc));
  return acc;
}

describe("/solucoes — copy aprovada", () => {
  it("usa o H1 aprovado em docs/14 §5.1", () => {
    expect(SOLUCOES_COPY.h1).toBe(
      "Automação, integrações e IA aplicadas à sua operação."
    );
  });

  it("usa a subheadline aprovada", () => {
    expect(SOLUCOES_COPY.subheadline).toBe(
      "A RC2 atua em quatro frentes conectadas para que processos e sistemas acompanhem o tamanho da operação — da automação de tarefas à integração entre plataformas, ERP e dados."
    );
  });

  it("usa o eyebrow aprovado", () => {
    expect(SOLUCOES_COPY.eyebrow).toBe("Soluções RC2");
  });

  it("não repete o H1 da Home", () => {
    expect(SOLUCOES_COPY.h1).not.toContain("Sua operação não precisa");
  });
});

describe("/solucoes — competências", () => {
  it("tem exatamente quatro competências, na ordem aprovada", () => {
    expect(SOLUCOES_COMPETENCIES.map((c) => c.title)).toEqual([
      "Automação de Processos",
      "Integração de Sistemas",
      "IA para Operações",
      "Operações Digitais & Commerce",
    ]);
  });

  it("usa os ids do contrato de âncoras", () => {
    expect(SOLUCOES_COMPETENCIES.map((c) => c.id)).toEqual([
      "automacao-de-processos",
      "integracao-de-sistemas",
      "ia-para-operacoes",
      "operacoes-digitais-commerce",
    ]);
  });

  it("descreve cada competência com lead, sinais e intervenções", () => {
    for (const competency of SOLUCOES_COMPETENCIES) {
      expect(competency.lead.length).toBeGreaterThan(40);
      expect(competency.signals.length).toBeGreaterThanOrEqual(4);
      expect(competency.interventions.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("preserva os labels de analytics já usados na Home", () => {
    expect(SOLUCOES_COMPETENCIES.map((c) => c.analyticsLabel)).toEqual([
      "automacao_de_processos",
      "integracao_de_sistemas",
      "ia_para_operacoes",
      "operacoes_digitais_commerce",
    ]);
  });

  it("trata Integração de Sistemas como competência própria", () => {
    const integracao = SOLUCOES_COMPETENCIES[1];
    const texto = allStrings(integracao).join(" ").toLowerCase();
    expect(texto).toContain("erp");
    expect(texto).toContain("crm");
    expect(texto).toContain("webhook");
  });

  it("cobre a operação digital sem prometer construção de loja", () => {
    const commerce = SOLUCOES_COMPETENCIES[3];
    const texto = allStrings(commerce).join(" ").toLowerCase();
    for (const termo of ["logística", "estoque", "pagamento", "pedido", "erp"]) {
      expect(texto).toContain(termo);
    }
    expect(texto).not.toContain("criamos sua loja");
    expect(texto).not.toContain("fazemos sua loja");
  });

  it("não promete percentual, ROI ou prazo na automação", () => {
    const automacao = allStrings(SOLUCOES_COMPETENCIES[0]).join(" ");
    expect(automacao).not.toMatch(/\d+\s?%/);
    expect(automacao.toLowerCase()).not.toContain("roi");
  });
});

describe("/solucoes — contrato de âncoras", () => {
  it("publica as cinco âncoras aprovadas", () => {
    expect(SOLUCOES_ANCHORS).toEqual([
      "automacao-de-processos",
      "integracao-de-sistemas",
      "ia-para-operacoes",
      "operacoes-digitais-commerce",
      "operacao-gerenciada",
    ]);
  });

  it("preserva a âncora publicada desde a Fase 3", () => {
    expect(SOLUCOES_ANCHORS).toContain("operacao-gerenciada");
  });

  it("mantém os ids únicos", () => {
    expect(new Set(SOLUCOES_ANCHORS).size).toBe(SOLUCOES_ANCHORS.length);
  });
});

describe("/solucoes — orientação", () => {
  it("liga quatro sintomas às quatro competências", () => {
    expect(SOLUCOES_ORIENTATION.items).toHaveLength(4);
    expect(SOLUCOES_ORIENTATION.items.map((item) => item.href)).toEqual([
      "#automacao-de-processos",
      "#integracao-de-sistemas",
      "#ia-para-operacoes",
      "#operacoes-digitais-commerce",
    ]);
  });

  it("não promete Discovery gratuito", () => {
    const texto = allStrings(SOLUCOES_ORIENTATION).join(" ").toLowerCase();
    for (const termo of ["gratuito", "gratuita", "sem custo"]) {
      expect(texto).not.toContain(termo);
    }
  });
});

describe("/solucoes — CTAs", () => {
  it("usa o CTA principal da marca", () => {
    expect(SOLUCOES_CTAS.hero.label).toBe("Falar sobre minha operação");
    expect(SOLUCOES_CTAS.hero.href).toBe("/contato");
  });

  it("não tem CTA secundário no hero", () => {
    expect(SOLUCOES_CTAS.hero.secondary).toBeUndefined();
  });

  it("fecha a página com o mesmo CTA", () => {
    expect(SOLUCOES_CTAS.final.label).toBe("Falar sobre minha operação");
    expect(SOLUCOES_CTAS.final.href).toBe("/contato");
  });

  it("não promete levantamento, arquitetura ou roadmap gratuitos", () => {
    const texto = allStrings(SOLUCOES_CTAS).join(" ").toLowerCase();
    for (const termo of ["roadmap", "arquitetura", "mapeamento", "levantamento"]) {
      expect(texto).not.toContain(termo);
    }
  });
});

describe("/solucoes — modelo de trabalho", () => {
  it("descreve os quatro níveis da arquitetura comercial", () => {
    expect(SOLUCOES_METHOD.levels.map((level) => level.name)).toEqual([
      "Conversa inicial",
      "Discovery Operacional",
      "Implantação",
      "Operação Gerenciada",
    ]);
  });

  it("declara o Discovery como etapa paga", () => {
    const discovery = SOLUCOES_METHOD.levels[1].description.toLowerCase();
    expect(discovery).toContain("paga");
  });

  it("não repete a faixa de preço do Discovery — ela vive em /contato", () => {
    const texto = allStrings(SOLUCOES_METHOD).join(" ");
    expect(texto).not.toContain("R$");
  });

  it("não promete levantamento completo na conversa inicial", () => {
    const conversa = SOLUCOES_METHOD.levels[0].description.toLowerCase();
    for (const termo of ["roadmap", "arquitetura", "levantamento"]) {
      expect(conversa).not.toContain(termo);
    }
  });
});

describe("/solucoes — território e vocabulário", () => {
  const todoOModulo = allStrings({
    SOLUCOES_COPY,
    SOLUCOES_CTAS,
    SOLUCOES_ORIENTATION,
    SOLUCOES_COMPETENCIES,
    SOLUCOES_METHOD,
  })
    .join(" ")
    .toLowerCase();

  it("não usa CTA nem copy descontinuados", () => {
    for (const termo of [
      "solicitar diagnóstico",
      "diagnóstico gratuito",
      "cases de sucesso",
      "chatbot",
    ]) {
      expect(todoOModulo).not.toContain(termo);
    }
  });

  it("confina o território Zapbox à fronteira declarada em IA", () => {
    const ia = SOLUCOES_COMPETENCIES[2];
    expect(ia.boundary).toBeDefined();
    const fronteira = (ia.boundary ?? "").toLowerCase();
    expect(fronteira).toContain("zapbox");

    const semFronteira = allStrings({
      SOLUCOES_COPY,
      SOLUCOES_CTAS,
      SOLUCOES_ORIENTATION,
      SOLUCOES_METHOD,
      competencias: SOLUCOES_COMPETENCIES.map(
        ({ boundary: _boundary, ...resto }) => resto
      ),
    })
      .join(" ")
      .toLowerCase();

    for (const termo of ["whatsapp", "crm comercial", "sales ai"]) {
      expect(semFronteira).not.toContain(termo);
    }
  });

  it("usa o vocabulário aprovado da marca", () => {
    for (const termo of ["operação", "processo", "integra"]) {
      expect(todoOModulo).toContain(termo);
    }
  });

  it("não usa vocabulário de hype", () => {
    for (const termo of [
      "revolução",
      "disruptiv",
      "mágic",
      "solução completa",
      "líder de mercado",
    ]) {
      expect(todoOModulo).not.toContain(termo);
    }
  });
});
