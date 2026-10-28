export interface VehicleFares {
  sedan: number;
  ertiga: number;
  crysta: number;
  tempo: number;
}

export interface RouteDetail {
  slug: string;
  h1: string;
  subheadline: string;
  type: "local" | "outstation";
  distance: string;
  duration: string;
  expressway?: string;
  landmarks: string[];
  stops: string[];
  fares: VehicleFares;
  faqs: { question: string; answer: string }[];
}

export const seoRoutes: RouteDetail[] = [
  // GROUP A: LOCAL AGRA & HERITAGE SIGHTSEEING
  {
    slug: "agra-local-full-day-tour",
    h1: "Agra Local Full-Day Heritage Tour Taxi Service",
    subheadline: "Explore the Taj Mahal, Agra Fort, and historic Mughal monuments with a local, experienced chauffeur.",
    type: "local",
    distance: "80 km",
    duration: "8 to 12 Hours",
    landmarks: ["Taj Mahal West Gate", "Agra Fort", "Itimad-ud-Daulah (Baby Taj)", "Mehtab Bagh"],
    stops: ["Fatehabad Road Handicrafts Hub", "Sadar Bazaar for local street food & shopping"],
    fares: { sedan: 2000, ertiga: 2800, crysta: 3800, tempo: 5500 },
    faqs: [
      { question: "Is the Taj Mahal entry ticket included in the fare?", answer: "No, monument entry tickets are not included. You can purchase them online or at the venue counters." },
      { question: "Are parking charges extra during the city tour?", answer: "All local toll and monument parking fees are transparently included in your fixed upfront quote." },
    ],
  },
  {
    slug: "agra-cantt-station-transfer",
    h1: "Agra Cantt Railway Station (AGC) Taxi Transfers",
    subheadline: "Assured on-time station pickups and drops with a 15-minute early driver arrival guarantee.",
    type: "local",
    distance: "15 km radius",
    duration: "30-45 Mins",
    landmarks: ["Agra Cantt Station (AGC)", "Raja Ki Mandi Station", "Agra Fort Railway Station"],
    stops: ["Direct platform exit pickup points", "Any hotel along Fatehabad Road or Taj Nagri"],
    fares: { sedan: 799, ertiga: 1199, crysta: 1799, tempo: 2499 },
    faqs: [
      { question: "What happens if my train to Agra Cantt is delayed?", answer: "We track live train statuses. Your driver will adjust their arrival time automatically with zero waiting fee penalties." },
    ],
  },
  {
    slug: "fatehpur-sikri-excursion",
    h1: "Same-Day Fatehpur Sikri & Buland Darwaza Tour",
    subheadline: "Travel safely via the NH21 highway corridor to explore Emperor Akbar's ancient red sandstone capital.",
    type: "local",
    distance: "90 km loop",
    duration: "5-6 Hours",
    landmarks: ["Fatehpur Sikri Archeological Complex", "Buland Darwaza", "Salim Chishti Dargah"],
    stops: ["NH21 highway mid-way rest plazas", "Local authentic food hubs near the complex monument site"],
    fares: { sedan: 2499, ertiga: 3499, crysta: 4499, tempo: 6499 },
    faqs: [
      { question: "Do cars go right up to the Buland Darwaza entrance?", answer: "Private vehicles park at the official lower lot. From there, eco-friendly local shuttle buses take you directly up the hill." },
    ],
  },
  {
    slug: "agra-to-sikandra-transfer",
    h1: "Agra to Sikandra (Akbar's Tomb) Taxi Tour",
    subheadline: "Quick, budget-friendly half-day loops optimized for corporate, solo, or time-constrained travelers.",
    type: "local",
    distance: "30 km loop",
    duration: "3-4 Hours",
    landmarks: ["Sikandra Tomb", "Guru Ka Tal Gurudwara", "Mathura Road Corridor"],
    stops: ["Highway artisan stores", "Traditional petha sweet counters along the Mathura-Agra road segment"],
    fares: { sedan: 1499, ertiga: 1999, crysta: 2799, tempo: 3999 },
    faqs: [
      { question: "Can we combine this half-day tour with a hotel drop-off?", answer: "Yes, our flexible pricing configuration covers complete door-to-door pickup and drop adjustments." },
    ],
  },
  {
    slug: "mughal-bazaar-shopping-circuit",
    h1: "Agra Mughal Bazaar & Shopping District Cab Rental",
    subheadline: "Spacious vehicles with wide luggage bays optimized for carrying heavy shopping hauls comfortably.",
    type: "local",
    distance: "50 km loop",
    duration: "6 Hours",
    landmarks: ["Sadar Bazaar", "Kinari Bazaar", "Subhash Bazaar", "Fatehabad Road Leather Markets"],
    stops: ["Authentic marble inlay factories", "Traditional Zardozi embroidery workshops"],
    fares: { sedan: 1799, ertiga: 2499, crysta: 3499, tempo: 4999 },
    faqs: [
      { question: "Will the driver wait with our shopping bags while we visit other markets?", answer: "Yes, the vehicle and driver remain exclusively dedicated to your party throughout the entire booking tenure." },
    ],
  },

  // GROUP B: INTER-CITY ONE-WAY & ROUND-TRIP CORRIDORS
  {
    slug: "agra-to-delhi-airport-taxi",
    h1: "Agra to Delhi IGI Airport One-Way Express Cabs",
    subheadline: "Fast, reliable transit via Yamuna Expressway directly to Indira Gandhi International Airport Terminal 3.",
    type: "outstation",
    distance: "240 km",
    duration: "3.5 Hours",
    expressway: "Yamuna Expressway & Noida-Greater Noida Expressway",
    landmarks: ["IGI Airport T3 Terminal", "IGI Airport T1 Terminal", "Aerocity Hub"],
    stops: ["Yamuna Expressway Milestone 95 Food Court", "Jewar International Airport Interchange Plaza"],
    fares: { sedan: 2499, ertiga: 3499, crysta: 4999, tempo: 7999 },
    faqs: [
      { question: "Are Yamuna Expressway toll fees included in the upfront fare?", answer: "Yes, our fixed pricing configuration includes all highway tolls, state permits, and FASTag service fees." },
    ],
  },
  {
    slug: "agra-to-delhi-ncr-drop",
    h1: "Agra to New Delhi, Noida & Gurgaon Outstation Taxi",
    subheadline: "Door-to-door city transfers for corporate travelers and families across the national capital region.",
    type: "outstation",
    distance: "230 km",
    duration: "3.5 Hours",
    expressway: "Yamuna Expressway & DND Flyway",
    landmarks: ["Connaught Place New Delhi", "Pari Chowk Greater Noida", "Cyber City Gurgaon"],
    stops: ["Mathura Expressway Toll Plaza Break Area", "Greater Noida Expressway Multi-Cuisine Food Courts"],
    fares: { sedan: 2399, ertiga: 3299, crysta: 4799, tempo: 7499 },
    faqs: [
      { question: "Can I book a multi-point drop across Noida and New Delhi?", answer: "Yes, custom route extensions can be arranged during verification with our centralized travel desk." },
    ],
  },
  {
    slug: "agra-to-jaipur-cab",
    h1: "Agra to Jaipur One-Way & Round-Trip Taxi Service",
    subheadline: "Cross the historic Golden Triangle corridor comfortably via the National Highway 21 network.",
    type: "outstation",
    distance: "245 km",
    duration: "4.5 Hours",
    expressway: "National Highway 21 (NH21)",
    landmarks: ["Hawa Mahal Jaipur", "Amer Fort Heritage Area", "Sindhi Camp Central Bus Terminal"],
    stops: ["Keoladeo National Bird Sanctuary (Bharatpur)", "Mahwa Midway Food Oasis Plaza", "Abhaneri Stepwell Diversion Point"],
    fares: { sedan: 2999, ertiga: 3999, crysta: 5499, tempo: 8999 },
    faqs: [
      { question: "Can we halt at the Bharatpur Bird Sanctuary mid-way?", answer: "Absolutely. Our round-trip and long-haul packages allow custom mid-route sightseeing layovers." },
    ],
  },
  {
    slug: "agra-to-mathura-vrindavan-taxi",
    h1: "Agra to Mathura & Vrindavan Krishna Circuit Cab",
    subheadline: "Dedicated spiritual tour transfers covering legendary temples with complete parking clearances.",
    type: "outstation",
    distance: "60 km",
    duration: "1.5 Hours",
    expressway: "National Highway 19 (NH19)",
    landmarks: ["Prem Mandir Vrindavan", "Banke Bihari Temple Access Ring", "Krishna Janmabhoomi Mathura"],
    stops: ["Vrindavan Chhatikara Road Multi-Tier Parking Structure", "Govardhan Parikrama Entry Corridor Drops"],
    fares: { sedan: 1499, ertiga: 1999, crysta: 2999, tempo: 4499 },
    faqs: [
      { question: "Will the cab take us directly to the temple gate entrances?", answer: "Heavy vehicle rules apply in Vrindavan town limits; our drivers drop you at designated, high-accessibility parking nodes." },
    ],
  },
  {
    slug: "agra-to-lucknow-expressway-taxi",
    h1: "Agra to Lucknow One-Way Premium Express Cab",
    subheadline: "Fly through India's longest access-controlled highway in absolute safety and luxury.",
    type: "outstation",
    distance: "335 km",
    duration: "4.5 Hours",
    expressway: "Agra-Lucknow Expressway",
    landmarks: ["Hazratganj Shopping Complex", "Charbagh Railway Station", "Chaudhary Charan Singh International Airport"],
    stops: ["Kannauj Toll Plaza Rest Hub", "Khalikabad Integrated Food Oasis & Refueling Bay"],
    fares: { sedan: 3999, ertiga: 5299, crysta: 6999, tempo: 11499 },
    faqs: [
      { question: "Are there safe family rest stops on the Agra-Lucknow Expressway?", answer: "Yes, the corridor features heavily monitored public utility plazas with clean food courts every 100 kilometers." },
    ],
  },
  {
    slug: "agra-to-gwalior-cab",
    h1: "Agra to Gwalior Outstation Highway Transfer",
    subheadline: "Smooth transit along National Highway 44 crossing the scenic Chambal region river corridors.",
    type: "outstation",
    distance: "120 km",
    duration: "2.5 Hours",
    expressway: "National Highway 44 (NH44)",
    landmarks: ["Gwalior Fort Entry Gate", "Jai Vilas Palace Museum", "Gwalior Junction Railway Station"],
    stops: ["Morena Highway Rest Plazas (Famous local Gajak sweet hubs)", "Dholpur Interstate Rajasthan Border Verification Point"],
    fares: { sedan: 1999, ertiga: 2699, crysta: 3799, tempo: 5999 },
    faqs: [
      { question: "Is there any border entry permit tax for driving into Madhya Pradesh?", answer: "Yes, all applicable interstate commercial transport border tax clearances are pre-calculated into your final invoice." },
    ],
  },
  {
    slug: "agra-to-kanpur-taxi",
    h1: "Agra to Kanpur Commercial Corridor Car Rental",
    subheadline: "Timely corporate inter-city transit tracking along the historic Grand Trunk road alignment.",
    type: "outstation",
    distance: "280 km",
    duration: "5 Hours",
    expressway: "National Highway 19 (NH19)",
    landmarks: ["Kanpur Central Station", "IIT Kanpur Campus Node", "Swaroop Nagar Corporate Blocks"],
    stops: ["Etawah Highway Bypass Crossing Zone", "Auraiya Food & Refreshment Service Centers"],
    fares: { sedan: 3299, ertiga: 4299, crysta: 5999, tempo: 9499 },
    faqs: [
      { question: "Can we schedule early morning corporate departures?", answer: "Yes, our commercial dispatch fleet operates continuously 24 hours a day, 7 days a week." },
    ],
  },
  {
    slug: "agra-to-haridwar-rishikesh-taxi",
    h1: "Agra to Haridwar & Rishikesh Pilgrimage Cab Tour",
    subheadline: "Long-haul outstation travel packages equipped with seasoned mountain-certified highway chauffeurs.",
    type: "outstation",
    distance: "410 km",
    duration: "7.5 Hours",
    expressway: "NH334 Highway Systems & Meerut Bypass",
    landmarks: ["Har Ki Pauri Haridwar", "Laxman Jhula Rishikesh Node", "Triveni Ghat Evening Aarti Arena"],
    stops: ["Muzaffarnagar Grand Highway Midway Hub", "Roorkee Engineering Corridor Rest Plazas"],
    fares: { sedan: 5499, ertiga: 6999, crysta: 9499, tempo: 14999 },
    faqs: [
      { question: "Are driver night halt charges billed separately?", answer: "No, night allowance packages are completely bundle-priced inside our final multi-day outstation quotes." },
    ],
  },
  {
    slug: "agra-to-ayodhya-dham-taxi",
    h1: "Agra to Ayodhya Dham Ram Mandir Route Cab",
    subheadline: "Direct temple perimeter drop services with express long-haul driver rotation security features.",
    type: "outstation",
    distance: "480 km",
    duration: "7 Hours",
    expressway: "Agra-Lucknow Expressway & NH27 Links",
    landmarks: ["Shri Ram Janmabhoomi Temple Ayodhya", "Lata Mangeshkar Chauraha Node", "Saryu River Ghats Area"],
    stops: ["Barabanki Outer Ring Road Refueling Stops", "Lucknow Expressway Extension Rest Zones"],
    fares: { sedan: 5999, ertiga: 7999, crysta: 10999, tempo: 16999 },
    faqs: [
      { question: "Can the vehicle stay with us for morning darshan the next day?", answer: "Yes, you can easily opt for a multi-day round trip design at a flat nominal daily extensions rate." },
    ],
  },
  {
    slug: "agra-to-bharatpur-gateway-taxi",
    h1: "Agra to Bharatpur Wildlife Weekend Taxi Rental",
    subheadline: "Quick interstate transit optimized for nature enthusiasts, birdwatchers, and family holiday groups.",
    type: "outstation",
    distance: "55 km",
    duration: "1.2 Hours",
    expressway: "National Highway 21 (NH21)",
    landmarks: ["Keoladeo National Park Main Entrance Gate", "Lohagarh Fort Complex", "Bharatpur Junction Station"],
    stops: ["Fatehpur Sikri Outer Bypass Crossing Point", "Rajasthan Border Toll Clearance Terminals"],
    fares: { sedan: 1299, ertiga: 1799, crysta: 2499, tempo: 3999 },
    faqs: [
      { question: "Is same-day return pricing cheaper for Bharatpur?", answer: "Yes, outstation day-rental standby packages offer maximum cost reductions for short-range round trips." },
    ],
  },
];

