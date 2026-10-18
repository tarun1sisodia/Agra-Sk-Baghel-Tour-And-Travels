import {
  OptionsRequest,
  OptionsResponse,
  QuoteRequest,
  QuoteResponse,
  CreateBookingRequest,
  BookingCreateResponse,
  BookingDetailResponse,
  PaymentOrderResponse,
  PublishedCatalogResponse,
  PublishedProductSummary,
  PublishedProductDetail,
  PublicReviewItem,
  PublicGalleryItem,
  type CategoryCode,
} from "../contracts/fare-system.js";
import { z } from "zod";

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, "");
  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return envUrl || "http://localhost:4000";
  }
  return envUrl || "";
}

export class CleanFareApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: any
  ) {
    super(message);
    this.name = "CleanFareApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  schema?: z.ZodType<T>
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;

  // Safely normalize caller headers whether plain object, array of entries, or Headers instance
  const customHeaders = options?.headers instanceof Headers
    ? Object.fromEntries(options.headers.entries())
    : Array.isArray(options?.headers)
    ? Object.fromEntries(options.headers)
    : (options?.headers as Record<string, string> | undefined) || {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new CleanFareApiError(
      body.error || "API_ERROR",
      body.message || res.statusText,
      res.status,
      body.details || body
    );
  }

  if (schema) {
    const parseResult = schema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      }));
      throw new CleanFareApiError(
        "CONTRACT_VALIDATION_ERROR",
        "The service returned an unexpected response. Please retry shortly.",
        502,
        issues,
      );
    }
    return parseResult.data;
  }

  return body as T;
}

