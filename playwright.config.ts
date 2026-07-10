import { defineConfig, devices } from "@playwright/test";

const chrome = devices["Desktop Chrome"];

export default defineConfig({
  testDir: "./tests/e2e",
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? "github" : "list",
  // `localhost` (not 127.0.0.1): on 127.0.0.1 the Next dev HMR WebSocket
  // handshake fails, which prevents client islands from hydrating.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  // Clean up any test-DB records created during the run.
  globalTeardown: "./tests/e2e/global-teardown.ts",
  projects: [
    // Creates the admin + verified-customer sessions used by the authed specs.
    { name: "setup", testMatch: /auth\.setup\.ts/ },

    // Unauthenticated suite (everything that doesn't end in .authed.spec.ts).
    {
      name: "chromium",
      use: { ...chrome },
      testIgnore: /\.authed\.spec\.ts$/,
    },

    // Authenticated admin suite.
    {
      name: "authed-admin",
      use: { ...chrome, storageState: "tests/.auth/admin.json" },
      dependencies: ["setup"],
      testMatch: /admin\.authed\.spec\.ts$/,
    },

    // Authenticated customer suite.
    {
      name: "authed-customer",
      use: { ...chrome, storageState: "tests/.auth/customer.json" },
      dependencies: ["setup"],
      testMatch: /(account|booking|payment|cart)\.authed\.spec\.ts$/,
    },
  ],
});
