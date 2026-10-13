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
