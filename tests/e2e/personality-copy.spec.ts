import { expect, test } from "@playwright/test";

test.describe("Copy de personalidade visual", () => {
  test("home apresenta posicionamento, prova do fundador e CTAs contextuais", async ({ page }) => {
    await page.goto("/");

    const positioningHeading = page.getByRole("heading", { name: /O que a RC2 não é/i });
    const positioningSection = positioningHeading.locator("xpath=ancestor::section");

    await expect(positioningHeading).toBeVisible();
    await expect(
      positioningSection.locator("p").filter({ hasText: /^Não é\s/i })
    ).toHaveCount(3);
    await expect(positioningSection.getByText(/agência de marketing/i)).toBeVisible();
    await expect(positioningSection.getByText(/revenda de ferramenta/i)).toBeVisible();
    await expect(positioningSection.getByText(/entusiasta de IA/i)).toBeVisible();
    await expect(positioningSection.getByText(/diagnóstico ao processo/i)).toBeVisible();

    await expect(page.getByText(/usa no próprio comercial/i)).toBeVisible();
    await expect(page.getByText(/20\+ anos em TI/i)).toBeVisible();

    await expect(
      page.getByRole("link", { name: /operação trava/i })
    ).toHaveAttribute("href", "/contato");
    await expect(
      page.getByRole("link", { name: /Diagnosticar minha dor/i })
    ).toHaveAttribute("href", "/contato");
    await expect(page.getByRole("link", { name: /meus gargalos/i })).toHaveAttribute(
      "href",
      "/contato"
    );
    await expect(
      page.getByRole("link", { name: /Começar pelo diagnóstico/i })
    ).toHaveAttribute("href", "/contato");

    await expect(
      page.getByRole("banner").getByRole("link", { name: /Solicitar diagnóstico/i })
    ).toHaveAttribute("href", "/contato");
  });

  test("página individual de serviço diferencia CTA intermediário e final", async ({ page }) => {
    await page.goto("/servicos/automacoes-com-ia");

    await expect(
      page.getByRole("link", { name: /serve para o meu caso/i })
    ).toHaveAttribute("href", "/contato");
    await expect(
      page.getByRole("link", { name: /minha operação/i })
    ).toHaveAttribute("href", "/contato");
  });

  test("página individual de solução usa CTA contextual", async ({ page }) => {
    await page.goto("/solucoes/atendimento-lento");

    await expect(
      page.getByRole("link", { name: /minha operação/i })
    ).toHaveAttribute("href", "/contato");
  });

  test("CTA padrão de post convida a falar sobre o caso", async ({ page }) => {
    await page.goto("/blog/automacao-whatsapp-ia");

    await expect(page.getByRole("link", { name: /meu caso/i })).toHaveAttribute(
      "href",
      "/contato"
    );
  });
});
