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
    description: string;
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
      "A relaxed Colombo-to-Bentota escape with ocean time, river scenery and five-star leisure by the sea.",
    inclusions: [
      "Airport transfer",
      "Daily breakfast",
      "Dedicated Beyond Borders assistant",
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "Arrive in Colombo",
        description:
          "Meet your Beyond Borders assistant, settle in and enjoy an easy introduction to the capital.",
      },
      {
        day: "Day 2",
        title: "Travel to Bentota",
        description:
          "Move south to the coast with time for Bentota Beach, the Madu River or a turtle hatchery visit.",
      },
      {
        day: "Day 3",
        title: "Coastal leisure",
        description:
          "Keep the day relaxed with beach time, water sports or a private add-on shaped around your pace.",
      },
      {
        day: "Day 4",
        title: "Departure",
        description:
          "Return to Colombo or the airport with transfers arranged around your flight.",
      },
    ],
  },
  {
    slug: "glamour-of-sri-lanka",
    title: "Glamour of Sri Lanka",
    tier: "Luxury",
    hotels: "5-star",
    destinations: "Colombo",
    duration: "4 days / 3 nights",
    image: "/assets/images/tours/glamour-sri-lanka.jpg",
    summary:
      "Colombo at its most polished, with five-star living, curated dining and an elegant capital-city rhythm.",
    inclusions: [
      "Airport transfer",
      "Daily breakfast",
      "Dedicated Beyond Borders assistant",
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "Arrival and five-star check-in",
        description:
          "Begin with a private airport transfer, hotel arrival and time to settle into Colombo.",
      },
      {
        day: "Day 2",
        title: "Capital highlights",
        description:
          "Explore Gangaramaya Temple, Galle Face and curated city landmarks with a private rhythm.",
      },
      {
        day: "Day 3",
        title: "Dining and city style",
        description:
          "Keep the day flexible for shopping, galleries, spa time or a polished evening dining plan.",
      },
      {
        day: "Day 4",
        title: "Departure",
        description:
          "Enjoy breakfast and a private transfer for your onward flight or next Sri Lanka chapter.",
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
    image: "/assets/images/tours/classic-city.jpg",
    summary:
      "The essential Colombo stay, balancing colonial quarters, temples, bazaars and comfortable city downtime.",
    inclusions: [
      "Airport transfer",
      "Daily breakfast",
      "Dedicated Beyond Borders assistant",
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "Arrive and settle in",
        description:
          "Transfer from the airport and take the evening gently in Colombo.",
      },
      {
        day: "Day 2",
        title: "Classic Colombo",
        description:
          "Visit key city sights, markets and temples with time kept unhurried between stops.",
      },
      {
        day: "Day 3",
        title: "Neighbourhoods and free time",
        description:
          "Add shopping, cafes or a coastal walk, with optional private additions if you want more structure.",
      },
      {
        day: "Day 4",
        title: "Departure",
        description:
          "Close the stay with breakfast and a timed transfer to the airport.",
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
    image: "/assets/images/tours/heart-of-city.jpg",
    summary:
      "A compact Colombo break that covers the city essentials with transfers, breakfast and simple comfort handled.",
    inclusions: [
      "Airport transfer",
      "Daily breakfast",
      "Dedicated Beyond Borders assistant",
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "Arrival in Colombo",
        description:
          "Meet your assistant, transfer to your hotel and enjoy an easy first evening.",
      },
      {
        day: "Day 2",
        title: "City highlights",
        description:
          "Spend the day around Colombo's temples, markets and oceanfront landmarks.",
      },
      {
        day: "Day 3",
        title: "Departure",
        description:
          "Enjoy breakfast before your private transfer to the airport or onward route.",
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
