import type { SupportedLanguage } from "@/config";

export type City = {
  id: string;
  name: string;
  code: string;
};

import type { VehicleTier } from "@/contracts/vehicle-tiers";

export type VehicleId = VehicleTier | "innova" | "tempo" | "urbania";
export type FareByVehicle = Record<string, number | undefined>;

export type Vehicle = {
  id: VehicleId;
  name: string;
  klass: string;
  seats: number;
  bags: number;
  ac: boolean;
  tags: readonly string[];
  blurb: string;
  perKm: number;
  rateRange: string;
  models: readonly string[];
  image: string;
  suitable: string;
  alwaysRoundTrip?: boolean;
};

export type Route = {
  id: string;
  from: string;
  to: string;
  origin?: string;
  destination?: string;
  corridor?: string;
  pricingModel?: string;
  toll?: 0 | 1;
  km: number;
  duration: string;
  kind: "one-way" | "local";
  localLabel?: string;
  fares: FareByVehicle;
};

export type RouteGuidanceItem = {
  highway: string;
  transitTime: string;
  departureTip: Record<SupportedLanguage, string>;
  restStops: Record<SupportedLanguage, string>;
  tollTaxPolicy: Record<SupportedLanguage, string>;
};

export type TourItineraryStop = {
  time: string;
  title: Record<SupportedLanguage, string>;
  desc: Record<SupportedLanguage, string>;
};

export type VehicleUpgrade = {
  vehId: VehicleId;
  name: Record<SupportedLanguage, string>;
  seats: string;
  price: number;
};

export type TourPackageGalleryImage = {
  url: string;
  caption?: string;
  alt?: string;
};

export type TourPackage = {
  id: string;
  slug: string;
  name: string;
  kicker: string;
  duration: string;
  from: number;
  image: string;
  gallery?: readonly TourPackageGalleryImage[];
  places: readonly string[];
  blurb: string;
  includes: readonly string[];
  excludes: readonly string[];
  source?: string;
  destination?: string;
  fleetPrices?: Record<string, number>;
  days?: number;
  nights?: number;
  itinerary?: readonly { time?: string; title: string; desc: string }[];
  timeline?: readonly TourItineraryStop[];
  upgrades?: readonly VehicleUpgrade[];
};

export type AirportTransfer = {
  id: string;
  name: string;
  fares: FareByVehicle;
};

export type Service = {
  id: string;
  index: string;
  variant: "navy" | "light" | "gold";
  title: string;
  body: string;
  tags: readonly string[];
  href: string;
  cta: string;
};

export type Review = {
  name: string;
  place: string;
  rating: number;
  quote: string;
  role?: string;
  avatar?: string;
  date?: string;
};

export type PromoCode = {
  discount: number;
  minTotal: number;
  desc: string;
};

export type TourCancellationSlab = {
  days: string;
  fee: string;
  refund: string;
};

export type FaqItem = {
  category: "booking" | "fares" | "outstation" | "night" | "cancellation" | "pet" | "intercity";
  question: Record<SupportedLanguage, string>;
  answer: Record<SupportedLanguage, string>;
};

export const cities: readonly City[] = [
  { id: "agra", name: "Agra", code: "AGR" },
  { id: "delhi", name: "Delhi", code: "DEL" },
  { id: "jaipur", name: "Jaipur", code: "JAI" },
  { id: "mathura", name: "Mathura", code: "MAT" },
  { id: "gwalior", name: "Gwalior", code: "GWL" },
  { id: "lucknow", name: "Lucknow", code: "LKO" },
];
import catalog from "./data/generated-catalog.json";

export const vehicles: readonly Vehicle[] = catalog.vehicles as unknown as readonly Vehicle[];
export const routes: readonly Route[] = catalog.routes as unknown as readonly Route[];


