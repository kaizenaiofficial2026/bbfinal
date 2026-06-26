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

  test("a branded 404 is served for an unknown in-locale route", async ({
    page,
  }) => {
    // Single-segment unknown path → matches [locale]/[slug] → notFound() →
    // the localized app/[locale]/not-found boundary.
    const res = await page.goto("/this-route-does-not-exist-xyz");
    expect(res?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /isn't on our map/i }),
    ).toBeVisible();
  });

  test("a branded 404 is served for a deep unknown route", async ({ page }) => {
    // Deep / unmatched path escapes the [locale] segment → the root
    // app/not-found boundary, instead of Next.js's bare default 404.
    const res = await page.goto("/no/such/page/here");
    expect(res?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /isn't on our map/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible();
  });
});
