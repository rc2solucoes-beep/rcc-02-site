import { test, expect } from "@playwright/test";

/**
 * Migração SEO pós-Fase 5 — docs/16.
 *
 * Dois serviços passaram a redirecionar para âncoras de `/solucoes`. Os três
 * restantes continuam 200 e renderizando.
 *
 * Este arquivo também repara duas dívidas PREEXISTENTES, anteriores a esta
 * migração (ver PR):
 *  - exigia o CTA "Solicitar diagnóstico", descontinuado na Fase 2;
 *  - exigia o texto "Ler artigo" no blog, que o BlogCard não usa mais.
 */

/** Serviços que continuam respondendo 200. */
const RENDERED_SLUGS = ["e-commerce", "sites-e-landing-pages"] as const;

/** Serviços migrados: slug → destino. */
const REDIRECTED_SLUGS = {
  "agentes-de-ia": "/solucoes#ia-para-operacoes",
  "automacao-de-processos": "/solucoes#automacao-de-processos",
  // Fase 6F — território integralmente Zapbox, consolidado na ponte.
  "automacoes-com-ia": "/zapbox",
} as const;

const ALL_SLUGS = [...RENDERED_SLUGS, ...Object.keys(REDIRECTED_SLUGS)];

test.describe("Hub de serviços", () => {
  test("listagem continua exibindo os 5 serviços", async ({ page }) => {
    await page.goto("/servicos");
    await expect(page).toHaveTitle(/Serviços/);

    const serviceLinks = page.getByRole("main").getByRole("link", { name: /Ver serviço/i });
    await expect(serviceLinks).toHaveCount(ALL_SLUGS.length);
  });

  test("serviços preservados continuam linkando para a própria URL", async ({ page }) => {
    await page.goto("/servicos");
    for (const slug of RENDERED_SLUGS) {
      await expect(
        page.getByRole("main").locator(`a[href="/servicos/${slug}"]`)
      ).toBeVisible();
    }
  });

  test("serviços migrados linkam direto para a âncora final, sem salto", async ({ page }) => {
    await page.goto("/servicos");
    for (const [slug, anchor] of Object.entries(REDIRECTED_SLUGS)) {
      await expect(page.getByRole("main").locator(`a[href="${anchor}"]`)).toBeVisible();
      await expect(
        page.getByRole("main").locator(`a[href="/servicos/${slug}"]`)
      ).toHaveCount(0);
    }
  });
});

test.describe("Serviços preservados", () => {
  for (const slug of RENDERED_SLUGS) {
    test(`/servicos/${slug} carrega sem erro`, async ({ page }) => {
      const response = await page.goto(`/servicos/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(`/servicos/${slug}$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // CTA vigente da página de serviço (a copy anterior foi descontinuada na Fase 2).
      await expect(
        page.getByRole("link", { name: /Aplicar isso na minha operação/i }).first()
      ).toBeVisible();
    });
  }

  test("navegação entre serviços nunca oferece uma URL migrada", async ({ page }) => {
    for (const slug of RENDERED_SLUGS) {
      await page.goto(`/servicos/${slug}`);
      for (const migrado of Object.keys(REDIRECTED_SLUGS)) {
        await expect(
          page.getByRole("main").locator(`a[href="/servicos/${migrado}"]`)
        ).toHaveCount(0);
      }
    }
  });

  test("a solução relacionada continua sendo exibida", async ({ page }) => {
    await page.goto("/servicos/e-commerce");
    await expect(
      page.getByRole("link", { name: /Ver solução por problema relacionada/i })
    ).toBeVisible();
  });
});

test.describe("Serviços migrados", () => {
  for (const [slug, destino] of Object.entries(REDIRECTED_SLUGS)) {
    test(`/servicos/${slug} redireciona para ${destino}`, async ({ page }) => {
      const response = await page.goto(`/servicos/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(`${destino}$`));

      // Nem todo destino é âncora: a Fase 6F migra para a rota `/zapbox`.
      const id = destino.split("#")[1];
      if (id) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
    });
  }

  test("o alias /services chega em /solucoes", async ({ page }) => {
    await page.goto("/services");
    await expect(page).toHaveURL(/\/solucoes$/);
  });
});

test.describe("Blog público", () => {
  test("página de blog carrega", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("mostra artigos ou o estado vazio", async ({ page }) => {
    await page.goto("/blog");
    const artigos = page.getByRole("main").locator('a[href^="/blog/"]');
    const estadoVazio = page.getByText(/Em breve/i);

    const temArtigos = (await artigos.count()) > 0;
    if (temArtigos) {
      await expect(artigos.first()).toBeVisible();
    } else {
      await expect(estadoVazio.first()).toBeVisible();
    }
  });
});
