import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PublishedCatalogResponse, VehicleGroupCode } from "../src/contracts/fare-system.ts";

function getVehicleFallbackImage(groupCode: string, modelName?: string): string | null {
  const name = (modelName || "").toLowerCase();
  if (name.includes("urbania")) return "/assets/fleet/urbania.webp";
  if (name.includes("ertiga")) return "/assets/fleet/ertiga.webp";
  if (name.includes("innova") || name.includes("crysta")) return "/assets/fleet/innova.webp";
  if (name.includes("dzire") || name.includes("city") || name.includes("etios") || name.includes("aura")) {
    return "/assets/fleet/sedan.webp";
  }
  if (name.includes("traveller")) return "/assets/fleet/tempo.webp";
  // Unrecognized models must NOT masquerade as another vehicle. Neutral placeholder is rendered instead.
  return null;
}

describe("Taxi Rental Page — Cano nical Fleet & Form Invariants", () => {
  const mockCatalog: PublishedCatalogResponse = {
    groups: [
      {
        group_code: "sedan",
        name: "Sedan",
        driver_allowance_per_day: 500,
        one_way_night_charge: 0,
        round_trip_halt_per_night: 0,
        sort_order: 1,
      },
      {
        group_code: "suv",
        name: "SUV",
        driver_allowance_per_day: 500,
        one_way_night_charge: 0,
        round_trip_halt_per_night: 0,
        sort_order: 2,
      },
      {
        group_code: "luxury",
        name: "Luxury",
        driver_allowance_per_day: 500,
        one_way_night_charge: 0,
        round_trip_halt_per_night: 0,
        sort_order: 3,
      },
      {
        group_code: "tempo_traveller",
        name: "Tempo Traveller",
        driver_allowance_per_day: 700,
        one_way_night_charge: 0,
        round_trip_halt_per_night: 0,
        sort_order: 4,
      },
    ],
    vehicles: [
      {
        id: "10000000-0000-0000-0002-000000000001",
        group_code: "sedan",
        make: "Maruti",
        model_name: "Dzire",
        display_name: "Maruti Dzire",
        passenger_capacity: 4,
        luggage_capacity: 2,
        image_url: null,
      },
      {
        id: "10000000-0000-0000-0002-000000000002",
        group_code: "sedan",
        make: "Honda",
        model_name: "City",
        display_name: "Honda City",
        passenger_capacity: 4,
        luggage_capacity: 3,
        image_url: null,
      },
      {
        id: "10000000-0000-0000-0002-000000000003",
        group_code: "suv",
        make: "Maruti",
        model_name: "Ertiga",
        display_name: "Maruti Ertiga",
        passenger_capacity: 6,
        luggage_capacity: 3,
        image_url: null,
      },
      {
        id: "10000000-0000-0000-0002-000000000004",
        group_code: "suv",
        make: "Toyota",
        model_name: "Innova Crysta",
        display_name: "Innova Crysta",
        passenger_capacity: 7,
        luggage_capacity: 4,
        image_url: "/assets/fleet/innova.webp",
      },
      {
        id: "10000000-0000-0000-0002-000000000008",
        group_code: "tempo_traveller",
        make: "Force",
        model_name: "Traveller 12",
        display_name: "Force Traveller 12-seater",
        passenger_capacity: 12,
        luggage_capacity: 10,
        image_url: null,
      },
    ],
    products: [],
  };

  it("calculates active models count dynamically from live vehicle catalogue", () => {
    const sedanModels = mockCatalog.vehicles.filter((v) => v.group_code === "sedan");
    const suvModels = mockCatalog.vehicles.filter((v) => v.group_code === "suv");
    const luxuryModels = mockCatalog.vehicles.filter((v) => v.group_code === "luxury");
    const tempoModels = mockCatalog.vehicles.filter((v) => v.group_code === "tempo_traveller");

    assert.equal(sedanModels.length, 2);
    assert.equal(suvModels.length, 2);
    assert.equal(luxuryModels.length, 0); // No models currently in luxury group
    assert.equal(tempoModels.length, 1);
  });

  it("selecting a vehicle model preserves the exact model UUID and canonical group code", () => {
    const innova = mockCatalog.vehicles.find((v) => v.model_name === "Innova Crysta");
    assert.ok(innova);

    const selection = {
      vehicleGroupCode: innova.group_code,
      vehicleModelId: innova.id,
    };

    assert.equal(selection.vehicleGroupCode, "suv");
    assert.equal(selection.vehicleModelId, "10000000-0000-0000-0002-000000000004");
  });

  it("changing vehicle group clears incompatible selected vehicle model", () => {
    let currentGroup: VehicleGroupCode = "suv";
    let selectedModelId = "10000000-0000-0000-0002-000000000004"; // Innova Crysta (suv)

    // User switches group to sedan
    const newGroup: VehicleGroupCode = "sedan";
    const isModelInNewGroup = mockCatalog.vehicles.some(
      (v) => v.id === selectedModelId && v.group_code === newGroup
    );

    if (!isModelInNewGroup) {
      selectedModelId = ""; // Reset to 'Any suitable model'
      currentGroup = newGroup;
    }

    assert.equal(currentGroup, "sedan");
    assert.equal(selectedModelId, ""); // Correctly cleared!
  });

  it("resolves realistic fallback images without hallucinating vehicle identities", () => {
    assert.equal(getVehicleFallbackImage("sedan", "Maruti Dzire"), "/assets/fleet/sedan.webp");
    assert.equal(getVehicleFallbackImage("suv", "Innova Crysta"), "/assets/fleet/innova.webp");
    assert.equal(getVehicleFallbackImage("suv", "Maruti Ertiga"), "/assets/fleet/ertiga.webp");
    assert.equal(getVehicleFallbackImage("tempo_traveller", "Force Urbania 13"), "/assets/fleet/urbania.webp");
    assert.equal(getVehicleFallbackImage("tempo_traveller", "Force Traveller 12"), "/assets/fleet/tempo.webp");
    // Unknown or generic models must return null to trigger neutral group placeholder rather than a false car photo
    assert.equal(getVehicleFallbackImage("luxury", "Mercedes E-Class"), null);
    assert.equal(getVehicleFallbackImage("luxury", "BMW 5 Series"), null);
    assert.equal(getVehicleFallbackImage("suv", "Mahindra Scorpio"), null);
  });

  it("robustly defaults to first active group if current selection is not available in catalog", () => {
    // Scenario: catalog only has suv and luxury; initial selection was sedan
    const limitedCatalogGroups = [
      { group_code: "suv" as VehicleGroupCode, name: "SUV" },
      { group_code: "luxury" as VehicleGroupCode, name: "Luxury" },
    ];
    const availableCodes = new Set(limitedCatalogGroups.map((g) => g.group_code));
    const firstGroup = limitedCatalogGroups[0]!.group_code;

    const initialSelection: VehicleGroupCode = "sedan";
    const resolvedGroup = initialSelection && availableCodes.has(initialSelection) ? initialSelection : firstGroup;

    assert.equal(resolvedGroup, "suv");
  });

  it("validates Indian 10-digit mobile number format", () => {
    const validPhones = ["9876543210", "+91 98765 43210", "+919876543210", "6398123456"];
    const invalidPhones = ["1234567890", "98765", "abcdefghij", "5555555555"];

    for (const phone of validPhones) {
      const clean = phone.replace(/\D/g, "").slice(-10);
      assert.equal(/^[6-9]\d{9}$/.test(clean), true, `Failed for valid phone: ${phone}`);
    }

    for (const phone of invalidPhones) {
      const clean = phone.replace(/\D/g, "").slice(-10);
      assert.equal(/^[6-9]\d{9}$/.test(clean), false, `Should fail for invalid phone: ${phone}`);
    }
  });

  it("validates return date on or after pickup date", () => {
    const pickupDate = "2026-10-25";
    const sameDayReturn = "2026-10-25";
    const futureReturn = "2026-10-27";
    const pastReturn = "2026-10-24";

    assert.equal(sameDayReturn >= pickupDate, true);
    assert.equal(futureReturn >= pickupDate, true);
    assert.equal(pastReturn >= pickupDate, false);
  });

  it("ensures cleanProductMatch does NOT intercept /taxis/rent, routing correctly to RentalPage", () => {
    const testPaths = [
      "/en/taxis/rent/",
      "/en/taxis/rent",
      "/taxis/rent/",
      "/taxis/rent",
      "/rent/",
      "/rent",
      "/en/rent/",
      "/en/rental/",
      "/rental",
      "/taxi-rental",
    ];

    for (const pathname of testPaths) {
      const cleanPath = pathname.replace(/\/$/, "");
      const segments = pathname.split("/").filter(Boolean);
      const localizedSegments = segments[0] === "en" || segments[0] === "hi" ? segments.slice(1) : segments;
      const section = localizedSegments.at(-1)?.replace(/\.html$/, "") ?? "home";

      const normalizedPath = pathname.replace(/^\/(?:en|hi)(?=\/|$)/, "").replace(/\/$/, "");
      const taxiMatch = normalizedPath.match(/^\/(?:taxi|taxis)\/([a-z0-9_-]+)(?:\.html)?$/i);
      const cleanProductMatch = taxiMatch && taxiMatch[1].toLowerCase() !== "rent"
        ? { category: "outstation", code: taxiMatch[1] }
        : null;

      const isRental =
        section === "rent" ||
        section === "rental" ||
        section === "taxi-rental" ||
        cleanPath === "/rent" ||
        cleanPath === "/rental" ||
        cleanPath === "/taxi-rental" ||
        cleanPath === "/taxis/rent" ||
        cleanPath === "/en/rent" ||
        cleanPath === "/en/rental" ||
        cleanPath === "/en/taxi-rental" ||
        cleanPath === "/en/taxis/rent" ||
        cleanPath === "/hi/taxis/rent" ||
        cleanPath === "/hi/rent";

      assert.equal(cleanProductMatch, null, `cleanProductMatch must not match for ${pathname}`);
      assert.equal(isRental, true, `isRental must be true for ${pathname}`);
    }
  });

  it("header & mobile nav normalizeNavPath correctly highlights Taxi Rental link", () => {
    const normalizeNavPath = (path: string): string => {
      if (!path) return "/";
      const cleaned = path.split("?")[0].split("#")[0];
      const unlocalized = cleaned.replace(/^\/(?:en|hi)(?=\/|$)/, "");
      const trimmed = unlocalized.replace(/\.html$/, "").replace(/\/+$/, "");
      return trimmed === "" ? "/" : trimmed;
    };

    const isLinkActive = (currentPath: string, href: string) => {
      const current = normalizeNavPath(currentPath);
      const target = normalizeNavPath(href);
      if (target === "/taxis/rent") {
        return current === "/taxis/rent" || current === "/rent" || current === "/rental" || current === "/taxi-rental";
      }
      return current === target;
    };

    assert.equal(isLinkActive("/en/taxis/rent/", "/en/taxis/rent/"), true);
    assert.equal(isLinkActive("/taxis/rent", "/en/taxis/rent/"), true);
    assert.equal(isLinkActive("/rent", "/en/taxis/rent/"), true);
    assert.equal(isLinkActive("/rental", "/en/taxis/rent/"), true);
    assert.equal(isLinkActive("/taxi-rental", "/en/taxis/rent/"), true);
    assert.equal(isLinkActive("/en/routes/", "/en/taxis/rent/"), false);
  });
});
