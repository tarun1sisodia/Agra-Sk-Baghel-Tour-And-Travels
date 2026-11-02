import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import packages from "../../src/db/agra-packages.seed.json" with { type: "json" };
import { SEED_TOUR_PACKAGES } from "../../src/db/dossier-seeds.js";
import { createTestApp } from "../helpers.js";
import { CreateTourPackageSchema, UpdateTourPackageSchema } from "../../src/modules/tour-packages/tour-packages.schema.js";
import { resolvePackageFleetPrice } from "../../src/modules/fares/calculators/tour-package.calculator.js";

const migrationUrl = new URL("../../migrations/0057_curated_agra_packages.sql", import.meta.url);

describe("Researched Agra collection — no fabricated pricing", () => {
  it("contains ten distinct Agra-start itineraries with usable content and no amounts", () => {
    expect(SEED_TOUR_PACKAGES).toEqual(packages);
    expect(packages).toHaveLength(10);
    expect(new Set(packages.map((pkg) => pkg.packageCode)).size).toBe(10);
    expect(new Set(packages.map((pkg) => pkg.id)).size).toBe(10);
    for (const pkg of packages) {
      expect(pkg.source).toBe("Agra");
      expect(pkg.startingPriceInr).toBeNull();
      expect(pkg.nightChargeInr).toBeNull();
      expect(pkg.fleetPrices).toEqual({});
      expect(pkg.status).toBe("published");
      expect(pkg.itinerary.length).toBeGreaterThanOrEqual(4);
      expect(pkg.inclusionsNote).toContain("Confirm date");
      expect(pkg.gallery.length).toBeGreaterThan(0);
      for (const photo of pkg.gallery) {
        expect(photo.url).toMatch(/^\/assets\/packages\/pexels\//);
        expect(() => readFileSync(new URL(`../../../react/public${photo.url}`, import.meta.url))).not.toThrow();
      }
    }
  });

  it("ships locally readable, hashed photos with real Pexels attribution", () => {
    const photos = JSON.parse(readFileSync(new URL("../../../react/src/data/package-photo-credits.json", import.meta.url), "utf8")) as Array<{ id: number; path: string; sourceUrl: string; photographer: string; sha256: string }>;
    expect(photos).toHaveLength(8);
    for (const photo of photos) {
      const buffer = readFileSync(new URL(`../../../react/public${photo.path}`, import.meta.url));
      expect(buffer.subarray(0, 4).toString()).toBe("RIFF");
      expect(createHash("sha256").update(buffer).digest("hex")).toBe(photo.sha256);
      expect(photo.sourceUrl).toMatch(new RegExp(`^https://www\\.pexels\\.com/photo/.+-${photo.id}/$`));
      expect(photo.photographer).not.toBe("");
    }
  });

  it("publishes the seeded content through the real manifest and by-code controller", async () => {
    const { app } = await createTestApp();
    try {
      const response = await app.inject({ method: "GET", url: "/api/v1/tour-packages/manifest" });
      expect(response.statusCode).toBe(200);
      const data = response.json().data;
      expect(data).toHaveLength(10);
      for (const item of data) {
        expect(item.startingPriceInr).toBeNull();
        expect(item.fleetPrices).toEqual({});
        expect(item.upgrades).toEqual([]);
      }
      for (const pkg of packages) {
        const detail = await app.inject({ method: "GET", url: `/api/v1/tour-packages/by-code/${pkg.packageCode}` });
        expect(detail.statusCode).toBe(200);
        expect(detail.json().data.itinerary).toEqual(pkg.itinerary);
        expect(detail.json().data.inclusionsNote).toBe(pkg.inclusionsNote);
        expect(detail.json().data.upgrades).toEqual([]);
      }
    } finally { await app.close(); }
  });

  it("never inherits demo prices for a matching legacy slug when a real unpriced row exists", () => {
    for (const pkg of SEED_TOUR_PACKAGES) {
      for (const tier of ["sedan", "ertiga", "innova-crysta", "tempo_traveller"] as const) {
        expect(() => resolvePackageFleetPrice(pkg.packageCode, tier, pkg)).toThrow(/no price/);
      }
    }
    // A genuinely configured tariff still works.
    expect(resolvePackageFleetPrice("agra-sightseeing", "sedan", {
      ...SEED_TOUR_PACKAGES[1], fleetPrices: { sedan: 3500 },
    }).totalFare).toBe(3500);
  });

  it("allows content to be created/edited without inventing a starting price", () => {
    const input = { name: "Agra test itinerary", package_code: "agra-test-itinerary", duration_text: "1 day" };
    expect(CreateTourPackageSchema.parse(input).starting_price_inr).toBeNull();
    expect(CreateTourPackageSchema.parse(input).fleet_prices).toEqual({});
    expect(UpdateTourPackageSchema.parse({ starting_price_inr: null, fleet_prices: {} })).toMatchObject({ starting_price_inr: null });
    expect(UpdateTourPackageSchema.parse({ name: "Only the name changes" })).not.toHaveProperty("starting_price_inr");
    for (const bad of [-1, 0, 12.5, Infinity]) {
      expect(CreateTourPackageSchema.safeParse({ ...input, starting_price_inr: bad }).success).toBe(false);
    }
  });

  it("generates an additive seed for the current schema, with no pricing or operational writes", () => {
    const sql = readFileSync(migrationUrl, "utf8");
    expect(sql).toContain("INSERT INTO public.tour_packages");
    expect(sql).toContain("ON CONFLICT (code) DO NOTHING");
    expect(sql).not.toMatch(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(?:public\.)?(?:fare_rules|bookings|payments|profiles|auth\.users)\b/i);
    const payload = sql.split("$agra_seed$")[1];
    expect(payload).toBeDefined();
    const records = JSON.parse(payload!);
    expect(records.map((record: { code: string }) => record.code)).toEqual(packages.map((pkg) => pkg.packageCode));
    expect(records.every((record: object) => !("starting_price_inr" in record) && !("fleet_prices" in record))).toBe(true);
  });
});
