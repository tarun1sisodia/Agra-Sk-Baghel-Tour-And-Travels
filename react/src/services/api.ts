/**
 * Customer API Service — connects customer frontend to Fastify REST API.
 * Adheres to FIND-002 and FIND-023: transforms React BookingState into Fastify Zod contracts.
 */

export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, "");
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0")
  ) {
    return envUrl || "http://localhost:4000";
  }
  return envUrl || "";
}

import { toCanonicalTierKey, type VehicleTier } from "../contracts/vehicle-tiers";

export type BackendTripType = "one-way" | "round-trip" | "local-tour" | "airport-transfer";
export type BackendVehicleTier = VehicleTier;

export type BookingSelectionPayload =
  | { kind: "outstation"; id: string; tripType: "one-way" | "round-trip"; originName: string; destinationName: string; name?: string }
  | { kind: "local"; id: string; source: "catalog" | "curated" | "historical"; slug?: string; tripType: "local-tour" | "airport-transfer"; localPackageKey?: "8hr-80km" | "12hr-120km" | "airport-transfer"; pickupLocation: string; transferTarget?: string; name?: string }
  | { kind: "package"; id: string; source: "catalog" | "curated" | "historical"; slug: string; name?: string; originName?: string; destinationName?: string };

export interface ServerFareBreakdown {
  baseFare: number;
  nightAllowance: number;
  driverAllowance: number;
  discountAmount: number;
  totalFare: number;
  advanceAmount: number;
  balanceAmount: number;
  currency: string;
  fareVersion: string;
  label: string;
  duration: string;
  distanceKm: number;
  billedKm: number;
  alwaysRoundTrip: boolean;
  tripType: BackendTripType;
  vehicleTier: BackendVehicleTier;
  promoCode: string | null;
  promoValid: boolean;
  roundMultiplierApplied: boolean;
  rules: string[];
}

export interface CreateDraftBookingPayload {
  tripType?: BackendTripType;
  vehicleTier: BackendVehicleTier;
  originName?: string;
  destinationName?: string;
  bookingSelection?: BookingSelectionPayload;
  pickupAddress: string;
  dropAddress?: string;
  pickupDatetime: string;
  returnDatetime?: string;
  // distanceKm removed (SEC-005) — server derives from originName/destinationName via fare catalogue
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  flightTrainNumber?: string;
  specialNotes?: string;
  promoCode?: string;
  packageId?: string;
  localPackageKey?: "8hr-80km" | "12hr-120km" | "airport-transfer";
}

/**
 * Maps React VehicleId to Fastify backend vehicleTier using canonical C-ENUM-001 normalizer.
 */
export function mapVehicleTier(vehicleId: string): BackendVehicleTier {
  return toCanonicalTierKey(vehicleId) ?? "sedan";
}

export interface CreateInquiryPayload {
  name: string;
  phone: string;
  email?: string;
  message: string;
  tripInterest?: string;
}

export interface CreateInquiryResponse {
  id: string;
}

export function formatInquiryPhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (/^\+[0-9]{10,14}$/.test(cleaned)) {
    return cleaned;
  }
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }
  if (digitsOnly.length >= 10 && digitsOnly.length <= 14) {
    return `+${digitsOnly}`;
  }
  return cleaned || "+919762817598";
}

export function sanitizeInquiryName(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z\s.'-]/g, "").trim();
  return cleaned.length >= 2 ? cleaned.slice(0, 80) : "Guest Customer";
}

export async function createInquiry(
  payload: CreateInquiryPayload,
): Promise<CreateInquiryResponse> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message || `Failed to submit inquiry (status ${res.status})`;
    throw new Error(msg);
  }

  // A static-site fallback or unrelated HTTP 200 must not be treated as a
  // persisted inquiry. The backend's success envelope includes data.id.
  const id = json?.data?.id;
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new Error(
      "The server returned an invalid inquiry response. Check that VITE_API_BASE_URL points to the backend API.",
    );
  }

  return { id } as CreateInquiryResponse;
}

export interface FeaturedPromo {
  code: string;
  discountAmount: number;
  minTotal: number;
  description: string;
  allowGroupVehicles: boolean;
}

export async function fetchFeaturedPromo(): Promise<FeaturedPromo | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/promos/featured`);
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return (json?.data as FeaturedPromo) ?? null;
  } catch {
    return null;
  }
}

export interface PublicReview {
  id: string;
  display_name: string;
  rating: number;
  review_text: string;
  tour_name?: string | null;
  route_text?: string | null;
  social_url?: string | null;
  social_platform?: string | null;
  is_verified?: boolean;
  created_at: string;
}

export interface PublicGalleryItem {
  id: string;
  storage_key: string;
  width?: number;
  height?: number;
  alt_text?: string | null;
  reviewer_name: string;
  review_text: string;
}

export async function fetchPublicReviews(): Promise<PublicReview[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/public/reviews`);
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    const list = json?.reviews || json?.data || [];
    return Array.isArray(list) ? list.slice(0, 30) : [];
  } catch {
    return [];
  }
}

export async function fetchPublicGallery(): Promise<PublicGalleryItem[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/public/gallery`);
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    const list = json?.gallery || json?.data || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

