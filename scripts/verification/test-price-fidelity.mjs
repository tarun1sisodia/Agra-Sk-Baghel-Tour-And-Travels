import { getAdminAuthToken, API_BASE_URL, formatResult } from "./common.mjs";

async function verifyPriceFidelity() {
  console.log("============================================================");
  console.log(" SERVICE & PRICE FIDELITY CROSS-CHECK (DB vs LIVE ENGINE)");
  console.log(" Target:", API_BASE_URL);
  console.log("============================================================\n");

  const adminToken = await getAdminAuthToken();
  const headers = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  // 1. Check Outstation Routes & Price Matches
  console.log("--- 1. OUTSTATION ROUTES & VEHICLE PRICING ---");
  const routesRes = await fetch(`${API_BASE_URL}/api/v1/admin/routes`, { headers });
  const routesJson = await routesRes.json();
  const routes = routesJson.routes || routesJson.data || [];
  console.log(`Loaded ${routes.length} registered routes from DB.\n`);

  let totalRouteTests = 0;
  let passedRouteTests = 0;

  // Test first 5 routes across all configured vehicles
  const testRoutes = routes.slice(0, 5);
  const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString();

  for (const r of testRoutes) {
    const vRes = await fetch(`${API_BASE_URL}/api/v1/admin/routes/${r.id}/vehicles`, { headers });
    const vJson = await vRes.json();
    const vehicles = vJson.vehicles || [];

    console.log(`Route: ${r.origin_name} → ${r.destination_name} (${r.distance_km} km)`);
    for (const v of vehicles) {
      totalRouteTests++;
      const quoteRes = await fetch(`${API_BASE_URL}/api/v1/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "outstation",
          route_id: r.id,
          vehicle_model_id: v.vehicle_model_id,
          trip_type: "one_way",
          pickup_at: tomorrow,
          passenger_count: 2,
        }),
      });

      if (!quoteRes.ok) {
        console.log(`  ✖ FAIL ${v.display_name}: Quote HTTP ${quoteRes.status}`);
        continue;
      }
      const quote = await quoteRes.json();
      const match = quote.total === v.one_way_amount;
      if (match) {
        passedRouteTests++;
        console.log(`  ✔ PASS ${v.display_name.padEnd(22)} DB Amount: ₹${v.one_way_amount} | Quote: ₹${quote.total} | Advance: ₹${quote.advance}`);
      } else {
        console.log(`  ✖ MISMATCH ${v.display_name.padEnd(22)} DB Amount: ₹${v.one_way_amount} | Quote: ₹${quote.total}`);
      }
    }
    console.log("");
  }

  // 2. Check Tour Packages
  console.log("--- 2. TOUR PACKAGES & PRICING ---");
  const catRes = await fetch(`${API_BASE_URL}/api/v1/catalog`);
  const catJson = await catRes.json();
  const packages = (catJson.products || []).filter(p => p.category === "tour_package" || p.category === "packages");
  console.log(`Found ${packages.length} tour packages in published catalog:`);
  for (const pkg of packages) {
    console.log(`  • ${pkg.name.padEnd(35)} Starting Price: ₹${pkg.starting_price_inr} (${pkg.code})`);
  }

  // 3. Check Global Fare Settings & Rules
  console.log("\n--- 3. SYSTEM FARE RULES & SETTINGS ---");
  const rulesRes = await fetch(`${API_BASE_URL}/api/v1/admin/fare-rules`, { headers });
  const rulesJson = await rulesRes.json();
  const rules = rulesJson.fare_rules || rulesJson.data || [];
  console.log(`Total active per-km and fixed fare rules: ${rules.length}`);

  const settingsRes = await fetch(`${API_BASE_URL}/api/v1/admin/fare-settings`, { headers });
  const settingsJson = await settingsRes.json();
  const settings = settingsJson.settings || [];
  console.log(`Global settings:`);
  for (const s of settings) {
    console.log(`  - ${s.key.padEnd(25)}: ${s.value}`);
  }

  console.log("\n============================================================");
  console.log(` SUMMARY: ${passedRouteTests}/${totalRouteTests} vehicle fare checks verified against DB prices.`);
  console.log("============================================================\n");
}

verifyPriceFidelity().catch(console.error);
