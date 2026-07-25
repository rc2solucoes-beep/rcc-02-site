import { describe, expect, it } from "vitest";
import { sanitizeAndAddIds, extractHeadings } from "@/lib/blog/sanitize";

describe("sanitizeAndAddIds", () => {
  it("remove script e handlers de evento", () => {
    const out = sanitizeAndAddIds(
      `<p>ok</p><script>alert(1)</script><a href="https://x.com" onclick="alert(2)">l</a>`
    );
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/onclick/i);
    expect(out).toMatch(/href="https:\/\/x\.com"/);
  });

  it("preserva formatação legítima do corpo do artigo", () => {
    const out = sanitizeAndAddIds(
      `<h2>Título</h2><p>texto <strong>forte</strong> <em>enfase</em></p><ul><li>um</li></ul><img src="https://y.com/a.png" alt="a">`
    );
    expect(out).toMatch(/<strong>forte<\/strong>/);
    expect(out).toMatch(/<em>enfase<\/em>/);
    expect(out).toMatch(/<li>um<\/li>/);
    expect(out).toMatch(/<img[^>]+src="https:\/\/y\.com\/a\.png"/);
  });

  it("injeta id e scroll-margin em h2/h3 sem id", () => {
    const out = sanitizeAndAddIds(`<h2>Um</h2><h3>Dois</h3>`);
    expect(out).toMatch(/<h2 id="heading-1" style="scroll-margin-top: 120px;">/);
    expect(out).toMatch(/<h3 id="heading-2" style="scroll-margin-top: 120px;">/);
  });

  it("não sobrescreve id já existente", () => {
    const out = sanitizeAndAddIds(`<h2 id="custom">Um</h2>`);
    expect(out).toContain(`id="custom"`);
    expect(out).not.toContain(`heading-1`);
  });

  it("lida com html vazio/nulo sem quebrar", () => {
    expect(sanitizeAndAddIds("")).toBe("");
    expect(sanitizeAndAddIds(null as unknown as string)).toBe("");
  });
});

describe("extractHeadings", () => {
  it("extrai h2 com id e texto limpo para o TOC", () => {
    const html = sanitizeAndAddIds(`<h2>Introdução</h2><p>x</p><h2>Conclusão <em>final</em></h2>`);
    const headings = extractHeadings(html);
    expect(headings).toEqual([
      { id: "heading-1", text: "Introdução" },
      { id: "heading-2", text: "Conclusão final" },
    ]);
  });
});
