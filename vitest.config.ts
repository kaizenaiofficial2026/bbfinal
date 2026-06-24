import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Vitest owns unit + component tests; Playwright owns tests/e2e/*.spec.ts.
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/component/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      // Ratchet set just below current coverage of the unit/component-tested
      // modules so it guards against regressions. Raising this further needs
      // integration tests against a seeded test database (see tests/README.md).
      thresholds: {
        lines: 65,
        functions: 65,
        branches: 65,
        statements: 65,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only-shim.ts", import.meta.url)),
    },
  },
});
