export type Destination = {
  slug: string;
  title: string;
  tagline: string;
  keyAttraction: string;
  image: string;
  heroImage: string;
  summary: string;
  highlights: string[];
  quickFacts: Array<{
    label: string;
    value: string;
  }>;
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
      "Colombo, the capital of Sri Lanka, has a long history as a port on ancient east-west trade routes, ruled successively by the Portuguese, Dutch and British. That heritage is reflected in its architecture, mixing colonial buildings with high-rises and shopping malls. Galle Face Green sits in the heart of the city along the Indian Ocean, a favourite promenade for locals and visitors alike, while Pettah is a lively bazaar district full of colour, sounds and street food. The city's National Museum traces Sri Lanka's history through royal regalia and ancient artefacts, and Gangaramaya Temple brings together Sri Lankan, Thai, Indian and Chinese architectural influences.",
    highlights: [
      "Galle Face Green promenade along the Indian Ocean",
      "Pettah bazaar - vibrant street markets and street food",
      "Gangaramaya Buddhist Temple",
      "National Museum of Sri Lanka",
      "Colombo Fort - colonial-era architecture",
      "Viharamahadevi Park - the city's largest public park",
      "World Trade Centre and modern skyline",
      "Kelaniya Raja Maha Vihara Temple",
    ],
    quickFacts: [
      { label: "Region", value: "Western Province" },
      { label: "Climate", value: "Tropical, warm year-round" },
      { label: "Best Time", value: "December - April" },
      { label: "Distance from BIA", value: "~35 km" },
      { label: "Language", value: "Sinhala, Tamil, English" },
    ],
  },
  {
    slug: "kandy",
    title: "Kandy",
    tagline: "Home of the Temple of the Tooth Relic",
    keyAttraction: "Sri Dalada Maligawa, Peradeniya Gardens - UNESCO WHS",
    image: "/assets/images/destinations/kandy.jpg",
    heroImage: "/assets/images/destinations/kandy.jpg",
    summary:
      "Kandy is a major city in Sri Lanka located in the Central Province. It was the last capital of the ancient kings' era of Sri Lanka. The city lies in the midst of hills in the Kandy plateau, which crosses an area of tropical plantations, mainly tea. Kandy is both an administrative and religious city and is also the capital of Central Province. It is the home of the Temple of the Tooth Relic, Sri Dalada Maligawa, one of the most sacred places of worship in the Buddhist world. The annual Esala Perahera, a grand procession featuring elaborately decorated elephants, traditional dancers and drummers, is one of the grandest Buddhist festivals in Asia, drawing visitors from around the world every July/August.",
    highlights: [
      "Temple of the Sacred Tooth Relic, Sri Dalada Maligawa",
      "Kandy Lake - the scenic man-made lake in the city centre",
      "Royal Botanical Gardens, Peradeniya",
      "Bahirawakanda Vihara, giant white Buddha statue",
      "Esala Perahera - grand annual Buddhist procession",
      "Kandy Arts and Crafts Association",
      "Udawatta Kele Sanctuary - forest reserve in the city",
      "Tea plantation visits in the surrounding hills",
    ],
    quickFacts: [
      { label: "Region", value: "Central Province" },
      { label: "Altitude", value: "~500 m above sea level" },
      { label: "Best Time", value: "Jan - Apr, Jul - Aug" },
      { label: "From Colombo", value: "~115 km (3 hrs)" },
      { label: "UNESCO", value: "World Heritage Site" },
    ],
  },
  {
    slug: "sigiriya",
    title: "Sigiriya",
    tagline: "Eighth Wonder of the World",
    keyAttraction: "Sigiriya Rock Fortress - UNESCO World Heritage Site",
    image: "/assets/images/destinations/sigiriya.jpg",
    heroImage: "/assets/images/destinations/sigiriya.jpg",
    summary:
      "Sigiriya or Sinhagiri is an ancient rock fortress located in the northern Matale District near the town of Dambulla in the Central Province, Sri Lanka. The name refers to a site of historical and archaeological significance that is dominated by a massive column of rock nearly 200 metres high. According to the ancient Sri Lankan chronicle the Culavamsa, this site was selected by King Kashyapa (477-495 AD) for his new capital. He built his palace on the top of this rock and decorated its sides with colourful frescoes. On a small plateau about halfway up the side of this rock he built a gateway in the form of an enormous lion, giving the site its name (Sinha = lion, Giri = rock). The site is a UNESCO World Heritage Site and is Sri Lanka's single most visited tourist destination. It is one of the best-preserved examples of ancient urban planning in the world.",
    highlights: [
      "The Lion's Paw entrance gateway carved into the rock",
      "Ancient frescoes (Sigiriya Damsels paintings)",
      "Mirror Wall polished to reflect the rock face",
      "Summit palace ruins with panoramic views",
      "Water gardens - one of the oldest landscaped gardens in the world",
      "Cobra Hood Cave with ancient graffiti",
      "Pidurangala Rock - alternative viewpoint",
    ],
    quickFacts: [
      { label: "Region", value: "North Central Province" },
      { label: "Height", value: "~200 m rock column" },
      { label: "Best Time", value: "Dec - Apr" },
      { label: "From Colombo", value: "~170 km (4 hrs)" },
      { label: "UNESCO", value: "World Heritage Site" },
    ],
  },
  {
    slug: "galle",
    title: "Galle",
    tagline: "The Largest Remaining Fortress in Asia",
    keyAttraction: "Galle Fort, Galle Lighthouse, Dutch Reformed Church",
    image: "/assets/images/destinations/galle.jpg",
    heroImage: "/assets/images/destinations/galle-fort.jpg",
    summary:
      "Galle is a city on the southwest coast of Sri Lanka. It's known for Galle Fort, the fortified old city founded by Portuguese colonists in the 16th century. Stone sea walls, expanded by the Dutch, encircle car-free streets with architecture reflecting Portuguese, Dutch and British rule. Notable buildings include the 18th-century Dutch Reformed Church and the Groote Kerk. The fort area contains the National Maritime Museum, and the Galle Lighthouse, the oldest in Sri Lanka, stands at its southern tip overlooking the Indian Ocean. Today the fort is a living city, its lanes lined with boutique hotels, art galleries, jewellery shops, and cafes that blend colonial heritage with contemporary Sri Lankan style. It is a UNESCO World Heritage Site.",
    highlights: [
      "Galle Fort walls - walk the full rampart at sunset",
      "Dutch Reformed Church, Groote Kerk",
      "Galle Lighthouse at the southern tip of the fort",
      "National Maritime Museum",
      "Boutique shopping along Pedlar Street",
      "Unawatuna Beach - a short drive from the fort",
      "Jungle Beach and Dalawella Beach nearby",
      "Stilt fishermen at Koggala and Weligama",
    ],
    quickFacts: [
      { label: "Region", value: "Southern Province" },
      { label: "Coast", value: "Southwest Sri Lanka" },
      { label: "Best Time", value: "Nov - Apr" },
      { label: "From Colombo", value: "~120 km (2.5 hrs)" },
      { label: "UNESCO", value: "World Heritage Site" },
    ],
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
    quickFacts: [
      { label: "Region", value: "Central Province" },
      { label: "Climate", value: "Cool highland climate" },
      { label: "Best Time", value: "February - April" },
      { label: "Distance from BIA", value: "~165 km" },
      { label: "Language", value: "Sinhala, Tamil, English" },
    ],
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
    quickFacts: [
      { label: "Region", value: "Southern Province" },
      { label: "Climate", value: "Dry zone, hot and seasonal" },
      { label: "Best Time", value: "February - June" },
      { label: "Distance from BIA", value: "~285 km" },
      { label: "Language", value: "Sinhala, Tamil, English" },
    ],
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
    quickFacts: [
      { label: "Region", value: "Eastern Province" },
      { label: "Climate", value: "Tropical coastal, warm and dry in season" },
      { label: "Best Time", value: "May - September" },
      { label: "Distance from BIA", value: "~240 km" },
      { label: "Language", value: "Tamil, Sinhala, English" },
    ],
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
    quickFacts: [
      { label: "Region", value: "Northern Province" },
      { label: "Climate", value: "Dry zone, warm and breezy" },
      { label: "Best Time", value: "January - September" },
      { label: "Distance from BIA", value: "~350 km" },
      { label: "Language", value: "Tamil, Sinhala, English" },
    ],
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
    quickFacts: [
      { label: "Region", value: "North Central Province" },
      { label: "Climate", value: "Dry zone, warm and sunny" },
      { label: "Best Time", value: "May - September" },
      { label: "Distance from BIA", value: "~170 km" },
      { label: "Language", value: "Sinhala, Tamil, English" },
    ],
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
    quickFacts: [
      { label: "Region", value: "North Central Province" },
      { label: "Climate", value: "Dry zone, warm and sunny" },
      { label: "Best Time", value: "January - September" },
      { label: "Distance from BIA", value: "~200 km" },
      { label: "Language", value: "Sinhala, Tamil, English" },
    ],
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
    quickFacts: [
      { label: "Region", value: "Eastern Province" },
      { label: "Climate", value: "Tropical coastal, warm and seasonal" },
      { label: "Best Time", value: "May - September" },
      { label: "Distance from BIA", value: "~320 km" },
      { label: "Language", value: "Tamil, Sinhala, English" },
    ],
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
    quickFacts: [
      { label: "Region", value: "Southern Province" },
      { label: "Climate", value: "Tropical coastal, warm year-round" },
      { label: "Best Time", value: "December - April" },
      { label: "Distance from BIA", value: "~110 km" },
      { label: "Language", value: "Sinhala, Tamil, English" },
    ],
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
    quickFacts: [
      { label: "Region", value: "Sabaragamuwa Province" },
      { label: "Climate", value: "Tropical inland, warm and humid" },
      { label: "Best Time", value: "December - April" },
      { label: "Distance from BIA", value: "~75 km" },
      { label: "Language", value: "Sinhala, Tamil, English" },
    ],
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
