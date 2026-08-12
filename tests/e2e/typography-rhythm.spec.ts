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

    const differential = await typographyOf(
      page.getByRole("heading", { level: 2, name: "Tecnologia com visão de operação." })
    );
    expect(differential.fontFamily).not.toContain("Barlow Condensed");
    expect(differential.fontWeight).toBe("600");
    expect(differential.letterSpacing / differential.fontSize).toBeCloseTo(-0.01, 3);

    const closingCta = await typographyOf(
      page.getByRole("heading", {
        level: 2,
        name: "Quer descobrir onde a IA pode gerar resultado na sua empresa?",
      })
    );
    expect(closingCta.fontFamily).not.toContain("Barlow Condensed");
    expect(closingCta.fontWeight).toBe("700");
  });

  test("sobre alterna abertura, argumento e encerramento", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/sobre");

    await expect(page.locator("main .rc2-section--opening")).toHaveCount(1);
    await expect(page.locator("main .rc2-section--argument")).toHaveCount(1);
    await expect(page.locator("main .rc2-section--closing")).toHaveCount(1);
    expect(await paddingOf(page.locator("main .rc2-section--opening"))).toEqual({
      top: 128,
      bottom: 88,
    });
    expect(await paddingOf(page.locator("main .rc2-section--argument"))).toEqual({
      top: 72,
      bottom: 72,
    });
    expect(await paddingOf(page.locator("main .rc2-section--closing"))).toEqual({
      top: 112,
      bottom: 112,
    });

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
