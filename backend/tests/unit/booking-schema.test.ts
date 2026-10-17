import { describe, expect, it } from "vitest";
import { CreateDraftBookingSchema } from "../../src/modules/bookings/booking.schema.js";

function request(overrides: Record<string, unknown> = {}) {
  const pickupDatetime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  return {
    tripType: "one-way",
    originName: "Agra",
    destinationName: "Delhi Airport",
    pickupAddress: "Agra Cantt Station",
    pickupDatetime,
    customerName: "Ramesh Kumar",
    customerPhone: "9876543210",
    ...overrides,
  };
}

describe("CreateDraftBookingSchema return datetime constraints", () => {
  it("rejects a round-trip request without returnDatetime before database insertion", () => {
    const result = CreateDraftBookingSchema.safeParse(request({ tripType: "round-trip" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ["returnDatetime"],
        message: "Return datetime is required for round-trip bookings.",
      }));
    }
  });

  it("accepts a round-trip request with a return datetime after pickup", () => {
    const pickupDatetime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const returnDatetime = new Date(pickupDatetime.getTime() + 8 * 60 * 60 * 1000).toISOString();
    const result = CreateDraftBookingSchema.safeParse(request({ tripType: "round-trip", pickupDatetime: pickupDatetime.toISOString(), returnDatetime }));
    expect(result.success).toBe(true);
  });

  it("rejects a return datetime equal to pickup, matching the database’s strict check", () => {
    const pickupDatetime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = CreateDraftBookingSchema.safeParse(request({ tripType: "round-trip", pickupDatetime, returnDatetime: pickupDatetime }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ["returnDatetime"],
        message: "Return datetime must be after pickup",
      }));
    }
  });

  it("requires returnDatetime for a round-trip canonical outstation selection too", () => {
    const result = CreateDraftBookingSchema.safeParse(request({
      tripType: undefined,
      bookingSelection: {
        kind: "outstation",
        id: "agra-delhi",
        tripType: "round-trip",
        originName: "Agra",
        destinationName: "Delhi Airport",
      },
    }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ["returnDatetime"],
        message: "Return datetime is required for round-trip bookings.",
      }));
    }
  });
});
