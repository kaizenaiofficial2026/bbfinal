import { test, expect } from "@playwright/test";
import { dismissCookies, readTestState, waitForReady } from "./helpers";
import { service } from "../support/db";

const PACKAGE = "the-heart-of-city";

// Runs in the "authed-customer" project (verified-customer storageState).
test.describe("booking → payment (authenticated, verified customer)", () => {
  test("a verified customer sees the booking form (not the reserve prompt)", async ({
    page,
  }) => {
    await page.goto(`/booking/${PACKAGE}`);
    await waitForReady(page);
    await dismissCookies(page);
    await expect(page.locator('form.booking-form input[name="dates"]')).toBeVisible();
    await expect(page.locator('input[name="travellers"]')).toBeVisible();
  });

  test("submitting a booking creates the records and reaches checkout", async ({
    page,
  }) => {
    test.slow();
    const { customer } = readTestState();

    await page.goto(`/booking/${PACKAGE}`);
    await waitForReady(page);
    await dismissCookies(page);

    await page.locator('input[name="dates"]').fill("August 2026");
    await page.locator('input[name="travellers"]').fill("2");
    await page.locator('textarea[name="notes"]').fill("QA automated booking");

    // Honeypot time-trap requires >= 2.5s on the form before submitting.
    await page.waitForTimeout(3000);
    await page.getByRole("button", { name: /request|reserve|pay|book/i }).first().click();

    // Redirected into the hosted-checkout pay page.
    await page.waitForURL(/\/pay\//, { timeout: 30_000 });

    // A booking + payment row now exist for this customer.
    const { data: bookings } = await service()
      .from("bookings")
      .select("id, status, quoted_amount, currency, user_id")
      .eq("user_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1);
    expect(bookings?.length).toBe(1);
    expect(bookings![0].status).toBe("awaiting_payment");

    const { data: payments } = await service()
      .from("payments")
      .select("status")
      .eq("booking_id", bookings![0].id);
    expect(payments?.[0]?.status).toBe("initiated");
  });

  test("the pay page renders the payment request and checkout action", async ({
    page,
  }) => {
    // Reuse the booking created above (most recent for this customer).
    const { customer } = readTestState();
    const { data: booking } = await service()
      .from("bookings")
      .select("id")
      .eq("user_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    const { data: payment } = await service()
      .from("payments")
      .select("pay_token, amount, currency")
      .eq("booking_id", booking!.id)
      .single();

    await page.goto(`/pay/${payment!.pay_token}`);
    await waitForReady(page);
    await dismissCookies(page);

    await expect(page.locator("body")).toContainText(/Qa Customer/i); // traveller
    await expect(page.locator("body")).toContainText(/USD\s*200/); // amount
    // The hosted-checkout / pay action is present (MPGS session initiation).
    await expect(
      page.getByRole("button", { name: /pay|checkout|card/i }).first(),
    ).toBeVisible();
  });
});
