import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { TourPackage } from "./types";

type PackageRow = Database["public"]["Tables"]["tour_packages"]["Row"];
type ItineraryRow = Database["public"]["Tables"]["itinerary_items"]["Row"];
type PackageWithItinerary = PackageRow & {
  itinerary_items?: ItineraryRow[];
};

function mapPackage(row: PackageWithItinerary): TourPackage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tier: row.tier,
    hotels: row.hotels,
    destinations: row.destinations_summary,
    duration: row.duration,
    image: row.image,
    summary: row.summary,
    inclusions: row.inclusions,
    itinerary: (row.itinerary_items ?? []).map((item) => ({
      id: item.id,
      day: item.day_label,
      title: item.title,
      description: item.description,
      sortOrder: item.sort_order,
    })),
    priceAmount: row.price_amount,
    depositAmount: row.deposit_amount,
    currency: row.currency,
    status: row.status,
    sortOrder: row.sort_order,
  };
}

async function queryPublishedPackages() {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tour_packages")
    .select("*, itinerary_items(*)")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .order("sort_order", {
      foreignTable: "itinerary_items",
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapPackage);
}

export const getPublishedPackages = unstable_cache(
  queryPublishedPackages,
  ["published-packages"],
  { tags: ["packages"], revalidate: 3600 },
);

async function queryPackageBySlug(slug: string) {
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
    throw new Error(error.message);
  }

  return data ? mapPackage(data) : null;
}

// Tagged with "packages" so admin edits (which call revalidateTag) also
// revalidate the statically generated /booking/[slug] pages that read this.
export async function getPackageBySlug(slug: string) {
  return unstable_cache(
    () => queryPackageBySlug(slug),
    ["package-by-slug", slug],
    { tags: ["packages"], revalidate: 3600 },
  )();
}

export async function getPackageSlugs() {
  const packages = await getPublishedPackages();

  return packages.map((tourPackage) => tourPackage.slug);
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
    throw new Error(error.message);
  }

  return data.map(mapPackage);
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
    throw new Error(error.message);
  }

  return data ? mapPackage(data) : null;
}

export function revalidatePackages() {
  revalidateTag("packages", "max");
}
