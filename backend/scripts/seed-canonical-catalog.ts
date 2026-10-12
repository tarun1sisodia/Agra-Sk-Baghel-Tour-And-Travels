import pg from "pg";
import { loadEnv } from "../src/config/env.js";

async function run() {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log("Seeding canonical Clean Fare System catalog records...");
    await client.query("BEGIN");

    // Fetch vehicle models to associate fare_rules
    const vmRes = await client.query("SELECT id, display_name, vehicle_group_id FROM vehicle_models");
    const vehicleModels: Array<{ id: string; display_name: string; vehicle_group_id: string }> = vmRes.rows;

    const getModelId = (nameSubstr: string): string | null => {
      const found = vehicleModels.find((m) =>
        m.display_name.toLowerCase().includes(nameSubstr.toLowerCase())
      );
      return found?.id ?? null;
    };

    const sedanModelId = getModelId("Dzire") ?? vehicleModels[0]?.id;
    const ertigaModelId = getModelId("Ertiga") ?? vehicleModels[1]?.id;
    const innovaModelId = getModelId("Innova") ?? vehicleModels[2]?.id;
    const tempoModelId = getModelId("Traveller") ?? vehicleModels[3]?.id;
    const urbaniaModelId = getModelId("Urbania") ?? vehicleModels[4]?.id;

    // 1. Tour Packages (Clean Fare System Schema)
    const tourPackages = [
      {
        id: "d0000000-0000-4000-a000-000000000001",
        code: "same-day-agra-taj-mahal-tour",
        name: "Same Day Agra Taj Mahal Tour",
        duration_text: "1 day",
        days: 1,
        nights: 0,
        source: "Agra",
        destination: "Same Day Agra Taj Mahal Tour",
        description: "Point-to-point same-day guided tour of Taj Mahal, Agra Fort, and Mehtab Bagh with dedicated chauffeur.",
        inclusions_highlight: "Dedicated AC Cab, Uniformed Chauffeur, Highway Tolls & Chilled Water",
        inclusions_note: "Doorstep hotel or railway station pickup anywhere in Agra.",
        inclusions: [
          "Private AC Cab dedicated exclusively to your group",
          "Police-verified professional chauffeur & fuel charges",
          "All highway toll taxes & state border permits",
          "Doorstep hotel / railway station pickup & drop",
          "Chilled packaged drinking water bottles",
        ],
        exclusions: [
          "Monument entry tickets & camera/drone permits",
          "Meals, buffet lunches & personal snacks/dining",
          "Chauffeur / guide discretionary tips & gratuities",
          "Special temple VIP pooja / express darshan passes",
          "Personal shopping & handicraft purchases",
        ],
        itinerary: [
          { time: "06:00 AM", title: "Taj Mahal Sunrise Departure", desc: "Private pickup from hotel or station; seamless entry at East Gate." },
          { time: "09:30 AM", title: "Agra Fort Royal Palaces", desc: "Explore the UNESCO red sandstone fortress and Mughal courtyards." },
          { time: "01:00 PM", title: "Lunch Break & Inlay Marble", desc: "Authentic lunch halt followed by pietra dura inlay craftsmanship." },
          { time: "04:30 PM", title: "Mehtab Bagh Sunset Vantage", desc: "Panoramic sunset view across Yamuna River with iconic silhouette." },
          { time: "06:30 PM", title: "Chauffeured Return Drop", desc: "Doorstep drop to your hotel or Agra Cantt Railway Station." },
        ],
        image_url: "/assets/places/gallery/taj-mahal-01.jpg",
        gallery: [
          { url: "/assets/places/gallery/taj-mahal-01.jpg", caption: "Taj Mahal reflection pool at dawn", alt: "Taj Mahal dawn reflection Agra" },
          { url: "/assets/places/gallery/agra-fort-01.jpg", caption: "Grand Amar Singh Gate at Agra Red Fort", alt: "Amar Singh Gate Agra Red Fort" },
          { url: "/assets/places/gallery/mehtab-bagh-01.jpg", caption: "Sunset vantage point over Yamuna", alt: "Sunset vantage point over Yamuna" },
          { url: "/assets/places/gallery/taj-mahal-02.jpg", caption: "Taj Mahal marble archways & minarets", alt: "Taj Mahal marble archways" },
        ],
        status: "published",
        fares: { sedan: 3499, ertiga: 4299, innova: 5299, tempo: 6999, urbania: 8999 },
      },
      {
        id: "d0000000-0000-4000-a000-000000000002",
        code: "taj-mahal-sunrise-tour",
        name: "Taj Mahal Sunrise Tour",
        duration_text: "1 day",
        days: 1,
        nights: 0,
        source: "Agra",
        destination: "Taj Mahal & Baby Taj",
        description: "Early pre-dawn pickup to experience the Taj Mahal at its quietest and most breathtaking golden dawn hour.",
        inclusions_highlight: "Pre-Dawn Hotel Pickup, Chauffeur Allowance & Sanitized AC Cab",
        inclusions_note: "Optimal pre-dawn timing avoids midday tourist crowds.",
        inclusions: [
          "Private AC Cab dedicated exclusively to your group",
          "Police-verified chauffeur & early-morning fuel allowance",
          "All state road taxes & toll permits",
          "Doorstep hotel pickup by 05:30 AM",
        ],
        exclusions: [
          "Monument entry permits",
          "Meals & refreshments",
          "Personal expenditures",
        ],
        itinerary: [
          { time: "05:30 AM", title: "Early Pre-Dawn Pickup", desc: "Direct hotel pickup to arrive before sunrise at Taj Mahal." },
          { time: "08:30 AM", title: "Breakfast & Relaxation", desc: "Leisure breakfast break in Agra city." },
          { time: "10:30 AM", title: "Baby Taj (Itmad-ud-Daulah)", desc: "Exquisite precursor to Taj Mahal on Yamuna riverfront." },
        ],
        image_url: "/assets/places/gallery/taj-mahal-02.jpg",
        gallery: [
          { url: "/assets/places/gallery/taj-mahal-02.jpg", caption: "Taj Mahal marble archways & minarets", alt: "Taj Mahal dome architecture" },
          { url: "/assets/places/gallery/taj-mahal-01.jpg", caption: "Taj Mahal reflection pool at dawn", alt: "Taj Mahal dawn reflection Agra" },
          { url: "/assets/places/gallery/agra-fort-02.jpg", caption: "Diwan-i-Khas marble royal pavilion", alt: "Diwan-i-Khas Agra Fort" },
        ],
        status: "published",
        fares: { sedan: 3999, ertiga: 4799, innova: 5799, tempo: 7499, urbania: 9499 },
      },
      {
        id: "d0000000-0000-4000-a000-000000000003",
        code: "mathura-vrindavan",
        name: "Mathura & Vrindavan Spiritual Darshan",
        duration_text: "1 day",
        days: 1,
        nights: 0,
        source: "Agra",
        destination: "Mathura & Vrindavan",
        description: "Full-day spiritual darshan connecting Krishna Janmabhoomi, Banke Bihari Mandir, and Prem Mandir.",
        inclusions_highlight: "Dedicated Chauffeur, Interstate Permits, Parking & Fuel",
        inclusions_note: "Seamless temple coordination for Banke Bihari & Prem Mandir.",
        inclusions: [
          "Dedicated sanitized AC cab for full day (10 hrs)",
          "Police-verified chauffeur & fuel",
          "Toll taxes and state permits",
        ],
        exclusions: [
          "Special VIP pooja tickets",
          "Meals & prasad items",
        ],
        itinerary: [
          { time: "07:30 AM", title: "Departure from Agra", desc: "Expressway drive to Mathura holy land." },
          { time: "09:00 AM", title: "Krishna Janmabhoomi Darshan", desc: "Sacred temple complex and prison cell birth sanctum." },
          { time: "02:00 PM", title: "Banke Bihari Mandir", desc: "Heartfelt darshan at Vrindavan's most revered shrine." },
          { time: "06:30 PM", title: "Prem Mandir Evening Light Show", desc: "Illuminated marble complex before return to Agra." },
        ],
        image_url: "/assets/places/gallery/mathura-vrindavan-01.jpg",
        gallery: [
          { url: "/assets/places/gallery/mathura-vrindavan-01.jpg", caption: "Prem Mandir & Banke Bihari illumination", alt: "Prem Mandir illuminated at night" },
          { url: "/assets/places/gallery/fatehpur-sikri-01.jpg", caption: "Buland Darwaza imperial gate", alt: "Buland Darwaza Fatehpur Sikri" },
          { url: "/assets/places/gallery/mehtab-bagh-01.jpg", caption: "Mehtab Bagh sunset vantage point", alt: "Mehtab Bagh across Yamuna River" },
        ],
        status: "published",
        fares: { sedan: 3200, ertiga: 3900, innova: 4800, tempo: 6500, urbania: 8500 },
      },
    ];

    for (const p of tourPackages) {
      await client.query(
        `INSERT INTO tour_packages (
          id, code, name, duration_text, days, nights, source, destination,
          description, inclusions_highlight, inclusions_note, image_url,
          gallery, inclusions, exclusions, itinerary, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()
        )
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          duration_text = EXCLUDED.duration_text,
          description = EXCLUDED.description,
          gallery = EXCLUDED.gallery,
          inclusions = EXCLUDED.inclusions,
          exclusions = EXCLUDED.exclusions,
          itinerary = EXCLUDED.itinerary,
          status = EXCLUDED.status;`,
        [
          p.id,
          p.code,
          p.name,
          p.duration_text,
          p.days,
          p.nights,
          p.source,
          p.destination,
          p.description,
          p.inclusions_highlight,
          p.inclusions_note,
          p.image_url,
          JSON.stringify(p.gallery),
          JSON.stringify(p.inclusions),
          JSON.stringify(p.exclusions),
          JSON.stringify(p.itinerary),
          p.status,
        ]
      );

      // Seed fare_rules for this tour package
      const modelPairs = [
        { modelId: sedanModelId, amt: p.fares.sedan },
        { modelId: ertigaModelId, amt: p.fares.ertiga },
        { modelId: innovaModelId, amt: p.fares.innova },
        { modelId: tempoModelId, amt: p.fares.tempo },
        { modelId: urbaniaModelId, amt: p.fares.urbania },
      ];

      for (const pair of modelPairs) {
        if (!pair.modelId) continue;
        await client.query(
          `INSERT INTO fare_rules (category, vehicle_model_id, tour_package_id, amount, is_active)
           VALUES ('tour_package', $1, $2, $3, true)
           ON CONFLICT (category, vehicle_model_id, local_package_id, transfer_id, tour_package_id)
           DO UPDATE SET amount = EXCLUDED.amount, is_active = true;`,
          [pair.modelId, p.id, pair.amt]
        );
      }

      console.log(`  ✓ Seeded canonical tour package: ${p.name}`);
    }

    // 2. Transfers (Clean Fare System Schema)
    const transfers = [
      {
        id: "e0000000-0000-4000-a000-000000000001",
        code: "agc-station-transfer",
        name: "Agra Cantt Railway Station (AGC) Transfer",
        direction: "both",
        hub_name: "Agra Cantt Railway Station",
        description: "Doorstep pickup or drop at Agra Cantt Railway Station (AGC) with meet-and-greet.",
        inclusions: ["Chauffeur greeting at exit gate", "Luggage assistance", "Parking and tolls included"],
        exclusions: ["Porter gratuity", "Multiple stopovers"],
        status: "published",
        fares: { sedan: 800, ertiga: 900, innova: 1100, tempo: 2200, urbania: 3500 },
      },
      {
        id: "e0000000-0000-4000-a000-000000000002",
        code: "af-station-transfer",
        name: "Agra Fort Railway Station (AF) Transfer",
        direction: "both",
        hub_name: "Agra Fort Railway Station",
        description: "Chauffeured pickup and drop at Agra Fort Railway Station (AF).",
        inclusions: ["Doorstep pickup or drop", "Luggage assistance", "Parking included"],
        exclusions: ["Porter tip"],
        status: "published",
        fares: { sedan: 800, ertiga: 900, innova: 1100, tempo: 2200, urbania: 3500 },
      },
      {
        id: "e0000000-0000-4000-a000-000000000003",
        code: "kheria-airport-transfer",
        name: "Agra Airport (Kheria AGR) Transfer",
        direction: "both",
        hub_name: "Agra Kheria Airport",
        description: "Flight-tracked pickup or departure drop at Agra Kheria Airport.",
        inclusions: ["Flight arrival monitoring", "No waiting surcharge for delays", "Chauffeur meet-and-greet"],
        exclusions: ["Excess waiting over 90 mins"],
        status: "published",
        fares: { sedan: 900, ertiga: 1050, innova: 1250, tempo: 2400, urbania: 3800 },
      },
      {
        id: "e0000000-0000-4000-a000-000000000004",
        code: "delhi-igi-oneway-transfer",
        name: "Delhi IGI Airport (DEL) Direct Transfer (One-Way)",
        direction: "both",
        hub_name: "Delhi IGI Airport (DEL)",
        description: "Expressway direct transit between Agra hotels and Delhi IGI Airport Terminal 1/2/3.",
        inclusions: ["Yamuna Expressway tolls included", "Doorstep pickup", "Chilled water"],
        exclusions: ["Terminal parking charges"],
        status: "published",
        fares: { sedan: 3499, ertiga: 4200, innova: 5200, tempo: 8500, urbania: 11500 },
      },
    ];

    for (const t of transfers) {
      await client.query(
        `INSERT INTO transfers (
          id, code, name, direction, hub_name, description, inclusions, exclusions, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
        )
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          direction = EXCLUDED.direction,
          hub_name = EXCLUDED.hub_name,
          description = EXCLUDED.description,
          inclusions = EXCLUDED.inclusions,
          exclusions = EXCLUDED.exclusions,
          status = EXCLUDED.status;`,
        [t.id, t.code, t.name, t.direction, t.hub_name, t.description, JSON.stringify(t.inclusions), JSON.stringify(t.exclusions), t.status]
      );

      // Seed fare_rules for transfer
      const transferPairs = [
        { modelId: sedanModelId, amt: t.fares.sedan },
        { modelId: ertigaModelId, amt: t.fares.ertiga },
        { modelId: innovaModelId, amt: t.fares.innova },
        { modelId: tempoModelId, amt: t.fares.tempo },
        { modelId: urbaniaModelId, amt: t.fares.urbania },
      ];

      for (const pair of transferPairs) {
        if (!pair.modelId) continue;
        await client.query(
          `INSERT INTO fare_rules (category, vehicle_model_id, transfer_id, amount, is_active)
           VALUES ('transfer', $1, $2, $3, true)
           ON CONFLICT (category, vehicle_model_id, local_package_id, transfer_id, tour_package_id)
           DO UPDATE SET amount = EXCLUDED.amount, is_active = true;`,
          [pair.modelId, t.id, pair.amt]
        );
      }

      console.log(`  ✓ Seeded canonical transfer: ${t.name}`);
    }

    // 3. Local Packages (Clean Fare System Schema)
    const localPackages = [
      {
        id: "f0000000-0000-4000-a000-000000000001",
        code: "agra-standard-sightseeing",
        name: "Agra Standard Sightseeing (8 Hours / 80 Km)",
        duration_hours: 8,
        included_km: 80,
        description: "Full-day sightseeing tour covering Taj Mahal, Agra Fort, Mehtab Bagh, and Baby Taj within 8 hours and 80 kilometers.",
        inclusions: ["8 Hours vehicle & chauffeur use", "80 kilometers city transit", "Chauffeur allowance and fuel"],
        exclusions: ["Monument tickets & camera passes", "Parking fees at monuments", "Meals & refreshments"],
        status: "published",
        fares: { sedan: 1900, ertiga: 2600, innova: 2850, tempo: 5500, urbania: 7500 },
      },
    ];

    for (const l of localPackages) {
      await client.query(
        `INSERT INTO local_packages (
          id, code, name, duration_hours, included_km, description, inclusions, exclusions, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
        )
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          duration_hours = EXCLUDED.duration_hours,
          included_km = EXCLUDED.included_km,
          description = EXCLUDED.description,
          inclusions = EXCLUDED.inclusions,
          exclusions = EXCLUDED.exclusions,
          status = EXCLUDED.status;`,
        [
          l.id,
          l.code,
          l.name,
          l.duration_hours,
          l.included_km,
          l.description,
          JSON.stringify(l.inclusions),
          JSON.stringify(l.exclusions),
          l.status,
        ]
      );

      // Seed fare_rules for local package
      const localPairs = [
        { modelId: sedanModelId, amt: l.fares.sedan },
        { modelId: ertigaModelId, amt: l.fares.ertiga },
        { modelId: innovaModelId, amt: l.fares.innova },
        { modelId: tempoModelId, amt: l.fares.tempo },
        { modelId: urbaniaModelId, amt: l.fares.urbania },
      ];

      for (const pair of localPairs) {
        if (!pair.modelId) continue;
        await client.query(
          `INSERT INTO fare_rules (category, vehicle_model_id, local_package_id, amount, is_active)
           VALUES ('local_package', $1, $2, $3, true)
           ON CONFLICT (category, vehicle_model_id, local_package_id, transfer_id, tour_package_id)
           DO UPDATE SET amount = EXCLUDED.amount, is_active = true;`,
          [pair.modelId, l.id, pair.amt]
        );
      }

      console.log(`  ✓ Seeded canonical local package: ${l.name}`);
    }

    await client.query("COMMIT");
    console.log("✅ Canonical catalog seeded successfully with Clean Fare System schema!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Canonical seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
