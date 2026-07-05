import { getAnalyticsOverview } from "@/lib/data/analytics";
import { locales } from "@/i18n/routing";

// Friendly names for the top-level public routes, so the dashboard reads
// "Home / Tours / Contact" instead of "/ /tours /contacts".
const STATIC_PAGE_LABELS: Record<string, string> = {
  tours: "Tours",
  destinations: "Destinations",
  contacts: "Contact",
  "custom-quote": "Custom quote",
  about: "About us",
  terms: "Terms & conditions",
  login: "Login",
  register: "Create account",
  account: "My account",
  "forgot-password": "Forgot password",
  "reset-password": "Reset password",
};

/** Turn a URL slug ("sigiriya-rock") into a readable title ("Sigiriya Rock"). */
function prettifySlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Human-readable page name for a tracked path (locale prefix stripped). */
function pageLabel(rawPath: string): string {
  const path = rawPath.split(/[?#]/)[0];
  const segments = path.split("/").filter(Boolean);
  if (
    segments.length > 0 &&
    (locales as readonly string[]).includes(segments[0])
  ) {
    segments.shift();
  }
  if (segments.length === 0) return "Home";

  const [first, second] = segments;
  if (first in STATIC_PAGE_LABELS) return STATIC_PAGE_LABELS[first];

  switch (first) {
    case "booking":
      return second ? `Booking · ${prettifySlug(second)}` : "Booking";
    case "pay":
      return segments[2] === "result" ? "Payment result" : "Payment";
    default:
      // A top-level slug is a destination detail page.
      return prettifySlug(first);
  }
}

/** UTC YYYY-MM-DD for the last n days (oldest first), to match analytics_daily. */
function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const CHART_W = 100;
const CHART_H = 40;
const TOP_PAD = 3;

/** Build the SVG area + line paths for the daily series (viewBox 0 0 100 40). */
function buildPaths(values: number[], max: number) {
  const n = values.length;
  const usableH = CHART_H - TOP_PAD;
  const point = (i: number) => {
    const x = n === 1 ? 0 : (i / (n - 1)) * CHART_W;
    const y = CHART_H - (max > 0 ? (values[i] / max) * usableH : 0);
    return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const;
  };
  const pts = values.map((_, i) => point(i));
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const area = `M0 ${CHART_H} ${pts
    .map(([x, y]) => `L${x} ${y}`)
    .join(" ")} L${CHART_W} ${CHART_H} Z`;
  return { line, area, pts };
}

/** Opening-dashboard web-analytics panel, fed by first-party page_views data. */
export async function AnalyticsPanel() {
  const overview = await getAnalyticsOverview();

  const days = lastNDays(14);
  const byDay = new Map(overview.daily.map((d) => [d.day, d.views]));
  const series = days.map((day) => ({ day, views: byDay.get(day) ?? 0 }));
  const values = series.map((s) => s.views);
  const maxViews = Math.max(0, ...values);
  const hasData = maxViews > 0;
  const { line, area, pts } = buildPaths(values, maxViews);
  const topMax = Math.max(1, ...overview.topPages.map((p) => p.views));

  const summary =
    overview.summary.length > 0
      ? overview.summary
      : [
          { period: "24h" as const, views: 0, visitors: 0 },
          { period: "7d" as const, views: 0, visitors: 0 },
          { period: "30d" as const, views: 0, visitors: 0 },
        ];

  const emptyText = !overview.available
    ? "Tracking starts once the page_views migration is applied."
    : "No visits yet — data appears here as people browse the site.";

  return (
    <section className="admin-card admin-stack admin-analytics">
      <div className="admin-card-head">
        <h2>Web analytics</h2>
        <span className="admin-analytics-tag">
          {overview.available ? "First-party" : "Not collecting yet"} · last 14
          days
        </span>
      </div>

      <div className="admin-analytics-stats">
        {summary.map((s) => (
          <div className="admin-analytics-stat" key={s.period}>
            <span className="admin-analytics-stat-label">Last {s.period}</span>
            <span className="admin-analytics-stat-value">
              <strong>{s.views.toLocaleString()}</strong>
              <em>views</em>
            </span>
            <span className="admin-analytics-stat-sub">
              {s.visitors.toLocaleString()} visitors
            </span>
          </div>
        ))}
      </div>

      <div className="admin-chart-wrap" data-empty={hasData ? undefined : "true"}>
        <div className="admin-chart-grid" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <svg
          className="admin-chart-svg"
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Daily page views over the last 14 days"
        >
          <defs>
            <linearGradient id="bbChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cdb27a" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#cdb27a" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {hasData ? (
            <>
              <path className="admin-chart-area" d={area} />
              <path
                className="admin-chart-line"
                d={line}
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : (
            <line
              x1="0"
              y1={CHART_H - 0.5}
              x2={CHART_W}
              y2={CHART_H - 0.5}
              className="admin-chart-baseline"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {hasData ? (
          <div className="admin-chart-dots" aria-hidden="true">
            {pts.map(([x, y], i) => (
              <span
                key={series[i].day}
                style={{ left: `${x}%`, top: `${(y / CHART_H) * 100}%` }}
                title={`${series[i].day}: ${series[i].views.toLocaleString()} views`}
              />
            ))}
          </div>
        ) : (
          <span className="admin-chart-empty">{emptyText}</span>
        )}
      </div>
      <div className="admin-chart-axis">
        <span>{series[0]?.day.slice(5)}</span>
        <span>{series[series.length - 1]?.day.slice(5)}</span>
      </div>

      <div className="admin-stack" style={{ gap: "10px" }}>
        <h3 className="admin-analytics-subhead">Top pages · 7 days</h3>
        {overview.topPages.length === 0 ? (
          <p className="admin-analytics-none">
            {overview.available
              ? "No pageviews in the last 7 days yet."
              : emptyText}
          </p>
        ) : (
          <ul className="admin-toppages">
            {overview.topPages.map((p) => (
              <li key={p.path}>
                <span className="admin-toppages-path" title={p.path}>
                  {pageLabel(p.path)}
                </span>
                <span className="admin-toppages-track">
                  <span
                    className="admin-toppages-fill"
                    style={{ width: `${Math.round((p.views / topMax) * 100)}%` }}
                  />
                </span>
                <span className="admin-toppages-count">
                  {p.views.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
