import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  AGENDA_CONFIRMADA as C,
  AGENDA_CONFIRMADA_ROUTE as ROUTE,
} from "@/lib/content/agendaConfirmada";

/**
 * Fase 6 — página da Agenda Confirmada.
 *
 * A rota era `DEFER_ROUTE` (`docs/18` §13). Estes contratos protegem o que a
 * decisão de publicar **não** autorizou junto: afirmar base técnica, inventar
 * escopo de versão ou prometer resultado sem métrica.
 */
const root = process.cwd();
const PAGE = "src/app/(public)/solucoes/agenda-confirmada/page.tsx";
const page = readFileSync(join(root, PAGE), "utf-8");

/**
 * Fonte sem comentários. As asserções de ausência abaixo se sabotariam sozinhas
 * de outro modo: o comentário que explica por que um padrão foi evitado contém
 * o próprio padrão.
 */
const pageCode = page
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const copy = JSON.stringify(C).toLowerCase();

describe("Agenda Confirmada — a rota existe", () => {
  it("a página está publicada no caminho canônico", () => {
    expect(existsSync(join(root, PAGE))).toBe(true);
    expect(ROUTE).toBe("/solucoes/agenda-confirmada");
  });

  it("não é um item da coleção de soluções por problema", async () => {
    // Rota estática própria; `/solucoes/[slug]` está inteiro redirecionado.
    const { solutions } = await import("@/lib/content/solutions");
    expect(solutions.map((s) => s.slug)).not.toContain("agenda-confirmada");
  });
});

describe("Agenda Confirmada — o que a copy não pode afirmar", () => {
  /**
   * U-4 (`docs/18` §12.2) segue aberta: nenhuma fonte diz se a solução roda
   * sobre o Zapbox, sobre automação própria, ou os dois. A página descreve o
   * resultado, não a stack.
   */
  it("não afirma base técnica nem cita o Zapbox", () => {
    for (const termo of ["zapbox", "n8n", "roda sobre", "construído sobre"]) {
      expect(copy).not.toContain(termo);
    }
    expect(pageCode.toLowerCase()).not.toContain("zapbox");
  });

  /**
   * U-7 segue aberta: "reduz faltas" é benefício declarado sem métrica. Os
   * sintomas descrevem a operação atual da clínica, não um resultado prometido.
   */
  it("não promete redução de faltas nem publica número", () => {
    for (const termo of ["reduz faltas", "reduzindo faltas", "%"]) {
      expect(copy).not.toContain(termo);
    }
  });

  it("lista as versões sem inventar escopo de cada uma", () => {
    expect(C.versions).toEqual([
      "Agenda Confirmada Start",
      "Agenda Confirmada Plus",
      "Agenda Confirmada",
      "Agenda Confirmada Pro",
    ]);
    // Nenhuma versão carrega recurso, limite ou preço — o §6 só dá os nomes.
    for (const version of C.versions) {
      expect(typeof version).toBe("string");
    }
    expect(copy).not.toContain("r$");
  });

  it("declara o que a solução não faz", () => {
    expect(C.boundaries).toContain("Prontuário");
    expect(C.boundaries).toContain("Diagnóstico");
    expect(C.boundaries).toContain("Gestão completa da clínica");
  });
});

describe("Agenda Confirmada — tratamento visual", () => {
  it("o Como funciona usa o componente Numerado, não um fluxograma", () => {
    expect(page).toContain("NumberedList");
    expect(C.how).toHaveLength(5);
    // Nós e setas soltos ficam fora, mesmo em página interna.
    for (const termo of ["↓", "→", "svg", "line x1"]) {
      expect(pageCode).not.toContain(termo);
    }
  });

  it("reaproveita os componentes do design system, sem markup ad-hoc", () => {
    for (const componente of [
      "PageHero",
      "SignalList",
      "NumberedList",
      "SectionLabel",
      "CTABlock",
    ]) {
      expect(page).toContain(componente);
    }
  });

  it("os CTAs levam a /contato e usam vocabulário vigente", () => {
    expect(C.heroCta.href).toBe("/contato");
    expect(C.finalCta.href).toBe("/contato");
    for (const cta of [C.heroCta.label, C.finalCta.label]) {
      expect(cta.toLowerCase()).not.toContain("solicitar diagnóstico");
      expect(cta.toLowerCase()).not.toContain("diagnóstico gratuito");
    }
  });

  it("não emite schema de produto ou oferta", () => {
    // Sem preço, disponibilidade nem escopo por versão aprovado.
    for (const tipo of ['"Product"', '"Offer"', '"SoftwareApplication"']) {
      expect(pageCode).not.toContain(tipo);
    }
    expect(page).toContain('"@type": "WebPage"');
  });
});
