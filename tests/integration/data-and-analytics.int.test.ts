import { afterAll, describe, expect, it } from "vitest";
import { getAnalyticsOverview } from "@/lib/data/analytics";
import { service } from "../support/db";

const TEST_PATH = "/qa-analytics-probe";

afterAll(async () => {
  await service().from("page_views").delete().eq("path", TEST_PATH);
});

describe("tour package data integrity (test DB)", () => {
  it("has 7 published packages, all priced in USD with the new ones present", async () => {
    const { data, error } = await service()
      .from("tour_packages")
      .select("slug, price_amount, currency, status")
      .eq("status", "published");
    expect(error).toBeNull();
    expect(data!.length).toBe(7);

    for (const p of data!) {
      expect(p.price_amount, `${p.slug} has a price`).not.toBeNull();
      expect(p.currency).toBe("USD");
    }
    const slugs = data!.map((p) => p.slug);
    for (const s of [
      "sunbath-on-sands-deluxe",
      "hill-country-tour",
      "discover-sri-lanka",
    ]) {
      expect(slugs, `package ${s} exists`).toContain(s);
    }
  });

  it("every published package has itinerary days", async () => {
    const { data } = await service()
      .from("tour_packages")
      .select("id, slug, itinerary_items(id)")
      .eq("status", "published");
    for (const p of data!) {
      expect(
        (p.itinerary_items as unknown[]).length,
        `${p.slug} has itinerary days`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("first-party analytics (test DB)", () => {
  it("reports an available overview with non-negative figures", async () => {
    const overview = await getAnalyticsOverview();
    expect(overview.available).toBe(true);
    expect(overview.summary.length).toBe(3);
    for (const s of overview.summary) {
      expect(s.views).toBeGreaterThanOrEqual(0);
      expect(s.visitors).toBeGreaterThanOrEqual(0);
    }
  });

  it("a recorded page view is counted by the aggregate RPC", async () => {
    const before = await service().rpc("analytics_summary", { window_days: 1 });
    const beforeViews = Number(before.data?.[0]?.views ?? 0);

    await service()
      .from("page_views")
      .insert({ path: TEST_PATH, visitor_hash: "qa-hash", country: "LK" });

    const after = await service().rpc("analytics_summary", { window_days: 1 });
    const afterViews = Number(after.data?.[0]?.views ?? 0);
    expect(afterViews).toBe(beforeViews + 1);
  });
});
