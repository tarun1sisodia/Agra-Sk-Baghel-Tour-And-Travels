import { describe, it, expect } from "vitest";
import {
  resolvePackageFleetPrice,
  calculateTourPackageFare,
} from "../../src/modules/fares/calculators/tour-package.calculator.js";
import { calculateFare } from "../../src/modules/fares/fare.engine.js";
import { createFareService } from "../../src/modules/fares/fare.service.js";
import { createMemoryRepositories } from "../../src/db/memory.js";
import type { TourPackageRecord } from "../../src/db/dossier-types.js";
import type { VehicleTier } from "../../src/types/domain.js";

describe("Phase 5: Package Fleet-Price Resolver & Route Rate Isolation", () => {
  const sampleTourPackage: TourPackageRecord = {
    id: "50000000-0000-4000-a000-000000000006",
    packageCode: "golden-triangle",
    name: "Golden Triangle Tour",
    durationText: "3 Days / 2 Nights",
    days: 3,
    nights: 2,
    baseTierCode: "sedan",
    startingPriceInr: 18500,
    fleetPrices: {
      sedan: 18500,
      ertiga: 19300,
      "innova-crysta": 20300,
      tempo_traveller: 22000,
      "urbania-13": 24000,
    },
    nightChargeInr: 300,
    inclusionsHighlight: "Delhi, Agra & Jaipur circuit with highway tolls",
    inclusionsNote: null,
    imageUrl: "/assets/packages/golden-triangle.webp",
    gallery: [],
    status: "published",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe("5.2 resolvePackageFleetPrice Unit Tests", () => {
    const tiers: Array<{
      tier: VehicleTier;
      expectedFare: number;
      expectedAdvance: number;
      expectedBalance: number;
    }> = [
      { tier: "sedan", expectedFare: 18500, expectedAdvance: 5200, expectedBalance: 13300 },
      { tier: "ertiga", expectedFare: 19300, expectedAdvance: 5400, expectedBalance: 13900 },
      { tier: "innova-crysta", expectedFare: 20300, expectedAdvance: 5700, expectedBalance: 14600 },
      { tier: "tempo_traveller", expectedFare: 22000, expectedAdvance: 6200, expectedBalance: 15800 },
      { tier: "urbania-13", expectedFare: 24000, expectedAdvance: 6700, expectedBalance: 17300 },
    ];

    tiers.forEach(({ tier, expectedFare, expectedAdvance, expectedBalance }) => {
      it(`resolves fixed price for ${tier} directly from fleet_prices`, () => {
        const result = resolvePackageFleetPrice(
          "golden-triangle",
          tier,
          sampleTourPackage,
        );

        expect(result.totalFare).toBe(expectedFare);
        expect(result.advanceAmount).toBe(expectedAdvance);
        expect(result.balanceAmount).toBe(expectedBalance);
        expect(result.advanceAmount + result.balanceAmount).toBe(result.totalFare);
        expect(result.pricingType).toBe("fixed-package");
        expect(result.priceSource).toBe("tour_packages");
        expect(result.rules).toContain("dossier-admin-fleet-price");
      });
    });

    it("falls back to startingPriceInr + upgradeSurcharges when fleet_prices is absent", () => {
      const packageWithoutFleetPrices: Partial<TourPackageRecord> = {
        packageCode: "taj-sunrise-custom",
        name: "Taj Sunrise Custom",
        startingPriceInr: 10000,
        fleetPrices: {},
      };

      const customUpgrades = {
        sedan: 0,
        ertiga: 1200,
        "innova-crysta": 2500,
        tempo_traveller: 4000,
        "urbania-13": 6000,
      };

      const resultSedan = resolvePackageFleetPrice(
        "taj-sunrise-custom",
        "sedan",
        packageWithoutFleetPrices,
        customUpgrades,
      );
      expect(resultSedan.totalFare).toBe(10000);
      expect(resultSedan.rules).toContain("dossier-starting-price-upgrade");

      const resultTempo = resolvePackageFleetPrice(
        "taj-sunrise-custom",
        "tempo_traveller",
        packageWithoutFleetPrices,
        customUpgrades,
      );
      expect(resultTempo.totalFare).toBe(14000);
      expect(resultTempo.rules).toContain("dossier-starting-price-upgrade");
    });

    it("falls back to catalog PACKAGES when no database row is provided", () => {
      const result = resolvePackageFleetPrice("agra-day", "sedan");
      // agy catalog has agra-day starting from 3499
      expect(result.totalFare).toBe(3499);
      expect(result.rules).toContain("catalog-fixed-package");

      const resultErtiga = resolvePackageFleetPrice("agra-day", "ertiga");
      // 3499 + 800 (ertiga upgrade) = 4299
      expect(resultErtiga.totalFare).toBe(4299);
    });

    it("matches catalog packages with or without -tour suffix", () => {
      const res1 = resolvePackageFleetPrice("golden-triangle", "sedan");
      const res2 = resolvePackageFleetPrice("golden-triangle-tour", "sedan");
      expect(res1.totalFare).toBe(res2.totalFare);
      expect(res1.totalFare).toBe(18500);
    });

    it("throws 404 error when package cannot be found", () => {
      expect(() =>
        resolvePackageFleetPrice("non-existent-package-xyz", "sedan"),
      ).toThrowError(/not found/i);
    });
  });

  describe("5.2 Complete Distance & Corridor Isolation", () => {
    const distances = [1, 50, 150, 299, 300, 350, 1000];

    distances.forEach((distanceKm) => {
      it(`Tempo Traveller package price is invariant at ${distanceKm} km (no route math)`, () => {
        const fare = calculateFare({
          originName: "Agra",
          destinationName: "Delhi",
          distanceKm,
          vehicleTier: "tempo_traveller",
          tripType: "round-trip",
          pickupDatetime: "2026-10-20T10:00:00Z",
          returnDatetime: "2026-10-22T18:00:00Z",
          ruleOverrides: {
            catalogItemType: "tour",
            usePerKm: false,
            packageBasePrice: 18500,
            fleetPrices: {
              tempo_traveller: 22000,
            },
          },
        });

        // Must remain exactly ₹22,000 regardless of 1km, 299km, 1000km
        expect(fare.totalFare).toBe(22000);
        expect(fare.baseFare).toBe(22000);
        expect(fare.driverAllowance).toBe(0);
        expect(fare.alwaysRoundTrip).toBe(false);
        expect(fare.advanceAmount).toBe(6200);
        expect(fare.balanceAmount).toBe(15800);
      });
    });

    it("Force Urbania package price is invariant across trip types (one-way vs round-trip)", () => {
      const oneWayFare = calculateFare({
        originName: "Agra",
        destinationName: "Jaipur",
        distanceKm: 240,
        vehicleTier: "urbania-13",
        tripType: "one-way",
        pickupDatetime: "2026-10-20T10:00:00Z",
        ruleOverrides: {
          catalogItemType: "tour",
          usePerKm: false,
          fleetPrices: {
            "urbania-13": 24000,
          },
        },
      });

      const roundTripFare = calculateFare({
        originName: "Agra",
        destinationName: "Jaipur",
        distanceKm: 240,
        vehicleTier: "urbania-13",
        tripType: "round-trip",
        pickupDatetime: "2026-10-20T10:00:00Z",
        returnDatetime: "2026-10-22T18:00:00Z",
        ruleOverrides: {
          catalogItemType: "tour",
          usePerKm: false,
          fleetPrices: {
            "urbania-13": 24000,
          },
        },
      });

      expect(oneWayFare.totalFare).toBe(24000);
      expect(roundTripFare.totalFare).toBe(24000);
      expect(oneWayFare.driverAllowance).toBe(0);
      expect(roundTripFare.driverAllowance).toBe(0);
      expect(oneWayFare.advanceAmount).toBe(roundTripFare.advanceAmount);
    });

    it("offline calculateTourPackageFare ensures fixed price for commercial group vehicles", () => {
      const spec = {
        id: "tempo" as const,
        tier: "tempo_traveller" as const,
        name: "Tempo Traveller",
        seats: 12,
        bags: 8,
        perKm: 25,
        alwaysRoundTrip: true,
      };

      const result = calculateTourPackageFare(
        {
          originName: "Agra",
          destinationName: "Delhi",
          distanceKm: 200,
          vehicleTier: "tempo_traveller",
          tripType: "round-trip",
          pickupDatetime: "2026-10-20T10:00:00Z",
          packageId: "golden-triangle",
        },
        spec,
        "2026-09-13",
      );

      expect(result).not.toBeNull();
      // golden-triangle (18500) + tempo upgrade (3500) = 22000
      expect(result!.baseFare).toBe(22000);
      expect(result!.driverAllowance).toBe(0);
      expect(result!.alwaysRoundTrip).toBe(false);
      expect(result!.rules).toEqual(["package-fixed", "vehicle-upgrade"]);
    });

    it("FareService.resolvePackageFleetPrice integrates with db repositories", async () => {
      const db = createMemoryRepositories();
      await db.tourPackages.update(sampleTourPackage);

      const service = createFareService("2026-09-13", db);
      const quote = await service.resolvePackageFleetPrice("golden-triangle", "tempo_traveller");

      expect(quote.totalFare).toBe(22000);
      expect(quote.advanceAmount).toBe(6200);
      expect(quote.balanceAmount).toBe(15800);
      expect(quote.packageName).toBe("Golden Triangle Tour");

      // Verify code lookup works by UUID as well
      const quoteByUuid = await service.resolvePackageFleetPrice(sampleTourPackage.id, "urbania-13");
      expect(quoteByUuid.totalFare).toBe(24000);
      expect(quoteByUuid.advanceAmount).toBe(6700);
    });

    it("Changing outstation fare rates in rules does NOT mutate tour package quote", async () => {
      const db = createMemoryRepositories();
      await db.tourPackages.update(sampleTourPackage);

      // Create fare rule with massive rate change (Sedan: 10 -> 50/km)
      await db.fareRules.save({
        id: "rule-1",
        version: "2026-10-16",
        config: {
          vehicles: [
            { tier: "sedan", perKm: 50, active: true },
            { tier: "tempo_traveller", perKm: 100, active: true },
          ],
        },
        isActive: true,
        effectiveFrom: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      const service = createFareService("2026-10-16", db);
      const sedanQuote = await service.calculate({
        originName: "Agra",
        destinationName: "Delhi",
        vehicleTier: "sedan",
        tripType: "round-trip",
        pickupDatetime: "2026-10-20T10:00:00Z",
        packageId: "golden-triangle",
      });

      // Tour package sedan must still be 18500, NOT 50/km * 210km
      expect(sedanQuote.totalFare).toBe(18500);
      expect(sedanQuote.baseFare).toBe(18500);

      const tempoQuote = await service.calculate({
        originName: "Agra",
        destinationName: "Delhi",
        vehicleTier: "tempo_traveller",
        tripType: "round-trip",
        pickupDatetime: "2026-10-20T10:00:00Z",
        packageId: "golden-triangle",
      });

      // Tour package tempo must still be 22000, NOT 100/km * 420km + DA
      expect(tempoQuote.totalFare).toBe(22000);
      expect(tempoQuote.baseFare).toBe(22000);
      expect(tempoQuote.driverAllowance).toBe(0);
    });
  });
});
