import { expect, test } from "@playwright/test";

test.describe("Copy de personalidade visual", () => {
  test("home apresenta posicionamento, prova do fundador e CTAs contextuais", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "O que a RC2 não é" })).toBeVisible();
    await expect(page.getByText("Não é agência de marketing que também \"faz automação\".", { exact: true })).toBeVisible();
    await expect(page.getByText("Não é revenda de ferramenta com treinamento incluso.", { exact: true })).toBeVisible();
    await expect(page.getByText("Não é entusiasta de IA que nunca operou um negócio de verdade.", { exact: true })).toBeVisible();
    await expect(
      page.getByText(
        "A RC2 implementa. Do diagnóstico ao processo rodando — e fica até funcionar.",
        { exact: true }
      )
    ).toBeVisible();

    await expect(
      page.getByText(
        "A RC2 usa no próprio comercial o que implementa nos clientes: um agente de IA filtra, e quem conversa com você é o Robson.",
        { exact: true }
      )
    ).toBeVisible();
    await expect(
      page.getByText("20+ anos em TI, e-commerce e operação digital.", { exact: true })
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Ver onde minha operação trava", exact: true })
    ).toHaveAttribute("href", "/contato");
    await expect(
      page.getByRole("link", { name: "Diagnosticar minha dor", exact: true })
    ).toHaveAttribute("href", "/contato");
    await expect(page.getByRole("link", { name: /Mapear meus gargalos/ })).toHaveAttribute(
      "href",
      "/contato"
    );
    await expect(
      page.getByRole("link", { name: "Começar pelo diagnóstico", exact: true })
    ).toHaveAttribute("href", "/contato");

    await expect(
      page.getByRole("banner").getByRole("link", { name: "Solicitar diagnóstico", exact: true })
    ).toHaveAttribute("href", "/contato");
  });

  test("página individual de serviço diferencia CTA intermediário e final", async ({ page }) => {
    await page.goto("/servicos/automacoes-com-ia");

    await expect(
      page.getByRole("link", { name: "Ver se serve para o meu caso", exact: true })
    ).toHaveAttribute("href", "/contato");
    await expect(
      page.getByRole("link", { name: "Aplicar isso na minha operação", exact: true })
    ).toHaveAttribute("href", "/contato");
  });

  test("página individual de solução usa CTA contextual", async ({ page }) => {
    await page.goto("/solucoes/atendimento-lento");

    await expect(
      page.getByRole("link", { name: "Aplicar isso na minha operação", exact: true })
    ).toHaveAttribute("href", "/contato");
  });

  test("CTA padrão de post convida a falar sobre o caso", async ({ page }) => {
    await page.goto("/blog/automacao-whatsapp-ia");

    await expect(page.getByRole("link", { name: /Falar sobre o meu caso/ })).toHaveAttribute(
      "href",
      "/contato"
    );
  });
});
