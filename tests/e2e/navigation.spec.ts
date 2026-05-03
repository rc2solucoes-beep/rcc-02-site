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

    // Serviços
    await page.getByRole("link", { name: /Serviços/i }).first().click();
    await expect(page).toHaveURL(/\/servicos$/);

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

  test("link de diagnóstico no header vai para /contato", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnóstico Gratuito/i }).first().click();
    await expect(page).toHaveURL(/\/contato/);
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
    await expect(page.getByText(/404/)).toBeVisible();
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
    await expect(page.getByRole("link", { name: /Serviços/i }).nth(1)).toBeVisible();

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
