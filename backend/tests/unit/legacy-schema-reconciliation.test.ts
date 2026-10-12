import { describe, it, expect } from "vitest";
import { createTestApp } from "../helpers.js";
import { createMemoryRepositories } from "../../src/db/memory.js";
import { mapTourPackage, safeIsoDate } from "../../src/db/postgres.js";

describe("Task 2: Legacy API Modules & Canonical Schema Reconciliation", () => {
  it("P1: mapTourPackage() date conversion handles missing, null, or invalid dates without RangeError or 500", () => {
    // 1. Raw row from database where updated_at is undefined (canonical 0038 schema before 0040)
    const rowUndefinedUpdatedAt = {
      id: "30000000-0000-0000-0001-000000000001",
      code: "taj-same-day",
      name: "Same Day Agra Taj Mahal Tour",
      duration_text: "1 Day",
      days: 1,
      nights: 0,
      source: "Agra",
      destination: "Agra",
      status: "published",
      created_at: "2026-10-12T08:00:00.000Z",
      updated_at: undefined,
    };
    const mapped1 = mapTourPackage(rowUndefinedUpdatedAt);
    expect(mapped1.packageCode).toBe("taj-same-day");
    expect(mapped1.createdAt).toBe("2026-10-12T08:00:00.000Z");
    expect(mapped1.updatedAt).toBe("2026-10-12T08:00:00.000Z"); // Falls back cleanly to createdAt without RangeError

    // 2. Raw row where updated_at is null
    const rowNullUpdatedAt = {
      ...rowUndefinedUpdatedAt,
      updated_at: null,
    };
    const mapped2 = mapTourPackage(rowNullUpdatedAt);
    expect(mapped2.updatedAt).toBe("2026-10-12T08:00:00.000Z");

    // 3. Raw row where created_at is malformed non-date string throws DATA_CORRUPTION error
    const rowMalformedDates = {
      ...rowUndefinedUpdatedAt,
      created_at: "not-a-valid-date",
      updated_at: "also-not-a-date",
    };
    expect(() => mapTourPackage(rowMalformedDates)).toThrowError(/Invalid timestamp value/);

    // 4. Raw row with empty date strings throws DATA_CORRUPTION error
    const rowEmptyDates = {
      ...rowUndefinedUpdatedAt,
      created_at: "",
      updated_at: "",
    };
    expect(() => mapTourPackage(rowEmptyDates)).toThrowError(/Missing required timestamp/);

    // 5. safeIsoDate standalone behavior: throws when missing without fallback, uses fallback when provided
    expect(() => safeIsoDate(undefined)).toThrowError(/Missing required timestamp/);
    expect(() => safeIsoDate(null)).toThrowError(/Missing required timestamp/);
    expect(() => safeIsoDate("invalid-timestamp")).toThrowError(/Invalid timestamp value/);
    expect(safeIsoDate(undefined, "2026-10-12T08:00:00.000Z")).toBe("2026-10-12T08:00:00.000Z");
    expect(safeIsoDate("invalid-timestamp", "2026-10-12T08:00:00.000Z")).toBe("2026-10-12T08:00:00.000Z");
  });

  it("P1: /api/v1/tour-packages/manifest succeeds and returns published tour packages", async () => {
    const memoryDb = createMemoryRepositories(new Date().toISOString());

    await memoryDb.tourPackages.create({
      id: "30000000-0000-0000-0001-000000000001",
      packageCode: "taj-same-day",
      name: "Same Day Agra Taj Mahal Tour",
      durationText: "1 Day",
      days: 1,
      nights: 0,
      baseTierCode: "sedan",
      startingPriceInr: 2500,
      fleetPrices: { sedan: 2500, ertiga: 3500 },
      nightChargeInr: 0,
      inclusionsHighlight: "Monument tickets included",
      inclusionsNote: null,
      source: "Agra",
      destination: "Agra",
      inclusions: ["AC Car", "Guide"],
      exclusions: ["Lunch"],
      itinerary: [{ time: "09:00", title: "Taj Mahal", desc: "Visit Taj Mahal" }],
      imageUrl: null,
      gallery: [],
      status: "published",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { app } = await createTestApp(memoryDb);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/tour-packages/manifest",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const pkg = (body.data as Array<{ packageCode?: string; name?: string; createdAt?: string; updatedAt?: string }>).find((p) => p.packageCode === "taj-same-day");
    expect(pkg).toBeDefined();
    expect(pkg?.name).toBe("Same Day Agra Taj Mahal Tour");
    expect(new Date(pkg?.createdAt ?? "").getTime()).not.toBeNaN();
    expect(new Date(pkg?.updatedAt ?? "").getTime()).not.toBeNaN();
  });

  it("P2: /api/v1/route-catalog/manifest returns expected customer-facing contract", async () => {
    const memoryDb = createMemoryRepositories(new Date().toISOString());

    await memoryDb.routeCatalog.create({
      id: "20000000-0000-0000-0001-000000000001",
      tripType: "one-way",
      sourceCity: "Agra",
      sourceDetail: null,
      destinationCity: "Delhi",
      slug: "agra-to-delhi",
      distanceKm: 230,
      durationText: "240 mins",
      availableFleets: ["sedan", "ertiga", "innova-crysta", "tempo-traveller"],
      faresInr: { sedan: 2500, ertiga: 3600, "innova-crysta": 4500 },
      driverChargeInr: 500,
      nightHaltInr: 0,
      tollIncluded: true,
      tollAmountInr: null,
      interstateCharges: [],
      minKmPerDay: 300,
      stops: [],
      usePerKm: false,
      perKmRateOverride: null,
      highway: "Yamuna Expressway",
      allInclusiveNote: "Direct highway corridor",
      status: "published",
      needsReview: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { app } = await createTestApp(memoryDb);

    // Test both canonical and alias endpoints
    for (const url of ["/api/v1/route-catalog/manifest", "/api/v1/routes/manifest"]) {
      const res = await app.inject({ method: "GET", url });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);

      const route = (body.data as Array<{
        slug?: string;
        sourceCity?: string;
        destinationCity?: string;
        distanceKm?: number;
        faresInr?: Record<string, number>;
        availableFleets?: string[];
      }>).find((r) => r.slug === "agra-to-delhi");
      expect(route).toBeDefined();
      expect(route?.sourceCity).toBe("Agra");
      expect(route?.destinationCity).toBe("Delhi");
      expect(route?.distanceKm).toBe(230);
      expect(route?.faresInr?.sedan).toBe(2500);
      expect(route?.faresInr?.ertiga).toBe(3600);
      expect(route?.availableFleets).toContain("sedan");
    }
  });

  it("P3: /api/v1/transfer-routes/manifest preserves consumer compatibility", async () => {
    const memoryDb = createMemoryRepositories(new Date().toISOString());

    await memoryDb.transferRoutes.create({
      id: "40000000-0000-0000-0001-000000000001",
      routeCode: "agra-cantt-to-taj-mahal",
      name: "Agra Cantt Railway Station to Taj Mahal",
      distanceText: "8 km",
      directionNote: "Agra Cantt to Taj Mahal",
      fleetPrices: { sedan: 600, suv: 900 },
      usePerKm: false,
      nightChargeInr: 0,
      status: "published",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { app } = await createTestApp(memoryDb);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/transfer-routes/manifest",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    const transfer = (body.data as Array<{
      routeCode?: string;
      name?: string;
      fleetPrices?: Record<string, number>;
      isActive?: boolean;
    }>).find((t) => t.routeCode === "agra-cantt-to-taj-mahal");
    expect(transfer).toBeDefined();
    expect(transfer?.name).toBe("Agra Cantt Railway Station to Taj Mahal");
    expect(transfer?.fleetPrices?.sedan).toBe(600);
    expect(transfer?.isActive).toBe(true);
  });

  it("P4: /api/v1/local-packages/manifest preserves required fields", async () => {
    const memoryDb = createMemoryRepositories(new Date().toISOString());

    await memoryDb.localPackages.create({
      id: "50000000-0000-0000-0001-000000000001",
      packageCode: "agra-half-day-4h-40k",
      name: "Agra Half Day City Tour (4 Hours / 40 Km)",
      durationHours: 4,
      includedKm: 40,
      covers: "Taj Mahal, Agra Fort",
      parkingNote: "Parking extra at actuals",
      fleetPrices: { sedan: 1600, ertiga: 2200 },
      usePerKm: false,
      extraRates: null,
      nightChargeInr: 0,
      status: "published",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { app } = await createTestApp(memoryDb);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/local-packages/manifest",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    const pkg = (body.data as Array<{
      packageCode?: string;
      name?: string;
      durationHours?: number;
      includedKm?: number;
      covers?: string;
      fleetPrices?: Record<string, number>;
      isActive?: boolean;
    }>).find((p) => p.packageCode === "agra-half-day-4h-40k");
    expect(pkg).toBeDefined();
    expect(pkg?.name).toBe("Agra Half Day City Tour (4 Hours / 40 Km)");
    expect(pkg?.durationHours).toBe(4);
    expect(pkg?.includedKm).toBe(40);
    expect(pkg?.covers).toBe("Taj Mahal, Agra Fort");
    expect(pkg?.fleetPrices?.sedan).toBe(1600);
    expect(pkg?.isActive).toBe(true);
  });

  it("P5: /api/v1/promos/featured returns intentional empty state (null) without 500 error", async () => {
    const memoryDb = createMemoryRepositories(new Date().toISOString());
    const { app } = await createTestApp(memoryDb);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/promos/featured",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it("P5: postgres.ts promos repo returns intentional empty states and rejects mutations with 410 AppError", async () => {
    // Dynamically test the postgres.ts promos implementation contract
    const { createPostgresRepositories } = await import("../../src/db/postgres.js");
    // Passing a dummy URL doesn't connect until query is executed
    const pgRepos = await createPostgresRepositories("postgres://dummy:dummy@localhost:5432/dummy");

    expect(await pgRepos.promos.getByCode("DISCOUNT10")).toBeNull();
    expect(await pgRepos.promos.getById("00000000-0000-0000-0000-000000000000")).toBeNull();
    expect(await pgRepos.promos.list()).toEqual([]);
    expect(await pgRepos.promos.getFeatured()).toBeNull();
    expect(await pgRepos.promos.consume("DISCOUNT10")).toBeNull();

    await expect(
      pgRepos.promos.create({ code: "DISCOUNT10" } as unknown as Parameters<typeof pgRepos.promos.create>[0])
    ).rejects.toThrow("Promo codes were retired in migration 0038");
    await expect(
      pgRepos.promos.update({ code: "DISCOUNT10" } as unknown as Parameters<typeof pgRepos.promos.update>[0])
    ).rejects.toThrow("Promo codes were retired in migration 0038");
    await expect(
      pgRepos.promos.delete("00000000-0000-0000-0000-000000000000")
    ).rejects.toThrow("Promo codes were retired in migration 0038");

    // Close pool to clean up
    await (pgRepos as unknown as { pool: { end: () => Promise<void> } }).pool.end();
  });
});

