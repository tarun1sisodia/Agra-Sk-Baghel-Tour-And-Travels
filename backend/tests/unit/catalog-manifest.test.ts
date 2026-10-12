import { describe, it, expect } from "vitest";
import { createTestApp } from "../helpers.js";

describe("Catalog Manifest Endpoint (/api/v1/catalog/manifest)", () => {
  it("returns canonical manifest with no synthetic fares or reverse routes", async () => {
    const { app, db } = await createTestApp();

    // Seed a published route with known fares
    await db.routeCatalog.create({
      id: "30000000-0000-0000-0001-000000000001",
      slug: "agra-to-delhi-test",
      sourceCity: "Agra",
      sourceDetail: null,
      destinationCity: "Delhi",
      distanceKm: 230,
      durationText: "240 mins",
      tripType: "one-way",
      availableFleets: ["sedan", "ertiga"],
      faresInr: {
        sedan: 2500,
        ertiga: 3600,
      },
      driverChargeInr: null,
      nightHaltInr: null,
      tollIncluded: true,
      tollAmountInr: null,
      interstateCharges: [],
      minKmPerDay: null,
      stops: [],
      usePerKm: false,
      perKmRateOverride: null,
      highway: "Yamuna Expressway",
      allInclusiveNote: "Toll tax included",
      status: "published",
      needsReview: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed a draft route which must be excluded
    await db.routeCatalog.create({
      id: "30000000-0000-0000-0001-000000000002",
      slug: "agra-to-jaipur-draft",
      sourceCity: "Agra",
      sourceDetail: null,
      destinationCity: "Jaipur",
      distanceKm: 240,
      durationText: "300 mins",
      tripType: "one-way",
      availableFleets: ["sedan"],
      faresInr: { sedan: 2800 },
      driverChargeInr: null,
      nightHaltInr: null,
      tollIncluded: true,
      tollAmountInr: null,
      interstateCharges: [],
      minKmPerDay: null,
      stops: [],
      usePerKm: false,
      perKmRateOverride: null,
      highway: null,
      allInclusiveNote: null,
      status: "draft",
      needsReview: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/catalog/manifest",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("success");

    const manifest = body.data;
    expect(manifest).toBeDefined();
    expect(manifest.version).toBeGreaterThanOrEqual(1);
    expect(manifest.routes).toBeDefined();

    // 1. Published route is present
    const testRoute = manifest.routes["agra-to-delhi-test"];
    expect(testRoute).toBeDefined();
    expect(testRoute.o).toBe("Agra");
    expect(testRoute.d).toBe("Delhi");
    expect(testRoute.km).toBe(230);
    expect(testRoute.m).toBe(240);
    expect(testRoute.fs).toBe(2500);
    expect(testRoute.fe).toBe(3600);

    // 2. Missing vehicle tiers are null, NOT synthetically multiplied
    expect(testRoute.fi).toBeNull();
    expect(testRoute.ft).toBeNull();
    expect(testRoute.fu).toBeNull();
    expect(testRoute.fh).toBeNull();

    // 3. Draft route is strictly excluded
    expect(manifest.routes["agra-to-jaipur-draft"]).toBeUndefined();

    // 4. No synthetic reverse route was generated
    expect(manifest.routes["delhi-to-agra-test-taxi"]).toBeUndefined();
    expect(manifest.routes["delhi-to-agra-test"]).toBeUndefined();

    // 5. Packages and vehicles lists exist
    expect(Array.isArray(manifest.packages)).toBe(true);
    expect(Array.isArray(manifest.vehicles)).toBe(true);
    expect(manifest.vehicles.length).toBeGreaterThan(0);
  });
});
