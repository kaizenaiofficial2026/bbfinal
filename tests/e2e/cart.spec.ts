import { test, expect } from "@playwright/test";

// The cart is a signed-in-only feature. A guest must not be able to open the
// cart page by URL (FEATURE_AUDIT.md #3) — the gate lives on the route, not just
// the floating-cart button.
test.describe("cart: signed-in only", () => {
  test("guest visiting /cart is redirected to login", async ({ page }) => {
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login(\?|$|#)/);
    // and the cart content is not rendered
    await expect(page.locator(".cart-layout")).toHaveCount(0);
  });
});