import generatedPublishedRoutes from "../data/generated-published-routes.json";
import generatedPublishedLocalPackages from "../data/generated-published-local-packages.json";
import generatedPublishedTransferRoutes from "../data/generated-published-transfer-routes.json";
import generatedPublishedTourPackages from "../data/generated-published-tour-packages.json";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function getFallbackPublishedCatalog(): PublishedCatalogResponse {
  const products: PublishedProductSummary[] = [];

  // 1. Outstation Routes
  (generatedPublishedRoutes as any[]).forEach((r, idx) => {
    const rawId = r.id && UUID_REGEX.test(r.id) ? r.id : `c0000000-0000-4000-a000-${String(idx + 1).padStart(12, "0")}`;
    products.push({
      id: rawId,
      category: "outstation",
      code: r.slug || `outstation-${idx + 1}`,
      name: `${r.sourceCity || "Agra"} to ${r.destinationCity || "Delhi"}`,
      description: `Verified outstation corridor via ${r.highway || "Expressway"}.`,
      starting_price_inr: r.faresInr?.sedan ?? 2800,
      status: "published",
      distance_km: r.distanceKm ?? 210,
      duration_minutes: 210,
    });
  });

  // 2. Local Sightseeing Packages
  (generatedPublishedLocalPackages as any[]).forEach((lp, idx) => {
    const rawId = lp.id && UUID_REGEX.test(lp.id) ? lp.id : `f0000000-0000-4000-a000-${String(idx + 1).padStart(12, "0")}`;
    products.push({
      id: rawId,
      category: "local_package",
      code: lp.slug || lp.packageCode || `local-package-${idx + 1}`,
      name: lp.name || "Agra Sightseeing",
      description: lp.covers || lp.description || "Agra local sightseeing charter",
      starting_price_inr: lp.fleetPrices?.sedan ?? 1900,
      status: "published",
      distance_km: lp.includedKm ?? 80,
      duration_minutes: (lp.durationHours || 8) * 60,
    });
  });

  // 3. Transfers
  (generatedPublishedTransferRoutes as any[]).forEach((tr, idx) => {
    const rawId = tr.id && UUID_REGEX.test(tr.id) ? tr.id : `e0000000-0000-4000-a000-${String(idx + 1).padStart(12, "0")}`;
    products.push({
      id: rawId,
      category: "transfer",
      code: tr.slug || tr.routeCode || `transfer-${idx + 1}`,
      name: tr.name || "Transfer",
      description: tr.directionNote || "Direct station / airport transfer",
      starting_price_inr: tr.fleetPrices?.sedan ?? 800,
      status: "published",
      distance_km: 20,
      duration_minutes: 45,
    });
  });

  // 4. Tour Packages
  (generatedPublishedTourPackages as any[]).forEach((tp, idx) => {
    const rawId = tp.id && UUID_REGEX.test(tp.id) ? tp.id : `d0000000-0000-4000-a000-${String(idx + 1).padStart(12, "0")}`;
    products.push({
      id: rawId,
      category: "tour_package",
      code: tp.slug || tp.packageCode || `tour-package-${idx + 1}`,
      name: tp.name || tp.title || "Tour Package",
      description: tp.inclusionsHighlight || tp.shortDescription || "Curated multi-day package",
      starting_price_inr: tp.startingPriceInr ?? (tp.fleetPrices?.sedan ?? 3499),
      status: "published",
      distance_km: null,
      duration_minutes: (tp.days || 1) * 24 * 60,
    });
  });

  return {
    products,
    groups: [
      { group_code: "sedan", name: "Sedan", driver_allowance_per_day: 400, one_way_night_charge: 250, round_trip_halt_per_night: 300, sort_order: 1 },
      { group_code: "suv", name: "SUV", driver_allowance_per_day: 500, one_way_night_charge: 300, round_trip_halt_per_night: 400, sort_order: 2 },
      { group_code: "luxury", name: "Luxury", driver_allowance_per_day: 700, one_way_night_charge: 500, round_trip_halt_per_night: 600, sort_order: 3 },
      { group_code: "tempo_traveller", name: "Tempo Traveller", driver_allowance_per_day: 800, one_way_night_charge: 600, round_trip_halt_per_night: 800, sort_order: 4 },
    ],
    vehicles: [
      { id: "a0000000-0000-4000-a000-000000000001", group_code: "sedan", make: "Maruti", model_name: "Dzire", display_name: "Maruti Dzire", passenger_capacity: 4, luggage_capacity: 2, image_url: "/assets/fleet/dzire.webp" },
      { id: "a0000000-0000-4000-a000-000000000002", group_code: "sedan", make: "Toyota", model_name: "Etios", display_name: "Toyota Etios", passenger_capacity: 4, luggage_capacity: 3, image_url: "/assets/fleet/etios.webp" },
      { id: "a0000000-0000-4000-a000-000000000003", group_code: "suv", make: "Maruti", model_name: "Ertiga", display_name: "Maruti Ertiga", passenger_capacity: 6, luggage_capacity: 3, image_url: "/assets/fleet/ertiga.webp" },
      { id: "a0000000-0000-4000-a000-000000000004", group_code: "suv", make: "Toyota", model_name: "Innova Crysta", display_name: "Innova Crysta", passenger_capacity: 6, luggage_capacity: 4, image_url: "/assets/fleet/innova.webp" },
      { id: "a0000000-0000-4000-a000-000000000005", group_code: "luxury", make: "Mercedes-Benz", model_name: "E-Class", display_name: "Mercedes E-Class", passenger_capacity: 4, luggage_capacity: 3, image_url: "/assets/fleet/mercedes.webp" },
      { id: "a0000000-0000-4000-a000-000000000006", group_code: "luxury", make: "BMW", model_name: "5-Series", display_name: "BMW 5-Series", passenger_capacity: 4, luggage_capacity: 3, image_url: "/assets/fleet/bmw.webp" },
      { id: "a0000000-0000-4000-a000-000000000007", group_code: "tempo_traveller", make: "Force", model_name: "Tempo Traveller 12", display_name: "Tempo Traveller (12S)", passenger_capacity: 12, luggage_capacity: 8, image_url: "/assets/fleet/tempo-traveller.webp" },
      { id: "a0000000-0000-4000-a000-000000000008", group_code: "tempo_traveller", make: "Force", model_name: "Urbania", display_name: "Force Urbania Luxury", passenger_capacity: 10, luggage_capacity: 8, image_url: "/assets/fleet/urbania.webp" },
    ],
  };
}

// 1. Published Catalog
export async function fetchPublishedCatalog(): Promise<PublishedCatalogResponse> {
  try {
    const res = await apiRequest<PublishedCatalogResponse>(
      "/api/v1/catalog",
      { method: "GET" },
      PublishedCatalogResponse
    );
    if (res && Array.isArray(res.products) && res.products.length > 0 && Array.isArray(res.groups) && res.groups.length > 0) {
      return res;
    }
    const fallback = getFallbackPublishedCatalog();
    return {
      products: res?.products && res.products.length > 0 ? res.products : fallback.products,
      groups: res?.groups && res.groups.length > 0 ? res.groups : fallback.groups,
      vehicles: res?.vehicles && res.vehicles.length > 0 ? res.vehicles : fallback.vehicles,
    };
  } catch (err) {
    console.warn("fetchPublishedCatalog: live API unavailable, returning fallback catalog.", err);
    return getFallbackPublishedCatalog();
  }
}

