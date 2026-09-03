import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const css = readFileSync(join(root, "src/app/globals.css"), "utf-8");

type Source = { file: string; body: string };

function collectTsx(dir: string, acc: Source[] = []): Source[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectTsx(full, acc);
    else if (entry.name.endsWith(".tsx")) {
      acc.push({
        file: relative(root, full).replaceAll("\\", "/"),
        body: readFileSync(full, "utf-8"),
      });
    }
  }
  return acc;
}

const tsx = collectTsx(join(root, "src"));

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

/** Bloco de regras de um seletor de classe, do `{` ao primeiro `}`. */
const blocoDe = (selector: string) =>
  new RegExp("\\" + selector + " \{[^}]*\}");

describe("Brand v2.2 — tipografia", () => {
  it.each([
    ["--rc2-tracking-h1", "-0.015em"],
    ["--rc2-tracking-h2", "-0.01em"],
    ["--rc2-tracking-label", "0.06em"],
    ["--rc2-leading-body", "1.75"],
  ])("%s = %s", (token, value) => {
    expect(css).toContain(`${token}: ${value};`);
  });

  it("--rc2-tracking-display = 0.04em", () => {
    expect(css).toContain("--rc2-tracking-display: 0.04em;");
  });

  /**
   * As classes utilitárias são o que as páginas realmente usam. Enquanto
   * `.rc2-h1` carregava `-0.02em` literal, o token do elemento `h1` não
   * chegava ao título renderizado — o contrato passava, a página não.
   */
  it.each([
    [".rc2-h1", "--rc2-tracking-h1"],
    [".rc2-h2", "--rc2-tracking-h2"],
    [".rc2-display", "--rc2-tracking-display"],
  ])("%s consome %s em vez de literal", (selector, token) => {
    const bloco = css.match(blocoDe(selector));
    expect(bloco).not.toBeNull();
    expect(bloco![0]).toContain(`letter-spacing: var(${token})`);
    // Nenhum `letter-spacing` literal pode voltar a estes seletores.
    expect(bloco![0]).not.toMatch(/letter-spacing:\s*-?[\d.]+em/);
  });

  it("nenhum seletor de título volta a -0.02em hardcoded", () => {
    for (const selector of [".rc2-h1", ".rc2-h2", ".rc2-display"]) {
      const bloco = css.match(blocoDe(selector));
      expect(bloco![0]).not.toContain("-0.02em");
    }
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

  it("mantém o grid no teto de opacidade da v2.2 (0.03)", () => {
    const token = css.match(/--rc2-grid-opacity:\s*([\d.]+);/);
    expect(token).not.toBeNull();
    expect(Number(token![1])).toBeLessThanOrEqual(0.03);

    // Claro e escuro leem o mesmo token — nenhum grid escapa pelo valor literal.
    const grids = [...css.matchAll(/linear-gradient\((?:to right|to bottom), (.+?) 1px,/g)];
    expect(grids.length).toBeGreaterThan(0);
    for (const [, cor] of grids) {
      expect(cor).toContain("var(--rc2-grid-opacity)");
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