export const routeGuidance: Readonly<Record<string, RouteGuidanceItem>> = {
  "agra-delhi": {
    highway: "Yamuna Expressway (6-Lane Access-Controlled)",
    transitTime: "3h 30m (230 km)",
    departureTip: {
      en: "Early morning (05:00–07:00 AM) or mid-afternoon (01:00–03:00 PM) to avoid Delhi NCR peak rush hour.",
      hi: "Early morning (05:00–07:00 AM) or mid-afternoon (01:00–03:00 PM) to avoid Delhi NCR peak rush hour.",
    },
    restStops: {
      en: "Jewar Toll Plaza & Tappal Plaza (Costa Coffee, Haldiram's, Subway, clean sanitised rest areas).",
      hi: "Jewar Toll Plaza & Tappal Plaza (Costa Coffee, Haldiram's, Subway, clean sanitised rest areas).",
    },
    tollTaxPolicy: {
      en: "One-way booking includes Yamuna Expressway toll. Round-trip tolls and state permits charged at actuals.",
      hi: "One-way booking includes Yamuna Expressway toll. Round-trip tolls and state permits charged at actuals.",
    },
  },
  "delhi-agra": {
    highway: "Yamuna Expressway (via Noida / Greater Noida)",
    transitTime: "3h 30m (230 km)",
    departureTip: {
      en: "06:00 AM departure from Delhi gets you to the Taj Mahal ticket gate by 09:30 AM before peak tourist crowds.",
      hi: "06:00 AM departure from Delhi gets you to the Taj Mahal ticket gate by 09:30 AM before peak tourist crowds.",
    },
    restStops: {
      en: "Food courts at KM 64 and KM 118 on Yamuna Expressway with hygienic breakfast options.",
      hi: "Food courts at KM 64 and KM 118 on Yamuna Expressway with hygienic breakfast options.",
    },
    tollTaxPolicy: {
      en: "One-way fare is 100% all-inclusive (expressway toll & driver allowance included).",
      hi: "One-way fare is 100% all-inclusive (expressway toll & driver allowance included).",
    },
  },
  "agra-jaipur": {
    highway: "National Highway 21 (Agra–Bikaner Highway)",
    transitTime: "4h 30m (240 km)",
    departureTip: {
      en: "Depart by 07:30 AM with an optional 1.5-hour stop at UNESCO World Heritage Fatehpur Sikri en route.",
      hi: "Depart by 07:30 AM with an optional 1.5-hour stop at UNESCO World Heritage Fatehpur Sikri en route.",
    },
    restStops: {
      en: "Midway restaurants near Bharatpur and Mahwa Highway Treat with pure vegetarian Rajasthani thalis.",
      hi: "Midway restaurants near Bharatpur and Mahwa Highway Treat with pure vegetarian Rajasthani thalis.",
    },
    tollTaxPolicy: {
      en: "NH-21 highway toll included in one-way fare. Rajasthan state tax is separate on round trips.",
      hi: "NH-21 highway toll included in one-way fare. Rajasthan state tax is separate on round trips.",
    },
  },
  "agra-mathura": {
    highway: "NH-19 / Delhi–Agra Highway",
    transitTime: "1h 15m (55 km)",
    departureTip: {
      en: "Plan your trip around temple aarti times: Morning (07:00–11:00 AM) or Evening (04:30–08:30 PM).",
      hi: "Plan your trip around temple aarti times: Morning (07:00–11:00 AM) or Evening (04:30–08:30 PM).",
    },
    restStops: {
      en: "Famous Brijwasi sweets and Highway Masala Dosa hubs along the Farah–Mathura stretch.",
      hi: "Famous Brijwasi sweets and Highway Masala Dosa hubs along the Farah–Mathura stretch.",
    },
    tollTaxPolicy: {
      en: "Local toll and temple area parking assistance included in package.",
      hi: "Local toll and temple area parking assistance included in package.",
    },
  },
  "agra-gwalior": {
    highway: "National Highway 44 (North–South Corridor)",
    transitTime: "2h 30m (120 km)",
    departureTip: {
      en: "Early morning departure recommended for scenic crossing of the Chambal river valley.",
      hi: "Early morning departure recommended for scenic crossing of the Chambal river valley.",
    },
    restStops: {
      en: "Morena roadside dhabas famous for Gajak and North Indian breakfast.",
      hi: "Morena roadside dhabas famous for Gajak and North Indian breakfast.",
    },
    tollTaxPolicy: {
      en: "Includes toll taxes. MP state commercial tax separate on outstation trips.",
      hi: "Includes toll taxes. MP state commercial tax separate on outstation trips.",
    },
  },
  "delhi-jaipur": {
    highway: "Delhi–Mumbai Expressway (NE-4) / NH-48",
    transitTime: "4h 30m (270 km)",
    departureTip: {
      en: "Use the new Delhi–Mumbai Expressway via Sohna for ultra-smooth 120 km/h driving experience.",
      hi: "Use the new Delhi–Mumbai Expressway via Sohna for ultra-smooth 120 km/h driving experience.",
    },
    restStops: {
      en: "Modern wayside amenities along NE-4 every 50 km with EV charging, McDonald's, and restrooms.",
      hi: "Modern wayside amenities along NE-4 every 50 km with EV charging, McDonald's, and restrooms.",
    },
    tollTaxPolicy: {
      en: "Expressway toll included in one-way fare. Round trip subject to 300 km/day minimum billing.",
      hi: "Expressway toll included in one-way fare. Round trip subject to 300 km/day minimum billing.",
    },
  },
  "agra-lucknow": {
    highway: "Agra–Lucknow Expressway (6-Lane Greenfield)",
    transitTime: "5h 15m (335 km)",
    departureTip: {
      en: "Non-stop 100 km/h cruising. Ensure vehicle tyre pressure is checked before entering expressway.",
      hi: "Non-stop 100 km/h cruising. Ensure vehicle tyre pressure is checked before entering expressway.",
    },
    restStops: {
      en: "Official UPEIDA wayside food courts at Firozabad, Kannauj, and Saifai.",
      hi: "Official UPEIDA wayside food courts at Firozabad, Kannauj, and Saifai.",
    },
    tollTaxPolicy: {
      en: "Expressway toll included for one-way journeys.",
      hi: "Expressway toll included for one-way journeys.",
    },
  },
  "agra-local": {
    highway: "Agra City Circuit & Fatehabad Road",
    transitTime: "8 Hours / 80 Kilometers",
    departureTip: {
      en: "Start by 08:30 AM at Taj Mahal East Gate, followed by Agra Fort, Baby Taj, and sunset at Mehtab Bagh.",
      hi: "Start by 08:30 AM at Taj Mahal East Gate, followed by Agra Fort, Baby Taj, and sunset at Mehtab Bagh.",
    },
    restStops: {
      en: "Pinch of Spice, Dasaprakash, and Joney's Place for lunch; Sadar Bazaar for evening tea.",
      hi: "Pinch of Spice, Dasaprakash, and Joney's Place for lunch; Sadar Bazaar for evening tea.",
    },
    tollTaxPolicy: {
      en: "Includes fuel, driver allowance, and city parking. Extra km at ₹11/km (sedan) and extra hr at ₹150/hr.",
      hi: "Includes fuel, driver allowance, and city parking. Extra km at ₹11/km (sedan) and extra hr at ₹150/hr.",
    },
  },
};

export const airportTransfers: readonly AirportTransfer[] = [
  { id: "agra-station", name: "Agra Cantt / Fort Railway Station Transfer", fares: { sedan: 800, ertiga: 900, innova: 1100, tempo: 2200, urbania: 3500 } },
  { id: "agra-airport", name: "Agra Kheria Airport (AGR) Transfer", fares: { sedan: 900, ertiga: 1000, innova: 1250, tempo: 2500, urbania: 3800 } },
  { id: "delhi-airport", name: "Delhi IGI Airport (DEL) ⇄ Agra Express Transfer", fares: { sedan: 3499, ertiga: 4499, innova: 6499, tempo: 9500, urbania: 14000 } },
];

