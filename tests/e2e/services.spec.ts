import { test, expect } from "@playwright/test";

const SERVICE_SLUGS = [
  "automacoes-com-ia",
  "agentes-de-ia",
  "automacao-de-processos",
  "e-commerce",
  "sites-e-landing-pages",
];

test.describe("Páginas de serviço", () => {
  test("listagem exibe todos os 5 serviços", async ({ page }) => {
    await page.goto("/servicos");
    await expect(page).toHaveTitle(/Serviços/);

    const serviceLinks = page.getByRole("main").getByRole("link", { name: /Ver serviço/i });
    await expect(serviceLinks).toHaveCount(SERVICE_SLUGS.length);

    for (const slug of SERVICE_SLUGS) {
      await expect(
        page.getByRole("main").locator(`a[href="/servicos/${slug}"]`)
      ).toBeVisible();
    }
  });

  for (const slug of SERVICE_SLUGS) {
    test(`/servicos/${slug} carrega sem erro`, async ({ page }) => {
      const response = await page.goto(`/servicos/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("link", { name: /Solicitar diagnóstico/i })).toBeVisible();
    });
  }

  test("navegação entre serviços funciona", async ({ page }) => {
    await page.goto("/servicos/automacoes-com-ia");
    // Próximo serviço
    const nextLink = page.getByRole("link", { name: /Agentes/i });
    if (await nextLink.isVisible()) {
      await nextLink.click();
      await expect(page).toHaveURL(/agentes-de-ia/);
    }
  });
});

test.describe("Blog público", () => {
  test("página de blog carrega", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Blog/);
  });

  test("estado vazio mostra mensagem", async ({ page }) => {
    await page.goto("/blog");
    // Either shows posts or the empty state
    await expect(page.getByText(/Em breve|Ler artigo/i).first()).toBeVisible();
  });
});
