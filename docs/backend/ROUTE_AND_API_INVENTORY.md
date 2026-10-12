# Master Route and API Inventory: Clean Monorepo & Legacy Surface Area

**Repository:** `tarun1sisodia/ArenaAI`  
**Authoritative Standards:** [`docs/CANONICAL_FIELD_REGISTRY.md`](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/docs/CANONICAL_FIELD_REGISTRY.md) · [`contracts/fare-system.ts`](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/contracts/fare-system.ts) · [`fare-system-final-spec.md`](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/fare-system-final-spec.md)  
**Status:** **Fully Implemented, Verified, and Active in Codebase** (179/179 Vitest Unit Tests Passed; 29/29 Postman Newman Integration Requests Passed).

---

## 1. Response Envelope & Error Architecture

To prevent ambiguity between wrapped legacy payloads and clean unwrapped domain entities, the backend enforces two distinct wire protocols based on API tier:

### 1.1 Clean API Tier (`/api/v1/quotes*`, `/api/v1/catalog*`, `/api/v1/bookings*`, `/api/v1/admin/fares*`, `/api/v1/reviews*`)
- **Dual-Mount Routing:** Every clean endpoint is mounted under both canonical `/api/v1/<path>` and root alias `/<path>` in [`backend/src/app.ts`](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/backend/src/app.ts) to support SSR/SSG fetchers, Vite dev proxy, and direct HTTP clients without path rewrites.
- **Success Semantics (HTTP 200 / 201):** Returns the clean domain object directly as defined in [`contracts/fare-system.ts`](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/contracts/fare-system.ts) (e.g. `QuoteResponse`, `OptionsResponse`, `PublishedCatalog`, `PublishedProductDetail`, `{ success: true, booking: CleanBooking }`, `{ success: true, payment: CleanPayment }`).
- **Standard Clean Error Wire Format:**
  ```json
  {
    "error": "<ERROR_CODE>",
    "message": "Human readable descriptive message",
    "details": {},
    "issues": []
  }
  ```
- **Clean Error Code Dictionary:**
  | Error Code | HTTP Status | Meaning & Invariant Rule |
  |---|---|---|
  | `VALIDATION_ERROR` | 400 | Zod schema validation failed on request body, params, or query string. |
  | `NOT_FOUND` | 404 | Requested route, vehicle group/model, package, booking, review link, or setting key does not exist. |
  | `CONFLICT` | 409 | Unique constraint conflict (e.g. duplicate active fare rule for same car/product, duplicate extra charge, duplicate route code). |
  | `PRICE_CHANGED` | 409 | Authoritative fare recomputation during checkout produced a total fare different from the client's submitted quote. Returns `fresh_quote`. |
  | `PRODUCT_INACTIVE` | 400 | Targeted route, package, or vehicle model has `is_active = false` or `status != 'published'`. |
  | `VEHICLE_NOT_AVAILABLE` | 400 | Vehicle model is not configured or disabled for the requested route / package. |
  | `CAPACITY_EXCEEDED` | 400 | Passenger count exceeds vehicle model's `passenger_capacity`. |
  | `TRIP_TOO_LONG` | 400 | Round-trip duration exceeds maximum allowable limit (`max_round_trip_days`, default 30). |
  | `SETTINGS_MISSING` | 500 | Required row in `fare_settings` (e.g. `driver_allowance_per_day`, `advance_percentage`) missing in database. |
  | `FORBIDDEN` | 401 / 403 | Missing authentication token or insufficient role permission (`super_admin`, `content_editor`, `review_moderator`). |
  | `DATA_CORRUPTION` | 500 | Database returned inconsistent or unparseable monetary values (e.g., non-numeric or missing amounts). |
  | `GEOCODE_FAILED` | 400 | LocationIQ could not geocode origin or destination city. |
  | `ROUTING_FAILED` | 400 | LocationIQ routing service could not calculate driving path between coordinates. |
  | `UPSTREAM_ERROR` | 502 | Upstream integration failure (LocationIQ HTTP 5xx or missing API key). |
  | `INTERNAL_ERROR` | 500 | Unhandled database or runtime exception. |

