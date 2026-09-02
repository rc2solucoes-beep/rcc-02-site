import { expect, test } from "@playwright/test";

test.describe("Copy de personalidade visual", () => {
  test("home apresenta posicionamento, prova do fundador e CTAs contextuais", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");

    // Posicionamento vigente (Fase 4): o problema é a operação, não a ferramenta.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /não precisa de mais ferramentas/i
    );
    await expect(
      main.getByRole("heading", { name: /O processo não acompanhou/i })
    ).toBeVisible();

    // As quatro competências, cada uma apontando para a própria âncora.
    for (const anchor of [
      "automacao-de-processos",
      "integracao-de-sistemas",
      "ia-para-operacoes",
      "operacoes-digitais-commerce",
    ]) {
      await expect(main.locator(`a[href="/solucoes#${anchor}"]`)).toHaveCount(1);
    }

    // Prova de autoridade aprovada (docs/12 §5.6) — trajetória do fundador.
    await expect(main.getByText(/Robson Azevedo/i).first()).toBeVisible();
    await expect(main.getByText(/20 anos/i).first()).toBeVisible();
    await expect(main.getByText(/Edenred/i).first()).toBeVisible();

    // Fronteira de território: o Zapbox é produto, alcançado pela ponte.
    // Fase 6E (BRIDGE_FIRST): o destino é `/zapbox`, não o domínio do produto.
    await expect(main.locator('a[href="/zapbox"]').first()).toBeVisible();

    // CTA principal da marca leva ao contato.
    await expect(
      main.getByRole("link", { name: /Falar sobre minha operação/i }).first()
    ).toHaveAttribute("href", "/contato");

    // CTA do header, na copy vigente.
    await expect(
      page.getByRole("banner").getByRole("link", { name: /Falar com a RC2/i })
    ).toHaveAttribute("href", "/contato");

    // CTAs descontinuados não podem reaparecer.
    for (const descontinuado of [
      /Solicitar diagnóstico/i,
      /Diagnóstico gratuito/i,
      /Diagnosticar minha dor/i,
    ]) {
      await expect(page.getByRole("link", { name: descontinuado })).toHaveCount(0);
    }
  });

  test("página individual de serviço diferencia CTA intermediário e final", async ({ page }) => {
    // Fase 6F: `automacoes-com-ia` passou a redirecionar. O CTA testado vive no
    // template de `/servicos/[slug]`, então qualquer serviço que renderiza
    // preserva o contrato original.
    await page.goto("/servicos/e-commerce");

    await expect(
      page.getByRole("link", { name: /serve para o meu caso/i })
    ).toHaveAttribute("href", "/contato");
    await expect(
      page.getByRole("link", { name: /minha operação/i })
    ).toHaveAttribute("href", "/contato");
  });

  test("página individual de solução usa CTA contextual", async ({ page }) => {
    // Fase 6F: `atendimento-lento` passou a redirecionar. O contrato do teste é
    // o CTA de uma página de solução que renderiza — não a URL em si.
    await page.goto("/solucoes/processos-manuais");

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
