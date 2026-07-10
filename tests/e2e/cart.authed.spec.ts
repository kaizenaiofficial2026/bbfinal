import { test, expect } from "@playwright/test";

// The other half of the /cart gate: a signed-in customer CAN open the cart page
// (they are not bounced to login). Runs under the authed-customer project.
test.describe("cart: authenticated customer", () => {
  test("signed-in customer can open /cart", async ({ page }) => {
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/cart(\?|$|#)/); // not redirected to /login
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
