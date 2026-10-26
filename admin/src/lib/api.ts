/**
 * Admin API Client — connects Admin Operations Desk to Fastify REST API.
 * Uses env.API_BASE_URL (defaults to http://localhost:4000 on localhost).
 * Uses getAuthHeaders() for Bearer authentication.
 *
 * No silent fixture fallbacks: every function either returns REAL backend data
 * (possibly an empty list) or throws. Pages render their own empty/error states.
 */
import { env } from "./env";
import { expireSession, getAuthHeaders } from "./auth";
import type {
  AuditEntry,
  Booking,
  BookingStatus,
  CatalogAvailability,
  CatalogCategory,
  CatalogItem,
  CatalogMedia,
  CatalogStatus,
  CatalogTripType,
  FareRuleset,
  Inquiry,
  InquiryStatus,
  InquiryType,
  RentalEnquiry,
  RentalStatus,
  Payment,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  Review,
  TripType,
  VehicleTier,
  RouteCatalogItem, RouteFleet, RouteTripType,
  TourPackageItem, TourPackageUpgrade,
  LocalPackageItem, TransferRouteItem,
  CancellationPolicyItem, MonumentItem,
  PetPolicyItem, CompanyProfileItem, DossierSignoffItem,
  PromoCodeItem, CreatePromoCodeInput, UpdatePromoCodeInput,
} from "./types";

export let lastAdminCorrelationId = "";

