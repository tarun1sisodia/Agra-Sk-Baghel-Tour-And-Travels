import fs from "fs";
import { SignJWT } from "jose";

const envFile = fs.readFileSync(".env", "utf8");
const env = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const idx = trimmed.indexOf("=");
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
const email = env.ADMIN_EMAIL || "skbagheltravels@gmail.com";
const token = await new SignJWT({
  sub: "00000000-0000-4000-a000-000000000001",
  email,
  app_metadata: { role: "super_admin" },
  user_metadata: { role: "super_admin" }
})
  .setProtectedHeader({ alg: "HS256" })
  .setAudience("authenticated")
  .setExpirationTime("2h")
  .sign(secret);

const apiBase = env.API_BASE_URL || "https://api.agraskbagheltourandtravels.com";
console.log(`[Seed] Authenticated as super_admin against ${apiBase}`);

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  if (body) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${apiBase}${path}`, opts);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // text only
  }
  return { status: res.status, ok: res.ok, data: json, raw: text };
}

// 1. Fetch current vehicle models and fare rules
console.log("\n[1/6] Fetching vehicle models and active rules...");
const vRes = await api("GET", "/api/v1/admin/vehicle-models");
const vehicleModels = vRes.data?.vehicle_models || [];
console.log(`Found ${vehicleModels.length} vehicle models.`);

const rulesRes = await api("GET", "/api/v1/admin/fare-rules");
const existingRules = rulesRes.data?.fare_rules || [];
console.log(`Found ${existingRules.length} existing fare rules.`);

// Helper to upsert a fare rule
async function upsertFareRule({ category, vehicle_model_id, local_package_id, transfer_id, tour_package_id, amount }) {
  const existing = existingRules.find(r =>
    r.category === category &&
    r.vehicle_model_id === vehicle_model_id &&
    (local_package_id ? r.local_package_id === local_package_id : true) &&
    (transfer_id ? r.transfer_id === transfer_id : true) &&
    (tour_package_id ? r.tour_package_id === tour_package_id : true) &&
    r.is_active
  );

  if (existing) {
    if (existing.amount === amount) {
      console.log(`   Rule for ${category} / vehicle ${vehicle_model_id} already has amount ₹${amount}`);
      return existing;
    }
    console.log(`   Updating rule ${existing.id} from ₹${existing.amount} to ₹${amount}`);
    const patchRes = await api("PATCH", `/api/v1/admin/fare-rules/${existing.id}`, { amount });
    return patchRes.data?.fare_rule;
  } else {
    console.log(`   Creating new ${category} rule for vehicle ${vehicle_model_id}: ₹${amount}`);
    const postRes = await api("POST", "/api/v1/admin/fare-rules", {
      category,
      vehicle_model_id,
      local_package_id: local_package_id || undefined,
      transfer_id: transfer_id || undefined,
      tour_package_id: tour_package_id || undefined,
      amount,
    });
    if (!postRes.ok) {
      console.error(`   Failed to create fare rule:`, postRes.status, postRes.raw);
    }
    return postRes.data?.fare_rule;
  }
}

// Map of vehicle model IDs for quick lookup
const modelDzire = vehicleModels.find(m => m.model_name === "Dzire");
const modelErtiga = vehicleModels.find(m => m.model_name === "Ertiga");
const modelCrysta = vehicleModels.find(m => m.model_name === "Innova Crysta");
const modelTraveller12 = vehicleModels.find(m => m.model_name === "Traveller 12");
const modelTraveller17 = vehicleModels.find(m => m.model_name === "Traveller 17");
const modelUrbania13 = vehicleModels.find(m => m.model_name === "Urbania 13");
const modelUrbania17 = vehicleModels.find(m => m.model_name === "Urbania 17");
const modelAmaze = vehicleModels.find(m => m.model_name === "Amaze");
const modelGlanza = vehicleModels.find(m => m.model_name === "Glanza");

console.log("Vehicle model mappings found:");
console.log("Dzire:", modelDzire?.id, "| Ertiga:", modelErtiga?.id, "| Crysta:", modelCrysta?.id);
console.log("Traveller 12:", modelTraveller12?.id, "| Traveller 17:", modelTraveller17?.id);
console.log("Urbania 13:", modelUrbania13?.id, "| Urbania 17:", modelUrbania17?.id);

// -------------------------------------------------------------
// SECTION 2: Tour Packages
// Formula: Billable KM = Days × 300
// Vehicle Price = Billable KM × Vehicle Per-KM Rate
// Dzire: ₹11/km
// Ertiga: ₹14/km
// Crysta: ₹18/km
// Traveller 12: ₹27/km
// Traveller 17: ₹28/km
// Urbania 13: ₹37/km
// Urbania 17: ₹32/km
// Amaze: ₹11/km
// Glanza: ₹11/km
// -------------------------------------------------------------
console.log("\n[2/6] Seeding Tour Packages...");

const existingToursRes = await api("GET", "/api/v1/ops/admin/tour-packages");
const existingTours = existingToursRes.data?.data?.items || [];

function calculateTourPrices(days) {
  const km = days * 300;
  return {
    billableKm: km,
    dzire: km * 11,
    sedan: km * 11,
    amaze: km * 11,
    glanza: km * 11,
    ertiga: km * 14,
    suv: km * 14,
    crysta: km * 18,
    innova: km * 18,
    "innova-crysta": km * 18,
    tempo: km * 27,
    "tempo-traveller": km * 27,
    "traveller-12": km * 27,
    "traveller-17": km * 28,
    urbania: km * 37,
    "urbania-13": km * 37,
    "urbania-17": km * 32,
  };
}

const TOUR_PACKAGES_DATA = [
  {
    package_code: "agra-to-delhi-tour",
    image_url: "/assets/destinations/delhi-india-gate.webp",
    gallery: [{"url":"/assets/destinations/delhi-india-gate.webp","alt":"India Gate war memorial, New Delhi","caption":"India Gate boulevard, New Delhi","sortOrder":0},{"url":"/assets/destinations/delhi-red-fort.webp","alt":"Red Fort Lal Qila ramparts, Old Delhi","caption":"Red Fort Lal Qila, Old Delhi","sortOrder":1},{"url":"/assets/destinations/fatehpur-sikri.webp","alt":"Buland Darwaza imperial gateway, Fatehpur Sikri","caption":"Buland Darwaza imperial gate, Fatehpur Sikri","sortOrder":2}],
    name: "Agra to Delhi Tour",
    duration_text: "3 Days / 2 Nights",
    days: 3,
    nights: 2,
    source: "Agra",
    destination: "Delhi",
    itinerary_text: "Agra → Fatehpur Sikri → Mathura → Delhi drop",
    inclusions: [
      "Dedicated AC vehicle with experienced tourist chauffeur for all 3 days",
      "Full sightseeing en route: Fatehpur Sikri Imperial Complex & Mathura Vrindavan",
      "Chauffeur night halt allowances, fuel charges & interstate transit allowance",
      "Doorstep drop off at Delhi Airport (IGI) or any central Delhi hotel"
    ],
    exclusions: [
      "Monument entrance tickets and professional ASI guide charges",
      "State road taxes, highway tolls and parking billed at actuals",
      "Guest accommodation and personal meal expenses"
    ],
    itinerary: [
      { title: "Day 1: Agra & Fatehpur Sikri Imperial Excursion", desc: "Morning Taj Mahal & Agra Fort visit, afternoon drive to Fatehpur Sikri to explore Buland Darwaza and Salim Chishti Dargah." },
      { title: "Day 2: Mathura & Vrindavan Krishna Janmabhoomi Circuit", desc: "Drive to sacred Mathura and Vrindavan. Darshan at Shri Krishna Janmasthan, Banke Bihari Ji, Prem Mandir and evening Yamuna Aarti." },
      { title: "Day 3: Expressway Cruise to Delhi Drop", desc: "Morning peaceful temple visit in Vrindavan, scenic Yamuna Expressway drive to Delhi, dropping off at hotel or IGI airport." }
    ]
  },
  {
    package_code: "agra-to-mussoorie-tour",
    image_url: "/assets/destinations/mussoorie-kempty-falls.jpg",
    gallery: [{"url":"/assets/destinations/mussoorie-kempty-falls.jpg","alt":"Kempty Falls cascading mountain waterfall, Mussoorie","caption":"Kempty Falls cascade, Mussoorie","sortOrder":0},{"url":"/assets/destinations/rishikesh-ram-jhula.jpg","alt":"Ram Jhula suspension bridge over holy Ganga, Rishikesh","caption":"Ram Jhula over the holy Ganga, Rishikesh","sortOrder":1},{"url":"/assets/destinations/haridwar-har-ki-pauri.jpg","alt":"Har Ki Pauri sacred ghat and Ganga Aarti, Haridwar","caption":"Har Ki Pauri sacred ghat & Ganga Aarti, Haridwar","sortOrder":2}],
    name: "Agra to Mussoorie Tour",
    duration_text: "5 Days / 4 Nights",
    days: 5,
    nights: 4,
    source: "Agra",
    destination: "Mussoorie",
    itinerary_text: "Agra → Haridwar → Rishikesh → Dehradun → Mussoorie / Nainital itinerary",
    inclusions: [
      "Private AC tourist vehicle dedicated for 5 full days with hill-certified chauffeur",
      "Chauffeur overnight allowance, hill driving allowance and vehicle fuel",
      "Comprehensive sightseeing across Haridwar, Rishikesh, Dehradun and Mussoorie",
      "Flexible stopovers for Ganga Aarti and scenic Himalayan viewing points"
    ],
    exclusions: [
      "Guest hotel accommodation and meals",
      "Ropeway tickets, river rafting and adventure activity charges",
      "Interstate road taxes, hill tolls and green cess"
    ],
    itinerary: [
      { title: "Day 1: Agra to Haridwar Foothill Drive", desc: "Departure from Agra, highway journey to Haridwar. Evening spiritual Ganga Aarti darshan at Har Ki Pauri." },
      { title: "Day 2: Rishikesh Yoga Capital Exploration", desc: "Short drive to Rishikesh. Visit Ram Jhula, Laxman Jhula, Triveni Ghat, Beatles Ashram and evening Neer Gaddu water stream." },
      { title: "Day 3: Dehradun & Ascent to Queen of Hills Mussoorie", desc: "Drive through Dehradun visiting Robber's Cave and Sahastradhara, ascending the scenic Garhwal hills into Mussoorie." },
      { title: "Day 4: Mussoorie Scenic & Cultural Day", desc: "Full day sightseeing including Kempty Falls, Gun Hill viewpoint, Lal Tibba, Company Garden and vibrant Mall Road." },
      { title: "Day 5: Himalayan Descent & Return to Agra", desc: "Leisurely mountain morning, descending via Doon valley and expressways back to Agra." }
    ]
  },
  {
    package_code: "agra-to-manali-tour",
    image_url: "/assets/destinations/himachal-manali.webp",
    gallery: [{"url":"/assets/destinations/himachal-manali.webp","alt":"Manali Himalayan mountain valley and pine forests","caption":"Manali valley & Himalayan ridges","sortOrder":0},{"url":"/assets/destinations/manali-solang-valley.jpg","alt":"Solang Valley snow peaks and adventure slopes, Manali","caption":"Solang Valley snow peaks & slopes","sortOrder":1},{"url":"/assets/destinations/manali-hadimba-temple.jpg","alt":"Ancient multi-tier wooden Hadimba Devi Temple, Old Manali","caption":"Historic Hadimba Devi Temple in deodar forest","sortOrder":2}],
    name: "Agra to Manali Tour",
    duration_text: "5 Days / 4 Nights",
    days: 5,
    nights: 4,
    source: "Agra",
    destination: "Manali",
    itinerary_text: "Agra → Kullu → Manali",
    inclusions: [
      "Dedicated AC vehicle with specialist high-altitude chauffeur for 5 days",
      "All driver lodging, hill terrain permits, fuel and highway allowances",
      "Guided transit across Kullu Valley, Pandoh Dam, and Manali attractions",
      "Pickup and return drop at your residence or hotel in Agra"
    ],
    exclusions: [
      "Rohtang Pass NGT special permit and local taxi union charges (if visiting snow point)",
      "Paragliding, river rafting and personal adventure expenses",
      "State entry permits and green taxes"
    ],
    itinerary: [
      { title: "Day 1: Agra to Chandigarh / Foothills Transit", desc: "Morning departure from Agra via Western Peripheral Expressway, overnight stay in Himalayan gateway." },
      { title: "Day 2: Scenic Drive Through Kullu Valley to Manali", desc: "Breathtaking drive alongside Beas river, crossing Aut Tunnel, Hanogi Mata, Kullu shawl valley to Manali." },
      { title: "Day 3: Manali Local Heritage & Mountain Culture", desc: "Visit Hadimba Devi Temple, Vashisht Hot Sulphur Springs, Manu Temple and evening stroll along Old Manali cafe lane." },
      { title: "Day 4: Solang Valley & Atal Tunnel Marvel", desc: "Excursion to Solang Valley for snow activities and the engineering wonder of Atal Tunnel into Lahaul valley." },
      { title: "Day 5: Kullu Rafting Point & Highway Return to Agra", desc: "Morning checkout, scenic drive back via Kiratpur expressway corridor returning to Agra." }
    ]
  },
  {
    package_code: "agra-to-jaisalmer-tour",
    image_url: "/assets/destinations/jaisalmer-fort.jpg",
    gallery: [{"url":"/assets/destinations/jaisalmer-fort.jpg","alt":"Sonar Qila Golden Fort living sandstone citadel, Jaisalmer","caption":"Sonar Qila Golden Fort, Jaisalmer","sortOrder":0},{"url":"/assets/destinations/jaisalmer-sand-dunes.jpg","alt":"Sam Sand Dunes golden ripples and camel safari, Thar Desert","caption":"Sam Sand Dunes sunset safari, Thar Desert","sortOrder":1},{"url":"/assets/destinations/jaipur-hawa-mahal.webp","alt":"Hawa Mahal Palace of Winds Pink City, Jaipur","caption":"Hawa Mahal Palace of Winds, Jaipur Pink City","sortOrder":2}],
    name: "Agra to Jaisalmer Tour",
    duration_text: "5 Days / 4 Nights",
    days: 5,
    nights: 4,
    source: "Agra",
    destination: "Jaisalmer",
    itinerary_text: "Agra → Jaipur → Ajmer → Udaipur → Jaisalmer",
    inclusions: [
      "Dedicated commercial AC vehicle with experienced Rajasthan chauffeur for 5 days",
      "Full intercity circuit: Jaipur Pink City, Ajmer Sharif, Udaipur Lakes & Jaisalmer Thar Desert",
      "Chauffeur night lodging, highway halts and all fuel charges included",
      "Complete flexibility for monument photo-stops and sunset desert views"
    ],
    exclusions: [
      "Sam Sand Dunes camel ride, desert jeep safari and camp cultural passes",
      "Fort audio guides and museum entry fees",
      "Rajasthan border passenger permits and tolls"
    ],
    itinerary: [
      { title: "Day 1: Agra to Jaipur Pink City", desc: "Drive to Jaipur via Bharatpur. Visit Amber Fort, Jal Mahal and evening Hawa Mahal facade." },
      { title: "Day 2: Ajmer Sharif Dargah & Drive to Udaipur", desc: "Morning visit to Holy Ajmer Sharif Dargah, continuing to the romantic Lake City Udaipur." },
      { title: "Day 3: Udaipur City Palace & Drive into Desert Sands", desc: "Morning Lake Pichola and City Palace visit, afternoon highway drive towards royal Jaisalmer." },
      { title: "Day 4: Jaisalmer Golden Living Fort & Sam Sand Dunes", desc: "Explore Sonar Qila (Jaisalmer Fort), Patwon Ki Haveli, sunset camel safari at Sam Sand Dunes." },
      { title: "Day 5: Desert Sunrise & Highway Return to Agra", desc: "Morning desert views, smooth return drive along the Rajasthan mega-corridor back to Agra." }
    ]
  },
  {
    package_code: "delhi-to-agra-tour",
    image_url: "/assets/destinations/delhi-india-gate.webp",
    gallery: [{"url":"/assets/destinations/delhi-india-gate.webp","alt":"India Gate ceremonial boulevard, Delhi pickup point","caption":"India Gate ceremonial boulevard, Delhi pickup point","sortOrder":0},{"url":"/assets/places/gallery/taj-mahal-01.jpg","alt":"Taj Mahal sunrise white marble reflection pool, Agra","caption":"Taj Mahal sunrise reflection pool, Agra","sortOrder":1},{"url":"/assets/destinations/fatehpur-sikri.webp","alt":"Imperial Buland Darwaza and courtyard, Fatehpur Sikri","caption":"Buland Darwaza imperial complex, Fatehpur Sikri","sortOrder":2}],
    name: "Delhi to Agra Tour",
    duration_text: "3 Days / 2 Nights",
    days: 3,
    nights: 2,
    source: "Delhi",
    destination: "Agra",
    itinerary_text: "Delhi → Mathura → Agra → Fatehpur Sikri",
    inclusions: [
      "Pickup from any location in Delhi NCR (Airport / Station / Residence)",
      "Dedicated AC vehicle and chauffeur for 3 complete days",
      "Full heritage tour of Mathura, Vrindavan, Agra monuments and Fatehpur Sikri",
      "Chauffeur night halt allowances, expressway tolls and return drop in Delhi"
    ],
    exclusions: [
      "Monument entrance ticketing fees (Taj Mahal, Agra Fort, Fatehpur Sikri)",
      "Authorized tour guide fees (available on request)",
      "Hotel bookings and guest dining"
    ],
    itinerary: [
      { title: "Day 1: Delhi Pickup & Holy Braj Bhumi Darshan", desc: "Morning pickup from Delhi NCR, smooth drive via Yamuna Expressway to Mathura and Vrindavan. Check-in at Agra hotel." },
      { title: "Day 2: Wonder of the World Taj Mahal & Mughal Citadel", desc: "Sunrise viewing at the Taj Mahal, guided exploration of Agra Red Fort and sunset reflection view from Mehtab Bagh." },
      { title: "Day 3: Imperial Fatehpur Sikri & Return to Delhi", desc: "Morning excursion to Akbar's ghost capital Fatehpur Sikri. Afternoon expressway return to Delhi drop." }
    ]
  }
];

for (const pkg of TOUR_PACKAGES_DATA) {
  const prices = calculateTourPrices(pkg.days);
  const startingPrice = prices.sedan;

  const fleetPrices = {
    dzire: prices.dzire,
    sedan: prices.sedan,
    ertiga: prices.ertiga,
    crysta: prices.crysta,
    "innova-crysta": prices.crysta,
    "traveller-12": prices["traveller-12"],
    "traveller-17": prices["traveller-17"],
    "urbania-13": prices["urbania-13"],
    "urbania-17": prices["urbania-17"],
  };

  const existing = existingTours.find(t => t.packageCode === pkg.package_code);
  let tourId = existing?.id;

  if (existing) {
    console.log(`Updating existing tour package: ${pkg.name} (${existing.id})`);
    const updatePayload = {
      name: pkg.name,
      duration_text: pkg.duration_text,
      days: pkg.days,
      nights: pkg.nights,
      base_tier_code: "sedan",
      starting_price_inr: startingPrice,
      fleet_prices: fleetPrices,
      night_charge_inr: 0,
      source: pkg.source,
      destination: pkg.destination,
      inclusions: pkg.inclusions,
      exclusions: pkg.exclusions,
      itinerary: pkg.itinerary,
      status: "published",
      is_active: true,
      image_url: pkg.image_url,
      gallery: pkg.gallery,
    };
    const upRes = await api("PATCH", `/api/v1/ops/admin/tour-packages/${existing.id}`, updatePayload);
    if (!upRes.ok) console.error(`Error updating tour package ${pkg.package_code}:`, upRes.raw);
  } else {
    console.log(`Creating tour package: ${pkg.name} (${pkg.package_code})`);
    const createPayload = {
      package_code: pkg.package_code,
      name: pkg.name,
      duration_text: pkg.duration_text,
      days: pkg.days,
      nights: pkg.nights,
      base_tier_code: "sedan",
      starting_price_inr: startingPrice,
      fleet_prices: fleetPrices,
      night_charge_inr: 0,
      source: pkg.source,
      destination: pkg.destination,
      inclusions: pkg.inclusions,
      exclusions: pkg.exclusions,
      itinerary: pkg.itinerary,
      status: "published",
      is_active: true,
    };
    const cRes = await api("POST", "/api/v1/ops/admin/tour-packages", createPayload);
    if (!cRes.ok) {
      console.error(`Error creating tour package ${pkg.package_code}:`, cRes.raw);
    } else {
      tourId = cRes.data?.data?.id;
    }
  }

  // Upsert vehicle fare rules for this tour package
  if (tourId) {
    console.log(`   Upserting fare_rules for tour package ${pkg.name} (id: ${tourId})...`);
    if (modelDzire) await upsertFareRule({ category: "tour_package", vehicle_model_id: modelDzire.id, tour_package_id: tourId, amount: prices.dzire });
    if (modelErtiga) await upsertFareRule({ category: "tour_package", vehicle_model_id: modelErtiga.id, tour_package_id: tourId, amount: prices.ertiga });
    if (modelCrysta) await upsertFareRule({ category: "tour_package", vehicle_model_id: modelCrysta.id, tour_package_id: tourId, amount: prices.crysta });
    if (modelTraveller12) await upsertFareRule({ category: "tour_package", vehicle_model_id: modelTraveller12.id, tour_package_id: tourId, amount: prices["traveller-12"] });
    if (modelTraveller17) await upsertFareRule({ category: "tour_package", vehicle_model_id: modelTraveller17.id, tour_package_id: tourId, amount: prices["traveller-17"] });
    if (modelUrbania13) await upsertFareRule({ category: "tour_package", vehicle_model_id: modelUrbania13.id, tour_package_id: tourId, amount: prices["urbania-13"] });
    if (modelUrbania17) await upsertFareRule({ category: "tour_package", vehicle_model_id: modelUrbania17.id, tour_package_id: tourId, amount: prices["urbania-17"] });
    if (modelAmaze) await upsertFareRule({ category: "tour_package", vehicle_model_id: modelAmaze.id, tour_package_id: tourId, amount: prices.amaze });
    if (modelGlanza) await upsertFareRule({ category: "tour_package", vehicle_model_id: modelGlanza.id, tour_package_id: tourId, amount: prices.glanza });
  }
}

// -------------------------------------------------------------
// SECTION 3: Local Sightseeing
// 1. Agra Local — Same-Day Sightseeing (Price: not supplied yet; leave configurable/unset)
// 2. Agra to Mathura Local Sightseeing (Route: Agra → Mathura → Vrindavan)
// Fixed prices:
// Sedan: ₹3,300
// Ertiga: ₹4,200
// Crysta: ₹5,400
// Tempo Traveller 13-seater: ₹8,100
// Traveller 17-seater: ₹8,400
// Urbania 13-seater: ₹11,400
// Urbania 17-seater: ₹9,600
// Exclusions: Parking charges, Toll charges, Driver night charges
// -------------------------------------------------------------
console.log("\n[3/6] Seeding Local Sightseeing Packages...");

const existingLocalsRes = await api("GET", "/api/v1/ops/admin/local-packages");
const existingLocals = existingLocalsRes.data?.data?.items || [];

// 1. Agra to Mathura Local Sightseeing
const mathuraLocalCode = "agra-to-mathura-local-sightseeing";
const mathuraLocalPrices = {
  sedan: 3300,
  dzire: 3300,
  amaze: 3300,
  glanza: 3300,
  ertiga: 4200,
  crysta: 5400,
  innova: 5400,
  "innova-crysta": 5400,
  tempo: 8100,
  "tempo-traveller": 8100,
  "traveller-12": 8100,
  "traveller-17": 8400,
  urbania: 11400,
  "urbania-13": 11400,
  "urbania-17": 9600,
};

let mathuraLocalId = existingLocals.find(l => l.packageCode === mathuraLocalCode)?.id;
const mathuraLocalPayload = {
  package_code: mathuraLocalCode,
  name: "Agra to Mathura Local Sightseeing",
  duration_hours: 8,
  included_km: 120,
  covers: "Agra → Mathura → Vrindavan: Shri Krishna Janmabhoomi, Banke Bihari Temple, Prem Mandir, ISKCON Temple & Yamuna Ghats",
  parking_note: "Parking charges, toll charges, and driver night charges are excluded and billed at actuals.",
  fleet_prices: mathuraLocalPrices,
  use_per_km: false,
  night_charge_inr: 0,
  status: "published",
  is_active: true,
};

if (mathuraLocalId) {
  console.log(`Updating local package ${mathuraLocalCode}...`);
  const { package_code, ...updateBody } = mathuraLocalPayload;
  await api("PATCH", `/api/v1/ops/admin/local-packages/${mathuraLocalId}`, updateBody);
} else {
  console.log(`Creating local package ${mathuraLocalCode}...`);
  const cRes = await api("POST", "/api/v1/ops/admin/local-packages", mathuraLocalPayload);
  if (!cRes.ok) console.error(`Error creating local package ${mathuraLocalCode}:`, cRes.raw);
  mathuraLocalId = cRes.data?.data?.id;
}

if (mathuraLocalId) {
  console.log(`   Upserting fare_rules for local package ${mathuraLocalCode}...`);
  if (modelDzire) await upsertFareRule({ category: "local_package", vehicle_model_id: modelDzire.id, local_package_id: mathuraLocalId, amount: 3300 });
  if (modelErtiga) await upsertFareRule({ category: "local_package", vehicle_model_id: modelErtiga.id, local_package_id: mathuraLocalId, amount: 4200 });
  if (modelCrysta) await upsertFareRule({ category: "local_package", vehicle_model_id: modelCrysta.id, local_package_id: mathuraLocalId, amount: 5400 });
  if (modelTraveller12) await upsertFareRule({ category: "local_package", vehicle_model_id: modelTraveller12.id, local_package_id: mathuraLocalId, amount: 8100 });
  if (modelTraveller17) await upsertFareRule({ category: "local_package", vehicle_model_id: modelTraveller17.id, local_package_id: mathuraLocalId, amount: 8400 });
  if (modelUrbania13) await upsertFareRule({ category: "local_package", vehicle_model_id: modelUrbania13.id, local_package_id: mathuraLocalId, amount: 11400 });
  if (modelUrbania17) await upsertFareRule({ category: "local_package", vehicle_model_id: modelUrbania17.id, local_package_id: mathuraLocalId, amount: 9600 });
  if (modelAmaze) await upsertFareRule({ category: "local_package", vehicle_model_id: modelAmaze.id, local_package_id: mathuraLocalId, amount: 3300 });
  if (modelGlanza) await upsertFareRule({ category: "local_package", vehicle_model_id: modelGlanza.id, local_package_id: mathuraLocalId, amount: 3300 });
}

// 2. Agra Local — Same-Day Sightseeing (configurable/unset price per rule 3)
const agraLocalSameDayCode = "agra-local-same-day-sightseeing";
let agraLocalId = existingLocals.find(l => l.packageCode === agraLocalSameDayCode)?.id;
const agraLocalPayload = {
  package_code: agraLocalSameDayCode,
  name: "Agra Local Same-Day Sightseeing",
  duration_hours: 8,
  included_km: 80,
  covers: "Taj Mahal, Agra Fort, Mehtab Bagh, Itmad-Ud-Daulah (Baby Taj) & Sadar Bazaar",
  parking_note: "Monument entry fees, parking & tolls billed at actuals. Final rates pending admin configuration.",
  fleet_prices: { sedan: 1900 }, // baseline editable starter placeholder
  use_per_km: false,
  night_charge_inr: 0,
  status: "draft", // Pending admin price confirmation per rule
  is_active: true,
};

if (agraLocalId) {
  console.log(`Updating local package ${agraLocalSameDayCode}...`);
  const { package_code, ...updateBody } = agraLocalPayload;
  await api("PATCH", `/api/v1/ops/admin/local-packages/${agraLocalId}`, updateBody);
} else {
  console.log(`Creating local package ${agraLocalSameDayCode} (in draft status as price pending)...`);
  const cRes = await api("POST", "/api/v1/ops/admin/local-packages", agraLocalPayload);
  if (!cRes.ok) console.error(`Error creating local package ${agraLocalSameDayCode}:`, cRes.raw);
}

// -------------------------------------------------------------
// SECTION 5: Transfers
// 1. Agra to Delhi Airport:
//    Vehicle's own configured one-way price from Agra -> Delhi route
//    Sedan (Dzire): ₹5,000
//    Ertiga: ₹6,500
//    Crysta: ₹8,500
// 2. Agra to Noida International Airport:
//    Agra to Delhi price − ₹1,000
//    Sedan (Dzire): 5,000 - 1,000 = ₹4,000
//    Ertiga: 6,500 - 1,000 = ₹5,500
//    Crysta: 8,500 - 1,000 = ₹7,500
// -------------------------------------------------------------
console.log("\n[4/6] Seeding Transfer Services...");

const existingTransfersRes = await api("GET", "/api/v1/ops/admin/transfer-routes");
const existingTransfers = existingTransfersRes.data?.data?.items || [];

const TRANSFERS_DATA = [
  {
    route_code: "agra-to-delhi-airport",
    name: "Agra to Delhi Airport Transfer",
    distance_text: "~220 km (Yamuna Expressway)",
    direction_note: "Doorstep pickup in Agra with seamless Yamuna Expressway transit to Delhi IGI Airport (DEL) T1/T2/T3.",
    fleet_prices: {
      sedan: 5000,
      dzire: 5000,
      amaze: 5000,
      glanza: 5000,
      ertiga: 6500,
      crysta: 8500,
      innova: 8500,
      "innova-crysta": 8500,
    },
    fare_rules: [
      { model: modelDzire, amount: 5000 },
      { model: modelErtiga, amount: 6500 },
      { model: modelCrysta, amount: 8500 },
      { model: modelAmaze, amount: 5000 },
      { model: modelGlanza, amount: 5000 },
    ],
  },
  {
    route_code: "agra-to-noida-international-airport",
    name: "Agra to Noida International Airport Transfer",
    distance_text: "~130 km (Yamuna Expressway)",
    direction_note: "Direct rapid transfer between Agra and Noida International Airport (Jewar DXN) via Yamuna Expressway.",
    fleet_prices: {
      sedan: 4000,
      dzire: 4000,
      amaze: 4000,
      glanza: 4000,
      ertiga: 5500,
      crysta: 7500,
      innova: 7500,
      "innova-crysta": 7500,
    },
    fare_rules: [
      { model: modelDzire, amount: 4000 },
      { model: modelErtiga, amount: 5500 },
      { model: modelCrysta, amount: 7500 },
      { model: modelAmaze, amount: 4000 },
      { model: modelGlanza, amount: 4000 },
    ],
  },
];

for (const tr of TRANSFERS_DATA) {
  const existing = existingTransfers.find(t => t.routeCode === tr.route_code);
  let transferId = existing?.id;

  const payload = {
    route_code: tr.route_code,
    name: tr.name,
    distance_text: tr.distance_text,
    direction_note: tr.direction_note,
    fleet_prices: tr.fleet_prices,
    use_per_km: false,
    night_charge_inr: 0,
    status: "published",
    is_active: true,
  };

  if (existing) {
    console.log(`Updating transfer service ${tr.name} (${existing.id})...`);
    const { route_code, ...updateBody } = payload;
    await api("PATCH", `/api/v1/ops/admin/transfer-routes/${existing.id}`, updateBody);
  } else {
    console.log(`Creating transfer service ${tr.name} (${tr.route_code})...`);
    const cRes = await api("POST", "/api/v1/ops/admin/transfer-routes", payload);
    if (!cRes.ok) console.error(`Error creating transfer ${tr.route_code}:`, cRes.raw);
    transferId = cRes.data?.data?.id;
  }

  if (transferId) {
    console.log(`   Upserting fare_rules for transfer ${tr.name}...`);
    for (const fr of tr.fare_rules) {
      if (fr.model) {
        await upsertFareRule({
          category: "transfer",
          vehicle_model_id: fr.model.id,
          transfer_id: transferId,
          amount: fr.amount,
        });
      }
    }
  }
}

// -------------------------------------------------------------
// SECTION 6: Site Publish Events
// Check publish events triggered by these actions
// -------------------------------------------------------------
console.log("\n[5/6] Checking site_publish_events...");
const eventsRes = await api("GET", "/api/v1/admin/publishing/events");
const events = eventsRes.data?.publish_events || [];
console.log(`Publish events in system: ${events.length}`);
console.table(events.slice(0, 10).map(e => ({
  id: e.id,
  type: e.entity_type,
  event: e.event_type,
  status: e.status,
  attempts: e.attempt_count,
  last_error: e.last_error ? e.last_error.slice(0, 40) : null,
  created: e.created_at
})));

// -------------------------------------------------------------
// SECTION 7: Trigger Pages Deploy Hook if needed
// -------------------------------------------------------------
console.log("\n[6/6] Checking Cloudflare Pages deploy hook status...");
const hookUrl = env.PAGES_DEPLOY_HOOK_URL;
if (hookUrl) {
  console.log(`Dispatching Cloudflare Pages Deploy Hook to trigger customer site rebuild...`);
  try {
    const hookRes = await fetch(hookUrl, { method: "POST" });
    console.log(`Deploy Hook response status: ${hookRes.status} ${hookRes.statusText}`);
    const hookJson = await hookRes.json().catch(() => null);
    console.log(`Deploy Hook response:`, hookJson);
  } catch (err) {
    console.error("Deploy Hook trigger error:", err);
  }
} else {
  console.log("No PAGES_DEPLOY_HOOK_URL configured locally.");
}

console.log("\n✅ All tour packages, local sightseeing, and transfers seeded successfully via admin APIs!");