export const SEO_ROUTE_MAP: Record<string, RouteDetail> = Object.fromEntries(
  seoRoutes.map((route) => [route.slug, route])
);

// Curated concise titles (<= 60 chars) and meta descriptions (120-155 chars) for strict SEO compliance
export const SEO_ROUTE_METADATA: Record<string, { title: string; description: string }> = {
  "agra-local-full-day-tour": {
    title: "Agra Local Full-Day Heritage Tour Taxi | SK Baghel",
    description: "Explore Taj Mahal, Agra Fort, Baby Taj & Mehtab Bagh with an expert chauffeur. Transparent full-day fares from ₹2,000. Book 24x7.",
  },
  "agra-cantt-station-transfer": {
    title: "Agra Cantt Station Taxi Transfers | AGC Pickup",
    description: "Reliable Agra Cantt (AGC) station taxi pickups & hotel drops from ₹799. 15-min early arrival guarantee. Free delay tracking.",
  },
  "fatehpur-sikri-excursion": {
    title: "Fatehpur Sikri & Buland Darwaza Tour Taxi | SK Baghel",
    description: "Same-day Fatehpur Sikri & Buland Darwaza taxi tour from ₹2,499. Highway NH21 corridor travel in private AC cabs with local drivers.",
  },
  "agra-to-sikandra-transfer": {
    title: "Agra to Sikandra Akbar Tomb Taxi Tour | SK Baghel",
    description: "Quick half-day Agra to Sikandra taxi tour from ₹1,499. Visit Akbar's Tomb & Guru Ka Tal with doorstep hotel pickup and drop.",
  },
  "mughal-bazaar-shopping-circuit": {
    title: "Agra Mughal Bazaar & Shopping District Cab Rental",
    description: "Hire dedicated AC cabs for Sadar Bazaar, Kinari Bazaar & leather markets from ₹1,799. Wide luggage bays & patient waiting chauffeurs.",
  },
  "agra-to-delhi-airport-taxi": {
    title: "Agra to Delhi IGI Airport Taxi | One-Way Cab",
    description: "Fast Agra to Delhi IGI Airport (T3/T1) one-way taxi via Yamuna Expressway from ₹2,499. Tolls & FASTag included. 24x7 flight drop.",
  },
  "agra-to-delhi-ncr-drop": {
    title: "Agra to Delhi, Noida & Gurgaon Outstation Taxi",
    description: "Door-to-door one-way taxi from Agra to New Delhi, Noida & Gurgaon from ₹2,399 via Yamuna Expressway. Fixed rates, tolls included.",
  },
  "agra-to-jaipur-cab": {
    title: "Agra to Jaipur Taxi | One-Way & Round-Trip Cab",
    description: "Comfortable private cab from Agra to Jaipur via NH21 from ₹2,999. Optional halts at Bharatpur Bird Sanctuary & Abhaneri stepwell.",
  },
  "agra-to-mathura-vrindavan-taxi": {
    title: "Agra to Mathura & Vrindavan Krishna Circuit Cab",
    description: "Agra to Mathura & Vrindavan spiritual taxi tour from ₹1,499. Visit Prem Mandir, Banke Bihari & Janmabhoomi with parking clearances.",
  },
  "agra-to-lucknow-expressway-taxi": {
    title: "Agra to Lucknow Expressway Taxi | One-Way Cab",
    description: "Premium express cab from Agra to Lucknow via the 302-km expressway from ₹3,999. Fast 4.5-hour transit with sanitized AC fleet.",
  },
  "agra-to-gwalior-cab": {
    title: "Agra to Gwalior Outstation Taxi | NH44 Highway",
    description: "Agra to Gwalior private taxi via NH44 from ₹1,999. Visit Gwalior Fort & Jai Vilas Palace. Interstate border tax clearances included.",
  },
  "agra-to-kanpur-taxi": {
    title: "Agra to Kanpur Commercial Corridor Taxi | Cab",
    description: "Reliable intercity taxi from Agra to Kanpur from ₹3,299 via NH19. 24x7 commercial dispatch for corporate departures and family trips.",
  },
  "agra-to-haridwar-rishikesh-taxi": {
    title: "Agra to Haridwar & Rishikesh Pilgrimage Taxi",
    description: "Direct pilgrimage cab from Agra to Haridwar & Rishikesh from ₹5,499. Mountain-certified highway drivers with night allowance bundled.",
  },
  "agra-to-ayodhya-dham-taxi": {
    title: "Agra to Ayodhya Dham Ram Mandir Taxi | Cab",
    description: "Direct cab from Agra to Ayodhya Dham Ram Janmabhoomi Temple from ₹5,999 via Agra-Lucknow Expressway. Experienced long-haul drivers.",
  },
  "agra-to-bharatpur-gateway-taxi": {
    title: "Agra to Bharatpur Bird Sanctuary Taxi | Cab",
    description: "Quick interstate taxi from Agra to Bharatpur Keoladeo National Park from ₹1,299 via NH21. Ideal for wildlife day trips & weekend tours.",
  },
};

