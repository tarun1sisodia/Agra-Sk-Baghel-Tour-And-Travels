# Customer Frontend Rewire Plan

**Repository:** `tarun1sisodia/ArenaAI`  
**Baseline:** `main` at `b343f5c` (`feat(fares): rebuild clean fare system...` plus verification commit)  
**Primary specification:** [`fare-system-final-spec.md`](../../fare-system-final-spec.md)  
**Scope:** Rewire the customer site to the clean published-service catalog, shared contracts, server-authoritative quotes, booking, payment, reviews, and publishing model. This plan intentionally removes the legacy fare/catalog path from customer booking behavior.

## Walkthrough deltas to carry into implementation

The supplied post-implementation walkthrough confirms two behavior decisions that supersede the earlier planning assumptions: the approved `max_round_trip_days` ceiling/seed is **5 IST calendar days**, and archived service pages remain crawlable with their canonical URLs, an explicit “Currently Unavailable” notice, disabled booking, and related-service links. Drafts remain excluded from public catalog responses and sitemaps. The walkthrough also reports the clean public route convention as `/api/v1/quotes`, `/api/v1/quotes/options`, and `/api/v1/bookings`; use that convention consistently in the browser client.

Before coding, reconcile the walkthrough against the checked-out source/spec: the current `0039_fare_system_seeds.sql` already seeds `max_round_trip_days = 5`, while the top-level assumption and fixture text in `fare-system-final-spec.md` still contains earlier `2`-day references. Update the canonical specification/tests if the walkthrough is the approved source of truth; do not hide the discrepancy in frontend defaults. The customer UI must read the setting/error behavior from the backend and must not hardcode either `2` or `5`.

## 1. Goal and non-negotiable outcomes

The customer site must:

1. Show every service that the admin has **published**: outstation routes, local packages, transfers, and tour packages.
2. Use the exact product codes and vehicle IDs returned by the clean API; never infer identity from old slugs, vehicle tiers, static fare tables, distance, or prices in the URL.
3. Ask the backend for grouped availability and complete quotes through `POST /quotes/options` and `POST /quotes`.
4. Never calculate, round, multiply, discount, or default a fare in the browser.
5. Create bookings with the exact quote request and `quoted_total` the customer saw; handle `409 PRICE_CHANGED` by requiring an explicit reconfirmation.
6. Start payment only from the stored booking's backend-calculated advance amount.
7. Keep archived pages discoverable but visibly unavailable, while drafts never appear in public catalog responses or sitemap output.
8. Use the same Zod contracts as the backend and admin site, generated from `contracts/`.

## 2. Current baseline and problems to remove

The clean contracts/API client already exist in `contracts/fare-system.ts` and `react/src/services/fareApi.ts`, but the active UI is not wired to them end-to-end.

### Current conflict inventory

- `react/src/features/booking/BookingPage.tsx` is a large legacy flow that imports static `data/catalogue`, `fares.ts`, `fareEngine.ts`, old booking-intent/auth APIs, promo APIs, generated manifests, and legacy catalog fallbacks.
- `react/src/features/booking/fareEngine.ts` re-exports the old client fare engine. It must not be used by the clean booking flow.
- `react/src/fares.ts`, `react/src/data/prices.ts`, `react/src/data/catalogue.ts`, `react/src/services/api.ts`, `react/src/services/customerAuthApi.ts`, and `react/src/auth/bookingIntentStorage.ts` contain legacy fare/booking concepts that can silently reintroduce old tiers, promos, distance maths, or draft-booking behavior.
- `react/src/services/catalog.ts` still models the old catalog (`ride`, `tour`, `package`, `route`, `startingPriceInr`, availability badges) instead of the four clean categories and published product content.
- `react/src/app/App.tsx`, `ServerApp.tsx`, `routes.tsx`, templates, and detail pages still use mixed paths such as `/book.html`, `/packages/...`, old route IDs, and generated legacy manifests.
- Customer pages contain copy that contradicts v1, including hardcoded fare claims, toll inclusions, old vehicle names, old minimums, and promo/advance statements.
- `react/src/services/fareApi.ts` expects the clean response shape, but the active `BookingPage` mostly consumes the legacy `/api/v1/fares/calculate` shape.
- The walkthrough's deployed convention is `/api/v1/catalog`, `/api/v1/catalog/:category/:code`, `/api/v1/quotes/options`, `/api/v1/quotes`, `/api/v1/bookings`, `/api/v1/bookings/:id/payment`, `/api/v1/public/reviews`, `/api/v1/public/gallery`, `/api/v1/reviews/links/:token`, and `/api/v1/reviews/links/:token/submissions`. The checked-out backend currently exposes a mixture of root and `/api/v1` aliases, so the client must use the deployed `/api/v1` convention and the route contract must be made consistent before release.

