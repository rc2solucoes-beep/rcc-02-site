import { describe, expect, it } from "vitest";
import { HOME_PRODUCTS, HOME_DEMOS } from "@/lib/content/home";
import { FOOTER_PRODUCT_LINK } from "@/lib/content/navigation";

/**
 * Fase 6E — handoff interno RC2 → `/zapbox` (docs/21 §3 e §5).
 *
 * `CD-1 = BRIDGE_FIRST`: nenhuma superfície institucional sai direto para o
 * domínio do produto. O caminho é sempre superfície → `/zapbox` → produto.
 *
 * A bridge (`/zapbox`) é a única exceção autorizada, e o contrato dela vive em
 * `zapboxBridgeContent.test.ts` — este arquivo não a cobre.
 *
 * Os identificadores de analytics são **históricos**: `location` e `label`
 * existem em série desde antes desta unidade e não podem ser renomeados. Só o
 * `destination` muda.
 */

describe("Handoff interno — Home Produtos", () => {
  it("aponta para a bridge, não para o domínio do produto", () => {
    expect(HOME_PRODUCTS.zapbox.href).toBe("/zapbox");
  });

  it("deixa de ser link externo", () => {
    expect(HOME_PRODUCTS.zapbox.external).toBe(false);
  });

  it("preserva o label visível e o identificador de analytics", () => {
    expect(HOME_PRODUCTS.zapbox.ctaLabel).toBe("Conhecer Zapbox");
    expect(HOME_PRODUCTS.zapbox.analyticsLabel).toBe("conhecer_zapbox");
  });
});

describe("Handoff interno — Home Demonstrações", () => {
  const zapbox = HOME_DEMOS[0];

  it("aponta para a bridge", () => {
    expect(zapbox.href).toBe("/zapbox");
  });

  it("preserva o label visível e o identificador de analytics", () => {
    expect(zapbox.ctaLabel).toBe("Conhecer Zapbox");
    expect(zapbox.analyticsLabel).toBe("conhecer_zapbox");
  });
});

describe("Handoff interno — Footer Produto", () => {
  it("aponta para a bridge", () => {
    expect(FOOTER_PRODUCT_LINK.href).toBe("/zapbox");
  });

  it("preserva o label visível e o identificador de analytics", () => {
    expect(FOOTER_PRODUCT_LINK.label).toBe("Zapbox");
    expect(FOOTER_PRODUCT_LINK.analyticsLabel).toBe("conhecer_zapbox");
  });
});

describe("Handoff interno — nenhum dado de superfície sai do domínio", () => {
  it("nenhuma das três superfícies de dados cita o domínio do produto", () => {
    const dados = JSON.stringify({
      HOME_PRODUCTS,
      HOME_DEMOS,
      FOOTER_PRODUCT_LINK,
    });
    expect(dados).not.toContain("zapbox.cloud");
  });
});

describe("Handoff interno — o que não muda", () => {
  it("Agenda Confirmada segue intacta — CD-2 permanece DEFER", () => {
    expect(HOME_PRODUCTS.agendaConfirmada.href).toBe("/contato");
    expect(HOME_PRODUCTS.agendaConfirmada.external).toBe(false);
    expect(HOME_PRODUCTS.agendaConfirmada.analyticsLabel).toBe(
      "agenda_confirmada"
    );
  });

  it("a rota adiada da Agenda Confirmada continua sem href", () => {
    const dados = JSON.stringify({ HOME_PRODUCTS, HOME_DEMOS });
    expect(dados).not.toContain("/solucoes/agenda-confirmada");
  });

  it("a segunda demonstração continua sem link", () => {
    expect(HOME_DEMOS).toHaveLength(2);
    expect(HOME_DEMOS[1].href).toBeUndefined();
  });
});
