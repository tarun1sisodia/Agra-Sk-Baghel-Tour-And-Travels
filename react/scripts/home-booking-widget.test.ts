import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deriveActiveVehicleGroups,
  parseRouteCities,
  findMatchingOutstationRoute,
  buildCustomEnquiryHref,
  buildBookingHref,
} from "../src/components/home/bookingWidgetHelpers.ts";
import type { PublishedCatalogResponse, PublishedProductSummary } from "../src/contracts/fare-system.ts";

describe("HomeBookingWidget — Fleet readiness & Route matching regressions", () => {
  it("deriveActiveVehicleGroups returns empty array when catalog is null or has empty groups", () => {
    assert.deepEqual(deriveActiveVehicleGroups(null), []);
    assert.deepEqual(deriveActiveVehicleGroups({ groups: [], vehicles: [], products: [] } as any), []);
  });

  it("deriveActiveVehicleGroups hides groups with 0 active models in live catalog", () => {
    const catalog: PublishedCatalogResponse = {
      groups: [
        { group_code: "sedan", name: "Sedan" } as any,
        { group_code: "luxury", name: "Luxury" } as any,
      ],
      vehicles: [
        { id: "v1", group_code: "sedan", model_name: "Dzire", display_name: "Swift Dzire" } as any,
      ],
      products: [],
    };

    const activeGroups = deriveActiveVehicleGroups(catalog);
    assert.equal(activeGroups.length, 1);
    assert.equal(activeGroups[0].code, "sedan");
    assert.equal(activeGroups[0].modelCount, 1);
    assert.equal(activeGroups[0].defaultSub, "Swift Dzire");
    // Luxury has 0 models, so it must be excluded
    assert.equal(activeGroups.some((g) => g.code === "luxury"), false);
  });

  it("deriveActiveVehicleGroups keeps group selection distinct from vehicle model identity", () => {
    const catalog: PublishedCatalogResponse = {
      groups: [
        { group_code: "suv", name: "SUV Fleet" } as any,
      ],
      vehicles: [
        { id: "v1", group_code: "suv", model_name: "Ertiga", display_name: "Maruti Ertiga" } as any,
        { id: "v2", group_code: "suv", model_name: "Innova", display_name: "Toyota Innova" } as any,
      ],
      products: [],
    };

    const activeGroups = deriveActiveVehicleGroups(catalog);
    assert.equal(activeGroups.length, 1);
    assert.equal(activeGroups[0].code, "suv");
    assert.equal(activeGroups[0].modelCount, 2);
    assert.equal(activeGroups[0].defaultSub, "Maruti Ertiga / Toyota Innova");
  });

  it("parseRouteCities parses valid corridor names without falling back to hardcoded cities", () => {
    const validRoute: PublishedProductSummary = {
      id: "prod-1",
      code: "agra-to-delhi",
      name: "Agra to Delhi",
      category: "outstation",
      distance_km: 230,
      starting_price_inr: 2800,
    } as any;

    const parsed = parseRouteCities(validRoute);
    assert.equal(parsed.origin, "Agra");
    assert.equal(parsed.destination, "Delhi");
    assert.equal(parsed.distanceKm, 230);
    assert.equal(parsed.startingPrice, 2800);

    const unusualRoute: PublishedProductSummary = {
      id: "prod-2",
      code: "special-event-transfer",
      name: "Special Event Transfer",
      category: "outstation",
    } as any;

    const parsedUnusual = parseRouteCities(unusualRoute);
    assert.equal(parsedUnusual.origin, "Special Event Transfer");
    assert.equal(parsedUnusual.destination, "");
    assert.notEqual(parsedUnusual.origin, "Agra");
    assert.notEqual(parsedUnusual.destination, "Delhi");
  });

  it("findMatchingOutstationRoute returns exact route for published corridor and null for unmatched", () => {
    const routes = [
      {
        id: "r1",
        code: "agra-to-delhi",
        name: "Agra to Delhi",
        origin: "Agra",
        destination: "Delhi",
      },
      {
        id: "r2",
        code: "delhi-to-jaipur",
        name: "Delhi to Jaipur",
        origin: "Delhi",
        destination: "Jaipur",
      },
    ];

    const match = findMatchingOutstationRoute(routes, "Agra", "Delhi");
    assert.ok(match);
    assert.equal(match.code, "agra-to-delhi");

    const unmatched = findMatchingOutstationRoute(routes, "Agra", "Shimla");
    assert.equal(unmatched, null, "Unmatched destination must return null");

    const emptyOrigin = findMatchingOutstationRoute(routes, "", "Delhi");
    assert.equal(emptyOrigin, null, "Empty origin must return null");
  });

  it("buildBookingHref blocks invalid outstation handoffs and redirects to custom enquiry", () => {
    // Unmatched route must NOT produce /book.html with empty product
    const unmatchedHandoff = buildBookingHref({
      mode: "oneway",
      origin: "Agra",
      destination: "Shimla",
      matchedRoute: null,
      selectedVehicle: "sedan",
      pickupDate: "2026-10-20",
    });

    assert.ok(unmatchedHandoff.startsWith("/contact.html?serviceType=custom_route"));
    assert.ok(unmatchedHandoff.includes("from=Agra"));
    assert.ok(unmatchedHandoff.includes("to=Shimla"));
    assert.ok(unmatchedHandoff.includes("trip=one_way"));
    assert.ok(unmatchedHandoff.includes("date=2026-10-20"));
    assert.ok(unmatchedHandoff.includes("car=sedan"));
    assert.equal(unmatchedHandoff.includes("/book.html"), false, "Must never direct unmatched route to /book.html");
  });

  it("buildBookingHref preserves route, trip type, dates, and group preference during valid handoff", () => {
    const matchedRoute = {
      id: "r1",
      code: "agra-to-delhi",
      name: "Agra to Delhi",
      origin: "Agra",
      destination: "Delhi",
    };

    const oneWayHandoff = buildBookingHref({
      mode: "oneway",
      origin: "Agra",
      destination: "Delhi",
      matchedRoute,
      selectedVehicle: "suv",
      pickupDate: "2026-10-20",
    });

    assert.ok(oneWayHandoff.startsWith("/book.html?"));
    assert.ok(oneWayHandoff.includes("category=outstation"));
    assert.ok(oneWayHandoff.includes("product=agra-to-delhi"));
    assert.ok(oneWayHandoff.includes("trip=one_way"));
    assert.ok(oneWayHandoff.includes("from=Agra"));
    assert.ok(oneWayHandoff.includes("to=Delhi"));
    assert.ok(oneWayHandoff.includes("car=suv"));
    assert.ok(oneWayHandoff.includes("date=2026-10-20"));

    const roundTripHandoff = buildBookingHref({
      mode: "round",
      origin: "Agra",
      destination: "Delhi",
      matchedRoute,
      selectedVehicle: "tempo_traveller",
      pickupDate: "2026-10-20",
      returnDate: "2026-10-23",
    });

    assert.ok(roundTripHandoff.includes("trip=round_trip"));
    assert.ok(roundTripHandoff.includes("return_date=2026-10-23"));
    assert.ok(roundTripHandoff.includes("car=tempo_traveller"));
  });

  it("buildCustomEnquiryHref preserves origin, destination, trip type, dates, and vehicle preference", () => {
    const enquiry = buildCustomEnquiryHref({
      origin: "Mathura",
      destination: "Nainital",
      mode: "round",
      pickupDate: "2026-11-01",
      returnDate: "2026-11-05",
      selectedVehicle: "suv",
    });

    assert.ok(enquiry.includes("serviceType=custom_route"));
    assert.ok(enquiry.includes("from=Mathura"));
    assert.ok(enquiry.includes("to=Nainital"));
    assert.ok(enquiry.includes("trip=round_trip"));
    assert.ok(enquiry.includes("date=2026-11-01"));
    assert.ok(enquiry.includes("return_date=2026-11-05"));
    assert.ok(enquiry.includes("car=suv"));
  });
});
