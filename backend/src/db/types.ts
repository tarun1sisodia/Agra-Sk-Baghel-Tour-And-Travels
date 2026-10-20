import type pg from "pg";
import type { RouteCatalogRecord, RouteCatalogStatus, RouteCatalogTripType } from "./route-catalog-types.js";
import type {
  CancellationPolicyRecord,
  CompanyProfileRecord,
  ContentStatus,
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
  BookingStatus,
  CatalogItemRecord,
  CatalogMediaRecord,
  InquiryRecord,
  RentalEnquiryRecord,
  RentalEnquiryStatus,
  RentalCarTier,
  CanonicalVehicleGroup,
  InquiryStatus,
  LocationSuggestion,
  NotificationJobRecord,
  PaymentRecord,
  PaymentStatus,
  ProfileRecord,
  PromoCodeRecord,
  RefundRecord,
  ReviewRecord,
  ReviewStatus,
  UserRole,
  WebhookEventRecord,
} from "../types/domain.js";

export type InquiryListFilter = {
  status?: InquiryStatus;
  q?: string;
  limit?: number;
  page?: number;
};

export type RentalEnquiryListFilter = {
  status?: RentalEnquiryStatus;
  carTier?: RentalCarTier;
  vehicleGroupCode?: CanonicalVehicleGroup;
  car?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  page?: number;
};
export type PaymentListFilter = {
  bookingId?: string;
  status?: PaymentStatus;
  provider?: string;
  limit?: number;
  page?: number;
};

export type BookingListFilter = {
  status?: BookingStatus;
  ticketId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  userId?: string;
};

export type CatalogListFilter = {
  type?: CatalogItemRecord["type"];
  status?: CatalogItemRecord["status"];
  q?: string;
};

export type RouteCatalogListFilter = { tripType?: RouteCatalogTripType; status?: RouteCatalogStatus; q?: string; page?: number; limit?: number };

export type ReviewListFilter = {
  status?: ReviewStatus;
  catalogItemId?: string;
};

