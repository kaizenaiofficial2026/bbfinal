import { test, expect } from "@playwright/test";
import { dismissCookies } from "./helpers";

test.describe("auth pages: redesigned split-panel + flows", () => {
  test("login renders the split-panel card with the expected controls", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);

    await expect(page.locator(".auth-card .auth-aside")).toBeVisible(); // gradient panel
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create an account/i })).toBeVisible();
  });

  test("password show/hide toggle reveals and re-hides the value", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await dismissCookies(page);
    const pw = page.locator('input[name="password"]');
    await pw.fill("secret123");
    await expect(pw).toHaveAttribute("type", "password");

    // The eye toggle is a client island; a click can land before hydration in
    // dev, so retry until it responds (toPass stops on the first success).
    await expect(async () => {
      await page.getByRole("button", { name: /show password/i }).click();
      await expect(pw).toHaveAttribute("type", "text", { timeout: 800 });
    }).toPass({ timeout: 15_000 });

    await page.getByRole("button", { name: /hide password/i }).click();
    await expect(pw).toHaveAttribute("type", "password");
  });

  test("registration collects the full customer profile", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    for (const name of [
      "firstName",
      "lastName",
      "email",
      "phone",
      "dateOfBirth",
      "country",
      "city",
      "passportNumber",
      "passportExpiry",
      "password",
    ]) {
      await expect(
        page.locator(`[name="${name}"]`),
        `register field ${name} present`,
      ).toBeAttached();
    }
  });

  test("empty registration is blocked by client-side validation", async ({
    page,
  }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await page.getByRole("button", { name: /create account/i }).click();
    // Still on /register — the required fields prevented submission.
    await expect(page).toHaveURL(/\/register/);
    const firstInvalid = await page
      .locator('input[name="firstName"]')
      .evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(firstInvalid).toBe(false);
  });

  test("forgot-password page asks for an email", async ({ page }) => {
    await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset code/i })).toBeVisible();
  });
});
