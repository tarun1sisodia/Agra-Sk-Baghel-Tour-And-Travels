import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv } from "../src/config/env.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  process.loadEnvFile?.(path.join(root, ".env"));
} catch {
  // .env may not exist
}

export async function seedAllRoutes(connectionString: string): Promise<number> {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const csvPath = path.join(root, "..", "react", "new_design", "all_routes_and_prices.csv");
  const lines = readFileSync(csvPath, "utf-8").split(/\r?\n/).filter(Boolean);

  let insertedCount = 0;
  await client.query("BEGIN");

  try {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const row = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (!row || row.length < 12) continue;

      const firstCell = row[0];
      if (!firstCell) continue;
      const slug = firstCell.replace(/"/g, "").trim();
      if (!slug || slug === "home") continue;

      const origin = row[1]?.replace(/"/g, "").trim() || "Agra";
      const dest = row[2]?.replace(/"/g, "").trim() || "Delhi";
      const corridor = row[3]?.replace(/"/g, "").trim() || "Regional Routes";
      const title = `${origin} to ${dest} Taxi Service`;
      const shortDesc = `${corridor}: Point-to-point AC taxi connecting ${origin} to ${dest}.`;
      const durationText = row[7]?.replace(/"/g, "").trim() || "3.5 hrs";
      const routeSummary = `${origin} · ${dest}`;
      await client.query(
        `INSERT INTO catalog_items (
           id, type, slug, title, short_description, description, status,
           duration_text, route_summary, version
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           short_description = EXCLUDED.short_description,
           duration_text = EXCLUDED.duration_text,
           updated_at = NOW()`,
        [
          `route_${slug.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 50)}_${i}`,
          "ride",
          slug,
          title,
          shortDesc,
          `${shortDesc} Quoted fares include highway tolls, fuel, chauffeur allowances, and state permits.`,
          "published",
          durationText,
          routeSummary,
        ]
      );
      insertedCount++;
    }

    await client.query("COMMIT");
    console.log(`✅ [Database Seeder] Successfully seeded/updated ${insertedCount} routes in catalog_items.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }

  return insertedCount;
}

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    console.log("ℹ️ DATABASE_URL is not set; skipping live Postgres connection.");
    return;
  }
  await seedAllRoutes(env.DATABASE_URL);
}

if (process.argv[1] && process.argv[1].endsWith("seed-routes.ts")) {
  main().catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  });
}
