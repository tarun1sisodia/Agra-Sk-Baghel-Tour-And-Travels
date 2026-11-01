/* eslint-disable no-console */
import pg from "pg";
import { MongoClient } from "mongodb";
import { loadEnv } from "../src/config/env.js";

try {
  process.loadEnvFile?.(".env");
} catch {
  // fallback if file already loaded or missing
}

interface DbCheckResult {
  name: string;
  success: boolean;
  latencyMs: number;
  details?: Record<string, unknown>;
  error?: string;
}

async function checkPostgres(databaseUrl: string): Promise<DbCheckResult> {
  const start = performance.now();
  if (!databaseUrl) {
    return {
      name: "PostgreSQL (Supabase)",
      success: false,
      latencyMs: 0,
      error: "DATABASE_URL is not defined in environment",
    };
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT 
        current_database() AS database,
        current_user AS user,
        version() AS version,
        NOW() AS server_time
    `);
    const row = result.rows[0];
    const latencyMs = Math.round(performance.now() - start);

    return {
      name: "PostgreSQL (Supabase)",
      success: true,
      latencyMs,
      details: {
        database: row.database,
        user: row.user,
        version: row.version?.split(" on ")[0] ?? row.version,
        serverTime: row.server_time,
      },
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "PostgreSQL (Supabase)",
      success: false,
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await client.end().catch(() => { });
  }
}

async function checkMongo(mongoUri: string): Promise<DbCheckResult> {
  const start = performance.now();
  if (!mongoUri) {
    return {
      name: "MongoDB Atlas",
      success: false,
      latencyMs: 0,
      error: "MONGODB_URI is not defined in environment",
    };
  }

  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    await client.connect();
    const pingResult = await client.db("admin").command({ ping: 1 });
    let buildInfo: Record<string, unknown> = {};
    try {
      buildInfo = await client.db("admin").command({ buildInfo: 1 });
    } catch {
      // Some Atlas users lack buildInfo permissions; ping is sufficient
    }

    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "MongoDB Atlas",
      success: true,
      latencyMs,
      details: {
        ping: pingResult.ok === 1 ? "OK" : pingResult,
        version: buildInfo.version ?? "Connected",
      },
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "MongoDB Atlas",
      success: false,
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await client.close().catch(() => { });
  }
}

async function main(): Promise<void> {
  console.log("==================================================");
  console.log("  Agra SK Baghel Tour & Travels — Database Check");
  console.log("==================================================\n");

  let env;
  try {
    env = loadEnv();
  } catch (err) {
    console.error("❌ Failed to load environment variables:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  console.log("1. Checking PostgreSQL (Supabase)...");
  const pgResult = await checkPostgres(env.DATABASE_URL);
  if (pgResult.success) {
    console.log(`   ✅ PostgreSQL Connected in ${pgResult.latencyMs}ms`);
    console.log(`      • Database: ${pgResult.details?.database}`);
    console.log(`      • User:     ${pgResult.details?.user}`);
    console.log(`      • Version:  ${pgResult.details?.version}`);
    console.log(`      • Time:     ${pgResult.details?.serverTime}\n`);
  } else {
    console.log(`   ❌ PostgreSQL Failed in ${pgResult.latencyMs}ms`);
    console.log(`      • Error: ${pgResult.error}\n`);
  }

  console.log("2. Checking MongoDB Atlas...");
  const mongoResult = await checkMongo(env.MONGODB_URI);
  if (mongoResult.success) {
    console.log(`   ✅ MongoDB Connected in ${mongoResult.latencyMs}ms`);
    console.log(`      • Ping:    ${mongoResult.details?.ping}`);
    console.log(`      • Version: ${mongoResult.details?.version}\n`);
  } else {
    console.log(`   ❌ MongoDB Failed in ${mongoResult.latencyMs}ms`);
    console.log(`      • Error: ${mongoResult.error}\n`);
  }

  console.log("==================================================");
  console.log("  Summary");
  console.log("==================================================");
  console.log(`  PostgreSQL (Supabase): ${pgResult.success ? "🟢 ONLINE" : "🔴 OFFLINE"}`);
  console.log(`  MongoDB Atlas:         ${mongoResult.success ? "🟢 ONLINE" : "🔴 OFFLINE"}`);
  console.log("==================================================\n");

  if (!pgResult.success || !mongoResult.success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error during database checks:", err);
  process.exit(1);
});
