import { test, expect, type Page } from "@playwright/test";

async function fillStepOneAndContinue(page: Page) {
  await page.getByLabel(/Seu nome/i).fill("João Silva");
  await page.getByLabel(/E-mail/i).fill("joao@teste.com");
  await page.getByRole("textbox", { name: /^WhatsApp$/i }).fill("11999999999");
  await page
    .getByLabel(/principal desafio/i)
    .fill("Preciso automatizar meu atendimento no WhatsApp com clientes.");
  await page.getByRole("button", { name: /Continuar para dados da empresa/i }).click();
  await expect(
    page.getByText("Etapa 2 de 2 — Dados da empresa", { exact: true })
  ).toBeVisible();
}

test.describe("Formulário de contato", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contato");
  });

  test("renderiza todos os campos obrigatórios", async ({ page }) => {
    await expect(page.getByLabel(/Seu nome/i)).toBeVisible();
    await expect(page.getByLabel(/E-mail/i)).toBeVisible();
    await expect(page.getByRole("textbox", { name: /^WhatsApp$/i })).toBeVisible();
    await expect(page.getByLabel(/principal desafio/i)).toBeVisible();

    await fillStepOneAndContinue(page);

    await expect(page.getByLabel(/Empresa/i)).toBeVisible();
    await expect(page.getByLabel(/Segmento/i)).toBeVisible();
    await expect(page.getByLabel(/colaboradores/i)).toBeVisible();
    await expect(page.getByLabel(/solução/i)).toBeVisible();
  });

  test("mostra erros de validação para campos vazios", async ({ page }) => {
    await fillStepOneAndContinue(page);
    await page.getByRole("button", { name: /Solicitar diagnóstico/i }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("botão de submit está habilitado por padrão", async ({ page }) => {
    await fillStepOneAndContinue(page);
    const button = page.getByRole("button", { name: /Solicitar diagnóstico/i });
    await expect(button).toBeEnabled();
  });

  test("preenchimento correto habilita envio", async ({ page }) => {
    await fillStepOneAndContinue(page);

    await page.getByLabel(/Empresa/i).fill("Empresa Teste LTDA");
    await page.getByLabel(/Segmento/i).fill("Varejo");
    await page.getByLabel(/colaboradores/i).selectOption("1–10 colaboradores");
    await page.getByLabel(/solução/i).selectOption("Automatizar atendimento ou vendas");

    const button = page.getByRole("button", { name: /Solicitar diagnóstico/i });
    await expect(button).toBeEnabled();
  });
});
