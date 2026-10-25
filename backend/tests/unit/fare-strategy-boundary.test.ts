import { describe, it, expect } from "vitest";
import { calculateFare } from "../../src/modules/fares/fare.engine.js";

describe("Phase 4: Route Fleet-Price Distance Boundary Test Matrix (DIST-01 to DIST-09)", () => {
  const BASE_PICKUP = "2026-11-01T10:00:00.000Z";

  it("DIST-01: 1 km edge corridor for Sedan bills 1 km, 0 DA, advance >= 500", () => {
    const result = calculateFare({
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Agra Cantt",
      pickupDatetime: BASE_PICKUP,
      distanceKm: 1,
      ruleOverrides: { usePerKm: true },
    });

    expect(result.billedKm).toBe(1);
    expect(result.driverAllowance).toBe(0);
    expect(result.baseFare).toBe(10); // 1 km * 10/km
    expect(result.totalFare).toBe(10);
    expect(result.advanceAmount).toBe(10); // When total < 500, advance = totalFare (never exceeds total)
    expect(result.alwaysRoundTrip).toBe(false);
  });

  it("DIST-02: 100 km short corridor for Sedan bills 100 km, 0 DA, 28% advance", () => {
    const result = calculateFare({
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Mathura",
      pickupDatetime: BASE_PICKUP,
      distanceKm: 100,
      ruleOverrides: { usePerKm: true },
    });

    expect(result.billedKm).toBe(100);
    expect(result.driverAllowance).toBe(0);
    expect(result.baseFare).toBe(1000); // 100 * 10
    expect(result.totalFare).toBe(1000);
    expect(result.advanceAmount).toBe(500); // Math.max(500, round(1000 * 0.28 = 280)) -> 500
  });

  it("DIST-03: 240 km corridor for Innova Crysta bills 240 km, 0 DA, 28% advance", () => {
    const result = calculateFare({
      tripType: "one-way",
      vehicleTier: "innova-crysta",
      originName: "Agra",
      destinationName: "Delhi Airport",
      pickupDatetime: BASE_PICKUP,
      distanceKm: 240,
      ruleOverrides: { usePerKm: true },
    });

    expect(result.billedKm).toBe(240);
    expect(result.driverAllowance).toBe(0);
    expect(result.baseFare).toBe(4320); // 240 * 18
    expect(result.totalFare).toBe(4320);
    expect(result.advanceAmount).toBe(1200); // advanceOf(4320) = round to nearest 100 -> 1200
  });

  it("DIST-04: 299 km boundary for Tempo Traveller forces round-trip (598 km) and ₹500 DA", () => {
    const result = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo_traveller",
      originName: "Agra",
      destinationName: "Haridwar Boundary",
      pickupDatetime: BASE_PICKUP,
      distanceKm: 299,
    });

    expect(result.alwaysRoundTrip).toBe(true);
    expect(result.billedKm).toBe(598); // 299 * 2
    expect(result.driverAllowance).toBe(500); // 1 day DA
    expect(result.baseFare).toBe(14950); // 598 * 25
    expect(result.totalFare).toBe(15450); // 14950 + 500
    expect(result.advanceAmount).toBe(4300); // advanceOf(15450) -> 4300
  });

  it("DIST-05: 299.9 km boundary for Force Urbania forces round-trip (599.8 km) and ₹500 DA", () => {
    const result = calculateFare({
      tripType: "one-way",
      vehicleTier: "urbania-13",
      originName: "Agra",
      destinationName: "Rishikesh Boundary",
      pickupDatetime: BASE_PICKUP,
      distanceKm: 299.9,
    });

    expect(result.alwaysRoundTrip).toBe(true);
    expect(result.billedKm).toBe(599.8); // 299.9 * 2
    expect(result.driverAllowance).toBe(500);
    expect(result.baseFare).toBe(20393); // 599.8 * 34 = 20393.2 -> roundRupees(20393.2) = 20393
    expect(result.totalFare).toBe(20893); // 20393 + 500
    expect(result.advanceAmount).toBe(5900); // advanceOf(20893) -> 5900
  });

  it("DIST-06: 300.0 km boundary for Tempo Traveller bills one-way (300 km) and ₹500 DA", () => {
    const result = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo_traveller",
      originName: "Agra",
      destinationName: "Jaipur Express",
      pickupDatetime: BASE_PICKUP,
      distanceKm: 300,
    });

    expect(result.alwaysRoundTrip).toBe(false);
    expect(result.billedKm).toBe(300);
    expect(result.driverAllowance).toBe(500);
    expect(result.baseFare).toBe(7500); // 300 * 25
    expect(result.totalFare).toBe(8000); // 7500 + 500
    expect(result.advanceAmount).toBe(2200); // advanceOf(8000) -> 2200
  });

  it("DIST-07: 300.1 km boundary for Force Urbania bills one-way (300.1 km) and ₹500 DA", () => {
    const result = calculateFare({
      tripType: "one-way",
      vehicleTier: "urbania-13",
      originName: "Agra",
      destinationName: "Dehradun Outskirts",
      pickupDatetime: BASE_PICKUP,
      distanceKm: 300.1,
    });

    expect(result.alwaysRoundTrip).toBe(false);
    expect(result.billedKm).toBe(300.1);
    expect(result.driverAllowance).toBe(500);
    expect(result.baseFare).toBe(10203); // 300.1 * 34 = 10203.4 -> 10203
    expect(result.totalFare).toBe(10703); // 10203 + 500
    expect(result.advanceAmount).toBe(3000); // advanceOf(10703) -> 3000
  });

  it("DIST-08: 350 km long corridor for Tempo Traveller bills one-way (350 km) and ₹500 DA", () => {
    const result = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo_traveller",
      originName: "Agra",
      destinationName: "Chandigarh",
      pickupDatetime: BASE_PICKUP,
      distanceKm: 350,
    });

    expect(result.alwaysRoundTrip).toBe(false);
    expect(result.billedKm).toBe(350);
    expect(result.driverAllowance).toBe(500);
    expect(result.baseFare).toBe(8750); // 350 * 25
    expect(result.totalFare).toBe(9250); // 8750 + 500
    expect(result.advanceAmount).toBe(2600); // advanceOf(9250) -> 2600
  });

  it("DIST-09: Multi-Day (2 Days) for Force Urbania bills 2x DA (₹1000)", () => {
    const returnDatetime = "2026-11-02T18:00:00.000Z"; // 2 days in IST
    const result = calculateFare({
      tripType: "round-trip",
      vehicleTier: "urbania-13",
      originName: "Agra",
      destinationName: "Jaipur",
      pickupDatetime: BASE_PICKUP,
      returnDatetime,
      distanceKm: 240,
    });

    expect(result.driverAllowance).toBe(1000); // 500 * 2 days
    expect(result.alwaysRoundTrip).toBe(true);
    expect(result.billedKm).toBe(480); // 240 * 2
    expect(result.baseFare).toBe(16320); // 480 * 34
    expect(result.totalFare).toBe(17320); // 16320 + 1000
    expect(result.advanceAmount).toBe(4800); // advanceOf(17320) -> 4800
  });
});
