import { expect, test, type Page } from "@playwright/test";

const H1_TEXT =
  "Sua operação não precisa de mais ferramentas. Precisa funcionar melhor.";

async function overflowMetrics(page: Page) {
  return page.evaluate(() => ({
    width: window.innerWidth,
    appScrollWidth: Math.max(
      ...Array.from(document.querySelectorAll("header, main, footer")).map(
        (element) => element.scrollWidth
      )
    ),
    docScrollWidth: document.documentElement.scrollWidth,
    offenders: Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          className: element.getAttribute("class"),
          text: element.textContent?.trim().slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      })
      .filter((item) => item.left < 0 || item.right > window.innerWidth)
      .slice(0, 8),
  }));
}

// Scrollbar persistente: o Chromium headless a esconde por padrão, o que mascarou
// uma quebra em 3 linhas que usuários reais (viewport útil 15px menor) viam.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

// `networkidle` não fecha em navegações repetidas no build de produção (os
// prefetches `_rsc` dos links ficam pendentes). Esperamos `load` e as fontes,
// que são o que muda a quebra de linha medida.
async function gotoHome(page: Page) {
  await page.goto("/", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
}

async function heroLines(page: Page) {
  return page.evaluate(() => {
    const lines = (selector: string) => {
      const el = document.querySelector(selector)!;
      const style = getComputedStyle(el);
      return Math.round(el.getBoundingClientRect().height / parseFloat(style.lineHeight));
    };
    return {
      scrollbar: window.innerWidth - document.documentElement.clientWidth,
      lead: lines(".rc2-hero-title__lead"),
      resolve: lines(".rc2-hero-title__resolve"),
    };
  });
}

test.describe("home motion and responsive polish", () => {
  test("hero conclusion stays on 2 lines at 390 and 360 with a persistent scrollbar", async ({ page }) => {
    for (const width of [390, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoHome(page);
      const m = await heroLines(page);
      // Pré-condição: sem scrollbar o teste não reproduziria o bug.
      expect(m.scrollbar, `viewport ${width}`).toBeGreaterThan(0);
      expect(m.resolve, `conclusão em ${width}`).toBe(2);
      expect(m.lead, `primeira frase em ${width}`).toBe(2);
    }
  });

  test("hero conclusion stays on 1 line from 768 up", async ({ page }) => {
    for (const width of [768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoHome(page);
      expect((await heroLines(page)).resolve, `conclusão em ${width}`).toBe(1);
    }
  });

  test("renders the hero and scroll reveal hooks without horizontal overflow", async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 1024, height: 800 },
      { width: 768, height: 900 },
      { width: 390, height: 900 },
      { width: 360, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoHome(page);

      await expect(page.locator(".rc2-hero-stage")).toBeVisible();
      await expect(page.locator(".scroll-reveal").first()).toBeVisible();

      const metrics = await overflowMetrics(page);
      const context = JSON.stringify({ viewport, offenders: metrics.offenders }, null, 2);
      expect(metrics.appScrollWidth, context).toBeLessThanOrEqual(metrics.width);
      expect(metrics.docScrollWidth, context).toBeLessThanOrEqual(metrics.width);
    }
  });

  test("hero h1 is unique, complete and settles visible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(H1_TEXT);

    const final = await page.evaluate(() => {
      const h1 = getComputedStyle(document.querySelector("h1")!);
      return { opacity: h1.opacity, transform: h1.transform };
    });
    expect(final.opacity).toBe("1");
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(final.transform);
  });

  test("keeps hero and reveal content visible when reduced motion is preferred", async ({ browser }) => {
    const page = await browser.newPage({
      reducedMotion: "reduce",
      viewport: { width: 375, height: 900 },
    });

    await page.goto("/", { waitUntil: "networkidle" });

    const metrics = await page.evaluate(() => ({
      hiddenRevealCount: document.querySelectorAll('.scroll-reveal[data-reveal-state="hidden"]').length,
      h1Animation: getComputedStyle(document.querySelector("h1")!).animationName,
      h1Opacity: getComputedStyle(document.querySelector("h1")!).opacity,
    }));

    expect(metrics.hiddenRevealCount).toBe(0);
    expect(metrics.h1Animation).toBe("none");
    expect(metrics.h1Opacity).toBe("1");
    await expect(page.locator("h1")).toHaveText(H1_TEXT);

    await page.close();
  });
});

