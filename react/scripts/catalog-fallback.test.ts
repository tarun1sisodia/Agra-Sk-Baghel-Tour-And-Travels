import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("canonical catalogue & fallback regressions", () => {
  it("loadPublishedPackages never falls back to static mock packages", () => {
    const manifestContent = readFileSync(
      resolve(__dirname, "../src/services/catalogManifest.ts"),
      "utf-8",
    );
    assert.equal(
      manifestContent.includes("staticPackages"),
      false,
      "catalogManifest.ts must not import or fall back to staticPackages",
    );
    assert.equal(
      /import\s+{[^}]*\bpackages\b[^}]*}\s+from\s+["']\.\.\/data["']/.test(manifestContent),
      false,
      "catalogManifest.ts must not import runtime packages from ../data",
    );
  });

  it("booking API response and outbound request validation fails closed instead of passing invalid payloads downstream", () => {
    const apiContent = readFileSync(resolve(__dirname, "../src/services/cleanFareApi.ts"), "utf-8");
    assert.ok(apiContent.includes('"CONTRACT_VALIDATION_ERROR"'));
    assert.ok(apiContent.includes('"INVALID_BOOKING_PAYLOAD"'));
    assert.ok(apiContent.includes("CreateBookingRequest.safeParse(req)"));
    assert.ok(apiContent.includes("return parseResult.data;"));
    assert.equal(apiContent.includes("console.warn(`[CleanFareApi] Validation warning"), false);
  });

  it("route parity allows unavailable vehicle fares but rejects routes without any positive fare", () => {
    const parityContent = readFileSync(resolve(__dirname, "../src/data/parity.ts"), "utf-8");
    assert.ok(parityContent.includes("fare === null || fare === undefined"));
    assert.ok(parityContent.includes("validFareCount === 0"));
  });

  it("RentalPage uses English copy and does not fabricate a confirmation reference", () => {
    const rentalPageContent = readFileSync(
      resolve(__dirname, "../src/pages/RentalPage.tsx"),
      "utf-8",
    );
    assert.equal(/[\u0900-\u097f]/.test(rentalPageContent), false, "RentalPage must use English-only UI copy.");
    assert.equal(rentalPageContent.includes("isHi"), false, "RentalPage must not retain language-specific copy branches.");
    assert.equal(rentalPageContent.includes("RNT-CONFIRMED"), false, "A success reference must come from the backend.");
    assert.equal(rentalPageContent.includes("confirmation.ref && ("), true, "Reference rendering must be conditional on the backend value.");
  });
  it("ReviewsMarquee does not import synthetic fallbackReviews", () => {
    const marqueeContent = readFileSync(
      resolve(__dirname, "../src/components/home/ReviewsMarquee.tsx"),
      "utf-8",
    );
    assert.equal(
      marqueeContent.includes("fallbackReviews"),
      false,
      "ReviewsMarquee must not import or initialize with fallbackReviews",
    );
  });

  it("RoutesPage does not fallback to staticCatalogRoutes", () => {
    const routesPageContent = readFileSync(
      resolve(__dirname, "../src/pages/RoutesPage.tsx"),
      "utf-8",
    );
    assert.equal(
      routesPageContent.includes("staticCatalogRoutes"),
      false,
      "RoutesPage must not import or fall back to staticCatalogRoutes",
    );
    assert.equal(
      routesPageContent.includes("mapCatalogueRoute"),
      false,
      "RoutesPage must not map static catalogue routes",
    );
  });

  it("FleetPage does not silently fall back to static FLEET_DATA when live fleet is empty", () => {
    const fleetPageContent = readFileSync(
      resolve(__dirname, "../src/pages/FleetPage.tsx"),
      "utf-8",
    );
    assert.equal(
      fleetPageContent.includes("if (liveFleet.length === 0) return FLEET_DATA;"),
      false,
      "FleetPage must not return static FLEET_DATA when live fleet is empty",
    );
  });

  it("ServicesPage separates editorial copy from live fleet facts", () => {
    const servicesPageContent = readFileSync(
      resolve(__dirname, "../src/pages/ServicesPage.tsx"),
      "utf-8",
    );
    // Title is placed in the top banner near the top of the image
    assert.ok(
      servicesPageContent.includes("Prominent TOP Title"),
      "ServicesPage must place title near top of image card",
    );
    // Tap interaction toggle for mobile touch devices
    assert.ok(
      servicesPageContent.includes("Accessible Mobile Tap Interaction Toggle"),
      "ServicesPage must provide accessible tap interaction toggle",
    );
  });
});