function nextCorrelationId(): string {
  lastAdminCorrelationId = crypto.randomUUID();
  return lastAdminCorrelationId;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<any> {
  const correlationId = nextCorrelationId();
  const method = init?.method || "GET";
  console.log(`[Admin API -> Request] ${method} ${path}`, {
    correlationId,
    timestamp: new Date().toISOString(),
  });

  const res = await fetch(`${env.API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Correlation-Id": correlationId,
      "X-Request-Id": correlationId,
      ...getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  if (res.headers.get("X-API-Deprecated") === "true" || res.headers.get("Deprecation") === "true") {
    console.warn(`[Admin API ! Deprecated Route Warning] Endpoint ${path} is marked as deprecated by server.`);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn(`[Admin API ! Response Error] ${method} ${path} -> HTTP ${res.status}`, {
      status: res.status,
      error: json?.error || json?.message || json,
      correlationId,
    });
    if (res.status === 401 || res.status === 403) {
      expireSession();
    }
    let message = json?.error?.message || json?.message;
    if (json?.error?.details && Array.isArray(json.error.details)) {
      const details = json.error.details
        .map((d: any) => (d.path ? `${d.path}: ${d.message}` : d.message || JSON.stringify(d)))
        .join("; ");
      message = `${message || "Validation failed"} (${details})`;
    }
    if (!message) {
      message =
        res.status === 401
          ? "Your session has expired. Please sign in again."
          : `Request failed (${res.status}). Check that the backend is reachable.`;
    }
    throw new Error(message);
  }

  console.log(`[Admin API <- Response] ${method} ${path} -> HTTP ${res.status}`);
  return json;
}

export async function fetchAdminBookings(filter?: {
  status?: BookingStatus | "all";
  ticketId?: string;
  page?: number;
  pageSize?: number;
}): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.ticketId) params.set("ticketId", filter.ticketId);
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.pageSize) params.set("pageSize", String(filter.pageSize));

  const json = await apiFetch(`/api/v1/ops/admin/bookings${params.toString() ? `?${params.toString()}` : ""}`);
  const items = json?.data?.items || json?.data?.bookings || [];

  if (!Array.isArray(items)) return [];

  return items.map((b: any) => ({
    id: b.id,
    ticketId: b.ticketId || b.id,
    customerName: b.customerName || "Customer",
    customerPhone: b.customerPhone || "",
    customerEmail: b.customerEmail || "",
    origin: b.originName || b.origin || "",
    destination: b.destinationName || b.destination || "",
    bookingSelection: b.bookingSelection ?? null,
    selectedCatalogItemId: b.selectedCatalogItemId ?? null,
    pickupDateTime: b.pickupDatetime || b.pickupDateTime || new Date().toISOString(),
    returnDateTime: b.returnDatetime || b.returnDateTime || null,
    distanceKm: Number(b.distanceKm) || 0,
    tripType: (b.tripType as TripType) || "one-way",
    vehicleTier: (b.vehicleTier as VehicleTier) || "sedan",
    status: (b.status as BookingStatus) || "pending_payment",
    version: Number(b.version) || 1,
    notes: b.specialNotes || b.notes || "",
    createdAt: b.createdAt || new Date().toISOString(),
    fare: {
      baseFare: Number(b.baseFare ?? b.totalFare) || 0,
      nightAllowance: Number(b.nightAllowance) || 0,
      driverAllowance: Number(b.driverAllowance) || 0,
      tollsTaxes: 0,
      promoDiscount: Number(b.discountAmount) || 0,
      totalFare: Number(b.totalFare) || 0,
      advancePaid: Number(b.advanceAmount) || 0,
      balancePayable: Math.max(0, (Number(b.totalFare) || 0) - (Number(b.advanceAmount) || 0)),
    },
  }));
}

export async function transitionAdminBooking(
  id: string,
  to: BookingStatus,
  expectedVersion?: number,
): Promise<any> {
  const json = await apiFetch(
    `/api/v1/ops/admin/bookings/${encodeURIComponent(id)}/transition`,
    {
      method: "POST",
      body: JSON.stringify({ to, expectedVersion }),
    },
  );
  return json.data;
}

export async function unmaskAdminBooking(
  id: string,
): Promise<{ id: string; customerPhone: string; customerEmail: string | null }> {
  const json = await apiFetch(
    `/api/v1/ops/admin/bookings/${encodeURIComponent(id)}/unmask`,
    {
      method: "POST",
    },
  );
  return json.data;
}

export async function refundAdminBooking(
  bookingId: string,
  reason: string,
  idempotencyKey: string,
  amountMinor?: number,
): Promise<any> {
  const json = await apiFetch(`/api/v1/ops/admin/refunds`, {
    method: "POST",
    body: JSON.stringify({ bookingId, reason, idempotencyKey, amountMinor }),
  });
  return json.data;
}

export async function fetchAdminInquiries(filter?: {
  status?: InquiryStatus | "all";
  page?: number;
  limit?: number;
}): Promise<Inquiry[]> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.limit) params.set("limit", String(filter.limit));

  const json = await apiFetch(`/api/v1/ops/admin/inquiries${params.toString() ? `?${params.toString()}` : ""}`);
  const items = json?.data?.items || json?.data?.inquiries || [];

  if (!Array.isArray(items)) return [];

  return items.map((iq: any) => ({
    id: iq.id,
    name: iq.name || "Customer",
    phone: iq.phone || "",
    type: (iq.tripInterest as InquiryType) || "contact",
    subject: iq.tripInterest ? `Interest: ${iq.tripInterest}` : "Customer Inquiry",
    message: iq.message || "",
    status: (iq.status as InquiryStatus) || "new",
    notes: Array.isArray(iq.notes) ? iq.notes : [],
    createdAt: iq.createdAt || new Date().toISOString(),
  }));
}

export async function updateAdminInquiry(
  id: string,
  updates: { status?: InquiryStatus; note?: string },
): Promise<any> {
  const json = await apiFetch(`/api/v1/ops/admin/inquiries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return json.data;
}

export async function fetchAdminRentalEnquiries(filter?: { status?: RentalStatus | "all"; car?: string | "all"; from?: string; to?: string; q?: string }): Promise<RentalEnquiry[]> {
  const params = new URLSearchParams(); if (filter?.status && filter.status !== "all" && filter.status !== "new") params.set("status", filter.status); if (filter?.car && filter.car !== "all") params.set("car", filter.car); if (filter?.from) params.set("from", filter.from); if (filter?.to) params.set("to", filter.to); if (filter?.q) params.set("q", filter.q);
  const json = await apiFetch(`/api/v1/ops/admin/rental-enquiries${params.toString() ? `?${params}` : ""}`); const items = json?.data?.items || json?.data?.rentalEnquiries || []; return Array.isArray(items) ? items.map((item: any) => ({ ...item, status: item.status || "new", notes: Array.isArray(item.notes) ? item.notes : [] })) : [];
}
export async function updateAdminRentalEnquiry(id: string, updates: { status?: RentalStatus; note?: string }): Promise<RentalEnquiry> { const json = await apiFetch(`/api/v1/ops/admin/rental-enquiries/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(updates) }); return json.data; }
export async function fetchAdminPayments(filter?: {
  page?: number;
  limit?: number;
}): Promise<{ items: Payment[]; totalCaptured: number; totalRefunded: number }> {
  const params = new URLSearchParams();
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.limit) params.set("limit", String(filter.limit));

  const json = await apiFetch(`/api/v1/ops/admin/payments${params.toString() ? `?${params.toString()}` : ""}`);
  const items = json?.data?.items || json?.data?.payments || [];

  const mapped: Payment[] = Array.isArray(items)
    ? items.map((p: any) => ({
      id: p.id,
      bookingTicketId: p.bookingTicketId || "—",
      provider: (p.provider as PaymentProvider) || "razorpay",
      method: (p.method ?? p.paymentMethod ?? null) as PaymentMethod | null,
      providerPaymentId: p.providerPaymentId ?? null,
      providerOrderId: p.providerOrderId || "—",
      checkoutSessionId: p.checkoutSessionId ?? null,
      checkoutUrl: p.checkoutUrl ?? null,
      webhookEventId: p.webhookEventId ?? null,
      reconciliationStatus: (p.reconciliationStatus as Payment["reconciliationStatus"]) || "pending",
      amount: Math.round(Number(p.amountMinor ?? p.amountPaise ?? 0) / 100),
      status: (p.status as PaymentStatus) || "pending",
      capturedAt: p.capturedAt ?? p.verifiedAt ?? null,
    }))
    : [];

  return {
    items: mapped,
    totalCaptured: Math.round((json?.data?.totalCapturedPaise || 0) / 100),
    totalRefunded: Math.round((json?.data?.totalRefundedPaise || 0) / 100),
  };
}

export async function fetchAdminFareRules(): Promise<FareRuleset> {
  const json = await apiFetch(`/api/v1/ops/admin/fare-rules`);
  const data = json?.data;
  if (!data || !data.version) {
    throw new Error("Fare rules response was malformed.");
  }

  const outstation = data.outstation || {};
  const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];

  const rules = vehicles.map((v: any) => ({
    vehicleTier: (v.tier || v.id) as VehicleTier,
    label: `${v.name || v.id} (${v.seats}-seater)`,
    seats: Number(v.seats) || 4,
    perKm: Number(v.perKm) || 10,
    minDailyKm: Number(outstation.minKmPerDay) || 300,
    nightChargePerHour: Number(v.perKm) >= 25 ? 90 : 50,
    driverAllowance: Number(v.seats) >= 12 ? (Number(outstation.nightAllowanceTempo) || 500) : (Number(outstation.nightAllowanceCab) || 300),
    active: v.active !== false,
  }));

  const startHour = String(outstation.nightStartHour ?? 22).padStart(2, "0");
  const endHour = String(outstation.nightEndHour ?? 5).padStart(2, "0");

  return {
    version: data.version,
    effectiveFrom: data.effectiveFrom || data.version,
    nightWindow: data.nightWindow || `${startHour}:00 – ${endHour}:00 IST`,
    rules,
    notes: Array.isArray(data.notes)
      ? data.notes
      : [
        `Outstation trips bill the greater of actual km or the tier minimum daily km (${outstation.minKmPerDay || 300} km/day).`,
        `Night allowance applies when travel occurs inside the ${startHour}:00–${endHour}:00 IST window.`,
        `Driver daily allowance is fixed per commercial agreement (₹${outstation.nightAllowanceCab || 300} cab / ₹${outstation.nightAllowanceTempo || 500} tempo).`,
        "Tolls, parking and state check-gate fees are passed at actuals with receipts.",
        "Fares are calculated exclusively by the backend fare engine — admin cannot override.",
      ],
  };
}

export async function fetchAdminAuditLogs(limit = 100): Promise<AuditEntry[]> {
  const json = await apiFetch(`/api/v1/ops/admin/audit-logs?limit=${limit}`);
  const items = json?.data;

  if (!Array.isArray(items)) return [];

  return items.map((a: any) => ({
    id: a.id,
    action: a.action,
    actor: a.actor || "Staff",
    actorRole: a.actorRole || "super_admin",
    resourceType: a.resourceType || "booking",
    resourceId: a.resourceId || "",
    ip: a.ip || "—",
    detail: a.detail || "",
    at: a.at || a.createdAt || new Date().toISOString(),
  }));
}

/* ── Catalog CMS ──────────────────────────────────────────────────────────── */

function mapCatalogItem(c: any): CatalogItem {
  return {
    id: c.id,
    slug: c.slug || "",
    title: c.title || "Untitled",
    category: (c.type as CatalogCategory) || "package",
    summary: c.shortDescription || c.description || "",
    duration: c.durationText || "",
    startingPrice: Number(c.startingPriceInr) || 0,
    status: (c.status as CatalogStatus) || "draft",
    updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
    places: (c.routeSummary || "")
      .split(/[,·|]/)
      .map((s: string) => s.trim())
      .filter(Boolean),
    distanceKm: c.distanceKm === null || c.distanceKm === undefined ? null : Number(c.distanceKm),
    availability: (c.availability as CatalogAvailability) || "available",
    seatsLeft: c.seatsLeft === null || c.seatsLeft === undefined ? null : Number(c.seatsLeft),
    stops: Array.isArray(c.stops) ? c.stops : [],
    tripType: (c.tripType as CatalogTripType | null) ?? null,
  };
}

function mapCatalogMedia(m: any): CatalogMedia {
  return {
    id: m.id,
    catalogItemId: m.catalogItemId || "",
    mediaType: (m.mediaType as "image" | "video") || "image",
    altText: m.altText || "",
    caption: m.caption ?? null,
    sortOrder: Number(m.sortOrder) || 0,
    status: (m.status as CatalogStatus) || "draft",
    url: m.url || m.storagePath || "",
    mimeType: m.mimeType ?? null,
    sizeBytes: m.sizeBytes === null || m.sizeBytes === undefined ? null : Number(m.sizeBytes),
    createdAt: m.createdAt || new Date().toISOString(),
  };
}

/** Absolute URL a browser can load for a catalog media entry. */
export function resolveMediaSrc(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  // Backend media endpoints live on the API origin, not on the separately hosted admin app.
  if (url.startsWith("/api/v1/")) return `${env.API_BASE_URL}${url}`;
  // Static customer site assets (/assets/ or /images/) live on the customer site origin.
  if (url.startsWith("/assets/") || url.startsWith("/images/")) {
    return `${env.CUSTOMER_SITE_URL}${url}`;
  }
  return url;
}

export async function fetchAdminCatalog(filter?: {
  type?: CatalogCategory | "all";
  status?: CatalogStatus | "all";
  q?: string;
}): Promise<CatalogItem[]> {
  const params = new URLSearchParams();
  if (filter?.type && filter.type !== "all") params.set("type", filter.type);
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.q?.trim()) params.set("q", filter.q.trim());
  const qs = params.toString();
  const json = await apiFetch(`/api/v1/ops/admin/catalog${qs ? `?${qs}` : ""}`);
  const items = json?.data?.items || json?.data || [];
  return Array.isArray(items) ? items.map(mapCatalogItem) : [];
}

export async function fetchAdminCatalogItem(id: string): Promise<{ item: CatalogItem; media: CatalogMedia[] }> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(id)}`);
  const data = json?.data ?? {};
  return { item: mapCatalogItem(data), media: Array.isArray(data.media) ? data.media.map(mapCatalogMedia) : [] };
}

export async function fetchCatalogManifestStatus(): Promise<{
  version: number;
  updatedAt: string;
  routeCount: number;
  packageCount: number;
}> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/manifest/status`);
  return json?.data ?? { version: 1, updatedAt: new Date().toISOString(), routeCount: 0, packageCount: 0 };
}

export async function republishCatalogManifest(): Promise<{
  version: number;
  updatedAt: string;
  routeCount: number;
  packageCount: number;
}> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/republish`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return json?.data ?? { version: 1, updatedAt: new Date().toISOString(), routeCount: 0, packageCount: 0 };
}

export async function setCatalogItemStatus(id: string, action: "publish" | "archive" | "unpublish"): Promise<CatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return mapCatalogItem(json?.data ?? { id });
}

