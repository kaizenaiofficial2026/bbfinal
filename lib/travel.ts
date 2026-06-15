export type Destination = {
  slug: string;
  title: string;
  tagline: string;
  keyAttraction: string;
  image: string;
  heroImage: string;
  summary: string;
  highlights: string[];
  bestFor: string;
};

export type TourPackage = {
  slug: string;
  title: string;
  tier: string;
  hotels: string;
  destinations: string;
  duration: string;
  image: string;
  summary: string;
  inclusions: string[];
  itinerary: Array<{
    day: string;
    title: string;
    items: string[];
  }>;
};

export const destinations: Destination[] = [
  {
    slug: "colombo",
    title: "Colombo",
    tagline: "Capital of Sri Lanka",
    keyAttraction: "Galle Face Green, Pettah bazaar, Gangaramaya Temple",
    image: "/assets/images/destinations/colombo.jpg",
    heroImage: "/assets/images/heroes/colombo-sri-lanka.jpg",
    summary:
      "Colombo is the island's lively first chapter, blending oceanfront walks, markets, temples, colonial buildings and skyline dining into a polished city stay.",
    highlights: [
      "Walk Galle Face Green at sunset",
      "Explore Pettah's layered market streets",
      "Visit Gangaramaya Temple and city landmarks",
      "Ease into the journey with curated dining and transfers",
    ],
    bestFor: "City arrivals, short stays and first-time Sri Lanka travellers",
  },
  {
    slug: "kandy",
    title: "Kandy",
    tagline: "Home of the Temple of the Tooth Relic",
    keyAttraction: "Sri Dalada Maligawa, Peradeniya Gardens - UNESCO WHS",
    image: "/assets/images/destinations/kandy.jpg",
    heroImage: "/assets/images/destinations/kandy.jpg",
    summary:
      "Kandy brings sacred history, lake views and hill-country calm together around the Temple of the Tooth Relic and the gardens of Peradeniya.",
    highlights: [
      "Visit Sri Dalada Maligawa",
      "Stroll Peradeniya Royal Botanical Gardens",
      "Spend an evening by Kandy Lake",
      "Connect onward to tea country or Sigiriya",
    ],
    bestFor: "Sacred culture, gardens and gentle hill-country pacing",
  },
  {
    slug: "sigiriya",
    title: "Sigiriya",
    tagline: "Eighth wonder of the world",
    keyAttraction: "Rock fortress, frescoes, water gardens - UNESCO WHS",
    image: "/assets/images/destinations/sigiriya.jpg",
    heroImage: "/assets/images/destinations/sigiriya.jpg",
    summary:
      "Sigiriya rises from the forest with frescoes, water gardens and a stone climb that rewards travellers with one of Sri Lanka's most memorable views.",
    highlights: [
      "Climb the ancient rock fortress",
      "See frescoes and landscaped water gardens",
      "Pair the visit with nearby cultural triangle sites",
      "Plan the climb around cooler morning light",
    ],
    bestFor: "UNESCO history, iconic views and cultural triangle routes",
  },
  {
    slug: "galle",
    title: "Galle",
    tagline: "Largest remaining fortress in Asia",
    keyAttraction: "Dutch Fort, lighthouse, boutique lanes - UNESCO WHS",
    image: "/assets/images/destinations/galle.jpg",
    heroImage: "/assets/images/destinations/galle-fort.jpg",
    summary:
      "Galle Fort is a coastal world of ramparts, courtyards, lighthouse views and boutique lanes, best explored slowly between sea breezes and sunset walks.",
    highlights: [
      "Walk the Dutch Fort ramparts",
      "Visit the lighthouse and boutique lanes",
      "Build in time for cafes and coastal dining",
      "Combine with Bentota or the south coast",
    ],
    bestFor: "Coastal heritage, design stays and slow afternoons",
  },
  {
    slug: "nuwara-eliya",
    title: "Nuwara Eliya",
    tagline: "Little England of Sri Lanka",
    keyAttraction: "Tea estates, Horton Plains, scenic train ride",
    image: "/assets/images/destinations/nuwara-eliya.jpg",
    heroImage: "/assets/images/destinations/nuwara-eliya-2.jpg",
    summary:
      "Nuwara Eliya is tea country at its softest: cool air, rolling estates, colonial echoes and routes that connect beautifully by road or rail.",
    highlights: [
      "Visit working tea estates",
      "Ride or trace the scenic highland railway",
      "Plan a day toward Horton Plains",
      "Slow the pace with cool mornings and garden walks",
    ],
    bestFor: "Tea landscapes, cool weather and scenic train moments",
  },
  {
    slug: "yala",
    title: "Yala",
    tagline: "Most visited national park",
    keyAttraction: "Leopards, elephants, coastal lagoons",
    image: "/assets/images/destinations/yala.jpg",
    heroImage: "/assets/images/destinations/yala-2.jpg",
    summary:
      "Yala is Sri Lanka's best-known safari landscape, where dry forest, lagoons and wild coastlines create a dramatic setting for leopards and elephants.",
    highlights: [
      "Set out on dawn or afternoon game drives",
      "Look for leopard, elephant and birdlife",
      "Stay close to the park for an easier start",
      "Balance safari time with south-coast rest",
    ],
    bestFor: "Safari, wildlife photography and nature-led journeys",
  },
  {
    slug: "trincomalee",
    title: "Trincomalee",
    tagline: "One of the world's finest natural harbours",
    keyAttraction: "Koneswaram Temple, Nilaveli Beach, whale watching",
    image: "/assets/images/destinations/trincomalee.jpg",
    heroImage: "/assets/images/destinations/trincomalee.jpg",
    summary:
      "Trincomalee opens the east coast with a deep natural harbour, temple cliffs, Nilaveli Beach and seasonal whale-watching waters.",
    highlights: [
      "Visit Koneswaram Temple above the sea",
      "Relax along Nilaveli Beach",
      "Consider whale watching in season",
      "Add calm beach days after the cultural triangle",
    ],
    bestFor: "East-coast beaches, temple views and seasonal marine life",
  },
  {
    slug: "jaffna",
    title: "Jaffna",
    tagline: "Cultural heartland of north Sri Lanka",
    keyAttraction: "Jaffna Fort, Hindu temples, lagoons",
    image: "/assets/images/destinations/jaffna.jpg",
    heroImage: "/assets/images/destinations/jaffna.jpg",
    summary:
      "Jaffna has a distinct northern rhythm shaped by forts, Hindu temples, lagoons, cuisine and a cultural identity that rewards curious travellers.",
    highlights: [
      "Explore Jaffna Fort and lagoon views",
      "Visit Hindu temples and local markets",
      "Taste northern Sri Lankan cooking",
      "Build in enough time for the long northern journey",
    ],
    bestFor: "Culture seekers, food-led trips and returning visitors",
  },
  {
    slug: "anuradhapura",
    title: "Anuradhapura",
    tagline: "Ancient capital",
    keyAttraction: "Sacred Bo tree, dagobas - UNESCO WHS",
    image: "/assets/images/destinations/anuradhapura.jpg",
    heroImage: "/assets/images/destinations/anuradhapura.jpg",
    summary:
      "Anuradhapura is one of Sri Lanka's great ancient capitals, where dagobas, monastic ruins and the sacred Bo tree anchor a deeply spiritual landscape.",
    highlights: [
      "Visit the sacred Sri Maha Bodhi",
      "Explore ancient dagobas and ruins",
      "Travel with a guide for context and pacing",
      "Pair with Sigiriya and Polonnaruwa",
    ],
    bestFor: "Ancient history, sacred sites and cultural triangle depth",
  },
  {
    slug: "polonnaruwa",
    title: "Polonnaruwa",
    tagline: "Medieval capital of stone and story",
    keyAttraction: "Royal ruins, Gal Vihara, ancient reservoirs",
    image: "/assets/images/tours/ancient-capital.jpg",
    heroImage: "/assets/images/tours/ancient-capital.jpg",
    summary:
      "Polonnaruwa extends the ancient-capital story with royal ruins, carved stone Buddhas and wide reservoirs that make the cultural triangle feel complete.",
    highlights: [
      "Explore the royal palace and sacred precincts",
      "See the carved Buddhas of Gal Vihara",
      "Travel by car or bicycle between key sites",
      "Combine with Sigiriya for a strong cultural day",
    ],
    bestFor: "UNESCO history, archaeology and cultural triangle routing",
  },
  {
    slug: "arugam-bay",
    title: "Arugam Bay",
    tagline: "World-famous surf beach",
    keyAttraction: "Point A surf break, lagoon safaris",
    image: "/assets/images/destinations/arugam-bay.jpg",
    heroImage: "/assets/images/destinations/arugam-bay.jpg",
    summary:
      "Arugam Bay is Sri Lanka's surf-minded east-coast escape, with beach days, lagoon safaris and a relaxed rhythm built around the ocean.",
    highlights: [
      "Surf or watch the waves at Point A",
      "Add lagoon safari time nearby",
      "Keep days open and unhurried",
      "Connect with Yala or the east coast",
    ],
    bestFor: "Surf, casual beach stays and relaxed east-coast travel",
  },
  {
    slug: "bentota",
    title: "Bentota",
    tagline: "Pristine beaches and water sports",
    keyAttraction: "Madu River, turtle hatchery, Bentota Beach",
    image: "/assets/images/destinations/bentota.jpg",
    heroImage: "/assets/images/destinations/bentota.jpg",
    summary:
      "Bentota is an easy beach extension from Colombo, pairing golden sand with river safaris, turtle conservation stops and warm-water leisure.",
    highlights: [
      "Unwind along Bentota Beach",
      "Cruise the Madu River",
      "Visit a turtle hatchery",
      "Use it as a soft landing or final beach stay",
    ],
    bestFor: "Beach leisure, short coastal breaks and family-friendly pacing",
  },
  {
    slug: "pinnawala",
    title: "Pinnawala",
    tagline: "Elephant Orphanage",
    keyAttraction: "Elephant bathing in the river",
    image: "/assets/images/destinations/pinnawala.jpg",
    heroImage: "/assets/images/destinations/pinnawala.jpg",
    summary:
      "Pinnawala is best planned as a gentle stop between regions, known for elephant-viewing moments and a slower river setting.",
    highlights: [
      "See elephants near the river",
      "Break up a road journey between Colombo and Kandy",
      "Keep the stop concise and well timed",
      "Pair with nearby hill-country routes",
    ],
    bestFor: "Short scenic stops and family travel days",
  },
];

