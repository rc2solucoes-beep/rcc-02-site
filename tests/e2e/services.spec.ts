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

/**
 * Serviços que continuam respondendo 200 — nenhum.
 *
 * Fase 3 (`docs/24`) consolidou `/servicos` em `/solucoes`: o hub e os dois
 * últimos slugs passaram a redirecionar.
 */
const RENDERED_SLUGS = [] as const;

/** Serviços migrados: slug → destino. */
const REDIRECTED_SLUGS = {
  "agentes-de-ia": "/solucoes#ia-para-operacoes",
  "automacao-de-processos": "/solucoes#automacao-de-processos",
  // Fase 6F — território integralmente Zapbox, consolidado na ponte.
  "automacoes-com-ia": "/zapbox",
  // Fase 3 — consolidação de /servicos (docs/24 §2).
  "e-commerce": "/solucoes#operacoes-digitais-commerce",
  "sites-e-landing-pages": "/solucoes",
} as const;

const ALL_SLUGS = [...RENDERED_SLUGS, ...Object.keys(REDIRECTED_SLUGS)];

test.describe("Hub de serviços", () => {
  test("o hub redireciona para /solucoes em um salto", async ({ request }) => {
    const response = await request.get("/servicos", { maxRedirects: 0 });

    expect([301, 308]).toContain(response.status());
    expect(response.headers()["location"]).toContain("/solucoes");
  });

  test("nenhuma URL de /servicos responde 200", async ({ request }) => {
    for (const slug of ALL_SLUGS) {
      const response = await request.get(`/servicos/${slug}`, { maxRedirects: 0 });
      expect([301, 308]).toContain(response.status());
    }
  });
});

// Vazio desde a Fase 3: o bloco permanece para o dia em que algum serviço
// voltar a renderizar, e falha alto se `RENDERED_SLUGS` for repovoado sem
// remover o redirect correspondente.
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

  // A verificação de que nenhum link interno alcançável aponta para /servicos
  // passou a ser estática, em `tests/unit/seo/internalLinks.test.ts`: na Fase
  // 3B a última página que renderizava esses links também migrou.
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
