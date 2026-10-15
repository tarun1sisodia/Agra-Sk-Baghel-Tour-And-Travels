export type AdminRole = "super_admin";

export interface AdminUser {
  id: string;
  role: AdminRole;
  name: string;
  email: string;
  token: string;
}

export type BookingStatus =
  | "draft"
  | "pending_payment"
  | "paid_confirmed"
  | "in_transit"
  | "completed"
  | "cancelled"
  | "refunded";

export type TripType =
  | "one-way"
  | "round-trip"
  | "local-tour"
  | "airport-transfer"
  | "local-hourly"
  | "custom-tour";

export type CanonicalBookingSelection =
  | { kind: "outstation"; id: string; tripType: "one-way" | "round-trip"; originName: string; destinationName: string; name?: string }
  | { kind: "local"; id: string; source: "catalog" | "curated" | "historical"; slug?: string; tripType: "local-tour" | "airport-transfer"; localPackageKey?: "8hr-80km" | "12hr-120km" | "airport-transfer"; pickupLocation: string; transferTarget?: string; name?: string }
  | { kind: "package"; id: string; source: "catalog" | "curated" | "historical"; slug: string; name?: string };

export type VehicleTier =
  | "sedan"
  | "ertiga"
  | "innova-crysta"
  | "tempo-traveller"
  | "urbania";

export interface FareSnapshot {
  baseFare: number;
  nightAllowance: number;
  driverAllowance: number;
  tollsTaxes: number;
  promoDiscount: number;
  discountAmount?: number;
  totalFare: number;
  advancePaid: number;
  advanceAmount?: number;
  balancePayable: number;
  balanceAmount?: number;
}

export interface Booking {
  id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  origin: string;
  destination: string;
  originName?: string;
  destinationName?: string;
  bookingSelection?: CanonicalBookingSelection | null;
  selectedCatalogItemId?: string | null;
  pickupDateTime: string;
  pickupDatetime?: string;
  returnDateTime: string | null;
  returnDatetime?: string | null;
  distanceKm: number;
  tripType: TripType;
  vehicleTier: VehicleTier;
  status: BookingStatus;
  version: number;
  notes: string;
  specialNotes?: string;
  createdAt: string;
  fare: FareSnapshot;
}

export type PaymentMethod = "upi" | "card" | "netbanking" | "paypal";
export type PaymentProvider = "razorpay" | "paypal" | "card";
export type PaymentStatus = "captured" | "refunded" | "pending" | "failed" | "needs_review";

export interface Payment {
  id: string;
  bookingTicketId: string;
  provider: PaymentProvider;
  method: PaymentMethod | null;
  providerPaymentId: string | null;
  providerOrderId: string;
  checkoutSessionId: string | null;
  checkoutUrl: string | null;
  webhookEventId: string | null;
  reconciliationStatus: "pending" | "matched" | "needs_review";
  amount: number;
  status: PaymentStatus;
  capturedAt: string | null;
}

export type CatalogStatus = "draft" | "published" | "archived";
export type CatalogCategory = "ride" | "tour" | "package" | "route" | "vehicle" | "place";
export type CatalogAvailability = "available" | "limited" | "unavailable";
export type CatalogTripType = "one-way" | "round-trip" | "local-tour" | "airport-transfer";

/**
 * Gallery policy (client-confirmed rule): "Famous Places & Monuments" (place)
 * items carry a multi-image gallery; every other category uses exactly one
 * cover image.
 */
export const CATALOG_MEDIA_LIMITS: Record<CatalogCategory, number> = {
  place: 12,
  ride: 1,
  tour: 1,
  package: 1,
  route: 1,
  vehicle: 1,
};

export interface CatalogMedia {
  id: string;
  catalogItemId: string;
  mediaType: "image" | "video";
  altText: string;
  caption: string | null;
  sortOrder: number;
  status: CatalogStatus;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  slug: string;
  category: CatalogCategory;
  summary: string;
  duration: string;
  startingPrice: number;
  status: CatalogStatus;
  updatedAt: string;
  places: string[];
  distanceKm: number | null;
  availability: CatalogAvailability;
  seatsLeft: number | null;
  stops: string[];
  tripType: CatalogTripType | null;
}

export type ReviewModerationStatus = "pending" | "approved" | "rejected";
export type ReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "pending_review"
  | "published"
  | "archived";

export interface Review {
  id: string;
  customerName: string;
  ticketId: string;
  route: string;
  rating: number;
  text: string;
  status: ReviewModerationStatus;
  showOnHomepage: boolean;
  showInGallery: boolean;
  consentPublic: boolean;
  bookingStatus: string | null;
  verifiedBooking: boolean;
  socialPlatform?: string | null;
  socialUsername?: string | null;
  socialUrl?: string | null;
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  images?: Array<{ id: string; storage_key: string; status: string; alt_text?: string | null }>;
}

