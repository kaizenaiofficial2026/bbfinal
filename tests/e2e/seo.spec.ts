import { test, expect } from "@playwright/test";
import { PUBLIC_PAGES } from "./helpers";

test.describe("SEO & document basics", () => {
  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name} (${path}) has title, description, lang and one h1`, async ({
      page,
    }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });

      await expect(page).toHaveTitle(/.{3,}/);

      const description = await page
        .locator('head meta[name="description"]')
        .getAttribute("content");
      expect(description, `${path} has a meta description`).toBeTruthy();

      const lang = await page.locator("html").getAttribute("lang");
      expect(lang, `${path} sets <html lang>`).toBeTruthy();

      expect(
        await page.locator("h1").count(),
        `${path} has at least one <h1>`,
      ).toBeGreaterThanOrEqual(1);
    });
  }

  test("the home page exposes social/Open Graph metadata", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const ogTitle = await page
      .locator('head meta[property="og:title"]')
      .count();
    expect(ogTitle).toBeGreaterThan(0);
  });
});
