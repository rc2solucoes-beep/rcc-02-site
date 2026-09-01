import { expect, test, type Locator } from "@playwright/test";

async function typographyOf(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontFamily: style.fontFamily,
      fontSize: Number.parseFloat(style.fontSize),
      fontWeight: style.fontWeight,
      letterSpacing: Number.parseFloat(style.letterSpacing),
    };
  });
}

async function paddingOf(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      top: Number.parseFloat(style.paddingTop),
      bottom: Number.parseFloat(style.paddingBottom),
    };
  });
}

test.describe("Tipografia e ritmo RC2", () => {
  test("headlines usam tracking negativo e display fica restrito ao H1", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");

    const hero = await typographyOf(page.getByRole("heading", { level: 1 }));
    expect(hero.fontFamily).toContain("Barlow Condensed");
    expect(hero.fontWeight).toBe("800");
    expect(hero.letterSpacing / hero.fontSize).toBeCloseTo(-0.02, 3);

    // A Fase 4 reconstruiu a Home. Os headings são selecionados por posição
    // estrutural, não por copy, para o teste proteger a intenção tipográfica
    // sem quebrar a cada ajuste editorial.
    const sectionHeadings = page.getByRole("main").getByRole("heading", { level: 2 });
    await expect(sectionHeadings.first()).toBeVisible();

    const differential = await typographyOf(sectionHeadings.first());
    expect(differential.fontFamily).not.toContain("Barlow Condensed");
    expect(differential.fontWeight).toBe("600");
    expect(differential.letterSpacing / differential.fontSize).toBeCloseTo(-0.01, 3);

    // Último H2 do main: o bloco de CTA que fecha a página.
    const closingCta = await typographyOf(sectionHeadings.last());
    expect(closingCta.fontFamily).not.toContain("Barlow Condensed");
    expect(closingCta.fontWeight).toBe("700");
  });

  test("sobre alterna abertura, argumento e encerramento", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/sobre");

    await expect(page.locator("main .rc2-section--opening")).toHaveCount(1);
    await expect(page.locator("main .rc2-section--argument")).toHaveCount(1);
    expect(await paddingOf(page.locator("main .rc2-section--opening"))).toEqual({
      top: 128,
      bottom: 88,
    });
    expect(await paddingOf(page.locator("main .rc2-section--argument"))).toEqual({
      top: 72,
      bottom: 72,
    });

    // O encerramento reutiliza o bloco de CTA compartilhado, mas precisa manter
    // o modificador de ritmo do design system (80px mobile / 112px desktop).
    const closing = page.getByRole("main").locator("section").last();
    await expect(closing).toHaveClass(/rc2-section--closing/);
    await expect(closing).toHaveClass(/bg-rc2-dark/);
    await expect(closing.getByRole("heading", { level: 2 })).toBeVisible();
    expect(await paddingOf(closing)).toEqual({ top: 112, bottom: 112 });

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await paddingOf(closing)).toEqual({ top: 80, bottom: 80 });
    await page.setViewportSize({ width: 1440, height: 1000 });

    const firstStepNumber = await typographyOf(page.locator("ol li span[aria-hidden]").first());
    expect(firstStepNumber.fontFamily).not.toContain("Barlow Condensed");
    expect(firstStepNumber.fontWeight).toBe("700");
  });

  test("serviços usa seção de prova realmente densa", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/servicos");

    expect(await paddingOf(page.locator("main .rc2-section--proof"))).toEqual({
      top: 48,
      bottom: 48,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await paddingOf(page.locator("main .rc2-section--proof"))).toEqual({
      top: 32,
      bottom: 32,
    });
  });
});