export const packages: readonly TourPackage[] = [
  {
    id: "agra-day",
    slug: "agra-sightseeing",
    name: "Same Day Agra Taj Mahal Tour",
    kicker: "Same day",
    duration: "1 day",
    from: 3499,
    image: "/assets/packages/taj-dawn.webp",
    gallery: [
      { url: "/assets/places/gallery/taj-mahal-01.jpg", caption: "Taj Mahal reflection pool at golden dawn", alt: "Taj Mahal reflection pool dawn Agra" },
      { url: "/assets/places/gallery/agra-fort-01.jpg", caption: "Grand Amar Singh Gate at Agra Red Fort", alt: "Agra Fort red sandstone entrance gate" },
      { url: "/assets/places/gallery/mehtab-bagh-01.jpg", caption: "Sunset vantage point over Yamuna", alt: "Mehtab Bagh sunset over Taj Mahal" },
      { url: "/assets/places/gallery/taj-mahal-02.jpg", caption: "Intricate marble archways & minarets", alt: "Taj Mahal dome architecture" },
    ],
    places: ["Taj Mahal", "Agra Fort", "Itimad-ud-Daulah (Baby Taj)", "Mehtab Bagh"],
    blurb: "One-day private guided tour covering all iconic Mughal monuments with doorstep hotel or station pickup.",
    includes: ["Private AC vehicle", "Professional chauffeur", "All tolls, parking & state tax", "Guide assistance", "Bottled water"],
    excludes: ["Monument tickets", "Meals"],
    timeline: [
      { time: "06:00 AM", title: { en: "Doorstep Pickup", hi: "Doorstep Pickup" }, desc: { en: "Chauffeur arrives at your hotel or residence in Delhi NCR / Agra.", hi: "Chauffeur arrives at your hotel or residence in Delhi NCR / Agra." } },
      { time: "09:30 AM", title: { en: "Taj Mahal Guided Visit", hi: "Taj Mahal Guided Visit" }, desc: { en: "Explore the UNESCO World Heritage marble mausoleum with historical insights.", hi: "Explore the UNESCO World Heritage marble mausoleum with historical insights." } },
      { time: "01:00 PM", title: { en: "Mughal Buffet Lunch", hi: "Mughal Buffet Lunch" }, desc: { en: "Relaxed lunch at a verified multi-cuisine restaurant.", hi: "Relaxed lunch at a verified multi-cuisine restaurant." } },
      { time: "02:30 PM", title: { en: "Agra Fort & Baby Taj", hi: "Agra Fort & Baby Taj" }, desc: { en: "Visit the red sandstone fort and the intricate jewel-box tomb.", hi: "Visit the red sandstone fort and the intricate jewel-box tomb." } },
      { time: "05:30 PM", title: { en: "Mehtab Bagh Sunset & Drop", hi: "Mehtab Bagh Sunset & Drop" }, desc: { en: "Catch sunset reflections across the Yamuna before return drop.", hi: "Catch sunset reflections across the Yamuna before return drop." } },
    ],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "Sedan (Dzire / Etios)" }, seats: "4+1", price: 3499 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "Ertiga MPV (6+1)" }, seats: "6+1", price: 4499 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "Innova Crysta (6+1)" }, seats: "6+1", price: 6499 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "Tempo Traveller (12-Seater)" }, seats: "12+1", price: 9500 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "Force Urbania Luxury Van" }, seats: "10+1", price: 14000 },
    ],
  },
  {
    id: "taj-sunrise",
    slug: "taj-mahal-sunrise-tour",
    name: "Taj Mahal Sunrise Tour",
    kicker: "Dawn special",
    duration: "1 day",
    from: 12999,
    image: "/assets/packages/taj-dawn.webp",
    gallery: [
      { url: "/assets/places/gallery/taj-mahal-02.jpg", caption: "Dawn glow across ivory marble", alt: "Taj Mahal at sunrise" },
      { url: "/assets/places/gallery/mehtab-bagh-02.jpg", caption: "Reflections from Charbagh gardens", alt: "Mehtab Bagh sunrise view" },
      { url: "/assets/places/gallery/taj-mahal-03.jpg", caption: "Intricate pietra dura floral inlays", alt: "Pietra dura marble inlay details" },
    ],
    places: ["Taj Mahal at Dawn", "Agra Fort", "Mehtab Bagh"],
    blurb: "Early 2:30 AM departure from Delhi to witness the breathtaking sunrise over the Taj Mahal before the crowds arrive.",
    includes: ["Dedicated luxury AC car", "Yamuna Expressway toll & taxes", "Sunrise guided entry", "Breakfast stop", "Agra Fort tour"],
    excludes: ["Monument tickets", "Personal expenses"],
  },
  {
    id: "mathura-vrindavan",
    slug: "mathura-vrindavan",
    name: "Mathura & Vrindavan Darshan",
    kicker: "Day trip",
    duration: "1 day",
    from: 4200,
    image: "/assets/packages/mathura.webp",
    gallery: [
      { url: "/assets/places/gallery/mathura-vrindavan-01.jpg", caption: "Prem Mandir & Banke Bihari illumination", alt: "Prem Mandir illuminated at night" },
      { url: "/assets/places/gallery/mathura-vrindavan-02.jpg", caption: "Sacred Yamuna Ghats at sunset", alt: "Yamuna river ghats Mathura" },
      { url: "/assets/places/gallery/mathura-vrindavan-03.jpg", caption: "Evening aarti ceremony at Vrindavan", alt: "Evening temple ceremony Vrindavan" },
    ],
    places: ["Krishna Janmabhoomi", "Dwarkadhish Temple", "Prem Mandir", "Banke Bihari"],
    blurb: "A spiritual day trip timed around sacred temple aarti schedules, with a local driver who knows the temple lanes.",
    includes: ["AC vehicle with fuel", "Temple parking & waiting", "Driver allowance", "Pickup & drop"],
    excludes: ["Temple donations", "Meals", "Special VIP line passes"],
  },
  {
    id: "gatimaan-express",
    slug: "gatimaan-express-agra-tour",
    name: "Same Day Agra by Gatimaan Train",
    kicker: "Fast train",
    duration: "1 day",
    from: 14999,
    image: "/assets/packages/agra-fort.webp",
    gallery: [
      { url: "/assets/places/gallery/agra-fort-02.jpg", caption: "Diwan-i-Khas marble royal pavilion", alt: "Diwan-i-Khas inside Agra Fort" },
      { url: "/assets/places/gallery/taj-mahal-01.jpg", caption: "Taj Mahal express afternoon visit", alt: "Taj Mahal express" },
    ],
    places: ["Gatimaan Express (100 mins)", "Taj Mahal", "Agra Fort", "Buffet Lunch"],
    blurb: "Travel on India's premier high-speed train from Delhi to Agra in 100 minutes. Includes train tickets, private AC car in Agra, and lunch.",
    includes: ["Roundtrip Gatimaan train tickets", "Delhi station transfers", "Private AC car in Agra", "Approved guide", "Buffet lunch"],
    excludes: ["Personal shopping", "Alcoholic beverages"],
  },
  {
    id: "agra-fort-day",
    slug: "agra-unhurried",
    name: "Agra Overnight Experience",
    kicker: "2 days",
    duration: "2 days / 1 night",
    from: 7800,
    image: "/assets/packages/agra-fort.webp",
    gallery: [
      { url: "/assets/places/gallery/agra-fort-03.jpg", caption: "Mughal courtyards & archways", alt: "Agra Fort royal courtyard" },
      { url: "/assets/places/gallery/fatehpur-sikri-01.jpg", caption: "Buland Darwaza imperial gate", alt: "Buland Darwaza at Fatehpur Sikri" },
      { url: "/assets/places/gallery/fatehpur-sikri-02.jpg", caption: "Panch Mahal royal pavilion", alt: "Panch Mahal palace" },
    ],
    places: ["Taj Mahal Dawn", "Agra Fort", "Fatehpur Sikri", "Mehtab Bagh Sunset"],
    blurb: "Stay overnight in Agra to capture sunset at Mehtab Bagh and sunrise at the Taj, with an excursion to royal Fatehpur Sikri.",
    includes: ["AC vehicle for 2 full days", "Driver overnight allowance", "Tolls & parking", "Fatehpur Sikri trip"],
    excludes: ["Hotel stay", "Monument entry tickets", "Meals"],
  },
  {
    id: "golden-triangle",
    slug: "golden-triangle",
    name: "Golden Triangle Tour",
    kicker: "3 days",
    duration: "3 days / 2 nights",
    from: 18500,
    image: "/assets/packages/golden-triangle.webp",
    gallery: [
      { url: "/assets/places/gallery/jaipur-pink-city-01.jpg", caption: "Hawa Mahal (Palace of Winds)", alt: "Hawa Mahal facade Jaipur" },
      { url: "/assets/places/gallery/taj-mahal-01.jpg", caption: "Agra Taj Mahal sunrise visit", alt: "Taj Mahal Agra" },
      { url: "/assets/places/gallery/jaipur-pink-city-02.jpg", caption: "Amber Fort hilltop ramparts", alt: "Amber Fort Jaipur" },
    ],
    places: ["Delhi", "Agra", "Fatehpur Sikri", "Jaipur"],
    blurb: "The iconic North India circuit — chauffeured, perfectly paced, and timed so monuments have breathing room.",
    includes: ["Dedicated AC car for 3 days", "Driver stay & fuel", "All interstate taxes & tolls", "Hotel pickups"],
    excludes: ["Hotels", "Monument tickets", "Meals"],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "Sedan (Dzire / Etios)" }, seats: "4+1", price: 18500 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "Ertiga MPV (6+1)" }, seats: "6+1", price: 22500 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "Innova Crysta (6+1)" }, seats: "6+1", price: 27500 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "Tempo Traveller (12-Seater)" }, seats: "12+1", price: 36500 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "Force Urbania Luxury Van" }, seats: "10+1", price: 45000 },
    ],
  },
  {
    id: "fatehpur-sikri",
    slug: "same-day-tour-of-fatehpur-sikri",
    name: "Same Day Fatehpur Sikri Royal Heritage Tour",
    kicker: "Royal citadel",
    duration: "1 day (40 km)",
    from: 2000,
    image: "/assets/packages/agra-fort.webp",
    places: ["Buland Darwaza", "Sheikh Salim Chishti Dargah", "Panch Mahal", "Jodha Bai Palace", "Diwan-i-Khas"],
    blurb: "Excursion to Emperor Akbar's red sandstone capital with guided exploration of Buland Darwaza and Salim Chishti tomb.",
    includes: ["Private AC vehicle", "Highway toll & parking", "Agra hotel pickup & drop", "Driver allowance"],
    excludes: ["Monument entry tickets", "Meals"],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "Sedan (Dzire / Etios)" }, seats: "4+1", price: 2000 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "Ertiga MPV (6+1)" }, seats: "6+1", price: 2700 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "Innova Crysta (6+1)" }, seats: "6+1", price: 3645 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "Tempo Traveller (12-Seater)" }, seats: "12+1", price: 5800 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "Force Urbania Luxury Van" }, seats: "10+1", price: 7500 },
    ],
  },
  {
    id: "jaipur-excursion",
    slug: "same-day-tour-of-jaipur",
    name: "Same Day Jaipur Pink City Excursion",
    kicker: "Pink City day tour",
    duration: "1 day (240 km)",
    from: 3499,
    image: "/assets/packages/golden-triangle.webp",
    places: ["Amber Fort & Maota Lake", "Hawa Mahal", "Jal Mahal", "City Palace Jaipur", "Jantar Mantar"],
    blurb: "Full-day private chauffeured excursion from Agra to Jaipur via NH-21, covering royal palaces, forts, and bazaars.",
    includes: ["Intercity AC taxi", "NH-21 tolls included", "Rajasthan state tax included", "Doorstep pickup & drop"],
    excludes: ["Monument tickets", "Meals"],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "Sedan (Dzire / Etios)" }, seats: "4+1", price: 3499 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "Ertiga MPV (6+1)" }, seats: "6+1", price: 4800 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "Innova Crysta (6+1)" }, seats: "6+1", price: 6499 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "Tempo Traveller (12-Seater)" }, seats: "12+1", price: 9800 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "Force Urbania Luxury Van" }, seats: "10+1", price: 11800 },
    ],
  },
  {
    id: "bharatpur-sanctuary",
    slug: "same-day-visit-of-bharatpur",
    name: "Bharatpur Keoladeo Bird Sanctuary Safari",
    kicker: "Wildlife corridor",
    duration: "1 day (55 km)",
    from: 2200,
    image: "/assets/packages/mathura.webp",
    places: ["Keoladeo National Park (UNESCO)", "Sarus Crane Wetland", "Lohagarh Fort", "Deeg Palace Water Gardens"],
    blurb: "Day journey to the world-renowned UNESCO Keoladeo Ghana Bird Sanctuary with seamless Agra round-trip cab transfer.",
    includes: ["Private AC vehicle with fuel", "Sanctuary parking & toll fees", "Rajasthan interstate permit", "Driver waiting"],
    excludes: ["Park admission & cycle-rickshaw tariff", "Meals"],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "Sedan (Dzire / Etios)" }, seats: "4+1", price: 2200 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "Ertiga MPV (6+1)" }, seats: "6+1", price: 2900 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "Innova Crysta (6+1)" }, seats: "6+1", price: 3800 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "Tempo Traveller (12-Seater)" }, seats: "12+1", price: 5800 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "Force Urbania Luxury Van" }, seats: "10+1", price: 7200 },
    ],
  },
  {
    id: "delhi-landmarks",
    slug: "10-iconic-attractions-and-places-to-visit-in-delhi",
    name: "Delhi 10 Iconic Landmarks Heritage Circuit",
    kicker: "Capital highlights",
    duration: "1 day (230 km)",
    from: 3499,
    image: "/assets/packages/golden-triangle.webp",
    places: ["Qutub Minar", "Humayun's Tomb", "India Gate", "Red Fort", "Lotus Temple", "Akshardham", "Rashtrapati Bhavan"],
    blurb: "Explore the historic heart of the national capital with Yamuna Expressway high-speed transit directly from Agra.",
    includes: ["Expressway tolls included", "Delhi commercial passenger permit", "Full Delhi city mobility", "Doorstep pickup"],
    excludes: ["Monument tickets", "Meals"],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "Sedan (Dzire / Etios)" }, seats: "4+1", price: 3499 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "Ertiga MPV (6+1)" }, seats: "6+1", price: 4800 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "Innova Crysta (6+1)" }, seats: "6+1", price: 6499 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "Tempo Traveller (12-Seater)" }, seats: "12+1", price: 9500 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "Force Urbania Luxury Van" }, seats: "10+1", price: 11500 },
    ],
  },
  {
    id: "agra-markets",
    slug: "visit-the-best-markets-in-agra-to-shop-book-agra-taxi-for-shop",
    name: "Agra Heritage Markets & Artisan Craft Tour",
    kicker: "Artisan shopping",
    duration: "1 day (8h / 80km)",
    from: 1900,
    image: "/assets/packages/taj-dawn.webp",
    places: ["Sadar Bazaar (Leather & Handicrafts)", "Kinari Bazaar (Zardozi)", "Marble Inlay Workshops", "Panchi Petha Emporium"],
    blurb: "Chauffeured shopping tour with zero parking hassles, luggage custody in vehicle, and verified authentic artisan stops.",
    includes: ["Dedicated city car (8 Hours / 80 KM)", "Driver waiting at every market", "Zero parking stress", "Luggage safety"],
    excludes: ["Personal shopping expenses", "Meals"],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "Sedan (Dzire / Etios)" }, seats: "4+1", price: 1900 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "Ertiga MPV (6+1)" }, seats: "6+1", price: 2600 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "Innova Crysta (6+1)" }, seats: "6+1", price: 2850 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "Tempo Traveller (12-Seater)" }, seats: "12+1", price: 5500 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "Force Urbania Luxury Van" }, seats: "10+1", price: 7500 },
    ],
  },
  {
    id: "agra-complete",
    slug: "everything-you-should-know-about-agra-tourism-get-the-best-car-rent-service-in-agra",
    name: "Agra Complete Tourism & Monument Odyssey",
    kicker: "Comprehensive Agra",
    duration: "1 day (12h / 120km)",
    from: 2200,
    image: "/assets/packages/taj-dawn.webp",
    places: ["Taj Mahal", "Agra Fort", "Itimad-ud-Daulah (Baby Taj)", "Mehtab Bagh", "Akbar's Tomb Sikandra", "Chini Ka Rauza"],
    blurb: "The ultimate Agra heritage day covering all six major Mughal monuments with a dedicated chauffeur for 12 hours.",
    includes: ["12-hour continuous vehicle custody", "120 km city allowance", "Chilled bottled water", "All city tolls & parking"],
    excludes: ["Monument tickets", "Meals"],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "Sedan (Dzire / Etios)" }, seats: "4+1", price: 2200 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "Ertiga MPV (6+1)" }, seats: "6+1", price: 2900 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "Innova Crysta (6+1)" }, seats: "6+1", price: 3400 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "Tempo Traveller (12-Seater)" }, seats: "12+1", price: 6200 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "Force Urbania Luxury Van" }, seats: "10+1", price: 8500 },
    ],
  },
  {
    id: "golden-triangle-4d",
    slug: "golden-triangle-tour-3-nights-4-days",
    name: "Golden Triangle Grand Tour (4 Days / 3 Nights)",
    kicker: "4 days / 3 nights",
    duration: "4 days / 3 nights",
    from: 24000,
    image: "/assets/packages/golden-triangle.webp",
    places: ["Delhi Historic Monuments", "Agra Taj Mahal Dawn", "Fatehpur Sikri", "Chand Baori Stepwell", "Jaipur Royal Palaces"],
    blurb: "Unhurried, comprehensive 4-day private chauffeured expedition through Delhi, Agra, Fatehpur Sikri, and Jaipur.",
    includes: ["Dedicated car for 4 continuous days", "Driver night stays & allowances", "All interstate permits (UP, DL, RJ)", "Highway tolls"],
    excludes: ["Hotel stays", "Monument entry tickets", "Meals"],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "Sedan (Dzire / Etios)" }, seats: "4+1", price: 24000 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "Ertiga MPV (6+1)" }, seats: "6+1", price: 29000 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "Innova Crysta (6+1)" }, seats: "6+1", price: 35000 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "Tempo Traveller (12-Seater)" }, seats: "12+1", price: 47000 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "Force Urbania Luxury Van" }, seats: "10+1", price: 58000 },
    ],
  },
];