export type Repositories = {
  healthCheck(): Promise<boolean>;
  transaction<T>(fn: (repos: Repositories) => Promise<T>): Promise<T>;

  bookings: {
    create(record: BookingRecord): Promise<BookingRecord>;
    update(record: BookingRecord): Promise<BookingRecord>;
    getById(id: string): Promise<BookingRecord | null>;
    getByTicketId(ticketId: string): Promise<BookingRecord | null>;
    ticketExists(ticketId: string): Promise<boolean>;
    list(filter: BookingListFilter): Promise<{ items: BookingRecord[]; total: number }>;
    /** SEC-007: targeted phone+time-window query for duplicate booking detection */
    listByPhone(phone: string, options: { from: string }): Promise<BookingRecord[]>;
  };

  bookingIntents: {
    create(record: BookingIntentRecord): Promise<BookingIntentRecord>;
    update(record: BookingIntentRecord): Promise<BookingIntentRecord>;
    getById(id: string): Promise<BookingIntentRecord | null>;
    getByIdempotencyKey(key: string): Promise<BookingIntentRecord | null>;
  };

  payments: {
    create(record: PaymentRecord): Promise<PaymentRecord>;
    update(record: PaymentRecord): Promise<PaymentRecord>;
    getById(id: string): Promise<PaymentRecord | null>;
    getByIdempotencyKey(key: string): Promise<PaymentRecord | null>;
    getByProviderOrderId(providerOrderId: string): Promise<PaymentRecord | null>;
    getByProviderPaymentId(providerPaymentId: string): Promise<PaymentRecord | null>;
    listByBookingId(bookingId: string): Promise<PaymentRecord[]>;
    getOpenByBookingId(bookingId: string): Promise<PaymentRecord | null>;
    list(filter?: PaymentListFilter): Promise<{
      items: PaymentRecord[];
      total: number;
      totalCapturedPaise: number;
      totalRefundedPaise: number;
    }>;
  };

  refunds: {
    create(record: RefundRecord): Promise<RefundRecord>;
    update(record: RefundRecord): Promise<RefundRecord>;
    getByIdempotencyKey(key: string): Promise<RefundRecord | null>;
    getByProviderRefundId(providerRefundId: string): Promise<RefundRecord | null>;
    listByBookingId(bookingId: string): Promise<RefundRecord[]>;
  };

  profiles: {
    getById(id: string): Promise<ProfileRecord | null>;
    getByRole(role: UserRole): Promise<ProfileRecord[]>;
    upsert(record: ProfileRecord): Promise<ProfileRecord>;
  };

  routeCatalog: {
    create(record: RouteCatalogRecord): Promise<RouteCatalogRecord>;
    update(record: RouteCatalogRecord): Promise<RouteCatalogRecord>;
    getById(id: string): Promise<RouteCatalogRecord | null>;
    getBySlug(slug: string): Promise<RouteCatalogRecord | null>;
    list(filter: RouteCatalogListFilter): Promise<{ items: RouteCatalogRecord[]; total: number }>;
    delete(id: string): Promise<void>;
  };

  tourPackages: {
    create(record: TourPackageRecord): Promise<TourPackageRecord>;
    update(record: TourPackageRecord): Promise<TourPackageRecord>;
    getById(id: string): Promise<TourPackageRecord | null>;
    getByCode(code: string): Promise<TourPackageRecord | null>;
    list(filter?: { status?: ContentStatus | "all"; q?: string; page?: number; limit?: number }): Promise<{ items: TourPackageRecord[]; total: number }>;
    delete(id: string): Promise<void>;
    listUpgrades(packageId?: string | null): Promise<PackageVehicleUpgradeRecord[]>;
    saveUpgrade(record: PackageVehicleUpgradeRecord): Promise<PackageVehicleUpgradeRecord>;
    deleteUpgrade(id: string): Promise<boolean>;
  };

  transferRoutes: {
    create(record: TransferRouteRecord): Promise<TransferRouteRecord>;
    update(record: TransferRouteRecord): Promise<TransferRouteRecord>;
    getById(id: string): Promise<TransferRouteRecord | null>;
    getByCode(code: string): Promise<TransferRouteRecord | null>;
    list(filter?: { status?: ContentStatus | "all"; q?: string; page?: number; limit?: number }): Promise<{ items: TransferRouteRecord[]; total: number }>;
    delete(id: string): Promise<void>;
  };

  localPackages: {
    create(record: LocalSightseeingPackageRecord): Promise<LocalSightseeingPackageRecord>;
    update(record: LocalSightseeingPackageRecord): Promise<LocalSightseeingPackageRecord>;
    getById(id: string): Promise<LocalSightseeingPackageRecord | null>;
    getByCode(code: string): Promise<LocalSightseeingPackageRecord | null>;
    list(filter?: { status?: ContentStatus | "all"; q?: string; page?: number; limit?: number }): Promise<{ items: LocalSightseeingPackageRecord[]; total: number }>;
    delete(id: string): Promise<void>;
  };

  cancellationPolicies: {
    list(): Promise<CancellationPolicyRecord[]>;
    update(record: CancellationPolicyRecord): Promise<CancellationPolicyRecord>;
  };

  monuments: {
    list(): Promise<MonumentRecord[]>;
    update(record: MonumentRecord): Promise<MonumentRecord>;
  };

  petPolicy: {
    get(): Promise<PetTaxiPolicyRecord | null>;
    update(record: PetTaxiPolicyRecord): Promise<PetTaxiPolicyRecord>;
  };

  companyProfile: {
    get(): Promise<CompanyProfileRecord | null>;
    update(record: CompanyProfileRecord): Promise<CompanyProfileRecord>;
  };

  dossierSignoffs: {
    list(): Promise<DossierSignoffRecord[]>;
    update(record: DossierSignoffRecord): Promise<DossierSignoffRecord>;
  };

  catalog: {
    create(record: CatalogItemRecord): Promise<CatalogItemRecord>;
    update(record: CatalogItemRecord): Promise<CatalogItemRecord>;
    getById(id: string): Promise<CatalogItemRecord | null>;
    getBySlug(slug: string): Promise<CatalogItemRecord | null>;
    list(filter: CatalogListFilter): Promise<CatalogItemRecord[]>;
  };

  media: {
    create(record: CatalogMediaRecord): Promise<CatalogMediaRecord>;
    update(record: CatalogMediaRecord): Promise<CatalogMediaRecord>;
    getById(id: string): Promise<CatalogMediaRecord | null>;
    listByCatalogItem(catalogItemId: string): Promise<CatalogMediaRecord[]>;
    delete(id: string): Promise<void>;
  };

  reviews: {
    create(record: ReviewRecord): Promise<ReviewRecord>;
    update(record: ReviewRecord): Promise<ReviewRecord>;
    getById(id: string): Promise<ReviewRecord | null>;
    list(filter: ReviewListFilter): Promise<ReviewRecord[]>;
    listPublishedByCatalog(catalogItemId: string): Promise<ReviewRecord[]>;
  };

  promos: {
    getByCode(code: string): Promise<PromoCodeRecord | null>;
    getById(id: string): Promise<PromoCodeRecord | null>;
    list(): Promise<PromoCodeRecord[]>;
    getFeatured(): Promise<PromoCodeRecord | null>;
    consume(code: string): Promise<PromoCodeRecord | null>;
    create(record: PromoCodeRecord): Promise<PromoCodeRecord>;
    update(record: PromoCodeRecord): Promise<PromoCodeRecord>;
    delete(id: string): Promise<boolean>;
  };

  audit: {
    append(record: AuditLogRecord): Promise<AuditLogRecord>;
    list(limit?: number): Promise<AuditLogRecord[]>;
  };

  rentalEnquiries: {
    create(record: RentalEnquiryRecord): Promise<RentalEnquiryRecord>;
    update(record: RentalEnquiryRecord): Promise<RentalEnquiryRecord>;
    getById(id: string): Promise<RentalEnquiryRecord | null>;
    list(filter?: RentalEnquiryListFilter): Promise<{ items: RentalEnquiryRecord[]; total: number }>;
  };
  inquiries: {
    create(record: InquiryRecord): Promise<InquiryRecord>;
    update(record: InquiryRecord): Promise<InquiryRecord>;
    getById(id: string): Promise<InquiryRecord | null>;
    list(filter?: InquiryListFilter): Promise<{ items: InquiryRecord[]; total: number }>;
  };

  notifications: {
    create(record: NotificationJobRecord): Promise<NotificationJobRecord>;
    update(record: NotificationJobRecord): Promise<NotificationJobRecord>;
    getByDedupeKey(key: string): Promise<NotificationJobRecord | null>;
    listQueued(): Promise<NotificationJobRecord[]>;
  };

  webhooks: {
    record(event: WebhookEventRecord): Promise<{ created: boolean; record: WebhookEventRecord }>;
    markProcessed(eventId: string): Promise<void>;
    hasEvent(eventId: string): Promise<boolean>;
  };

  locationCache: {
    get(key: string): Promise<{ suggestions: LocationSuggestion[]; storedAt: string } | null>;
    set(key: string, suggestions: LocationSuggestion[], storedAt: string): Promise<void>;
  };

  devices: {
    register(record: DeviceRegistrationRecord): Promise<DeviceRegistrationRecord>;
    getByDeviceId(deviceId: string): Promise<DeviceRegistrationRecord | null>;
    listByUserId(userId: string): Promise<DeviceRegistrationRecord[]>;
  };

  fareRules: {
    getActive(): Promise<FareRuleRecord | null>;
    getByVersion(version: string): Promise<FareRuleRecord | null>;
    listAll(): Promise<FareRuleRecord[]>;
    save(record: FareRuleRecord): Promise<FareRuleRecord>;
    activate(version: string): Promise<FareRuleRecord | null>;
  };

  publishEvents: {
    enqueue(event: PublishEventInput): Promise<PublishEventRecord>;
    getById(id: string): Promise<PublishEventRecord | null>;
    listPending(limit?: number): Promise<PublishEventRecord[]>;
  };
  pool?: pg.Pool;
};

export type PublishEventInput = {
  entityType: "outstation_route" | "local_package" | "transfer" | "tour_package" | "review" | "cancellation_policy";
  entityId: string;
  eventType: "published" | "updated" | "archived" | "slug_changed" | "price_changed" | "review_approved";
};

export type PublishEventRecord = {
  id: string;
  entity_type: "outstation_route" | "local_package" | "transfer" | "tour_package" | "review" | "cancellation_policy";
  entity_id: string;
  event_type: "published" | "updated" | "archived" | "slug_changed" | "price_changed" | "review_approved";
  status: "pending" | "processing" | "triggered" | "succeeded" | "failed" | "superseded";
  attempt_count: number;
  next_attempt_at: string | Date;
  deployment_ref: string | null;
  last_error: string | null;
  created_at: string | Date;
  processed_at: string | Date | null;
};

export type DeviceRegistrationRecord = {
  id: string;
  userId?: string | null;
  bookingId?: string | null;
  deviceId: string;
  platform: "android" | "ios" | "web";
  fcmToken: string;
  isActive: boolean;
  lastSeenAt: string;
  createdAt: string;
};

export type FareRuleRecord = {
  id: string;
  version: string;
  config: unknown;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  createdAt: string;
};
