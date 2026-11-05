import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapAdminBooking } from "./bookingMapper.ts";

/**
 * Regression coverage for issue #129 — the ops/admin bookings response→Booking
 * adapter. Payloads mirror the real serializer output:
 *  - legacy fare-snapshot path: `vehicleTier` is a canonical model/group key
 *  - clean quote path: `vehicleTier` is a GROUP code plus additive `vehicleModel`
 *  - rows with no vehicle evidence: `vehicleTier` is the "unknown" sentinel
 */
const baseItem = {
  id: "bkg-1",
  ticketId: "SKB-20261105-0001",
  status: "confirmed",
  tripType: "one-way",
  originName: "Agra",
  destinationName: "Delhi",
  pickupDatetime: "2026-11-10T10:00:00Z",
  customerName: "Aman Sharma",
  customerPhone: "+91 98**** **21",
  distanceKm: 230,
  baseFare: 4000,
  nightAllowance: 0,
  driverAllowance: 300,
  discountAmount: 0,
  advanceAmount: 1200,
  totalFare: 4300,
  version: 2,
  createdAt: "2026-11-05T04:00:00.000Z",
};

describe("mapAdminBooking — vehicle tier resolution", () => {
  it("keeps a canonical sedan tier as Sedan", () => {
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: "sedan" }).vehicleTier, "sedan");
  });

  it("maps legacy canonical model keys to their own buckets", () => {
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: "ertiga" }).vehicleTier, "ertiga");
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: "innova-crysta" }).vehicleTier, "innova-crysta");
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: "traveller-12" }).vehicleTier, "tempo-traveller");
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: "traveller-17" }).vehicleTier, "tempo-traveller");
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: "urbania-13" }).vehicleTier, "urbania");
  });

  it("splits the clean-quote SUV group using the additive vehicleModel", () => {
    const ertiga = mapAdminBooking({
      ...baseItem,
      vehicleTier: "suv",
      vehicleModel: { id: "uuid-ertiga", displayName: "Maruti Ertiga Hybrid", groupCode: "suv" },
    });
    const innova = mapAdminBooking({
      ...baseItem,
      vehicleTier: "suv",
      vehicleModel: { id: "uuid-innova", displayName: "Toyota Innova Crysta VIP", groupCode: "suv" },
    });
    assert.equal(ertiga.vehicleTier, "ertiga");
    assert.equal(innova.vehicleTier, "innova-crysta");
  });

  it("routes Urbania out of the tempo_traveller group via model identity", () => {
    const urbania = mapAdminBooking({
      ...baseItem,
      vehicleTier: "tempo_traveller",
      vehicleModel: { displayName: "Force Urbania 13-Seater VIP", groupCode: "tempo_traveller" },
    });
    assert.equal(urbania.vehicleTier, "urbania");
  });

  it("never silently classifies missing vehicle data as Sedan", () => {
    assert.equal(mapAdminBooking({ ...baseItem }).vehicleTier, "unknown");
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: null }).vehicleTier, "unknown");
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: "" }).vehicleTier, "unknown");
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: "unknown" }).vehicleTier, "unknown");
  });

  it("counts a bare SUV group with no model identity as Other", () => {
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: "suv" }).vehicleTier, "other");
    assert.equal(mapAdminBooking({ ...baseItem, vehicleTier: "luxury" }).vehicleTier, "other");
  });

  it("supports legacy vehicle / vehicle_model response shapes", () => {
    assert.equal(
      mapAdminBooking({ ...baseItem, vehicleTier: "suv", vehicle: { display_name: "Maruti Ertiga", group_code: "suv" } }).vehicleTier,
      "ertiga",
    );
    assert.equal(
      mapAdminBooking({ ...baseItem, vehicle_model: { display_name: "Force Traveller 12-Seater", group_code: "tempo_traveller" } }).vehicleTier,
      "tempo-traveller",
    );
  });
});

describe("mapAdminBooking — preserves the rest of the adapter contract", () => {
  it("maps identity, route, fare math and status unchanged", () => {
    const mapped = mapAdminBooking({ ...baseItem, vehicleTier: "ertiga", specialNotes: "Early pickup" });
    assert.equal(mapped.id, "bkg-1");
    assert.equal(mapped.ticketId, "SKB-20261105-0001");
    assert.equal(mapped.origin, "Agra");
    assert.equal(mapped.destination, "Delhi");
    assert.equal(mapped.status, "confirmed");
    assert.equal(mapped.version, 2);
    assert.equal(mapped.notes, "Early pickup");
    assert.equal(mapped.fare.totalFare, 4300);
    assert.equal(mapped.fare.advancePaid, 1200);
    assert.equal(mapped.fare.balancePayable, 3100);
    assert.equal(mapped.fare.promoDiscount, 0);
  });

  it("falls back ticketId to id and customerName to 'Customer'", () => {
    const mapped = mapAdminBooking({ id: "bkg-2", vehicleTier: "sedan" });
    assert.equal(mapped.ticketId, "bkg-2");
    assert.equal(mapped.customerName, "Customer");
    assert.equal(mapped.status, "pending_payment");
  });
});
