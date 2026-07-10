import { NextResponse, type NextRequest } from "next/server";
import { airports } from "@nwpr/airport-codes";
import { COUNTRIES } from "@/lib/data/countries";
import { clientIp, makeIpRateLimiter } from "@/lib/security/ip-rate-limit";

// Combined "country, city or airport" search for the air-ticket trip builder.
// Searches a 7.7k-airport dataset (by city / name / IATA / country) plus the
// country list, and returns a short ranked list. The dataset stays on the
// server; only the handful of matches are sent to the browser.
const LIMIT = 8;
const MAX_Q = 64;
const MIN_Q = 2;

type Place = {
  value: string;
  label: string;
  sublabel?: string;
  kind: "airport" | "country";
};

type AirportRow = {
  iata?: string | null;
  city?: string | null;
  name?: string | null;
  country?: string | null;
  type?: string | null;
};

// Build a lean searchable index once per server instance.
type IndexedAirport = {
  iata: string;
  city: string;
  name: string;
  country: string;
  cityLower: string;
  hay: string;
};

const AIRPORTS: IndexedAirport[] = (airports as AirportRow[])
  .filter((a) => a.iata && a.city && a.type === "airport")
  .map((a) => {
    const iata = String(a.iata).toUpperCase();
    const city = String(a.city);
    const name = String(a.name ?? "");
    const country = String(a.country ?? "");
    return {
      iata,
      city,
      name,
      country,
      cityLower: city.toLowerCase(),
      hay: `${city} ${name} ${country} ${iata}`.toLowerCase(),
    };
  });

const COUNTRY_INDEX = COUNTRIES.map((c) => ({
  ...c,
  nameLower: c.name.toLowerCase(),
}));

// English country name -> ISO code, so the country descriptor in a result can be
// rendered in the visitor's language via Intl.DisplayNames. Airport/city proper
// names stay as-is (Latin script is the global norm for flight search UIs).
const COUNTRY_CODE_BY_NAME = new Map<string, string>(
  COUNTRIES.map((c) => [c.name.toLowerCase(), c.code]),
);

// Per-locale country localizer. Falls back to the English name when the locale
// or country can't be resolved.
function makeCountryLocalizer(locale: string): (name: string) => string {
  let regionNames: Intl.DisplayNames | null = null;
  try {
    regionNames = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    regionNames = null;
  }
  return (name: string): string => {
    if (!name || !regionNames) return name;
    const code = COUNTRY_CODE_BY_NAME.get(name.toLowerCase());
    if (!code) return name;
    try {
      const loc = regionNames.of(code);
      return loc && loc !== code ? loc : name;
    } catch {
      return name;
    }
  };
}

type SearchOptions = {
  localizeCountry: (name: string) => string;
  allAirportsLabel: string;
};

function airportPlace(a: IndexedAirport, opts: SearchOptions): Place {
  return {
    value: `${a.city} (${a.iata})`,
    label: `${a.city} (${a.iata})`,
    sublabel: [a.name, opts.localizeCountry(a.country)].filter(Boolean).join(" · "),
    kind: "airport",
  };
}

function search(q: string, opts: SearchOptions): Place[] {
  const ql = q.toLowerCase();
  const out: Place[] = [];
  const seen = new Set<string>();
  const push = (p: Place) => {
    if (seen.has(p.value)) return;
    seen.add(p.value);
    out.push(p);
  };

  // 1. Exact IATA code (e.g. "CMB").
  if (ql.length === 3) {
    for (const a of AIRPORTS) if (a.iata === ql.toUpperCase()) push(airportPlace(a, opts));
  }
  // 2. Airports whose city starts with the query.
  for (const a of AIRPORTS) {
    if (out.length >= LIMIT) break;
    if (a.cityLower.startsWith(ql)) push(airportPlace(a, opts));
  }
  // 3. Matching countries (pick from here when no specific airport is wanted).
  for (const c of COUNTRY_INDEX) {
    if (out.length >= LIMIT) break;
    if (c.nameLower.startsWith(ql) || c.code.toLowerCase() === ql) {
      push({
        value: c.name,
        label: opts.localizeCountry(c.name),
        sublabel: opts.allAirportsLabel,
        kind: "country",
      });
    }
  }
  // 4. Fall back to any airport whose name/country/iata contains the query.
  for (const a of AIRPORTS) {
    if (out.length >= LIMIT) break;
    if (a.hay.includes(ql)) push(airportPlace(a, opts));
  }

  return out.slice(0, LIMIT);
}

const rateLimited = makeIpRateLimiter({ windowMs: 10_000, max: 60 });

export async function GET(request: NextRequest) {
  if (rateLimited(clientIp(request), Date.now())) {
    return NextResponse.json({ places: [] }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, MAX_Q).toLowerCase();
  const locale = (searchParams.get("locale") ?? "en").slice(0, 8);
  const allAirportsLabel =
    (searchParams.get("allAirports") ?? "").slice(0, 64) || "All airports";

  if (q.length < MIN_Q) {
    return NextResponse.json({ places: [] }, { status: 200 });
  }

  const opts: SearchOptions = {
    localizeCountry: makeCountryLocalizer(locale),
    allAirportsLabel,
  };

  return NextResponse.json(
    { places: search(q, opts) },
    {
      status: 200,
      headers: {
        // Vary by the localization query params so locales don't share a cache
        // entry (the URL already carries them, so the CDN keys on them).
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
