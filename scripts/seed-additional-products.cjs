const path = require("path");
const fs = require("fs");
const pg = require(path.resolve(__dirname, "../backend/node_modules/pg"));
process.loadEnvFile(path.resolve(__dirname, "../backend/.env"));

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log("Connected to PostgreSQL for additional products seeding...");

  try {
    await client.query("BEGIN");

    // 1. Local Package
    await client.query(`
      INSERT INTO local_packages (id, code, name, duration_hours, included_km, covers, description, status)
      VALUES (
        '30000000-0000-0000-0001-000000000001',
        'agra-8h-80km',
        'Agra Sightseeing (8 Hours / 80 KM)',
        8,
        80,
        'Agra Local',
        'Full day sightseeing tour of Taj Mahal, Agra Fort and Mehtab Bagh with dedicated chauffeur.',
        'published'
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        duration_hours = EXCLUDED.duration_hours,
        included_km = EXCLUDED.included_km,
        status = EXCLUDED.status;
    `);

    // 2. Transfer
    await client.query(`
      INSERT INTO transfers (id, code, name, pickup_name, drop_name, description, status)
      VALUES (
        '40000000-0000-0000-0001-000000000001',
        'agra-cantt-to-hotel',
        'Agra Cantt Railway Station to Hotel',
        'Agra Cantt Railway Station',
        'Any City Hotel',
        'Hassle-free station pickup with name board and direct transfer to your hotel.',
        'published'
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status;
    `);

    // 3. Tour Package
    await client.query(`
      INSERT INTO tour_packages (id, code, name, duration_text, days, nights, source, destination, description, status)
      VALUES (
        '50000000-0000-0000-0001-000000000001',
        'golden-triangle-3d',
        'Golden Triangle Tour (3 Days / 2 Nights)',
        '3 Days / 2 Nights',
        3,
        2,
        'Agra',
        'Delhi & Jaipur',
        'Private chauffeur-driven tour of Agra, Jaipur, and Delhi.',
        'published'
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status;
    `);

    // 4. Fare Rules for Local Package
    const dzireId = "10000000-0000-0000-0002-000000000001";
    const ertigaId = "10000000-0000-0000-0002-000000000003";
    const innovaId = "10000000-0000-0000-0002-000000000004";

    const localPkgId = "30000000-0000-0000-0001-000000000001";
    const transferId = "40000000-0000-0000-0001-000000000001";
    const tourPkgId = "50000000-0000-0000-0001-000000000001";

    const rules = [
      { cat: "local_package", car: dzireId, lp: localPkgId, tr: null, tp: null, amt: 2200 },
      { cat: "local_package", car: ertigaId, lp: localPkgId, tr: null, tp: null, amt: 2800 },
      { cat: "local_package", car: innovaId, lp: localPkgId, tr: null, tp: null, amt: 3400 },

      { cat: "transfer", car: dzireId, lp: null, tr: transferId, tp: null, amt: 600 },
      { cat: "transfer", car: ertigaId, lp: null, tr: transferId, tp: null, amt: 900 },
      { cat: "transfer", car: innovaId, lp: null, tr: transferId, tp: null, amt: 1200 },

      { cat: "tour_package", car: dzireId, lp: null, tr: null, tp: tourPkgId, amt: 14500 },
      { cat: "tour_package", car: ertigaId, lp: null, tr: null, tp: tourPkgId, amt: 18000 },
      { cat: "tour_package", car: innovaId, lp: null, tr: null, tp: tourPkgId, amt: 22000 },
    ];

    for (const r of rules) {
      await client.query(`
        INSERT INTO fare_rules (category, vehicle_model_id, local_package_id, transfer_id, tour_package_id, amount, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (category, vehicle_model_id, local_package_id, transfer_id, tour_package_id)
        WHERE is_active
        DO UPDATE SET amount = EXCLUDED.amount;
      `, [r.cat, r.car, r.lp, r.tr, r.tp, r.amt]);
    }

    await client.query("COMMIT");
    console.log("✅ Successfully seeded local packages, transfers, tour packages, and fare rules!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seeding error:", err);
  } finally {
    await client.end();
  }
}

seed();
