import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/googletagmanager.com/**", (route) => route.abort());
});

test("consent defaults before GTM, rejection persists, and footer reopens settings", async ({ page }) => {
  await page.goto("/contato");
  const banner = page.getByRole("region", { name: "Preferências de cookies" });
  await expect(banner).toBeVisible();

  const firstCommand = await page.evaluate(() => Array.from(window.dataLayer?.[0] as unknown as ArrayLike<unknown>));
  expect(firstCommand).toEqual(["consent", "default", {
    analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
  }]);

  await banner.getByRole("button", { name: "Rejeitar opcionais" }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(banner).toBeHidden();
  await page.getByRole("button", { name: "Preferências de cookies" }).click();
  await expect(banner.getByRole("checkbox", { name: "Analytics" })).not.toBeChecked();
  await expect(banner.getByRole("checkbox", { name: "Marketing" })).not.toBeChecked();
});

test("granular preference restores before GTM on reload", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByRole("region", { name: "Preferências de cookies" });
  await banner.getByRole("button", { name: "Configurar" }).click();
  await banner.getByRole("checkbox", { name: "Analytics" }).check();
  await banner.getByRole("button", { name: "Salvar preferências" }).click();
  await page.reload();

  const firstCommand = await page.evaluate(() => Array.from(window.dataLayer?.[0] as unknown as ArrayLike<unknown>));
  expect(firstCommand).toEqual(["consent", "default", {
    analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
  }]);
});