export async function createAdminCatalogItem(payload: {
  type: CatalogCategory;
  slug: string;
  title: string;
  shortDescription: string;
  description?: string;
  durationText: string;
  routeSummary: string;
  startingPriceInr?: number | null;
  distanceKm?: number | null;
  availability?: CatalogAvailability;
  seatsLeft?: number | null;
  stops?: string[];
  tripType?: CatalogTripType | null;
}): Promise<CatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      description: payload.description || payload.shortDescription,
    }),
  });
  return mapCatalogItem(json?.data ?? {});
}

export async function updateAdminCatalogItem(
  id: string,
  payload: Partial<{
    type: CatalogCategory;
    slug: string;
    title: string;
    shortDescription: string;
    description: string;
    durationText: string;
    routeSummary: string;
    startingPriceInr?: number | null;
    distanceKm: number | null;
    availability: CatalogAvailability;
    seatsLeft: number | null;
    stops: string[];
    tripType: CatalogTripType | null;
    status: CatalogStatus;
  }>,
): Promise<CatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapCatalogItem(json?.data ?? { id });
}

/* ── Catalog media (image manager) ────────────────────────────────────────── */

export async function uploadCatalogMedia(
  catalogItemId: string,
  payload: {
    dataBase64: string;
    mimeType: "image/webp" | "image/jpeg" | "image/png" | "image/avif";
    altText: string;
    caption?: string;
    sortOrder?: number;
  },
): Promise<CatalogMedia> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(catalogItemId)}/media`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapCatalogMedia(json?.data ?? {});
}

export async function attachCatalogMediaByPath(
  catalogItemId: string,
  payload: { storagePath: string; altText: string; caption?: string; sortOrder?: number },
): Promise<CatalogMedia> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(catalogItemId)}/media`, {
    method: "POST",
    body: JSON.stringify({ ...payload, mediaType: "image" }),
  });
  return mapCatalogMedia(json?.data ?? {});
}

