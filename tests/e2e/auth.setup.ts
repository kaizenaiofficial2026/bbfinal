import { test as setup } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  TEST_ADMIN,
  createCustomer,
  ensureAdmin,
} from "../support/db";

const AUTH_DIR = "tests/.auth";

setup("create test users + capture admin and customer sessions", async ({
  browser,
}) => {
  setup.slow();
  mkdirSync(AUTH_DIR, { recursive: true });

  await ensureAdmin();
  const customer = await createCustomer({ verified: true });
  const pending = await createCustomer({ verified: false, active: true });

  // ── Admin session ──
  const adminCtx = await browser.newContext();
  const ap = await adminCtx.newPage();
  await ap.goto("/admin/login");
  await ap.locator('input[name="email"]').fill(TEST_ADMIN.email);
  await ap.locator('input[name="password"]').fill(TEST_ADMIN.password);
  await ap.getByRole("button", { name: /sign in/i }).click();
  await ap.waitForURL(
    (u) => u.pathname.startsWith("/admin") && !u.pathname.includes("/login"),
    { timeout: 30_000 },
  );
  await adminCtx.storageState({ path: `${AUTH_DIR}/admin.json` });
  await adminCtx.close();

  // ── Verified-customer session ──
  const custCtx = await browser.newContext();
  const cp = await custCtx.newPage();
  await cp.goto("/login");
  await cp.locator('input[name="email"]').fill(customer.email);
  await cp.locator('input[name="password"]').fill(customer.password);
  await cp.getByRole("button", { name: /sign in/i }).click();
  await cp.waitForURL(/\/account/, { timeout: 30_000 });
  await custCtx.storageState({ path: `${AUTH_DIR}/customer.json` });
  await custCtx.close();

  // Hand the entities to the authed specs.
  writeFileSync(
    `${AUTH_DIR}/state.json`,
    JSON.stringify({ admin: TEST_ADMIN, customer, pending }, null, 2),
  );
});
