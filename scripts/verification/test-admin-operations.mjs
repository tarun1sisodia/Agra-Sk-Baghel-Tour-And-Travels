import { API_BASE_URL, getAdminAuthToken, formatResult } from "./common.mjs";

export async function runAdminOperationsVerification(targetUrl = API_BASE_URL) {
  console.log("\n\x1b[1m\x1b[35m=== RUNNING ADMIN OPERATIONS DESK VERIFICATION ===\x1b[0m");
  console.log(`Target API: ${targetUrl}`);

  const token = await getAdminAuthToken();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  let passedCount = 0;
  let totalCount = 0;

  async function testOp(name, fn) {
    totalCount++;
    const start = Date.now();
    try {
      const details = await fn();
      formatResult(name, true, Date.now() - start, details);
      passedCount++;
    } catch (err) {
      formatResult(name, false, Date.now() - start, err.message);
    }
  }

  // 1. Vehicle Groups
  await testOp("Admin: List Vehicle Groups (/admin/vehicle-groups)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/admin/vehicle-groups`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const groups = json.vehicle_groups || json.data || json;
    if (!Array.isArray(groups)) throw new Error("Expected array of vehicle groups");
    return `${groups.length} groups found (${groups.map(g => g.code || g.name).join(", ")})`;
  });

  // 2. Vehicle Models
  await testOp("Admin: List Vehicle Models (/admin/vehicle-models)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/admin/vehicle-models`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const models = json.vehicle_models || json.data || json;
    if (!Array.isArray(models)) throw new Error("Expected array of vehicle models");
    return `${models.length} models found`;
  });

  // 3. Fare Settings
  await testOp("Admin: List Global Fare Settings (/admin/fare-settings)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/admin/fare-settings`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const settings = json.settings || json.data || json;
    return `Settings loaded: ${Array.isArray(settings) ? settings.length : Object.keys(settings).length} keys`;
  });

  // 4. Fare Rules
  await testOp("Admin: List Clean Fare Rules (/admin/fare-rules)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/admin/fare-rules`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rules = json.fare_rules || json.data || json;
    return `${Array.isArray(rules) ? rules.length : 0} rules found`;
  });

  // 5. Extra Charges
  await testOp("Admin: List Extra Charges (/admin/extra-charges)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/admin/extra-charges`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const charges = json.extra_charges || json.data || json;
    return `${Array.isArray(charges) ? charges.length : 0} extra charges found`;
  });

  // 6. Admin Routes List
  let sampleRouteId = null;
  await testOp("Admin: List Outstation Routes (/admin/routes)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/admin/routes`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const routes = json.routes || json.data || json;
    if (Array.isArray(routes) && routes.length > 0) {
      sampleRouteId = routes[0].id;
    }
    return `${Array.isArray(routes) ? routes.length : 0} routes registered`;
  });

  // 7. Route Vehicles Pricing Grid
  if (sampleRouteId) {
    await testOp(`Admin: Get Route Pricing Grid (${sampleRouteId})`, async () => {
      const res = await fetch(`${targetUrl}/api/v1/admin/routes/${sampleRouteId}/vehicles`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const vehicles = json.vehicles || [];
      return `${vehicles.length} vehicle rates configured for route`;
    });
  }

  // 8. Distance Calculation via LocationIQ
  await testOp("Admin: Calculate Distance (/admin/routes/calculate-distance)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/admin/routes/calculate-distance`, {
      method: "POST",
      headers,
      body: JSON.stringify({ origin: "Agra, Uttar Pradesh", destination: "New Delhi, Delhi" }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return `Distance: ${json.distance_km || json.distanceKm} km, Duration: ${json.duration_minutes || json.durationMinutes} min`;
  });

  // 9. Operations Desk: Bookings Listing
  await testOp("Admin: List Operations Bookings (/ops/admin/bookings)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/ops/admin/bookings`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const items = json.data?.items || json.items || json.bookings || [];
    return `${items.length} live bookings in operations queue`;
  });

  // 10. Review Moderation Desk Submissions
  await testOp("Admin: List Review Submissions (/admin/review-submissions)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/admin/review-submissions`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const items = json.submissions || json.data?.items || json.data || [];
    return `${Array.isArray(items) ? items.length : 0} reviews pending moderation`;
  });

  console.log(`\nAdmin Operations Verification: ${passedCount}/${totalCount} passed.\n`);
  return { passedCount, totalCount };
}

if (process.argv[1]?.endsWith("test-admin-operations.mjs")) {
  runAdminOperationsVerification().catch((e) => {
    console.error("Verification execution error:", e);
    process.exit(1);
  });
}
