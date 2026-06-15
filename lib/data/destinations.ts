import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { Destination } from "./types";

type DestinationRow = Database["public"]["Tables"]["destinations"]["Row"];

function mapDestination(row: DestinationRow): Destination {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    keyAttraction: row.key_attraction,
    image: row.card_image,
    heroImage: row.hero_image || row.card_image,
    summary: row.summary,
    highlights: row.highlights,
    bestFor: row.best_for,
    status: row.status,
    sortOrder: row.sort_order,
  };
}

async function queryPublishedDestinations() {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapDestination);
}

export const getPublishedDestinations = unstable_cache(
  queryPublishedDestinations,
  ["published-destinations"],
  { tags: ["destinations"], revalidate: 3600 },
);

async function queryDestinationBySlug(slug: string) {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapDestination(data) : null;
}

// Tagged with "destinations" so admin edits (which call revalidateTag) also
// revalidate the statically generated /[slug] pages that read this.
export async function getDestinationBySlug(slug: string) {
  return unstable_cache(
    () => queryDestinationBySlug(slug),
    ["destination-by-slug", slug],
    { tags: ["destinations"], revalidate: 3600 },
  )();
}

export async function getDestinationSlugs() {
  const destinations = await getPublishedDestinations();

  return destinations.map((destination) => destination.slug);
}

export async function listAdminDestinations() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapDestination);
}

export async function getAdminDestination(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapDestination(data) : null;
}

export function revalidateDestinations() {
  revalidateTag("destinations", "max");
}
