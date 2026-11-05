import { describe, expect, it, vi } from "vitest";
import { mapBooking } from "../../src/db/postgres.js";
import { createAdminService } from "../../src/modules/admin/admin.service.js";
import type { BookingRecord } from "../../src/types/domain.js";

/**
 * Regression coverage for issue #129 — vehicle identity in the ops/admin
 * bookings serializer. `mapBooking` must derive the tier from the stored fare
 * snapshot (legacy `vehicleTier` key or clean quote `vehicle.group_code`) and
 * expose model identity, never silently defaulting missing data to "sedan".
 */
const baseRow: Record<string, unknown> = {
  id: "99000000-0000-0000-0000-000000000001",
  ticket_id: "SKB-20261105-0001",
  guest_access_token: "tok",
  customer_name: "Aman Sharma",
  customer_phone: "+919876543210",
  total_amount: 4300,
  advance_amount: 1200,
  balance_amount: 3100,
  pickup_at: "2026-11-10T10:00:00Z",
  created_at: "2026-11-05T04:00:00Z",
  status: "confirmed",
  trip_type: "one-way",
};

describe("mapBooking — vehicle tier evidence chain", () => {
  it("reads the legacy fare snapshot's canonical vehicleTier (was silently 'sedan')", () => {
    for (const tier of ["ertiga", "innova-crysta", "traveller-12", "traveller-17", "urbania-13", "tempo_traveller"]) {
      const record = mapBooking({ ...baseRow, fare_breakdown: { vehicleTier: tier } });
      expect(record.vehicleTier).toBe(tier);
      expect(record.vehicleModel).toBeNull();
    }
  });

  it("reads the clean quote snapshot's group code and exposes model identity", () => {
    const record = mapBooking({
      ...baseRow,
      fare_breakdown: {
        vehicle: {
          vehicle_model_id: "10000000-0000-0000-0002-000000000003",
          display_name: "Toyota Innova Crysta VIP",
          group_code: "suv",
        },
      },
    });
    expect(record.vehicleTier).toBe("suv");
    expect(record.vehicleModel).toEqual({
      id: "10000000-0000-0000-0002-000000000003",
      displayName: "Toyota Innova Crysta VIP",
      groupCode: "suv",
    });
  });

  it("prefers the snapshot model key over the group code when both exist", () => {
    const record = mapBooking({
      ...baseRow,
      fare_breakdown: { vehicleTier: "traveller-17", vehicle: { group_code: "tempo_traveller", display_name: "Force Traveller 17-Seater" } },
    });
    expect(record.vehicleTier).toBe("traveller-17");
    expect(record.vehicleModel?.groupCode).toBe("tempo_traveller");
  });

  it("lets a dedicated vehicle_tier column win over the snapshot", () => {
    const record = mapBooking({ ...baseRow, vehicle_tier: "urbania-13", fare_breakdown: { vehicleTier: "sedan" } });
    expect(record.vehicleTier).toBe("urbania-13");
  });

  it("parses a JSON-string fare_breakdown", () => {
    const record = mapBooking({ ...baseRow, fare_breakdown: JSON.stringify({ vehicleTier: "ertiga" }) });
    expect(record.vehicleTier).toBe("ertiga");
  });

  it("returns 'unknown' (never 'sedan') when there is no vehicle evidence", () => {
    const record = mapBooking({ ...baseRow, fare_breakdown: {} });
    expect(record.vehicleTier).toBe("unknown");
    expect(record.vehicleModel).toBeNull();
  });

  it("ignores a blank snapshot vehicleTier", () => {
    const record = mapBooking({ ...baseRow, fare_breakdown: { vehicleTier: "   ", vehicle: { group_code: "tempo_traveller" } } });
    expect(record.vehicleTier).toBe("tempo_traveller");
  });
});

describe("admin.service.listBookings — vehicle identity passthrough", () => {
  function booking(overrides: Partial<BookingRecord>): BookingRecord {
    return {
      id: "bkg-1",
      ticketId: "SKB-20261105-0001",
      userId: null,
      guestAccessToken: "tok",
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Delhi",
      bookingSelection: { kind: "outstation", id: "agra-delhi", tripType: "one-way", originName: "Agra", destinationName: "Delhi" },
      selectedCatalogItemId: null,
      pickupAddress: "Taj Ganj",
      dropAddress: null,
      pickupDatetime: "2026-11-10T10:00:00Z",
      returnDatetime: null,
      flightTrainNumber: null,
      distanceKm: 230,
      customerName: "Aman Sharma",
      customerPhone: "+919876543210",
      customerEmail: null,
      baseFare: 4000,
      nightAllowance: 0,
      driverAllowance: 300,
      discountAmount: 0,
      promoCode: null,
      totalFare: 4300,
      advanceAmount: 1200,
      balanceAmount: 3100,
      fareRulesVersion: "2.0",
      fareSnapshot: { label: "Agra → Delhi" } as any,
      status: "confirmed",
      version: 1,
      specialNotes: null,
      packageId: null,
      createdAt: "2026-11-05T04:00:00Z",
      updatedAt: "2026-11-05T04:00:00Z",
      ...overrides,
    };
  }

  it("includes vehicleModel and the derived vehicleTier on each item", async () => {
    const records = [
      booking({ id: "b1", vehicleTier: "suv", vehicleModel: { id: "uuid-e", displayName: "Maruti Ertiga", groupCode: "suv" } }),
      booking({ id: "b2", vehicleTier: "urbania-13", vehicleModel: null }),
      booking({ id: "b3", vehicleTier: "unknown" }),
    ];
    const db = { bookings: { list: vi.fn().mockResolvedValue({ items: records, total: records.length }) } } as any;
    const service = createAdminService({ db });
    const result = await service.listBookings({});

    expect(result.items).toHaveLength(3);
    const [first, second, third] = result.items;
    expect(first?.vehicleTier).toBe("suv");
    expect(first?.vehicleModel).toEqual({ id: "uuid-e", displayName: "Maruti Ertiga", groupCode: "suv" });
    expect(second?.vehicleTier).toBe("urbania-13");
    expect(second?.vehicleModel).toBeNull();
    expect(third?.vehicleTier).toBe("unknown");
    expect(third?.vehicleModel).toBeNull();
    // Legacy envelope alias is preserved.
    expect(result.bookings).toEqual(result.items);
  });
});
