import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countFleetTrips, resolveFleetBucket } from "./vehicleTierCounts.ts";

/**
 * Regression coverage for issue #129 — admin "Trips by vehicle tier" counts.
 * Exercises canonical C-ENUM-001 model keys, historical aliases, vehicle GROUP
 * codes, model display names and the missing/unknown fallbacks.
 */
describe("resolveFleetBucket — canonical model keys", () => {
  it("maps sedan-family models to Sedan", () => {
    for (const tier of ["sedan", "dzire", "city"]) {
      assert.equal(resolveFleetBucket({ vehicleTier: tier }), "sedan", `${tier} → sedan`);
    }
  });

  it("maps Ertiga and Innova to their own buckets", () => {
    assert.equal(resolveFleetBucket({ vehicleTier: "ertiga" }), "ertiga");
    assert.equal(resolveFleetBucket({ vehicleTier: "innova-crysta" }), "innova-crysta");
  });

  it("aggregates BOTH traveller sizes into Tempo", () => {
    assert.equal(resolveFleetBucket({ vehicleTier: "traveller-12" }), "tempo-traveller");
    assert.equal(resolveFleetBucket({ vehicleTier: "traveller-17" }), "tempo-traveller");
  });

  it("aggregates urbania-13 into Urbania", () => {
    assert.equal(resolveFleetBucket({ vehicleTier: "urbania-13" }), "urbania");
  });

  it("maps luxury models outside the five fleets to Other", () => {
    for (const tier of ["fortuner", "camry", "vellfire"]) {
      assert.equal(resolveFleetBucket({ vehicleTier: tier }), "other", `${tier} → other`);
    }
  });
});

describe("resolveFleetBucket — historical aliases", () => {
  it("normalizes legacy aliases", () => {
    assert.equal(resolveFleetBucket({ vehicleTier: "innova" }), "innova-crysta");
    assert.equal(resolveFleetBucket({ vehicleTier: "tempo" }), "tempo-traveller");
    assert.equal(resolveFleetBucket({ vehicleTier: "tempo-traveller" }), "tempo-traveller");
    assert.equal(resolveFleetBucket({ vehicleTier: "tempo_traveller" }), "tempo-traveller");
    assert.equal(resolveFleetBucket({ vehicleTier: "urbania" }), "urbania");
  });

  it("is case/whitespace/separator insensitive", () => {
    assert.equal(resolveFleetBucket({ vehicleTier: "  INNOVA-Crysta " }), "innova-crysta");
    assert.equal(resolveFleetBucket({ vehicleTier: "Urbania_13" }), "urbania");
    assert.equal(resolveFleetBucket({ vehicleTier: "Traveller_17" }), "tempo-traveller");
    assert.equal(resolveFleetBucket({ vehicleTier: "TEMPO_TRaveller" }), "tempo-traveller");
  });
});

describe("resolveFleetBucket — vehicle GROUP codes (clean quote snapshot)", () => {
  it("maps the sedan group to Sedan and tempo group to Tempo", () => {
    assert.equal(resolveFleetBucket({ vehicleTier: "sedan" }), "sedan");
    assert.equal(resolveFleetBucket({ vehicleTier: "tempo_traveller" }), "tempo-traveller");
  });

  it("does NOT guess Ertiga/Innova from a bare SUV group", () => {
    assert.equal(resolveFleetBucket({ vehicleTier: "suv" }), "other");
  });

  it("maps the luxury group to Other", () => {
    assert.equal(resolveFleetBucket({ vehicleTier: "luxury" }), "other");
  });
});

