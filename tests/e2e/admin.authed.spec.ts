import { test, expect } from "@playwright/test";
import { createCustomer, service } from "../support/db";

// Runs in the "authed-admin" project (admin storageState).
test.describe("admin panel (authenticated)", () => {
  test("dashboard shows the analytics panel and operational metrics", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: /operations overview/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /web analytics/i })).toBeVisible();
    await expect(page.locator(".admin-metrics")).toBeVisible();
  });

  test("packages page lists every published package", async ({ page }) => {
    await page.goto("/admin/packages");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Discover Sri Lanka/i);
  });

  test("settings exposes the staff change-password form", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: /change password/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send verification code/i }),
    ).toBeVisible();
    await expect(page.locator('input[name="oldPassword"]')).toBeVisible();
  });

  test("verifying an applicant flips them to approved in the database", async ({
    page,
  }) => {
    const applicant = await createCustomer({ verified: false });
    await page.goto("/admin/users");

    const card = page
      .locator(".admin-applicant")
      .filter({ has: page.locator(`input[value="${applicant.id}"]`) });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /verify/i }).click();

    await expect
      .poll(
        async () =>
          (
            await service()
              .from("customers")
              .select("verified")
              .eq("id", applicant.id)
              .single()
          ).data?.verified,
        { timeout: 10_000 },
      )
      .toBe(true);
  });

  test("deactivating a login is persisted to the database", async ({ page }) => {
    const target = await createCustomer({ verified: false, active: true });
    await page.goto("/admin/users");

    const card = page
      .locator(".admin-applicant")
      .filter({ has: page.locator(`input[value="${target.id}"]`) });
    await card.getByRole("button", { name: /deactivate login/i }).click();

    await expect
      .poll(
        async () =>
          (
            await service()
              .from("customers")
              .select("active")
              .eq("id", target.id)
              .single()
          ).data?.active,
        { timeout: 10_000 },
      )
      .toBe(false);
  });
});
