import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookies } from "./helpers";

// WCAG 2.1 A/AA scan on the most important pages. The suite hard-fails on any
// "critical" violation and reports "serious" ones for follow-up.
const PAGES = ["/", "/tours", "/destinations", "/login", "/register", "/contacts"];

for (const path of PAGES) {
  test(`accessibility: ${path} has no critical WCAG violations`, async ({
    page,
  }, testInfo) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await dismissCookies(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    const serious = results.violations.filter((v) => v.impact === "serious");

    if (serious.length) {
      testInfo.annotations.push({
        type: "a11y-serious",
        description: serious.map((v) => `${v.id} (${v.nodes.length})`).join(", "),
      });
    }

    expect(
      critical,
      `critical a11y violations on ${path}: ${critical.map((v) => v.id).join(", ")}`,
    ).toEqual([]);
  });
}
