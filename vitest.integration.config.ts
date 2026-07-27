import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { assertSafeTestDatabaseMutation } from "./tests/support/db-safety";

// Load .env into process.env so the app's server libs (lib/env.ts) resolve
// Supabase/SMTP/MPGS credentials — these tests run against the TEST database.
for (const line of readFileSync(".env", "utf8").split("\n")) {
  if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const key = line.slice(0, i).trim();
  const val = line.slice(i + 1).trim();
  if (!(key in process.env)) process.env[key] = val;
}

assertSafeTestDatabaseMutation({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  allowMutation: process.env.ALLOW_E2E_DB_MUTATION,
  expectedTestProjectRef: process.env.TEST_SUPABASE_PROJECT_REF,
});

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.int.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Tests share one test database — run serially to avoid cross-test races.
    fileParallelism: false,
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/server-only-shim.ts", import.meta.url),
      ),
    },
  },
});
