/** Targeted content seed. Defaults to a dry run; --apply requires DATABASE_URL. */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import packages from "../src/db/agra-packages.seed.json" with { type: "json" };

try {
  process.loadEnvFile?.(fileURLToPath(new URL("../.env", import.meta.url)));
} catch { /* Local env is optional for a dry run. */ }

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  console.table(packages.map((pkg) => ({
    code: pkg.packageCode, duration: pkg.durationText, price: "UNSET", status: pkg.status,
  })));
  if (!apply) {
    console.log("Dry run: 10 content records; no fare rules or operational data. Pass --apply to insert missing packages.");
    return;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for --apply. No changes made.");
  const sql = await readFile(new URL("../migrations/0057_curated_agra_packages.sql", import.meta.url), "utf8");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(sql);
    await client.query("COMMIT");
    console.log(`Inserted ${result.rowCount ?? 0} missing packages; existing codes and all prices were preserved.`);
    console.log("Restart the API if it is caching the catalog, then rebuild the customer site from its published manifest.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(() => {
  // Never print a database URL or a provider error containing credentials.
  console.error("Agra package seed failed. Check DATABASE_URL, connectivity and applied migrations. Transaction rolled back if started.");
  process.exitCode = 1;
});
