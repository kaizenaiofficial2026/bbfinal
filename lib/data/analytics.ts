import "server-only";

import {
  canUseSupabaseService,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";

export type AnalyticsSummary = {
  period: "24h" | "7d" | "30d";
  views: number;
  visitors: number;
};

export type AnalyticsOverview = {
  /** false when the migration isn't applied yet — dashboard shows an empty state. */
  available: boolean;
  summary: AnalyticsSummary[];
  topPages: { path: string; views: number }[];
  daily: { day: string; views: number; visitors: number }[];
};

const EMPTY: AnalyticsOverview = {
  available: false,
  summary: [],
  topPages: [],
  daily: [],
};

type RpcResult = { data: unknown; error: unknown };

function summaryRow(result: RpcResult) {
  const row = (result.data as { views?: number; visitors?: number }[] | null)?.[0];
  return { views: Number(row?.views ?? 0), visitors: Number(row?.visitors ?? 0) };
}

/**
 * Read the dashboard analytics aggregates. FAIL-SOFT: any error (most
 * importantly the page_views table / RPCs not existing because the migration
 * hasn't been applied) returns an unavailable overview so the dashboard renders
 * an empty state instead of crashing.
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  if (!canUseSupabaseService()) {
    return EMPTY;
  }

  try {
    const supabase = createSupabaseServiceClient();
    const [d1, d7, d30, top, daily] = await Promise.all([
      supabase.rpc("analytics_summary", { window_days: 1 }),
      supabase.rpc("analytics_summary", { window_days: 7 }),
      supabase.rpc("analytics_summary", { window_days: 30 }),
      supabase.rpc("analytics_top_pages", { window_days: 7, max_rows: 8 }),
      supabase.rpc("analytics_daily", { window_days: 14 }),
    ]);

    if (d1.error || d7.error || d30.error || top.error || daily.error) {
      return EMPTY;
    }

    return {
      available: true,
      summary: [
        { period: "24h", ...summaryRow(d1) },
        { period: "7d", ...summaryRow(d7) },
        { period: "30d", ...summaryRow(d30) },
      ],
      topPages: ((top.data as { path: string; views: number }[]) ?? []).map(
        (r) => ({ path: r.path, views: Number(r.views) }),
      ),
      daily: ((daily.data as { day: string; views: number; visitors: number }[]) ?? []).map(
        (r) => ({
          day: String(r.day),
          views: Number(r.views),
          visitors: Number(r.visitors),
        }),
      ),
    };
  } catch (error) {
    console.error("[analytics] overview failed", error);
    return EMPTY;
  }
}
