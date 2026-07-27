import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assertSafeTestDatabaseMutation } from "../support/db-safety";

const PRODUCTION_URL = "https://aupzgqlkmawmizyutuyt.supabase.co";
const TEST_PROJECT_REF = "abcdefghijklmnopqrst";
const TEST_URL = `https://${TEST_PROJECT_REF}.supabase.co`;

describe("test database mutation safety", () => {
  const originalEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    ALLOW_E2E_DB_MUTATION: process.env.ALLOW_E2E_DB_MUTATION,
    TEST_SUPABASE_PROJECT_REF: process.env.TEST_SUPABASE_PROJECT_REF,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.resetModules();
  });

  it("always rejects the production Supabase project", () => {
    expect(() =>
      assertSafeTestDatabaseMutation({
        supabaseUrl: PRODUCTION_URL,
        allowMutation: "true",
        expectedTestProjectRef: "zyxwvutsrqponmlkjihg",
      }),
    ).toThrow(/production Supabase project/);
  });

  it("requires an exact explicit mutation opt-in", () => {
    for (const allowMutation of [undefined, "", "false", "TRUE", " true "]) {
      expect(() =>
        assertSafeTestDatabaseMutation({
          supabaseUrl: TEST_URL,
          allowMutation,
          expectedTestProjectRef: TEST_PROJECT_REF,
        }),
      ).toThrow(/ALLOW_E2E_DB_MUTATION=true/);
    }
  });

  it("requires a declared isolated test-project ref", () => {
    expect(() =>
      assertSafeTestDatabaseMutation({
        supabaseUrl: TEST_URL,
        allowMutation: "true",
      }),
    ).toThrow(/TEST_SUPABASE_PROJECT_REF/);
  });

  it("rejects a URL that does not match the declared test project", () => {
    expect(() =>
      assertSafeTestDatabaseMutation({
        supabaseUrl: TEST_URL,
        allowMutation: "true",
        expectedTestProjectRef: "zyxwvutsrqponmlkjihg",
      }),
    ).toThrow(/does not match/);
  });

  it("rejects targets whose Supabase project identity cannot be verified", () => {
    expect(() =>
      assertSafeTestDatabaseMutation({
        supabaseUrl: "https://db-test.example.com",
        allowMutation: "true",
        expectedTestProjectRef: TEST_PROJECT_REF,
      }),
    ).toThrow(/standard, isolated Supabase test project/);

    expect(() =>
      assertSafeTestDatabaseMutation({
        supabaseUrl: `http://${TEST_PROJECT_REF}.supabase.co`,
        allowMutation: "true",
        expectedTestProjectRef: TEST_PROJECT_REF,
      }),
    ).toThrow(/HTTPS/);
  });

  it("allows an explicitly opted-in matching test project", () => {
    expect(
      assertSafeTestDatabaseMutation({
        supabaseUrl: `${TEST_URL}/`,
        allowMutation: "true",
        expectedTestProjectRef: TEST_PROJECT_REF,
      }),
    ).toBe(TEST_PROJECT_REF);
  });

  it("guards both exported Supabase client factories before client creation", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = PRODUCTION_URL;
    process.env.ALLOW_E2E_DB_MUTATION = "true";
    process.env.TEST_SUPABASE_PROJECT_REF = TEST_PROJECT_REF;
    vi.resetModules();

    const { anon, service } = await import("../support/db");

    expect(() => service()).toThrow(/production Supabase project/);
    expect(() => anon()).toThrow(/production Supabase project/);
  });

  it("wires the guard into both mutating test-runner configurations", () => {
    for (const configPath of [
      "vitest.integration.config.ts",
      "playwright.config.ts",
    ]) {
      const source = readFileSync(configPath, "utf8");
      expect(source).toContain("assertSafeTestDatabaseMutation({");
    }
  });
});
