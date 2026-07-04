import "server-only";

import { dbError } from "@/lib/data/errors";

import { revalidateTag, unstable_cache } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { TourPackage } from "./types";
import { getActiveLocale, localeFields, tArray, tField } from "./localize";

type PackageRow = Database["public"]["Tables"]["tour_packages"]["Row"];
type ItineraryRow = Database["public"]["Tables"]["itinerary_items"]["Row"];
type PackageWithItinerary = PackageRow & {
  itinerary_items?: ItineraryRow[];
};

function mapPackage(row: PackageWithItinerary, locale: string): TourPackage {
  const f = localeFields(row.translations, locale);

  return {
    id: row.id,
    slug: row.slug,
    title: tField(f, "title", row.title),
    tier: tField(f, "tier", row.tier),
    hotels: tField(f, "hotels", row.hotels),
    destinations: tField(f, "destinations_summary", row.destinations_summary),
    duration: tField(f, "duration", row.duration),
    image: row.image,
    heroImage: row.hero_image || row.image,
    summary: tField(f, "summary", row.summary),
    inclusions: tArray(f, "inclusions", row.inclusions),
    itinerary: (row.itinerary_items ?? []).map((item) => {
      const itf = localeFields(item.translations, locale);
      return {
        id: item.id,
        day: tField(itf, "day_label", item.day_label),
        title: tField(itf, "title", item.title),
        description: tField(itf, "description", item.description),
        sortOrder: item.sort_order,
      };
    }),
    priceAmount: row.price_amount,
    depositAmount: row.deposit_amount,
    currency: row.currency,
    status: row.status,
    sortOrder: row.sort_order,
  };
}

async function queryPublishedPackages(locale: string) {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tour_packages")
    .select("*, itinerary_items(*)")
    .eq("status", "published")
    // Public listings show packages cheapest-first; unpriced ones sort last,
    // with sort_order/title as stable tiebreakers for equal prices.
    .order("price_amount", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .order("sort_order", {
      foreignTable: "itinerary_items",
      ascending: true,
    });

  if (error) {
    dbError(error);
  }

  return data.map((row) => mapPackage(row, locale));
}

// Cached per locale (the locale is part of the cache key); the "packages" tag
// still invalidates every locale on admin edits.
export async function getPublishedPackages() {
  const locale = await getActiveLocale();
  return unstable_cache(
    () => queryPublishedPackages(locale),
    ["published-packages", locale],
    { tags: ["packages"], revalidate: 3600 },
  )();
}

async function queryPackageBySlug(slug: string, locale: string) {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("tour_packages")
    .select("*, itinerary_items(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .order("sort_order", {
      foreignTable: "itinerary_items",
      ascending: true,
    })
    .maybeSingle();

  if (error) {
    dbError(error);
  }

  return data ? mapPackage(data, locale) : null;
}

// Tagged with "packages" so admin edits (which call revalidateTag) also
// revalidate the statically generated /booking/[slug] pages that read this.
export async function getPackageBySlug(slug: string) {
  const locale = await getActiveLocale();
  return unstable_cache(
    () => queryPackageBySlug(slug, locale),
    ["package-by-slug", slug, locale],
    { tags: ["packages"], revalidate: 3600 },
  )();
}

// Slugs are not translated, so this avoids the locale dependency (and getLocale)
// entirely — important because it runs in generateStaticParams.
export async function getPackageSlugs() {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tour_packages")
    .select("slug")
    .eq("status", "published");

  if (error) {
    dbError(error);
  }

  return data.map((row) => row.slug);
}

export async function listAdminPackages() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tour_packages")
    .select("*, itinerary_items(*)")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .order("sort_order", {
      foreignTable: "itinerary_items",
      ascending: true,
    });

  if (error) {
    dbError(error);
  }

  return data.map((row) => mapPackage(row, "en"));
}

export async function getAdminPackage(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tour_packages")
    .select("*, itinerary_items(*)")
    .eq("id", id)
    .order("sort_order", {
      foreignTable: "itinerary_items",
      ascending: true,
    })
    .maybeSingle();

  if (error) {
    dbError(error);
  }

  return data ? mapPackage(data, "en") : null;
}

export function revalidatePackages() {
  revalidateTag("packages", "max");
}