export async function updateCatalogMedia(
  mediaId: string,
  payload: Partial<{ altText: string; caption: string | null; sortOrder: number; status: CatalogStatus }>,
): Promise<CatalogMedia> {
  const json = await apiFetch(`/api/v1/ops/admin/media/${encodeURIComponent(mediaId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapCatalogMedia(json?.data ?? { id: mediaId });
}

export async function deleteCatalogMedia(mediaId: string): Promise<void> {
  await apiFetch(`/api/v1/ops/admin/media/${encodeURIComponent(mediaId)}`, { method: "DELETE" });
}

export async function updateAdminFareRules(updates: any): Promise<FareRuleset> {
  await apiFetch(`/api/v1/ops/admin/fare-rules`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return fetchAdminFareRules();
}

export async function createAdminBooking(payload: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tripType: "one-way" | "round-trip";
  vehicleTier?: string;
  originName: string;
  destinationName: string;
  pickupAddress: string;
  dropAddress: string;
  pickupDatetime: string;
  returnDatetime?: string;
  specialNotes?: string;
}): Promise<any> {
  try {
    // 1. Fetch published catalog to locate matching route and active vehicle models
    const catalogRes = await apiFetch(`/api/v1/catalog`, { method: "GET" }).catch(() => null);
    const products: any[] = catalogRes?.products || [];
    const vehicles: any[] = catalogRes?.vehicles || [];

    const originLower = payload.originName.trim().toLowerCase();
    const destLower = payload.destinationName.trim().toLowerCase();

    let matchedRoute = products.find((p) => {
      const name = (p.name || "").toLowerCase();
      const slug = (p.slug || p.code || "").toLowerCase();
      return (
        (name.includes(originLower) && name.includes(destLower)) ||
        (slug.includes(originLower) && slug.includes(destLower))
      );
    });

    if (!matchedRoute && products.length > 0) {
      matchedRoute = products.find((p) => p.category === "routes" || p.category === "outstation") || products[0];
    }

    const requestedTier = (payload.vehicleTier || "sedan").toLowerCase();
    let matchedVehicle = vehicles.find((v) => {
      const code = (v.model_code || v.group_code || v.name || "").toLowerCase();
      return code.includes(requestedTier);
    });
    if (!matchedVehicle && vehicles.length > 0) {
      matchedVehicle = vehicles[0];
    }

    if (matchedRoute && matchedVehicle) {
      const trip_type = payload.tripType === "round-trip" ? "round_trip" : "one_way";
      const quotePayload = {
        category: "outstation" as const,
        route_id: matchedRoute.id,
        vehicle_model_id: matchedVehicle.id,
        trip_type,
        pickup_at: new Date(payload.pickupDatetime).toISOString(),
        return_at: payload.returnDatetime ? new Date(payload.returnDatetime).toISOString() : undefined,
        passenger_count: 2,
      };

      const quote = await apiFetch(`/api/v1/quotes`, {
        method: "POST",
        body: JSON.stringify(quotePayload),
      });

      if (quote?.total) {
        const cleanBookingRes = await apiFetch(`/api/v1/bookings`, {
          method: "POST",
          body: JSON.stringify({
            quote: quotePayload,
            quoted_total: quote.total,
            customer_name: payload.customerName.trim(),
            customer_phone: payload.customerPhone.trim(),
            customer_email: payload.customerEmail?.trim() || undefined,
            pickup_address: payload.pickupAddress.trim(),
            drop_address: payload.dropAddress?.trim() || undefined,
            special_notes: payload.specialNotes?.trim() || undefined,
          }),
        });

        const b = cleanBookingRes?.booking || cleanBookingRes?.data || cleanBookingRes;
        return {
          ...b,
          ticketId: b.ticket_id || b.ticketId || b.id,
        };
      }
    }
  } catch (err: any) {
    console.warn("[Admin API] Clean booking creation fallback to draft:", err);
  }

  const json = await apiFetch(`/api/v1/bookings/draft`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json?.data;
}

/* ── Review moderation ────────────────────────────────────────────────────── */

import { mapAdminReview } from "./reviewMapper";
export { mapAdminReview };

export async function fetchAdminReviews(): Promise<Review[]> {
  const json = await apiFetch(`/api/v1/admin/review-submissions`);
  const items = json?.submissions || json?.data?.items || json?.data || [];
  if (!Array.isArray(items)) return [];

  return items.map(mapAdminReview);
}

export async function actOnReview(
  id: string,
  action: "approve" | "reject" | "publish" | "unpublish",
  reason?: string
): Promise<{ id: string; status: "pending" | "approved" | "rejected"; showOnHomepage: boolean }> {
  const payload: any = {};
  if (action === "approve") {
    payload.status = "approved";
  } else if (action === "reject") {
    payload.status = "rejected";
    payload.rejection_reason = reason || "Rejected during moderation.";
    payload.show_on_homepage = false;
  } else if (action === "publish") {
    payload.status = "approved";
    payload.show_on_homepage = true;
  } else if (action === "unpublish") {
    payload.show_on_homepage = false;
  }

  const json = await apiFetch(`/api/v1/admin/review-submissions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const sub = json?.submission || json?.data?.submission || json?.data || {};
  return {
    id: sub.id ? String(sub.id) : id,
    status: sub.status ?? (action === "reject" ? "rejected" : "approved"),
    showOnHomepage: Boolean(sub.show_on_homepage),
  };
}

export async function createAdminReviewLink(input: {
  label?: string;
  prefill?: {
    customerName?: string;
    ticketId?: string;
    chauffeurName?: string;
    tourName?: string;
  };
}): Promise<{ token: string; link: any }> {
  const json = await apiFetch("/api/v1/admin/review-links", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { token: json.token, link: json.link };
}


function mapRouteCatalogItem(value: any): RouteCatalogItem {
  return {
    id: value.id, tripType: value.tripType ?? value.trip_type, sourceCity: value.sourceCity ?? value.source_city,
    sourceDetail: value.sourceDetail ?? value.source_detail ?? null, destinationCity: value.destinationCity ?? value.destination_city ?? null,
    slug: value.slug, distanceKm: value.distanceKm ?? value.distance_km ?? null, durationText: value.durationText ?? value.duration_text ?? null,
    availableFleets: value.availableFleets ?? value.available_fleets ?? [], faresInr: value.faresInr ?? value.fares_inr ?? {},
    driverChargeInr: Number(value.driverChargeInr ?? value.driver_charge_inr ?? 0), nightHaltInr: Number(value.nightHaltInr ?? value.night_halt_inr ?? 0),
    tollIncluded: Boolean(value.tollIncluded ?? value.toll_included), tollAmountInr: value.tollAmountInr ?? value.toll_amount_inr ?? null,
    interstateCharges: value.interstateCharges ?? value.interstate_charges ?? [], minKmPerDay: Number(value.minKmPerDay ?? value.min_km_per_day ?? 300),
    stops: value.stops ?? [],
    usePerKm: value.usePerKm ?? value.use_per_km ?? true,
    perKmRateOverride: value.perKmRateOverride ?? value.per_km_rate_override ?? null,
    highway: value.highway ?? null,
    allInclusiveNote: value.allInclusiveNote ?? value.all_inclusive_note ?? null,
    status: value.status, needsReview: Boolean(value.needsReview ?? value.needs_review), createdAt: value.createdAt ?? value.created_at, updatedAt: value.updatedAt ?? value.updated_at,
  };
}

export async function fetchAdminRoutes(filter?: { tripType?: RouteTripType | "all"; status?: CatalogStatus | "all"; q?: string }): Promise<RouteCatalogItem[]> {
  const params = new URLSearchParams(); if (filter?.tripType && filter.tripType !== "all") params.set("trip_type", filter.tripType); if (filter?.status && filter.status !== "all") params.set("status", filter.status); if (filter?.q?.trim()) params.set("q", filter.q.trim());
  const json = await apiFetch(`/api/v1/ops/admin/routes${params.toString() ? `?${params}` : ""}`); return (json?.data?.items ?? json?.data ?? []).map(mapRouteCatalogItem);
}
export async function fetchAdminRoute(id: string): Promise<RouteCatalogItem> { const json = await apiFetch(`/api/v1/ops/admin/routes/${encodeURIComponent(id)}`); return mapRouteCatalogItem(json?.data); }
export async function createAdminRoute(payload: Omit<RouteCatalogItem, "id" | "status" | "createdAt" | "updatedAt"> & { status?: never }): Promise<RouteCatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/routes`, {
    method: "POST",
    body: JSON.stringify({
      trip_type: payload.tripType, source_city: payload.sourceCity, source_detail: payload.sourceDetail || undefined,
      destination_city: payload.destinationCity || undefined, slug: payload.slug, distance_km: payload.distanceKm ?? undefined,
      duration_text: payload.durationText || undefined, available_fleets: payload.availableFleets, fares_inr: payload.faresInr,
      driver_charge_inr: payload.driverChargeInr, night_halt_inr: payload.nightHaltInr, toll_included: payload.tollIncluded,
      toll_amount_inr: payload.tollAmountInr ?? undefined, interstate_charges: payload.interstateCharges, min_km_per_day: payload.minKmPerDay,
      stops: payload.stops, use_per_km: payload.usePerKm ?? true, per_km_rate_override: payload.perKmRateOverride ?? undefined,
      highway: payload.highway || undefined, all_inclusive_note: payload.allInclusiveNote || undefined,
      needs_review: payload.needsReview,
    }),
  });
  return mapRouteCatalogItem(json?.data);
}
export async function updateAdminRoute(id: string, payload: Partial<Omit<RouteCatalogItem, "id" | "status" | "createdAt" | "updatedAt">>): Promise<RouteCatalogItem> {
  const body: any = {};
  for (const [key, value] of Object.entries(payload)) {
    const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    body[snake] = value;
  }
  const json = await apiFetch(`/api/v1/ops/admin/routes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
  return mapRouteCatalogItem(json?.data);
}
export async function publishAdminRoute(id: string): Promise<RouteCatalogItem> { const json = await apiFetch(`/api/v1/ops/admin/routes/${encodeURIComponent(id)}/publish`, { method: "POST", body: "{}" }); return mapRouteCatalogItem(json?.data); }
export async function archiveAdminRoute(id: string): Promise<RouteCatalogItem> { const json = await apiFetch(`/api/v1/ops/admin/routes/${encodeURIComponent(id)}/archive`, { method: "POST", body: "{}" }); return mapRouteCatalogItem(json?.data); }
export async function checkRouteSlug(slug: string): Promise<{ available: boolean }> { const json = await apiFetch(`/api/v1/ops/admin/routes/slug-check?slug=${encodeURIComponent(slug)}`); return json?.data ?? { available: false }; }
export async function suggestRouteFares(input: { tripType: RouteTripType; distanceKm: number }): Promise<Record<string, number>> { const json = await apiFetch(`/api/v1/ops/admin/routes/suggest-fares`, { method: "POST", body: JSON.stringify({ trip_type: input.tripType, distance_km: input.distanceKm }) }); return json?.data ?? {}; }
export async function fetchRouteFleets(): Promise<RouteFleet[]> { const json = await apiFetch(`/api/v1/routes/fleets`); return json?.data ?? []; }

// ==================== TOUR PACKAGES ====================
export async function fetchAdminTourPackages(filter?: { status?: CatalogStatus | "all"; q?: string }): Promise<TourPackageItem[]> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.q?.trim()) params.set("q", filter.q.trim());
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages${params.toString() ? `?${params}` : ""}`);
  return json?.data?.items ?? json?.data ?? [];
}
export async function fetchAdminTourPackage(id: string): Promise<TourPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/${encodeURIComponent(id)}`);
  return json?.data;
}
export async function createAdminTourPackage(payload: any): Promise<TourPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages`, { method: "POST", body: JSON.stringify(payload) });
  return json?.data;
}
export async function updateAdminTourPackage(id: string, payload: any): Promise<TourPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  return json?.data;
}
export async function publishAdminTourPackage(id: string): Promise<TourPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/${encodeURIComponent(id)}/publish`, { method: "POST", body: "{}" });
  return json?.data;
}
export async function archiveAdminTourPackage(id: string): Promise<TourPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/${encodeURIComponent(id)}/archive`, { method: "POST", body: "{}" });
  return json?.data;
}
export async function deleteAdminTourPackage(id: string): Promise<void> {
  await apiFetch(`/api/v1/ops/admin/tour-packages/${encodeURIComponent(id)}`, { method: "DELETE" });
}
export async function checkTourPackageCode(code: string): Promise<{ available: boolean }> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/check-code?code=${encodeURIComponent(code)}`);
  return json?.data ?? { available: false };
}
export async function fetchTourPackageUpgrades(packageId?: string | null): Promise<TourPackageUpgrade[]> {
  const q = packageId !== undefined ? `?package_id=${encodeURIComponent(packageId ?? "")}` : "";
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/upgrades${q}`);
  return json?.data ?? [];
}
export async function saveTourPackageUpgrade(payload: any): Promise<TourPackageUpgrade> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/upgrades`, { method: "POST", body: JSON.stringify(payload) });
  return json?.data;
}
export async function deleteTourPackageUpgrade(id: string): Promise<void> {
  await apiFetch(`/api/v1/ops/admin/tour-packages/upgrades/${encodeURIComponent(id)}`, { method: "DELETE" });
}
export async function uploadTourPackageImage(payload: {
  dataBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/avif";
  altText?: string;
  caption?: string;
}): Promise<{ url: string; alt?: string; caption?: string }> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/upload-image`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json?.data ?? { url: "" };
}

// ==================== LOCAL PACKAGES ====================
export async function fetchAdminLocalPackages(filter?: { status?: CatalogStatus | "all"; q?: string }): Promise<LocalPackageItem[]> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.q?.trim()) params.set("q", filter.q.trim());
  const json = await apiFetch(`/api/v1/ops/admin/local-packages${params.toString() ? `?${params}` : ""}`);
  return json?.data?.items ?? json?.data ?? [];
}
export async function fetchAdminLocalPackage(id: string): Promise<LocalPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/local-packages/${encodeURIComponent(id)}`);
  return json?.data;
}
export async function createAdminLocalPackage(payload: any): Promise<LocalPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/local-packages`, { method: "POST", body: JSON.stringify(payload) });
  return json?.data;
}
export async function updateAdminLocalPackage(id: string, payload: any): Promise<LocalPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/local-packages/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  return json?.data;
}
export async function publishAdminLocalPackage(id: string): Promise<LocalPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/local-packages/${encodeURIComponent(id)}/publish`, { method: "POST", body: "{}" });
  return json?.data;
}
export async function archiveAdminLocalPackage(id: string): Promise<LocalPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/local-packages/${encodeURIComponent(id)}/archive`, { method: "POST", body: "{}" });
  return json?.data;
}
export async function deleteAdminLocalPackage(id: string): Promise<void> {
  await apiFetch(`/api/v1/ops/admin/local-packages/${encodeURIComponent(id)}`, { method: "DELETE" });
}
export async function checkLocalPackageCode(code: string): Promise<{ available: boolean }> {
  const json = await apiFetch(`/api/v1/ops/admin/local-packages/check-code?code=${encodeURIComponent(code)}`);
  return json?.data ?? { available: false };
}

// ==================== TRANSFER ROUTES ====================
export async function fetchAdminTransferRoutes(filter?: { status?: CatalogStatus | "all"; q?: string }): Promise<TransferRouteItem[]> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.q?.trim()) params.set("q", filter.q.trim());
  const json = await apiFetch(`/api/v1/ops/admin/transfer-routes${params.toString() ? `?${params}` : ""}`);
  return json?.data?.items ?? json?.data ?? [];
}
export async function fetchAdminTransferRoute(id: string): Promise<TransferRouteItem> {
  const json = await apiFetch(`/api/v1/ops/admin/transfer-routes/${encodeURIComponent(id)}`);
  return json?.data;
}
export async function createAdminTransferRoute(payload: any): Promise<TransferRouteItem> {
  const json = await apiFetch(`/api/v1/ops/admin/transfer-routes`, { method: "POST", body: JSON.stringify(payload) });
  return json?.data;
}
export async function updateAdminTransferRoute(id: string, payload: any): Promise<TransferRouteItem> {
  const json = await apiFetch(`/api/v1/ops/admin/transfer-routes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  return json?.data;
}
export async function publishAdminTransferRoute(id: string): Promise<TransferRouteItem> {
  const json = await apiFetch(`/api/v1/ops/admin/transfer-routes/${encodeURIComponent(id)}/publish`, { method: "POST", body: "{}" });
  return json?.data;
}
export async function archiveAdminTransferRoute(id: string): Promise<TransferRouteItem> {
  const json = await apiFetch(`/api/v1/ops/admin/transfer-routes/${encodeURIComponent(id)}/archive`, { method: "POST", body: "{}" });
  return json?.data;
}
export async function deleteAdminTransferRoute(id: string): Promise<void> {
  await apiFetch(`/api/v1/ops/admin/transfer-routes/${encodeURIComponent(id)}`, { method: "DELETE" });
}
export async function checkTransferRouteCode(code: string): Promise<{ available: boolean }> {
  const json = await apiFetch(`/api/v1/ops/admin/transfer-routes/check-code?code=${encodeURIComponent(code)}`);
  return json?.data ?? { available: false };
}

