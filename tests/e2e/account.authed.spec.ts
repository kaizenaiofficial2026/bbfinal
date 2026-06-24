import { test, expect } from "@playwright/test";
import { dismissCookies, waitForReady } from "./helpers";

// Runs in the "authed-customer" project (verified-customer storageState).
test.describe("customer account (authenticated)", () => {
  test("shows the signed-in account with the change-password card", async ({
    page,
  }) => {
    await page.goto("/account");
    await waitForReady(page);
    await dismissCookies(page);

    // Greeting heading (the seeded customer is "Qa Customer").
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(
      /Qa/i,
    );

    // Bookings section + the self-service change-password card.
    await expect(page.locator("body")).toContainText(/your bookings/i);
    await expect(page.locator("body")).toContainText(/change password/i);
    await expect(
      page.getByRole("button", { name: /send verification code/i }),
    ).toBeVisible();
    await expect(page.locator('input[name="oldPassword"]')).toBeAttached();
    await expect(page.locator('input[name="code"]')).toBeAttached();
  });

  test("a signed-in customer is not bounced to the login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/account/);
  });
});
