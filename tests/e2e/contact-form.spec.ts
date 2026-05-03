import { test, expect } from "@playwright/test";

test.describe("Formulário de contato", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contato");
  });

  test("renderiza todos os campos obrigatórios", async ({ page }) => {
    await expect(page.getByLabel(/Nome/i)).toBeVisible();
    await expect(page.getByLabel(/Empresa/i)).toBeVisible();
    await expect(page.getByLabel(/E-mail/i)).toBeVisible();
    await expect(page.getByLabel(/WhatsApp/i)).toBeVisible();
    await expect(page.getByLabel(/Segmento/i)).toBeVisible();
    await expect(page.getByLabel(/colaboradores/i)).toBeVisible();
    await expect(page.getByLabel(/solução/i)).toBeVisible();
    await expect(page.getByLabel(/desafio/i)).toBeVisible();
  });

  test("mostra erros de validação para campos vazios", async ({ page }) => {
    await page.getByRole("button", { name: /Solicitar diagnóstico/i }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("botão de submit está habilitado por padrão", async ({ page }) => {
    const button = page.getByRole("button", { name: /Solicitar diagnóstico/i });
    await expect(button).toBeEnabled();
  });

  test("preenchimento correto habilita envio", async ({ page }) => {
    await page.getByLabel(/Nome/i).fill("João Silva");
    await page.getByLabel(/Empresa/i).fill("Empresa Teste LTDA");
    await page.getByLabel(/E-mail/i).fill("joao@teste.com");
    await page.getByLabel(/WhatsApp/i).fill("11999999999");
    await page.getByLabel(/Segmento/i).fill("Varejo");
    await page.getByLabel(/colaboradores/i).selectOption("1–10 colaboradores");
    await page.getByLabel(/solução/i).selectOption("Automações com IA");
    await page.getByLabel(/desafio/i).fill("Preciso automatizar meu atendimento no WhatsApp com clientes.");

    const button = page.getByRole("button", { name: /Solicitar diagnóstico/i });
    await expect(button).toBeEnabled();
  });
});
