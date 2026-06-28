import { test, expect } from "@playwright/test";

// The custom inquiry collects any 1–3 of Hotel / Air ticket / Transport. Each
// service is optional (at least one required); "Next" moves between sections and
// "Submit inquiry" can finish from any step. Contact details are always
// required. Runs in the default chromium project (public, no auth).
test.describe("custom inquiry wizard", () => {
  test("opens on step 1 of 3 with Next and Submit available", async ({
    page,
  }) => {
    await page.goto("/custom-quote");

    await expect(page.getByText(/Step 1 of 3/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^next$/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /submit inquiry/i }),
    ).toBeVisible();
  });

  test("Next skips an empty optional section", async ({ page }) => {
    await page.goto("/custom-quote");

    // Hotel left empty → Next advances to the next section without an error.
    await page.getByRole("button", { name: /^next$/i }).click();
    await expect(page.getByText(/Step 2 of 3/)).toBeVisible();
  });

  test("submitting with no service is blocked", async ({ page }) => {
    await page.goto("/custom-quote");

    await page.getByRole("button", { name: /submit inquiry/i }).click();
    await expect(page.getByText(/at least one service/i)).toBeVisible();
  });
});
