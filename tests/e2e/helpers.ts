import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";

/** Entities created by auth.setup.ts (admin creds, verified customer, pending). */
export function readTestState(): {
  admin: { email: string; password: string };
  customer: { id: string; email: string; password: string };
  pending: { id: string; email: string; password: string };
} {
  return JSON.parse(readFileSync("tests/.auth/state.json", "utf8"));
}

/** Public, unauthenticated routes (English is unprefixed in this app). */
export const PUBLIC_PAGES = [
  { path: "/", name: "home" },
  { path: "/tours", name: "tours" },
  { path: "/destinations", name: "destinations" },
  { path: "/about", name: "about" },
  { path: "/contacts", name: "contacts" },
  { path: "/custom-quote", name: "custom quote" },
  { path: "/login", name: "login" },
  { path: "/register", name: "register" },
  { path: "/forgot-password", name: "forgot password" },
] as const;

/** Common screen widths to assert layout integrity against. */
export const VIEWPORTS = [
  { w: 320, h: 720, label: "small phone" },
  { w: 375, h: 812, label: "iPhone" },
  { w: 390, h: 844, label: "phone" },
  { w: 768, h: 1024, label: "tablet portrait" },
  { w: 1024, h: 768, label: "tablet landscape" },
  { w: 1280, h: 800, label: "laptop" },
  { w: 1440, h: 900, label: "desktop" },
] as const;

/** Accept the cookie banner if present so it doesn't overlap interactions. */
export async function dismissCookies(page: Page) {
  try {
    const accept = page.getByRole("button", { name: /accept/i }).first();
    if (await accept.isVisible({ timeout: 1000 })) {
      await accept.click();
    }
  } catch {
    // banner not present — fine
  }
}

/**
 * Wait until the page is interactive: the intro preloader (on SiteShell pages)
 * has lifted and the client islands have had a beat to hydrate.
 */
export async function waitForReady(page: Page) {
  // The intro preloader lifts by gaining `.is-hidden` (pointer-events:none),
  // not by detaching. Pages without SiteShell have no preloader at all.
  await page
    .waitForFunction(
      () => {
        const p = document.getElementById("preloader");
        return !p || p.classList.contains("is-hidden");
      },
      { timeout: 20_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(300);
}

/** Horizontal overflow in CSS pixels (>1 means a sideways scrollbar). */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}
