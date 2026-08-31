import { describe, expect, it } from "vitest";
import {
  NAV_LINKS,
  FOOTER_COMPANY_LINKS,
  FOOTER_SOLUTION_LINKS,
  FOOTER_PRODUCT_LINK,
} from "@/lib/content/navigation";
import { SOLUCOES_ANCHORS } from "@/lib/content/solucoesPage";

describe("Header — navegação principal", () => {
  it("expõe Início · Soluções · Sobre · Blog", () => {
    expect(NAV_LINKS).toEqual([
      { href: "/", label: "Início" },
      { href: "/solucoes", label: "Soluções" },
      { href: "/sobre", label: "Sobre" },
      { href: "/blog", label: "Blog" },
    ]);
  });

  it("deixa de promover a arquitetura legada", () => {
    const hrefs = NAV_LINKS.map((link) => link.href);
    expect(hrefs).not.toContain("/servicos");
    expect(hrefs).not.toContain("/solucoes-com-ia");
  });
});

describe("Footer — coluna Soluções", () => {
  it("publica as cinco âncoras de /solucoes", () => {
    expect(FOOTER_SOLUTION_LINKS).toHaveLength(5);
    expect(FOOTER_SOLUTION_LINKS.map((link) => link.href)).toEqual(
      SOLUCOES_ANCHORS.map((anchor) => `/solucoes#${anchor}`)
    );
  });

  it("inclui a Operação Gerenciada", () => {
    expect(FOOTER_SOLUTION_LINKS.map((link) => link.href)).toContain(
      "/solucoes#operacao-gerenciada"
    );
  });

  it("usa os nomes oficiais das competências", () => {
    expect(FOOTER_SOLUTION_LINKS.map((link) => link.label)).toEqual([
      "Automação de Processos",
      "Integração de Sistemas",
      "IA para Operações",
      "Operações Digitais & Commerce",
      "Operação Gerenciada",
    ]);
  });

  it("instrumenta cada link com o label da âncora", () => {
    expect(FOOTER_SOLUTION_LINKS.map((link) => link.analyticsLabel)).toEqual([
      "automacao_de_processos",
      "integracao_de_sistemas",
      "ia_para_operacoes",
      "operacoes_digitais_commerce",
      "operacao_gerenciada",
    ]);
  });
});

describe("Footer — coluna Empresa", () => {
  it("rotula /solucoes como Soluções, não como copy legada", () => {
    const solucoes = FOOTER_COMPANY_LINKS.find(
      (link) => link.href === "/solucoes"
    );
    expect(solucoes?.label).toBe("Soluções");
    expect(FOOTER_COMPANY_LINKS.map((link) => link.label)).not.toContain(
      "Soluções por Problema"
    );
  });

  it("preserva Sobre, Blog e Contato", () => {
    expect(FOOTER_COMPANY_LINKS.map((link) => link.href)).toEqual([
      "/sobre",
      "/solucoes",
      "/blog",
      "/contato",
    ]);
  });
});

describe("Footer — nenhum link para a arquitetura legada", () => {
  it("não aponta para /servicos nem para /solucoes-com-ia", () => {
    const hrefs = [...FOOTER_COMPANY_LINKS, ...FOOTER_SOLUTION_LINKS].map(
      (link) => link.href
    );
    for (const href of hrefs) {
      expect(href.startsWith("/servicos")).toBe(false);
      expect(href.startsWith("/solucoes-com-ia")).toBe(false);
    }
  });
});

describe("Footer — Zapbox como produto externo", () => {
  it("aponta para o produto, não para uma rota da RC2", () => {
    expect(FOOTER_PRODUCT_LINK.href).toBe("https://zapbox.cloud/");
    expect(FOOTER_PRODUCT_LINK.analyticsLabel).toBe("conhecer_zapbox");
  });
});
