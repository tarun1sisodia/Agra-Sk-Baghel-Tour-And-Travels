import pg from "pg";
import { loadEnv } from "../src/config/env.js";

interface RouteSeedSpec {
  destination: string;
  code: string;
  distanceKm: number;
  durationMinutes: number;
  sedanPrice: number;
  ertigaPrice: number | null;
  crystaPrice: number | null;
}

const ONE_WAY_ROUTES: RouteSeedSpec[] = [
  { destination: "Delhi", code: "agra-to-delhi", distanceKm: 230, durationMinutes: 240, sedanPrice: 5000, ertigaPrice: 6500, crystaPrice: 8500 },
  { destination: "Noida", code: "agra-to-noida", distanceKm: 195, durationMinutes: 200, sedanPrice: 4500, ertigaPrice: 6000, crystaPrice: 8000 },
  { destination: "Gurugram", code: "agra-to-gurugram", distanceKm: 215, durationMinutes: 220, sedanPrice: 4800, ertigaPrice: 6300, crystaPrice: 8300 },
  { destination: "Mathura", code: "agra-to-mathura", distanceKm: 60, durationMinutes: 75, sedanPrice: 3000, ertigaPrice: 3500, crystaPrice: 5000 },
  { destination: "Jaipur", code: "agra-to-jaipur", distanceKm: 240, durationMinutes: 270, sedanPrice: 5000, ertigaPrice: 6500, crystaPrice: 9000 },
  { destination: "Lucknow", code: "agra-to-lucknow", distanceKm: 335, durationMinutes: 300, sedanPrice: 8500, ertigaPrice: 9500, crystaPrice: 14800 },
  { destination: "Ayodhya", code: "agra-to-ayodhya", distanceKm: 470, durationMinutes: 420, sedanPrice: 12100, ertigaPrice: 15700, crystaPrice: 19800 },
  { destination: "Banaras", code: "agra-to-banaras", distanceKm: 630, durationMinutes: 570, sedanPrice: 12500, ertigaPrice: 16000, crystaPrice: 20000 },
  { destination: "Prayagraj", code: "agra-to-prayagraj", distanceKm: 480, durationMinutes: 450, sedanPrice: 12500, ertigaPrice: 16000, crystaPrice: 20000 },
  { destination: "Gwalior", code: "agra-to-gwalior", distanceKm: 120, durationMinutes: 150, sedanPrice: 4000, ertigaPrice: 5000, crystaPrice: 6000 },
  { destination: "Ajmer", code: "agra-to-ajmer", distanceKm: 370, durationMinutes: 390, sedanPrice: 7500, ertigaPrice: 8500, crystaPrice: 11000 },
  { destination: "Udaipur", code: "agra-to-udaipur", distanceKm: 630, durationMinutes: 630, sedanPrice: 15000, ertigaPrice: 18200, crystaPrice: 23500 },
  { destination: "Jaisalmer", code: "agra-to-jaisalmer", distanceKm: 800, durationMinutes: 840, sedanPrice: 5000, ertigaPrice: 6500, crystaPrice: 9500 },
  { destination: "Haridwar", code: "agra-to-haridwar", distanceKm: 390, durationMinutes: 420, sedanPrice: 9000, ertigaPrice: 11500, crystaPrice: 14500 },
  { destination: "Rishikesh", code: "agra-to-rishikesh", distanceKm: 415, durationMinutes: 450, sedanPrice: 8500, ertigaPrice: 12000, crystaPrice: 15000 },
  { destination: "Dehradun", code: "agra-to-dehradun", distanceKm: 435, durationMinutes: 480, sedanPrice: 9500, ertigaPrice: 13000, crystaPrice: 16000 },
  { destination: "Mussoorie", code: "agra-to-mussoorie", distanceKm: 470, durationMinutes: 540, sedanPrice: 10500, ertigaPrice: null, crystaPrice: null },
];

