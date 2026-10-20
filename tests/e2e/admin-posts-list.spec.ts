import type { Page } from "@playwright/test";
import { expect, test as base } from "@playwright/test";
import { installSupabaseGuard } from "../e2e-support/supabaseGuard";

// E1 — T-CMS-E01 a E05. ESCRITO, NÃO EXECUTADO.
//
// Estes testes leem e ESCREVEM posts. Só rodam por `playwright.isolated.config.ts`
// (`npm run test:e2e:isolated`), que valida o alvo antes de subir o servidor e semeia, no isolado,
// dados sintéticos com o prefixo `e0a-e2e-<tag>` (removidos no teardown, mesmo se um teste falhar).
// O `playwright.config.ts` padrão ignora este arquivo. Sem as variáveis `RC2_E2E_*` definidas por
// aquele lançador, tudo é pulado: um `ADMIN_EMAIL` solto no shell nunca é usado aqui.

const ISOLATED = process.env.RC2_E2E_ISOLATED === "1";
const PREFIX = process.env.RC2_E2E_PREFIX ?? "";
const ADMIN_EMAIL = process.env.RC2_E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.RC2_E2E_ADMIN_PASSWORD ?? "";
const DRAFT_ID = process.env.RC2_E2E_DRAFT_ID ?? "";
const ALLOWED_HOST = process.env.RC2_E2E_SUPABASE_HOST ?? "";
const canRun = Boolean(ISOLATED && PREFIX && ADMIN_EMAIL && ADMIN_PASSWORD && DRAFT_ID && ALLOWED_HOST);

// Segunda camada anti-produção: o navegador não pode falar com nenhum Supabase além do isolado.
const test = base.extend<{ supabaseGuard: string[] }>({
  supabaseGuard: [
    async ({ context }, use) => {
      const blocked: string[] = [];
      await installSupabaseGuard(context, ALLOWED_HOST, blocked);
      await use(blocked);
      expect(blocked, "o navegador tentou acessar um Supabase que não é o isolado").toEqual([]);
    },
    { auto: true },
  ],
});

test.skip(!canRun, "Requer `npm run test:e2e:isolated` (RC2_E2E_ISOLATED=1); nunca roda contra produção.");

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel(/E-mail/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/Senha/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Entrar/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe("Listagem de posts (leitura sobre dados sintéticos semeados)", () => {
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

  test("T-CMS-E02: cabeçalhos de mês e paginação por links (46 posts semeados, 3 páginas)", async ({ page }) => {
    await page.goto(`/admin/posts?q=${encodeURIComponent(PREFIX)}`);
    await expect(page.getByRole("navigation", { name: "Paginação" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
    await page.getByRole("link", { name: /Próxima/ }).first().click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  });

  test("T-CMS-E02: página além do total redireciona para a última (página 3)", async ({ page }) => {
    await page.goto(`/admin/posts?q=${encodeURIComponent(PREFIX)}&page=9999`);
    await expect(page).toHaveURL(/page=3/);
    await expect(page).not.toHaveURL(/page=9999/);
    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(PREFIX).replace(/[-]/g, "\\-")}`));
  });

  test("T-CMS-E03: vazio filtrado oferece 'Limpar filtros'", async ({ page }) => {
    await page.goto("/admin/posts?q=zzzz-inexistente-e1");
    await expect(page.getByText("Nenhum post encontrado")).toBeVisible();
    await page.getByRole("link", { name: "Limpar filtros" }).first().click();
    await expect(page).toHaveURL(/\/admin\/posts$/);
  });

  test("T-CMS-E03: busca hostil não gera erro 500 nem estado de erro", async ({ page }) => {
    for (const q of ["%%", "__", "\\\\", '"', "a,b", "(x)", "a*b", "--"]) {
      const response = await page.goto(`/admin/posts?q=${encodeURIComponent(q)}`);
      expect(response?.status(), q).toBeLessThan(500);
      await expect(page.getByRole("alert")).toHaveCount(0);
    }
  });
  // Estado de erro (E03) e lista vazia sem filtros: cobertos pelo teste unitário da página
  // (tests/unit/admin/postsPagePagination.test.tsx); um erro de banco não é provocável aqui sem
  // alterar o ambiente isolado, e a lista nunca está vazia depois do seed.
});

// ESCRITA: tudo opera sobre o prefixo sintético; o teardown do lançador remove o que sobrar.
test.describe("Agendamento e regressão (ESCRITA no isolado)", () => {
  test.describe.configure({ mode: "serial" });

  async function openPublicationTab(page: Page) {
    await page.getByRole("button", { name: /^Publicação$/ }).click();
  }

  test("T-CMS-E04: agendamento no passado é rejeitado e no futuro é aceito (rascunho semeado)", async ({ page }) => {
    await page.goto(`/admin/posts/${DRAFT_ID}`);
    await openPublicationTab(page);
    await page.getByLabel("Status").selectOption("scheduled");

    await page.getByLabel(/Agendar Publicação Para/i).fill("2020-01-01T10:00");
    await page.getByRole("button", { name: /Atualizar Post/ }).click();
    await expect(page.getByText("A data de agendamento deve estar no futuro.").first()).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/admin/posts/${DRAFT_ID}$`));

    await openPublicationTab(page);
    await page.getByLabel(/Agendar Publicação Para/i).fill("2030-01-01T10:00");
    await page.getByRole("button", { name: /Atualizar Post/ }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);

    await page.goto(`/admin/posts?q=${encodeURIComponent(`${PREFIX}-rascunho`)}&status=scheduled`);
    await expect(page.getByText(`${PREFIX} rascunho`).first()).toBeVisible();
  });

  test("T-CMS-E05: criar, editar, visualizar e excluir um post", async ({ page }) => {
    const slug = `${PREFIX}-crud-${Date.now()}`;
    const title = `${PREFIX} crud`;

    // criar (rascunho)
    await page.goto("/admin/posts/novo");
    await page.locator("#title").fill(title);
    await page.locator("#slug").fill(slug);
    await page.locator("#summary").fill("Resumo sintético do fluxo de regressão.");
    await page.getByRole("button", { name: /Criar Post/ }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);

    // localizar na lista pela busca e editar
    await page.goto(`/admin/posts?q=${encodeURIComponent(slug)}`);
    await expect(page.getByText(title).first()).toBeVisible();
    await page.getByRole("link", { name: /^Editar/ }).first().click();
    await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}$/);
    await page.locator("#title").fill(`${title} editado`);
    await page.getByRole("button", { name: /Atualizar Post/ }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);

    // visualizar (preview administrativo)
    await page.goto(`/admin/posts?q=${encodeURIComponent(slug)}`);
    const preview = page.getByRole("link", { name: /^Visualizar/ }).first();
    await expect(preview).toHaveAttribute("href", `/blog/${slug}/preview`);
    const response = await page.goto(`/blog/${slug}/preview`);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByText(`${title} editado`).first()).toBeVisible();

    // excluir
    await page.goto(`/admin/posts?q=${encodeURIComponent(slug)}`);
    await page.getByRole("link", { name: /^Editar/ }).first().click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Excluir" }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);
    await page.goto(`/admin/posts?q=${encodeURIComponent(slug)}`);
    await expect(page.getByText("Nenhum post encontrado")).toBeVisible();
  });
});
