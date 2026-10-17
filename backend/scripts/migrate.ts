try {
  process.loadEnvFile?.(".env");
} catch {}
process.env.NODE_ENV = "development";
import { runMigrations } from "../src/db/migrate.js";

runMigrations().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

