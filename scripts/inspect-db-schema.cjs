const fs = require("fs");
const path = require("path");
const pg = require(path.resolve(__dirname, "../backend/node_modules/pg"));

const envContent = fs.readFileSync(path.resolve(__dirname, "../backend/.env"), "utf8");
const match = envContent.match(/DATABASE_URL=(.+)/);
const dbUrl = match ? match[1].trim() : "";
const pool = new pg.Pool({ connectionString: dbUrl });

async function run() {
  const pCols = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments' ORDER BY ordinal_position"
  );
  console.log("=== PAYMENTS COLUMNS ===");
  pCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  const bCols = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings' ORDER BY ordinal_position"
  );
  console.log("\n=== BOOKINGS COLUMNS ===");
  bCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  // Also sample 1 row from each
  const pSample = await pool.query("SELECT * FROM payments LIMIT 1");
  console.log("\n=== PAYMENTS SAMPLE ROW ===", pSample.rows[0]);

  const bSample = await pool.query("SELECT * FROM bookings LIMIT 1");
  console.log("\n=== BOOKINGS SAMPLE ROW ===", bSample.rows[0]);

  await pool.end();
}

run().catch(console.error);
