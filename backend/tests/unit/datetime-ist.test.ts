import { describe, expect, it } from "vitest";
import { IsoDatetimeSchema, normalizeToIstIso } from "../../src/shared/datetime.js";

describe("IST datetime normalization", () => {
  it("treats zone-less local datetime input as IST", () => {
    expect(normalizeToIstIso("2026-10-25T10:00:00")).toBe("2026-10-25T04:30:00.000Z");
    expect(IsoDatetimeSchema.parse("2026-10-25T10:00")).toBe("2026-10-25T04:30:00.000Z");
  });

  it("preserves explicitly zoned instants", () => {
    expect(normalizeToIstIso("2026-10-25T10:00:00+05:30")).toBe("2026-10-25T04:30:00.000Z");
    expect(normalizeToIstIso("2026-10-25T04:30:00Z")).toBe("2026-10-25T04:30:00.000Z");
  });

  it("interprets date-only input as midnight IST and rejects invalid dates", () => {
    expect(normalizeToIstIso("2026-10-25")).toBe("2026-10-24T18:30:00.000Z");
    expect(IsoDatetimeSchema.safeParse("not-a-date").success).toBe(false);
  });
});