test.describe("header menu", () => {
  test("opens, closes by toggle and by Escape returning focus, with correct aria", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });

    const button = page.getByRole("button", { name: "Abrir menu" });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).not.toHaveAttribute("aria-controls", /.+/);
    await expect(page.locator("#mobile-main-menu")).toHaveCount(0);

    await button.click();
    const toggle = page.getByRole("button", { name: "Fechar menu" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAttribute("aria-controls", "mobile-main-menu");
    const menu = page.locator("#mobile-main-menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link")).toHaveCount(7);

    // Abre e fecha em sequência rápida: não pode sobrar painel preso.
    await toggle.click();
    await expect(menu).toHaveCount(0);
    await button.click();
    await expect(menu).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(menu.getByRole("link", { name: "Início" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    // O foco volta num requestAnimationFrame: toBeFocused repete até passar.
    const reopened = page.getByRole("button", { name: "Abrir menu" });
    await expect(reopened).toBeFocused();

    // Anel de foco em área clara: --rc2-brand-text (#C2410C), nunca currentColor.
    // A cor do outline transiciona em 150ms: amostrar uma vez pega o meio da
    // transição, então o valor final é esperado com poll.
    const readRing = () =>
      reopened.evaluate((el) => {
        const probe = document.createElement("span");
        probe.style.color = "var(--rc2-brand-text)";
        document.body.appendChild(probe);
        const expected = getComputedStyle(probe).color;
        probe.remove();
        const style = getComputedStyle(el);
        return {
          color: style.outlineColor === expected ? "brand-text" : style.outlineColor,
          width: style.outlineWidth,
          offset: style.outlineOffset,
          style: style.outlineStyle,
        };
      });
    await expect
      .poll(readRing)
      .toEqual({ color: "brand-text", width: "2px", offset: "2px", style: "solid" });
  });

  test("open animation ends fully visible and does not overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const menu = page.locator("#mobile-main-menu");
    await expect(menu).toBeVisible();
    await expect
      .poll(() => menu.evaluate((el) => getComputedStyle(el).opacity))
      .toBe("1");
    const metrics = await overflowMetrics(page);
    expect(metrics.docScrollWidth, JSON.stringify(metrics.offenders)).toBeLessThanOrEqual(
      metrics.width
    );
  });

  test("resizing to desktop closes the menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.locator("#mobile-main-menu")).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator("#mobile-main-menu")).toHaveCount(0);
  });

  test("with reduced motion the menu opens without any animation", async ({ browser }) => {
    const page = await browser.newPage({
      reducedMotion: "reduce",
      viewport: { width: 390, height: 800 },
    });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const menu = page.locator("#mobile-main-menu");
    await expect(menu).toBeVisible();
    expect(await menu.evaluate((el) => el.getAnimations().length)).toBe(0);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await page.close();
  });
});

// Regressão de produção: o JSX novo (logo recortado, spans do h1) foi publicado
// sem o bloco novo do globals.css. Sem CSS, o logo do header renderiza ~722px, o
// do rodapé fica enorme e os spans do h1 ficam inline. Estas asserções medem
// geometria computada no navegador (não nomes de classe), então falham contra
// CSS ausente ou cacheado mesmo sem overflow horizontal.
const LOGO_ALT = "RC2 Soluções";
const CSS_HINT =
  " — indica CSS do globals.css ausente/desatualizado no deploy (JSX novo com CSS antigo)";
const CLIPS = /^(hidden|clip)$/;

