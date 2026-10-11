const fs = require("fs");
const path = require("path");
const pg = require(path.resolve(__dirname, "../backend/node_modules/pg"));

const envPath = path.resolve(__dirname, "../backend/.env");
const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/DATABASE_URL=(.+)/);
if (!match) {
  console.error("DATABASE_URL not found in backend/.env");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: match[1].trim() });

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("Connected to database. Seeding complete clean catalog...");

    // 1. Fetch vehicle model IDs
    const dzireRes = await client.query("SELECT id FROM vehicle_models WHERE model_name = 'Dzire' LIMIT 1");
    const innovaRes = await client.query("SELECT id FROM vehicle_models WHERE model_name = 'Innova Crysta' LIMIT 1");
    if (!dzireRes.rows.length || !innovaRes.rows.length) {
      throw new Error("Vehicle models Dzire / Innova Crysta missing from DB!");
    }
    const dzireId = dzireRes.rows[0].id;
    const innovaId = innovaRes.rows[0].id;
    console.log(`Using models: Dzire=${dzireId}, Innova=${innovaId}`);

    // 2. Outstation Routes
    const outstationRoutes = [
      {
        id: "20000000-0000-0000-0001-000000000001",
        code: "agra-to-delhi",
        origin_name: "Agra",
        destination_name: "Delhi",
        distance_km: 230,
        duration_minutes: 210,
        description: "Direct expressway travel from Agra to Delhi NCR via Yamuna Expressway.",
        dzireFare: 2500,
        innovaFare: 4500,
      },
      {
        id: "20000000-0000-0000-0001-000000000002",
        code: "delhi-to-agra",
        origin_name: "Delhi",
        destination_name: "Agra",
        distance_km: 230,
        duration_minutes: 210,
        description: "Expressway pickup from Delhi / IGI Airport to Agra hotels or Taj Mahal.",
        dzireFare: 2500,
        innovaFare: 4500,
      },
      {
        id: "20000000-0000-0000-0001-000000000003",
        code: "agra-to-jaipur",
        origin_name: "Agra",
        destination_name: "Jaipur",
        distance_km: 240,
        duration_minutes: 270,
        description: "Scenic highway drive from Agra to Pink City Jaipur with Fatehpur Sikri stop option.",
        dzireFare: 2900,
        innovaFare: 5200,
      },
      {
        id: "20000000-0000-0000-0001-000000000004",
        code: "agra-to-mathura",
        origin_name: "Agra",
        destination_name: "Mathura",
        distance_km: 55,
        duration_minutes: 75,
        description: "Short highway transfer to Krishna Janmabhoomi Mathura and Vrindavan temples.",
        dzireFare: 1400,
        innovaFare: 2400,
      },
      {
        id: "20000000-0000-0000-0001-000000000005",
        code: "agra-to-gwalior",
        origin_name: "Agra",
        destination_name: "Gwalior",
        distance_km: 120,
        duration_minutes: 150,
        description: "Historical fort route from Agra to Gwalior via NH-44 through Chambal valley.",
        dzireFare: 2200,
        innovaFare: 3800,
      },
    ];

    for (const r of outstationRoutes) {
      const insRes = await client.query(
        `INSERT INTO outstation_routes (id, code, origin_name, destination_name, distance_km, duration_minutes, description, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'published')
         ON CONFLICT (code) DO UPDATE SET 
           origin_name = EXCLUDED.origin_name,
           destination_name = EXCLUDED.destination_name,
           distance_km = EXCLUDED.distance_km,
           duration_minutes = EXCLUDED.duration_minutes,
           description = EXCLUDED.description,
           status = 'published'
         RETURNING id`,
        [r.id, r.code, r.origin_name, r.destination_name, r.distance_km, r.duration_minutes, r.description]
      );
      const actualRouteId = insRes.rows[0].id;

      // Route vehicles for Dzire and Innova
      await client.query(
        `INSERT INTO outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
         VALUES ($1, $2, $3, true, true)
         ON CONFLICT (route_id, vehicle_model_id) DO UPDATE SET
           one_way_amount = EXCLUDED.one_way_amount,
           round_trip_enabled = true,
           is_active = true`,
        [actualRouteId, dzireId, r.dzireFare]
      );
      await client.query(
        `INSERT INTO outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
         VALUES ($1, $2, $3, true, true)
         ON CONFLICT (route_id, vehicle_model_id) DO UPDATE SET
           one_way_amount = EXCLUDED.one_way_amount,
           round_trip_enabled = true,
           is_active = true`,
        [actualRouteId, innovaId, r.innovaFare]
      );
      console.log(`  ✓ Route published: ${r.code} (id: ${actualRouteId})`);
    }

    // 3. Local Packages
    const localPackages = [
      {
        id: "30000000-0000-0000-0001-000000000001",
        code: "agra-8h-80km",
        name: "Agra Sightseeing (8 Hours / 80 KM)",
        duration_hours: 8,
        included_km: 80,
        description: "Comprehensive day tour covering Taj Mahal, Agra Fort, and Mehtab Bagh with AC chauffeur.",
        dzireFare: 1900,
        innovaFare: 3400,
      },
      {
        id: "30000000-0000-0000-0001-000000000002",
        code: "agra-12h-120km",
        name: "Agra Extended Sightseeing (12 Hours / 120 KM)",
        duration_hours: 12,
        included_km: 120,
        description: "Full day tour covering Taj Mahal, Agra Fort, Fatehpur Sikri, and sunset at Mehtab Bagh.",
        dzireFare: 2200,
        innovaFare: 3900,
      },
    ];

    for (const lp of localPackages) {
      const insRes = await client.query(
        `INSERT INTO local_packages (id, code, name, duration_hours, included_km, description, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'published')
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           duration_hours = EXCLUDED.duration_hours,
           included_km = EXCLUDED.included_km,
           description = EXCLUDED.description,
           status = 'published'
         RETURNING id`,
        [lp.id, lp.code, lp.name, lp.duration_hours, lp.included_km, lp.description]
      );
      const actualId = insRes.rows[0].id;

      // Fare rules for local packages
      await client.query(
        `INSERT INTO fare_rules (category, vehicle_model_id, local_package_id, amount, is_active)
         VALUES ('local_package', $1, $2, $3, true)
         ON CONFLICT (category, vehicle_model_id, COALESCE(local_package_id, '00000000-0000-0000-0000-000000000000'), COALESCE(transfer_id, '00000000-0000-0000-0000-000000000000'), COALESCE(tour_package_id, '00000000-0000-0000-0000-000000000000'))
         DO UPDATE SET amount = EXCLUDED.amount, is_active = true`,
        [dzireId, actualId, lp.dzireFare]
      );
      await client.query(
        `INSERT INTO fare_rules (category, vehicle_model_id, local_package_id, amount, is_active)
         VALUES ('local_package', $1, $2, $3, true)
         ON CONFLICT (category, vehicle_model_id, COALESCE(local_package_id, '00000000-0000-0000-0000-000000000000'), COALESCE(transfer_id, '00000000-0000-0000-0000-000000000000'), COALESCE(tour_package_id, '00000000-0000-0000-0000-000000000000'))
         DO UPDATE SET amount = EXCLUDED.amount, is_active = true`,
        [innovaId, actualId, lp.innovaFare]
      );
      console.log(`  ✓ Local package published: ${lp.code}`);
    }

    // 4. Transfers
    const transfers = [
      {
        id: "40000000-0000-0000-0001-000000000001",
        code: "agra-cantt-to-hotel",
        name: "Agra Cantt Railway Station to Hotel",
        description: "Punctual platform greeting, luggage assistance, and direct AC ride to your Agra hotel.",
        dzireFare: 800,
        innovaFare: 1400,
      },
      {
        id: "40000000-0000-0000-0001-000000000002",
        code: "delhi-igi-airport-transfer",
        name: "Agra to Delhi IGI Airport Terminal Transfer",
        description: "Expressway pickup directly to IGI Airport T1/T2/T3 with complimentary flight delay tracking.",
        dzireFare: 2800,
        innovaFare: 4800,
      },
    ];

    for (const tr of transfers) {
      const insRes = await client.query(
        `INSERT INTO transfers (id, code, name, description, status)
         VALUES ($1, $2, $3, $4, 'published')
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           status = 'published'
         RETURNING id`,
        [tr.id, tr.code, tr.name, tr.description]
      );
      const actualId = insRes.rows[0].id;

      await client.query(
        `INSERT INTO fare_rules (category, vehicle_model_id, transfer_id, amount, is_active)
         VALUES ('transfer', $1, $2, $3, true)
         ON CONFLICT (category, vehicle_model_id, COALESCE(local_package_id, '00000000-0000-0000-0000-000000000000'), COALESCE(transfer_id, '00000000-0000-0000-0000-000000000000'), COALESCE(tour_package_id, '00000000-0000-0000-0000-000000000000'))
         DO UPDATE SET amount = EXCLUDED.amount, is_active = true`,
        [dzireId, actualId, tr.dzireFare]
      );
      await client.query(
        `INSERT INTO fare_rules (category, vehicle_model_id, transfer_id, amount, is_active)
         VALUES ('transfer', $1, $2, $3, true)
         ON CONFLICT (category, vehicle_model_id, COALESCE(local_package_id, '00000000-0000-0000-0000-000000000000'), COALESCE(transfer_id, '00000000-0000-0000-0000-000000000000'), COALESCE(tour_package_id, '00000000-0000-0000-0000-000000000000'))
         DO UPDATE SET amount = EXCLUDED.amount, is_active = true`,
        [innovaId, actualId, tr.innovaFare]
      );
      console.log(`  ✓ Transfer published: ${tr.code}`);
    }

    // 5. Tour Packages
    const tourPackages = [
      {
        id: "50000000-0000-0000-0001-000000000001",
        code: "golden-triangle-3d",
        name: "Golden Triangle Tour (3 Days / 2 Nights)",
        days: 3,
        nights: 2,
        description: "Delhi -> Agra -> Jaipur circuit with dedicated chauffeur and curated monument entries.",
        dzireFare: 9500,
        innovaFare: 16500,
      },
      {
        id: "50000000-0000-0000-0001-000000000002",
        code: "taj-mahal-sunrise-guided-tour",
        name: "Taj Mahal Sunrise Guided Day Tour",
        days: 1,
        nights: 0,
        description: "Exclusive dawn expedition to the Taj Mahal followed by breakfast and Agra Fort tour.",
        dzireFare: 2400,
        innovaFare: 4200,
      },
      {
        id: "50000000-0000-0000-0001-000000000003",
        code: "mathura-vrindavan-spiritual-day-tour",
        name: "Mathura & Vrindavan Spiritual Darshan Tour",
        days: 1,
        nights: 0,
        description: "Sacred pilgrimage across Krishna Janmabhoomi, Bankey Bihari, Prem Mandir, and ISKCON.",
        dzireFare: 2100,
        innovaFare: 3600,
      },
    ];

    for (const tp of tourPackages) {
      const insRes = await client.query(
        `INSERT INTO tour_packages (id, code, name, days, nights, description, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'published')
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           days = EXCLUDED.days,
           nights = EXCLUDED.nights,
           description = EXCLUDED.description,
           status = 'published'
         RETURNING id`,
        [tp.id, tp.code, tp.name, tp.days, tp.nights, tp.description]
      );
      const actualId = insRes.rows[0].id;

      await client.query(
        `INSERT INTO fare_rules (category, vehicle_model_id, tour_package_id, amount, is_active)
         VALUES ('tour_package', $1, $2, $3, true)
         ON CONFLICT (category, vehicle_model_id, COALESCE(local_package_id, '00000000-0000-0000-0000-000000000000'), COALESCE(transfer_id, '00000000-0000-0000-0000-000000000000'), COALESCE(tour_package_id, '00000000-0000-0000-0000-000000000000'))
         DO UPDATE SET amount = EXCLUDED.amount, is_active = true`,
        [dzireId, actualId, tp.dzireFare]
      );
      await client.query(
        `INSERT INTO fare_rules (category, vehicle_model_id, tour_package_id, amount, is_active)
         VALUES ('tour_package', $1, $2, $3, true)
         ON CONFLICT (category, vehicle_model_id, COALESCE(local_package_id, '00000000-0000-0000-0000-000000000000'), COALESCE(transfer_id, '00000000-0000-0000-0000-000000000000'), COALESCE(tour_package_id, '00000000-0000-0000-0000-000000000000'))
         DO UPDATE SET amount = EXCLUDED.amount, is_active = true`,
        [innovaId, actualId, tp.innovaFare]
      );
      console.log(`  ✓ Tour package published: ${tp.code}`);
    }


    await client.query("COMMIT");
    console.log("✅ Successfully seeded complete catalog across all 4 categories!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
