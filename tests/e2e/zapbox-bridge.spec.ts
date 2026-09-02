import { test, expect, type Locator, type Page } from "@playwright/test";

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

/**
 * Fase 6E — handoff interno das superfícies RC2 para a ponte (`docs/21`).
 *
 * O contrato não é só de `href`: um link interno não pode carregar semântica de
 * saída. Por isso cada superfície é verificada em quatro eixos — destino,
 * `target`, `rel` e ícone — e não apenas no destino.
 */

/**
 * Clica e espera a navegação terminar.
 *
 * A espera começa ANTES do clique: a navegação é client-side e pode ficar
 * pendente enquanto o dev server compila a rota de destino.
 */
async function clickAndNavigate(page: Page, target: Locator, pathname: RegExp) {
  await Promise.all([
    page.waitForURL((url) => pathname.test(url.pathname)),
    target.click(),
  ]);
}

/**
 * Nenhum link interno pode anunciar nova aba nem exibir ícone de saída.
 *
 * O ícone proibido é o de saída (`ArrowUpRight`), não qualquer ícone: a seta
 * interna (`ArrowRight`) é justamente o sinal correto para navegação no
 * mesmo domínio, e permanece.
 */
async function expectInternalLink(link: Locator) {
  await expect(link).toHaveAttribute("href", "/zapbox");
  await expect(link).not.toHaveAttribute("target", "_blank");
  await expect(link).not.toHaveAttribute("rel", /noopener/);
  await expect(link.locator("svg.lucide-arrow-up-right")).toHaveCount(0);
}

test.describe("Handoff interno — Home", () => {
  test("as duas superfícies da Home apontam para a ponte", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");

    const bridge = main.locator('a[href="/zapbox"]');
    await expect(bridge).toHaveCount(2);

    for (const link of await bridge.all()) {
      await expectInternalLink(link);
    }
  });

  test("nenhum link da Home sai direto para o domínio do produto", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.locator('a[href^="https://zapbox.cloud"]')
    ).toHaveCount(0);
    await expect(
      page.locator('a[href^="https://www.zapbox.cloud"]')
    ).toHaveCount(0);
  });

  test("navega de verdade da Home para a ponte, na mesma aba", async ({
    page,
  }) => {
    await page.goto("/");
    const link = page.getByRole("main").locator('a[href="/zapbox"]').first();

    await clickAndNavigate(page, link, /^\/zapbox$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Quando o problema é o WhatsApp/
    );
    expect(page.context().pages()).toHaveLength(1);
  });
});

test.describe("Handoff interno — Footer", () => {
  test("o link de produto do Footer aponta para a ponte", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("contentinfo").locator('a[href="/zapbox"]');

    await expect(link).toHaveCount(1);
    await expectInternalLink(link);
  });

  test("o WhatsApp do Footer continua externo", async ({ page }) => {
    await page.goto("/");
    const whatsapp = page
      .getByRole("contentinfo")
      .locator('a[href^="https://wa.me/"]');

    await expect(whatsapp).toHaveAttribute("target", "_blank");
  });
});

test.describe("Handoff interno — /solucoes", () => {
  test("as duas superfícies da página apontam para a ponte", async ({
    page,
  }) => {
    await page.goto("/solucoes");
    const bridge = page.getByRole("main").locator('a[href="/zapbox"]');

    await expect(bridge).toHaveCount(2);
    for (const link of await bridge.all()) {
      await expect(link).toHaveAttribute("href", "/zapbox");
      await expect(link).not.toHaveAttribute("target", "_blank");
      await expect(link).not.toHaveAttribute("rel", /noopener/);
    }
  });

  test("nenhum link de /solucoes sai direto para o domínio do produto", async ({
    page,
  }) => {
    await page.goto("/solucoes");
    await expect(
      page.locator('a[href^="https://zapbox.cloud"]')
    ).toHaveCount(0);
    await expect(
      page.locator('a[href^="https://www.zapbox.cloud"]')
    ).toHaveCount(0);
  });

  test("navega da fronteira de IA para a ponte", async ({ page }) => {
    await page.goto("/solucoes");
    const link = page.getByRole("main").locator('a[href="/zapbox"]').first();

    await clickAndNavigate(page, link, /^\/zapbox$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Quando o problema é o WhatsApp/
    );
  });
});
