import { expect, test } from "@playwright/test";

test.describe("home motion and responsive polish", () => {
  test("renders the animated hero and scroll reveal hooks without horizontal overflow", async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 375, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "networkidle" });

      await expect(page.locator(".rc2-hero-stage")).toBeVisible();
      await expect(page.locator(".scroll-reveal").first()).toBeVisible();

      const metrics = await page.evaluate(() => ({
        width: window.innerWidth,
        appScrollWidth: Math.max(
          ...Array.from(document.querySelectorAll("header, main, footer")).map(
            (element) => element.scrollWidth
          )
        ),
        offenders: Array.from(document.querySelectorAll("body *"))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName,
              className: element.getAttribute("class"),
              text: element.textContent?.trim().slice(0, 80),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            };
          })
          .filter((item) => item.left < 0 || item.right > window.innerWidth)
          .slice(0, 8),
        revealCount: document.querySelectorAll(".scroll-reveal").length,
      }));

      expect(metrics.revealCount).toBeGreaterThan(10);
      expect(metrics.appScrollWidth, JSON.stringify(metrics.offenders, null, 2)).toBeLessThanOrEqual(
        metrics.width
      );
    }
  });

  test("keeps reveal content visible when reduced motion is preferred", async ({ browser }) => {
    const page = await browser.newPage({
      reducedMotion: "reduce",
      viewport: { width: 375, height: 900 },
    });

    await page.goto("/", { waitUntil: "networkidle" });

    const metrics = await page.evaluate(() => ({
      hiddenRevealCount: document.querySelectorAll('.scroll-reveal[data-reveal-state="hidden"]').length,
      heroAnimation: getComputedStyle(document.querySelector(".rc2-hero-enter")!).animationName,
    }));

    expect(metrics.hiddenRevealCount).toBe(0);
    expect(metrics.heroAnimation).toBe("none");

    await page.close();
  });
});
