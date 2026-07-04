export type Destination = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  keyAttraction: string;
  image: string;
  heroImage: string;
  summary: string;
  highlights: string[];
  bestFor: string;
  status?: "draft" | "published";
  sortOrder?: number;
};

export type TourPackage = {
  id: string;
  slug: string;
  title: string;
  tier: string;
  hotels: string;
  destinations: string;
  duration: string;
  image: string;
  heroImage: string;
  summary: string;
  inclusions: string[];
  itinerary: Array<{
    id?: string;
    day: string;
    title: string;
    description: string;
    sortOrder?: number;
  }>;
  priceAmount?: number | null;
  depositAmount?: number | null;
  currency?: string;
  status?: "draft" | "published";
  sortOrder?: number;
};
