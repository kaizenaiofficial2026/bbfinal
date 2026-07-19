import { test, expect } from "@playwright/test";
import { createCustomer, service, testEmail } from "../support/db";

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

  test("settings exposes the staff change-password wizard", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: /change password/i })).toBeVisible();
    // 2-step wizard: step 1 verifies current + new password, then "Continue".
    await expect(page.getByText(/verify password/i)).toBeVisible();
    await expect(page.locator('input[name="oldPassword"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /^continue$/i })).toBeVisible();
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

/**
 * Creating second-level admins from the panel. The acting session is the super
 * admin (reservations@…, listed in SUPER_ADMIN_EMAILS). Every account created
 * here uses the qa-…@beyondborders.test pattern, so global teardown removes it.
 */
test.describe("creating second-level admins", () => {
  /** Look up a created admin's auth user by email. */
  async function findAuthUser(email: string) {
    const { data } = await service().auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    return data?.users.find((u) => u.email === email) ?? null;
  }

  async function fillCreateForm(
    page: import("@playwright/test").Page,
    fields: { fullName: string; email: string; password: string; confirm?: string },
  ) {
    const form = page.getByRole("form", { name: /create second-level admin/i });
    await form.locator('input[name="fullName"]').fill(fields.fullName);
    await form.locator('input[name="email"]').fill(fields.email);
    await form.locator('input[name="password"]').fill(fields.password);
    await form
      .locator('input[name="confirm"]')
      .fill(fields.confirm ?? fields.password);
    await form.getByRole("button", { name: /create admin/i }).click();
  }

  test("the super admin is offered the create-admin form", async ({ page }) => {
    await page.goto("/admin/admins");

    await expect(
      page.getByRole("heading", { name: /create a second-level admin/i }),
    ).toBeVisible();

    const form = page.getByRole("form", { name: /create second-level admin/i });
    await expect(form.locator('input[name="fullName"]')).toBeVisible();
    await expect(form.locator('input[name="email"]')).toBeVisible();
    await expect(form.locator('input[name="password"]')).toBeVisible();
    await expect(form.locator('input[name="confirm"]')).toBeVisible();

    // The tier is never a choice: the panel can only mint second-level admins.
    await expect(form.locator('[name="tier"]')).toHaveCount(0);
  });

  test("creating an admin writes a second-level account to the database", async ({
    page,
  }) => {
    const email = testEmail("admin");
    await page.goto("/admin/admins");
    await fillCreateForm(page, {
      fullName: "QA Second Admin",
      email,
      password: "QaSecond!2026",
    });

    await expect(page.locator(".toast-message")).toContainText(
      /second-level admin/i,
    );

    // The auth user exists and is pinned to second-level via app_metadata, which
    // only the service role can write.
    await expect
      .poll(async () => (await findAuthUser(email))?.app_metadata?.admin_tier, {
        timeout: 15_000,
      })
      .toBe("second");

    const user = await findAuthUser(email);
    expect(user).not.toBeNull();

    // The profile row is what actually grants admin access and what RLS trusts.
    const { data: profile } = await service()
      .from("profiles")
      .select("role, active, full_name")
      .eq("id", user!.id)
      .single();
    expect(profile?.role).toBe("admin");
    expect(profile?.active).toBe(true);
    expect(profile?.full_name).toBe("QA Second Admin");

    // And they show up in the roster labelled as second-level, not super.
    await page.reload();
    const row = page.locator(".admin-roster-row").filter({ hasText: email });
    await expect(row).toContainText(/second-level/i);
    await expect(row).not.toContainText(/super admin/i);
    await expect(row).not.toHaveClass(/is-super/);
  });

  test("a duplicate email is refused instead of creating a second account", async ({
    page,
  }) => {
    const email = testEmail("admin-dup");
    await page.goto("/admin/admins");
    await fillCreateForm(page, {
      fullName: "QA Dup One",
      email,
      password: "QaSecond!2026",
    });
    await expect(page.locator(".toast-message")).toContainText(
      /second-level admin/i,
    );

    await page.reload();
    await fillCreateForm(page, {
      fullName: "QA Dup Two",
      email,
      password: "QaSecond!2026",
    });

    // Scoped to the toast: Next's route announcer is also role="alert".
    await expect(page.locator(".toast-error .toast-message")).toContainText(
      /already exists/i,
    );

    // Still exactly one account, still under the original name.
    const { data } = await service().auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const matches = (data?.users ?? []).filter((u) => u.email === email);
    expect(matches).toHaveLength(1);
    const { data: profile } = await service()
      .from("profiles")
      .select("full_name")
      .eq("id", matches[0]!.id)
      .single();
    expect(profile?.full_name).toBe("QA Dup One");
  });

  test("a mismatched confirmation creates nothing", async ({ page }) => {
    const email = testEmail("admin-mismatch");
    await page.goto("/admin/admins");
    await fillCreateForm(page, {
      fullName: "QA Mismatch",
      email,
      password: "QaSecond!2026",
      confirm: "QaDifferent!2026",
    });

    await expect(page.locator(".toast-error .toast-message")).toContainText(
      /do not match/i,
    );
    expect(await findAuthUser(email)).toBeNull();
  });
});
