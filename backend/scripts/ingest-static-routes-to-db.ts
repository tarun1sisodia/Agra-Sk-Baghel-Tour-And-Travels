/**
 * Ingest Static Catalog Routes to PostgreSQL Database (High-Performance Batched)
 * Migrates ~877 outstation routes from catalog.data.json into `outstation_routes` and `outstation_route_vehicles`.
 *
 * Rules:
 * - Origin & destination must be distinct real cities/corridors.
 * - Non-route SEO articles and tour packages are filtered out.
 * - Routes are upserted with `status: 'published'`.
 * - In `outstation_route_vehicles`, `one_way_amount` is set to NULL (unpriced / ₹0 fixed fare) so admins can set custom pricing later.
 * - `round_trip_enabled` is set to true (enabling distance-based calculation via global fare_rules).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { loadEnv } from "../src/config/env.js";

interface RawCatalogItem {
  id?: string;
  from?: string;
  to?: string;
  origin?: string;
  destination?: string;
  corridor?: string;
  km?: number;
  duration?: string;
  durationMins?: number;
  kind?: string;
  pricingModel?: string;
  description?: string;
  fares?: Record<string, number>;
}

interface ValidatedRoute {
  slug: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  description: string;
}

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseDurationMinutes(durationMins?: number, durationText?: string, distanceKm?: number): number {
  if (durationMins && durationMins > 0) return Math.round(durationMins);
  if (durationText) {
    const hoursMatch = durationText.match(/(\d+(?:\.\d+)?)\s*h/i);
    const minsMatch = durationText.match(/(\d+)\s*m/i);
    let total = 0;
    if (hoursMatch?.[1]) total += parseFloat(hoursMatch[1]) * 60;
    if (minsMatch?.[1]) total += parseInt(minsMatch[1], 10);
    if (total > 0) return Math.round(total);
  }
  const km = distanceKm && distanceKm > 0 ? distanceKm : 100;
  return Math.max(30, Math.round((km / 55) * 60));
}

async function run() {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    max: 10,
  });

  const client = await pool.connect();

  try {
    console.log("Connected to PostgreSQL database. Beginning batched route catalog ingestion...");

    // 1. Load active vehicle models
    const vmRes = await client.query<{ id: string; model_name: string; display_name: string }>(
      "SELECT id, model_name, display_name FROM vehicle_models WHERE is_active = true ORDER BY sort_order ASC"
    );
    const vehicleModels = vmRes.rows;
    console.log(`Loaded ${vehicleModels.length} active vehicle models from database.`);

    if (vehicleModels.length === 0) {
      throw new Error("No vehicle models found in database. Run database seeds first.");
    }

    // 2. Read catalog.data.json
    const scriptDir = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
    const catalogPath = join(scriptDir, "..", "src", "modules", "fares", "catalog.data.json");
    const rawCatalog = JSON.parse(readFileSync(catalogPath, "utf-8")) as Record<string, RawCatalogItem>;
    const rawEntries = Object.entries(rawCatalog);
    console.log(`Loaded ${rawEntries.length} entries from ${catalogPath}.`);

    let scannedCount = 0;
    let skippedCount = 0;

    const validatedRoutes: ValidatedRoute[] = [];
    const seenPairs = new Set<string>();

    for (const [key, item] of rawEntries) {
      scannedCount++;

      const rawSlug = item.id || key;
      const origin = (item.origin || item.from || "").trim();
      const destination = (item.destination || item.to || "").trim();

      // Filter 1: Must have origin and destination of at least 2 chars
      if (!origin || !destination || origin.length < 2 || destination.length < 2) {
        skippedCount++;
        continue;
      }

      // Filter 2: Origin and destination must not be the same city
      if (origin.toLowerCase() === destination.toLowerCase()) {
        skippedCount++;
        continue;
      }

      // Filter 3: Exclude SEO articles, neighborhood pages, and tour packages
      const lowerSlug = rawSlug.toLowerCase();
      if (
        !lowerSlug.includes("-to-") ||
        lowerSlug.startsWith("everything-you-should-know") ||
        lowerSlug.startsWith("best-taxi-service") ||
        lowerSlug.startsWith("taxi-services-in-") ||
        item.kind === "tour" ||
        lowerSlug.includes("tour-3-nights") ||
        lowerSlug.startsWith("same-day-")
      ) {
        skippedCount++;
        continue;
      }

      const slug = sanitizeSlug(rawSlug);
      if (!slug || slug.length < 2) {
        skippedCount++;
        continue;
      }

      const pairKey = `${origin.toLowerCase()}:::${destination.toLowerCase()}`;
      if (seenPairs.has(pairKey)) {
        skippedCount++;
        continue;
      }
      seenPairs.add(pairKey);

      const distanceKm = Math.max(1, Number(item.km) || 50);
      const durationMinutes = parseDurationMinutes(item.durationMins, item.duration, distanceKm);
      const description =
        item.description ||
        item.corridor ||
        `Direct highway travel between ${origin} and ${destination} via express corridor.`;

      validatedRoutes.push({
        slug,
        origin,
        destination,
        distanceKm,
        durationMinutes,
        description,
      });
    }

    console.log(`Filter complete: ${validatedRoutes.length} valid highway routes identified, ${skippedCount} items skipped.`);

    // 3. Preload all existing routes in database
    const existingRoutesRes = await client.query<{ id: string; code: string; origin_name: string; destination_name: string }>(
      "SELECT id, code, origin_name, destination_name FROM outstation_routes"
    );
    const existingByCode = new Map<string, string>();
    const existingByPair = new Map<string, string>();

    for (const r of existingRoutesRes.rows) {
      existingByCode.set(r.code.toLowerCase(), r.id);
      existingByPair.set(`${r.origin_name.toLowerCase()}:::${r.destination_name.toLowerCase()}`, r.id);
    }
    console.log(`Existing routes in DB before ingestion: ${existingRoutesRes.rows.length}`);

    await client.query("BEGIN");

    const allRouteIds: string[] = [];
    let insertedRoutes = 0;
    let updatedRoutes = 0;

    // 4. Batch Upsert Routes in chunks of 50
    const CHUNK_SIZE = 50;
    for (let i = 0; i < validatedRoutes.length; i += CHUNK_SIZE) {
      const chunk = validatedRoutes.slice(i, i + CHUNK_SIZE);
      for (const route of chunk) {
        const pairKey = `${route.origin.toLowerCase()}:::${route.destination.toLowerCase()}`;
        const existingId = existingByPair.get(pairKey) || existingByCode.get(route.slug.toLowerCase());

        if (existingId) {
          await client.query(
            `UPDATE outstation_routes
             SET distance_km = $1,
                 duration_minutes = $2,
                 description = COALESCE(description, $3),
                 status = 'published',
                 updated_at = NOW()
             WHERE id = $4`,
            [route.distanceKm, route.durationMinutes, route.description, existingId]
          );
          allRouteIds.push(existingId);
          updatedRoutes++;
        } else {
          const insertRes = await client.query<{ id: string }>(
            `INSERT INTO outstation_routes (code, origin_name, destination_name, distance_km, duration_minutes, description, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'published')
             ON CONFLICT (code) DO UPDATE SET
               origin_name = EXCLUDED.origin_name,
               destination_name = EXCLUDED.destination_name,
               distance_km = EXCLUDED.distance_km,
               duration_minutes = EXCLUDED.duration_minutes,
               status = 'published'
             RETURNING id`,
            [route.slug, route.origin, route.destination, route.distanceKm, route.durationMinutes, route.description]
          );
          const newId = insertRes.rows[0]?.id;
          if (!newId) throw new Error(`Failed to insert route ${route.slug}`);
          allRouteIds.push(newId);
          existingByCode.set(route.slug.toLowerCase(), newId);
          existingByPair.set(pairKey, newId);
          insertedRoutes++;
        }
      }
      process.stdout.write(`Processed ${Math.min(i + CHUNK_SIZE, validatedRoutes.length)}/${validatedRoutes.length} routes...\r`);
    }

    console.log(`\nRoutes upserted: ${insertedRoutes} new inserted, ${updatedRoutes} existing updated.`);

    // 5. Bulk insert outstation_route_vehicles in chunks of 200
    console.log("Populating vehicle models grid with zero / null initial one-way prices...");
    const vehiclePairs: Array<{ routeId: string; modelId: string }> = [];
    for (const routeId of allRouteIds) {
      for (const vm of vehicleModels) {
        vehiclePairs.push({ routeId, modelId: vm.id });
      }
    }

    const V_CHUNK = 200;
    for (let i = 0; i < vehiclePairs.length; i += V_CHUNK) {
      const chunk = vehiclePairs.slice(i, i + V_CHUNK);
      const values: any[] = [];
      const placeholders: string[] = [];

      chunk.forEach((p, idx) => {
        const offset = idx * 2;
        placeholders.push(`($${offset + 1}, $${offset + 2}, NULL, true, true)`);
        values.push(p.routeId, p.modelId);
      });

      const sql = `
        INSERT INTO outstation_route_vehicles (route_id, vehicle_model_id, one_way_amount, round_trip_enabled, is_active)
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (route_id, vehicle_model_id) DO UPDATE SET
          round_trip_enabled = true,
          is_active = true
      `;
      await client.query(sql, values);
      process.stdout.write(`Populated ${Math.min(i + V_CHUNK, vehiclePairs.length)}/${vehiclePairs.length} vehicle grid links...\r`);
    }

    await client.query("COMMIT");

    console.log("\n\n==========================================");
    console.log("ROUTE CATALOG INGESTION COMPLETED");
    console.log("==========================================");
    console.log(`Total entries scanned:    ${scannedCount}`);
    console.log(`Valid routes identified:  ${validatedRoutes.length}`);
    console.log(`Routes inserted (new):    ${insertedRoutes}`);
    console.log(`Routes updated (exists):  ${updatedRoutes}`);
    console.log(`Vehicle grid links made:  ${vehiclePairs.length}`);
    console.log(`Non-route entries skipped:${skippedCount}`);

    // Verify database counts
    const finalRoutesRes = await client.query<{ count: string }>("SELECT COUNT(*) FROM outstation_routes");
    const finalVehiclesRes = await client.query<{ count: string }>("SELECT COUNT(*) FROM outstation_route_vehicles");
    console.log(`\nFinal outstation_routes in DB:         ${finalRoutesRes.rows[0]?.count ?? "0"}`);
    console.log(`Final outstation_route_vehicles in DB: ${finalVehiclesRes.rows[0]?.count ?? "0"}`);
    console.log("==========================================\n");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Route ingestion failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