export const services: readonly Service[] = [
  {
    id: "oneway",
    index: "01",
    variant: "navy",
    title: "One-Way Outstation Drop",
    body: "Point-to-point intercity drops on expressway corridors. Verified fixed fares, no hidden return charges.",
    tags: ["DELHI ₹3,499", "JAIPUR ₹3,499", "EXPRESSWAY"],
    href: "/en/routes/",
    cta: "View all routes",
  },
  {
    id: "roundtrip",
    index: "02",
    variant: "light",
    title: "Outstation Round-Trip",
    body: "Multi-day chauffeured outstation travel. Transparent 300 km/day billing with clean cars and verified drivers.",
    tags: ["MIN 300 KM/DAY", "ALL INDIA PERMIT"],
    href: "/en/routes/",
    cta: "Calculate round-trip",
  },
  {
    id: "local",
    index: "03",
    variant: "gold",
    title: "Local Sightseeing & City Tours",
    body: "Dedicated 8 Hours / 80 KM and 12 Hours / 120 KM sightseeing packages covering Taj Mahal, Agra Fort, and Mehtab Bagh.",
    tags: ["8H / 80KM ₹1,900", "12H / 120KM ₹2,200"],
    href: "/en/packages/",
    cta: "Explore city tours",
  },
  {
    id: "airport",
    index: "04",
    variant: "light",
    title: "Airport & Station Transfers",
    body: "Reliable, on-time pickups for Delhi IGI Airport, Agra Cantt, Agra Airport, and Gatimaan Express arrivals.",
    tags: ["AGRA CANTT ₹800", "DELHI AIRPORT ₹3,499"],
    href: "/en/fleet/",
    cta: "Book a transfer",
  },
  {
    id: "tempo",
    index: "05",
    variant: "navy",
    title: "Tempo Traveller & Urbania",
    body: "Spacious group travel from 9 to 26 seats with individual AC vents, pushback seats, and ample luggage bays.",
    tags: ["9–26 SEATER", "LUXURY URBANIA"],
    href: "/en/fleet/",
    cta: "Explore group fleet",
  },
  {
    id: "tours",
    index: "06",
    variant: "gold",
    title: "Curated Tour Packages",
    body: "Handcrafted same-day and multi-day heritage circuits including Sunrise Taj, Mathura-Vrindavan, and Golden Triangle.",
    tags: ["SAME DAY ₹3,499", "GOLDEN TRIANGLE ₹18,500"],
    href: "/en/packages/",
    cta: "View all packages",
  },
];

