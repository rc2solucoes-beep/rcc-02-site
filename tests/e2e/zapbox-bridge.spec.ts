import { test, expect } from "@playwright/test";

/**
 * Fase 6D — ponte RC2 → Zapbox (`docs/19`, `docs/20`).
 *
 * Valida a jornada da ponte sem navegar para o domínio externo: o teste checa
 * atributos, não a rede de terceiros, para não ficar dependente de um site que
 * este repositório não versiona.
 */

const ZAPBOX = "https://www.zapbox.cloud";

test.describe("Ponte Zapbox", () => {
  test("a rota responde e tem a estrutura aprovada", async ({ page }) => {
    const response = await page.goto("/zapbox");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Quando o problema é o WhatsApp/
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveCount(5);
  });

  test("declara que o Zapbox é produto da RC2", async ({ page }) => {
    await page.goto("/zapbox");
    await expect(
      page.getByRole("heading", { name: /Zapbox é um produto da RC2 Soluções/i })
    ).toBeVisible();
  });

  test("o CTA leva ao produto, em nova aba e com rel seguro", async ({ page }) => {
    await page.goto("/zapbox");

    const cta = page.getByRole("main").getByRole("link", { name: /Ir para o Zapbox/i });
    await expect(cta.first()).toBeVisible();

    for (const link of await cta.all()) {
      await expect(link).toHaveAttribute("href", `${ZAPBOX}/`);
      await expect(link).toHaveAttribute("target", "_blank");
      const rel = (await link.getAttribute("rel")) ?? "";
      expect(rel).toContain("noopener");
      expect(rel).toContain("noreferrer");
    }
  });

  test("roteia por intenção para as três rotas do produto", async ({ page }) => {
    await page.goto("/zapbox");
    const main = page.getByRole("main");

    for (const rota of ["/sales-ai", "/crm-vendas", "/automacoes"]) {
      const link = main.locator(`a[href="${ZAPBOX}${rota}"]`);
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("target", "_blank");
    }
  });

  test("nenhum link da ponte usa o apex, que custaria um salto extra", async ({ page }) => {
    await page.goto("/zapbox");
    // Escopo no main: o Footer ainda usa o apex — ZAPBOX_APEX_HOP_DEBT, escopo da 6E.
    await expect(
      page.getByRole("main").locator('a[href^="https://zapbox.cloud"]')
    ).toHaveCount(0);
    await expect(
      page.getByRole("main").locator(`a[href^="${ZAPBOX}"]`)
    ).toHaveCount(5);
  });

  test("oferece os dois retornos para o território da RC2", async ({ page }) => {
    await page.goto("/zapbox");
    const main = page.getByRole("main");

    await expect(main.locator('a[href="/solucoes"]')).toHaveCount(1);
    await expect(
      main.locator('a[href="/solucoes#integracao-de-sistemas"]')
    ).toHaveCount(1);
  });

  test("não duplica a landing do produto", async ({ page }) => {
    await page.goto("/zapbox");
    const main = page.getByRole("main");

    await expect(page.locator("form")).toHaveCount(0);
    await expect(main.getByText(/R\$/)).toHaveCount(0);
    await expect(main.getByText(/chatbot/i)).toHaveCount(0);
    await expect(main.getByText(/Agenda Confirmada/i)).toHaveCount(0);
    await expect(main.locator('a[href*="agenda-confirmada"]')).toHaveCount(0);
    await expect(main.locator("img")).toHaveCount(0);
  });

  test("é indexável e canônica de si mesma", async ({ page }) => {
    await page.goto("/zapbox");

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      "href",
      "https://www.rc2solucoes.com.br/zapbox"
    );

    const robots = page.locator('meta[name="robots"]');
    if ((await robots.count()) > 0) {
      await expect(robots).toHaveAttribute("content", /index/);
      await expect(robots).not.toHaveAttribute("content", /noindex/);
    }
  });
});
