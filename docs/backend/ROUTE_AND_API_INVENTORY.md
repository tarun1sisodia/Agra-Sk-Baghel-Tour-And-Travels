# Master Route and API Inventory: Legacy vs Clean Monorepo

**Repository:** `tarun1sisodia/ArenaAI`  
**Purpose:** Canonical inventory of legacy vs clean endpoints, consumers, response envelopes, and non-breaking migration strategy.  
**Exit Gate for Phase 0:** Inventory committed and accepted before any contract additions or frontend rewires.

---

## 1. Response Envelope & Error Architecture

To eliminate client guesswork between wrapped (`{ success: true, data: T }`) and unwrapped schemas:

1. **Clean APIs (`/api/v1/quotes*`, `/api/v1/bookings*`, `/api/v1/catalog*`, `/api/v1/admin/fares*`, `/api/v1/reviews*`)**:
   - **Success (200 / 201)**: Return the domain model directly as typed in `contracts/fare-system.ts` (`QuoteResponse`, `OptionsResponse`, `BookingCreateResponse`, `CatalogResponse`).
   - **Client error (400 / 404 / 409)**: Direct JSON error object `{ error: "<CODE>", details?: unknown, message?: string }`.
     - Standard codes: `VALIDATION_ERROR`, `NOT_FOUND`, `PRODUCT_INACTIVE`, `VEHICLE_NOT_AVAILABLE`, `CAPACITY_EXCEEDED`, `TRIP_TOO_LONG`, `SETTINGS_MISSING`, `PRICE_CHANGED`.
   - **Internal error (500)**: `{ error: "INTERNAL_ERROR", message: string }`.
2. **Legacy APIs (`/api/v1/fares/calculate`, `/api/v1/fleet`, `/api/v1/bookings/draft`, `/api/v1/ops/admin/...`)**:
   - Retain existing `{ success: boolean, data?: unknown, error?: unknown }` envelope during migration.
   - Kept strictly isolated; new UI code will **never** consume legacy envelopes.

---

## 2. Legacy Route Inventory (Isolated until Phase 8 Deletion)

| Method | Path | Backend Controller / Route | Current Consumers | Response Envelope | Deletion Gate |
|---|---|---|---|---|---|
| `POST` | `/api/v1/fares/calculate` | `src/modules/fares/fare.routes.ts` | Legacy `BookingPage.tsx`, `api.ts:calculateServerFare` | `{ success: true, data: ServerFareBreakdown }` | Phase 8 |
| `GET` | `/api/v1/fleet` | `src/modules/fares/fare.routes.ts` | Legacy `BookingPage.tsx`, `FleetPage.tsx` | `{ success: true, data: PublicFleet }` | Phase 8 |
| `POST` | `/api/v1/bookings/draft` | `src/modules/bookings/booking.routes.ts` | Legacy `BookingPage.tsx`, `api.ts:createDraftBooking` | `{ success: true, data: CreateDraftBookingResponse }` | Phase 8 |
| `POST` | `/api/v1/bookings/:id/confirm` | `src/modules/bookings/booking.routes.ts` | Legacy checkout callback | `{ success: true, data: Booking }` | Phase 8 |
| `POST` | `/api/v1/booking-intents/...` | `src/modules/booking-intents/booking-intent.routes.ts` | Legacy `BookingPage.tsx`, `customerAuthApi.ts` | `{ success: true, data: BookingIntent }` | Phase 8 |
| `POST` | `/api/v1/payments/create-checkout` | `src/modules/payments/payment.routes.ts` | Legacy payment flow | `{ success: true, data: CheckoutOrder }` | Phase 8 |
| `GET` | `/api/v1/payments/:id/status` | `src/modules/payments/payment.routes.ts` | Legacy payment status poller | `{ success: true, data: PaymentStatus }` | Phase 8 |
| `GET` | `/api/v1/ops/admin/fare-rules` | `src/modules/admin/admin.routes.ts` | Legacy `FaresPage.tsx` | `{ success: true, data: FareRuleset }` | Phase 8 |
| `PUT` | `/api/v1/ops/admin/fare-rules` | `src/modules/admin/admin.routes.ts` | Legacy `FaresPage.tsx` | `{ success: true, data: FareRuleset }` | Phase 8 |
| `GET` | `/api/v1/ops/admin/routes` | `src/modules/routes/route.routes.ts` | Legacy `RoutesPage.tsx`, `RouteCatalogPanel.tsx` | `{ success: true, data: Route[] }` | Phase 8 |