export type AgraMonument = {
  id: string;
  name: string;
  location: string;
  timings: string;
  builtBy: string;
  builtIn: string;
  blurb: Record<SupportedLanguage, string>;
};

export type TouristDestination = {
  id: string;
  name: string;
  state: string;
  distanceKm: number;
  tagline: Record<SupportedLanguage, string>;
  highlights: readonly string[];
  blurb: Record<SupportedLanguage, string>;
};

export const reviews: readonly Review[] = [
  {
    name: "Vikram Malhotra",
    place: "Delhi",
    role: "Delhi to Agra Roundtrip",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    quote: "Sedan arrived 15 mins early at Delhi T3. Transparent ₹3,500 fare with all tolls included. Best taxi service in Agra!",
  },
  {
    name: "Elena Rostova",
    place: "London",
    role: "Taj Sunrise Tour",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    quote: "Spotless Innova Crysta with courteous English-speaking chauffeur. Taj sunrise tour was completely hassle-free.",
  },
  {
    name: "Rajesh & Sunita Sharma",
    place: "Agra",
    role: "Mathura-Vrindavan Pilgrimage",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    quote: "Booked Tempo Traveller for 12 family members. Punctual, safe driving along Yamuna Expressway and patient temple stops.",
  },
  {
    name: "David Miller",
    place: "California",
    role: "Golden Triangle Traveler",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    quote: "Reliable dispatch via WhatsApp, verified driver, no commission shop traps. Pure hospitality and transparent pricing.",
  },
  {
    name: "Vijay Kumar",
    place: "Agra",
    role: "Local Sightseeing Tour",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    quote: "Booked taxi service for local sightseeing and had a very smooth experience. The car was clean, driver was polite, and everything was on time.",
  },
  {
    name: "Ananya Singhal",
    place: "Gurugram",
    role: "Corporate Travel Manager",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    quote: "Regular vendor for our executives visiting Agra. Official booking receipts delivered instantly with pristine fleet.",
  },
  {
    name: "Marcus Vance",
    place: "London",
    role: "Photographer & Explorer",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    quote: "Driver knew optimal timing for Mehtab Bagh sunset and Fatehpur Sikri lighting. Exceptional experience!",
  },
  {
    name: "Priya Nair",
    place: "Jaipur",
    role: "Jaipur to Agra Route",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    quote: "Comfortable outstation cab with child seat accommodated. Driver was attentive and polite throughout the 5-hour drive.",
  },
  {
    name: "Dr. Arvind Gupta",
    place: "Delhi",
    role: "Senior Citizen Pilgrimage",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    quote: "Special care given to elderly parents at Agra Cantt station. AC was comfortable and driving was very gentle.",
  },
  {
    name: "Meera K.",
    place: "Lucknow",
    role: "Family Wedding Group",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80",
    quote: "Tempo Traveller for a family wedding party — ice-box, luggage bay, and a calm, courteous driver.",
  },
];

