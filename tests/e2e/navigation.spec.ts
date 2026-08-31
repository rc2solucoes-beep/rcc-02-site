import { test, expect } from "@playwright/test";

test.describe("Navegação pública", () => {
  test("home carrega e tem título correto", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/RC2 Soluções/);
    await expect(page.getByRole("banner")).toBeVisible(); // header
    await expect(page.getByRole("contentinfo")).toBeVisible(); // footer
  });

  test("links do header navegam corretamente", async ({ page }) => {
    await page.goto("/");

    // Soluções — a Fase 5 substituiu "Serviços" e "Soluções com IA" por "Soluções".
    await page.getByRole("link", { name: /^Soluções$/i }).first().click();
    await expect(page).toHaveURL(/\/solucoes$/);

    // Blog
    await page.getByRole("link", { name: /Blog/i }).first().click();
    await expect(page).toHaveURL(/\/blog$/);

    // Sobre
    await page.getByRole("link", { name: /Sobre/i }).first().click();
    await expect(page).toHaveURL(/\/sobre$/);
  });

  test("logo navega para home", async ({ page }) => {
    await page.goto("/servicos");
    await page.getByRole("link", { name: /RC2/i }).first().click();
    await expect(page).toHaveURL("/");
  });

  test("CTA do header vai para /contato", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("banner")
      .getByRole("link", { name: /Falar com a RC2/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/contato/);
  });

  test("o header não promove mais a arquitetura legada", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    await expect(header.locator('a[href="/servicos"]')).toHaveCount(0);
    await expect(header.locator('a[href="/solucoes-com-ia"]')).toHaveCount(0);
    await expect(header.locator('a[href="/solucoes"]')).toHaveCount(1);
  });

  test("skip link está presente e focável", async ({ page }) => {
    await page.goto("/");
    // Tab once to focus the skip link
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: /Pular para o conteúdo/i });
    await expect(skipLink).toBeFocused();
  });

  test("página 404 exibe mensagem correta", async ({ page }) => {
    const response = await page.goto("/pagina-que-nao-existe");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("404", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Voltar ao início/i })).toBeVisible();
  });
});

test.describe("Menu mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("abre e fecha menu mobile", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.getByRole("button", { name: /Abrir menu/i });
    await expect(hamburger).toBeVisible();

    // Abre
    await hamburger.click();
    await expect(page.getByRole("button", { name: /Fechar menu/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Soluções$/i }).last()).toBeVisible();

    // Fecha
    await page.getByRole("button", { name: /Fechar menu/i }).click();
    await expect(page.getByRole("button", { name: /Abrir menu/i })).toBeVisible();
  });

  test("navega pelo menu mobile", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Abrir menu/i }).click();
    await page.getByRole("link", { name: /Blog/i }).last().click();
    await expect(page).toHaveURL(/\/blog/);
  });
});