export type InquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "converted"
  | "resolved"
  | "closed"
  | "spam";
export type InquiryType = "custom_tour" | "group_charter" | "contact" | "local_tour" | "outstation";

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: InquiryType;
  subject: string;
  message: string;
  status: InquiryStatus;
  notes: string[];
  createdAt: string;
}

export type RentalStatus = "new" | "contacted" | "quoted" | "done" | "closed" | "spam";
export interface RentalEnquiry { id: string; ref: string; name: string; phone: string; email?: string | null; carTier: string; pickupDate: string; returnDate: string; pickupLocation: string; withDriver: boolean; note?: string | null; status: RentalStatus; notes: string[]; createdAt: string; updatedAt: string; }
export interface FareRule {
  vehicleTier: VehicleTier;
  label: string;
  seats: number;
  perKm: number;
  minDailyKm: number;
  nightChargePerHour: number;
  driverAllowance: number;
  active: boolean;
}

export interface FareRuleset {
  version: string;
  effectiveFrom: string;
  nightWindow: string;
  rules: FareRule[];
  notes: string[];
}

export type AuditAction =
  | "BOOKING_STATUS_CHANGED"
  | "BOOKING_UNMASK_VIEWED"
  | "REFUND_REQUESTED"
  | "REFUND_EXECUTED"
  | "CATALOG_DRAFTED"
  | "CATALOG_PUBLISHED"
  | "CATALOG_ARCHIVED"
  | "REVIEW_APPROVED"
  | "REVIEW_REJECTED"
  | "REVIEW_PUBLISHED"
  | "INQUIRY_UPDATED"
  | "LOGIN";

export interface AuditEntry {
  id: string;
  action: AuditAction;
  actor: string;
  actorRole: AdminRole;
  resourceType: string;
  resourceId: string;
  ip: string;
  detail: string;
  at: string;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  bookings: number;
}

export const VEHICLE_LABELS: Record<VehicleTier, string> = {
  sedan: "Sedan",
  ertiga: "Ertiga",
  "innova-crysta": "Innova Crysta",
  "tempo-traveller": "Tempo Traveller",
  urbania: "Force Urbania",
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
};

export type AdminPermission =
  | "bookings:read"
  | "bookings:transition"
  | "bookings:unmask"
  | "finance:read"
  | "finance:refund"
  | "catalog:create"
  | "catalog:edit"
  | "catalog:publish"
  | "reviews:moderate"
  | "reviews:publish"
  | "inquiries:manage"
  | "fares:read"
  | "audit:read";

/** Permission matrix from ADMIN_PRD.md §4 */
export const PERMISSIONS: Record<AdminPermission, AdminRole[]> = {
  "bookings:read": ["super_admin"],
  "bookings:transition": ["super_admin"],
  "bookings:unmask": ["super_admin"],
  "finance:read": ["super_admin"],
  "finance:refund": ["super_admin"],
  "catalog:create": ["super_admin"],
  "catalog:edit": ["super_admin"],
  "catalog:publish": ["super_admin"],
  "reviews:moderate": ["super_admin"],
  "reviews:publish": ["super_admin"],
  "inquiries:manage": ["super_admin"],
  "fares:read": ["super_admin"],
  "audit:read": ["super_admin"],
};

export function can(role: AdminRole, permission: AdminPermission): boolean {
  return (PERMISSIONS[permission] ?? []).includes(role);
}

export type {
  RouteTripType,
  InterstateCharge,
  RouteStop,
  RouteFleet,
  RouteItem,
  RouteItem as RouteCatalogItem,
  CreateRouteInput,
  UpdateRouteInput,
} from "@/contracts/routes";

export type {
  TourPackageUpgrade,
  TourPackageGalleryImage,
  TourPackageItem,
  CreateTourPackageInput,
  UpdateTourPackageInput,
} from "@/contracts/tour-packages";

export type {
  LocalPackageItem,
  CreateLocalPackageInput,
  UpdateLocalPackageInput,
} from "@/contracts/local-packages";

export type {
  TransferRouteItem,
  CreateTransferRouteInput,
  UpdateTransferRouteInput,
} from "@/contracts/transfer-routes";

export type {
  CancellationPolicyItem,
  PetPolicyItem,
  CompanyProfileItem,
  DossierSignoffItem,
} from "@/contracts/policies";

export type {
  MonumentItem,
  CreateMonumentInput,
  UpdateMonumentInput,
} from "@/contracts/monuments";

export type {
  PromoCodeItem,
  CreatePromoCodeInput,
  UpdatePromoCodeInput,
} from "@/contracts/promos";

