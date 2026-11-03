import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLocalExtraRateFaq, getLocalExtraRateRows } from "../src/templates/localTourRates.ts";

describe("local sightseeing per-tour surcharges", () => {
  it("uses the saved group rates for all four tiers in both the table and FAQ", () => {
    const rows = getLocalExtraRateRows({
      sedan: { per_km: 13, per_hr: 175 },
      suv: { per_km: 19, per_hr: 240 },
      tempo_traveller: { per_km: 31, per_hr: 425 },
      luxury: { per_km: 44, per_hr: 650 },
    });
    assert.deepEqual(rows.map(({ key, perKm, perHr }) => [key, perKm, perHr]), [
      ["sedan", 13, 175],
      ["suv", 19, 240],
      ["tempo_traveller", 31, 425],
      ["luxury", 44, 650],
    ]);
    const faq = getLocalExtraRateFaq(rows, 8, 80);
    for (const rate of ["₹13/km", "₹175/hr", "₹19/km", "₹240/hr", "₹31/km", "₹425/hr", "₹44/km", "₹650/hr"]) {
      assert.ok(faq.includes(rate), `FAQ should include ${rate}`);
    }
    assert.match(faq, /8 hours or 80 km/);
    assert.doesNotMatch(faq, /₹10\/km|₹14\/km/);
  });

  it("never invents a price for missing, zero, or incomplete legacy rates", () => {
    for (const rates of [null, {}, undefined]) {
      const rows = getLocalExtraRateRows(rates);
      assert.ok(rows.every(({ perKm, perHr }) => perKm === null && perHr === null));
      assert.match(getLocalExtraRateFaq(rows, 4, 40), /contact us to confirm/);
      assert.doesNotMatch(getLocalExtraRateFaq(rows, 4, 40), /₹/);
    }
    const partial = getLocalExtraRateRows({ sedan: { per_km: 12, per_hr: 0 } });
    assert.equal(partial[0]?.perKm, 12);
    assert.equal(partial[0]?.perHr, null);
    assert.match(getLocalExtraRateFaq(partial, 4, 40), /₹12\/km/);
    assert.doesNotMatch(getLocalExtraRateFaq(partial, 4, 40), /₹0\/hr/);
  });
});