// 2. Published Product Detail
export async function fetchPublishedProduct(
  category: CategoryCode | string,
  code: string
): Promise<PublishedProductDetail> {
  try {
    return await apiRequest<PublishedProductDetail>(
      `/api/v1/catalog/${category}/${code}`,
      { method: "GET" },
      PublishedProductDetail
    );
  } catch (err) {
    const catalog = getFallbackPublishedCatalog();
    const found = catalog.products.find((p) => p.code.toLowerCase() === code.toLowerCase() || p.id.toLowerCase() === code.toLowerCase());
    if (found) {
      return {
        ...found,
        gallery: [found.image_url || "/assets/packages/agra-fort.webp"],
        inclusions: ["Verified AC Vehicle", "Tolls & State Taxes", "Chauffeur Allowance"],
        exclusions: ["Monument Entry Fees", "Personal Expenses"],
        highlights: found.description || "Scenic travel corridor with professional chauffeur.",
        notes: "Flexible departure times. 24/7 dispatch support.",
        itinerary: null,
        origin: null,
        destination: null,
        pickup_name: null,
        drop_name: null,
        covers: null,
        duration_hours: found.duration_minutes ? Math.round(found.duration_minutes / 60) : 8,
        included_km: found.distance_km ?? 80,
        related_products: catalog.products.filter((p) => p.category === found.category && p.code !== found.code).slice(0, 3),
      };
    }
    throw err;
  }
}

// 3. Quotes Options (Grouped Availability)
export async function fetchQuoteOptions(req: OptionsRequest): Promise<OptionsResponse> {
  const parseResult = OptionsRequest.safeParse(req);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new CleanFareApiError(
      "INVALID_OPTIONS_PAYLOAD",
      `Invalid quote request parameters: ${issues}`,
      400,
      parseResult.error.issues
    );
  }
  return apiRequest<OptionsResponse>(
    "/api/v1/quotes/options",
    {
      method: "POST",
      body: JSON.stringify(parseResult.data),
    },
    OptionsResponse
  );
}

// 4. Exact Fare Quote
export async function fetchQuote(req: QuoteRequest): Promise<QuoteResponse> {
  const parseResult = QuoteRequest.safeParse(req);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new CleanFareApiError(
      "INVALID_QUOTE_PAYLOAD",
      `Invalid quote parameters: ${issues}`,
      400,
      parseResult.error.issues
    );
  }
  return apiRequest<QuoteResponse>(
    "/api/v1/quotes",
    {
      method: "POST",
      body: JSON.stringify(parseResult.data),
    },
    QuoteResponse
  );
}

// 5. Create Booking
export async function createBooking(
  req: CreateBookingRequest,
  accessToken?: string | null
): Promise<BookingCreateResponse> {
  const parseResult = CreateBookingRequest.safeParse(req);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new CleanFareApiError(
      "INVALID_BOOKING_PAYLOAD",
      `Please select a valid commercial vehicle model and check all booking details before proceeding (${issues}).`,
      400,
      parseResult.error.issues
    );
  }
  const headers: Record<string, string> = {};
  if (accessToken && accessToken.trim()) {
    headers["Authorization"] = `Bearer ${accessToken.trim()}`;
  }
  const raw = await apiRequest<any>(
    "/api/v1/bookings",
    {
      method: "POST",
      headers,
      body: JSON.stringify(parseResult.data),
    }
  );
  const b = raw?.booking || raw;
  const formatted: BookingCreateResponse = {
    booking_id: b.booking_id || b.id,
    ticket_id: b.ticket_id,
    guest_access_token: b.guest_access_token || "",
    status: b.status || "pending_payment",
    total_amount: Number(b.total_amount),
    advance_amount: Number(b.advance_amount),
    balance_amount: Number(b.balance_amount),
    fare_breakdown: b.fare_breakdown,
  };
  return BookingCreateResponse.parse(formatted);
}

