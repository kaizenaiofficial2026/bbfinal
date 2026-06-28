import { test, expect } from "@playwright/test";

// The custom inquiry is a 3-step wizard (Hotel → Air ticket → Transport). Every
// step is mandatory; you advance with the "Submit" step button and only the
// final step shows "Submit inquiry". Runs in the default chromium project
// (public, no auth).
test.describe("custom inquiry wizard", () => {
  test("opens on step 1 with the Submit step button and no final submit", async ({
    page,
  }) => {
    await page.goto("/custom-quote");

    await expect(page.getByText(/Step 1 of 3/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^submit$/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /submit inquiry/i }),
    ).toHaveCount(0);
  });

  test("blocks advancing past an empty step", async ({ page }) => {
    await page.goto("/custom-quote");

    await page.getByRole("button", { name: /^submit$/i }).click();

    // Still on step 1, with a required-field error surfaced.
    await expect(page.getByText(/Step 1 of 3/)).toBeVisible();
    await expect(
      page.getByText("This field is required.").first(),
    ).toBeVisible();
  });
});
