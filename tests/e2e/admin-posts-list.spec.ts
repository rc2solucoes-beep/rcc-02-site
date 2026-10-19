import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// E1 — T-CMS-E01 a E05. ESCRITO, NÃO EXECUTADO.
//
// ATENÇÃO (R1, EX-4): estes testes leem e, nos casos E04/E05, ESCREVEM posts. Nunca devem rodar
// contra produção. O `playwright.config.ts` sobe `npm run dev`, que lê o `.env.local`; portanto só
// executam quando o operador apontar o servidor para o Supabase ISOLADO (EX-4, ainda não
// autorizada) e exportar RC2_E2E_ISOLATED=1 junto com as credenciais de um admin SINTÉTICO.
// Sem isso, tudo é pulado.

const ISOLATED = process.env.RC2_E2E_ISOLATED === "1";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const canRun = ISOLATED && Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

test.skip(!canRun, "Requer o Supabase isolado (EX-4) e RC2_E2E_ISOLATED=1; nunca roda contra produção.");

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel(/E-mail/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/Senha/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Entrar/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

test.describe("Listagem de posts (somente leitura)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("T-CMS-E01: busca, status e período ficam refletidos na URL", async ({ page }) => {
    await page.goto("/admin/posts");
    await page.getByLabel(/Buscar por título/i).fill("automação");
    await page.getByLabel("Status").selectOption("published");
    await page.getByLabel("De").fill("2026-01-01");
    await page.getByLabel("Até").fill("2026-12-31");
    await page.getByRole("button", { name: /Filtrar/i }).click();

    await expect(page).toHaveURL(/q=automa/);
    await expect(page).toHaveURL(/status=published/);
    await expect(page).toHaveURL(/from=2026-01-01/);
    await expect(page).toHaveURL(/to=2026-12-31/);
    await expect(page).not.toHaveURL(/page=/);
  });

  test("T-CMS-E01: valores inválidos na URL não quebram a página", async ({ page }) => {
    const response = await page.goto("/admin/posts?status=archived&from=2026-02-30&page=-3&dir=x&q=a");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible();
  });

  test("T-CMS-E01: período invertido mostra aviso", async ({ page }) => {
    await page.goto("/admin/posts?from=2026-05-10&to=2026-05-01");
    await expect(page.getByRole("status")).toContainText(/período foi ignorado/i);
  });

  test("T-CMS-E02: cabeçalhos de mês e paginação por links", async ({ page }) => {
    await page.goto("/admin/posts");
    await expect(page.getByRole("navigation", { name: "Paginação" }).or(page.getByText(/Nenhum post/))).toBeVisible();
    const next = page.getByRole("link", { name: /Próxima/ });
    if (await next.count()) {
      await next.click();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
    }
  });

  test("T-CMS-E02: página além do total redireciona para a última", async ({ page }) => {
    await page.goto("/admin/posts?page=9999");
    await expect(page).not.toHaveURL(/page=9999/);
  });

  test("T-CMS-E03: vazio filtrado oferece 'Limpar filtros'", async ({ page }) => {
    await page.goto("/admin/posts?q=zzzz-inexistente-e1");
    await expect(page.getByText("Nenhum post encontrado")).toBeVisible();
    await page.getByRole("link", { name: "Limpar filtros" }).first().click();
    await expect(page).toHaveURL(/\/admin\/posts$/);
  });

  test("T-CMS-E03: busca hostil não gera erro 500", async ({ page }) => {
    for (const q of ["%%", "__", "\\\\", '"', "a,b", "(x)", "a*b", "--"]) {
      const response = await page.goto(`/admin/posts?q=${encodeURIComponent(q)}`);
      expect(response?.status(), q).toBeLessThan(500);
      await expect(page.getByRole("alert")).toHaveCount(0);
    }
  });
});

// Casos de ESCRITA: exigem, além do isolado, o consentimento explícito do operador.
const canWrite = canRun && process.env.RC2_E2E_ALLOW_WRITE === "1";

test.describe("Agendamento e regressão (ESCRITA no isolado)", () => {
  test.skip(!canWrite, "Escrita exige RC2_E2E_ALLOW_WRITE=1 além do ambiente isolado.");

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  async function fillBasics(page: Page, slug: string) {
    await page.getByLabel(/Título/i).first().fill(`e0a-e1 ${slug}`);
    await page.getByLabel(/Slug/i).first().fill(`e0a-e1-${slug}`);
  }

  test("T-CMS-E04: criar agendado com data passada é rejeitado", async ({ page }) => {
    await page.goto("/admin/posts/novo");
    await fillBasics(page, `passado-${Date.now()}`);
    await page.getByRole("tab", { name: /Publicação/ }).or(page.getByRole("button", { name: /Publicação/ })).first().click();
    await page.getByLabel("Status").selectOption("scheduled");
    await page.getByLabel(/Agendar Publicação Para/i).fill("2020-01-01T10:00");
    await page.getByRole("button", { name: /Salvar|Criar|Publicar/i }).first().click();
    await expect(page.getByText("A data de agendamento deve estar no futuro.")).toBeVisible();
  });

  test("T-CMS-E05: regressão criar, editar, visualizar e excluir (a completar na homologação)", async () => {
    test.fixme(true, "Fluxo completo a ser fechado na homologação isolada (EX-4).");
  });
});
