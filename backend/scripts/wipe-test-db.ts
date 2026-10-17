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
    console.log("Inspecting public tables in database...");
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
    );
    const tables = res.rows.map((r: any) => r.table_name);
    console.log("Found tables:", tables);

    // Tables to strictly preserve:
    const PRESERVED_TABLES = new Set([
      "schema_migrations",
      "_prisma_migrations",
      "profiles",
      "vehicle_groups",
      "vehicle_models",
      "fare_settings",
      "location_coordinates_cache",
    ]);

    const tablesToWipe = [
      "review_submissions",
      "review_links",
      "payments",
      "payment_webhook_events",
      "bookings",
      "rental_enquiries",
      "extra_charges",
      "fare_rules",
      "outstation_route_vehicles",
      "outstation_routes",
      "local_packages",
      "transfers",
      "tour_packages",
      "publish_events",
    ].filter((t) => tables.includes(t));

    console.log("\nPreserving master tables:", Array.from(PRESERVED_TABLES));
    console.log("Truncating test data tables:", tablesToWipe);

    for (const tbl of tablesToWipe) {
      try {
        await client.query(`TRUNCATE TABLE "${tbl}" CASCADE;`);
        console.log(`  ✓ Truncated ${tbl}`);
      } catch (err: any) {
        console.warn(`  ⚠️ Could not truncate ${tbl}: ${err.message}`);
      }
    }

    console.log("\n✅ Successfully wiped test database!");
  } catch (err) {
    console.error("❌ Wipe failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
