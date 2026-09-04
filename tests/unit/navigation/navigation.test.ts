import { describe, expect, it } from "vitest";
import {
  NAV_LINKS,
  FOOTER_COMPANY_LINKS,
  FOOTER_SOLUTION_LINKS,
  FOOTER_PRODUCT_LINK,
} from "@/lib/content/navigation";
import { SOLUCOES_ANCHORS } from "@/lib/content/solucoesPage";

describe("Header — navegação principal", () => {
  it("expõe Início · Soluções · Zapbox · Agenda Confirmada · Sobre · Blog", () => {
    // Ordem do §17 das Correções, adaptada ao que existe. "Blog" não vira
    // "Conteúdo": o rótulo mexe em taxonomia de analytics e segue fora de
    // escopo desde a Fase 3.
    expect(NAV_LINKS).toEqual([
      { href: "/", label: "Início" },
      { href: "/solucoes", label: "Soluções" },
      { href: "/zapbox", label: "Zapbox" },
      { href: "/solucoes/agenda-confirmada", label: "Agenda Confirmada" },
      { href: "/sobre", label: "Sobre" },
      { href: "/blog", label: "Blog" },
    ]);
  });

  it("leva o Zapbox à ponte interna, nunca ao domínio do produto", () => {
    // `CD-1 = BRIDGE_FIRST`: só o CTA da ponte sai do domínio, ainda que o
    // §17 das Correções anote "abre domínio próprio".
    const zapbox = NAV_LINKS.find((link) => link.label === "Zapbox");
    expect(zapbox?.href).toBe("/zapbox");
    for (const link of NAV_LINKS) {
      expect(link.href.startsWith("http")).toBe(false);
    }
  });

  it("mantém o rótulo Blog, sem renomear para Conteúdo", () => {
    expect(NAV_LINKS.map((l) => l.label)).toContain("Blog");
    expect(NAV_LINKS.map((l) => l.label)).not.toContain("Conteúdo");
  });

  it("deixa de promover a arquitetura legada", () => {
    const hrefs = NAV_LINKS.map((link) => link.href);
    expect(hrefs).not.toContain("/servicos");
    expect(hrefs).not.toContain("/solucoes-com-ia");
  });
});

describe("Footer — coluna Soluções", () => {
  it("publica as cinco âncoras de /solucoes, nesta ordem", () => {
    // Fase 6: a Agenda Confirmada entra depois delas, como link de rota.
    expect(FOOTER_SOLUTION_LINKS.slice(0, 5).map((link) => link.href)).toEqual(
      SOLUCOES_ANCHORS.map((anchor) => `/solucoes#${anchor}`)
    );
  });

  it("publica a Agenda Confirmada como rota, não como âncora", () => {
    const agenda = FOOTER_SOLUTION_LINKS.find(
      (link) => link.label === "Agenda Confirmada"
    );
    expect(agenda?.href).toBe("/solucoes/agenda-confirmada");
    expect(agenda?.analyticsLabel).toBe("agenda_confirmada");
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
      "Agenda Confirmada",
    ]);
  });

  it("instrumenta cada link com o label da âncora", () => {
    expect(FOOTER_SOLUTION_LINKS.map((link) => link.analyticsLabel)).toEqual([
      "automacao_de_processos",
      "integracao_de_sistemas",
      "ia_para_operacoes",
      "operacoes_digitais_commerce",
      "operacao_gerenciada",
      "agenda_confirmada",
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

  it("preserva Sobre, Blog e Contato, e publica Avaliações e Projetos", () => {
    // Fase 3 (`docs/24` §4): `/avaliacoes` estava no sitemap sem nenhum link
    // interno — órfã. O §18 das Correções a coloca na coluna Empresa.
    expect(FOOTER_COMPANY_LINKS.map((link) => link.href)).toEqual([
      "/sobre",
      "/solucoes",
      "/blog",
      "/avaliacoes",
      "/contato",
    ]);
  });

  it("nomeia a página de provas sem prometer case documentado", () => {
    const avaliacoes = FOOTER_COMPANY_LINKS.find(
      (link) => link.href === "/avaliacoes"
    );
    expect(avaliacoes?.label).toBe("Avaliações e Projetos");
    expect(avaliacoes?.label).not.toContain("Cases");
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

describe("Footer — Zapbox roteado pela ponte", () => {
  it("aponta para a ponte interna, não para o domínio do produto", () => {
    // Fase 6E: BRIDGE_FIRST — o Footer entrega a ponte, que entrega o produto.
    expect(FOOTER_PRODUCT_LINK.href).toBe("/zapbox");
    expect(FOOTER_PRODUCT_LINK.analyticsLabel).toBe("conhecer_zapbox");
  });
});