async function run() {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    console.error("DATABASE_URL is not configured.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    console.log("==================================================");
    console.log("  Agra SK Baghel Tour & Travels — Production Database Seed");
    console.log("==================================================");

    await client.query("BEGIN");

    // 1. Identify Admin User
    console.log("\n[1/3] Securing Admin Account & Cleaning Test Data...");
    const adminEmail = (env.ADMIN_EMAIL || "skbagheltravels@gmail.com").toLowerCase().trim();
    const adminUserRes = await client.query<{ id: string; email: string }>(
      "SELECT id, email FROM auth.users WHERE lower(email) = $1 LIMIT 1",
      [adminEmail]
    );

    let adminUserId: string | null = adminUserRes.rows[0]?.id ?? null;
    if (!adminUserId) {
      console.warn(`⚠️ Admin user ${adminEmail} not found in auth.users! Checking any authenticated user...`);
      const fallbackUserRes = await client.query<{ id: string; email: string }>(
        "SELECT id, email FROM auth.users ORDER BY created_at ASC LIMIT 1"
      );
      adminUserId = fallbackUserRes.rows[0]?.id ?? null;
    }

    if (!adminUserId) {
      throw new Error("No admin user found in auth.users. Cannot wipe database without admin user.");
    }

    console.log(`✓ Admin User ID: ${adminUserId} (${adminEmail})`);

    // Ensure admin profile exists in public.profiles with super_admin role
    await client.query(
      `INSERT INTO public.profiles (id, email, phone, full_name, role, created_at, updated_at)
       VALUES ($1, $2, '+919762817598', 'SK Baghel Admin', 'super_admin', NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET role = 'super_admin', email = $2, phone = '+919762817598', updated_at = NOW()`,
      [adminUserId, adminEmail]
    );
    console.log(`✓ Ensured super_admin role in public.profiles for ${adminEmail}`);

    // Clean operational/test data in proper foreign key order
    const operationalTables = [
      "review_images",
      "review_submissions",
      "review_links",
      "payments",
      "payment_webhook_events",
      "notification_jobs",
      "device_registrations",
      "bookings",
      "rental_enquiries",
    ];

    for (const table of operationalTables) {
      try {
        const res = await client.query(`DELETE FROM public."${table}"`);
        console.log(`  ✓ Cleared test data from "${table}" (${res.rowCount} rows removed)`);
      } catch (err: any) {
        if (err.code === "42P01") {
          // table does not exist
          continue;
        }
        throw err;
      }
    }

    // Delete non-admin profiles
    const deletedProfiles = await client.query(
      "DELETE FROM public.profiles WHERE id != $1",
      [adminUserId]
    );
    console.log(`  ✓ Removed ${deletedProfiles.rowCount} test profiles (preserved admin)`);

    // Delete non-admin auth users
    const deletedUsers = await client.query(
      "DELETE FROM auth.users WHERE id != $1",
      [adminUserId]
    );
    console.log(`  ✓ Removed ${deletedUsers.rowCount} test auth users (preserved admin)`);

    // 2. Resolve the 4 Vehicle Models (Sedan: Dzire & City; SUV: Ertiga & Innova Crysta)
    console.log("\n[2/3] Resolving 4 Target Vehicle Models...");
    const modelsRes = await client.query<{ id: string; make: string; model_name: string; display_name: string }>(
      "SELECT id, make, model_name, display_name FROM public.vehicle_models ORDER BY sort_order ASC"
    );
    const models = modelsRes.rows;

    const findModel = (nameSubstr: string) => {
      const target = nameSubstr.toLowerCase();
      return models.find(
        (m) => m.display_name.toLowerCase().includes(target) || m.model_name.toLowerCase().includes(target)
      );
    };

    const dzire = findModel("dzire");
    const city = findModel("city");
    const ertiga = findModel("ertiga");
    const crysta = findModel("crysta") || findModel("innova");

    if (!dzire || !city || !ertiga || !crysta) {
      throw new Error(
        `Failed to find all 4 vehicle models. Found: dzire=${dzire?.id}, city=${city?.id}, ertiga=${ertiga?.id}, crysta=${crysta?.id}`
      );
    }

    console.log(`✓ Maruti Dzire (Sedan): ${dzire.id}`);
    console.log(`✓ Honda City (Sedan):   ${city.id}`);
    console.log(`✓ Maruti Ertiga (SUV):  ${ertiga.id}`);
    console.log(`✓ Innova Crysta (SUV):  ${crysta.id}`);

    // Ensure all 4 models are marked active
    await client.query(
      "UPDATE public.vehicle_models SET is_active = true WHERE id IN ($1, $2, $3, $4)",
      [dzire.id, city.id, ertiga.id, crysta.id]
    );

    // 3. Upsert One-Way Routes and Vehicle Rates
    console.log("\n[3/3] Seeding One-Way Routes and Pricing for the 4 Vehicles...");

    // Clean up any obsolete duplicate routes if present (e.g. agra-to-mathura-taxi-service)
    await client.query(
      "DELETE FROM public.outstation_route_vehicles WHERE route_id IN (SELECT id FROM public.outstation_routes WHERE code = 'agra-to-mathura-taxi-service')"
    );
    await client.query("DELETE FROM public.outstation_routes WHERE code = 'agra-to-mathura-taxi-service'");

    for (const r of ONE_WAY_ROUTES) {
      const desc = `Direct chauffeured outstation cab from Agra to ${r.destination} via express highway corridor with commercial taxes and tolls included.`;

      const routeRes = await client.query<{ id: string }>(
        `INSERT INTO public.outstation_routes (code, origin_name, destination_name, distance_km, duration_minutes, description, status, created_at, updated_at)
         VALUES ($1, 'Agra', $2, $3, $4, $5, 'published', NOW(), NOW())
         ON CONFLICT (code) DO UPDATE SET
           origin_name = 'Agra',
           destination_name = excluded.destination_name,
           distance_km = excluded.distance_km,
           duration_minutes = excluded.duration_minutes,
           description = excluded.description,
           status = 'published',
           updated_at = NOW()
         RETURNING id`,
        [r.code, r.destination, r.distanceKm, r.durationMinutes, desc]
      );

      const routeId = routeRes.rows[0]?.id;
      if (!routeId) throw new Error(`Failed to insert or update route ${r.code}`);

      // 1. Maruti Dzire (Sedan fare)
      await client.query(
        `INSERT INTO public.outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
         VALUES ($1, $2, $3, true, true)
         ON CONFLICT (route_id, vehicle_model_id) DO UPDATE SET
           one_way_amount = excluded.one_way_amount,
           round_trip_enabled = true,
           is_active = true`,
        [routeId, dzire.id, r.sedanPrice]
      );

      // 2. Honda City (Sedan fare)
      await client.query(
        `INSERT INTO public.outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
         VALUES ($1, $2, $3, true, true)
         ON CONFLICT (route_id, vehicle_model_id) DO UPDATE SET
           one_way_amount = excluded.one_way_amount,
           round_trip_enabled = true,
           is_active = true`,
        [routeId, city.id, r.sedanPrice]
      );

      // 3. Maruti Ertiga (Ertiga fare)
      if (r.ertigaPrice !== null) {
        await client.query(
          `INSERT INTO public.outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
           VALUES ($1, $2, $3, true, true)
           ON CONFLICT (route_id, vehicle_model_id) DO UPDATE SET
             one_way_amount = excluded.one_way_amount,
             round_trip_enabled = true,
             is_active = true`,
          [routeId, ertiga.id, r.ertigaPrice]
        );
      } else {
        await client.query(
          `INSERT INTO public.outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
           VALUES ($1, $2, NULL, true, true)
           ON CONFLICT (route_id, vehicle_model_id) DO UPDATE SET
             one_way_amount = NULL,
             round_trip_enabled = true,
             is_active = true`,
          [routeId, ertiga.id]
        );
      }

      // 4. Innova Crysta (Crysta fare)
      if (r.crystaPrice !== null) {
        await client.query(
          `INSERT INTO public.outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
           VALUES ($1, $2, $3, true, true)
           ON CONFLICT (route_id, vehicle_model_id) DO UPDATE SET
             one_way_amount = excluded.one_way_amount,
             round_trip_enabled = true,
             is_active = true`,
          [routeId, crysta.id, r.crystaPrice]
        );
      } else {
        await client.query(
          `INSERT INTO public.outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
           VALUES ($1, $2, NULL, true, true)
           ON CONFLICT (route_id, vehicle_model_id) DO UPDATE SET
             one_way_amount = NULL,
             round_trip_enabled = true,
             is_active = true`,
          [routeId, crysta.id]
        );
      }

      // Ensure any OTHER vehicle models on this route have one_way_amount = NULL
      await client.query(
        `UPDATE public.outstation_route_vehicles
         SET one_way_amount = NULL
         WHERE route_id = $1 AND vehicle_model_id NOT IN ($2, $3, $4, $5)`,
        [routeId, dzire.id, city.id, ertiga.id, crysta.id]
      );

      console.log(
        `  ✓ Agra → ${r.destination.padEnd(12)} | Sedan: ₹${r.sedanPrice.toLocaleString("en-IN").padStart(6)} | Ertiga: ${r.ertigaPrice ? `₹${r.ertigaPrice.toLocaleString("en-IN")}`.padStart(7) : "   N/A "} | Crysta: ${r.crystaPrice ? `₹${r.crystaPrice.toLocaleString("en-IN")}`.padStart(7) : "   N/A "}`
      );
    }

    await client.query("COMMIT");
    console.log("\n==================================================");
    console.log("✅ Production seeding completed successfully!");
    console.log("   - 17 One-Way Routes configured");
    console.log("   - Only 4 vehicles priced for One-Way trips (Dzire, City, Ertiga, Innova Crysta)");
    console.log("   - Test bookings & non-admin users wiped");
    console.log("   - Super admin retained:", adminEmail);
    console.log("==================================================");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Seeding failed, rolled back transaction:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