export const agraMonuments: readonly AgraMonument[] = [
  {
    id: "taj-mahal",
    name: "Taj Mahal",
    location: "Dharmapuri, Forest Colony, Tajganj, Agra 282001",
    timings: "6:00 AM to 6:30 PM (Closed Fridays)",
    builtBy: "Shah Jahan",
    builtIn: "1631 – 1648",
    blurb: {
      en: "The iconic white marble mausoleum and UNESCO World Heritage wonder built on the banks of the Yamuna River.",
      hi: "The iconic white marble mausoleum and UNESCO World Heritage wonder built on the banks of the Yamuna River.",
    },
  },
  {
    id: "agra-fort",
    name: "Agra Red Fort",
    location: "Agra Fort, Rakabganj, Agra 282003",
    timings: "6:00 AM to 6:00 PM",
    builtBy: "Mughal Emperor Akbar",
    builtIn: "1565",
    blurb: {
      en: "Massive 16th-century red sandstone fortress that served as the imperial seat of the Mughal dynasty.",
      hi: "Massive 16th-century red sandstone fortress that served as the imperial seat of the Mughal dynasty.",
    },
  },
  {
    id: "fatehpur-sikri",
    name: "Fatehpur Sikri",
    location: "Fatehpur Sikri, Agra District, UP 283110",
    timings: "6:00 AM to 6:00 PM",
    builtBy: "Emperor Akbar",
    builtIn: "1571",
    blurb: {
      en: "Preserved royal ghost city boasting the magnificent Buland Darwaza and Salim Chishti Dargah.",
      hi: "Preserved royal ghost city boasting the magnificent Buland Darwaza and Salim Chishti Dargah.",
    },
  },
  {
    id: "itmad-ud-daulah",
    name: "Itmad-Ud-Daulah (Baby Taj)",
    location: "Moti Bagh, Agra 282006",
    timings: "8:00 AM to 12:00 AM",
    builtBy: "Noor Jahan",
    builtIn: "1622 – 1628",
    blurb: {
      en: "Delicate marble tomb renowned as the 'Jewel Box' and architectural precursor to the Taj Mahal.",
      hi: "Delicate marble tomb renowned as the 'Jewel Box' and architectural precursor to the Taj Mahal.",
    },
  },
  {
    id: "mehtab-bagh",
    name: "Mehtab Bagh",
    location: "Opposite Taj Mahal, Nagla Devjit, Agra 282001",
    timings: "6:00 AM to 9:00 PM",
    builtBy: "Emperor Babur / Shah Jahan",
    builtIn: "Early 1500s / 1631",
    blurb: {
      en: "Charbagh complex across the river offering the quintessential sunset reflection of the Taj Mahal.",
      hi: "Charbagh complex across the river offering the quintessential sunset reflection of the Taj Mahal.",
    },
  },
  {
    id: "sikandra-fort",
    name: "Sikandra (Akbar's Tomb)",
    location: "Tomb of Akbar The Great, Sikandra, Agra 282007",
    timings: "8:00 AM to 6:00 PM",
    builtBy: "Akbar & Jahangir",
    builtIn: "1605 – 1613",
    blurb: {
      en: "Majestic five-tiered sandstone and marble tomb set amidst lush gardens with roaming deer.",
      hi: "Majestic five-tiered sandstone and marble tomb set amidst lush gardens with roaming deer.",
    },
  },
  {
    id: "jama-masjid",
    name: "Jama Masjid Agra",
    location: "Kinari Bazar, Subhash Bazar, Mantola, Agra 282003",
    timings: "8:00 AM to 6:00 PM",
    builtBy: "Shah Jahan",
    builtIn: "1648 A.D.",
    blurb: {
      en: "Historic red sandstone congregational mosque built by Shah Jahan dedicated to his daughter Jahanara Begum.",
      hi: "Historic red sandstone congregational mosque built by Shah Jahan dedicated to his daughter Jahanara Begum.",
    },
  },
  {
    id: "moti-masjid",
    name: "Moti Masjid (Pearl Mosque)",
    location: "Inside Agra Fort Complex, Rakabganj, Agra 282003",
    timings: "8:00 AM to 6:00 PM",
    builtBy: "Shah Jahan",
    builtIn: "1648 A.D.",
    blurb: {
      en: "Gleaming pure white marble mosque situated inside the Agra Fort complex overlooking the Yamuna.",
      hi: "Gleaming pure white marble mosque situated inside the Agra Fort complex overlooking the Yamuna.",
    },
  },
  {
    id: "jodha-bai-rauza",
    name: "Jodha Bai Ka Rauza",
    location: "Fatehpur Sikri / Arjun Nagar, Agra",
    timings: "10:00 AM to 7:00 PM",
    builtBy: "Mughal Emperor Akbar",
    builtIn: "16th century",
    blurb: {
      en: "Grand architectural fusion of Hindu Rajputana and Mughal styles built to honor Empress Mariam-uz-Zamani (Jodha Bai).",
      hi: "Grand architectural fusion of Hindu Rajputana and Mughal styles built to honor Empress Mariam-uz-Zamani (Jodha Bai).",
    },
  },
  {
    id: "mariam-uz-zamani",
    name: "Mariam-Uz-Zamani Tomb",
    location: "Mathura Rd, Kailash Mode, Sikandra, Agra 282007",
    timings: "10:00 AM to 7:00 PM",
    builtBy: "Jahangir",
    builtIn: "1611 A.D.",
    blurb: {
      en: "Serene Mughal garden tomb built by Emperor Jahangir for his mother Mariam-uz-Zamani.",
      hi: "Serene Mughal garden tomb built by Emperor Jahangir for his mother Mariam-uz-Zamani.",
    },
  },
];

