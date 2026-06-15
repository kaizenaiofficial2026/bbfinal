import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { destinations, tourPackages } from "./seed-data";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

async function seedDestinations() {
  for (const [index, destination] of destinations.entries()) {
    const { error } = await supabase.from("destinations").upsert(
      {
        slug: destination.slug,
        title: destination.title,
        tagline: destination.tagline,
        key_attraction: destination.keyAttraction,
        summary: destination.summary,
        best_for: "",
        highlights: destination.highlights,
        hero_image: destination.heroImage,
        card_image: destination.image,
        status: "published",
        sort_order: index,
      },
      { onConflict: "slug" },
    );

    if (error) {
      throw new Error(`Destination ${destination.slug}: ${error.message}`);
    }
  }
}

async function seedPackages() {
  for (const [index, tourPackage] of tourPackages.entries()) {
    const { data, error } = await supabase
      .from("tour_packages")
      .upsert(
        {
          slug: tourPackage.slug,
          title: tourPackage.title,
          tier: tourPackage.tier,
          hotels: tourPackage.hotels,
          destinations_summary: tourPackage.destinations,
          duration: tourPackage.duration,
          image: tourPackage.image,
          summary: tourPackage.summary,
          inclusions: tourPackage.inclusions,
          currency: "LKR",
          status: "published",
          sort_order: index,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error) {
      throw new Error(`Package ${tourPackage.slug}: ${error.message}`);
    }

    await supabase.from("itinerary_items").delete().eq("tour_package_id", data.id);

    const { error: itineraryError } = await supabase.from("itinerary_items").insert(
      tourPackage.itinerary.map((item, itemIndex) => ({
        tour_package_id: data.id,
        day_label: item.day,
        title: item.title,
        description: item.items.join("\n"),
        sort_order: itemIndex,
      })),
    );

    if (itineraryError) {
      throw new Error(`Itinerary ${tourPackage.slug}: ${itineraryError.message}`);
    }
  }
}

async function main() {
  await seedDestinations();
  await seedPackages();
  console.info(`Seeded ${destinations.length} destinations and ${tourPackages.length} packages.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