export const tourPackages: TourPackage[] = [
  {
    slug: "sunbath-on-sands-standard",
    title: "Sunbath on Sands Standard",
    tier: "Beach / Leisure",
    hotels: "5-star",
    destinations: "Colombo + Bentota",
    duration: "4 days / 3 nights",
    image: "/assets/images/destinations/bentota.jpg",
    summary:
      "A luxury Colombo & Bentota experience. Nightlife at Bellagio, water sports, riverboat rides, turtle hatchery, and pristine beaches - all wrapped in 5-star comfort.",
    inclusions: [
      "Luxury vehicle airport transfer",
      "5-star hotel in Colombo",
      "Evening nightlife at Bellagio with free coupons",
      "Madu riverboat ride and turtle hatchery",
      "Water sports at Bentota",
      "5-star beach resort in Bentota",
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "BIA -> Colombo",
        items: [
          "Arrive from the airport and meet and greet by Beyond Borders travel assistant.",
          "Proceed to Colombo in a luxury vehicle.",
          "Check in at hotel for lunch.",
          "Evening nightlife at Bellagio Entertainment with free coupons, food and beverages.",
          "Overnight stay at Colombo 5-star hotel.",
        ],
      },
      {
        day: "Day 2",
        title: "Colombo -> Bentota",
        items: [
          "Breakfast from the hotel and proceed to Bentota.",
          "Lunch at a 5-star restaurant.",
          "Route visit including Madu riverboat ride, turtle hatchery, fish farm and water sports activities.",
          "Evening relaxation at the beach.",
          "Dinner and overnight stay at 5-star hotel.",
        ],
      },
      {
        day: "Day 3",
        title: "Bentota -> Colombo",
        items: [
          "Breakfast from the hotel and proceed to Colombo with luxury transport.",
          "Shopping at local markets.",
          "Overnight stay at Colombo 5-star hotel.",
        ],
      },
      {
        day: "Day 4",
        title: "Colombo -> BIA",
        items: [
          "Breakfast from the hotel.",
          "Check out and proceed to Bandaranaike International Airport.",
        ],
      },
    ],
  },
  {
    slug: "glamour-of-sri-lanka",
    title: "Glamour of Sri Lanka",
    tier: "Luxury",
    hotels: "5-star",
    destinations: "Colombo",
    duration: "3 days / 2 nights",
    image: "/assets/images/destinations/colombo-city.jpg",
    summary:
      "An exclusive Colombo city experience with 5-star accommodation, curated excursions, and premium personal service throughout your stay.",
    inclusions: [
      "Meet & greet airport service",
      "5-star hotel accommodation",
      "Colombo city tour",
      "Day leisure option",
      "All breakfasts included",
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "BIA -> Colombo",
        items: [
          "Arrive from the airport and meet and greet by Beyond Borders travel assistant.",
          "Proceed to Colombo and check in at a 5-star hotel.",
        ],
      },
      {
        day: "Day 2",
        title: "Colombo City",
        items: [
          "Breakfast from the hotel.",
          "Proceed on a Colombo city tour.",
          "Overnight stay at a 5-star hotel.",
        ],
      },
      {
        day: "Day 3",
        title: "Colombo City",
        items: [
          "Breakfast from the hotel.",
          "Day at leisure.",
          "Overnight stay at a 5-star hotel.",
        ],
      },
      {
        day: "Day 4",
        title: "Colombo -> BIA",
        items: [
          "Breakfast from the hotel.",
          "Check out and proceed to Bandaranaike International Airport.",
        ],
      },
    ],
  },
  {
    slug: "a-classic-of-the-city",
    title: "A Classic of the City",
    tier: "Classic",
    hotels: "Quality hotels",
    destinations: "Colombo",
    duration: "4 days / 3 nights",
    image: "/assets/images/destinations/colombo.jpg",
    summary:
      "Explore the best of Colombo over multiple days - a blend of history, culture, cuisine, and modern Sri Lankan city life with quality hotel stays.",
    inclusions: [
      "Meet & greet airport service",
      "Quality hotel accommodation",
      "Colombo city tour",
      "All breakfasts included",
      "Dedicated travel assistant",
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "BIA -> Colombo",
        items: [
          "Arrive from the airport and meet and greet by Beyond Borders travel assistant.",
          "Proceed to Colombo.",
        ],
      },
      {
        day: "Day 2",
        title: "Colombo City",
        items: [
          "Breakfast from the hotel.",
          "Proceed on a Colombo city tour.",
          "Overnight stay at quality hotel.",
        ],
      },
      {
        day: "Day 3",
        title: "Colombo City",
        items: [
          "Breakfast from the hotel.",
          "Continued city exploration.",
          "Overnight stay at quality hotel.",
        ],
      },
      {
        day: "Day 4",
        title: "Colombo -> BIA",
        items: [
          "Breakfast from the hotel.",
          "Check out and proceed to Bandaranaike International Airport.",
        ],
      },
    ],
  },
  {
    slug: "the-heart-of-city",
    title: "The Heart of City",
    tier: "Standard",
    hotels: "3-star",
    destinations: "Colombo",
    duration: "3 days / 2 nights",
    image: "/assets/images/destinations/colombo-2.jpg",
    summary:
      "A comfortable value-for-money Colombo city experience with 3-star hotel stays and a dedicated Beyond Borders assistant throughout.",
    inclusions: [
      "Meet & greet airport service",
      "3-star hotel accommodation",
      "Colombo city tour",
      "All breakfasts included",
      "Dedicated travel assistant",
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "BIA -> Colombo",
        items: [
          "Arrive from the airport and meet and greet by Beyond Borders travel assistant.",
          "Proceed to Colombo.",
        ],
      },
      {
        day: "Day 2",
        title: "Colombo City",
        items: [
          "Breakfast from the hotel.",
          "Proceed on a Colombo city tour.",
          "Overnight stay at 3-star hotel.",
        ],
      },
      {
        day: "Day 3",
        title: "Colombo City",
        items: [
          "Breakfast from the hotel.",
          "Day at leisure.",
          "Overnight stay at 3-star hotel.",
        ],
      },
      {
        day: "Day 4",
        title: "Colombo -> BIA",
        items: [
          "Breakfast from the hotel.",
          "Check out and proceed to BIA.",
        ],
      },
    ],
  },
];

export function getDestination(slug: string) {
  return destinations.find((destination) => destination.slug === slug);
}

export const destinationSlugs = destinations.map(
  (destination) => destination.slug,
);

export function getTourPackage(slug: string) {
  return tourPackages.find((tourPackage) => tourPackage.slug === slug);
}

export const tourPackageSlugs = tourPackages.map(
  (tourPackage) => tourPackage.slug,
);
