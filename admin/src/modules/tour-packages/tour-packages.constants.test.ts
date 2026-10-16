import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_TOUR_PACKAGE,
  resolveTourPackageBaseTierCode,
} from "./tour-packages.constants.ts";

describe("tour package base tier form normalization", () => {
  it("uses the form's established default when the API returns null or undefined", () => {
    assert.equal(resolveTourPackageBaseTierCode(null), EMPTY_TOUR_PACKAGE.baseTierCode);
    assert.equal(resolveTourPackageBaseTierCode(undefined), EMPTY_TOUR_PACKAGE.baseTierCode);
    assert.equal(EMPTY_TOUR_PACKAGE.baseTierCode, "sedan");
  });

  it("preserves a valid stored tier", () => {
    assert.equal(resolveTourPackageBaseTierCode("innova-crysta"), "innova-crysta");
  });
});