export const SEO_LANDING_SLUGS = [
  // Core fleet & vehicle rental landings
  "tempo-traveller-on-rent-agra",
  "12-seater-tempo-traveller-agra",
  "16-seater-tempo-traveller-agra",
  "18-seater-tempo-traveller-agra",
  "20-seater-tempo-traveller-agra",
  "24-seater-tempo-traveller-agra",
  "same-day-agra-tour-from-delhi",
  "delhi-to-agra-taxi",
  "taj-mahal-taxi-service",
  "agra-to-delhi-taxi",
  "agra-to-jaipur-taxi",
  "agra-to-mathura-taxi",
  "agra-to-gwalior-taxi",
  "agra-fatehpur-sikri-one-day-tour",
  "agra-local-sightseeing-taxi",
  "taj-mahal-sunrise-tour-package-by-car",
  "agra-to-lucknow-taxi",
  "innova-crysta-rental-in-agra",
  "ertiga-taxi-booking-agra",
  "agra-to-khatushyamji-taxi",
  "agra-to-ayodhya-taxi",
  // 15 Dedicated High-Priority Routes & Services
  "agra-local-full-day-tour",
  "agra-cantt-station-transfer",
  "fatehpur-sikri-excursion",
  "agra-to-sikandra-transfer",
  "mughal-bazaar-shopping-circuit",
  "agra-to-delhi-airport-taxi",
  "agra-to-delhi-ncr-drop",
  "agra-to-jaipur-cab",
  "agra-to-mathura-vrindavan-taxi",
  "agra-to-lucknow-expressway-taxi",
  "agra-to-gwalior-cab",
  "agra-to-kanpur-taxi",
  "agra-to-haridwar-rishikesh-taxi",
  "agra-to-ayodhya-dham-taxi",
  "agra-to-bharatpur-gateway-taxi",
] as const;

export type SeoLandingSlug = (typeof SEO_LANDING_SLUGS)[number];
