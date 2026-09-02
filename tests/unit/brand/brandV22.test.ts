import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { globSync } from "node:fs";

const root = process.cwd();
const css = readFileSync(join(root, "src/app/globals.css"), "utf-8");

const tsx = globSync("src/**/*.tsx", { cwd: root }).map((f) => ({
  file: f,
  body: readFileSync(join(root, f), "utf-8"),
}));

/**
 * RC2 Brand Guide v2.2 — "The High-End Tool".
 *
 * O guia governa a identidade visual. Estes contratos protegem o que é
 * verificável estaticamente: os tokens, a contenção do Safety Orange e a
 * ausência da linguagem visual que a v2.2 proíbe.
 *
 * Contraste e foco reais são medidos em E2E; aqui garantimos que as decisões
 * de cor não regridam no sistema de tokens.
 */

describe("Brand v2.2 — paleta", () => {
  it.each([
    ["--rc2-brand", "#FF5F1F"],
    ["--rc2-brand-text", "#C2410C"],
    ["--rc2-brand-hover", "#F04F14"],
    ["--rc2-brand-active", "#DC4510"],
    ["--rc2-accent-soft", "#FFF0E9"],
    ["--rc2-bg", "#F7F5F1"],
    ["--rc2-bg-alt", "#FBFAF8"],
    ["--rc2-surface", "#FFFFFF"],
    ["--rc2-heading", "#0B1726"],
    ["--rc2-text", "#24313D"],
    ["--rc2-text-secondary", "#66717D"],
    ["--rc2-border", "#DDE2E7"],
    ["--rc2-dark", "#081827"],
    ["--rc2-dark-2", "#0C2032"],
    ["--rc2-dark-elevated", "#11283A"],
    ["--rc2-dark-card", "#132C40"],
    ["--rc2-dark-text-secondary", "#C6CED6"],
    ["--rc2-success", "#17835C"],
    ["--rc2-warning", "#A96000"],
    ["--rc2-error", "#C43D3D"],
  ])("%s = %s", (token, value) => {
    expect(css).toContain(`${token}: ${value};`);
  });

  it("o texto sobre Safety Orange é Graphite Navy, nunca branco", () => {
    expect(css).toContain("--rc2-on-brand: #0B1726;");
  });
});

describe("Brand v2.2 — tipografia", () => {
  it.each([
    ["--rc2-tracking-h1", "-0.015em"],
    ["--rc2-tracking-h2", "-0.01em"],
    ["--rc2-tracking-label", "0.06em"],
    ["--rc2-leading-body", "1.75"],
  ])("%s = %s", (token, value) => {
    expect(css).toContain(`${token}: ${value};`);
  });

  it("H1, H2, body e label consomem os tokens, não valores soltos", () => {
    expect(css).toContain("letter-spacing: var(--rc2-tracking-h1)");
    expect(css).toContain("letter-spacing: var(--rc2-tracking-h2)");
    expect(css).toContain("letter-spacing: var(--rc2-tracking-label)");
    expect(css).toContain("line-height: var(--rc2-leading-body)");
  });

  it("mantém Barlow como família única, com a variante Condensed nos labels", () => {
    // Contrato positivo: toda pilha de fonte começa em Barlow. Mais forte que
    // enumerar famílias proibidas — e imune a "sans-serif" no fallback.
    const stacks = [...css.matchAll(/font-family:\s*([^;]+);/g)].map((m) =>
      m[1].trim()
    );
    expect(stacks.length).toBeGreaterThan(0);
    for (const stack of stacks) {
      // `ui-monospace` é pilha funcional para blocos de código, não uma
      // segunda família de marca.
      if (stack.startsWith("ui-monospace")) continue;
      expect(stack.startsWith("var(--font-barlow")).toBe(true);
    }
    expect(css).toContain("var(--font-barlow-condensed)");
  });
});

describe("Brand v2.2 — ritmo, sombras e movimento", () => {
  it("usa o ritmo de seção da v2.2 (80px mobile / 120px desktop)", () => {
    expect(css).toContain("--space-section-y-mobile: 5rem;");
    expect(css).toContain("--space-section-y-desktop: 7.5rem;");
  });

  it("usa sombras amplas e leves, sem peso", () => {
    expect(css).toContain("--shadow-soft: 0 4px 24px rgba(11, 23, 38, 0.05);");
    expect(css).toContain("--shadow-lift: 0 8px 32px rgba(11, 23, 38, 0.08);");
  });

  it("o hover de card desloca no máximo 2px", () => {
    expect(css).toContain("transform: translateY(-2px);");
    expect(css).not.toMatch(/\.rc2-card-hover[^}]*-translate-y-[2-9]/);
  });

  it("respeita prefers-reduced-motion no card", () => {
    expect(css).toContain("prefers-reduced-motion");
  });
});

describe("Brand v2.2 — o que a identidade proíbe", () => {
  it("não reintroduz nenhum valor legado descontinuado", () => {
    for (const legado of ["#F5F0E8", "#121212", "#1E1610", "#163020", "#0D0D0F"]) {
      expect(css).not.toContain(legado);
    }
  });

  it("não usa glow decorativo em nenhuma superfície", () => {
    const ofensores = tsx
      .filter(({ body }) => /blur-(2xl|3xl)/.test(body))
      .map(({ file }) => file);
    expect(ofensores).toEqual([]);
  });

  it("não coloca texto claro sobre Safety Orange", () => {
    const ofensores = tsx
      .filter(({ body }) =>
        /bg-rc2-(orange|brand) +text-(rc2-sand|white)/.test(body)
      )
      .map(({ file }) => file);
    expect(ofensores).toEqual([]);
  });

  it("mantém o grid abaixo do teto de opacidade da v2.2", () => {
    const grids = [...css.matchAll(/rgba\((?:11, 23, 38|255, 255, 255), (0\.\d+)\) 1px/g)];
    expect(grids.length).toBeGreaterThan(0);
    for (const [, opacidade] of grids) {
      expect(Number(opacidade)).toBeLessThanOrEqual(0.05);
    }
  });

  it("não usa verde como cor estrutural — só WhatsApp e Success", () => {
    const verdes = [...css.matchAll(/#[0-9A-Fa-f]{6}/g)]
      .map((m) => m[0].toUpperCase())
      .filter((hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return g > r + 24 && g > b + 24;
      });
    expect(verdes.sort()).toEqual(["#17835C", "#25D366"]);
  });
});

describe("Brand v2.2 — superfícies escuras", () => {
  it("a família dark é a da v2.2, sem cor estrutural nova", () => {
    for (const navy of ["#081827", "#0C2032", "#11283A", "#132C40"]) {
      expect(css).toContain(navy);
    }
  });

  it("oferece divisória interna suave sem perder a separação estrutural", () => {
    // `#081827` e `#0C2032` diferem 1.08:1: a borda estrutural precisa ser
    // visível, enquanto a divisória interna pode ser sutil (v2.2, footer).
    expect(css).toContain("--rc2-dark-border-soft: rgba(255, 255, 255, 0.08);");
    expect(css).toContain("--rc2-dark-border: #294054;");
  });
});