---

## 3. Clean Fare System Route Inventory (Active & Canonical)

All clean endpoints will be reachable under both `/api/v1/<path>` and `/<path>` to preserve backwards/forwards compatibility.

| Method | Canonical Path | Service / Repository | Status in Codebase | Response Type | Target Consumer |
|---|---|---|---|---|---|
| `POST` | `/api/v1/quotes/options` | `QuotesService.options` | Mounted at `/quotes/options` | `OptionsResponse` | Customer `/book` Grouped Selector |
| `POST` | `/api/v1/quotes` | `QuotesService.quote` | Mounted at `/quotes` | `QuoteResponse` | Customer `/book` Fare Breakdown |
| `POST` | `/api/v1/bookings` | `BookingsService.createBooking` | Mounted at `/bookings` | `BookingCreateResponse` | Customer `/book` Checkout (409 on `PRICE_CHANGED`) |
| `GET` | `/api/v1/bookings/:id` | `BookingsService.getBookingById` | Mounted at `/bookings/:id` | `BookingDetailResponse` | Customer Booking Status / Guest View |
| `POST` | `/api/v1/bookings/:id/payment` | `PaymentsService.createOrder` | Mounted at `/payments` | `PaymentOrderResponse` | Customer Checkout Razorpay launcher |
| `POST` | `/api/v1/webhooks/razorpay` | `PaymentsService.handleWebhook` | Mounted at `/webhooks/razorpay` | `{ received: true }` | Razorpay Webhook Gateway |
| `GET` | `/api/v1/catalog` | `FareCatalogRepository` | *To implement in Phase 2* | `PublishedCatalogResponse` | Customer Home, Search, Catalog directory |
| `GET` | `/api/v1/catalog/:category/:code` | `FareCatalogRepository` | *To implement in Phase 2* | `PublishedProductResponse` | 4 Clean Product Detail Templates |
| `GET` | `/api/v1/public/reviews` | `ReviewsService.listPublicReviews` | Mounted at `/public/reviews` | `PublicReviewItem[]` | Customer Homepage review strip |
| `GET` | `/api/v1/public/gallery` | `ReviewsService.listPublicGallery` | Mounted at `/public/gallery` | `PublicGalleryItem[]` | Customer About page photo gallery |
| `GET` | `/api/v1/reviews/links/:token` | `ReviewsService.getLink` | Mounted at `/reviews/links/:token` | `ReviewLinkSummary` | Customer `/review/:token` Form |
| `POST` | `/api/v1/reviews/links/:token/submissions` | `ReviewsService.submit` | Mounted at `/reviews/links/:token/submissions` | `ReviewSubmission` | Customer Review Submit Action |

---

## 4. Clean Admin Endpoints Inventory

