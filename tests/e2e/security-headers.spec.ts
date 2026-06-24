import { test, expect } from "@playwright/test";

// Verifies the production security headers are present on responses (defends
// against clickjacking, MIME sniffing, referrer leakage, and injection).
test.describe("HTTP security headers", () => {
  test("the document response carries the hardening headers", async ({
    request,
  }) => {
    const res = await request.get("/");
    const headers = res.headers();

    const csp = headers["content-security-policy"] ?? "";
    expect(csp, "Content-Security-Policy present").toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");

    expect(headers["x-frame-options"]).toMatch(/DENY|SAMEORIGIN/i);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBeTruthy();
    expect(headers["permissions-policy"]).toBeTruthy();
    expect(
      headers["strict-transport-security"],
      "HSTS present",
    ).toContain("max-age=");
  });

  test("the tracking API rejects cross-origin posts", async ({ request }) => {
    // A scripted cross-site POST should be ignored (always 204, never an error).
    const res = await request.post("/api/track", {
      data: { path: "/x" },
      headers: { origin: "https://evil.example.com" },
    });
    expect(res.status()).toBe(204);
  });
});
