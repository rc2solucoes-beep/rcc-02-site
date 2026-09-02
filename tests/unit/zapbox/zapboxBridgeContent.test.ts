import { describe, expect, it } from "vitest";
import {
  ZAPBOX_BRIDGE_COPY,
  ZAPBOX_BRIDGE_BRAND,
  ZAPBOX_TERRITORY,
  RC2_TERRITORY,
  ZAPBOX_SHARED_BOUNDARY,
  ZAPBOX_BRIDGE_ROUTES,
  ZAPBOX_BRIDGE_CTA,
  ZAPBOX_BRIDGE_INTERNAL_LINKS,
} from "@/lib/content/zapboxBridge";

/**
 * Fase 6D — contrato da ponte RC2 → Zapbox (docs/20 §3).
 *
 * A ponte roteia; não vende. Este teste protege a copy aprovada, a fronteira
 * de território (docs/19 §3.6) e o uso do canonical `www` no destino externo.
 */

function allStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") acc.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, acc));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => allStrings(v, acc));
  return acc;
}

const modulo = allStrings({
  ZAPBOX_BRIDGE_COPY,
  ZAPBOX_BRIDGE_BRAND,
  ZAPBOX_TERRITORY,
  RC2_TERRITORY,
  ZAPBOX_SHARED_BOUNDARY,
  ZAPBOX_BRIDGE_ROUTES,
  ZAPBOX_BRIDGE_CTA,
  ZAPBOX_BRIDGE_INTERNAL_LINKS,
}).join(" ");

describe("Ponte Zapbox — copy aprovada", () => {
  it("usa o H1 aprovado em docs/20 §3.1", () => {
    expect(ZAPBOX_BRIDGE_COPY.h1).toBe(
      "Quando o problema é o WhatsApp, a resposta da RC2 chama-se Zapbox."
    );
  });

  it("usa a subheadline aprovada", () => {
    expect(ZAPBOX_BRIDGE_COPY.subheadline).toBe(
      "O Zapbox é o produto da RC2 para atendimento e vendas pelo WhatsApp — equipe no mesmo número, histórico, CRM comercial e Sales AI. Esta página explica o que pertence a ele, o que continua sendo trabalho da RC2 e para onde ir a partir daqui."
    );
  });

  it("usa o eyebrow aprovado", () => {
    expect(ZAPBOX_BRIDGE_COPY.eyebrow).toBe("Produto próprio");
  });

  it("não usa headline genérica nem duplica a tagline do produto", () => {
    expect(ZAPBOX_BRIDGE_COPY.h1).not.toBe("Conheça o Zapbox");
    expect(ZAPBOX_BRIDGE_COPY.h1).not.toContain("Transforme seu WhatsApp");
  });
});

describe("Ponte Zapbox — relação de marca", () => {
  it("declara que o Zapbox é produto da RC2", () => {
    expect(ZAPBOX_BRIDGE_BRAND.title).toBe(
      "Zapbox é um produto da RC2 Soluções"
    );
  });

  it("não inventa estrutura societária", () => {
    const texto = allStrings(ZAPBOX_BRIDGE_BRAND).join(" ").toLowerCase();
    for (const termo of [
      "subsidiária",
      "spin-off",
      "empresa separada",
      "empresa do grupo",
      "holding",
    ]) {
      expect(texto).not.toContain(termo);
    }
  });
});

describe("Ponte Zapbox — território do produto", () => {
  it("lista cinco capacidades verificadas", () => {
    expect(ZAPBOX_TERRITORY.items).toHaveLength(5);
  });

  it("cobre o canal e o funil comercial", () => {
    const texto = allStrings(ZAPBOX_TERRITORY).join(" ").toLowerCase();
    for (const termo of ["whatsapp", "lead", "crm", "sales ai", "atendimento"]) {
      expect(texto).toContain(termo);
    }
  });

  it("roteia por intenção, com três destinos", () => {
    expect(ZAPBOX_BRIDGE_ROUTES).toHaveLength(3);
    expect(ZAPBOX_BRIDGE_ROUTES.map((rota) => rota.href)).toEqual([
      "https://www.zapbox.cloud/sales-ai",
      "https://www.zapbox.cloud/crm-vendas",
      "https://www.zapbox.cloud/automacoes",
    ]);
  });
});