async function logoGeometry(page: Page, container: "header" | "footer") {
  return page.evaluate(
    ({ container, alt }) => {
      const box = (r: DOMRect) => ({
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
      const root = Array.from(document.querySelectorAll(container)).find((el) =>
        el.querySelector(`img[alt="${alt}"]`)
      );
      if (!root) {
        return { found: false as const, reason: `nenhum <${container}> contém img alt="${alt}"` };
      }
      const img = root.querySelector(`img[alt="${alt}"]`) as HTMLImageElement;
      const link = img.closest("a");
      if (!link) {
        return { found: false as const, reason: `img do ${container} não está dentro de <a>` };
      }
      const frame = img.parentElement as HTMLElement;
      const fs = getComputedStyle(frame);
      const ir = img.getBoundingClientRect();
      const fr = frame.getBoundingClientRect();
      const ix = Math.max(0, Math.min(ir.right, fr.right) - Math.max(ir.left, fr.left));
      const iy = Math.max(0, Math.min(ir.bottom, fr.bottom) - Math.max(ir.top, fr.top));
      return {
        found: true as const,
        link: box(link.getBoundingClientRect()),
        frame: box(fr),
        img: box(ir),
        frameIsLink: frame === link,
        framePosition: fs.position,
        frameOverflowX: fs.overflowX,
        frameOverflowY: fs.overflowY,
        // fração do quadro efetivamente coberta pela imagem (conteúdo visível)
        frameCoverage: fr.width * fr.height > 0 ? (ix * iy) / (fr.width * fr.height) : 0,
        containerBottom: root.getBoundingClientRect().bottom,
        imgNaturalWidth: img.naturalWidth,
      };
    },
    { container, alt: LOGO_ALT }
  );
}

test.describe("home CSS published together with the JSX (production regression)", () => {
  for (const width of [390, 1440]) {
    test(`header logo, footer logo and hero spans have bounded geometry at ${width}`, async ({ page }, testInfo) => {
      const height = width === 390 ? 900 : 1000;
      await page.setViewportSize({ width, height });
      await gotoHome(page);
      const at = `viewport ${width}`;

      // Header: logo contido em wrapper recortado.
      const h = await logoGeometry(page, "header");
      if (!h.found) throw new Error(`${at}: ${h.reason}`);
      const hctx = `${at}: ${JSON.stringify({ link: h.link, frame: h.frame, img: h.img })}${CSS_HINT}`;
      expect(h.link.width, `largura do link do logo no header fora de 90..140. ${hctx}`).toBeGreaterThanOrEqual(90);
      expect(h.link.width, `largura do link do logo no header fora de 90..140. ${hctx}`).toBeLessThanOrEqual(140);
      expect(h.link.height, `altura do link do logo no header > 68. ${hctx}`).toBeLessThanOrEqual(68);
      expect(h.frameIsLink, `imagem do logo sem wrapper de recorte. ${hctx}`).toBe(false);
      expect(h.framePosition, `wrapper do logo sem position:relative. ${hctx}`).toBe("relative");
      expect(h.frameOverflowX, `wrapper do logo não recorta em X. ${hctx}`).toMatch(CLIPS);
      expect(h.frameOverflowY, `wrapper do logo não recorta em Y. ${hctx}`).toMatch(CLIPS);
      expect(h.frame.width, `wrapper do logo > 140px. ${hctx}`).toBeLessThanOrEqual(140);
      expect(h.frame.height, `wrapper do logo > 68px (conteúdo visível estourado). ${hctx}`).toBeLessThanOrEqual(68);
      expect(h.frameCoverage, `imagem não cobre o wrapper do logo (recorte quebrado). ${hctx}`).toBeGreaterThanOrEqual(0.9);
      expect(h.imgNaturalWidth, `imagem do logo do header não carregou. ${hctx}`).toBeGreaterThan(0);

      // A viewport inicial (sem full-page) inclui o header.
      expect(h.containerBottom, `${at}: header fora da viewport inicial`).toBeGreaterThan(0);
      expect(h.containerBottom, `${at}: header não cabe na viewport inicial`).toBeLessThanOrEqual(height);
      await testInfo.attach(`viewport-${width}.png`, {
        body: await page.screenshot({ fullPage: false }),
        contentType: "image/png",
      });

      // Hero: spans em bloco e conclusão maior que a primeira frase.
      const hero = await page.evaluate(() => {
        const read = (selector: string) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const style = getComputedStyle(el);
          return { display: style.display, fontSize: parseFloat(style.fontSize) };
        };
        return { lead: read(".rc2-hero-title__lead"), resolve: read(".rc2-hero-title__resolve") };
      });
      const heroCtx = `${at}: ${JSON.stringify(hero)}${CSS_HINT}`;
      expect(hero.lead, `span .rc2-hero-title__lead ausente do DOM. ${heroCtx}`).not.toBeNull();
      expect(hero.resolve, `span .rc2-hero-title__resolve ausente do DOM. ${heroCtx}`).not.toBeNull();
      expect(hero.lead!.display, `lead não é display:block (inline). ${heroCtx}`).toBe("block");
      expect(hero.resolve!.display, `resolve não é display:block (inline). ${heroCtx}`).toBe("block");
      expect(
        hero.resolve!.fontSize,
        `font-size da conclusão deve ser maior que o da primeira frase. ${heroCtx}`
      ).toBeGreaterThan(hero.lead!.fontSize);

      // Footer: âncora do logo com tamanho limitado e imagem contida no wrapper.
      await page.locator("footer").scrollIntoViewIfNeeded();
      const f = await logoGeometry(page, "footer");
      if (!f.found) throw new Error(`${at}: ${f.reason}`);
      const fctx = `${at}: ${JSON.stringify({ link: f.link, frame: f.frame, img: f.img })}${CSS_HINT}`;
      expect(f.link.width, `largura do link do logo no rodapé fora de 90..140. ${fctx}`).toBeGreaterThanOrEqual(90);
      expect(f.link.width, `largura do link do logo no rodapé fora de 90..140. ${fctx}`).toBeLessThanOrEqual(140);
      expect(f.link.height, `link do logo no rodapé menor que 44px (alvo de toque). ${fctx}`).toBeGreaterThanOrEqual(44);
      expect(f.frameIsLink, `imagem do logo do rodapé sem wrapper de recorte. ${fctx}`).toBe(false);
      expect(f.framePosition, `wrapper do logo do rodapé sem position:relative. ${fctx}`).toBe("relative");
      expect(f.frameOverflowX, `wrapper do logo do rodapé não recorta em X. ${fctx}`).toMatch(CLIPS);
      expect(f.frameOverflowY, `wrapper do logo do rodapé não recorta em Y. ${fctx}`).toMatch(CLIPS);
      expect(f.frame.width, `wrapper do logo do rodapé > 140px. ${fctx}`).toBeLessThanOrEqual(140);
      expect(f.frame.height, `wrapper visual do logo do rodapé > 60px (logo gigante). ${fctx}`).toBeLessThanOrEqual(60);
    });
  }
});
