import { test, expect } from "@playwright/test";
import {
  PUBLIC_PAGES,
  VIEWPORTS,
  dismissCookies,
  horizontalOverflow,
} from "./helpers";

// Pages that exercise the trickiest layouts (header, hero, grids, split-panel
// auth, footer). Checked at every common width for horizontal overflow.
const PAGES = PUBLIC_PAGES.filter((p) =>
  ["/", "/tours", "/destinations", "/contacts", "/login", "/register"].includes(
    p.path,
  ),
);

test.describe("responsive: no horizontal overflow at any common width", () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.label} (${vp.w}px) — all key pages fit`, async ({ page }) => {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      for (const { path } of PAGES) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await dismissCookies(page);
        const overflow = await horizontalOverflow(page);
        expect(overflow, `${path} overflows by ${overflow}px at ${vp.w}px`).toBeLessThanOrEqual(
          1,
        );
      }
    });
  }

  test("mobile nav drawer opens and closes", async ({ page }) => {
    test.slow(); // home page intro + dev compile can be slow
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "load" });
    // Wait for the intro preloader to lift (gains is-hidden → pointer-events:none).
    await expect(page.locator("#preloader")).toHaveClass(/is-hidden/, {
      timeout: 25_000,
    });
    await dismissCookies(page);
    await page.locator("#menuToggle").click();
    await expect(page.locator("body")).toHaveClass(/menu-open/);
    await page.locator(".mobile-nav-backdrop").click();
    await expect(page.locator("body")).not.toHaveClass(/menu-open/);
  });
});