describe("resolveFleetBucket — model identity splits ambiguous groups", () => {
  it("uses display name to split the SUV group into Ertiga vs Innova", () => {
    assert.equal(
      resolveFleetBucket({ vehicleTier: "suv", vehicleModel: { displayName: "Maruti Ertiga Hybrid", groupCode: "suv" } }),
      "ertiga",
    );
    assert.equal(
      resolveFleetBucket({ vehicleTier: "suv", vehicleModel: { displayName: "Toyota Innova Crysta VIP", groupCode: "suv" } }),
      "innova-crysta",
    );
  });

  it("lets Urbania model identity win over the tempo_traveller group", () => {
    assert.equal(
      resolveFleetBucket({ vehicleTier: "tempo_traveller", vehicleModel: { displayName: "Force Urbania 13-Seater VIP", groupCode: "tempo_traveller" } }),
      "urbania",
    );
    assert.equal(
      resolveFleetBucket({ vehicleTier: "tempo_traveller", vehicleModel: { displayName: "Force Traveller 17-Seater", groupCode: "tempo_traveller" } }),
      "tempo-traveller",
    );
  });

  it("reads snake_case display_name / group_code (legacy QuoteResponse shape)", () => {
    assert.equal(
      resolveFleetBucket({ vehicleTier: "suv", vehicle: { display_name: "Maruti Suzuki Ertiga", group_code: "suv" } }),
      "ertiga",
    );
    assert.equal(
      resolveFleetBucket({ vehicle_model: { display_name: "Toyota Innova Crysta", group_code: "suv" } }),
      "innova-crysta",
    );
  });

  it("falls back to group code when display name is generic/absent", () => {
    assert.equal(
      resolveFleetBucket({ vehicleModel: { displayName: "Standard Chauffeur Vehicle", groupCode: "sedan" } }),
      "sedan",
    );
    assert.equal(resolveFleetBucket({ vehicleModel: { groupCode: "tempo_traveller" } }), "tempo-traveller");
  });

  it("maps luxury display names to Other", () => {
    assert.equal(resolveFleetBucket({ vehicleModel: { displayName: "Toyota Camry Executive Hybrid" } }), "other");
    assert.equal(resolveFleetBucket({ vehicleModel: { displayName: "Toyota Vellfire Ultra Luxury MPV" } }), "other");
  });
});

describe("resolveFleetBucket — missing / unknown is NEVER Sedan", () => {
  it("returns unknown for missing, null, empty or whitespace tier", () => {
    assert.equal(resolveFleetBucket({}), "unknown");
    assert.equal(resolveFleetBucket({ vehicleTier: undefined }), "unknown");
    assert.equal(resolveFleetBucket({ vehicleTier: null }), "unknown");
    assert.equal(resolveFleetBucket({ vehicleTier: "" }), "unknown");
    assert.equal(resolveFleetBucket({ vehicleTier: "   " }), "unknown");
  });

  it("honours the backend 'unknown' sentinel", () => {
    assert.equal(resolveFleetBucket({ vehicleTier: "unknown" }), "unknown");
    assert.equal(resolveFleetBucket({ vehicleTier: "UNKNOWN" }), "unknown");
  });

  it("classifies a non-empty but unclassifiable tier as Other, not Sedan", () => {
    assert.equal(resolveFleetBucket({ vehicleTier: "premium" }), "other");
    assert.equal(resolveFleetBucket({ vehicleTier: "standard-vehicle" }), "other");
  });

  it("does not treat a generic model id as Sedan", () => {
    assert.equal(resolveFleetBucket({ vehicleModel: { id: "standard-vehicle" } }), "other");
  });
});

describe("countFleetTrips", () => {
  it("tallies normalized bookings into every bucket", () => {
    const counts = countFleetTrips([
      { vehicleTier: "sedan" },
      { vehicleTier: "sedan" },
      { vehicleTier: "ertiga" },
      { vehicleTier: "innova-crysta" },
      { vehicleTier: "tempo-traveller" },
      { vehicleTier: "tempo-traveller" },
      { vehicleTier: "urbania" },
      { vehicleTier: "other" },
      { vehicleTier: "unknown" },
    ]);
    assert.deepEqual(counts, {
      sedan: 2,
      ertiga: 1,
      "innova-crysta": 1,
      "tempo-traveller": 2,
      urbania: 1,
      other: 1,
      unknown: 1,
    });
  });

  it("defensively counts an unexpected tier value as Other rather than dropping it", () => {
    const counts = countFleetTrips([{ vehicleTier: "sedan" }, { vehicleTier: "mystery" as any }]);
    assert.equal(counts.sedan, 1);
    assert.equal(counts.other, 1);
  });

  it("reproduces the reported bug fix: non-sedan bookings no longer inflate Sedan", () => {
    // Representative mix mirroring the ops/admin API after the backend fix.
    const raw = [
      { vehicleTier: "sedan" },
      { vehicleTier: "ertiga" },
      { vehicleTier: "innova-crysta" },
      { vehicleTier: "traveller-12" },
      { vehicleTier: "traveller-17" },
      { vehicleTier: "urbania-13" },
      { vehicleTier: "suv", vehicleModel: { displayName: "Maruti Ertiga" } },
      { vehicleTier: undefined },
    ];
    const counts = countFleetTrips(raw.map((r) => ({ vehicleTier: resolveFleetBucket(r) })));
    assert.equal(counts.sedan, 1);
    assert.equal(counts.ertiga, 2);
    assert.equal(counts["innova-crysta"], 1);
    assert.equal(counts["tempo-traveller"], 2);
    assert.equal(counts.urbania, 1);
    assert.equal(counts.unknown, 1);
    assert.equal(counts.other, 0);
  });
});
