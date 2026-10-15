import { describe, it, expect, beforeEach } from "vitest";
import { createTestApp } from "../helpers.js";
import { createMemoryRepositories } from "../../src/db/memory.js";
import type { BookingRecord } from "../../src/types/domain.js";
import type { Repositories } from "../../src/db/types.js";

describe("Admin Booking Unmask PII & Audit Invariant Suite", () => {
  let db: Repositories;
  let testBooking: BookingRecord;

  beforeEach(async () => {
    db = createMemoryRepositories(new Date().toISOString());
    testBooking = {
      id: "bkg-unmask-001",
      ticketId: "AGR-20261015-001",
      userId: null,
      guestAccessToken: "guest-token-123",
      status: "paid_confirmed",
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Delhi Airport",
      bookingSelection: null,
      flightTrainNumber: null,
      packageId: null,
      pickupAddress: "Fatehabad Road, Agra",
      dropAddress: "IGI Airport T3, New Delhi",
      pickupDatetime: "2026-10-25T10:00:00.000Z",
      returnDatetime: null,
      distanceKm: 230,
      customerName: "Aman Sharma",
      customerPhone: "9876543221",
      customerEmail: "aman@example.com",
      fareSnapshot: {
        baseFare: 3500,
        nightAllowance: 0,
        driverAllowance: 0,
        discountAmount: 0,
        totalFare: 3500,
        advanceAmount: 3500,
        balanceAmount: 0,
        currency: "INR",
        fareVersion: "v1",
        label: "Sedan standard",
        duration: "4h",
        distanceKm: 230,
        billedKm: 230,
        alwaysRoundTrip: false,
        tripType: "one-way",
        vehicleTier: "sedan",
        promoCode: null,
        promoValid: false,
        roundMultiplierApplied: false,
        rules: [],
      },
      baseFare: 3500,
      nightAllowance: 0,
      driverAllowance: 0,
      discountAmount: 0,
      promoCode: null,
      totalFare: 3500,
      advanceAmount: 3500,
      balanceAmount: 0,
      fareRulesVersion: "v1",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      specialNotes: "Flight departs at 16:00",
      selectedCatalogItemId: null,
    };
    await db.bookings.create(testBooking);
  });

  it("1. Public / default admin list remains strictly masked and emits NO audit log", async () => {
    const { app } = await createTestApp(db);
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/bookings",
      headers: { authorization: "Bearer test-dispatcher" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    const item = body.data.items.find((b: any) => b.id === testBooking.id);
    expect(item).toBeDefined();
    expect(item.customerPhone).not.toBe("9876543221");
    expect(item.customerPhone).toContain("****");
    expect(item.customerEmail).toContain("****");

    const auditLogs = await db.audit.list(100);
    const unmaskLogs = auditLogs.filter((log) => log.action === "BOOKING_UNMASK_VIEWED");
    expect(unmaskLogs.length).toBe(0);
  });

  it("2. Authorized dispatcher can unmask PII; persists BOOKING_UNMASK_VIEWED audit log", async () => {
    const { app } = await createTestApp(db);
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${testBooking.id}/unmask`,
      headers: { authorization: "Bearer test-dispatcher" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.customerPhone).toBe("9876543221");
    expect(body.data.customerEmail).toBe("aman@example.com");
    expect(body.data.customerName).toBe("Aman Sharma");

    // Verify audit log
    const auditLogs = await db.audit.list(100);
    const unmaskLogs = auditLogs.filter((log) => log.action === "BOOKING_UNMASK_VIEWED");
    expect(unmaskLogs.length).toBe(1);
    const entry = unmaskLogs[0]!;
    expect(entry.resourceType).toBe("booking");
    expect(entry.resourceId).toBe(testBooking.id);
    expect(entry.actorRole).toBe("dispatcher");
    expect(entry.after).toEqual({ unmasked: true, ticketId: testBooking.ticketId });
  });

  it("3. Authorized super_admin can unmask PII via GET and POST", async () => {
    const { app } = await createTestApp(db);

    const postRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${testBooking.id}/unmask`,
      headers: { authorization: "Bearer test-super_admin" },
    });
    expect(postRes.statusCode).toBe(200);
    expect(postRes.json().data.customerPhone).toBe("9876543221");

    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/ops/admin/bookings/${testBooking.id}/unmask`,
      headers: { authorization: "Bearer test-super_admin" },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().data.customerPhone).toBe("9876543221");

    const auditLogs = await db.audit.list(100);
    const unmaskLogs = auditLogs.filter((log) => log.action === "BOOKING_UNMASK_VIEWED");
    expect(unmaskLogs.length).toBe(2);
    expect(unmaskLogs[0]!.actorRole).toBe("super_admin");
  });

  it("4. Unauthorized roles (content_editor, finance_operator, customer) receive 403 and NO audit log is recorded", async () => {
    const { app } = await createTestApp(db);

    for (const role of ["content_editor", "finance_operator", "customer"] as const) {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ops/admin/bookings/${testBooking.id}/unmask`,
        headers: { authorization: `Bearer test-${role}` },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error?.code).toBe("FORBIDDEN");
    }

    const auditLogs = await db.audit.list(100);
    expect(auditLogs.filter((log) => log.action === "BOOKING_UNMASK_VIEWED").length).toBe(0);
  });

  it("5. Unauthenticated request without token receives 401 Unauthorized", async () => {
    const { app } = await createTestApp(db);
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${testBooking.id}/unmask`,
    });

    expect(res.statusCode).toBe(401);
    const auditLogs = await db.audit.list(100);
    expect(auditLogs.filter((log) => log.action === "BOOKING_UNMASK_VIEWED").length).toBe(0);
  });

  it("6. Non-existent booking returns 404 and does not record audit log", async () => {
    const { app } = await createTestApp(db);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/bookings/bkg-non-existent/unmask",
      headers: { authorization: "Bearer test-dispatcher" },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error?.code).toBe("BOOKING_NOT_FOUND");
    const auditLogs = await db.audit.list(100);
    expect(auditLogs.filter((log) => log.action === "BOOKING_UNMASK_VIEWED").length).toBe(0);
  });

  it("7. Fail-closed: if audit persistence fails, request fails (500) and NO PII is returned", async () => {
    // Stub audit.append to throw an error simulating database or disk failure
    db.audit.append = async () => {
      throw new Error("Audit log database table write failed");
    };

    const { app } = await createTestApp(db);
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${testBooking.id}/unmask`,
      headers: { authorization: "Bearer test-dispatcher" },
    });

    expect(res.statusCode).toBe(500);
    const body = res.json();
    expect(body.success).toBe(false);
    // Crucial check: verify that customerPhone and customerEmail are NOT in the response
    expect(JSON.stringify(body)).not.toContain("9876543221");
    expect(JSON.stringify(body)).not.toContain("aman@example.com");
  });
});
