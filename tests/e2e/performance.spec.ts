import { test, expect } from "@playwright/test";

// NOTE: this runs against the dev server, so it is a *guardrail* (catches gross
// regressions) rather than a production benchmark. The real perf gate is a
// Lighthouse run against `next build && next start` — see tests/README.md.
const BUDGET = {
  domContentLoaded: 6000, // ms (warm, dev)
  load: 9000, // ms (warm, dev)
};

const PAGES = ["/", "/tours"];

for (const path of PAGES) {
  test(`performance budget: ${path} (warm load)`, async ({ page }) => {
    // First visit compiles the route in dev; measure the warm second load.
    await page.goto(path, { waitUntil: "load" });
    await page.goto(path, { waitUntil: "load" });

    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd,
        load: nav.loadEventEnd,
      };
    });

    expect(
      timing.domContentLoaded,
      `${path} DOMContentLoaded ${Math.round(timing.domContentLoaded)}ms`,
    ).toBeLessThan(BUDGET.domContentLoaded);
    expect(
      timing.load,
      `${path} load ${Math.round(timing.load)}ms`,
    ).toBeLessThan(BUDGET.load);
  });
}

test("no render-blocking layout shift from missing image dimensions on /tours", async ({
  page,
}) => {
  await page.goto("/tours", { waitUntil: "load" });
  // Every <img> should declare intrinsic size (width/height or via CSS aspect)
  // so it doesn't cause cumulative layout shift.
  const imgsWithoutSize = await page.evaluate(
    () =>
      [...document.querySelectorAll("img")].filter((img) => {
        const r = img.getBoundingClientRect();
        return r.width === 0 || r.height === 0;
      }).length,
  );
  expect(imgsWithoutSize).toBe(0);
});