describe("Ponte Zapbox — território da RC2", () => {
  it("lista cinco sintomas de operação", () => {
    expect(RC2_TERRITORY.items).toHaveLength(5);
  });

  it("cobre processo, sistemas, IA operacional e continuidade", () => {
    const texto = allStrings(RC2_TERRITORY).join(" ").toLowerCase();
    for (const termo of ["processo", "sistemas", "ia", "erp", "acompanhamento"]) {
      expect(texto).toContain(termo);
    }
  });

  it("é complementar, nunca comparativo", () => {
    const texto = allStrings(RC2_TERRITORY).join(" ").toLowerCase();
    for (const termo of ["versus", "melhor que", "ao contrário do zapbox"]) {
      expect(texto).not.toContain(termo);
    }
  });
});

describe("Ponte Zapbox — fronteira compartilhada", () => {
  it("declara a integração como trabalho da RC2 quando contratada", () => {
    const texto = allStrings(ZAPBOX_SHARED_BOUNDARY).join(" ").toLowerCase();
    expect(texto).toContain("integração");
    expect(texto).toContain("contratada");
  });

  it("não transfere a operação do canal para a RC2", () => {
    const texto = allStrings(ZAPBOX_SHARED_BOUNDARY).join(" ").toLowerCase();
    for (const frase of [
      "a rc2 atende",
      "a rc2 opera o atendimento",
      "a rc2 opera o crm",
      "a rc2 vende por você",
    ]) {
      expect(texto).not.toContain(frase);
    }
  });
});

describe("Ponte Zapbox — CTA e links", () => {
  it("usa o label e o destino aprovados", () => {
    expect(ZAPBOX_BRIDGE_CTA.label).toBe("Ir para o Zapbox");
    expect(ZAPBOX_BRIDGE_CTA.href).toBe("https://www.zapbox.cloud/");
  });

  it("não tem CTA secundário", () => {
    expect(ZAPBOX_BRIDGE_CTA.secondary).toBeUndefined();
  });

  it("tem exatamente dois links internos de retorno", () => {
    expect(ZAPBOX_BRIDGE_INTERNAL_LINKS).toHaveLength(2);
    expect(ZAPBOX_BRIDGE_INTERNAL_LINKS.map((link) => link.href)).toEqual([
      "/solucoes",
      "/solucoes#integracao-de-sistemas",
    ]);
  });

  it("nenhum destino externo usa o apex — o apex custa um salto", () => {
    const externos = [
      ZAPBOX_BRIDGE_CTA.href,
      ...ZAPBOX_BRIDGE_ROUTES.map((rota) => rota.href),
    ];
    for (const href of externos) {
      expect(href.startsWith("https://www.zapbox.cloud")).toBe(true);
    }
    expect(modulo).not.toContain("https://zapbox.cloud");
  });
});

describe("Ponte Zapbox — claims e escopo", () => {
  it("não publica claim promocional proibido", () => {
    const texto = modulo.toLowerCase();
    for (const termo of [
      "chatbot",
      "garante",
      "melhor crm",
      "líder",
      "certificad",
      "parceiro oficial",
      "%",
      "aumenta vendas em",
      "reduz atendimento em",
    ]) {
      expect(texto).not.toContain(termo);
    }
  });

  it("não duplica preço nem plano do produto", () => {
    const texto = modulo.toLowerCase();
    for (const termo of ["r$", "plano", "preço", "assinatura", "mensalidade"]) {
      expect(texto).not.toContain(termo);
    }
  });

  it("não menciona a Agenda Confirmada — CD-2 segue DEFER", () => {
    expect(modulo.toLowerCase()).not.toContain("agenda confirmada");
  });

  it("não vende Discovery nem Operação Gerenciada", () => {
    const texto = modulo.toLowerCase();
    expect(texto).not.toContain("discovery");
    expect(texto).not.toContain("operação gerenciada");
  });
});
