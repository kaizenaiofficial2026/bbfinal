import { test, expect } from "@playwright/test";

// The custom inquiry is a 4-step wizard (Package → Hotel → Air ticket →
// Transport). Every step is mandatory; you advance with Next and only submit on
// the final step. Runs in the default chromium project (public, no auth).
test.describe("custom inquiry wizard", () => {
  test("opens on step 1 with Next and no Submit", async ({ page }) => {
    await page.goto("/custom-quote");

    await expect(page.getByText(/Step 1 of 4/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^next$/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /submit inquiry/i }),
    ).toHaveCount(0);
  });

  test("blocks advancing past an empty step", async ({ page }) => {
    await page.goto("/custom-quote");

    await page.getByRole("button", { name: /^next$/i }).click();

    // Still on step 1, with a required-field error surfaced.
    await expect(page.getByText(/Step 1 of 4/)).toBeVisible();
    await expect(
      page.getByText("This field is required.").first(),
    ).toBeVisible();
  });
});
