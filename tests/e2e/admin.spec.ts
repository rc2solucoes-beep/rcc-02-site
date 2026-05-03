import { test, expect } from "@playwright/test";

// These tests require ADMIN_EMAIL and ADMIN_PASSWORD env vars to be set.
// In CI, set them as secrets. Locally, create a .env.test file.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

test.describe("Admin — proteção de rota", () => {
  test("rota /admin/dashboard redireciona para login sem sessão", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("página de login renderiza corretamente", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByLabel(/E-mail/i)).toBeVisible();
    await expect(page.getByLabel(/Senha/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Entrar/i })).toBeVisible();
  });

  test("login com credenciais inválidas mostra erro", async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel(/E-mail/i).fill("invalido@naoexiste.com");
    await page.getByLabel(/Senha/i).fill("senhaErrada123");
    await page.getByRole("button", { name: /Entrar/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });
});

// Only run authenticated tests if credentials are provided
const hasCredentials = !!(ADMIN_EMAIL && ADMIN_PASSWORD);

(hasCredentials ? test.describe : test.describe.skip)("Admin — fluxo autenticado", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel(/E-mail/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/Senha/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test("dashboard exibe cards de stats", async ({ page }) => {
    await expect(page.getByText(/Posts publicados/i)).toBeVisible();
    await expect(page.getByText(/Leads totais/i)).toBeVisible();
    await expect(page.getByText(/Leads esta semana/i)).toBeVisible();
  });

  test("sidebar navega para leads", async ({ page }) => {
    await page.getByRole("link", { name: /Leads/i }).click();
    await expect(page).toHaveURL(/\/admin\/leads/);
    await expect(page.getByRole("heading", { name: /Leads/i })).toBeVisible();
  });

  test("cria novo post e aparece na listagem", async ({ page }) => {
    await page.goto("/admin/posts/novo");

    const title = `Teste E2E ${Date.now()}`;
    await page.getByLabel(/Título/i).fill(title);
    await page.getByLabel(/Resumo/i).fill("Resumo de teste automatizado pelo Playwright.");
    // Conteúdo no TipTap
    await page.locator(".ProseMirror").click();
    await page.keyboard.type("Conteúdo do post de teste criado pelo Playwright.");

    await page.getByLabel(/Status/i).selectOption("draft");
    await page.getByRole("button", { name: /Salvar post/i }).click();

    // Redireciona para listagem
    await expect(page).toHaveURL(/\/admin\/posts$/);
    await expect(page.getByText(title)).toBeVisible();
  });

  test("logout redireciona para login", async ({ page }) => {
    await page.getByRole("button", { name: /Sair/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });
});
