import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { mapTourPackage, packageArea } from "../src/data/tourPackage.ts";

const seeds = JSON.parse(readFileSync(new URL("../../backend/src/db/agra-packages.seed.json", import.meta.url), "utf8"));

describe("Agra package presentation — honest unpriced content", () => {
  it("keeps all ten researched packages unpriced through normalization and re-normalization", () => {
    for (const seed of seeds) {
      const mapped = mapTourPackage(seed);
      assert.equal(mapped.slug, seed.packageCode);
      assert.equal(mapped.from, null);
      assert.deepEqual(mapped.fleetPrices, {});
      assert.deepEqual(mapped.itinerary, seed.itinerary);
      assert.deepEqual(mapped.includes, seed.inclusions);
      assert.equal(mapped.planningNote, seed.inclusionsNote);
      assert.deepEqual(mapTourPackage(mapped), mapped);
    }
  });

  it("does not turn absent, zero, malformed or non-finite prices into payable fares", () => {
    for (const value of [undefined, null, 0, -1, NaN, Infinity, "2000"]) {
      assert.equal(mapTourPackage({ startingPriceInr: value, fleetPrices: { sedan: value } }).from, null);
      assert.deepEqual(mapTourPackage({ startingPriceInr: value, fleetPrices: { sedan: value } }).fleetPrices, {});
    }
    assert.equal(mapTourPackage({}).from, null);
    assert.equal(mapTourPackage({ starting_price_inr: 2300 }).from, 2300);
    assert.equal(mapTourPackage({ fleet_prices: { sedan: 2300, suv: 3300 } }).from, 2300);
  });

  it("offers four city days, four nearby day trips and two overnight choices", () => {
    const areas = seeds.map(mapTourPackage).map(packageArea);
    assert.equal(areas.filter((area: string) => area === "agra").length, 4);
    assert.equal(areas.filter((area: string) => area === "nearby").length, 4);
    assert.equal(areas.filter((area: string) => area === "overnight").length, 2);
  });

  it("does not add made-up inclusions, itinerary stops or reviews to an empty record", () => {
    const result = mapTourPackage({ package_code: "empty-itinerary", name: "An operator draft" });
    assert.deepEqual(result.itinerary, []);
    assert.deepEqual(result.includes, []);
    assert.deepEqual(result.excludes, []);
    assert.deepEqual(result.gallery, []);
    assert.equal(result.planningNote, "");
    assert.equal("rating" in result, false);
  });
});
