export type Destination = {
  slug: string;
  title: string;
  detailTitle?: string;
  tagline: string;
  detailTagline?: string;
  keyAttraction: string;
  keyAttractionItems?: string[];
  image: string;
  heroImage: string;
  summary: string;
  description?: string[];
  highlights: string[];
  quickFacts: Array<{
    label: string;
    value: string;
  }>;
  relatedPlaces?: Array<{
    title: string;
    tagline?: string;
    href: string;
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
    keyAttraction:
      "Scenic train journey from Kandy through tea country, tea estates and factory tours, Horton Plains National Park and World's End viewpoint",
    keyAttractionItems: [
      "Scenic train journey from Kandy through tea country",
      "Tea estates and factory tours",
      "Horton Plains National Park and World's End viewpoint",
    ],
    image: "/assets/images/destinations/nuwara-eliya.jpg",
    heroImage: "/assets/images/destinations/nuwara-eliya-2.jpg",
    summary:
      "Nuwara Eliya is a city in the tea country hills of central Sri Lanka. The naturally landscaped Hakgala Botanical Gardens displays roses and tree ferns, and shelters monkeys and blue magpies. Nearby Seetha Amman Temple, a colourful Hindu shrine, is decorated with religious figures.",
    description: [
      "Nuwara Eliya is a city in the tea country hills of central Sri Lanka. The naturally landscaped Hakgala Botanical Gardens displays roses and tree ferns, and shelters monkeys and blue magpies. Nearby Seetha Amman Temple, a colourful Hindu shrine, is decorated with religious figures.",
      "Densely forested Galway's Land National Park is home to endemic birds. The cool climate, rolling emerald tea estates, and colonial-era bungalows earned Nuwara Eliya its nickname \"Little England.\" It sits at nearly 1,900 m above sea level — one of Sri Lanka's highest cities.",
      "The famous scenic train journey from Kandy to Nuwara Eliya is considered one of the most beautiful rail rides in the world, winding through mist-covered mountains and verdant tea plantations.",
    ],
    highlights: [
      "Scenic train ride from Kandy through tea country",
      "Hakgala Botanical Gardens",
      "Tea factory and estate tours (Pedro, Mackwoods)",
      "Horton Plains National Park — World's End viewpoint",
      "Gregory Lake boating and walks",
      "Seetha Amman Temple (Ramayana trail)",
      "Victoria Park — colonial-era gardens",
      "Galway's Land Bird Sanctuary",
    ],
    quickFacts: [
      { label: "Region", value: "Central Province" },
      { label: "Altitude", value: "~1,868 m" },
      { label: "Climate", value: "Cool, misty (12–18°C)" },
      { label: "Best Time", value: "Jan – Apr" },
      { label: "From Colombo", value: "~180 km (5 hrs)" },
    ],
    relatedPlaces: [
      {
        title: "Horton Plains National Park",
        href: "/destinations",
      },
      {
        title: "Ella",
        tagline: "scenic mountain town",
        href: "/destinations",
      },
      {
        title: "Kandy",
        tagline: "~75 km north",
        href: "/kandy",
      },
      {
        title: "Ramboda Falls",
        href: "/destinations",
      },
    ],
  },
  {
    slug: "yala",
    title: "Yala National Park",
    tagline: "Most Popular National Park in Sri Lanka",
    keyAttraction:
      "Leopard spotting with one of the highest leopard densities in the world, jeep safaris through jungle, parkland, lagoons, and rocky terrain, and wildlife encounters including elephants, sloth bears, crocodiles, buffalo, and birdlife",
    keyAttractionItems: [
      "Leopard spotting with one of the highest leopard densities in the world",
      "Jeep safaris through jungle, parkland, lagoons, and rocky terrain",
      "Wildlife encounters including elephants, sloth bears, crocodiles, buffalo, and birdlife",
    ],
    image: "/assets/images/destinations/yala.jpg",
    heroImage: "/assets/images/destinations/yala-2.jpg",
    summary:
      "Yala National Park is the most visited and second largest national park in Sri Lanka, bordering the Indian Ocean. The park consists of five blocks, two of which are now open to the public, and also adjoining parks.",
    description: [
      "Yala National Park is the most visited and second largest national park in Sri Lanka, bordering the Indian Ocean. The park consists of five blocks, two of which are now open to the public, and also adjoining parks.",
      "Yala has the world's highest density of leopards and is one of the best places on Earth to spot them in the wild. The park is also home to Sri Lankan elephants, sloth bears, crocodiles, water buffalo, and over 215 bird species including the painted stork and the Indian peafowl.",
      "The landscape varies from dense jungle to open parkland, rocky outcrops, and beautiful coastal lagoons — making every jeep safari a unique adventure. Ancient Buddhist ruins found within the park add a fascinating historical dimension to the wildlife experience.",
    ],
    highlights: [
      "Leopard spotting — highest density in the world",
      "Sri Lankan elephant herds",
      "Sloth bear sightings",
      "Over 215 bird species",
      "Coastal lagoons and ocean views within the park",
      "Ancient Buddhist ruins at Sithulpawwa",
      "Crocodile-filled waterholes",
      "Sunrise and sunset jeep safaris",
    ],
    quickFacts: [
      { label: "Region", value: "Southern / Uva Province" },
      { label: "Area", value: "~979 km²" },
      { label: "Best Time", value: "Feb – Jul" },
      { label: "From Colombo", value: "~300 km (6 hrs)" },
      { label: "Safari", value: "Jeep safaris from gate" },
    ],
    relatedPlaces: [
      {
        title: "Tissamaharama Temple",
        href: "/destinations",
      },
      {
        title: "Bundala National Park",
        href: "/destinations",
      },
      {
        title: "Kataragama Sacred City",
        href: "/destinations",
      },
      {
        title: "Galle",
        tagline: "~150 km west",
        href: "/galle",
      },
    ],
  },
  {
    slug: "trincomalee",
    title: "Trincomalee",
    detailTitle: "Trincomalee",
    tagline: "One of the world's finest natural harbours",
    detailTagline: "One of the World's Finest Natural Harbours",
    keyAttraction: "Koneswaram Temple, Nilaveli Beach, whale watching",
    keyAttractionItems: [
      "Koneswaram Temple on Swami Rock with panoramic ocean views",
      "Nilaveli and Uppuveli beaches",
      "Pigeon Island National Park for snorkelling and diving",
      "Whale-watching excursions from March to August",
    ],
    image: "/assets/images/destinations/trincomalee.jpg",
    heroImage: "/assets/images/destinations/trincomalee.jpg",
    summary:
      "Trincomalee opens the east coast with a deep natural harbour, temple cliffs, Nilaveli Beach and seasonal whale-watching waters.",
    description: [
      "Trincomalee is a port city on the northeast coast of Sri Lanka. Set on a peninsula, Fort Frederick was built by the Portuguese in the 17th century. Within its grounds, the grand Koneswaram Temple stands on Swami Rock cliff — a popular vantage point for blue-whale watching.",
      "The holy complex contains ornate shrines and a sacred spring. Trincomalee's natural deep-water harbour is one of the finest in the world and has been strategically significant since ancient times — contested by the Portuguese, Dutch, British, and French over the centuries.",
      "Today Trincomalee is celebrated for its stunning beaches — Nilaveli and Uppuveli are among the most pristine in Sri Lanka — alongside thrilling dive sites, snorkelling with sea turtles, and whale-watching excursions from March to August.",
    ],
    highlights: [
      "Koneswaram Temple on Swami Rock — panoramic ocean views",
      "Blue-whale and sperm-whale watching (Mar–Aug)",
      "Nilaveli Beach — powder-white sand, crystal-clear water",
      "Pigeon Island National Park — snorkelling & diving",
      "Fort Frederick — 17th-century Portuguese fortification",
      "Uppuveli Beach — relaxed beachside village",
      "Hot springs at Kanniya",
      "War Cemetery — Commonwealth memorial",
    ],
    quickFacts: [
      { label: "Region", value: "Eastern Province" },
      { label: "Coast", value: "Northeast Sri Lanka" },
      { label: "Best Time", value: "Apr – Sep" },
      { label: "From Colombo", value: "~260 km (5–6 hrs)" },
      { label: "Known for", value: "Beaches, diving, whales" },
    ],
    relatedPlaces: [
      {
        title: "Pigeon Island Marine Sanctuary",
        href: "/destinations",
      },
      {
        title: "Kanniya Hot Springs",
        href: "/destinations",
      },
      {
        title: "Sigiriya",
        tagline: "~130 km south",
        href: "/sigiriya",
      },
      {
        title: "Polonnaruwa Ancient City",
        href: "/polonnaruwa",
      },
    ],
  },
  {
    slug: "jaffna",
    title: "Jaffna",
    detailTitle: "Jaffna",
    tagline: "Cultural heartland of north Sri Lanka",
    detailTagline: "The Cultural Heart of Northern Sri Lanka",
    keyAttraction: "Jaffna Fort, Hindu temples, lagoons",
    keyAttractionItems: [
      "Nallur Kandaswamy Temple and Tamil cultural heritage",
      "Jaffna Fort and colonial history",
      "Delft Island and its famous wild ponies",
      "Northern island-hopping and coastal experiences",
    ],
    image: "/assets/images/destinations/jaffna.jpg",
    heroImage: "/assets/images/destinations/jaffna.jpg",
    summary:
      "Jaffna has a distinct northern rhythm shaped by forts, Hindu temples, lagoons, cuisine and a cultural identity that rewards curious travellers.",
    description: [
      "Jaffna is the historic and cultural capital of Northern Sri Lanka, connected to the mainland by the Elephant Pass causeway. Shaped by centuries of Tamil heritage, colonial influence, and maritime trade, the city offers a distinctive character unlike anywhere else on the island.",
      "At the heart of the city stands the iconic Jaffna Fort, originally built by the Portuguese and later expanded by the Dutch. Nearby, the sacred Nallur Kandaswamy Temple draws thousands of devotees and visitors with its striking architecture, vibrant festivals, and deep spiritual significance.",
      "Beyond the city, Jaffna's charm lies in its quiet islands, untouched beaches, palmyrah landscapes, and rich local traditions. Visitors can explore ancient temples, coastal villages, fresh seafood markets, and remote islands such as Delft Island, where wild ponies roam freely across a unique coral landscape.",
    ],
    highlights: [
      "Nallur Kandaswamy Temple",
      "Jaffna Fort",
      "Delft Island and wild ponies",
      "Casuarina Beach",
      "Nagadeepa Temple",
      "Keerimalai Natural Springs",
      "Northern island boat excursions",
      "Traditional Jaffna cuisine and seafood",
      "Historic Dutch and Portuguese influences",
      "Vibrant cultural and religious festivals",
    ],
    quickFacts: [
      { label: "Region", value: "Northern Province" },
      { label: "Known For", value: "Tamil culture & heritage" },
      { label: "Best Time", value: "May – Sep" },
      { label: "From Colombo", value: "~400 km (7–8 hrs)" },
      { label: "Language", value: "Tamil, Sinhala, English" },
    ],
    relatedPlaces: [
      {
        title: "Delft Island",
        href: "/destinations",
      },
      {
        title: "Nagadeepa Temple",
        href: "/destinations",
      },
      {
        title: "Keerimalai Springs",
        href: "/destinations",
      },
      {
        title: "Casuarina Beach",
        href: "/destinations",
      },
    ],
  },
  {
    slug: "anuradhapura",
    title: "Anuradhapura",
    detailTitle: "Anuradhapura",
    tagline: "Ancient capital",
    detailTagline: "The Sacred Ancient Capital of Sri Lanka",
    keyAttraction: "Sacred Bo tree, dagobas - UNESCO WHS",
    keyAttractionItems: [
      "Sri Maha Bodhi and sacred Buddhist pilgrimage sites",
      "Ruwanwelisaya, Jetavanaramaya, and Abhayagiri stupas",
      "Ancient royal ruins, monasteries, and stone carvings",
      "Historic reservoirs and irrigation heritage",
    ],
    image: "/assets/images/destinations/anuradhapura.jpg",
    heroImage: "/assets/images/destinations/anuradhapura.jpg",
    summary:
      "Anuradhapura is one of Sri Lanka's great ancient capitals, where dagobas, monastic ruins and the sacred Bo tree anchor a deeply spiritual landscape.",
    description: [
      "Anuradhapura is one of Sri Lanka's most sacred and historically significant cities, known as the island's first ancient capital. Founded over 2,000 years ago, the city became the heart of early Sri Lankan civilisation, Buddhism, royal architecture, and advanced irrigation.",
      "The ancient city is home to some of the most important Buddhist monuments in the country, including the Sri Maha Bodhi, believed to be grown from a cutting of the sacred Bodhi tree under which the Buddha attained enlightenment. Vast stupas such as Ruwanwelisaya, Jetavanaramaya, and Abhayagiri continue to stand as powerful symbols of devotion, craftsmanship, and royal heritage.",
      "Beyond its temples and ruins, Anuradhapura reveals the engineering brilliance of ancient Sri Lanka through its reservoirs, stone carvings, monastic complexes, and ceremonial sites. The peaceful atmosphere, sacred pilgrimage routes, and UNESCO-listed archaeological landscape make it one of the most meaningful cultural destinations in the country.",
    ],
    highlights: [
      "Sri Maha Bodhi sacred tree",
      "Ruwanwelisaya Stupa",
      "Jetavanaramaya Stupa",
      "Abhayagiri Monastery complex",
      "Thuparamaya Dagoba",
      "Isurumuniya Temple and stone carvings",
      "Samadhi Buddha statue",
      "Twin Ponds ancient bathing pools",
      "Ancient royal palace ruins",
      "Historic tanks and irrigation systems",
    ],
    quickFacts: [
      { label: "Region", value: "North Central Province" },
      { label: "UNESCO", value: "World Heritage Site" },
      { label: "Known For", value: "Ancient capital & sacred city" },
      { label: "Best Time", value: "May – Sep" },
      { label: "From Colombo", value: "~205 km (4–5 hrs)" },
    ],
    relatedPlaces: [
      {
        title: "Mihintale",
        href: "/destinations",
      },
      {
        title: "Wilpattu National Park",
        href: "/destinations",
      },
      {
        title: "Aukana Buddha Statue",
        href: "/destinations",
      },
      {
        title: "Dambulla Cave Temple",
        href: "/destinations",
      },
    ],
  },
  {
    slug: "polonnaruwa",
    title: "Polonnaruwa",
    detailTitle: "Polonnaruwa",
    tagline: "Medieval capital of stone and story",
    detailTagline: "The Medieval Kingdom of Sri Lanka",
    keyAttraction: "Royal ruins, Gal Vihara, ancient reservoirs",
    keyAttractionItems: [
      "Gal Vihara rock-carved Buddha statues",
      "Ancient royal palace and audience hall ruins",
      "Parakrama Samudra reservoir",
      "UNESCO-listed medieval capital and archaeological city",
    ],
    image: "/assets/images/tours/ancient-capital.jpg",
    heroImage: "/assets/images/tours/ancient-capital.jpg",
    summary:
      "Polonnaruwa extends the ancient-capital story with royal ruins, carved stone Buddhas and wide reservoirs that make the cultural triangle feel complete.",
    description: [
      "Polonnaruwa is one of Sri Lanka's most remarkable ancient cities and served as the island's second major capital after Anuradhapura. Flourishing between the 11th and 13th centuries, the city became a centre of royal power, Buddhist learning, architecture, and advanced water management.",
      "The ancient city is best known for its beautifully preserved ruins, including royal palaces, audience halls, monasteries, temples, and stone sculptures. Among its most iconic sites is Gal Vihara, a group of magnificent Buddha statues carved directly into granite rock, widely admired for their detail, serenity, and craftsmanship.",
      "Polonnaruwa also reflects the engineering brilliance of ancient Sri Lanka through the Parakrama Samudra, a vast man-made reservoir built under King Parakramabahu I. With its peaceful archaeological landscape, sacred monuments, and UNESCO-listed heritage, Polonnaruwa offers one of the most complete glimpses into Sri Lanka's medieval past.",
    ],
    highlights: [
      "Gal Vihara rock-carved Buddha statues",
      "Royal Palace of King Parakramabahu",
      "Ancient Audience Hall",
      "Parakrama Samudra reservoir",
      "Rankoth Vehera Stupa",
      "Lankatilaka Image House",
      "Vatadage circular relic house",
      "Thuparama Image House",
      "Archaeological Museum",
      "Cycling through the ancient city",
    ],
    quickFacts: [
      { label: "Region", value: "North Central Province" },
      { label: "UNESCO", value: "World Heritage Site" },
      { label: "Known For", value: "Medieval ruins & royal city" },
      { label: "Best Time", value: "May – Sep" },
      { label: "From Colombo", value: "~225 km (5–6 hrs)" },
    ],
    relatedPlaces: [
      {
        title: "Minneriya National Park",
        href: "/destinations",
      },
      {
        title: "Sigiriya Rock Fortress",
        href: "/sigiriya",
      },
      {
        title: "Dambulla Cave Temple",
        href: "/destinations",
      },
      {
        title: "Anuradhapura Ancient City",
        href: "/anuradhapura",
      },
    ],
  },
  {
    slug: "arugam-bay",
    title: "Arugam Bay",
    detailTitle: "Arugam Bay",
    tagline: "World-famous surf beach",
    detailTagline: "Sri Lanka's East Coast Surf Capital",
    keyAttraction: "Point A surf break, lagoon safaris",
    keyAttractionItems: [
      "Main Point surf break",
      "Relaxed east coast beach atmosphere",
      "Lagoon safaris and nearby wildlife",
      "Easy access to nearby beaches and cultural sites",
    ],
    image: "/assets/images/destinations/arugam-bay.jpg",
    heroImage: "/assets/images/destinations/arugam-bay.jpg",
    summary:
      "Arugam Bay is Sri Lanka's surf-minded east-coast escape, with beach days, lagoon safaris and a relaxed rhythm built around the ocean.",
    description: [
      "Arugam Bay is a laid-back beach town on Sri Lanka's southeast coast, best known for its world-class surf breaks, golden shoreline, and relaxed coastal lifestyle. It has become one of the island's most loved beach destinations, attracting surfers, backpackers, and travellers looking for a slower, sun-filled escape.",
      "The town is especially famous for Main Point, one of Sri Lanka's top surf spots, along with nearby breaks such as Whiskey Point and Peanut Farm. During the east coast season, the bay comes alive with surf schools, beach cafés, seafood restaurants, and a casual nightlife scene while still keeping its easygoing village charm.",
      "Beyond the beach, Arugam Bay offers lagoon safaris, sunrise walks, nearby wildlife experiences, and access to Kumana National Park. Its mix of surfing, nature, coastal scenery, and relaxed atmosphere makes it a perfect stop for travellers exploring Sri Lanka's eastern coastline.",
    ],
    highlights: [
      "Main Point surf break",
      "Surfing and beginner surf lessons",
      "Arugam Bay Beach",
      "Peanut Farm Beach",
      "Whiskey Point",
      "Pottuvil Lagoon safari",
      "Kumana National Park nearby",
      "Sunrise beach walks",
      "Relaxed cafés and coastal nightlife",
    ],
    quickFacts: [
      { label: "Region", value: "Eastern Province" },
      { label: "Coast", value: "Southeast Sri Lanka" },
      { label: "Known For", value: "Surfing & beach life" },
      { label: "Best Time", value: "May – Sep" },
      { label: "From Colombo", value: "~320 km (7–8 hrs)" },
    ],
    relatedPlaces: [
      {
        title: "Peanut Farm Beach",
        href: "/destinations",
      },
      {
        title: "Whiskey Point",
        href: "/destinations",
      },
      {
        title: "Pottuvil Lagoon",
        href: "/destinations",
      },
      {
        title: "Kumana National Park",
        href: "/destinations",
      },
    ],
  },
  {
    slug: "bentota",
    title: "Bentota",
    detailTitle: "Bentota",
    tagline: "Pristine beaches and water sports",
    detailTagline: "Sri Lanka's Golden Coast Beach Escape",
    keyAttraction: "Madu River, turtle hatchery, Bentota Beach",
    keyAttractionItems: [
      "Bentota Beach and golden southwest coastline",
      "Bentota River water sports and boat safaris",
      "Turtle conservation centres nearby",
      "Brief Garden and coastal cultural attractions",
    ],
    image: "/assets/images/destinations/bentota.jpg",
    heroImage: "/assets/images/destinations/bentota.jpg",
    summary:
      "Bentota is an easy beach extension from Colombo, pairing golden sand with river safaris, turtle conservation stops and warm-water leisure.",
    description: [
      "Bentota is one of Sri Lanka's most popular beach destinations, located along the island's southwest coast where the Bentota River meets the Indian Ocean. Known for its golden beaches, calm coastal atmosphere, and luxury resorts, it is a favourite stop for travellers looking for sun, sea, and relaxation.",
      "The area is especially well known for water sports, with opportunities for jet skiing, banana boat rides, windsurfing, kayaking, and river safaris along the Bentota River. Its wide sandy beach and warm tropical waters make it ideal for both peaceful beach days and active coastal adventures.",
      "Beyond the shoreline, Bentota offers easy access to gardens, temples, turtle conservation centres, and scenic river landscapes. With its mix of beach comfort, water activities, and nearby cultural attractions, Bentota is one of the best places to experience Sri Lanka's relaxed southern coastline.",
    ],
    highlights: [
      "Bentota Beach",
      "Water sports on the Bentota River",
      "River boat safaris through mangroves",
      "Turtle hatcheries and conservation centres",
      "Brief Garden by Bevis Bawa",
      "Jet skiing, kayaking, and windsurfing",
      "Relaxed luxury beach resorts",
      "Sunset walks along the coast",
      "Nearby temples and local villages",
    ],
    quickFacts: [
      { label: "Region", value: "Southern Province" },
      { label: "Coast", value: "Southwest Sri Lanka" },
      { label: "Known For", value: "Beaches & water sports" },
      { label: "Best Time", value: "Dec – Apr" },
      { label: "From Colombo", value: "~85 km (1.5–2 hrs)" },
    ],
    relatedPlaces: [
      {
        title: "Brief Garden",
        href: "/destinations",
      },
      {
        title: "Kosgoda Turtle Hatchery",
        href: "/destinations",
      },
      {
        title: "Beruwala",
        href: "/destinations",
      },
      {
        title: "Hikkaduwa",
        href: "/destinations",
      },
    ],
  },
  {
    slug: "pinnawala",
    title: "Pinnawala",
    detailTitle: "Pinnawala",
    tagline: "Elephant Orphanage",
    detailTagline: "Sri Lanka’s Famous Elephant Village",
    keyAttraction: "Elephant bathing in the river",
    keyAttractionItems: [
      "Pinnawala Elephant Orphanage",
      "Elephant bathing at the Maha Oya River",
      "Riverside village atmosphere",
      "Convenient stop between Colombo and Kandy",
    ],
    image: "/assets/images/destinations/pinnawala.jpg",
    heroImage: "/assets/images/destinations/pinnawala.jpg",
    summary:
      "Pinnawala is best planned as a gentle stop between regions, known for elephant-viewing moments and a slower river setting.",
    description: [
      "Pinnawala is a peaceful village in Sri Lanka’s Sabaragamuwa Province, best known for the Pinnawala Elephant Orphanage. Established in 1975, the orphanage was created to care for orphaned, injured, and rescued elephants, and has become one of the island’s most visited wildlife-related attractions.",
      "The highlight of a visit to Pinnawala is watching the elephants move through the village towards the Maha Oya River for their daily bathing routine. This unique experience gives visitors a close look at Sri Lanka’s elephants in a calm riverside setting, surrounded by tropical greenery and local village life.",
      "Beyond the orphanage, Pinnawala offers a slower rural atmosphere with riverside views, handicraft shops, local restaurants, and nearby cultural stops. Its location between Colombo and Kandy makes it a popular stop for travellers exploring Sri Lanka’s central route.",
    ],
    highlights: [
      "Pinnawala Elephant Orphanage",
      "Elephant bathing at Maha Oya River",
      "Feeding sessions and elephant viewing areas",
      "Riverside cafés and restaurants",
      "Local handicraft and souvenir shops",
      "Peaceful village surroundings",
      "Easy stop on the Colombo–Kandy route",
      "Nearby spice gardens and cultural stops",
    ],
    quickFacts: [
      { label: "Region", value: "Sabaragamuwa Province" },
      { label: "Known For", value: "Elephants & river bathing" },
      { label: "Best Time", value: "Jan – Apr" },
      { label: "From Colombo", value: "~90 km (2–2.5 hrs)" },
      { label: "From Kandy", value: "~40 km (1–1.5 hrs)" },
    ],
    relatedPlaces: [
      {
        title: "Kegalle",
        href: "/destinations",
      },
      {
        title: "Mawanella",
        href: "/destinations",
      },
      {
        title: "Kandy",
        href: "/kandy",
      },
      {
        title: "Peradeniya Botanical Gardens",
        href: "/destinations",
      },
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
