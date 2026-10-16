import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";
import type { FareRuleRecord, InquiryListFilter, PaymentListFilter, Repositories } from "../../db/types.js";
import { maskEmail, maskPhone } from "../../shared/privacy.js";
import type { BookingRecord, InquiryStatus, UserRole } from "../../types/domain.js";
import { projectBooking } from "../bookings/booking.service.js";
import {
  AIRPORT_TRANSFERS,
  FARE_RULES_VERSION_DEFAULT,
  LOCAL_PACKAGES,
  OUTSTATION_RULES,
  PACKAGE_UPGRADES,
  PACKAGES,
  ROUTES,
  VEHICLES,
} from "../fares/fare.catalogue.js";
import { toCanonicalTierKey } from "../../contracts/vehicle-tiers.js";

function toUuid(id?: string | null): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return "00000000-0000-0000-0000-000000000001";
}

export function createAdminService(deps: { db: Repositories; clock?: Clock }) {
  return {
    async listBookings(filter: {
      status?: BookingRecord["status"];
      ticketId?: string;
      page?: number;
      pageSize?: number;
    }) {
      const result = await deps.db.bookings.list(filter);
      const items = result.items.map((booking) => {
        const selectionProjection = projectBooking(booking, { unmask: false });
        return {
        id: booking.id,
        ticketId: booking.ticketId,
        status: booking.status,
        tripType: booking.tripType,
        vehicleTier: booking.vehicleTier,
        originName: selectionProjection.originName,
        destinationName: selectionProjection.destinationName,
        bookingSelection: selectionProjection.bookingSelection,
        selectedCatalogItemId: selectionProjection.selectedCatalogItemId,
        pickupDatetime: booking.pickupDatetime,
        customerName: booking.customerName,
        customerPhone: maskPhone(booking.customerPhone),
        customerEmail: booking.customerEmail ? maskEmail(booking.customerEmail) : null,
        distanceKm: booking.distanceKm,
        returnDatetime: booking.returnDatetime,
        baseFare: booking.baseFare,
        nightAllowance: booking.nightAllowance,
        driverAllowance: booking.driverAllowance,
        discountAmount: booking.discountAmount,
        specialNotes: booking.specialNotes,
        createdAt: booking.createdAt,
        advanceAmount: booking.advanceAmount,
        totalFare: booking.totalFare,
        version: booking.version,
        };
      });
      return {
        total: result.total,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
        items,
        bookings: items,
      };
    },

    async unmaskBooking(
      bookingId: string,
      actor: { id: string; role: UserRole },
      requestId?: string,
    ) {
      const booking = await deps.db.bookings.getById(bookingId);
      if (!booking) {
        throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found.");
      }

      if (!deps.db.audit?.append) {
        throw Errors.internal("Audit system unavailable; unmasking aborted.");
      }

      // Persist BOOKING_UNMASK_VIEWED audit log BEFORE returning PII.
      // If append throws, this function fails closed (no PII returned).
      const now = deps.clock ? deps.clock.now() : new Date();
      await deps.db.audit.append({
        id: newId(),
        actorId: toUuid(actor.id),
        actorRole: actor.role,
        resourceType: "booking",
        resourceId: booking.id,
        action: "BOOKING_UNMASK_VIEWED",
        before: null,
        after: {
          unmasked: true,
          ticketId: booking.ticketId,
        },
        reason: "Administrative unmask view",
        requestId: requestId || newId(),
        createdAt: toIso(now),
      });

      return {
        id: booking.id,
        ticketId: booking.ticketId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
      };
    },

    async listAuditLogs(limit = 100) {
      return deps.db.audit.list(limit);
    },

    async listInquiries(filter: InquiryListFilter) {
      const result = await deps.db.inquiries.list(filter);
      return {
        total: result.total,
        page: filter.page ?? 1,
        limit: filter.limit ?? 50,
        items: result.items,
        inquiries: result.items,
      };
    },

    async updateInquiry(id: string, updates: { status?: InquiryStatus; note?: string }) {
      const inquiry = await deps.db.inquiries.getById(id);
      if (!inquiry) {
        throw Errors.notFound("INQUIRY_NOT_FOUND", "Inquiry not found.");
      }
      if (updates.status) {
        inquiry.status = updates.status;
      }
      if (updates.note) {
        inquiry.notes = [...(inquiry.notes ?? []), updates.note];
      }
      inquiry.updatedAt = toIso(deps.clock ? deps.clock.now() : new Date());
      return deps.db.inquiries.update(inquiry);
    },

    async listPayments(filter: PaymentListFilter) {
      const result = await deps.db.payments.list(filter);
      const ticketMap = new Map<string, string>();
      const uniqueBookingIds = [...new Set(result.items.map((p) => p.bookingId).filter(Boolean))];
      // Lookup in bounded chunks of 5 with deduplication to prevent connection pool exhaustion
      for (let i = 0; i < uniqueBookingIds.length; i += 5) {
        const chunk = uniqueBookingIds.slice(i, i + 5);
        await Promise.all(
          chunk.map(async (bookingId) => {
            try {
              const booking = await deps.db.bookings.getById(bookingId);
              if (booking?.ticketId) ticketMap.set(bookingId, booking.ticketId);
            } catch {
              // Graceful fallback to payment.bookingId
            }
          })
        );
      }
      const items = result.items.map((payment) => ({
        ...payment,
        bookingTicketId: ticketMap.get(payment.bookingId) ?? payment.bookingId,
        method: payment.paymentMethod,
        capturedAt: payment.verifiedAt,
      }));
      return {
        total: result.total,
        totalCapturedPaise: result.totalCapturedPaise,
        totalRefundedPaise: result.totalRefundedPaise,
        page: filter.page ?? 1,
        limit: filter.limit ?? 50,
        items,
        payments: items,
      };
    },

    async getFareRules() {
      const dbRule = await deps.db.fareRules.getActive();
      const cfg = (dbRule?.config as any) || {};

      const mergedVehicles = Array.isArray(cfg.vehicles)
        ? VEHICLES.map((v) => {
            const override = cfg.vehicles.find((ov: any) => {
              const k = toCanonicalTierKey(String(ov.tier ?? ov.id ?? ""));
              return k !== undefined && k === v.tier;
            });
            return override ? { ...v, ...override } : v;
          })
        : VEHICLES;

      const mergedOutstation = cfg.outstation
        ? { ...OUTSTATION_RULES, ...cfg.outstation }
        : OUTSTATION_RULES;

      const mergedLocalPackages = cfg.localPackages
        ? { ...LOCAL_PACKAGES, ...cfg.localPackages }
        : LOCAL_PACKAGES;

      return {
        version: dbRule?.version || FARE_RULES_VERSION_DEFAULT,
        outstation: mergedOutstation,
        vehicles: mergedVehicles,
        packageUpgrades: PACKAGE_UPGRADES,
        localPackages: mergedLocalPackages,
        airportTransfers: AIRPORT_TRANSFERS,
        routes: ROUTES,
        packages: PACKAGES,
        dynamicConfig: dbRule?.config ?? null,
      };
    },

    async updateFareRules(actor: any, updates: any, _ip?: string) {
      const now = new Date().toISOString();
      // fare_rules.version is VARCHAR(20) and both fare/audit IDs are UUIDs
      // in PostgreSQL. Keep generated values within those database contracts;
      // the memory repository does not enforce either constraint.
      const versionStr = updates.version || `r${Date.now().toString(36)}`;
      const isActive = updates.isActive !== undefined ? Boolean(updates.isActive) : true;
      const record: FareRuleRecord = {
        id: newId(),
        version: versionStr,
        config: updates,
        effectiveFrom: updates.effectiveFrom || now,
        isActive,
        createdAt: now,
      };

      await deps.db.fareRules.save(record);
      await triggerFrontendRebuild("fare-rules-updated");

      if (deps.db.audit) {
        await deps.db.audit.append({
          id: newId(),
          action: "update_fare_rules",
          actorId: toUuid(actor?.id),
          actorRole: (actor?.role as any) || "super_admin",
          resourceType: "fare_rules",
          resourceId: versionStr,
          before: null,
          after: updates,
          reason: `Fare rules updated by ${actor?.email || actor?.id || "admin"}`,
          requestId: `req_${Date.now().toString(36)}`,
          createdAt: now,
        });
      }

      return this.getFareRules();
    },

    async activateFareRules(actor: any, version: string) {
      const target = await deps.db.fareRules.getByVersion(version);
      if (!target) {
        throw Errors.notFound("FARE_RULE_VERSION_NOT_FOUND", `Fare rule version "${version}" not found.`);
      }
      await deps.db.fareRules.activate(version);

      if (deps.db.audit) {
        await deps.db.audit.append({
          id: newId(),
          action: "activate_fare_rules",
          actorId: toUuid(actor?.id),
          actorRole: (actor?.role as any) || "super_admin",
          resourceType: "fare_rules",
          resourceId: version,
          before: null,
          after: { version, isActive: true },
          reason: `Fare rule version ${version} activated by ${actor?.email || actor?.id || "admin"}`,
          requestId: `req_${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
        });
      }

      return this.getFareRules();
    },

    async listFareRuleVersions() {
      return deps.db.fareRules.listAll();
    },
  };
}