export const outstationDestinations: readonly TouristDestination[] = [
  {
    id: "gwalior",
    name: "Gwalior",
    state: "Madhya Pradesh",
    distanceKm: 120,
    tagline: { en: "City of Forts, Music & Royal Palaces", hi: "City of Forts, Music & Royal Palaces" },
    highlights: ["Gwalior Fort", "Jai Vilas Palace", "Gujari Mahal", "Teli Ka Mandir", "Scindia Museum"],
    blurb: {
      en: "Historical powerhouse featuring the impregnable 15th-century Gwalior Fort and the opulent Italian-designed Jai Vilas Palace.",
      hi: "Historical powerhouse featuring the impregnable 15th-century Gwalior Fort and the opulent Italian-designed Jai Vilas Palace.",
    },
  },
  {
    id: "nainital",
    name: "Nainital",
    state: "Uttarakhand",
    distanceKm: 340,
    tagline: { en: "The Pristine Lake City in the Kumaon Hills", hi: "The Pristine Lake City in the Kumaon Hills" },
    highlights: ["Naini Lake", "Naina Devi Temple", "Snow View Point", "Bhimtal", "Sattal Lake"],
    blurb: {
      en: "Scenic hill station nestled around emerald lunar-shaped Naini Lake at 1,938 meters altitude with snow-capped Himalayan vistas.",
      hi: "Scenic hill station nestled around emerald lunar-shaped Naini Lake at 1,938 meters altitude with snow-capped Himalayan vistas.",
    },
  },
  {
    id: "corbett",
    name: "Jim Corbett National Park",
    state: "Uttarakhand",
    distanceKm: 380,
    tagline: { en: "India's Oldest Tiger Reserve & Wildlife Haven", hi: "India's Oldest Tiger Reserve & Wildlife Haven" },
    highlights: ["Bengal Tiger Safari", "Dhikala Zone", "Jhirna Zone", "Corbett Falls", "Kosi River"],
    blurb: {
      en: "Established in 1936 as Hailey National Park, the cradle of Project Tiger boasting 5 diverse forest zones and rich wildlife.",
      hi: "Established in 1936 as Hailey National Park, the cradle of Project Tiger boasting 5 diverse forest zones and rich wildlife.",
    },
  },
  {
    id: "dholpur",
    name: "Dholpur",
    state: "Rajasthan",
    distanceKm: 55,
    tagline: { en: "Ancient Red Sandstone & Sacred Heritage", hi: "Ancient Red Sandstone & Sacred Heritage" },
    highlights: ["Machkund Temple", "Damoh Waterfall", "Shergarh Fort", "Van Vihar Sanctuary", "Khanpur Mahal"],
    blurb: {
      en: "Historic city dating back to Mahabharata times, celebrated for the sacred Muchukund pilgrim kund and Damoh waterfalls.",
      hi: "Historic city dating back to Mahabharata times, celebrated for the sacred Muchukund pilgrim kund and Damoh waterfalls.",
    },
  },
  {
    id: "bharatpur",
    name: "Bharatpur",
    state: "Rajasthan",
    distanceKm: 56,
    tagline: { en: "World-Renowned UNESCO Keoladeo Bird Sanctuary", hi: "World-Renowned UNESCO Keoladeo Bird Sanctuary" },
    highlights: ["Keoladeo National Park", "Lohagarh Fort", "Deeg Palace", "Ganga Mandir", "Government Museum"],
    blurb: {
      en: "UNESCO World Heritage bird paradise welcoming thousands of migratory birds, alongside the unbreached Lohagarh Fort.",
      hi: "UNESCO World Heritage bird paradise welcoming thousands of migratory birds, alongside the unbreached Lohagarh Fort.",
    },
  },
  {
    id: "mathura-vrindavan",
    name: "Mathura & Vrindavan",
    state: "Uttar Pradesh",
    distanceKm: 55,
    tagline: { en: "The Divine Brijbhoomi & Sacred Krishna Circuit", hi: "The Divine Brijbhoomi & Sacred Krishna Circuit" },
    highlights: ["Krishna Janmabhoomi", "Banke Bihari Mandir", "Prem Mandir", "Dwarkadhish Temple", "ISKCON"],
    blurb: {
      en: "The sacred spiritual heartland on the banks of Yamuna celebrating Lord Krishna's divine leelas with evening aartis.",
      hi: "The sacred spiritual heartland on the banks of Yamuna celebrating Lord Krishna's divine leelas with evening aartis.",
    },
  },
  {
    id: "alwar-sariska",
    name: "Alwar & Sariska",
    state: "Rajasthan",
    distanceKm: 160,
    tagline: { en: "Aravalli Wilderness, Palaces & Mysterious Forts", hi: "Aravalli Wilderness, Palaces & Mysterious Forts" },
    highlights: ["Sariska Tiger Reserve", "Bhangarh Fort", "Siliserh Lake", "Bala Quila", "Neemrana Fort"],
    blurb: {
      en: "Dramatic Aravalli destination combining Sariska wildlife sightings with the historic Bala Quila and legendary Bhangarh.",
      hi: "Dramatic Aravalli destination combining Sariska wildlife sightings with the historic Bala Quila and legendary Bhangarh.",
    },
  },
];

export const petFriendlyService = {
  enabled: false,
  title: { en: "Pet-Friendly Cabs in Agra", hi: "Pet-Friendly Cabs in Agra" },
  blurb: {
    en: "Travel comfortably across Agra and outstation destinations with your dogs, cats, and pets. Dedicated sanitized vehicles with carrier space and scheduled relief stops.",
    hi: "Travel comfortably across Agra and outstation destinations with your dogs, cats, and pets. Dedicated sanitized vehicles with carrier space and scheduled relief stops.",
  },
  couponCode: "",
} as const;

export const promoCodes: Readonly<Record<string, PromoCode>> = {};

export const trustSignals = [
  "GOVT-REGISTERED FLEET",
  "VERIFIED DRIVERS",
  "booking receipt INVOICE",
  "4.9/5 · 3,800+ GOOGLE REVIEWS",
  "24×7 ON-ROUTE SUPPORT",
  "GPS-TRACKED SANITIZED CABS",
] as const;

export const cancellationPolicyCab = {
  en: "Free cancellation up to 24 hours before pickup for a 100% refund (credited via original payment method in 5–7 business days). Cancellations within 24 hours may be subject to partial advance retention. No refund for no-shows.",
  hi: "Free cancellation up to 24 hours before pickup for a 100% refund (credited via original payment method in 5–7 business days). Cancellations within 24 hours may be subject to partial advance retention. No refund for no-shows.",
} as const;

export const cancellationSlabsTour: readonly TourCancellationSlab[] = [
  { days: "61+ days", fee: "0%", refund: "100%" },
  { days: "46–60 days", fee: "10%", refund: "90%" },
  { days: "31–45 days", fee: "20%", refund: "80%" },
  { days: "16–30 days", fee: "30%", refund: "70%" },
  { days: "6–15 days", fee: "55%", refund: "45%" },
  { days: "0–5 days", fee: "100%", refund: "0%" },
];

export const outstationRules = {
  minKmPerDay: 300,
  nightAllowanceCab: 300,
  nightAllowanceTempo: 500,
  nightStartHour: 20,
  nightEndHour: 6,
} as const;