### Cleanup rule

Do not make the legacy engine “compatible” by adding more adapters inside the new flow. Build a thin clean customer API layer, migrate consumers, then delete or quarantine unused legacy fare/catalog code. A temporary adapter may exist only at a boundary and must be marked for removal with a test proving no clean page imports it.

## 3. Canonical customer contract boundary

Create/keep one customer-facing module, for example `react/src/services/cleanFareApi.ts`, backed by the generated contracts in `react/src/contracts/fare-system.ts`.

### Required functions

- `fetchPublishedProducts(): Promise<PublishedCatalogResponse>` for `GET /catalog`.
- `fetchPublishedProduct(category, code): Promise<PublishedProduct>` for `GET /catalog/:category/:code`.
- `fetchOptions(request: OptionsRequest): Promise<OptionsResponse>` for `POST /quotes/options`.
- `fetchQuote(request: QuoteRequest): Promise<QuoteResponse>` for `POST /quotes`.
- `createBooking(request: CreateBookingRequest): Promise<BookingCreateResponse>` for `POST /bookings`.
- `createPaymentOrder(bookingId): Promise<PaymentCreateResponse>` for `POST /bookings/:id/payment`.
- `fetchBookingStatus(idOrTicket, guestToken): Promise<BookingStatusResponse>` using the exact guest-token header/query contract selected by backend.
- `fetchPublicReviews()` and `fetchPublicGallery()` using the clean review endpoints.
- `fetchReviewLink(token)` and `submitReview(token, payload)` using the review-link endpoints.

Every response must be parsed with a Zod schema at the boundary. Normalize only transport envelopes (`{ data }`, `{ booking }`, etc.); do not normalize prices or domain names into legacy fields.

### Request construction rules

- Convert local IST date/time controls to an ISO datetime with an explicit offset (`+05:30`); never use a browser-local implicit timezone.
- Build `QuoteRequest`/`OptionsRequest` from route/product IDs resolved by the clean catalog response.
- For outstation, send `route_id`, `trip_type`, `passenger_count`, `pickup_at`, and optional `return_at`.
- For fixed products, send exactly the category-specific product ID and no route/trip fields.
- Strip unknown URL/query fields. `price`, `total`, `distance`, `fare`, `advance`, promo, vehicle tier, and similar values are never sent.
- The `car` URL input is only a UUID preselection hint. Ignore it when that car is not present in the returned group options.

## 4. Customer information architecture and routes

### Public catalog and product pages

Replace the mixed legacy detail model with four clean templates:

| Product | Canonical URL | Data source | Booking entry |
|---|---|---|---|
| Outstation route | `/taxi/<code>` | `GET /catalog/outstation/<code>` | `category=outstation&product=<code>` plus optional `trip=one_way\|round_trip` |
| Local package | `/local-sightseeing/<code>` | `GET /catalog/local_package/<code>` | `category=local_package&product=<code>` |
| Transfer | `/transfers/<code>` | `GET /catalog/transfer/<code>` | `category=transfer&product=<code>` |
| Tour package | `/tours/<code>` | `GET /catalog/tour_package/<code>` | `category=tour_package&product=<code>` |

Use the product's real content fields only: name, route/pickup/drop, description, image, gallery, inclusions, exclusions, highlight/note, itinerary, distance and duration where applicable. Generate title, description, canonical URL, and JSON-LD from the response. Do not use SEO/fare columns that do not exist in the new schema.

### Home and service directory

- Replace legacy `LiveCatalogSection`, static route/package cards, and generated legacy catalog merges with one published catalog query.
- Group cards by the four clean categories and show `from ₹X` only as an indicative lowest active price from the API.
- Do not show a product with no active priced car.
- Keep review strip and gallery fed by `/public/reviews` and `/public/gallery`.
- Any unavailable/archived product page remains accessible at its canonical URL, displays the “Currently Unavailable” banner, disables booking, and links to related published/available services. The sitemap includes the archived canonical URL; drafts are omitted.

### Booking route

Use one canonical `/book` route (retain `/book.html` only as a redirect during rollout). Parse and validate `BookingEntryParams` with Zod, then resolve `product` by code through the clean catalog endpoint.

## 5. Booking page implementation sequence

