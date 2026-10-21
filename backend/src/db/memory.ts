import {
  SEED_AUDIT_LOGS,
  SEED_BOOKINGS,
  SEED_CATALOG_ITEMS,
  SEED_CATALOG_MEDIA,
  SEED_DEVICES,
  SEED_FARE_RULES,
  SEED_INQUIRIES,
  SEED_LOCATION_CACHE,
  SEED_NOTIFICATION_JOBS,
  SEED_PAYMENTS,
  SEED_PROFILES,
  SEED_PROMO_CODES,
  SEED_REFUNDS,
  SEED_REVIEWS,
  SEED_WEBHOOKS,
} from "./seedData.js";
import {
  SEED_CANCELLATION_POLICIES,
  SEED_COMPANY_PROFILE,
  SEED_DOSSIER_SIGNOFFS,
  SEED_LOCAL_PACKAGES,
  SEED_MONUMENTS,
  SEED_PACKAGE_UPGRADES,
  SEED_PET_POLICY,
  SEED_TOUR_PACKAGES,
  SEED_TRANSFER_ROUTES,
} from "./dossier-seeds.js";
import type {
  CancellationPolicyRecord,
  CompanyProfileRecord,
  DossierSignoffRecord,
  LocalSightseeingPackageRecord,
  MonumentRecord,
  PackageVehicleUpgradeRecord,
  PetTaxiPolicyRecord,
  TourPackageRecord,
  TransferRouteRecord,
} from "./dossier-types.js";
import type {
  AuditLogRecord,
  BookingIntentRecord,
  BookingRecord,
  CatalogItemRecord,
  CatalogMediaRecord,
  InquiryRecord,
  RentalEnquiryRecord,
  LocationSuggestion,
  NotificationJobRecord,
  PaymentRecord,
  PaymentStatus,
  ProfileRecord,
  PromoCodeRecord,
  RefundRecord,
  ReviewRecord,
  WebhookEventRecord,
} from "../types/domain.js";
import type { RouteCatalogRecord } from "./route-catalog-types.js";
import { randomUUID } from "node:crypto";
import type {
  BookingListFilter,
  CatalogListFilter,
  DeviceRegistrationRecord,
  FareRuleRecord,
  PublishEventInput,
  PublishEventRecord,
  Repositories,
  ReviewListFilter,
  RentalEnquiryListFilter,
} from "./types.js";
import { ConcurrencyError } from "./concurrency.js";
import { AppError } from "../shared/errors.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createMemoryRepositories(nowIso = new Date().toISOString()): Repositories {
  const bookings = new Map<string, BookingRecord>();
  const bookingIntents = new Map<string, BookingIntentRecord>();
  const bookingIntentsByIdempotency = new Map<string, string>();
  const bookingsByTicket = new Map<string, string>();
  const payments = new Map<string, PaymentRecord>();
  const paymentsByIdempotency = new Map<string, string>();
  const paymentsByOrder = new Map<string, string>();
  const refunds = new Map<string, RefundRecord>();
  const refundsByIdempotency = new Map<string, string>();
  const profiles = new Map<string, ProfileRecord>();
  const catalog = new Map<string, CatalogItemRecord>();
  const routeCatalog = new Map<string, RouteCatalogRecord>();
  const catalogBySlug = new Map<string, string>();
  const media = new Map<string, CatalogMediaRecord>();
  const reviews = new Map<string, ReviewRecord>();
  const promos = new Map<string, PromoCodeRecord>();
  const audit: AuditLogRecord[] = [];
  const inquiries: InquiryRecord[] = [];
  const rentalEnquiries: RentalEnquiryRecord[] = [];
  const notifications = new Map<string, NotificationJobRecord>();
  const notificationsByDedupe = new Map<string, string>();
  const webhookEvents = new Map<string, WebhookEventRecord>();
  const locationCache = new Map<string, { suggestions: LocationSuggestion[]; storedAt: string }>();
  const devices = new Map<string, DeviceRegistrationRecord>();
  const fareRules = new Map<string, FareRuleRecord>();
  const publishEvents = new Map<string, PublishEventRecord>();
  const locks = new Map<string, Promise<void>>();

  const tourPackages = new Map<string, TourPackageRecord>();
  const tourPackagesByCode = new Map<string, string>();
  const packageUpgrades = new Map<string, PackageVehicleUpgradeRecord>();
  const transferRoutes = new Map<string, TransferRouteRecord>();
  const transferRoutesByCode = new Map<string, string>();
  const localPackages = new Map<string, LocalSightseeingPackageRecord>();
  const localPackagesByCode = new Map<string, string>();
  const cancellationPolicies: CancellationPolicyRecord[] = [];
  const monuments: MonumentRecord[] = [];
  let petPolicy: PetTaxiPolicyRecord = clone(SEED_PET_POLICY);
  let companyProfile: CompanyProfileRecord = clone(SEED_COMPANY_PROFILE);
  const dossierSignoffs: DossierSignoffRecord[] = [];

  seedReferenceData(nowIso);

  async function withLock<T>(fn: () => Promise<T>): Promise<T> {
    const previous = locks.get("tx") ?? Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    locks.set("tx", previous.then(() => current));
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  function seedReferenceData(_createdAt: string): void {
    for (const pr of SEED_PROFILES) {
      profiles.set(pr.id, clone(pr));
    }
    for (const fr of SEED_FARE_RULES) {
      fareRules.set(fr.id, clone(fr));
    }
    for (const pm of SEED_PROMO_CODES) {
      promos.set(pm.id, clone(pm));
    }
    for (const it of SEED_CATALOG_ITEMS) {
      catalog.set(it.id, clone(it));
      catalogBySlug.set(it.slug, it.id);
    }
    for (const m of SEED_CATALOG_MEDIA) {
      media.set(m.id, clone(m));
    }
    for (const b of SEED_BOOKINGS) {
      bookings.set(b.id, clone(b));
      bookingsByTicket.set(b.ticketId, b.id);
    }
    for (const p of SEED_PAYMENTS) {
      payments.set(p.id, clone(p));
      paymentsByIdempotency.set(p.idempotencyKey, p.id);
      paymentsByOrder.set(p.providerOrderId, p.id);
    }
    for (const r of SEED_REFUNDS) {
      refunds.set(r.id, clone(r));
      refundsByIdempotency.set(r.idempotencyKey, r.id);
    }
    for (const rv of SEED_REVIEWS) {
      reviews.set(rv.id, clone(rv));
    }
    for (const inq of SEED_INQUIRIES) {
      inquiries.push(clone(inq));
    }
    for (const aud of SEED_AUDIT_LOGS) {
      audit.push(clone(aud));
    }
    for (const n of SEED_NOTIFICATION_JOBS) {
      notifications.set(n.id, clone(n));
      notificationsByDedupe.set(n.dedupeKey, n.id);
    }
    for (const d of SEED_DEVICES) {
      devices.set(d.id, clone(d));
    }
    for (const w of SEED_WEBHOOKS) {
      webhookEvents.set(w.eventId, clone(w));
    }
    for (const lc of SEED_LOCATION_CACHE) {
      locationCache.set(lc.key, { suggestions: clone(lc.suggestions), storedAt: lc.storedAt });
    }
    for (const tp of SEED_TOUR_PACKAGES) {
      tourPackages.set(tp.id, clone(tp));
      tourPackagesByCode.set(tp.packageCode, tp.id);
    }
    for (const pu of SEED_PACKAGE_UPGRADES) {
      packageUpgrades.set(pu.id, clone(pu));
    }
    for (const tr of SEED_TRANSFER_ROUTES) {
      transferRoutes.set(tr.id, clone(tr));
      transferRoutesByCode.set(tr.routeCode, tr.id);
    }
    for (const lp of SEED_LOCAL_PACKAGES) {
      localPackages.set(lp.id, clone(lp));
      localPackagesByCode.set(lp.packageCode, lp.id);
    }
    cancellationPolicies.push(...SEED_CANCELLATION_POLICIES.map(clone));
    monuments.push(...SEED_MONUMENTS.map(clone));
    dossierSignoffs.push(...SEED_DOSSIER_SIGNOFFS.map(clone));
  }

  const repos: Repositories = {
    async healthCheck() {
      return true;
    },
    async transaction(fn) {
      return withLock(async () => {
        const snap = {
          bookings: new Map(bookings),
          bookingIntents: new Map(bookingIntents),
          bookingIntentsByIdempotency: new Map(bookingIntentsByIdempotency),
          bookingsByTicket: new Map(bookingsByTicket),
          payments: new Map(payments),
          paymentsByIdempotency: new Map(paymentsByIdempotency),
          paymentsByOrder: new Map(paymentsByOrder),
          refunds: new Map(refunds),
          refundsByIdempotency: new Map(refundsByIdempotency),
          profiles: new Map(profiles),
          catalog: new Map(catalog),
          routeCatalog: new Map(routeCatalog),
          catalogBySlug: new Map(catalogBySlug),
          media: new Map(media),
          reviews: new Map(reviews),
          promos: new Map(promos),
          audit: [...audit],
          inquiries: [...inquiries],
          rentalEnquiries: [...rentalEnquiries],
          notifications: new Map(notifications),
          notificationsByDedupe: new Map(notificationsByDedupe),
          webhookEvents: new Map(webhookEvents),
          locationCache: new Map(locationCache),
          devices: new Map(devices),
          fareRules: new Map(fareRules),
          publishEvents: new Map(publishEvents),
          tourPackages: new Map(tourPackages),
          tourPackagesByCode: new Map(tourPackagesByCode),
          packageUpgrades: new Map(packageUpgrades),
          transferRoutes: new Map(transferRoutes),
          transferRoutesByCode: new Map(transferRoutesByCode),
          localPackages: new Map(localPackages),
          localPackagesByCode: new Map(localPackagesByCode),
          cancellationPolicies: [...cancellationPolicies],
          monuments: [...monuments],
          petPolicy: clone(petPolicy),
          companyProfile: clone(companyProfile),
          dossierSignoffs: [...dossierSignoffs],
        };
        try {
          return await fn(repos);
        } catch (err) {
          bookings.clear(); for (const [k, v] of snap.bookings) bookings.set(k, v);
          bookingIntents.clear(); for (const [k, v] of snap.bookingIntents) bookingIntents.set(k, v);
          bookingIntentsByIdempotency.clear(); for (const [k, v] of snap.bookingIntentsByIdempotency) bookingIntentsByIdempotency.set(k, v);
          bookingsByTicket.clear(); for (const [k, v] of snap.bookingsByTicket) bookingsByTicket.set(k, v);
          payments.clear(); for (const [k, v] of snap.payments) payments.set(k, v);
          paymentsByIdempotency.clear(); for (const [k, v] of snap.paymentsByIdempotency) paymentsByIdempotency.set(k, v);
          paymentsByOrder.clear(); for (const [k, v] of snap.paymentsByOrder) paymentsByOrder.set(k, v);
          refunds.clear(); for (const [k, v] of snap.refunds) refunds.set(k, v);
          refundsByIdempotency.clear(); for (const [k, v] of snap.refundsByIdempotency) refundsByIdempotency.set(k, v);
          profiles.clear(); for (const [k, v] of snap.profiles) profiles.set(k, v);
          catalog.clear(); for (const [k, v] of snap.catalog) catalog.set(k, v);
          routeCatalog.clear(); for (const [k, v] of snap.routeCatalog) routeCatalog.set(k, v);
          catalogBySlug.clear(); for (const [k, v] of snap.catalogBySlug) catalogBySlug.set(k, v);
          media.clear(); for (const [k, v] of snap.media) media.set(k, v);
          reviews.clear(); for (const [k, v] of snap.reviews) reviews.set(k, v);
          promos.clear(); for (const [k, v] of snap.promos) promos.set(k, v);
          audit.length = 0; audit.push(...snap.audit);
          inquiries.length = 0; inquiries.push(...snap.inquiries);
          rentalEnquiries.length = 0; rentalEnquiries.push(...snap.rentalEnquiries);
          notifications.clear(); for (const [k, v] of snap.notifications) notifications.set(k, v);
          notificationsByDedupe.clear(); for (const [k, v] of snap.notificationsByDedupe) notificationsByDedupe.set(k, v);
          webhookEvents.clear(); for (const [k, v] of snap.webhookEvents) webhookEvents.set(k, v);
          locationCache.clear(); for (const [k, v] of snap.locationCache) locationCache.set(k, v);
          devices.clear(); for (const [k, v] of snap.devices) devices.set(k, v);
          fareRules.clear(); for (const [k, v] of snap.fareRules) fareRules.set(k, v);
          publishEvents.clear(); for (const [k, v] of snap.publishEvents) publishEvents.set(k, v);
          tourPackages.clear(); for (const [k, v] of snap.tourPackages) tourPackages.set(k, v);
          tourPackagesByCode.clear(); for (const [k, v] of snap.tourPackagesByCode) tourPackagesByCode.set(k, v);
          packageUpgrades.clear(); for (const [k, v] of snap.packageUpgrades) packageUpgrades.set(k, v);
          transferRoutes.clear(); for (const [k, v] of snap.transferRoutes) transferRoutes.set(k, v);
          transferRoutesByCode.clear(); for (const [k, v] of snap.transferRoutesByCode) transferRoutesByCode.set(k, v);
          localPackages.clear(); for (const [k, v] of snap.localPackages) localPackages.set(k, v);
          localPackagesByCode.clear(); for (const [k, v] of snap.localPackagesByCode) localPackagesByCode.set(k, v);
          cancellationPolicies.length = 0; cancellationPolicies.push(...snap.cancellationPolicies);
          monuments.length = 0; monuments.push(...snap.monuments);
          petPolicy = clone(snap.petPolicy);
          companyProfile = clone(snap.companyProfile);
          dossierSignoffs.length = 0; dossierSignoffs.push(...snap.dossierSignoffs);
          throw err;
        }
      });
    },
    bookings: {
      async create(record) {
        if (bookingsByTicket.has(record.ticketId)) {
          throw new Error("duplicate ticket");
        }
        bookings.set(record.id, clone(record));
        bookingsByTicket.set(record.ticketId, record.id);
        return clone(record);
      },
      async update(record) {
        const existing = bookings.get(record.id);
        if (!existing) {
          throw new Error("booking update failed: not found");
        }
        if (record.version !== existing.version + 1) {
          throw new ConcurrencyError(
            `Booking version conflict for ${record.id}: expected ${existing.version + 1}, got ${record.version}`,
            { currentVersion: existing.version, expectedVersion: record.version - 1, entityId: record.id },
          );
        }
        bookings.set(record.id, clone(record));
        bookingsByTicket.set(record.ticketId, record.id);
        return clone(record);
      },
      async getById(id) {
        const found = bookings.get(id);
        return found ? clone(found) : null;
      },
      async getByTicketId(ticketId) {
        const id = bookingsByTicket.get(ticketId);
        if (!id) return null;
        const found = bookings.get(id);
        return found ? clone(found) : null;
      },
      async ticketExists(ticketId) {
        return bookingsByTicket.has(ticketId);
      },
      async list(filter: BookingListFilter) {
        let items = [...bookings.values()];
        if (filter.status) {
          if (filter.status === "paid_confirmed" || filter.status === "confirmed") {
            items = items.filter((item) => item.status === "confirmed" || item.status === "paid_confirmed");
          } else {
            items = items.filter((item) => item.status === filter.status);
          }
        }
        if (filter.ticketId) items = items.filter((item) => item.ticketId === filter.ticketId);
        if (filter.from) items = items.filter((item) => item.pickupDatetime >= filter.from!);
        if (filter.to) items = items.filter((item) => item.pickupDatetime <= filter.to!);
        if (filter.userId) items = items.filter((item) => item.userId === filter.userId);
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const total = items.length;
        const page = filter.page ?? 1;
        const pageSize = filter.pageSize ?? 20;
        const start = (page - 1) * pageSize;
        return { items: items.slice(start, start + pageSize).map(clone), total };
      },
      // SEC-007: targeted phone+time-window query — no global page scan
      async listByPhone(phone, { from }) {
        const normalizedPhone = phone.replace(/[^\d]/g, "");
        return [...bookings.values()]
          .filter((b) => {
            const storedPhone = b.customerPhone.replace(/[^\d]/g, "");
            return storedPhone === normalizedPhone && b.createdAt >= from;
          })
          .map(clone);
      },
    },
    bookingIntents: {
      async create(record) {
        if (bookingIntentsByIdempotency.has(record.idempotencyKey)) throw new Error("duplicate booking intent idempotency key");
        bookingIntents.set(record.id, clone(record));
        bookingIntentsByIdempotency.set(record.idempotencyKey, record.id);
        return clone(record);
      },
      async update(record) {
        if (!bookingIntents.has(record.id)) throw new Error("booking intent update failed: not found");
        bookingIntents.set(record.id, clone(record));
        return clone(record);
      },
      async getById(id) {
        const found = bookingIntents.get(id);
        return found ? clone(found) : null;
      },
      async getByIdempotencyKey(key) {
        const id = bookingIntentsByIdempotency.get(key);
        const found = id ? bookingIntents.get(id) : undefined;
        return found ? clone(found) : null;
      },
    },
    payments: {
      async create(record) {
        payments.set(record.id, clone(record));
        paymentsByIdempotency.set(record.idempotencyKey, record.id);
        paymentsByOrder.set(record.providerOrderId, record.id);
        return clone(record);
      },
      async update(record) {
        payments.set(record.id, clone(record));
        if (record.providerOrderId) paymentsByOrder.set(record.providerOrderId, record.id);
        return clone(record);
      },
      async getById(id) {
        const found = payments.get(id);
        return found ? clone(found) : null;
      },
      async getByIdempotencyKey(key) {
        const id = paymentsByIdempotency.get(key);
        if (!id) return null;
        const found = payments.get(id);
        return found ? clone(found) : null;
      },
      async getByProviderOrderId(providerOrderId) {
        const id = paymentsByOrder.get(providerOrderId);
        if (!id) return null;
        const found = payments.get(id);
        return found ? clone(found) : null;
      },
      async getByProviderPaymentId(providerPaymentId) {
        const found = [...payments.values()].find((item) => item.providerPaymentId === providerPaymentId);
        return found ? clone(found) : null;
      },
      async listByBookingId(bookingId) {
        return [...payments.values()].filter((item) => item.bookingId === bookingId).map(clone);
      },
      async getOpenByBookingId(bookingId) {
        const open: PaymentStatus[] = ["pending"];
        const found = [...payments.values()].find(
          (item) => item.bookingId === bookingId && open.includes(item.status),
        );
        return found ? clone(found) : null;
      },
      async list(filter) {
        let list = [...payments.values()];
        if (filter?.bookingId) list = list.filter((item) => item.bookingId === filter.bookingId);
        if (filter?.status) list = list.filter((item) => item.status === filter.status);
        if (filter?.provider) list = list.filter((item) => item.provider === filter.provider);

        list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

        let totalCapturedPaise = 0;
        let totalRefundedPaise = 0;
        for (const p of list) {
          if (p.status === "captured") totalCapturedPaise += p.inrAmountPaise;
          if (p.status === "refunded" || p.status === "partially_refunded") totalRefundedPaise += p.inrAmountPaise;
        }

        const total = list.length;
        const page = filter?.page ?? 1;
        const pageSize = filter?.limit ?? 50;
        const start = (page - 1) * pageSize;
        const items = list.slice(start, start + pageSize).map(clone);

        return {
          items,
          total,
          totalCapturedPaise,
          totalRefundedPaise,
        };
      },
      async processCaptured(params: {
        paymentId: string;
        bookingId: string;
        providerPaymentId: string;
        webhookEventId?: string;
        paymentMethod?: string | null;
      }): Promise<void> {
        const payment = payments.get(params.paymentId);
        if (!payment) {
          throw new Error("Payment not found");
        }

        const booking = bookings.get(params.bookingId);
        if (!booking) {
          throw new Error("Booking not found");
        }

        if (booking.status === "cancelled" || booking.status === "refunded") {
          throw new Error("BOOKING_NOT_PAYABLE: This booking is cancelled and cannot accept payment.");
        }

        payment.status = "captured";
        payment.providerPaymentId = params.providerPaymentId;
        payment.reconciliationStatus = "matched";
        payment.verifiedAt = new Date().toISOString();
        if (params.paymentMethod) {
          payment.paymentMethod = params.paymentMethod;
        }
        payment.updatedAt = new Date().toISOString();

        if (booking.status === "pending_payment") {
          booking.status = "confirmed";
          booking.updatedAt = new Date().toISOString();
        }

        if (params.webhookEventId) {
          const event = webhookEvents.get(params.webhookEventId);
          if (event) {
            event.processed = true;
          }
        }
      },
    },
    refunds: {
      async create(record) {
        refunds.set(record.id, clone(record));
        refundsByIdempotency.set(record.idempotencyKey, record.id);
        return clone(record);
      },
      async update(record) {
        refunds.set(record.id, clone(record));
        refundsByIdempotency.set(record.idempotencyKey, record.id);
        return clone(record);
      },
      async getByIdempotencyKey(key) {
        const id = refundsByIdempotency.get(key);
        if (!id) return null;
        const found = refunds.get(id);
        return found ? clone(found) : null;
      },
      async getByProviderRefundId(providerRefundId) {
        const found = [...refunds.values()].find((item) => item.providerRefundId === providerRefundId);
        return found ? clone(found) : null;
      },
      async listByBookingId(bookingId) {
        return [...refunds.values()].filter((item) => item.bookingId === bookingId).map(clone);
      },
    },
    profiles: {
      async getById(id) {
        const found = profiles.get(id);
        return found ? clone(found) : null;
      },
      async getByRole(role) {
        return [...profiles.values()].filter((item) => item.role === role).map(clone);
      },
      async upsert(record) {
        profiles.set(record.id, clone(record));
        return clone(record);
      },
    },
    routeCatalog: {
      async create(record) { if ([...routeCatalog.values()].some((item) => item.slug === record.slug)) throw new Error("duplicate route slug"); routeCatalog.set(record.id, clone(record)); return clone(record); },
      async update(record) { routeCatalog.set(record.id, clone(record)); return clone(record); },
      async getById(id) { const found = routeCatalog.get(id); return found ? clone(found) : null; },
      async getBySlug(slug) { const found = [...routeCatalog.values()].find((item) => item.slug === slug); return found ? clone(found) : null; },
      async list(filter) { let items = [...routeCatalog.values()]; if (filter.tripType) items = items.filter((item) => item.tripType === filter.tripType); if (filter.status) items = items.filter((item) => item.status === filter.status); if (filter.q) { const q = filter.q.toLowerCase(); items = items.filter((item) => item.sourceCity.toLowerCase().includes(q) || (item.destinationCity ?? "").toLowerCase().includes(q) || item.slug.includes(q)); } items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); const total = items.length; const page = filter.page ?? 1; const limit = filter.limit ?? 50; return { items: items.slice((page - 1) * limit, page * limit).map(clone), total }; },
      async delete(id) { routeCatalog.delete(id); },
    },
    tourPackages: {
      async create(record) {
        if ([...tourPackages.values()].some((item) => item.packageCode === record.packageCode)) {
          throw new Error("duplicate tour package code");
        }
        tourPackages.set(record.id, clone(record));
        tourPackagesByCode.set(record.packageCode, record.id);
        return clone(record);
      },
      async update(record) {
        tourPackages.set(record.id, clone(record));
        tourPackagesByCode.set(record.packageCode, record.id);
        return clone(record);
      },
      async getById(id) {
        const found = tourPackages.get(id);
        if (found) return clone(found);
        const codeId = tourPackagesByCode.get(id);
        if (codeId) {
          const item = tourPackages.get(codeId);
          if (item) return clone(item);
        }
        return null;
      },
      async getByCode(code) {
        const id = tourPackagesByCode.get(code);
        if (id) {
          const found = tourPackages.get(id);
          if (found) return clone(found);
        }
        const direct = tourPackages.get(code);
        if (direct) return clone(direct);
        return null;
      },
      async list(filter = {}) {
        let items = [...tourPackages.values()];
        if (filter.status && filter.status !== "all") {
          items = items.filter((item) => item.status === filter.status);
        }
        if (filter.q) {
          const q = filter.q.toLowerCase();
          items = items.filter((item) => item.name.toLowerCase().includes(q) || item.packageCode.includes(q));
        }
        items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const total = items.length;
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 50;
        return { items: items.slice((page - 1) * limit, page * limit).map(clone), total };
      },
      async delete(id) {
        const found = tourPackages.get(id);
        if (found) {
          tourPackagesByCode.delete(found.packageCode);
          tourPackages.delete(id);
        }
      },
      async listUpgrades(packageId) {
        const list = [...packageUpgrades.values()].filter((item) =>
          packageId ? item.packageId === packageId || item.packageId === null : item.packageId === null
        );
        return list.sort((a, b) => a.surchargeInr - b.surchargeInr).map(clone);
      },
      async saveUpgrade(record) {
        packageUpgrades.set(record.id, clone(record));
        return clone(record);
      },
      async deleteUpgrade(id) {
        return packageUpgrades.delete(id);
      },
    },
    transferRoutes: {
      async create(record) {
        if ([...transferRoutes.values()].some((item) => item.routeCode === record.routeCode)) {
          throw new Error("duplicate transfer route code");
        }
        transferRoutes.set(record.id, clone(record));
        transferRoutesByCode.set(record.routeCode, record.id);
        return clone(record);
      },
      async update(record) {
        transferRoutes.set(record.id, clone(record));
        transferRoutesByCode.set(record.routeCode, record.id);
        return clone(record);
      },
      async getById(id) {
        const found = transferRoutes.get(id);
        return found ? clone(found) : null;
      },
      async getByCode(code) {
        const id = transferRoutesByCode.get(code);
        if (!id) return null;
        const found = transferRoutes.get(id);
        return found ? clone(found) : null;
      },
      async list(filter = {}) {
        let items = [...transferRoutes.values()];
        if (filter.status && filter.status !== "all") {
          items = items.filter((item) => item.status === filter.status);
        }
        if (filter.q) {
          const q = filter.q.toLowerCase();
          items = items.filter((item) => item.name.toLowerCase().includes(q) || item.routeCode.includes(q));
        }
        items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const total = items.length;
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 50;
        return { items: items.slice((page - 1) * limit, page * limit).map(clone), total };
      },
      async delete(id) {
        const found = transferRoutes.get(id);
        if (found) {
          transferRoutesByCode.delete(found.routeCode);
          transferRoutes.delete(id);
        }
      },
    },
    localPackages: {
      async create(record) {
        if ([...localPackages.values()].some((item) => item.packageCode === record.packageCode)) {
          throw new Error("duplicate local package code");
        }
        localPackages.set(record.id, clone(record));
        localPackagesByCode.set(record.packageCode, record.id);
        return clone(record);
      },
      async update(record) {
        localPackages.set(record.id, clone(record));
        localPackagesByCode.set(record.packageCode, record.id);
        return clone(record);
      },
      async getById(id) {
        const found = localPackages.get(id);
        return found ? clone(found) : null;
      },
      async getByCode(code) {
        const id = localPackagesByCode.get(code);
        if (!id) return null;
        const found = localPackages.get(id);
        return found ? clone(found) : null;
      },
      async list(filter = {}) {
        let items = [...localPackages.values()];
        if (filter.status && filter.status !== "all") {
          items = items.filter((item) => item.status === filter.status);
        }
        if (filter.q) {
          const q = filter.q.toLowerCase();
          items = items.filter((item) => item.name.toLowerCase().includes(q) || item.packageCode.includes(q));
        }
        items.sort((a, b) => a.durationHours - b.durationHours);
        const total = items.length;
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 50;
        return { items: items.slice((page - 1) * limit, page * limit).map(clone), total };
      },
      async delete(id) {
        const found = localPackages.get(id);
        if (found) {
          localPackagesByCode.delete(found.packageCode);
          localPackages.delete(id);
        }
      },
    },
    cancellationPolicies: {
      async list() {
        return cancellationPolicies.map(clone);
      },
      async update(record) {
        const index = cancellationPolicies.findIndex((item) => item.id === record.id);
        if (index >= 0) {
          cancellationPolicies[index] = clone(record);
        } else {
          cancellationPolicies.push(clone(record));
        }
        return clone(record);
      },
    },
    monuments: {
      async list() {
        return [...monuments].sort((a, b) => a.sortOrder - b.sortOrder).map(clone);
      },
      async update(record) {
        const index = monuments.findIndex((item) => item.id === record.id);
        if (index >= 0) {
          monuments[index] = clone(record);
        } else {
          monuments.push(clone(record));
        }
        return clone(record);
      },
    },
    petPolicy: {
      async get() {
        return clone(petPolicy);
      },
      async update(record) {
        petPolicy = clone(record);
        return clone(record);
      },
    },
    companyProfile: {
      async get() {
        return clone(companyProfile);
      },
      async update(record) {
        companyProfile = clone(record);
        return clone(record);
      },
    },
    dossierSignoffs: {
      async list() {
        return [...dossierSignoffs].sort((a, b) => a.sectionKey.localeCompare(b.sectionKey)).map(clone);
      },
      async update(record) {
        const index = dossierSignoffs.findIndex((item) => item.id === record.id);
        if (index >= 0) {
          dossierSignoffs[index] = clone(record);
        } else {
          dossierSignoffs.push(clone(record));
        }
        return clone(record);
      },
    },
    catalog: {
      async create(record) {
        catalog.set(record.id, clone(record));
        catalogBySlug.set(record.slug, record.id);
        return clone(record);
      },
      async update(record) {
        catalog.set(record.id, clone(record));
        catalogBySlug.set(record.slug, record.id);
        return clone(record);
      },
      async getById(id) {
        const found = catalog.get(id);
        return found ? clone(found) : null;
      },
      async getBySlug(slug) {
        const id = catalogBySlug.get(slug);
        if (!id) return null;
        const found = catalog.get(id);
        return found ? clone(found) : null;
      },
      async list(filter: CatalogListFilter) {
        let items = [...catalog.values()];
        if (filter.type) items = items.filter((item) => item.type === filter.type);
        if (filter.status) items = items.filter((item) => item.status === filter.status);
        if (filter.q) {
          const q = filter.q.toLowerCase();
          items = items.filter((item) => item.title.toLowerCase().includes(q) || item.slug.includes(q));
        }
        return items.map(clone);
      },
    },
    media: {
      async create(record) {
        media.set(record.id, clone(record));
        return clone(record);
      },
      async update(record) {
        media.set(record.id, clone(record));
        return clone(record);
      },
      async getById(id) {
        const found = media.get(id);
        return found ? clone(found) : null;
      },
      async listByCatalogItem(catalogItemId) {
        return [...media.values()]
          .filter((item) => item.catalogItemId === catalogItemId)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(clone);
      },
      async delete(id) {
        media.delete(id);
      },
    },
    reviews: {
      async create(record) {
        reviews.set(record.id, clone(record));
        return clone(record);
      },
      async update(record) {
        reviews.set(record.id, clone(record));
        return clone(record);
      },
      async getById(id) {
        const found = reviews.get(id);
        return found ? clone(found) : null;
      },
      async list(filter: ReviewListFilter) {
        let items = [...reviews.values()];
        if (filter.status) items = items.filter((item) => item.status === filter.status);
        if (filter.catalogItemId) items = items.filter((item) => item.catalogItemId === filter.catalogItemId);
        return items.map(clone);
      },
      async listPublishedByCatalog(catalogItemId) {
        return [...reviews.values()]
          .filter((item) => item.catalogItemId === catalogItemId && item.status === "published")
          .map(clone);
      },
    },
    promos: {
      async getByCode(code) {
        const target = code.trim().toUpperCase();
        const found = [...promos.values()].find((p) => p.code.trim().toUpperCase() === target);
        return found ? clone(found) : null;
      },
      async getById(id) {
        const found = promos.get(id) || [...promos.values()].find((p) => p.id === id);
        return found ? clone(found) : null;
      },
      async list() {
        return [...promos.values()].sort((a, b) => a.code.localeCompare(b.code)).map(clone);
      },
      async getFeatured() {
        const now = new Date().toISOString();
        const found = [...promos.values()].find(
          (p) =>
            p.isBroadcast &&
            p.isActive &&
            (!p.validFrom || p.validFrom <= now) &&
            (!p.validTo || p.validTo >= now) &&
            (p.maxRedemptions === null || p.maxRedemptions === undefined || p.redemptionCount < p.maxRedemptions),
        );
        return found ? clone(found) : null;
      },
      async consume(code) {
        const target = code.trim().toUpperCase();
        const found = [...promos.values()].find((p) => p.code.trim().toUpperCase() === target);
        if (!found || !found.isActive) return null;
        const now = new Date().toISOString();
        if (found.validFrom && found.validFrom > now) return null;
        if (found.validTo && found.validTo < now) return null;
        if (found.maxRedemptions !== null && found.maxRedemptions !== undefined && found.redemptionCount >= found.maxRedemptions) return null;
        const consumed = { ...found, redemptionCount: found.redemptionCount + 1 };
        promos.set(found.id, clone(consumed));
        return clone(consumed);
      },
      async create(record) {
        if (record.isBroadcast) {
          const anotherLive = [...promos.values()].find((p) => p.isBroadcast && p.id !== record.id);
          if (anotherLive) {
            throw new AppError("BROADCAST_CONFLICT", "Another code is already broadcast. Turn it off first.", 409);
          }
        }
        promos.set(record.id, clone(record));
        return clone(record);
      },
      async update(record) {
        if (record.isBroadcast) {
          const anotherLive = [...promos.values()].find((p) => p.isBroadcast && p.id !== record.id);
          if (anotherLive) {
            throw new AppError("BROADCAST_CONFLICT", "Another code is already broadcast. Turn it off first.", 409);
          }
        }
        promos.set(record.id, clone(record));
        return clone(record);
      },
      async delete(id) {
        const target = promos.get(id) ? id : [...promos.entries()].find(([, p]) => p.id === id)?.[0];
        if (target) {
          promos.delete(target);
          return true;
        }
        return false;
      },
    },
    audit: {
      async append(record) {
        audit.push(clone(record));
        return clone(record);
      },
      async list(limit = 100) {
        return audit.slice(-limit).reverse().map(clone);
      },
    },
    rentalEnquiries: {
      async create(record) { rentalEnquiries.push(clone(record)); return clone(record); },
      async update(record) { const index = rentalEnquiries.findIndex((item) => item.id === record.id); if (index < 0) throw new Error("rental enquiry update failed: not found"); rentalEnquiries[index] = clone(record); return clone(record); },
      async getById(id) { const found = rentalEnquiries.find((item) => item.id === id); return found ? clone(found) : null; },
      async list(filter?: RentalEnquiryListFilter) {
        let list = rentalEnquiries
          .filter((item) => !filter?.status || item.status === filter.status)
          .filter((item) => !filter?.vehicleGroupCode || item.vehicleGroupCode === filter.vehicleGroupCode)
          .filter((item) => !filter?.carTier || item.carTier === filter.carTier || item.vehicleGroupCode === filter.carTier)
          .filter((item) => !filter?.car || filter.car === "all" || item.carTier === filter.car || item.vehicleGroupCode === filter.car)
          .filter((item) => !filter?.from || item.pickupDate >= filter.from)
          .filter((item) => !filter?.to || item.pickupDate <= filter.to);
        if (filter?.q) {
          const q = filter.q.toLowerCase();
          list = list.filter((item) => item.name.toLowerCase().includes(q) || item.phone.includes(q) || item.ref.toLowerCase().includes(q));
        }
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const total = list.length;
        const page = filter?.page ?? 1;
        const limit = filter?.limit ?? 50;
        return { total, items: list.slice((page - 1) * limit, page * limit).map(clone) };
      },
    },
    inquiries: {
      async create(record) {
        inquiries.push(clone(record));
        return clone(record);
      },
      async update(record) {
        const idx = inquiries.findIndex((i) => i.id === record.id);
        if (idx !== -1) {
          inquiries[idx] = clone(record);
        } else {
          inquiries.push(clone(record));
        }
        return clone(record);
      },
      async getById(id) {
        const found = inquiries.find((i) => i.id === id);
        return found ? clone(found) : null;
      },
      async list(filter) {
        let list = [...inquiries];
        if (filter?.status) {
          list = list.filter((i) => i.status === filter.status);
        }
        if (filter?.q) {
          const q = filter.q.toLowerCase();
          list = list.filter(
            (i) =>
              i.name.toLowerCase().includes(q) ||
              i.phone.includes(q) ||
              (i.email && i.email.toLowerCase().includes(q)) ||
              (i.tripInterest && i.tripInterest.toLowerCase().includes(q)) ||
              i.message.toLowerCase().includes(q),
          );
        }
        list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        const total = list.length;
        const page = filter?.page ?? 1;
        const limit = filter?.limit ?? 50;
        const start = (page - 1) * limit;
        const items = list.slice(start, start + limit).map(clone);
        return { items, total };
      },
    },
    notifications: {
      async create(record) {
        notifications.set(record.id, clone(record));
        notificationsByDedupe.set(record.dedupeKey, record.id);
        return clone(record);
      },
      async update(record) {
        notifications.set(record.id, clone(record));
        return clone(record);
      },
      async getByDedupeKey(key) {
        const id = notificationsByDedupe.get(key);
        if (!id) return null;
        const found = notifications.get(id);
        return found ? clone(found) : null;
      },
      async listQueued() {
        return [...notifications.values()].filter((item) => item.status === "queued").map(clone);
      },
    },
    webhooks: {
      async record(event) {
        const existing = webhookEvents.get(event.eventId);
        if (existing) return { created: false, record: clone(existing) };
        webhookEvents.set(event.eventId, clone(event));
        return { created: true, record: clone(event) };
      },
      async markProcessed(eventId) {
        const existing = webhookEvents.get(eventId);
        if (existing) webhookEvents.set(eventId, { ...existing, processed: true });
      },
      async hasEvent(eventId) {
        return webhookEvents.has(eventId);
      },
    },
    locationCache: {
      async get(key) {
        const found = locationCache.get(key);
        return found ? clone(found) : null;
      },
      async set(key, suggestions, storedAt) {
        locationCache.set(key, { suggestions: clone(suggestions), storedAt });
      },
    },
    devices: {
      async register(record) {
        if (record.userId) {
          for (const [id, d] of devices.entries()) {
            if (d.deviceId === record.deviceId && !d.userId) {
              devices.delete(id);
            }
          }
          let existingId: string | null = null;
          for (const [id, d] of devices.entries()) {
            if (d.deviceId === record.deviceId && d.userId === record.userId) {
              existingId = id;
              break;
            }
          }
          if (existingId) {
            const existing = devices.get(existingId)!;
            const updated: DeviceRegistrationRecord = {
              ...existing,
              bookingId: record.bookingId ?? existing.bookingId,
              platform: record.platform,
              fcmToken: record.fcmToken,
              isActive: record.isActive,
              lastSeenAt: record.lastSeenAt,
            };
            devices.set(existingId, updated);
            return clone(updated);
          }
        } else {
          let existingId: string | null = null;
          for (const [id, d] of devices.entries()) {
            if (d.deviceId === record.deviceId && !d.userId) {
              existingId = id;
              break;
            }
          }
          if (existingId) {
            const existing = devices.get(existingId)!;
            const updated: DeviceRegistrationRecord = {
              ...existing,
              bookingId: record.bookingId ?? existing.bookingId,
              platform: record.platform,
              fcmToken: record.fcmToken,
              isActive: record.isActive,
              lastSeenAt: record.lastSeenAt,
            };
            devices.set(existingId, updated);
            return clone(updated);
          }
        }
        devices.set(record.id, clone(record));
        return clone(record);
      },
      async getByDeviceId(deviceId) {
        for (const reg of devices.values()) {
          if (reg.deviceId === deviceId) return clone(reg);
        }
        return null;
      },
      async listByUserId(userId) {
        return [...devices.values()].filter((d) => d.userId === userId).map(clone);
      },
    },
    fareRules: {
      async getActive() {
        for (const rule of fareRules.values()) {
          if (rule.isActive) return clone(rule);
        }
        return null;
      },
      async getByVersion(version: string) {
        for (const rule of fareRules.values()) {
          if (rule.version === version) return clone(rule);
        }
        return null;
      },
      async listAll() {
        return [...fareRules.values()]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map(clone);
      },
      async save(record: FareRuleRecord) {
        if (record.isActive) {
          for (const existing of fareRules.values()) {
            if (existing.id !== record.id && existing.isActive) {
              existing.isActive = false;
              existing.effectiveTo = record.effectiveFrom || new Date().toISOString();
            }
          }
        }
        let targetId = record.id;
        for (const [id, rule] of fareRules.entries()) {
          if (rule.version === record.version) {
            targetId = id;
            break;
          }
        }
        fareRules.set(targetId, { ...clone(record), id: targetId });
        return clone(fareRules.get(targetId)!);
      },
      async activate(version: string) {
        const now = new Date().toISOString();
        let target: FareRuleRecord | null = null;
        for (const rule of fareRules.values()) {
          if (rule.version === version) {
            target = rule;
          } else if (rule.isActive) {
            rule.isActive = false;
            rule.effectiveTo = now;
          }
        }
        if (!target) return null;
        target.isActive = true;
        target.effectiveFrom = now;
        target.effectiveTo = null;
        return clone(target);
      },
    },
    publishEvents: {
      async enqueue(input: PublishEventInput) {
        for (const existing of publishEvents.values()) {
          if (
            existing.status === "pending" &&
            existing.entity_type === input.entityType &&
            existing.entity_id === input.entityId &&
            existing.event_type === input.eventType
          ) {
            existing.next_attempt_at = new Date().toISOString();
            return clone(existing);
          }
        }
        const now = new Date().toISOString();
        const id = randomUUID();
        const record: PublishEventRecord = {
          id,
          entity_type: input.entityType,
          entity_id: input.entityId,
          event_type: input.eventType,
          status: "pending",
          attempt_count: 0,
          next_attempt_at: now,
          deployment_ref: null,
          last_error: null,
          created_at: now,
          processed_at: null,
        };
        publishEvents.set(id, record);
        return clone(record);
      },
      async getById(id: string) {
        const item = publishEvents.get(id);
        return item ? clone(item) : null;
      },
      async listPending(limit = 10) {
        return Array.from(publishEvents.values())
          .filter((e) => e.status === "pending")
          .slice(0, limit)
          .map(clone);
      },
    },
  };

  return repos;
}