// 6. Booking Detail / Status
export async function fetchBookingById(
  id: string,
  guestToken?: string,
  accessToken?: string | null
): Promise<BookingDetailResponse> {
  const headers: Record<string, string> = {};
  if (guestToken && guestToken.trim()) {
    headers["x-guest-token"] = guestToken.trim();
  }
  if (accessToken && accessToken.trim()) {
    headers["Authorization"] = `Bearer ${accessToken.trim()}`;
  }
  const raw = await apiRequest<any>(
    `/api/v1/bookings/${id}`,
    { method: "GET", headers }
  );
  const b = raw?.booking || raw;
  if (!b) {
    throw new CleanFareApiError("NOT_FOUND", "Booking not found", 404);
  }

  return BookingDetailResponse.parse(b);
}

// 7. Payment Order (Razorpay)
export async function createBookingPayment(
  bookingId: string,
  guestToken?: string,
  accessToken?: string | null
): Promise<PaymentOrderResponse> {
  const headers: Record<string, string> = {};
  if (guestToken && guestToken.trim()) {
    headers["x-guest-token"] = guestToken.trim();
  }
  if (accessToken && accessToken.trim()) {
    headers["Authorization"] = `Bearer ${accessToken.trim()}`;
  }
  const raw = await apiRequest<any>(
    `/api/v1/bookings/${bookingId}/payment`,
    { method: "POST", headers }
  );
  const p = raw?.payment || raw;
  if (!p) {
    throw new CleanFareApiError("SERVER_ERROR", "Payment order creation failed", 500);
  }
  return PaymentOrderResponse.parse(p);
}

export async function verifyBookingPayment(
  bookingId: string,
  paymentDetails: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  },
  guestToken?: string,
  accessToken?: string | null
): Promise<{ status: string }> {
  const headers: Record<string, string> = {};
  if (guestToken && guestToken.trim()) {
    headers["x-guest-token"] = guestToken.trim();
  }
  if (accessToken && accessToken.trim()) {
    headers["Authorization"] = `Bearer ${accessToken.trim()}`;
  }
  return apiRequest<{ status: string }>(
    `/api/v1/bookings/${bookingId}/verify-payment`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(paymentDetails),
    }
  );
}

// 8. Public Reviews
export async function fetchPublicReviews(): Promise<PublicReviewItem[]> {
  const data = await apiRequest<any>("/api/v1/public/reviews", { method: "GET" });
  const list = Array.isArray(data) ? data : data.reviews || [];
  return list;
}

// 9. Public Gallery
export async function fetchPublicGallery(): Promise<PublicGalleryItem[]> {
  const data = await apiRequest<any>("/api/v1/public/gallery", { method: "GET" });
  const list = Array.isArray(data) ? data : data.gallery || [];
  return list;
}

// 10. Review Link & Submission
export async function fetchReviewLink(token: string): Promise<any> {
  return apiRequest<any>(`/api/v1/reviews/links/${encodeURIComponent(token)}`, { method: "GET" });
}

export async function submitReview(token: string, payload: any): Promise<any> {
  return apiRequest<any>(`/api/v1/reviews/links/${encodeURIComponent(token)}/submissions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 11. Customer Account & Bookings
export interface MyProfileResponse {
  fullName: string | null;
  phone: string | null;
  email: string | null;
}

export interface MyBookingsItem {
  id: string;
  ticketId: string;
  status: string;
  tripType: string;
  vehicleTier: string;
  originName: string | null;
  destinationName: string | null;
  bookingSelection: any | null;
  pickupAddress: string;
  dropAddress: string | null;
  pickupDatetime: string;
  returnDatetime: string | null;
  distanceKm: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fare: {
    totalFare?: number;
    advanceAmount?: number;
    balanceAmount?: number;
    baseFare?: number;
    driverAllowance?: number;
    nightAllowance?: number;
    discountAmount?: number;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MyBookingsResponse {
  items: MyBookingsItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchMyProfile(accessToken: string): Promise<MyProfileResponse> {
  return apiRequest<MyProfileResponse>("/api/v1/me/profile", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchMyBookings(
  accessToken: string,
  page = 1,
  pageSize = 20
): Promise<MyBookingsResponse> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest<MyBookingsResponse>(`/api/v1/me/bookings?${query.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchMyBooking(
  bookingId: string,
  accessToken: string
): Promise<MyBookingsItem> {
  return apiRequest<MyBookingsItem>(`/api/v1/me/bookings/${encodeURIComponent(bookingId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
