import { cleanupTestData } from "../support/db";

/** Remove every record created against the test DB during the run. */
export default async function globalTeardown() {
  try {
    await cleanupTestData();
  } catch (err) {
    console.warn("[global-teardown] cleanup failed:", (err as Error).message);
  }
}