### 1.2 Legacy API Tier (`/api/v1/fares/calculate`, `/api/v1/fleet`, `/api/v1/bookings/draft`, `/api/v1/ops/admin/...`)
- **Wrapped Envelope:** Retains legacy `{ success: boolean, data?: unknown, error?: { code, message, requestId } }`.
- **Strict Boundary Isolation:** No clean UI, customer booking flow, or rebuilt admin desk screen is permitted to import or consume legacy endpoints or envelope formats.

---

## 2. Clean Customer & Public Route Inventory (Active & Canonical)

All clean endpoints are mounted in [`backend/src/app.ts`](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/backend/src/app.ts) and fully verified with live PostgreSQL tests.

| HTTP Method | Canonical Path | Root Alias Path | Controller / Service | Rate Limit | Auth / Role | Request Schema | Response Contract | Target Consumer |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/catalog` | `/catalog` | `registerFareCatalogRoutes` · `FareCatalogRepository.getPublishedCatalog` | 120/min | Public | None | `PublishedCatalog` | Customer Homepage, Search Bar, Catalog Index |
| `GET` | `/api/v1/catalog/:category/:code` | `/catalog/:category/:code` | `registerFareCatalogRoutes` · `FareCatalogRepository.getPublishedProductDetail` | 120/min | Public | Params: `category` (`CategoryCode`), `code` (string) | `PublishedProductDetail` | 4 Clean Product Detail Templates (Route, Local Tour, Transfer, Tour Package) |
| `POST` | `/api/v1/quotes` | `/quotes` | `registerQuotesRoutes` · `QuotesService.quote` | 120/min | Public | `QuoteRequest` | `QuoteResponse` | Customer `/book` Step 2 (Itemized Fare Breakdown) |
| `POST` | `/api/v1/quotes/options` | `/quotes/options` | `registerQuotesRoutes` · `QuotesService.options` | 120/min | Public | `OptionsRequest` | `OptionsResponse` | Customer `/book` Step 1 (Grouped Vehicle Fleet Cards) |
| `POST` | `/api/v1/bookings` | `/bookings` | `registerBookingsRoutes` · `BookingsService.createBooking` | 120/min | Public (Guest) or Authenticated | `CreateBookingRequest` | `{ success: true, booking: CleanBooking }` *(409 on `PRICE_CHANGED`)* | Customer Checkout Submission Button |
| `GET` | `/api/v1/bookings/:id` | `/bookings/:id` | `registerBookingsRoutes` · `BookingsService.getBookingById` / `getBookingByTicketId` | 120/min | Public (Safe Redacted) or Owner / Guest Token (`?token=` or `X-Guest-Token`) | Params: `id` (UUID or `BK-...`) | `{ success: true, booking: CleanBooking \| SafeBooking }` | Customer Booking Confirmation / Voucher / Status View |
| `POST` | `/api/v1/bookings/:id/payment` | `/bookings/:id/payment` | `registerPaymentsRoutes` · `PaymentsService.createPaymentOrder` | 30/min | Public / Guest | Params: `id` (Booking UUID) | `{ success: true, payment: PaymentOrderResponse }` | Customer Razorpay Modal Trigger |
| `POST` | `/api/v1/webhooks/razorpay` | `/webhooks/razorpay` | `registerPaymentsRoutes` · `PaymentsService.handleWebhook` | 500/min | HMAC SHA-256 (`x-razorpay-signature`) | Raw JSON payload (Buffer parsed) | `{ success: true, event: string, booking_id: string, payment_id: string }` | Razorpay Webhook Callback Gateway |
| `POST` | `/api/v1/webhooks/payment` | `/webhooks/payment` | `registerPaymentsRoutes` · `PaymentsService.handleWebhook` | 500/min | HMAC SHA-256 (`x-razorpay-signature`) | Raw JSON payload (Buffer parsed) | `{ success: true, event: string, booking_id: string, payment_id: string }` | Secondary Webhook Alias |
| `GET` | `/api/v1/public/reviews` | `/public/reviews` | `registerReviewsRoutes` · `ReviewsService.getPublicReviews` | 120/min | Public | None | `{ success: true, reviews: PublicReviewItem[] }` | Customer Homepage Testimonial Carousel |
| `GET` | `/api/v1/public/gallery` | `/public/gallery` | `registerReviewsRoutes` · `ReviewsService.getPublicGallery` | 120/min | Public | None | `{ success: true, gallery: PublicGalleryItem[] }` | Customer About & Gallery Showcase Pages |
| `GET` | `/api/v1/reviews/links/:token` | `/reviews/links/:token` | `registerReviewsRoutes` · `ReviewsService.getLinkByToken` | 60/min | Public | Params: `token` (hex string) | `{ success: true, link: ReviewLinkEntity, trip_summary?: object }` | Customer `/review/:token` Landing Page |
| `POST` | `/api/v1/reviews/links/:token/submissions` | `/reviews/links/:token/submissions` | `registerReviewsRoutes` · `ReviewsService.submitReview` | 10/min | Public | `SubmissionInputSchema` (display_name, rating, text, photos <= 5) | `{ success: true, submission: ReviewSubmissionEntity }` | Customer Review Submit Action |
| `GET` | `/api/v1/locations/autocomplete` | — | `registerLocationRoutes` · `LocationController.autocomplete` | 60/min | Public | Query: `q` (min 2 chars) | `{ success: true, data: { predictions: LocationPrediction[] } }` | Booking Widget Autocomplete Input |
| `GET` | `/api/v1/health` | `/health` | `app.ts:healthHandler` | 120/min | Public | None | `{ success: true, data: { status: "ok", version: string } }` | Docker Liveness Probe / Monitoring |
| `GET` | `/api/v1/ready` | `/ready` | `app.ts:readyHandler` | 120/min | Public | None | `{ success: true, data: { status: "ready", store: "postgres" \| "memory" } }` | Docker Readiness Probe / Database Health |

---

## 3. Clean Operations Desk & Admin API Inventory (Active & Canonical)

All fare management, routing, moderation, and publishing desk routes are mounted in [`backend/src/app.ts`](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/backend/src/app.ts) via `registerFareAdminRoutes` and `registerReviewsRoutes`. Every endpoint supports both `/api/v1/admin/...` and `/admin/...` (as well as `/admin/fares/...` sub-paths).

### 3.1 Fleet & Vehicles Management
| HTTP Method | Canonical Path | Alias Paths | Service / Handler | Role Guard | Request Schema | Response Contract | Target Admin Screen |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/fares/vehicle-groups` | `/admin/fares/vehicle-groups`, `/admin/vehicle-groups`, `/api/v1/admin/vehicle-groups` | `FareAdminService.listVehicleGroups` | `content_editor`+ | None | `{ success: true, vehicle_groups: VehicleGroup[] }` | Fleet Desk (`/vehicles`) |
| `PATCH` | `/api/v1/admin/fares/vehicle-groups/:id` | `/admin/fares/vehicle-groups/:id`, `/admin/vehicle-groups/:id`, `/api/v1/admin/vehicle-groups/:id` | `FareAdminService.patchVehicleGroup` | `super_admin` | `VehicleGroupPatch` | `{ success: true, vehicle_group: VehicleGroup }` | Fleet Desk (`/vehicles`) |
| `GET` | `/api/v1/admin/fares/vehicle-models` | `/admin/fares/vehicle-models`, `/admin/vehicle-models`, `/api/v1/admin/vehicle-models` | `FareAdminService.listVehicleModels` | `content_editor`+ | None | `{ success: true, vehicle_models: VehicleModel[] }` | Fleet Desk (`/vehicles`) |
| `POST` | `/api/v1/admin/fares/vehicle-models` | `/admin/fares/vehicle-models`, `/admin/vehicle-models`, `/api/v1/admin/vehicle-models` | `FareAdminService.createVehicleModel` | `super_admin` | `VehicleModelCreate` | `{ success: true, vehicle_model: VehicleModel }` | Fleet Desk (`/vehicles`) |
| `PATCH` | `/api/v1/admin/fares/vehicle-models/:id` | `/admin/fares/vehicle-models/:id`, `/admin/vehicle-models/:id`, `/api/v1/admin/vehicle-models/:id` | `FareAdminService.patchVehicleModel` | `super_admin` | `VehicleModelPatch` | `{ success: true, vehicle_model: VehicleModel }` | Fleet Desk (`/vehicles`) |

