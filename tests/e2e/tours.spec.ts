import { test, expect } from "@playwright/test";
import { dismissCookies } from "./helpers";

test.describe("tours & booking", () => {
  test("the tours page lists all seven packages with prices", async ({ page }) => {
    await page.goto("/tours", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);

    const cards = page.locator(
      ".tour-package-card:not(.tour-package-card-custom)",
    );
    await expect(cards).toHaveCount(7);

    // Every package card shows a formatted "From <CUR> <amount>" price.
    const prices = page.locator(".tour-package-price");
    await expect(prices).toHaveCount(7);
    await expect(prices.first()).toContainText(/From\s+[A-Z]{3}\s/);
  });

  test("a booking detail page shows price, itinerary and the reserve card", async ({
    page,
  }) => {
    await page.goto("/booking/the-heart-of-city", {
      waitUntil: "domcontentloaded",
    });
    await dismissCookies(page);

    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(
      /Heart/i,
    );
    await expect(page.locator("body")).toContainText(/USD\s*200/);
    // Reserve prompt is a self-contained card with grouped actions.
    const reserve = page.locator(".booking-main > .booking-form-section");
    await expect(reserve).toBeVisible();
    await expect(
      reserve.getByRole("link", { name: /register to reserve/i }),
    ).toBeVisible();
    // Itinerary content is rendered.
    await expect(page.locator("body")).toContainText(/Day 1/i);
  });

  test("a new package added from the brief is live", async ({ page }) => {
    await page.goto("/booking/discover-sri-lanka", {
      waitUntil: "domcontentloaded",
    });
    await dismissCookies(page);
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(
      /Discover Sri Lanka/i,
    );
    await expect(page.locator("body")).toContainText(/USD\s*3,?999/);
  });
});
