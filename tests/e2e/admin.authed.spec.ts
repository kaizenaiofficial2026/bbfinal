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

  test("a missing admin record shows the in-shell admin 404", async ({
    page,
  }) => {
    // Opening a detail page for a record that doesn't exist makes the page call
    // notFound() → the app/admin/not-found boundary, rendered inside the admin
    // shell (sidebar present) rather than the public global 404. The admin shell
    // streams, so the HTTP status stays 200 — immaterial for an auth-gated,
    // noindexed area; the branded in-shell page is what matters here.
    await page.goto("/admin/packages/00000000-0000-0000-0000-000000000000");
    await expect(
      page.getByRole("heading", { name: /couldn't find that page/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /back to dashboard/i }),
    ).toBeVisible();
    await expect(page.locator(".admin-shell")).toBeVisible();
  });

  test("an admin can delete a destination", async ({ page }) => {
    const slug = `qa-del-dest-${Date.now()}`;
    const { data, error } = await service()
      .from("destinations")
      .insert({
        slug,
        title: "QA Delete Destination",
        tagline: "Throwaway",
        summary: "Created by the delete e2e.",
        status: "draft",
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    const id = data!.id as string;

    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(`/admin/destinations/${id}`);
    await page.getByRole("button", { name: /delete destination/i }).click();
    await page.waitForURL(/\/admin\/destinations$/);

    const { data: after } = await service()
      .from("destinations")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    expect(after).toBeNull();
  });

  test("an admin can delete a package that has no bookings", async ({ page }) => {
    const slug = `qa-del-pkg-${Date.now()}`;
    const { data, error } = await service()
      .from("tour_packages")
      .insert({
        slug,
        title: "QA Delete Package",
        tier: "Signature",
        hotels: "QA Hotel",
        destinations_summary: "QA",
        duration: "3 days",
        summary: "Created by the delete e2e.",
        status: "draft",
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    const id = data!.id as string;

    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(`/admin/packages/${id}`);
    await page.getByRole("button", { name: /delete package/i }).click();
    await page.waitForURL(/\/admin\/packages$/);

    const { data: after } = await service()
      .from("tour_packages")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    expect(after).toBeNull();
  });

  test("deleting a package with bookings is blocked", async ({ page }) => {
    const slug = `qa-guard-pkg-${Date.now()}`;
    const { data: pkg } = await service()
      .from("tour_packages")
      .insert({
        slug,
        title: "QA Guarded Package",
        tier: "Signature",
        hotels: "QA Hotel",
        destinations_summary: "QA",
        duration: "3 days",
        summary: "Has a booking; must not be deletable.",
        status: "draft",
      })
      .select("id")
      .single();
    const packageId = pkg!.id as string;

    await service()
      .from("bookings")
      .insert({
        reference: `BB-QA${Date.now().toString().slice(-6)}`,
        tour_package_id: packageId,
        traveller_name: "QA Traveller",
        email: "qa-booking@beyondborders.test",
        travel_dates: "August 2026",
        travellers: 2,
        status: "awaiting_payment",
      });

    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(`/admin/packages/${packageId}`);
    await page.getByRole("button", { name: /delete package/i }).click();

    // Bounced back to the edit page with a "has bookings" alert; still exists.
    await expect(page.locator(".admin-alert")).toContainText(/booking/i);
    const { data: still } = await service()
      .from("tour_packages")
      .select("id")
      .eq("id", packageId)
      .maybeSingle();
    expect(still).not.toBeNull();

    // Cleanup (booking first — FK — then the package).
    await service().from("bookings").delete().eq("tour_package_id", packageId);
    await service().from("tour_packages").delete().eq("id", packageId);
  });
});