export const faqs: readonly FaqItem[] = [
  {
    category: "booking",
    question: { en: "How does the advance payment work?", hi: "How does the advance payment work?" },
    answer: {
      en: "You pay a 28% advance deposit (minimum ₹500) online to secure the chauffeur and vehicle. The remaining balance is paid directly to the driver at the start or completion of your trip.",
      hi: "You pay a 28% advance deposit (minimum ₹500) online to secure the chauffeur and vehicle. The remaining balance is paid directly to the driver at the start or completion of your trip.",
    },
  },
  {
    category: "cancellation",
    question: { en: "What is the cancellation and refund policy?", hi: "What is the cancellation and refund policy?" },
    answer: {
      en: "For cab bookings, free cancellation is available up to 24 hours before pickup for a 100% refund (credited in 5–7 business days). Tour packages follow a tiered refund schedule based on notice days.",
      hi: "For cab bookings, free cancellation is available up to 24 hours before pickup for a 100% refund (credited in 5–7 business days). Tour packages follow a tiered refund schedule based on notice days.",
    },
  },
  {
    category: "fares",
    question: { en: "Are highway tolls, state tax, and parking included?", hi: "Are highway tolls, state tax, and parking included?" },
    answer: {
      en: "All our one-way expressway fares (such as Agra–Delhi ₹3,499) are 100% all-inclusive (toll, state permits, and driver charges included). For outstation round-trips, tolls and parking are billed at actuals.",
      hi: "All our one-way expressway fares (such as Agra–Delhi ₹3,499) are 100% all-inclusive (toll, state permits, and driver charges included). For outstation round-trips, tolls and parking are billed at actuals.",
    },
  },
  {
    category: "night",
    question: { en: "What is the night driving allowance?", hi: "What is the night driving allowance?" },
    answer: {
      en: "For outstation pickups between 08:00 PM (20:00) and 06:00 AM, a flat driver night allowance of ₹300 for cars and ₹500 for Tempo Travellers is added to the fare.",
      hi: "For outstation pickups between 08:00 PM (20:00) and 06:00 AM, a flat driver night allowance of ₹300 for cars and ₹500 for Tempo Travellers is added to the fare.",
    },
  },
  {
    category: "outstation",
    question: { en: "How are outstation round-trips billed?", hi: "How are outstation round-trips billed?" },
    answer: {
      en: "Outstation round trips follow the standard tourism industry benchmark of minimum 300 KM per calendar day, or the 1.85× base route formula, whichever accurately covers the itinerary.",
      hi: "Outstation round trips follow the standard tourism industry benchmark of minimum 300 KM per calendar day, or the 1.85× base route formula, whichever accurately covers the itinerary.",
    },
  },
  {
    category: "pet",
    question: { en: "Can I travel with my pets in your taxis?", hi: "Can I travel with my pets in your taxis?" },
    answer: {
      en: "To ensure maximum vehicle hygiene, allergen safety, and upholstery comfort for subsequent guests, pets and domestic animals are strictly not permitted inside our cabs.",
      hi: "To ensure maximum vehicle hygiene, allergen safety, and upholstery comfort for subsequent guests, pets and domestic animals are strictly not permitted inside our cabs.",
    },
  },
  {
    category: "intercity",
    question: { en: "Is one-way intercity cab service available without paying return fare?", hi: "Is one-way intercity cab service available without paying return fare?" },
    answer: {
      en: "Yes, our one-way intercity taxi service covers Agra to Delhi, Noida, Gurgaon, Jaipur, and Lucknow at fixed all-inclusive rates without any return toll or empty-return charges.",
      hi: "Yes, our one-way intercity taxi service covers Agra to Delhi, Noida, Gurgaon, Jaipur, and Lucknow at fixed all-inclusive rates without any return toll or empty-return charges.",
    },
  },
];

export type BenefitItem = {
  id: string;
  title: Record<SupportedLanguage, string>;
  desc: Record<SupportedLanguage, string>;
};

export const coreBenefits: readonly BenefitItem[] = [
  {
    id: "easy-booking",
    title: { en: "Easy Booking", hi: "Easy Booking" },
    desc: {
      en: "Book your taxi in minutes with a simple, user-friendly and transparent process.",
      hi: "Book your taxi in minutes with a simple, user-friendly and transparent process.",
    },
  },
  {
    id: "multiple-fleets",
    title: { en: "Multiple Fleets", hi: "Multiple Fleets" },
    desc: {
      en: "Choose from clean Sedans, Ertiga, Innova Crysta, and 9–26 seater luxury Tempo Travellers.",
      hi: "Choose from clean Sedans, Ertiga, Innova Crysta, and 9–26 seater luxury Tempo Travellers.",
    },
  },
  {
    id: "lowest-fares",
    title: { en: "Lowest Fares", hi: "Lowest Fares" },
    desc: {
      en: "Book with confidence and enjoy authentic fixed fares starting at ₹10/KM with zero hidden fees.",
      hi: "Book with confidence and enjoy authentic fixed fares starting at ₹10/KM with zero hidden fees.",
    },
  },
  {
    id: "exciting-offers",
    title: { en: "Exciting Offers", hi: "Exciting Offers" },
    desc: {
      en: "Unlock seasonal tour deals and instant savings with verified promo coupons and transparent billing.",
      hi: "सत्यापित प्रोमो कूपन और पारदर्शी बिलिंग के साथ मौसमी टूर सौदों और तत्काल बचत का लाभ उठाएं।",
    },
  },
  {
    id: "on-time-service",
    title: { en: "On-Time Service", hi: "On-Time Service" },
    desc: {
      en: "Punctual airport transfers, railway pickups, and morning sunrise tours guaranteed.",
      hi: "Punctual airport transfers, railway pickups, and morning sunrise tours guaranteed.",
    },
  },
  {
    id: "24x7-support",
    title: { en: "24×7 Support", hi: "24×7 Support" },
    desc: {
      en: "Direct phone and WhatsApp support on route for complete peace of mind throughout India.",
      hi: "Direct phone and WhatsApp support on route for complete peace of mind throughout India.",
    },
  },
];

export const agraLocalities = [
  "Tajganj",
  "Sanjay Place",
  "Sikandra",
  "Kamla Nagar",
  "Ram Bagh",
  "Lohamandi",
  "Fatehabad Road",
  "Agra Cantt Railway Station",
  "Agra Fort Railway Station",
  "Agra Airport (Kheria)",
  "Dayal Bagh",
  "Sadar Bazaar",
  "Civil Lines",
  "MG Road",
  "Shah Ganj",
  "Bodla",
  "Delhi Gate",
  "Rakabganj",
  "VIP Road",
  "Transport Nagar",
  "Idgah Colony",
  "Tedi Bagiya",
  "Kalindi Vihar",
  "TDI City",
  "Bateshwar",
  "Dholpur House",
  "Khandari",
  "Bhagwan Talkies",
] as const;

export type LocalizedValue = Record<SupportedLanguage, string>;