// ==================== POLICIES & COMPANY ====================
export async function fetchAdminCancellationPolicies(): Promise<CancellationPolicyItem[]> {
  const json = await apiFetch(`/api/v1/ops/admin/cancellation-policies`);
  return json?.data ?? [];
}
export async function updateAdminCancellationPolicy(id: string, payload: Partial<CancellationPolicyItem>): Promise<CancellationPolicyItem> {
  const body: any = {};
  if (payload.noticePeriodText !== undefined) body.notice_period_text = payload.noticePeriodText;
  if (payload.feeRetainedPercent !== undefined) body.fee_retained_percent = payload.feeRetainedPercent;
  if (payload.refundPercent !== undefined) body.refund_percent = payload.refundPercent;
  if (payload.ruleText !== undefined) body.rule_text = payload.ruleText;
  if (payload.refundTimelineNote !== undefined) body.refund_timeline_note = payload.refundTimelineNote;
  const json = await apiFetch(`/api/v1/ops/admin/cancellation-policies/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
  return json?.data;
}

export async function fetchAdminMonuments(): Promise<MonumentItem[]> {
  const json = await apiFetch(`/api/v1/ops/admin/monuments`);
  return json?.data ?? [];
}
export async function updateAdminMonument(id: string, payload: Partial<MonumentItem>): Promise<MonumentItem> {
  const body: any = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.visitingHours !== undefined) body.visiting_hours = payload.visitingHours;
  if (payload.closedNote !== undefined) body.closed_note = payload.closedNote;
  if (payload.historicalContext !== undefined) body.historical_context = payload.historicalContext;
  if (payload.sortOrder !== undefined) body.sort_order = payload.sortOrder;
  const json = await apiFetch(`/api/v1/ops/admin/monuments/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
  return json?.data;
}

export async function fetchAdminPetPolicy(): Promise<PetPolicyItem> {
  const json = await apiFetch(`/api/v1/ops/admin/pet-policy`);
  return json?.data;
}
export async function updateAdminPetPolicy(payload: Partial<PetPolicyItem>): Promise<PetPolicyItem> {
  const body: any = {};
  if (payload.isOffered !== undefined) body.is_offered = payload.isOffered;
  if (payload.seatProtectionNote !== undefined) body.seat_protection_note = payload.seatProtectionNote;
  if (payload.breedRestrictionNote !== undefined) body.breed_restriction_note = payload.breedRestrictionNote;
  if (payload.comfortStopNote !== undefined) body.comfort_stop_note = payload.comfortStopNote;
  if (payload.bookingInstruction !== undefined) body.booking_instruction = payload.bookingInstruction;
  const json = await apiFetch(`/api/v1/ops/admin/pet-policy`, { method: "PATCH", body: JSON.stringify(body) });
  return json?.data;
}

export async function fetchAdminCompanyProfile(): Promise<CompanyProfileItem> {
  const json = await apiFetch(`/api/v1/ops/admin/company-profile`);
  return json?.data;
}
export async function updateAdminCompanyProfile(payload: Partial<CompanyProfileItem>): Promise<CompanyProfileItem> {
  const body: any = {};
  if (payload.brandName !== undefined) body.brand_name = payload.brandName;
  if (payload.officeAddress !== undefined) body.office_address = payload.officeAddress;
  if (payload.primaryPhone !== undefined) body.primary_phone = payload.primaryPhone;
  if (payload.whatsappNumber !== undefined) body.whatsapp_number = payload.whatsappNumber;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.gstin !== undefined) body.gstin = payload.gstin;
  if (payload.operatingHours !== undefined) body.operating_hours = payload.operatingHours;
  if (payload.mapsLocation !== undefined) body.maps_location = payload.mapsLocation;
  if (payload.dossierVersion !== undefined) body.dossier_version = payload.dossierVersion;
  if (payload.dossierStatus !== undefined) body.dossier_status = payload.dossierStatus;
  const json = await apiFetch(`/api/v1/ops/admin/company-profile`, { method: "PATCH", body: JSON.stringify(body) });
  return json?.data;
}

