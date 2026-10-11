import type { BookingSelection } from "../shared/bookingSelection.js";

export const TRIP_TYPES = [
  "one-way",
  "round-trip",
  "local-tour",
  "airport-transfer",
] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const VEHICLE_TIERS = [
  "sedan",
  "ertiga",
  "innova-crysta",
  "tempo-traveller",
  "urbania",
] as const;
export type VehicleTier = (typeof VEHICLE_TIERS)[number];

export const INTERNAL_VEHICLE_IDS = [
  "sedan",
  "ertiga",
  "innova",
  "tempo",
  "urbania",
] as const;
export type InternalVehicleId = (typeof INTERNAL_VEHICLE_IDS)[number];

export const BOOKING_STATUSES = [
  "draft",
  "pending_payment",
  "paid_confirmed",
  "in_transit",
  "completed",
  "cancelled",
  "refunded",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "captured",
  "failed",
  "refunded",
  "needs_review",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ["razorpay"] as const;
export type PaymentProviderName = (typeof PAYMENT_PROVIDERS)[number];

export const CURRENCIES = ["INR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const USER_ROLES = [
  "customer",
  "content_editor",
  "review_moderator",
  "dispatcher",
  "finance_operator",
  "super_admin",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CATALOG_TYPES = ["ride", "tour", "package", "route", "vehicle", "place"] as const;
export type CatalogType = (typeof CATALOG_TYPES)[number];

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/**
 * Commercial availability of a catalog item as managed by the operations desk.
 * - available: bookable normally
 * - limited: bookable but with constrained capacity (`seatsLeft` carries the count)
 * - unavailable: paused / sold out — hidden from customer booking CTAs
 */
export const CATALOG_AVAILABILITY = ["available", "limited", "unavailable"] as const;
export type CatalogAvailability = (typeof CATALOG_AVAILABILITY)[number];

/**
 * Gallery policy (client-confirmed rule):
 * - `place` items ("Famous Places & Monuments") carry a MULTI-image gallery.
 * - every other category (ride / tour / package / route / vehicle) uses exactly ONE cover image.
 */
export const CATALOG_MEDIA_LIMITS = { place: 12, default: 1 } as const;

export function catalogMediaLimit(type: CatalogType): number {
  return type === "place" ? CATALOG_MEDIA_LIMITS.place : CATALOG_MEDIA_LIMITS.default;
}

/** Inline (DB-backed) media upload constraints. */
export const MEDIA_MAX_BYTES = 2_500_000;
export const MEDIA_MIME_TYPES = ["image/webp", "image/jpeg", "image/png", "image/avif"] as const;
export type MediaMimeType = (typeof MEDIA_MIME_TYPES)[number];

export const REVIEW_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "published",
  "archived",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  "unverified",
  "booking_verified",
  "social_link_submitted",
  "manually_verified",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export type FareBreakdown = {
  baseFare: number;
  nightAllowance: number;
  driverAllowance: number;
  discountAmount: number;
  totalFare: number;
  advanceAmount: number;
  balanceAmount: number;
  currency: "INR";
  fareVersion: string;
  label: string;
  duration: string;
  distanceKm: number;
  billedKm: number;
  alwaysRoundTrip: boolean;
  tripType: TripType;
  vehicleTier: VehicleTier;
  promoCode: string | null;
  promoValid: boolean;
  roundMultiplierApplied: boolean;
  rules: string[];
};

export type BookingRecord = {
  id: string;
  ticketId: string;
  userId: string | null;
  guestAccessToken: string;
  tripType: TripType;
  vehicleTier: VehicleTier;
  originName: string | null;
  destinationName: string | null;
  bookingSelection: BookingSelection | null;
  selectedCatalogItemId: string | null;
  pickupAddress: string;
  dropAddress: string | null;
  pickupDatetime: string;
  returnDatetime: string | null;
  flightTrainNumber: string | null;
  distanceKm: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  baseFare: number;
  nightAllowance: number;
  driverAllowance: number;
  discountAmount: number;
  promoCode: string | null;
  totalFare: number;
  advanceAmount: number;
  balanceAmount: number;
  fareRulesVersion: string;
  fareSnapshot: FareBreakdown;
  status: BookingStatus;
  version: number;
  specialNotes: string | null;
  packageId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingIntentRecord = {
  id: string;
  idempotencyKey: string;
  resumeSecretHash: string;
  payload: unknown;
  quote: FareBreakdown;
  quoteTotalFare: number;
  quoteAdvanceAmount: number;
  quoteBalanceAmount: number;
  fareReconfirmationPending: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  consumedAt: string | null;
  claimedUserId: string | null;
  resultingBookingId: string | null;
};

export type PaymentRecord = {
  id: string;
  bookingId: string;
  provider: PaymentProviderName;
  providerOrderId: string;
  providerPaymentId: string | null;
  checkoutSessionId: string | null;
  checkoutUrl: string | null;
  publicClientToken: string | null;
  amountMinor: number;
  currency: Currency;
  inrAmountPaise: number;
  status: PaymentStatus;
  paymentMethod: string | null;
  feeMinor: number;
  taxMinor: number;
  idempotencyKey: string;
  webhookEventId: string | null;
  reconciliationStatus: "pending" | "matched" | "duplicate" | "needs_review";
  failureReason: string | null;
  verifiedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RefundRecord = {
  id: string;
  paymentId: string;
  bookingId: string;
  providerRefundId: string | null;
  amountMinor: number;
  currency: Currency;
  reason: string;
  status: "pending" | "processed" | "failed";
  idempotencyKey: string;
  createdAt: string;
};

export type ProfileRecord = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type CatalogItemRecord = {
  id: string;
  type: CatalogType;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  status: ContentStatus;
  durationText: string;
  routeSummary: string;
  startingPriceInr: number;
  /** Distance benchmark in km (outstation routes / excursion corridors). */
  distanceKm: number | null;
  availability: CatalogAvailability;
  /** Optional seat/vehicle count driving "only N left" urgency signals. */
  seatsLeft: number | null;
  /** Ordered intermediate stops between origin and destination. */
  stops: string[];
  /** Customer-facing trip classification (one-way / round-trip / local-tour / airport-transfer). */
  tripType: TripType | null;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CatalogMediaRecord = {
  id: string;
  catalogItemId: string;
  /**
   * Public URL or asset path of the media. For DB-backed uploads this is the
   * API serve route (`/api/v1/media/:id`); for path-referenced media it is the
   * asset path (e.g. `/assets/places/taj-mahal.webp`).
   */
  storagePath: string;
  mediaType: "image" | "video";
  altText: string;
  caption: string | null;
  sortOrder: number;
  status: ContentStatus;
  sourceType: "admin_upload" | "customer_upload" | "supplier";
  copyrightOwner: string | null;
  /** MIME type when the bytes are stored inline (uploads). */
  mimeType: string | null;
  /** Base64-encoded image bytes when stored inline (uploads). */
  contentBase64: string | null;
  /** Decoded size of the inline upload in bytes. */
  sizeBytes: number | null;
  createdBy: string | null;
  approvedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type ReviewRecord = {
  id: string;
  bookingId: string | null;
  catalogItemId: string | null;
  customerId: string | null;
  displayName: string;
  rating: number;
  reviewText: string;
  status: ReviewStatus;
  verificationStatus: VerificationStatus;
  socialProfileUrl: string | null;
  socialPlatform: string | null;
  verificationNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  guestAccessToken: string | null;
  createdAt: string;
};

export type PromoCodeRecord = {
  id: string;
  code: string;
  discountAmount: number;
  minTotal: number;
  description: string;
  isActive: boolean;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validTo: string | null;
  allowGroupVehicles: boolean;
  isBroadcast: boolean;
};

export type AuditLogRecord = {
  id: string;
  actorId: string;
  actorRole: UserRole;
  resourceType: string;
  resourceId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  requestId: string;
  createdAt: string;
};

export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "converted",
  "resolved",
  "closed",
  "spam",
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export type InquiryRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  tripInterest: string | null;
  status: InquiryStatus;
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

export const RENTAL_ENQUIRY_STATUSES = ["new", "contacted", "quoted", "done", "closed", "spam"] as const;
export type RentalEnquiryStatus = (typeof RENTAL_ENQUIRY_STATUSES)[number];
export type RentalCarTier = "sedan" | "ertiga" | "innova" | "tempo" | "urbania";
export type RentalEnquiryRecord = { id: string; ref: string; name: string; phone: string; email: string | null; carTier: RentalCarTier; pickupDate: string; returnDate: string; pickupLocation: string; withDriver: boolean; note: string | null; status: RentalEnquiryStatus; notes: string[]; createdAt: string; updatedAt: string; };
export type NotificationJobRecord = {
  id: string;
  bookingId: string;
  channel: "whatsapp" | "email";
  templateKey: string;
  dedupeKey: string;
  payload: Record<string, unknown>;
  status: "queued" | "sent" | "failed";
  attemptCount: number;
  providerMessageId: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WebhookEventRecord = {
  id: string;
  provider: PaymentProviderName | string;
  eventId: string;
  eventType: string;
  payload: unknown;
  payloadHash: string;
  processed: boolean;
  receivedAt: string;
};

export type LocationSuggestion = {
  placeId: string;
  displayName: string;
  city: string | null;
  state: string | null;
  country: string;
  lat: number | null;
  lon: number | null;
};

export type AuthUser = {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
};
