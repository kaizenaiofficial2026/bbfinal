// Auto-extracted from "Website Inquires.xlsx". Reference option lists for the
// custom inquiry form. Room categories are hotel-specific (cascading select).

export const PACKAGE_OPTIONS = [
  "The Heart of City - USD 200",
  "A Classic of The City - USD 300",
  "Glamour of Sri Lanka - USD 499",
  "Sunbath on Sands Standard - USD 999",
  "Sunbath on Sands Deluxe - USD 1,999",
  "Hill Country Tour - USD 2,999",
  "Discover Sri Lanka - USD 3,999",
] as const;

export const ROOM_TYPES = [
  "Single",
  "Double",
  "Twin",
  "Triple",
  "Quadruple",
] as const;

export const MEAL_PLANS = [
  "Room Only",
  "Bed & Breakfast",
  "Half Board",
  "Full Board",
] as const;

export const CAR_TYPES = [
  "Normal Car",
  "SUV / Jeep",
  "Voxy",
  "Prado",
  "Benz",
  "Limousine",
  "Alphard",
] as const;

export const HIRE_TYPES = [
  "Drop",
  "Pickup",
  "Perday",
  "Two or more",
] as const;

export const ONE_OR_BOTH_WAY = ["One way", "Both way"] as const;

export const FLIGHT_CLASSES = ["Economy", "Premium Economy", "Business", "First"] as const;

export const YES_NO = ["No", "Yes"] as const;

export type HotelOption = { name: string; categories: string[] };

export const HOTELS: HotelOption[] = [
  {
    "name": "Amari Colombo",
    "categories": [
      "Superior City View",
      "Superior Ocean View",
      "Deluxe City View",
      "Deluxe Ocean View",
      "Club Deluxe City",
      "Club Deluxe Ocean",
      "Executive Suite Ocean",
      "Ceylon Suite"
    ]
  },
  {
    "name": "Cinnamon Grand",
    "categories": [
      "Deluxe",
      "Execetive Floor",
      "Superior",
      "Deluxe Suite",
      "Execetive Suite",
      "Presidential Suite"
    ]
  },
  {
    "name": "Cinnamon Lakeside",
    "categories": [
      "Superior",
      "Premium",
      "Execetive",
      "Cilantro Suite",
      "Orris Suite",
      "Presidential Suite"
    ]
  },
  {
    "name": "Cinnamon Life",
    "categories": [
      "Premier Cityscape",
      "Premier Oceanfront",
      "Oceanscape Suite",
      "Skyline Suite"
    ]
  },
  {
    "name": "Cinnamon Red",
    "categories": [
      "Standard"
    ]
  },
  {
    "name": "Galadari",
    "categories": [
      "Standard",
      "Executive Floor",
      "Diplomatic Suite",
      "Penthouse",
      "Superior Suite",
      "Presidential Suite"
    ]
  },
  {
    "name": "Galle Face",
    "categories": [
      "Garden View",
      "City View",
      "Sea View",
      "Balcony Sea View",
      "Junior Suite Sea View",
      "Royal Suite",
      "Signature Suits"
    ]
  },
  {
    "name": "Hilton",
    "categories": [
      "Superior",
      "Deluxe",
      "Deluxe Sea View",
      "Business Suite",
      "Corner Suite",
      "Hilton Executive"
    ]
  },
  {
    "name": "Hilton Residencies",
    "categories": [
      "Deluxe Apartment",
      "Premium Apartment",
      "Business Apartment"
    ]
  },
  {
    "name": "ITC Colombo",
    "categories": [
      "Towers Room",
      "ITC One Suite",
      "Studio Room",
      "ITC Towers Suite",
      "One Bedroom Apartments",
      "Two Bedroom Apartments",
      "Luxury Suite"
    ]
  },
  {
    "name": "Kingsbury",
    "categories": [
      "Superior",
      "Deluxe",
      "Premium",
      "Executive",
      "Presidential Suite"
    ]
  },
  {
    "name": "Mandarina",
    "categories": [
      "Deluxe",
      "Twin Deluxe",
      "Premier"
    ]
  },
  {
    "name": "Marine Bay",
    "categories": [
      "Standard",
      "Deluxe Sea View",
      "Family Sea View",
      "Premium Sea View"
    ]
  },
  {
    "name": "Marino Beach",
    "categories": [
      "Deluxe",
      "Premier",
      "Signature King",
      "Signature Suite"
    ]
  },
  {
    "name": "Marriot Colombo",
    "categories": [
      "Superior Room",
      "Premier Ocean View",
      "Premier Corner Ocean View",
      "Ocean Vista Suite"
    ]
  },
  {
    "name": "Morven Hotel Colombo",
    "categories": [
      "Deluxe",
      "Deluxe Ocean",
      "Premium City",
      "Premium Ocean",
      "Ocean Viiew Suite"
    ]
  },
  {
    "name": "NH Collection Colombo",
    "categories": [
      "Superior",
      "Superior Ocean View",
      "Premium",
      "Premium Ocean View",
      "Executive",
      "Executive Ocean View",
      "Junior Suite",
      "Executive Suite",
      "Presidential Suite"
    ]
  },
  {
    "name": "Platinum One Apartments",
    "categories": [
      "Apatment"
    ]
  },
  {
    "name": "Radisson Colombo",
    "categories": [
      "Superior",
      "Premium",
      "Premium Sea View",
      "Suite Sea View"
    ]
  },
  {
    "name": "Ramada",
    "categories": [
      "Deluxe",
      "Premier Suite",
      "Splendor Suite"
    ]
  },
  {
    "name": "Shangri La",
    "categories": [
      "Deluxe Lake View",
      "Deluxe Ocean View",
      "Premier Ocean View",
      "Horizon Club",
      "Horizon Club Ocean View",
      "Excecutive Suite",
      "One Bedroom Apartments",
      "Two Bedroom Apartments",
      "Specialty Suite",
      "Shangri-La Suite"
    ]
  },
  {
    "name": "Sheraton Colombo",
    "categories": [
      "Deluxe",
      "Sheraton Club",
      "Premier",
      "Executive Suite",
      "Junior Suite",
      "Presidential Suite"
    ]
  },
  {
    "name": "Sofia Colombo",
    "categories": [
      "Standard Deluxe",
      "Suites"
    ]
  },
  {
    "name": "Taj Samudra",
    "categories": [
      "Deluxe City",
      "Deluxe City Ocean View",
      "Luxury City View",
      "Luxury City Ocean View",
      "Club",
      "Club Ocean View",
      "Executive Suite",
      "Deluxe Suite",
      "Grand Luxury Suite",
      "Presidential Tata Suite"
    ]
  }
];