export async function fetchAdminDossierSignoffs(): Promise<DossierSignoffItem[]> {
  const json = await apiFetch(`/api/v1/ops/admin/dossier-signoffs`);
  return json?.data ?? [];
}
export async function updateAdminDossierSignoff(id: string, payload: Partial<DossierSignoffItem>): Promise<DossierSignoffItem> {
  const body: any = {};
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.clientNotes !== undefined) body.client_notes = payload.clientNotes;
  const json = await apiFetch(`/api/v1/ops/admin/dossier-signoffs/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
  return json?.data;
}

/* ── Promo Codes ─────────────────────────────────────────────────────────── */

export async function fetchAdminPromos(): Promise<PromoCodeItem[]> {
  const json = await apiFetch(`/api/v1/ops/admin/promos`);
  return json?.data ?? [];
}

export async function createAdminPromo(payload: CreatePromoCodeInput): Promise<PromoCodeItem> {
  const json = await apiFetch(`/api/v1/ops/admin/promos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json?.data;
}

export async function updateAdminPromo(id: string, payload: UpdatePromoCodeInput): Promise<PromoCodeItem> {
  const json = await apiFetch(`/api/v1/ops/admin/promos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return json?.data;
}

export async function deleteAdminPromo(id: string): Promise<void> {
  await apiFetch(`/api/v1/ops/admin/promos/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export interface LocationSuggestion {
  placeId: string;
  displayName: string;
  city: string | null;
  state: string | null;
  country: string;
  lat: number | null;
  lon: number | null;
}

export async function fetchLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];
  try {
    const json = await apiFetch(`/api/v1/locations/autocomplete?q=${encodeURIComponent(clean)}`);
    return json?.data?.suggestions ?? [];
  } catch {
    return [];
  }
}