Replace the current `BookingPage.tsx` in bounded steps; do not incrementally preserve its legacy fare state.

### Step A — typed booking state

Create `react/src/features/booking/clean/` with:

- `bookingTypes.ts`: UI-only state types that contain selections and form state, but no computed money fields.
- `bookingEntry.ts`: URL parser/validator and defaults.
- `dateTime.ts`: IST date/time conversion, future validation, and round-trip date validation.
- `useBookingOptions.ts`: request fingerprint, abort/race protection, loading/error states, and `POST /quotes/options`.
- `useBookingMutation.ts`: booking creation, payment-order creation, and retry/reconfirm handling.
- `CleanBookingPage.tsx`: composition only; no fare arithmetic.

The only money values in state must be server response values (`quote.total`, `quote.advance`, `quote.balance`, `quote.lines`).

### Step B — trip summary and options

- Render editable category/product/trip/date/time/passenger summary.
- On every material selection change, clear selected car and quote, then refetch options.
- Ignore stale responses using an `AbortController` or request sequence token.
- Display `TRIP_TOO_LONG`, `PRODUCT_INACTIVE`, `NOT_FOUND`, `SETTINGS_MISSING`, and validation errors as friendly states.
- Show only returned groups with vehicles; hide empty groups.
- Filter display by passenger capacity only if the backend already applies it; the UI must not hide a car based on a duplicate local rule that could drift. The preferred contract behavior is backend-filtered options plus the server message “Showing cars that seat N”.
- Render each car from `OptionsVehicleItem`: image, display name, seats, luggage, quote total/advance, and trip-specific inclusions/exclusions.

### Step C — fare summary

- Display `quote.lines` in backend order: base, driver allowance, halt, night, extras.
- Omit no lines in the client; the server already omits zero lines and keeps base present.
- Display `quote.total`, `quote.advance`, and `quote.balance` exactly as returned.
- Render `quote.messages` as policy/notes. These are informational and never added in the browser.
- For round trips, use `quote.details` to explain distance, billable kilometres, days, and effective trip type. Do not reconstruct the calculation.

### Step D — customer details and booking

- Collect name, phone, optional email, pickup address, optional drop address, optional flight/train number, and notes.
- Validate the form against `CreateBookingRequest` before submission, but let the backend remain authoritative.
- Send `quoted_total` equal to the selected server quote's `total` and send the exact quote request under `quote`.
- On `409 PRICE_CHANGED`, replace the displayed quote with `fresh_quote`, mark the form as requiring confirmation, and do not retry automatically. The customer must click “Accept updated fare” before another booking attempt.
- On success, retain `ticket_id` and `guest_access_token` only as needed for the status/payment continuation; never expose or log raw tokens unnecessarily.

### Step E — payment

- Call `POST /bookings/:id/payment` only after booking creation succeeds.
- Treat the returned provider order and amount as authoritative. Do not send an amount from the browser.
- Integrate the provider checkout only with the returned order/key fields; never use `advance * 100` in frontend code.
- Redirect to `/booking-status` (or the agreed status path) with a secure guest continuation mechanism. Do not put customer phone/email or raw booking data in URL parameters.

## 6. Booking status, reviews, and public content

### Booking status

Add a clean status page that:

- Resolves the booking through the guest token or authenticated customer session.
- Shows the frozen fare breakdown, total, advance, balance, payment status, ticket ID, and operational status.
- Does not recalculate after rates change.
- Handles pending payment, captured/confirmed, failed, cancelled, and not-found states without leaking private data.

### Reviews

- Replace legacy catalog-linked review UI with `/review/<token>`.
- Render only the safe link payload from `GET /reviews/links/:token`.
- Submit plain text, optional rating, optional social identity, consent, and up to five images through the clean contract.
- Show successful submission as pending moderation; never imply immediate public visibility.
- Feed homepage/About displays only from approved, consented public endpoints.

## 7. File-level work breakdown

### Replace or rewire

- `react/src/features/booking/BookingPage.tsx` → thin route wrapper around `CleanBookingPage`.
- `react/src/features/booking/fareEngine.ts` → remove from clean imports; delete after scan.
- `react/src/services/fareApi.ts` → promote/rename to the single clean API client and add catalog/booking-status/review methods.
- `react/src/services/catalog.ts` → replace old `PublicCatalogItem` with clean product/category response types and endpoints.
- `react/src/app/App.tsx`, `ServerApp.tsx`, `routes.tsx` → canonical routes and four templates; retain redirect aliases only temporarily.
- `react/src/pages/LivePackageDetailPage.tsx`, route/local/transfer/tour detail pages → consume clean product responses and clean booking links.
- Home/service sections → consume published clean catalog, not static price/fare data.
- `react/src/scripts/*` manifest/sitemap code → fetch published product codes/statuses and emit only published canonical URLs.

