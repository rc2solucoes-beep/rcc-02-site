import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const NON_ADMIN_EMAIL = process.env.NON_ADMIN_EMAIL ?? "";
const NON_ADMIN_PASSWORD = process.env.NON_ADMIN_PASSWORD ?? "";

const hasAdminCredentials = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
const hasNonAdminCredentials = Boolean(NON_ADMIN_EMAIL && NON_ADMIN_PASSWORD);
const permissionErrorPattern = /não tem permissão de admin/i;
const genericPermissionCheckErrorPattern = /erro ao verificar permissões/i;

async function mockAdminInit(page: Page, status: number) {
  await page.route("**/api/admin/init", async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
}

async function mockDashboardRscNavigation(page: Page) {
  await page.route(/\/admin\/dashboard\?_rsc=.*/, async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "text/x-component",
        vary: "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding",
      },
      body: '0:{"f":[],"q":"","i":true,"S":false,"h":null,"b":"development"}\n',
    });
  });
}

test.describe("Admin access", () => {
  test("/admin/dashboard redirects to /admin without a session", async ({ page }) => {
    await page.goto("/admin/dashboard");

    await expect(page).toHaveURL(/\/admin$/);
  });

  test("mount-time 200 on /admin redirects to /admin/dashboard", async ({ page }) => {
    await mockAdminInit(page, 200);
    await mockDashboardRscNavigation(page);

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });

  test("mount-time 403 on /admin stays on /admin and shows permission error", async ({ page }) => {
    await mockAdminInit(page, 403);

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator("form [role='alert']")).toContainText(permissionErrorPattern);
  });

  test("mount-time 201 on /admin stays on /admin and shows generic permission-check error", async ({ page }) => {
    await mockAdminInit(page, 201);

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator("form [role='alert']")).toContainText(genericPermissionCheckErrorPattern);
  });

  test("mount-time 500 on /admin stays on /admin and shows generic permission-check error", async ({ page }) => {
    await mockAdminInit(page, 500);

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator("form [role='alert']")).toContainText(genericPermissionCheckErrorPattern);
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /Acesso administrativo/i })).toBeVisible();
    await expect(page.getByLabel(/E-mail/i)).toBeVisible();
    await expect(page.getByLabel(/Senha/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Entrar/i })).toBeVisible();
  });

  test("invalid login shows an error", async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel(/E-mail/i).fill("invalido@naoexiste.com");
    await page.getByLabel(/Senha/i).fill("senhaErrada123");
    await page.getByRole("button", { name: /Entrar/i }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator("form [role='alert']")).toContainText(/credenciais inválidas/i);
  });
});

(hasAdminCredentials ? test.describe : test.describe.skip)("Admin access with configured admin credentials", () => {
  test("authenticated admin reaches the dashboard", async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel(/E-mail/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/Senha/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Entrar/i }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByText(/Posts publicados/i)).toBeVisible();
  });
});

(hasNonAdminCredentials ? test.describe : test.describe.skip)("Admin access with configured non-admin credentials", () => {
  test("non-admin user stays on /admin and sees a permission error", async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel(/E-mail/i).fill(NON_ADMIN_EMAIL);
    await page.getByLabel(/Senha/i).fill(NON_ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Entrar/i }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator("form [role='alert']")).toContainText(permissionErrorPattern);
  });
});