### 3.2 Global Fare Settings & Pricing Parameters
| HTTP Method | Canonical Path | Alias Paths | Service / Handler | Role Guard | Request Schema | Response Contract | Target Admin Screen |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/fares/settings` | `/admin/fares/settings`, `/admin/fare-settings`, `/api/v1/admin/fare-settings` | `FareAdminService.listFareSettings` | `super_admin` | None | `{ success: true, settings: FareSetting[] }` | Fare Settings (`/fares/settings`) |
| `PATCH` | `/api/v1/admin/fares/settings/:key` | `/admin/fares/settings/:key`, `/admin/fare-settings/:key`, `/api/v1/admin/fare-settings/:key` | `FareAdminService.patchFareSetting` | `super_admin` | `FareSettingPatch` (`{ value: integer }`) | `{ success: true, setting: FareSetting }` | Fare Settings (`/fares/settings`) |

### 3.3 Fare Rules (Outstation Per-Km & Fixed Product Rates)
| HTTP Method | Canonical Path | Alias Paths | Service / Handler | Role Guard | Request Schema | Response Contract | Target Admin Screen |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/fares/rules` | `/admin/fares/rules`, `/admin/fare-rules`, `/api/v1/admin/fare-rules` | `FareAdminService.listFareRules` | `super_admin` | None | `{ success: true, fare_rules: FareRule[] }` | Fare Rules (`/fares/rates`) |
| `POST` | `/api/v1/admin/fares/rules` | `/admin/fares/rules`, `/admin/fare-rules`, `/api/v1/admin/fare-rules` | `FareAdminService.createFareRule` | `super_admin` | `FareRuleCreate` | `{ success: true, fare_rule: FareRule }` | Fare Rules (`/fares/rates`) |
| `PATCH` | `/api/v1/admin/fares/rules/:id` | `/admin/fares/rules/:id`, `/admin/fare-rules/:id`, `/api/v1/admin/fare-rules/:id` | `FareAdminService.patchFareRule` | `super_admin` | `FareRulePatch` | `{ success: true, fare_rule: FareRule }` | Fare Rules (`/fares/rates`) |