### Remove after migration and proof

- Client imports from `react/src/fares.ts` and `react/src/data/prices.ts` in booking/catalog paths.
- Legacy `calculateServerFare`, `/api/v1/fares/calculate`, booking-intent/draft booking calls, promo application, old vehicle-tier mapping, static fallback fare maps, and route-distance calculations used for pricing.
- Legacy generated catalog fields such as `startingPriceInr` from clean booking types. Indicative “from” price may remain only as an explicitly named presentation field returned by the clean catalog endpoint.

## 8. Contract and API compatibility checklist

Before UI integration is considered complete, resolve and document:

- Whether clean endpoints are served at root paths or `/api/v1`; choose one `VITE_API_BASE_URL` convention and test dev, preview, and production.
- Response envelope consistency: current clean quote routes return the response directly, while some existing clients expect `{ data }`. The client must parse the actual clean envelope, not guess.
- Clean catalog response shape for `GET /catalog` and `GET /catalog/:category/:code` must be formalized in `contracts/fare-system.ts` before UI code relies on it.
- Booking status guest-token header/query name must match the implemented backend route (`guest_access_token`/`x-guest-token` convention) and be covered by an integration test.
- Payment order response must expose only public checkout fields and must be validated by a client schema.
- Error shape must consistently expose `error` code and message/details so all clean UI states are deterministic.
- `BookingEntryParams.product` is a product code, not a UUID and not a legacy package slug alias.

## 9. Validation and acceptance matrix

### Static/code checks

- `rg`/lint proves no customer booking component imports `fares.ts`, `fareEngine.ts`, legacy tier maps, promo arithmetic, `startingPriceInr` as a live quote, or old `/api/v1/fares/calculate`.
- No client source contains fare formula constants (`300`, `28`, group allowance, night-window comparisons) except explanatory copy sourced from API messages/details.
- All clean API request/response objects pass the generated Zod schemas.
- All published page booking links validate against `BookingEntryParams`.

### Contract/integration checks

- Published catalog returns all four categories and the customer renders each.
- Draft products are absent from public catalog responses and sitemap; archived products remain at their canonical URL, render unavailable, retain crawlable metadata, and cannot book.
- One-way distance edits do not change the returned price; round-trip distance edits do.
- A car without the required active price is absent; no ₹0 or sibling fallback appears.
- Passenger capacity and inactive car/group behavior match backend options.
- One-way night boundaries 19:59/20:00 and 05:59/06:00 render the server result unchanged.
- Same-day and two-day round-trip quotes render server billable km, allowance, halt, extras, total, advance, and balance.
- Every options card quote equals a direct `/quotes` result for the same request.
- Booking with stale `quoted_total` receives 409 and creates no booking until reconfirmed.
- Payment creation is idempotent and uses the stored booking advance.
- Public review/gallery endpoints never show pending, rejected, non-consented, or draft content.
- URL tampering with price/distance/total is ignored.

### Browser/UX checks

- Loading states never show stale prices after a selection change.
- Unknown product, invalid date, past pickup, missing round-trip return, no vehicle, API failure, and settings-missing states have actionable messages.
- Desktop fare summary is a side panel; mobile summary is sticky/bottom-sheet without obscuring form actions.
- Keyboard, screen-reader labels, focus states, reduced motion, and image alt text are retained from the existing design system.

## 10. Delivery order and definition of done

1. Formalize clean public catalog/status/payment response contracts.
2. Implement the clean API client and contract tests.
3. Implement clean catalog hydration and four product templates.
4. Implement the clean booking page and options/quote flow.
5. Wire booking creation, price-change reconfirmation, payment, and status.
6. Rewire reviews and public gallery.
7. Remove legacy customer fare/catalog imports and redirect-only aliases.
8. Reconcile the walkthrough's `max_round_trip_days = 5` migration/seed/test state with the checked-out source, then run contract tests, customer typecheck/build, SEO/sitemap tests, and a browser smoke matrix against the live/seeded database.
9. Confirm admin-published service → public catalog → booking options → quote → booking → payment is an end-to-end path before deployment.

**Done means:** the customer site has one source of truth—the clean backend contracts and APIs—and can book every eligible admin-published service without any client-side fare logic or legacy fallback.
