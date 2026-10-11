import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv } from "../config/env.js";

const MIGRATION_LOCK_KEY = "arenaai:migrations";

function migrationChecksum(sql: string): string {
  const normalized = sql.replace(/\r\n/g, "\n");
  return createHash("sha256").update(normalized).digest("hex");
}

export async function runMigrations(options?: {
  connectionString?: string;
  migrationsDir?: string;
  silent?: boolean;
}): Promise<{ applied: string[]; total: number }> {
  const env = loadEnv();
  const connectionString = options?.connectionString ?? env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const defaultDir = path.resolve(moduleDir, "../../migrations");
  const dir = options?.migrationsDir ?? defaultDir;

  const client = new pg.Client({ connectionString });
  await client.connect();
  const applied: string[] = [];
  let lockHeld = false;
  try {
    // Serialize migration inspection/application across concurrent instances.
    await client.query("select pg_advisory_lock(hashtext($1))", [MIGRATION_LOCK_KEY]);
    lockHeld = true;
    await client.query(
      "create table if not exists schema_migrations (id text primary key, checksum text, applied_at timestamptz not null default now())",
    );
    await client.query("alter table schema_migrations add column if not exists checksum text");
    const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = await readFile(path.join(dir, file), "utf8");
      const checksum = migrationChecksum(sql);
      const existing = await client.query("select checksum from schema_migrations where id=$1", [file]);
      if ((existing.rowCount ?? 0) > 0) {
        const storedChecksum = existing.rows[0]?.checksum as string | null | undefined;
        if (storedChecksum && storedChecksum !== checksum) {
          throw new Error(`Migration drift detected for ${file}: stored checksum does not match the repository file`);
        }
        // Backfill entries created by the pre-checksum runner. Subsequent
        // edits to those files will fail closed instead of being ignored.
        if (!storedChecksum) {
          await client.query("update schema_migrations set checksum=$2 where id=$1", [file, checksum]);
        }
        continue;
      }
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into schema_migrations(id, checksum) values ($1, $2)", [file, checksum]);
        await client.query("commit");
        applied.push(file);
        if (!options?.silent) {
          process.stdout.write(`applied ${file}\n`);
        }
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
    return { applied, total: files.length };
  } finally {
    if (lockHeld) {
      await client.query("select pg_advisory_unlock(hashtext($1))", [MIGRATION_LOCK_KEY]).catch(() => undefined);
    }
    await client.end();
  }
}

// If executed directly as CLI script
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  runMigrations().catch((error: unknown) => {
    console.error("Migration error:", error);
    process.exit(1);
  });
}
