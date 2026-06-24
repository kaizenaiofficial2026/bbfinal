import { test, expect } from "@playwright/test";

test.describe("admin: auth gating + pre-auth pages", () => {
  test("the dashboard redirects unauthenticated visitors to the login", async ({
    page,
  }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  for (const path of [
    "/admin/packages",
    "/admin/users",
    "/admin/settings",
    "/admin/bookings",
  ]) {
    test(`${path} is gated behind the login`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  }

  test("the admin login page renders the staff form", async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /admin login/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });

  test("the admin forgot-password page is reachable pre-auth", async ({ page }) => {
    const res = await page.goto("/admin/forgot-password", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/admin\/forgot-password/);
    await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
  });

  test("invalid staff credentials are rejected", async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[name="email"]').fill("not-staff@example.com");
    await page.locator('input[name="password"]').fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Stays in the admin login area (redirected back with an error, never /admin).
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
