import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Run serially by default: the dev server compiles on demand, so parallel
  // workers contend and flake. CI can override with --workers.
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
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
