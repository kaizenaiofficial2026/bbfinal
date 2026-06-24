import { test, expect } from "@playwright/test";
import { PUBLIC_PAGES } from "./helpers";

test.describe("smoke: every public page loads cleanly", () => {
  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name} (${path}) responds, titles, and has no uncaught errors`, async ({
      page,
    }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (err) => pageErrors.push(err.message));

      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response, "navigation produced a response").toBeTruthy();
      expect(response!.status(), "HTTP status < 400").toBeLessThan(400);

      await expect(page).toHaveTitle(/.+/);
      await expect(page.locator("body")).toBeVisible();

      expect(pageErrors, "no uncaught JS exceptions on load").toEqual([]);
    });
  }

  test("a 404 page is served for unknown routes", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist-xyz");
    expect(res?.status()).toBe(404);
  });
});
