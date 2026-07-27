const PRODUCTION_SUPABASE_PROJECT_REFS = new Set([
  "aupzgqlkmawmizyutuyt",
]);

const SUPABASE_PROJECT_REF = /^[a-z0-9]{20}$/;

type TestDatabaseSafetyConfig = {
  supabaseUrl?: string;
  allowMutation?: string;
  expectedTestProjectRef?: string;
};

function projectRefFromSupabaseUrl(supabaseUrl?: string): string {
  if (!supabaseUrl) {
    throw new Error(
      "[test-db safety] NEXT_PUBLIC_SUPABASE_URL is required.",
    );
  }

  let url: URL;
  try {
    url = new URL(supabaseUrl);
  } catch {
    throw new Error(
      "[test-db safety] NEXT_PUBLIC_SUPABASE_URL must be a valid URL.",
    );
  }

  if (url.protocol !== "https:") {
    throw new Error(
      "[test-db safety] The test Supabase URL must use HTTPS.",
    );
  }

  const match = /^([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname);
  if (!match) {
    throw new Error(
      "[test-db safety] The database URL must identify a standard, isolated Supabase test project.",
    );
  }

  return match[1];
}

/**
 * Fail closed before integration/E2E code receives a Supabase client capable
 * of mutation. The expected ref is a deliberate declaration that the target
 * is a dedicated test project; the known production project is never allowed.
 */
export function assertSafeTestDatabaseMutation(
  config: TestDatabaseSafetyConfig,
): string {
  const targetProjectRef = projectRefFromSupabaseUrl(config.supabaseUrl);

  if (PRODUCTION_SUPABASE_PROJECT_REFS.has(targetProjectRef)) {
    throw new Error(
      "[test-db safety] Refusing to run database-mutating tests against the production Supabase project.",
    );
  }

  if (config.allowMutation !== "true") {
    throw new Error(
      "[test-db safety] Set ALLOW_E2E_DB_MUTATION=true to explicitly allow database-mutating tests.",
    );
  }

  const expectedTestProjectRef = config.expectedTestProjectRef?.trim();
  if (
    !expectedTestProjectRef ||
    !SUPABASE_PROJECT_REF.test(expectedTestProjectRef) ||
    PRODUCTION_SUPABASE_PROJECT_REFS.has(expectedTestProjectRef)
  ) {
    throw new Error(
      "[test-db safety] TEST_SUPABASE_PROJECT_REF must name a dedicated, non-production Supabase test project.",
    );
  }

  if (targetProjectRef !== expectedTestProjectRef) {
    throw new Error(
      "[test-db safety] NEXT_PUBLIC_SUPABASE_URL does not match TEST_SUPABASE_PROJECT_REF.",
    );
  }

  return targetProjectRef;
}