| Method | Canonical Path | Service / Repository | Status in Codebase | Role Protection | Target Admin Screen |
|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/fares/vehicle-groups` | `FareAdminService.listVehicleGroups` | Mounted at `/admin/fares/vehicle-groups` | `content_editor`+ | Fleet & Vehicles (`/vehicles`) |
| `PATCH` | `/api/v1/admin/fares/vehicle-groups/:id` | `FareAdminService.patchVehicleGroup` | Mounted at `/admin/fares/vehicle-groups/:id` | `super_admin` | Fleet & Vehicles (`/vehicles`) |
| `POST` | `/api/v1/admin/fares/vehicle-models` | `FareAdminService.createVehicleModel` | Mounted at `/admin/fares/vehicle-models` | `super_admin` | Fleet & Vehicles (`/vehicles`) |
| `PATCH` | `/api/v1/admin/fares/vehicle-models/:id` | `FareAdminService.patchVehicleModel` | Mounted at `/admin/fares/vehicle-models/:id` | `super_admin` | Fleet & Vehicles (`/vehicles`) |
| `GET` | `/api/v1/admin/fares/settings` | `FareAdminService.listFareSettings` | Mounted at `/admin/fares/settings` | `super_admin` | Fare Settings (`/fares/settings`) |
| `PATCH` | `/api/v1/admin/fares/settings/:key` | `FareAdminService.patchFareSetting` | Mounted at `/admin/fares/settings/:key` | `super_admin` | Fare Settings (`/fares/settings`) |
| `POST` | `/api/v1/admin/fares/rules` | `FareAdminService.createFareRule` | Mounted at `/admin/fares/rules` | `super_admin` | Round-Trip Rates (`/fares/rates`) |
| `PATCH` | `/api/v1/admin/fares/rules/:id` | `FareAdminService.patchFareRule` | Mounted at `/admin/fares/rules/:id` | `super_admin` | Round-Trip Rates (`/fares/rates`) |
| `POST` | `/api/v1/admin/fares/extra-charges` | `FareAdminService.createExtraCharge` | Mounted at `/admin/fares/extra-charges` | `super_admin` | Extra Charges (`/fares/extra-charges`) |
| `PATCH` | `/api/v1/admin/fares/extra-charges/:id` | `FareAdminService.patchExtraCharge` | Mounted at `/admin/fares/extra-charges/:id` | `super_admin` | Extra Charges (`/fares/extra-charges`) |
| `POST` | `/api/v1/admin/routes/calculate-distance` | `FareAdminService.calculateRouteDistance` | Mounted at `/admin/fares/calculate-distance` | `content_editor`+ | Route Manager (`/routes`) |
| `PUT` | `/api/v1/admin/routes/:id/vehicles` | `FareAdminService.putRouteVehicles` | Mounted at `/admin/fares/routes/:id/vehicles` | `super_admin` | Route Cars Grid (`/routes`) |
| `GET` | `/api/v1/admin/reviews/submissions` | `ReviewsService.listSubmissions` | Mounted at `/reviews/submissions` | `review_moderator`+ | Review Moderation (`/reviews`) |
| `PATCH` | `/api/v1/admin/reviews/submissions/:id` | `ReviewsService.moderateSubmission` | Mounted at `/reviews/submissions/:id` | `review_moderator`+ | Review Moderation (`/reviews`) |
| `GET` | `/api/v1/admin/audit-logs` | `FareAdminRepository.listAuditLogs` | *To expose read route in Phase 2* | `super_admin` | Audit Log Viewer (`/audit`) |
| `GET` | `/api/v1/admin/publishing/events` | `PublishingService.listEvents` | *To expose read route in Phase 2* | `content_editor`+ | Publishing Outbox (`/publishing`) |

---

## 5. Non-Breaking Migration Strategy

1. **Phase 0–3 (Backend Isolation & Route Unification)**: Keep legacy endpoints mounted alongside clean endpoints. Add `/api/v1` aliases for all clean endpoints and test both paths.
2. **Phase 4 (Admin Desk Migration)**: Rebuild admin screens to exclusively use `/api/v1/admin/...` and clean contracts.
3. **Phase 5–6 (Customer Migration)**: Rebuild customer templates and `/book` page using `cleanFareApi.ts` calling `/api/v1/...`.
4. **Phase 7 (Verification & Static Scan)**: Run lint/grep proving 0 customer or admin components import `fares.ts`, `fareEngine.ts`, or legacy endpoints.
5. **Phase 8 (Safe Deletion)**: Retire legacy files in `src/modules/fares/` and `src/modules/booking-intents/`. Run complete CI verification (`npm run verify`).
