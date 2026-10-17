import { buildApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import pino from "pino";
import { createPostgresRepositories } from "../src/db/postgres.js";
import type { CreateTourPackageInput } from "../src/modules/tour-packages/tour-packages.schema.js";
import type { CreateLocalPackageInput } from "../src/modules/local-packages/local-packages.schema.js";
import type { CreateTransferRouteInput } from "../src/modules/transfer-routes/transfer-routes.schema.js";

try {
  process.loadEnvFile?.(".env");
} catch {}
process.env.NODE_ENV = "development";
process.env.ALLOW_TEST_AUTH = "true";

const tourPackageFixtures: CreateTourPackageInput[] = [
  {
    package_code: "taj-mahal-sunrise-tour",
    name: "Taj Mahal Sunrise Tour",
    duration_text: "1 Day (5:00 AM Departure)",
    days: 1,
    nights: 0,
    base_tier_code: "sedan",
    starting_price_inr: 12999,
    fleet_prices: {
      sedan: 12999,
      ertiga: 14500,
      innova: 15500,
      tempo: 22000,
      urbania: 25000,
    },
    night_charge_inr: 0,
    source: "Agra",
    destination: "Taj Mahal & Agra Fort",
    inclusions_highlight: "VIP Dawn priority chauffeur timing & hotel pickup",
    inclusions_note: "Monument entry tickets can be purchased at ASI kiosk with chauffeur assistance.",
    inclusions: [
      "Dedicated luxury AC vehicle with verified chauffeur",
      "Yamuna Expressway fast-track tolls & parking fees included",
      "Sunrise priority departure with skip-the-line guidance",
      "Chilled bottled water, hydration kit & umbrellas",
    ],
    exclusions: [
      "Monument tickets (ASI portal)",
      "Meals & personal refreshments",
    ],
    itinerary: [
      { time: "05:00 AM", title: "VIP Dawn Hotel Pickup", desc: "Private chauffeur arrives at hotel doorstep." },
      { time: "05:45 AM", title: "Taj Mahal Sunrise Entry", desc: "Witness golden morning glow across ivory dome." },
      { time: "09:30 AM", title: "Breakfast Break", desc: "Heritage cafe breakfast stopover." },
      { time: "11:00 AM", title: "Agra Red Fort", desc: "Guided exploration of Mughal palaces and Diwan-i-Khas." },
    ],
    image_url: "/assets/packages/taj-dawn.webp",
    gallery: [
      { url: "/assets/places/gallery/taj-mahal-02.jpg", caption: "Dawn glow across ivory marble", alt: "Taj Mahal at sunrise" },
      { url: "/assets/places/gallery/mehtab-bagh-02.jpg", caption: "Reflections from Charbagh gardens", alt: "Mehtab Bagh sunrise view" },
    ],
    status: "published",
    is_active: true,
  },
  {
    package_code: "agra-sightseeing",
    name: "Same Day Agra Taj Mahal Tour",
    duration_text: "1 Day (8-10 Hours)",
    days: 1,
    nights: 0,
    base_tier_code: "sedan",
    starting_price_inr: 3499,
    fleet_prices: {
      sedan: 3499,
      ertiga: 4499,
      innova: 6499,
      tempo: 9500,
      urbania: 14000,
    },
    night_charge_inr: 0,
    source: "Agra",
    destination: "Heritage Circuit",
    inclusions_highlight: "All Agra monuments in one seamless private charter",
    inclusions: [
      "Private AC vehicle with dedicated driver",
      "All fuel, commercial parking and toll receipts included",
      "Doorstep pickup & drop from hotel or railway station",
      "Bottled mineral water on board",
    ],
    exclusions: ["Monument entry fees", "Lunch & personal expenses"],
    itinerary: [
      { time: "09:00 AM", title: "Morning Pickup", desc: "Chauffeur greets at hotel or Agra Cantt." },
      { time: "09:45 AM", title: "Taj Mahal Visit", desc: "Comprehensive visit of the iconic mausoleum." },
      { time: "01:00 PM", title: "Lunch Halt", desc: "Relaxed dining break at recommended restaurant." },
      { time: "02:30 PM", title: "Agra Fort & Baby Taj", desc: "Mughal fort ramparts and marble inlay monument." },
      { time: "05:30 PM", title: "Mehtab Bagh Sunset", desc: "Sunset viewpoint across the Yamuna." },
    ],
    image_url: "/assets/packages/taj-dawn.webp",
    gallery: [
      { url: "/assets/places/gallery/taj-mahal-01.jpg", caption: "Taj Mahal reflection pool", alt: "Taj Mahal reflection pool" },
      { url: "/assets/places/gallery/agra-fort-01.jpg", caption: "Grand Amar Singh Gate", alt: "Agra Fort red sandstone gate" },
    ],
    status: "published",
    is_active: true,
  },
  {
    package_code: "mathura-vrindavan",
    name: "Mathura & Vrindavan Darshan",
    duration_text: "1 Day (55 KM Corridor)",
    days: 1,
    nights: 0,
    base_tier_code: "sedan",
    starting_price_inr: 4200,
    fleet_prices: {
      sedan: 4200,
      ertiga: 5500,
      innova: 7500,
      tempo: 11500,
      urbania: 16000,
    },
    night_charge_inr: 0,
    source: "Agra",
    destination: "Mathura & Vrindavan",
    inclusions_highlight: "Temple aarti timings pre-planned by local chauffeur",
    inclusions: [
      "Doorstep round-trip transit in sanitized AC vehicle",
      "All inter-district UP state transport permits and tolls",
      "Dedicated waiting at Krishna Janmabhoomi, Banke Bihari & Prem Mandir",
    ],
    exclusions: ["Special temple donation slips", "Meals"],
    itinerary: [
      { time: "07:30 AM", title: "Agra Departure", desc: "Smooth transit via NH-19 to Mathura." },
      { time: "09:00 AM", title: "Krishna Janmabhoomi", desc: "Darshan at the sacred birth shrine." },
      { time: "01:00 PM", title: "Dwarkadhish Temple", desc: "Holy Yamuna ghat and temple visit." },
      { time: "04:30 PM", title: "Banke Bihari Temple", desc: "Evening darshan in Vrindavan." },
      { time: "07:00 PM", title: "Prem Mandir Light Show", desc: "Illuminated marble complex before return to Agra." },
    ],
    image_url: "/assets/packages/mathura.webp",
    gallery: [
      { url: "/assets/places/gallery/mathura-vrindavan-01.jpg", caption: "Prem Mandir illumination", alt: "Prem Mandir" },
    ],
    status: "published",
    is_active: true,
  },
  {
    package_code: "gatimaan-express-agra-tour",
    name: "Same Day Agra by Gatimaan Train",
    duration_text: "1 Day (12h Total Tour)",
    days: 1,
    nights: 0,
    base_tier_code: "sedan",
    starting_price_inr: 14999,
    fleet_prices: {
      sedan: 14999,
      ertiga: 16500,
      innova: 17999,
      tempo: 24000,
      urbania: 28000,
    },
    night_charge_inr: 0,
    source: "Agra",
    destination: "Agra Monuments",
    inclusions_highlight: "Agra Cantt platform nameboard greeting with zero waiting penalty",
    inclusions: [
      "Agra Cantt railway platform meet & greet with nameboard",
      "Continuous AC car custody throughout the day in Agra",
      "Assisted luggage transfer & drop back for 5:50 PM train departure",
      "Mineral water & cool towels",
    ],
    exclusions: ["Train ticket costs", "Monument entry tickets"],
    itinerary: [
      { time: "09:50 AM", title: "Gatimaan Train Arrival", desc: "Chauffeur greets at Agra Cantt platform exit." },
      { time: "10:30 AM", title: "Taj Mahal Tour", desc: "Morning tour of the Taj Mahal." },
      { time: "01:30 PM", title: "Buffet Lunch", desc: "Fine multi-cuisine lunch." },
      { time: "03:00 PM", title: "Agra Fort Exploration", desc: "Royal pavilions of Shah Jahan." },
      { time: "05:00 PM", title: "Agra Cantt Drop", desc: "Assisted boarding for return train." },
    ],
    image_url: "/assets/packages/agra-fort.webp",
    gallery: [
      { url: "/assets/places/gallery/agra-fort-02.jpg", caption: "Diwan-i-Khas pavilion", alt: "Diwan-i-Khas" },
    ],
    status: "published",
    is_active: true,
  },
  {
    package_code: "golden-triangle",
    name: "Golden Triangle Tour (3 Cities)",
    duration_text: "3 Days / 2 Nights",
    days: 3,
    nights: 2,
    base_tier_code: "sedan",
    starting_price_inr: 24000,
    fleet_prices: {
      sedan: 24000,
      ertiga: 28000,
      innova: 32000,
      tempo: 42000,
      urbania: 52000,
    },
    night_charge_inr: 0,
    source: "Delhi",
    destination: "Jaipur",
    inclusions_highlight: "All 3 state permits (UP, Delhi, Rajasthan) fully settled",
    inclusions: [
      "3 continuous days dedicated long-range vehicle custody",
      "All commercial border taxes, highway fast-tag tolls & driver halts",
      "Flexible start in Delhi and drop-off in Jaipur or Delhi",
    ],
    exclusions: ["Hotel bookings", "Monument entry tickets"],
    itinerary: [
      { time: "Day 1", title: "Delhi to Agra", desc: "Qutub Minar, expressway transit, Agra sunset." },
      { time: "Day 2", title: "Agra to Jaipur via Fatehpur Sikri", desc: "Taj sunrise, Akbar capital, Chand Baori." },
      { time: "Day 3", title: "Jaipur Royal Palaces & Return", desc: "Amber Fort, Hawa Mahal, City Palace." },
    ],
    image_url: "/assets/packages/golden-triangle.webp",
    gallery: [
      { url: "/assets/places/gallery/taj-mahal-03.jpg", caption: "Taj Mahal marble detail", alt: "Taj Mahal" },
    ],
    status: "published",
    is_active: true,
  },
  {
    package_code: "fatehpur-sikri-tour",
    name: "Fatehpur Sikri Imperial Citadel Excursion",
    duration_text: "Half Day (40 KM Corridor)",
    days: 1,
    nights: 0,
    base_tier_code: "sedan",
    starting_price_inr: 2000,
    fleet_prices: {
      sedan: 2000,
      ertiga: 2700,
      innova: 3645,
      tempo: 5800,
      urbania: 8500,
    },
    night_charge_inr: 0,
    source: "Agra",
    destination: "Fatehpur Sikri",
    inclusions_highlight: "Doorstep hotel pickup & highway transit to Akbar's ghost capital",
    inclusions: [
      "Private AC cab with chauffeur waiting at Buland Darwaza parking",
      "All expressway tolls and municipal parking receipts included",
      "Doorstep Agra hotel pickup & return drop",
    ],
    exclusions: ["Monument entry tickets", "Local monument guides"],
    itinerary: [
      { time: "09:00 AM", title: "Agra Hotel Departure", desc: "Chauffeur departs from Agra hotel." },
      { time: "10:15 AM", title: "Buland Darwaza Arrival", desc: "Explore the triumphal gate and Salim Chishti tomb." },
      { time: "12:30 PM", title: "Panch Mahal & Diwan-i-Aam", desc: "Wander Akbar's sandstone palace complex." },
      { time: "02:00 PM", title: "Return to Agra", desc: "Smooth return drop to your Agra hotel." },
    ],
    image_url: "/assets/packages/taj-dawn.webp",
    gallery: [
      { url: "/assets/places/gallery/agra-fort-01.jpg", caption: "Red sandstone gate", alt: "Fatehpur Sikri" },
    ],
    status: "published",
    is_active: true,
  },
];

const localPackageFixtures: CreateLocalPackageInput[] = [
  {
    package_code: "agra-fort-heritage-tour",
    name: "Agra Fort & Mughal Heritage Circuit",
    duration_hours: 4,
    included_km: 40,
    covers: "Agra Fort, Jama Masjid, Kinari Bazaar, Yamuna View Point",
    parking_note: "All municipal monument parking charges included.",
    fleet_prices: {
      sedan: 1500,
      ertiga: 2000,
      innova: 2500,
      tempo: 4000,
      urbania: 6000,
    },
    use_per_km: false,
    night_charge_inr: 0,
    status: "published",
    is_active: true,
  },
  {
    package_code: "mehtab-bagh-sunset-circuit",
    name: "Mehtab Bagh Sunset & Riverfront Circuit",
    duration_hours: 4,
    included_km: 40,
    covers: "Mehtab Bagh, Itimad-ud-Daulah (Baby Taj), Chini Ka Rauza",
    parking_note: "Includes Charbagh garden parking and toll transit.",
    fleet_prices: {
      sedan: 1600,
      ertiga: 2100,
      innova: 2600,
      tempo: 4200,
      urbania: 6200,
    },
    use_per_km: false,
    night_charge_inr: 0,
    status: "published",
    is_active: true,
  },
];

const transferFixtures: CreateTransferRouteInput[] = [
  {
    route_code: "delhi-airport-to-agra-hotel",
    name: "IGI Delhi Airport to Agra Hotel Transfer",
    distance_text: "220 KM via Yamuna Expressway",
    direction_note: "Terminal 3 / 1 greeting with guest nameboard.",
    fleet_prices: {
      sedan: 3499,
      ertiga: 4800,
      innova: 6499,
      tempo: 9800,
      urbania: 14000,
    },
    use_per_km: false,
    night_charge_inr: 0,
    status: "published",
    is_active: true,
  },
  {
    route_code: "agra-cantt-to-taj-ganj",
    name: "Agra Cantt Railway Station to Taj Ganj Transfer",
    distance_text: "8 KM city transfer",
    direction_note: "Assisted luggage loading at Agra Cantt platform exit.",
    fleet_prices: {
      sedan: 600,
      ertiga: 850,
      innova: 1100,
      tempo: 1800,
      urbania: 2500,
    },
    use_per_km: false,
    night_charge_inr: 0,
    status: "published",
    is_active: true,
  },
];

async function runQaDataInsertion() {
  console.log("==================================================================");
  console.log("  SK Baghel Tour & Travels — QA Data Insertion via Real Admin APIs");
  console.log("==================================================================");

  const env = loadEnv();
  const logger = pino({ level: "silent" });
  const db = env.DATABASE_URL ? await createPostgresRepositories(env.DATABASE_URL) : undefined;
  const { app } = await buildApp({ env, logger, db });
  await app.ready();

  const adminHeaders = {
    authorization: "Bearer test-super_admin",
    "content-type": "application/json",
  };

  // 1. TOUR PACKAGES
  console.log("\n--- 1. INSERTING TOUR PACKAGES VIA ADMIN CONTRACT ---");
  for (const fixture of tourPackageFixtures) {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/tour-packages",
      headers: adminHeaders,
      payload: fixture,
    });

    if (res.statusCode === 201) {
      const data = JSON.parse(res.payload);
      const pkgId = data.data.id;
      console.log(`✅ Created package [${fixture.package_code}]: id=${pkgId}, startingPrice=₹${fixture.starting_price_inr}`);

      // Publish the package explicitly using the real Admin publish endpoint
      const pubRes = await app.inject({
        method: "POST",
        url: `/api/v1/ops/admin/tour-packages/${pkgId}/publish`,
        headers: adminHeaders,
      });
      console.log(`   Publish status: ${pubRes.statusCode} (${JSON.parse(pubRes.payload).success ? "SUCCESS" : "FAILED"})`);
    } else {
      console.error(`❌ Failed to create package [${fixture.package_code}]: status=${res.statusCode}, error:`, res.payload);
    }
  }

  // 2. LOCAL PACKAGES
  console.log("\n--- 2. INSERTING LOCAL PACKAGES VIA ADMIN CONTRACT ---");
  for (const fixture of localPackageFixtures) {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/local-packages",
      headers: adminHeaders,
      payload: fixture,
    });

    if (res.statusCode === 201) {
      const data = JSON.parse(res.payload);
      const lpId = data.data.id;
      console.log(`✅ Created local package [${fixture.package_code}]: id=${lpId}`);

      const pubRes = await app.inject({
        method: "POST",
        url: `/api/v1/ops/admin/local-packages/${lpId}/publish`,
        headers: adminHeaders,
      });
      console.log(`   Publish status: ${pubRes.statusCode} (${JSON.parse(pubRes.payload).success ? "SUCCESS" : "FAILED"})`);
    } else {
      console.error(`❌ Failed local package [${fixture.package_code}]: status=${res.statusCode}, error:`, res.payload);
    }
  }

  // 3. TRANSFERS
  console.log("\n--- 3. INSERTING TRANSFERS VIA ADMIN CONTRACT ---");
  for (const fixture of transferFixtures) {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/transfer-routes",
      headers: adminHeaders,
      payload: fixture,
    });

    if (res.statusCode === 201) {
      const data = JSON.parse(res.payload);
      const trId = data.data.id;
      console.log(`✅ Created transfer [${fixture.route_code}]: id=${trId}`);

      const pubRes = await app.inject({
        method: "POST",
        url: `/api/v1/ops/admin/transfer-routes/${trId}/publish`,
        headers: adminHeaders,
      });
      console.log(`   Publish status: ${pubRes.statusCode} (${JSON.parse(pubRes.payload).success ? "SUCCESS" : "FAILED"})`);
    } else {
      console.error(`❌ Failed transfer [${fixture.route_code}]: status=${res.statusCode}, error:`, res.payload);
    }
  }

  // 4. VERIFY DATABASE COUNTS & ROWS
  console.log("\n--- 4. VERIFYING DATABASE ROWS AFTER ADMIN INSERTION ---");
  if (db && (db as any).pool) {
    const pool = (db as any).pool;
    const tpCount = await pool.query("SELECT count(*) as total, count(*) FILTER (WHERE status = 'published') as published FROM tour_packages");
    console.log(`tour_packages in DB: total = ${tpCount.rows[0].total}, published = ${tpCount.rows[0].published}`);

    const lpCount = await pool.query("SELECT count(*) as total, count(*) FILTER (WHERE status = 'published') as published FROM local_packages");
    console.log(`local_packages in DB: total = ${lpCount.rows[0].total}, published = ${lpCount.rows[0].published}`);

    const trCount = await pool.query("SELECT count(*) as total, count(*) FILTER (WHERE status = 'published') as published FROM transfers");
    console.log(`transfers in DB: total = ${trCount.rows[0].total}, published = ${trCount.rows[0].published}`);

    const frCount = await pool.query("SELECT count(*) as total FROM fare_rules WHERE is_active = true");
    console.log(`fare_rules in DB (active): total = ${frCount.rows[0].total}`);
  }

  // 5. VERIFY PUBLIC APIS RETURNING NEW DATA
  console.log("\n--- 5. VERIFYING PUBLIC CUSTOMER APIS ---");
  const testEndpoints = [
    { name: "Published Catalog", url: "/api/v1/catalog" },
    { name: "Tour Packages Manifest", url: "/api/v1/tour-packages/manifest" },
    { name: "Local Tours Manifest", url: "/api/v1/local-tours" },
    { name: "Transfers Manifest", url: "/api/v1/transfers" },
    { name: "Product Detail: taj-mahal-sunrise-tour", url: "/api/v1/catalog/tour_package/taj-mahal-sunrise-tour" },
    { name: "Product Detail: agra-sightseeing", url: "/api/v1/catalog/tour_package/agra-sightseeing" },
    { name: "Product Detail: mathura-vrindavan", url: "/api/v1/catalog/tour_package/mathura-vrindavan" },
    { name: "Product Detail: agra-fort-heritage-tour", url: "/api/v1/catalog/local_package/agra-fort-heritage-tour" },
    { name: "Product Detail: delhi-airport-to-agra-hotel", url: "/api/v1/catalog/transfer/delhi-airport-to-agra-hotel" },
  ];

  for (const ep of testEndpoints) {
    const pubRes = await app.inject({ method: "GET", url: ep.url });
    let countOrStatus = "";
    try {
      const parsed = JSON.parse(pubRes.payload);
      if (Array.isArray(parsed.data)) countOrStatus = `${parsed.data.length} items`;
      else if (parsed.products) countOrStatus = `${parsed.products.length} products, ${parsed.vehicles.length} vehicles`;
      else if (parsed.name) countOrStatus = `Product "${parsed.name}" (price ₹${parsed.starting_price_inr})`;
    } catch {
      countOrStatus = pubRes.payload.slice(0, 50);
    }
    console.log(`[${pubRes.statusCode === 200 ? "PASS" : "FAIL"}] ${ep.name} (${ep.url}) → ${pubRes.statusCode} (${countOrStatus})`);
  }

  await app.close();
  if (db && (db as any).pool) {
    await (db as any).pool.end();
  }
}

runQaDataInsertion().catch(console.error);
