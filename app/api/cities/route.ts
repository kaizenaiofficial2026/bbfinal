import { NextResponse, type NextRequest } from "next/server";
import { City } from "country-state-city";
import { isCountryCode } from "@/lib/data/countries";

// City typeahead for the registration form. Given a 2-letter country code and a
// query, returns up to LIMIT matching city names (prefix matches first). The
// full city dataset lives in country-state-city and stays on the server — only
// the short, filtered result is sent to the browser.
const LIMIT = 10;
const MAX_Q = 64;

// country-state-city returns a FRESH array (and re-extracts names) on every
// call, which for large countries (US ≈ 20k cities) is ~15ms of CPU. Memoise
// the extracted name list per country so each country is built at most once per
// server instance — this removes the per-request rebuild that an attacker could
// otherwise amplify by varying the (cache-busting) query string.
const namesByCountry = new Map<string, string[]>();
function cityNamesFor(country: string): string[] {
  let names = namesByCountry.get(country);
  if (!names) {
    const seen = new Set<string>();
    names = [];
    for (const c of City.getCitiesOfCountry(country) ?? []) {
      const key = c.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(c.name);
    }
    namesByCountry.set(country, names);
  }
  return names;
}

// Lightweight per-instance, per-IP fixed-window limiter. The typeahead fires a
// request per keystroke (debounced), so the window is generous — it only trips
// on abusive bursts, never on normal typing. Defence-in-depth on top of the
// memoisation above and Vercel's platform protections.
const WINDOW_MS = 10_000;
const MAX_REQUESTS = 50;
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string, now: number): boolean {
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    // Opportunistic cleanup so the map can't grow unbounded.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  if (rateLimited(clientIp(request), Date.now())) {
    return NextResponse.json({ cities: [] }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") ?? "").trim().toUpperCase();
  const q = (searchParams.get("q") ?? "").trim().slice(0, MAX_Q).toLowerCase();

  if (!isCountryCode(country)) {
    return NextResponse.json({ cities: [] }, { status: 200 });
  }

  const names = cityNamesFor(country);

  let cities: string[];
  if (q) {
    const prefix: string[] = [];
    const contains: string[] = [];
    for (const name of names) {
      const lower = name.toLowerCase();
      if (lower.startsWith(q)) prefix.push(name);
      else if (lower.includes(q)) contains.push(name);
      if (prefix.length >= LIMIT) break;
    }
    cities = [...prefix, ...contains].slice(0, LIMIT);
  } else {
    // No query yet — return the first cities (alphabetical) so the menu shows
    // the country's cities the moment the field opens, per the UX requirement.
    cities = names.slice(0, LIMIT);
  }

  return NextResponse.json(
    { cities },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
