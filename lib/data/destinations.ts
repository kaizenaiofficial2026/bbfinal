import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { Destination } from "./types";
import { getActiveLocale, localeFields, tArray, tField } from "./localize";

type DestinationRow = Database["public"]["Tables"]["destinations"]["Row"];

function mapDestination(row: DestinationRow, locale: string): Destination {
  const f = localeFields(row.translations, locale);

  return {
    id: row.id,
    slug: row.slug,
    title: tField(f, "title", row.title),
    tagline: tField(f, "tagline", row.tagline),
    keyAttraction: tField(f, "key_attraction", row.key_attraction),
    image: row.card_image,
    heroImage: row.hero_image || row.card_image,
    summary: tField(f, "summary", row.summary),
    highlights: tArray(f, "highlights", row.highlights),
    bestFor: tField(f, "best_for", row.best_for),
    status: row.status,
    sortOrder: row.sort_order,
  };
}

async function queryPublishedDestinations(locale: string) {
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

  return data.map((row) => mapDestination(row, locale));
}

export async function getPublishedDestinations() {
  const locale = await getActiveLocale();
  return unstable_cache(
    () => queryPublishedDestinations(locale),
    ["published-destinations", locale],
    { tags: ["destinations"], revalidate: 3600 },
  )();
}

async function queryDestinationBySlug(slug: string, locale: string) {
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

  return data ? mapDestination(data, locale) : null;
}

// Tagged with "destinations" so admin edits (which call revalidateTag) also
// revalidate the statically generated /[slug] pages that read this.
export async function getDestinationBySlug(slug: string) {
  const locale = await getActiveLocale();
  return unstable_cache(
    () => queryDestinationBySlug(slug, locale),
    ["destination-by-slug", slug, locale],
    { tags: ["destinations"], revalidate: 3600 },
  )();
}

// Slugs are not translated → no locale dependency (runs in generateStaticParams).
export async function getDestinationSlugs() {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("destinations")
    .select("slug")
    .eq("status", "published");

  if (error) {
    throw new Error(error.message);
  }

  return data.map((row) => row.slug);
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

  return data.map((row) => mapDestination(row, "en"));
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

  return data ? mapDestination(data, "en") : null;
}

export function revalidateDestinations() {
  revalidateTag("destinations", "max");
}