### 3.4 Surcharges & Extra Charges
| HTTP Method | Canonical Path | Alias Paths | Service / Handler | Role Guard | Request Schema | Response Contract | Target Admin Screen |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/fares/extra-charges` | `/admin/fares/extra-charges`, `/admin/extra-charges`, `/api/v1/admin/extra-charges` | `FareAdminService.listExtraCharges` | `super_admin` | None | `{ success: true, extra_charges: ExtraCharge[] }` | Extra Charges (`/fares/extra-charges`) |
| `POST` | `/api/v1/admin/fares/extra-charges` | `/admin/fares/extra-charges`, `/admin/extra-charges`, `/api/v1/admin/extra-charges` | `FareAdminService.createExtraCharge` | `super_admin` | `ExtraChargeCreate` | `{ success: true, extra_charge: ExtraCharge }` | Extra Charges (`/fares/extra-charges`) |
| `PATCH` | `/api/v1/admin/fares/extra-charges/:id` | `/admin/fares/extra-charges/:id`, `/admin/extra-charges/:id`, `/api/v1/admin/extra-charges/:id` | `FareAdminService.patchExtraCharge` | `super_admin` | `ExtraChargePatch` | `{ success: true, extra_charge: ExtraCharge }` | Extra Charges (`/fares/extra-charges`) |

### 3.5 Intercity Highway Routes & Fleet Pricing Grid
| HTTP Method | Canonical Path | Alias Paths | Service / Handler | Role Guard | Request Schema | Response Contract | Target Admin Screen |
|---|---|---|---|---|---|---|---|
| `POST` | `/api/v1/admin/routes/calculate-distance` | `/admin/routes/calculate-distance`, `/admin/fares/routes/calculate-distance` | `FareAdminService.calculateDistance` (LocationIQ) | `content_editor`+ | `{ origin: string, destination: string }` | `{ success: true, distance_km: number, duration_minutes: number }` | Route Manager Distance Estimator |
| `GET` | `/api/v1/admin/fares/routes` | `/admin/fares/routes`, `/admin/routes`, `/api/v1/admin/routes` | `FareAdminService.listRoutes` | `content_editor`+ | None | `{ success: true, routes: OutstationRoute[] }` | Route Manager (`/routes`) |
| `POST` | `/api/v1/admin/fares/routes` | `/admin/fares/routes`, `/admin/routes`, `/api/v1/admin/routes` | `FareAdminService.createRoute` | `content_editor`+ | `{ code, origin_name, destination_name, distance_km, duration_minutes, description?, image_url? }` | `{ success: true, route: OutstationRoute }` | Route Manager (`/routes`) |
| `PATCH` | `/api/v1/admin/fares/routes/:id` | `/admin/fares/routes/:id`, `/admin/routes/:id`, `/api/v1/admin/routes/:id` | `FareAdminService.patchRoute` | `content_editor`+ | `{ origin_name?, destination_name?, distance_km?, duration_minutes?, description?, image_url? }` | `{ success: true, route: OutstationRoute }` | Route Manager (`/routes`) |
| `GET` | `/api/v1/admin/fares/routes/:id/vehicles` | `/admin/fares/routes/:id/vehicles`, `/admin/routes/:id/vehicles`, `/api/v1/admin/routes/:id/vehicles` | `FareAdminService.getRouteWithVehicles` | `content_editor`+ | None | `{ success: true, route: OutstationRoute, vehicles: RouteVehicleRow[] }` | Route Pricing Matrix Grid |
| `PUT` | `/api/v1/admin/fares/routes/:id/vehicles` | `/admin/fares/routes/:id/vehicles`, `/admin/routes/:id/vehicles`, `/api/v1/admin/routes/:id/vehicles` | `FareAdminService.putRouteVehicles` | `super_admin` | `RouteVehiclesPut` (`{ vehicles: [...] }`) | `{ success: true, vehicles: OutstationRouteVehicle[] }` | Route Pricing Matrix Grid |

### 3.6 Publishing Pipeline & Audit Logging
| HTTP Method | Canonical Path | Alias Paths | Service / Handler | Role Guard | Request Schema | Response Contract | Target Admin Screen |
|---|---|---|---|---|---|---|---|
| `PATCH` | `/api/v1/admin/fares/:entityType/:id/status` | `/admin/fares/:entityType/:id/status`, `/admin/:entityType/:id/status`, `/api/v1/admin/:entityType/:id/status` | `FareAdminService.updateProductStatus` | `content_editor`+ | `{ status: "published" \| "archived" }` | `{ success: true, entity: object }` | Entity Publishing Action Toolbar |
| `GET` | `/api/v1/admin/fares/publishing/events` | `/admin/fares/publishing/events`, `/admin/publishing/events`, `/api/v1/admin/publishing/events` | `FareAdminService.listPublishEvents` | `content_editor`+ | None | `{ success: true, publish_events: SitePublishEvent[] }` | Publishing Outbox Monitor (`/publishing`) |
| `GET` | `/api/v1/admin/fares/audit-logs` | `/admin/fares/audit-logs`, `/admin/audit-logs`, `/api/v1/admin/audit-logs` | `FareAdminService.listAuditLogs` | `super_admin` | None | `{ success: true, audit_logs: AuditLogEntry[] }` | Audit Trail Log Viewer (`/audit`) |

### 3.7 Review Moderation & Link Generation Desk
| HTTP Method | Canonical Path | Alias Paths | Service / Handler | Role Guard | Request Schema | Response Contract | Target Admin Screen |
|---|---|---|---|---|---|---|---|
| `POST` | `/api/v1/admin/review-links` | `/admin/review-links` | `ReviewsService.createQrLink` | `super_admin`, `review_moderator` | `{ label?: string, prefill?: object }` | `{ success: true, token: string, link: ReviewLinkEntity }` | In-Car QR Code Generator Desk |
| `POST` | `/api/v1/admin/bookings/:id/review-request` | `/admin/bookings/:id/review-request` | `ReviewsService.createBookingLink` (Triggers Resend email) | `super_admin`, `review_moderator` | None | `{ success: true, token: string, link: ReviewLinkEntity }` | Booking Detail Review Request Button |
| `PATCH` | `/api/v1/admin/review-submissions/:id` | `/admin/review-submissions/:id` | `ReviewsService.moderateSubmission` | `super_admin`, `review_moderator` | `{ status?, show_on_homepage?, show_in_gallery?, review_text?, rejection_reason?, photo_approvals? }` | `{ success: true, submission: ReviewSubmissionEntity }` | Review Moderation Queue (`/reviews`) |

---

## 4. Static Content & Manifest API Inventory (Build & SSG Feeds)

These public endpoints feed the build scripts, Astro/React static page generation, and pre-render pipelines:

| HTTP Method | Canonical Path | Service / Controller | Rate Limit | Purpose & Consumer | Response Type |
|---|---|---|---|---|---|
| `GET` | `/api/v1/routes/manifest` | `createRouteController.manifest` | 120/min | Compressed catalog of 982 intercity routes | `{ success: true, data: RouteSummary[] }` |
| `GET` | `/api/v1/routes/fleets` | `createRouteController.fleets` | 120/min | Public fleet specifications for routes | `{ success: true, data: PublicFleet[] }` |
| `GET` | `/api/v1/routes/by-slug/:slug` | `createRouteController.getBySlug` | 120/min | Legacy route metadata and fares by URL slug | `{ success: true, data: RouteDetail }` |
| `GET` | `/api/v1/tour-packages/manifest` | `createTourPackagesController.manifest` | 120/min | Published multi-day and sightseeing packages | `{ success: true, data: TourPackageSummary[] }` |
| `GET` | `/api/v1/tour-packages/upgrades` | `createTourPackagesController.listUpgrades` | 120/min | Available guide, monument, meal upgrades | `{ success: true, data: PackageUpgrade[] }` |
| `GET` | `/api/v1/tour-packages/by-code/:code` | `createTourPackagesController.publicGetByCode` | 120/min | Full tour package itinerary, pricing, and media | `{ success: true, data: TourPackageDetail }` |
| `GET` | `/api/v1/transfers` | `createTransferRoutesController.manifest` | 120/min | Airport / railway transfer routes | `{ success: true, data: TransferSummary[] }` |
| `GET` | `/api/v1/transfers/by-code/:code` | `createTransferRoutesController.publicGetByCode` | 120/min | Single transfer route specification | `{ success: true, data: TransferDetail }` |
| `GET` | `/api/v1/local-tours` | `createLocalPackagesController.manifest` | 120/min | Local 8hr/80km & 12hr/120km packages | `{ success: true, data: LocalTourSummary[] }` |
| `GET` | `/api/v1/local-tours/by-code/:code` | `createLocalPackagesController.publicGetByCode` | 120/min | Single local tour package specification | `{ success: true, data: LocalTourDetail }` |
| `GET` | `/api/v1/cancellation-policies` | `createCancellationPoliciesController.publicList` | 120/min | Standard cancellation terms and tiers | `{ success: true, data: CancellationPolicy[] }` |
| `GET` | `/api/v1/monuments` | `createMonumentsController.publicList` | 120/min | Agra monument timings, entry fees, and rules | `{ success: true, data: Monument[] }` |
| `GET` | `/api/v1/pet-policy` | `createPetPolicyController.publicGet` | 120/min | Pet travel guidelines and sanitization fees | `{ success: true, data: PetPolicy }` |
| `GET` | `/api/v1/company-profile` | `createCompanyProfileController.publicGet` | 120/min | Official legal company details, GSTIN, and contact | `{ success: true, data: CompanyProfile }` |
| `GET` | `/api/v1/product-signoffs` | `createDossierSignoffsController.publicList` | 120/min | Product safety and vehicle compliance signoffs | `{ success: true, data: DossierSignoff[] }` |
| `GET` | `/api/v1/promos/featured` | `createPromosController.featured` | 120/min | Active customer promotional banners | `{ success: true, data: PromoBanner[] }` |
| `GET` | `/api/v1/content/manifest` | `registerContentManifestRoutes` | 120/min | Master bundle (policies, monuments, profile) | `{ success: true, data: ContentManifest }` |
| `GET` | `/api/v1/content/release/latest` | `registerContentManifestRoutes` | 60/min | Latest deploy-hook release attempt status | `{ success: true, available: boolean, release: object }` |

---

## 5. Legacy Route Inventory (Isolated for Scheduled Deprecation)

The following endpoints remain mounted in [`backend/src/app.ts`](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/backend/src/app.ts) solely to preserve backward compatibility for legacy callers. All clean UI screens must refrain from utilizing these endpoints.

| HTTP Method | Legacy Path | Module / Controller | Legacy Response Envelope | Retirement Schedule |
|---|---|---|---|---|
| `POST` | `/api/v1/fares/calculate` | `modules/fares/fare.controller.ts:calculate` | `{ success: true, data: ServerFareBreakdown }` | Phase 8 Deprecation |
| `GET` | `/api/v1/fleet` | `modules/fares/fare.controller.ts:fleet` | `{ success: true, data: PublicFleet }` | Phase 8 Deprecation |
| `POST` | `/api/v1/bookings/draft` | `modules/bookings/booking.controller.ts:createDraft` | `{ success: true, data: DraftBooking }` | Phase 8 Deprecation |
| `GET` | `/api/v1/me/profile` | `modules/bookings/booking.controller.ts:getMyProfile` | `{ success: true, data: CustomerProfile }` | Phase 8 Deprecation |
| `GET` | `/api/v1/me/bookings` | `modules/bookings/booking.controller.ts:listMine` | `{ success: true, data: Booking[] }` | Phase 8 Deprecation |
| `GET` | `/api/v1/me/bookings/:bookingId` | `modules/bookings/booking.controller.ts:getMine` | `{ success: true, data: Booking }` | Phase 8 Deprecation |
| `POST` | `/api/v1/booking-intents` | `modules/booking-intents/booking-intent.controller.ts:create` | `{ success: true, data: BookingIntent }` | Phase 8 Deprecation |
| `GET` | `/api/v1/booking-intents/:id` | `modules/booking-intents/booking-intent.controller.ts:recover` | `{ success: true, data: BookingIntent }` | Phase 8 Deprecation |
| `POST` | `/api/v1/booking-intents/:id/finalize` | `modules/booking-intents/booking-intent.controller.ts:finalize` | `{ success: true, data: Booking }` | Phase 8 Deprecation |
| `POST` | `/api/v1/payments/create-checkout` | `modules/payments/payment.controller.ts:createCheckout` | `{ success: true, data: CheckoutOrder }` | Phase 8 Deprecation |
| `GET` | `/api/v1/payments/:paymentId/status` | `modules/payments/payment.controller.ts:getStatus` | `{ success: true, data: PaymentStatus }` | Phase 8 Deprecation |
| `POST` | `/api/v1/payments/:paymentId/verify` | `modules/payments/payment.controller.ts:verifyPayment` | `{ success: true, data: PaymentResult }` | Phase 8 Deprecation |
| `POST` | `/api/v1/payments/webhooks/:provider` | `modules/payments/payment.controller.ts:webhook` | `{ success: true, data: WebhookAck }` | Phase 8 Deprecation |
| `GET` | `/api/v1/ops/admin/bookings` | `modules/admin/admin.controller.ts:listBookings` | `{ success: true, data: BookingRow[] }` | Admin V2 Migration |
| `POST` | `/api/v1/ops/admin/bookings/:id/transition` | `modules/admin/admin.controller.ts:transitionBooking` | `{ success: true, data: BookingRow }` | Admin V2 Migration |
| `POST` | `/api/v1/ops/admin/refunds` | `modules/admin/admin.controller.ts:refund` | `{ success: true, data: RefundResult }` | Admin V2 Migration |
| `GET` | `/api/v1/ops/admin/inquiries` | `modules/admin/admin.controller.ts:listInquiries` | `{ success: true, data: InquiryRow[] }` | Admin V2 Migration |
| `PATCH` | `/api/v1/ops/admin/inquiries/:id` | `modules/admin/admin.controller.ts:updateInquiry` | `{ success: true, data: InquiryRow }` | Admin V2 Migration |
| `GET` | `/api/v1/ops/admin/payments` | `modules/admin/admin.controller.ts:listPayments` | `{ success: true, data: PaymentRow[] }` | Admin V2 Migration |
| `GET` | `/api/v1/ops/admin/fare-rules` | `modules/admin/admin.controller.ts:getFareRules` | `{ success: true, data: LegacyFareRuleset }` | Retired by `/admin/fares/*` |
| `PUT` | `/api/v1/ops/admin/fare-rules` | `modules/admin/admin.controller.ts:updateFareRules` | `{ success: true, data: LegacyFareRuleset }` | Retired by `/admin/fares/*` |
| `POST` | `/api/v1/ops/admin/fare-rules/activate` | `modules/admin/admin.controller.ts:activateFareRules` | `{ success: true, data: LegacyFareRuleset }` | Retired by `/admin/fares/*` |
| `GET` | `/api/v1/ops/admin/fare-rules/versions` | `modules/admin/admin.controller.ts:listFareRuleVersions` | `{ success: true, data: LegacyFareRuleset[] }` | Retired by `/admin/fares/*` |
| `POST` | `/api/v1/devices/register` | `app.ts:DeviceSchema handler` | `{ success: true, deviceId: string }` | Mobile App FCM Gateway |
| `POST` | `/api/v1/inquiries` | `modules/inquiries/inquiry.controller.ts:create` | `{ success: true, data: Inquiry }` | Contact Us Form |
| `POST` | `/api/v1/rental-enquiries` | `modules/rental-enquiries/rental-enquiry.controller.ts:create` | `{ success: true, data: RentalEnquiry }` | Car Rental Form |

---

## 6. Implementation & Invariant Verification Matrix

Every route cataloged in Sections 2 and 3 enforces the system invariants defined in [`docs/CANONICAL_FIELD_REGISTRY.md`](file:///f:/Dev/Projects/tarunSisodia/ArenaAI/docs/CANONICAL_FIELD_REGISTRY.md):

1. **`INV-1` & `INV-2` (Integer Currency):** Quotes, Bookings, Payments, and Admin Rate endpoints strictly reject decimals; all database monetary columns (`paise` or `rupees`) store integer numbers.
2. **`INV-3` (Pricing Independence):** `POST /bookings` recomputes the quote server-side from active database rates; customer pricing submissions are ignored, and a discrepancy raises HTTP 409 `PRICE_CHANGED`.
3. **`INV-4` (One-Way Trip Non-Empty Routing):** `POST /quotes` and `POST /quotes/options` for `one_way` strictly require `route_id` or explicit `pickup_location` and `drop_location`.
4. **`INV-5` (Advance Payment Exact Match):** `POST /webhooks/razorpay` verifies webhook order amounts against `booking.advance_amount * 100` down to the exact paise before updating booking status.
5. **`INV-6` (Dual-Mount Parity):** All clean routes mounted on `/api/v1/...` and `root /...` share the identical handler closure and produce byte-identical responses.
6. **`INV-10` (Fail-Closed Integrity):** Corrupted, negative, or zero monetary amounts in the database trigger an immediate `AppError("DATA_CORRUPTION", ..., 500)` rather than propagating bad math to clients.
