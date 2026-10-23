# Product Requirements Document — Customer Website (`react/`)

**Product:** Agra SK Baghel Tour & Travels — public customer website and booking portal  
**Document version:** 1.0 — TestSprite-ready functional specification  
**Repository:** `tarun1sisodia/Agra-Sk-Baghel-Tour-And-Travels`  
**Application root:** `react/`  
**Canonical production origin:** `https://agraskbagheltourandtravels.com`  
**Known staging origin:** `https://skbagheltravels-customer.coccoder999.workers.dev`  
**Backend API:** configure to the active staging API; repository documentation has referenced `https://api.agraskbagheltourandtravels.com` and local development uses `http://localhost:4000`. Verify the actual deployed staging API before testing.  
**Local frontend:** generally `http://localhost:5173`  
**Primary test tool:** TestSprite  
**Specification status:** Derived from the React app, services, scripts, and existing customer PRD in the repository. This is a test specification, not a claim that all requirements have passed in the current deployment.

---

## 1. Executive summary

The `react/` application is the customer-facing digital travel desk for Agra SK Baghel Tour & Travels. It presents the vehicle fleet, routes, private tour packages, local sightseeing and transfer products, public company content, and customer support; it also contains the authenticated booking, payment recovery, booking history, confirmation/voucher, and verified-review journeys.

The central product rule is that **the frontend must not be the authority for live price, booking state, or payment state**. It can display generated public content for fast initial rendering and SEO, but a booking/payment decision must be validated by the backend using the current quote, booking, customer identity, and gateway result.

The desired outcome of this PRD is to give TestSprite enough context to discover and validate the complete customer application—not merely to click through the homepage. Testing must cover primary journeys, every discoverable route and meaningful interactive element, persistence, error states, API contracts, security boundaries, mobile usability, rendering/hydration, and the synchronization between admin-published content and the customer-facing site.

### 1.1 Business outcomes

1. Visitors can understand available services, browse real published offers, and find an appropriate vehicle or trip.
2. Customers can generate a server-authoritative quote, authenticate, create a booking, make an advance payment through the configured payment gateway, and verify the final booking state.
3. A successful browser callback is never treated as sufficient proof of payment without server verification.
4. Customers can recover an interrupted payment and access bookings/vouchers belonging to their own account.
5. Customers can submit general inquiries, request a rental quotation, and submit a review using a valid review invitation.
6. Content originating from the admin/backend is rendered consistently without exposing draft/archived content or replacing authoritative values with stale/static values.
7. The application works at supported desktop and mobile sizes, supports keyboard and assistive technology, and does not produce hydration, console, or critical runtime errors.

### 1.2 Core operating model

- The service is a chauffeur-driven travel and tour business, not an instant ride-hailing marketplace.
- Public pages explain routes, tours, vehicles, and commercial terms; a quote or booking must use backend-derived data.
- Repository documentation describes an advance deposit model (often described as 28% advance and 72% balance due to the chauffeur). Test the exact amount returned by the backend and configured commercial rules. Do not hard-code a percentage assumption if the current quote/API contract returns another value.
- Razorpay is used for the current online payment flow. Other provider types may appear in historical/type contracts; do not infer that every provider is currently enabled.
- Supabase Auth supports customer sign-in, including Google OAuth and email/password. Booking, payment, and customer-account actions require the appropriate authenticated session where the current API requires one.
- Static/generated catalog and review snapshots support pre-rendering and SEO. These snapshots must not override current booking, fare, or payment truth.

---

## 2. Source of truth and investigation rules

TestSprite must distinguish three types of statement:

- **Observed implementation:** a route, component, or API call found in `react/` source.
- **Acceptance requirement:** the behavior that must hold for the product to be considered correct.
- **Verification gap:** behavior that source comments or old documentation claim but which the deployed environment still needs to prove.

Use the following precedence when resolving conflicts:

1. Current backend API behavior, database state, and payment-provider sandbox state for live transactions.
2. Current frontend contracts, service functions, runtime configuration, and route resolver in `react/src/app/App.tsx` and `react/src/app/ServerApp.tsx`.
3. Current generated manifest/snapshot files and the current build's emitted route artifacts for public pre-rendered content.
4. Current source-level tests and CI assertions.
5. Existing PRDs, design notes, and older route descriptions.

Do not mark a test passed based only on text in a static HTML page, a client-side success toast, a mocked preview, or an HTTP 200 response. For state-changing flows, confirm the persisted server-side result or an API response with the required data contract.

### 2.1 Known items requiring explicit verification

These should be run early and reported clearly:

- **Language selection/parity:** customer documentation describes English/Hindi route mirrors. In the inspected `react/src/app/App.tsx`, `getMarketingPath()` currently returns an English language value. Verify the actual browser-visible language toggle and `/hi/` routes; do not assume bilingual parity from URLs alone.
- **Authentication state:** current flows use Supabase customer auth and bearer access tokens. A booking CTA must not be able to bypass required authentication just by manipulating the UI or submitting a request directly.
- **Booking date/time:** validate that the exact customer-selected pickup date and time survives input, quote, booking persistence, account history, email/voucher data where visible, and confirmation page. It must not silently become the current time, a default `09:00`, or a different timezone.
- **Amounts and units:** payment service models use minor currency units (e.g. `amount_paise` / `amountMinor`), while customer UI displays rupees. Validate units at every boundary and reject null, string, non-finite, zero/negative, or malformed payable amounts when not valid by contract.
- **Payment callback vs server verification:** client-side gateway callbacks can be interrupted, delayed, repeated, forged, or out of order. Final payment/booking state must be derived from backend verification/webhook state.
- **Review invitation failures:** current review flow attempts to load a token and surfaces a verification warning on failure. Verify that invalid/expired tokens cannot produce a false claim of verified trip or create an accepted public review through an unintended path.
- **Catalog fallback:** current services combine generated snapshots and backend catalog endpoints. Empty/error states must not invent active products or present stale prices as live-authoritative fares.
- **Staging vs production configuration:** verify that TestSprite is using the staging frontend and staging API. Never use live payment credentials or create irreversible production transactions during this suite.

---

## 3. Personas and access model

### 3.1 Anonymous visitor

Can visit public pages, browse public catalog content, search or initiate a booking journey, submit contact/rental inquiries where allowed, and open a valid review invitation. Cannot inspect another customer's account bookings or perform authenticated payment/booking operations without an appropriate session.

### 3.2 Authenticated customer

Can sign in with an enabled provider, complete the authenticated booking flow, view only bookings belonging to their account, recover an interrupted payment for an eligible booking, and access their booking voucher when authorized by the backend.

### 3.3 Returning customer during interrupted payment

Can resume the saved payment intent after authentication, re-fetch authoritative booking/payment status, and retry according to the backend's eligibility and idempotency rules. The user must not be prompted to pay again if the previous attempt is already captured but the browser has not yet received confirmation.

### 3.4 Review participant

Can load a review invitation URL, see available prefill information, provide a rating and feedback, optionally upload up to five allowed image files, explicitly choose public-consent status, and submit. The submission remains pending moderation until approved by the business.

---

## 4. Application architecture and integration boundaries

### 4.1 Client application

- React 19, Vite, TypeScript, and a single page/route resolver in `react/src/app/App.tsx`; the server-rendering equivalent is `react/src/app/ServerApp.tsx`.
- Common site shell/layout, shared header/footer, error boundary, SEO head, and lazily loaded page modules.
- Customer authentication provider at `react/src/auth/customerAuth.tsx`.
- Booking funnel under `react/src/features/booking/`, including `clean/CleanBookingPage.tsx` and payment countdown modal components.
- API/service modules include `react/src/services/cleanFareApi.ts`, `react/src/services/catalog.ts`, `react/src/services/catalogManifest.ts`, `react/src/services/customerAuthApi.ts`, and `react/src/services/api.ts`.
- Public SEO/manifest generation and pre-rendering scripts are under `react/scripts/`.

### 4.2 Backend responsibilities

The backend is the system of record for:

- quote validation and fare computation;
- booking creation, status, selected product/vehicle, customer association, and pickup timestamp;
- payment order creation, payment verification, webhook-derived state, idempotency, and refund/payment status;
- account-scoped booking listing and voucher authorization;
- persisted inquiries/rental enquiries;
- review invitation validity, uploads, submissions, and moderation state;
- published catalog API responses and public review/gallery data.

The browser must not contain private provider secrets, database credentials, service-role keys, or server-only signing secrets.

### 4.3 Generated content

Generated JSON snapshots, route manifests, SEO metadata, sitemap/robots files, static review data, and pre-rendered HTML are part of the build output. Validate both static output and runtime hydration. An admin change may not become public until its publishing/rebuild lifecycle completes; tests should distinguish “saved in admin/database” from “visible in generated/public content.”

---

## 5. Route and page inventory

The app resolves several canonical routes, aliases, and data-driven slugs. TestSprite must discover links and route manifests from the actual staging build and add direct navigation tests for each route family. Do not treat this table as an exhaustive hard-coded list of dynamic slugs.

| Route family | Known route examples | Primary behavior to test |
|---|---|---|
| Home | `/`, `/index.html`, `/en/` | Header/footer, hero, main CTAs, service discovery, static review showcase, content and assets |
| Marketing hubs | `/en/services/`, `/en/routes/`, `/en/packages/`, `/en/monuments/`, `/en/fleet/`, `/en/about/`, `/en/contact/`, `/en/faq/`, `/en/terms/`, `/en/privacy/` | Correct content, internal links, responsive presentation, SEO metadata, forms/interactive components |
| Booking | `/book.html`, `/book/`, `/en/book/`, `/book`, `/booking`, `/en/book` | Booking funnel, quote, auth, create booking, payment handoff |
| Rental request | `/rent`, `/rental`, `/taxi-rental`, `/taxis/rent`, `/en/taxis/rent/`, supported `/hi/` aliases | Vehicle/model selection and persisted call-first quote inquiry |
| Route detail | Static route slugs and published slugs under `/en/.../` | Correct origin/destination, route content, vehicle/fare CTA, booking handoff |
| Vehicle detail | `/en/vehicles/:slug/`, compatible `/fleet/:slug` detail aliases | Correct model, capacity, image, trip CTA, vehicle query propagation |
| Tour/package detail | `/en/packages/:slug/`, dynamic catalog package paths, supported `/tours/:code` or equivalent aliases | Inclusions/exclusions, itinerary, gallery, pricing/availability status, booking handoff |
| Local sightseeing | `/en/local-packages/:slug/`, `/local-sightseeing/:code`, supported local package aliases | Duration/distance, availability, current data, booking CTA |
| Transfer detail | `/en/transfers/:slug/`, `/transfers/:code`, `/transfer/:code` | Pickup/drop, transfer terms, fare information, booking/contact action |
| Monument detail | `/en/monuments/:slug/` | Content, details, image/assets, CTA/links, valid not-found behavior |
| SEO landing pages | Slugs from `SEO_LANDING_SLUGS` | Direct-load, matching page context, canonical metadata, useful links, no route collision |
| Customer login | `/login`, `/auth/login` | Password and Google sign-in, validation, return-to continuation |
| OAuth callback | `/auth/callback/` | PKCE completion, error handling, safe continuation, no stale OAuth URL details |
| My Bookings | `/my-bookings/` | Sign-in gate, account-scoped list, empty/error/loading states, continue payment |
| Payment recovery | `/payment/resume/` | Re-fetch booking/payment status, safe checkout resume/retry, no duplicate payment |
| Booking confirmation | `/booking/confirmation`, `/booking/confirmation.html`, `/booking-confirmation` | Resolve booking/ticket reference, payment-state polling, voucher, print/support links |
| Review invitation | `/review/:token`, `/review?token=...`, `/review/` | Token validation, prefill, rating, optional photo upload, consent, moderation acknowledgement |
| Not found | `/404.html`, `/en/404/`, unknown paths | 404 UI/status, recovery links, no accidental rendering as a valid route |

### 5.1 Direct-route contract

For every known and discovered route:

- direct page load and refresh should produce a meaningful page, not a blank app or an unintended redirect;
- the route should set an appropriate page title and metadata;
- broken/missing dynamic slugs should show a clear not-found or unavailable state;
- unknown URLs must not masquerade as valid booking/product pages;
- internal links must use valid targets and must preserve needed query parameters such as selected trip, vehicle, package, source/destination, date, step, and safe `returnTo` values;
- sensitive account/payment pages should be excluded from indexing where configured.

---

## 6. Global navigation, shell, and shared UI

### FR-GEN-001 — Header and navigation

The header must load across supported pages with correct brand assets, primary navigation, language/account controls where present, and functional mobile menu behavior.

**Acceptance criteria**
- Every visible navigation link goes to its advertised destination.
- Active/current route styling is coherent and does not block keyboard navigation.
- Mobile drawer opens, closes via close action, and does not leave the page permanently scroll-locked.
- Selecting a navigation item closes the mobile drawer and loads the destination.
- Account menu correctly reflects authentication state; logout invalidates the session and returns the user to a safe public page.
- Header and client state render without hydration mismatch or visible layout jump.

### FR-GEN-002 — Footer and support links

Phone, WhatsApp, email, policy, sitemap, and other visible footer links must be correct and actionable. `tel:` links must contain the intended dialing string; WhatsApp links must have a valid recipient and properly URL-encoded message.

### FR-GEN-003 — Shared load/error states

Lazy-loaded pages should show a non-blocking fallback during loading. API-driven pages must offer sensible loading, empty, failure, and retry states as applicable. A network error must not be displayed as an empty dataset if it would mislead the customer about availability or price.

### FR-GEN-004 — Motion and media

Animations and image carousels should remain usable when `prefers-reduced-motion` is enabled. Images need meaningful alternative text when informative; decorative images must not produce noisy duplicate announcements. No persistent animation may block button interaction or cause a focus trap.

---

## 7. Homepage and public discovery

### FR-HOME-001 — Homepage content

Render the brand hero, main route/booking discovery CTA, service highlights, fleet/package discovery, social proof/reviews, contact options, and calls to action. Content must be readable at first load and after JavaScript hydration.

**Acceptance criteria**
- The homepage returns successfully and has one clear page-level heading.
- Hero image/slide and key brand assets load without broken-image icons.
- Primary booking CTA opens the intended booking route and carries supported query parameters.
- Fleet, routes, services, packages, monuments, contact, and FAQ links resolve to valid pages.
- Customer-facing prices, where shown, have a clear currency label and are consistent with their source; static marketing starting prices must not be presented as an authoritative personalized quote.
- Public reviews are sourced from the intended generated/approved content path; unapproved or rejected reviews must not appear in the public showcase.
- No runtime request to a public review endpoint should be required solely to render the initial static homepage review marquee if the approved snapshot architecture remains in effect. Any deferred refresh/revalidation must not cause duplicate or contradictory review cards.

### FR-HOME-002 — Search and discovery controls

Where search, filter, featured package, category tabs, gallery modals, or pagination exist:
- search must filter using the visible data set or documented API query;
- reset/clear controls restore the unfiltered state;
- changing category resets pagination when necessary;
- next/previous pagination cannot move outside valid page bounds;
- clicking a card and its action CTA opens the expected detail/booking route;
- opening/closing image dialogs works with mouse, keyboard, Escape, and focus management.

---

## 8. Catalog, vehicle, route, and destination detail

### FR-CAT-001 — Routes directory

The route directory presents published outstation corridors and supported local/transfer choices, with search, filters, pagination, direct detail links, and CTA paths.

**Acceptance criteria**
- The visible item list agrees with published/generated route source for the build and with any documented live revalidation behavior.
- Origin and destination are not reversed or silently replaced.
- Slugs are unique and resolve to the matching route.
- Route cards show only valid values; absent prices appear as “on request” or equivalent, not synthesized zero.
- Direct route links retain correct trip category and origin/destination when opening booking.
- An empty or failed route manifest produces a visible fallback/error state rather than fabricated live route fares.

### FR-CAT-002 — Route detail

The page must show the correct corridor, supported trip types, distance/duration sourced from the approved route data, eligible vehicle options/indicative fares, and clear book/contact CTAs.

**Acceptance criteria**
- Route URL slug, heading, origin, destination, and booking query are coherent.
- Fare values are not used as a substitute for live quote service results.
- Unsupported or unavailable fleet categories cannot be booked silently.
- Broken route details show an unavailable/not-found state with a path back to Routes/Contact.

### FR-CAT-003 — Vehicle/fleet showroom

The fleet page and model details display canonical fleet groups/models, seating/luggage capacities, images, details, and the appropriate booking or rental inquiry path.

**Acceptance criteria**
- Category filters (all, sedan, SUV, luxury, tempo traveller where present) show only matching cards and their counts are coherent.
- Model seats and luggage values do not contradict the current live fleet API or the canonical fleet registry.
- A model with insufficient passenger capacity is not selectable for a request that exceeds capacity.
- Image load failures use an appropriate fallback and do not break card height/layout.
- Booking CTAs preserve selected model/tier intent without forcing an ineligible vehicle.
- A stale, archived, inactive, or missing model must not be sold as live-available.

### FR-CAT-004 — Tour packages

The packages hub supports category filtering (e.g., sightseeing, dawn, pilgrimage, excursion, multi-day), search, pagination, cards, package details, image galleries, itinerary chapters, inclusions/exclusions, commercial notes, and booking actions.

**Acceptance criteria**
- Filter and search work together and clearing search resets the list predictably.
- Package details match the selected slug/ID.
- Dynamic items from the backend catalog use the current public response; they must not silently fall back to a different product when a slug is missing.
- Unavailable/archived products cannot proceed to a successful booking.
- Price on request is not rendered as ₹0.
- Package booking action passes the correct slug/category to the booking page.
- Gallery controls update the active image and close correctly on mobile/desktop.

### FR-CAT-005 — Local sightseeing and transfers

Local package/transfer detail must show actual duration, distance allowance, relevant pickup/drop/airport/station fields, vehicle/fare availability, policies, and the correct booking route.

Test package types such as 4h/40km, 8h/80km, and 12h/120km where the current dataset contains them; do not require every named package to exist in the deployed dataset. Validate station/airport transfer details for incorrect place labels, wrong pickup/drop direction, missing mandatory fields, or stale rates.

### FR-CAT-006 — Live catalog products

`ProductDetailPage` and live package/detail loaders must correctly fetch and display the requested published catalog item by its canonical category and code/slug.

**Acceptance criteria**
- API route/category/slug match the current URL.
- A loading state is followed by a ready or explicit missing/error state.
- Invalid catalog item responses do not render stale details from a previous item.
- Live availability and status are honored, and an archived/unavailable item cannot show a valid booking CTA without a clear block.
- The API's null/absent price remains null/on-request instead of being coerced to zero.

### FR-CAT-007 — Catalog changes from Admin

Use a controlled staging test where a unique test item can be published/unpublished through the admin panel or seeded into staging. Verify the full lifecycle:

1. Draft content is not public.
2. Publishing produces the correct publishing event and subsequent generated manifest/build.
3. After the release is activated and verified, the customer site exposes the item at the expected URL.
4. Changes to price, duration, itinerary, status, slug, or image appear as appropriate without cross-product leakage.
5. Archived/unpublished items are not shown in public listings/sitemap as live products.
6. A failed publishing event is visible as a deployment/content freshness failure; the frontend must not pretend the newest revision is live.

Do not mutate production content for this test.

---

## 9. Booking funnel — highest priority

### FR-BOOK-001 — Booking entry and prefilled state

The booking page supports entry via direct route, homepage CTA, route detail, vehicle detail, package detail, transfer detail, and restoration after an authentication redirect.

**Acceptance criteria**
- Query values are parsed and validated (origin, destination, trip category/type, package/route, vehicle, date, step).
- Invalid/incomplete query values do not crash the form or bypass required selections.
- Back/forward navigation and refresh do not create duplicate reservations.
- Restored intent is clearly presented and reconciled against current backend data; a stale quote requires re-quote/acceptance before checkout.

### FR-BOOK-002 — Trip type, route, and locations

User can choose a supported one-way/round-trip or supported product-specific trip type. Origin and destination inputs use available location suggestions/autocomplete and accept valid custom/preset locations according to the product rule.

**Acceptance criteria**
- Required locations must be present and valid according to the backend contract.
- Where prohibited, origin and destination cannot be identical without explicit supported local-sightseeing semantics.
- Selecting a suggestion fills the intended place, not the adjacent result.
- Suggestions are keyboard accessible (arrow keys, Enter, Escape); an autocomplete selection is not confused with an arbitrary stale highlighted option.
- Network failures in autocomplete are communicated and do not freeze unrelated form controls.
- Query parameters such as `from`/`to` are normalized safely and are not used to inject HTML/scripts.

### FR-BOOK-003 — Pickup/return date and exact time

The customer selects a pickup date and pickup time; round-trip products may require a return date/time according to the form and backend contract.

**Acceptance criteria**
- Past pickup dates are blocked or rejected consistently.
- Return date/time cannot precede pickup when return is required.
- Pickup date and exact time are kept as a well-defined local time in the agreed business timezone (IST unless the backend contract specifies otherwise).
- No silent default of 09:00 or current time is substituted when a time is entered.
- The same instant/value survives quote refresh, auth redirect, booking creation, booking GET, My Bookings, confirmation UI, PDF voucher, and confirmation email where those surfaces include pickup time.
- Changing the date/time invalidates or refreshes any quote whose validity depends on it.
- Invalid, empty, malformed, or impossible dates cannot be submitted.
- Date/time format displayed to the customer is unambiguous and appropriate for `en-IN`/IST.

### FR-BOOK-004 — Passengers, luggage, trip duration, and vehicle choice

User specifies passenger count (and luggage where supported) and can select only an eligible vehicle.

**Acceptance criteria**
- Counts accept only contract-valid integers and sensible ranges.
- Vehicle eligibility is recalculated when passenger/luggage inputs change.
- Over-capacity models are disabled/clearly flagged, not merely visually discouraged.
- Selection state is preserved as the user advances/backtracks.
- Quote corresponds to the selected route, trip type, date/time, duration, vehicle, and product.
- No fixed frontend vehicle pricing overrides the server quote.

### FR-BOOK-005 — Server-authoritative quote and fare breakdown

The booking page requests quote options and a quote from the API/service contract (including relevant `fetchQuoteOptions`/`fetchQuote` calls in `cleanFareApi.ts`).

**Acceptance criteria**
- Loading, no eligible vehicle, invalid input, timeout, and server error states are distinct and recoverable.
- Total fare and line items come from the current successful quote response.
- Advance due, remaining balance, included tolls/taxes, night charge, driver allowance, distance floor, multi-day/round-trip pricing, promotions/discounts, and pricing notes match the backend's returned values and commercial rules.
- The displayed breakdown reconciles arithmetically with the quote contract, including minor-unit to rupee conversion where applicable.
- Null price is not `₹0`; malformed amount cannot enable checkout.
- If quote version/amount changes after a delay or auth redirect, the customer is shown the updated quote and must explicitly accept it before proceeding.
- Refreshing/repeating a quote does not duplicate bookings/payments.

### FR-BOOK-006 — Customer authentication gate

The current flow uses `useCustomerAuth()` and requires a valid access token for the authenticated booking/payment endpoints.

**Acceptance criteria**
- If authentication is required, a signed-out user cannot create a payable reservation through the UI or a direct API attempt.
- Google sign-in and email/password paths behave according to current staging configuration.
- Booking intent survives the redirect securely and returns the customer to the relevant booking step after sign-in.
- Invalid credentials, disabled provider, missing Supabase config, denied OAuth, stale PKCE state, and expired OAuth code return understandable errors without false booking success.
- `returnTo` only accepts safe internal relative paths. Reject protocol-relative URLs (`//evil.example`), `/\\...`, or external URLs.
- Customer profile data prefilled from authentication is editable only where intended and does not overwrite explicit customer-entered values unexpectedly.

### FR-BOOK-007 — Create booking

When the customer confirms the booking, the frontend posts a valid booking payload to the backend (`POST /api/v1/bookings` via the current service) and uses the returned booking ID/ticket reference.

**Acceptance criteria**
- A successful create response includes a valid canonical booking identifier/ticket and valid fare/amount contracts.
- Booking status starts at the backend-authorized pending/payment state; the frontend cannot set it to paid/confirmed.
- API validation errors are surfaced near the relevant form controls where possible.
- On timeout or an ambiguous network result, the client checks/reconciles existing booking intent before blindly creating a second booking.
- Repeated submit clicks while pending do not cause duplicate requests/bookings.
- A malformed successful response is treated as an error; it is not interpreted as a completed booking.
- The returned booking reflects exact pickup timestamp, selected product, vehicle, customer, quote, fare totals, and deposit.

### FR-BOOK-008 — Pre-checkout countdown and payment order

The UI may display a three-second pre-checkout overlay (`BookingPaymentCountdownModal`, `preparing_checkout`) before initiating the configured payment gateway.

**Acceptance criteria**
- The overlay is dismissible before payment launch where the UI promises cancellation; dismissal must not create a payment order/charge.
- The UI blocks duplicate create/payment launches while processing.
- Payment order is requested from the backend for the correct booking and expected amount.
- A missing public provider key, absent order ID, invalid amount, wrong currency, or malformed order response blocks checkout and displays a recoverable error.
- Payment provider opens using the expected order, amount in minor units, and currency from backend response.
- Private payment keys/signatures are never embedded in client code or browser storage.

### FR-BOOK-009 — Razorpay success, failure, dismissal, and verification

The current flow includes gateway callback data and a backend verify call (`verifyBookingPayment`) with provider payment/order/signature values. The backend/webhook remains authoritative.

**Acceptance criteria**
- Gateway success callback is submitted for server verification.
- UI does not mark booking confirmed solely because the gateway's browser callback fired.
- If browser verification fails but webhook/status polling later confirms payment, state eventually becomes captured/confirmed without requesting another charge.
- If status is still pending, show “verification pending” and a safe next step; do not tell the user to pay again immediately.
- Payment failure provides a retry path only when backend state makes retry eligible.
- Checkout dismissal preserves the existing booking and supports safely reopening the same payment flow where valid.
- Double-click, browser reload, callback replay, or multiple tabs cannot create duplicate captures/settlements for the same logical attempt.
- Tampered/forged payment IDs or signatures do not confirm a booking.
- Cancelled, expired, or already-paid bookings cannot launch an ineligible new checkout.

### FR-BOOK-010 — Post-payment verification overlay

The UI may show a seven-second verification/confirmation countdown. This is progress feedback, not proof of capture.

**Acceptance criteria**
- Ticket reference displayed in the overlay matches the backend booking.
- User can navigate directly to confirmation when offered.
- Countdown never changes backend payment state.
- If verification remains incomplete after the countdown, the UI accurately shows pending/unknown state rather than success.
- Reduced-motion preference disables or reduces nonessential animation without hiding status information.

### FR-BOOK-011 — Interrupted flow and payment resume

Payment recovery route is `/payment/resume/`; `PaymentResumePage` validates the saved booking reference and access token, fetches the authoritative booking/payment state, and resumes according to eligibility.

**Acceptance criteria**
- Signed-out customer is prompted to authenticate and returns to payment recovery afterward.
- Saved reference is malformed, expired, missing, or mismatched → payment does not start; customer receives a clear explanation.
- If booking/payment is already captured, the UI shows confirmed booking and does not launch checkout.
- If a payment attempt is pending/uncertain, check provider/backend status before retry.
- “Reopen checkout” uses the same safe attempt/idempotency reference where appropriate; “Retry payment” creates a new attempt/key only when prior attempt is definitively failed and backend permits it.
- A stale booking/fare is revalidated; customer must accept a changed fare.
- Clearing/resuming local data cannot expose another user's booking.

---

## 10. Booking confirmation and voucher

### FR-CONF-001 — Confirmation state resolution

The confirmation page must resolve a booking/ticket reference and load authoritative booking/payment status. It must support loading, pending verification, confirmed, payment failed/ineligible, missing booking, and network failure states.

**Acceptance criteria**
- A “confirmed” banner appears only when the backend says the required payment/booking state is confirmed.
- Displayed ticket ID, customer name, route, pickup date/time, selected product/vehicle, total fare, advance paid, and balance are consistent with the backend booking record.
- Polling is bounded and uses sensible backoff; it does not loop indefinitely or spam the API.
- A missing/invalid ticket reference shows an actionable error, not a generic success screen.
- Direct access cannot retrieve private booking data without the required booking ownership/authentication/token rules.

### FR-CONF-002 — PDF booking voucher

The current service includes `downloadBookingPdf()` for `GET /api/v1/bookings/:id/pdf`; the legacy selector in existing docs is `#btn-download-pdf-voucher` but TestSprite must verify the actual current DOM selector before relying on it.

**Acceptance criteria**
- Download is initiated only for an authorized booking.
- Loading disables repeat clicks and communicates “Generating PDF…” or equivalent.
- Response is a real PDF binary with a `%PDF` header and non-zero plausible size, not HTML/JSON returned with status 200.
- Filename includes the correct ticket/reference and a `.pdf` extension.
- Voucher's pickup time, journey, customer, vehicle, ticket, amounts, terms, and brand details match the booking record.
- API 401/403/404/5xx, timeout, and non-PDF responses show an error and do not save a corrupt file.
- Print action produces a usable print layout; print controls/buttons are not needlessly included in the printed voucher.

### FR-CONF-003 — Support from confirmation

WhatsApp/contact action includes only the appropriate ticket reference and minimal needed context; it must not leak secrets, access tokens, provider signatures, or full personal details into analytics or external URLs.

---

## 11. Customer account and identity

### FR-AUTH-001 — Email/password login

- Validate required email/password input and show accessible inline errors.
- Reject invalid credentials with a generic, non-sensitive error.
- Disable repeated submissions while authenticating.
- On success, persist/authenticate through Supabase according to current settings, restore a safe return path, and update account/header state.
- On backend/service failure, do not create a local fake authenticated session.

### FR-AUTH-002 — Google OAuth and callback

- Start OAuth with the configured provider and a canonical callback URL.
- Correctly exchange the authorization code/PKCE state and restore intended `returnTo` route.
- Handle provider cancel, rate/service outage, invalid callback/code, missing verifier, stale state, and no-session return.
- Strip OAuth error/code parameters when safe and avoid rendering raw provider error strings or tokens in the visible UI.
- A failed or cancelled OAuth flow must not create a booking or charge.

### FR-AUTH-003 — Session persistence and logout

- On reload, an existing session is rehydrated without flashing incorrect private content.
- Expired/invalid tokens are cleared and the user is shown a sign-in path.
- Logout invalidates customer auth state, removes protected cached state and redirects safely.
- Back navigation after logout must not reveal cached personal booking data; protected APIs must still enforce auth.

### FR-AUTH-004 — My Bookings (`/my-bookings/`)

- Signed-out state offers enabled auth methods and does not display another customer’s data.
- Authenticated state fetches only account-associated bookings.
- Correctly shows loading, empty list, error, and populated states.
- Each row/card uses backend booking reference, trip description, pickup time, vehicle tier, total, advance and status.
- Pending/unpaid eligible bookings can continue payment; ineligible or already-paid bookings cannot trigger a new charge.
- Refresh refetches current state and recovers from transient errors.
- One customer's access token cannot read another user's booking via UI or direct API ID substitution.

---

## 12. Rental request intake

### FR-RENT-001 — Vehicle inquiry form

`RentalPage.tsx` loads the published catalog/fleet data and captures a call-first rental quotation enquiry. Exact prices/availability may require a human confirmation and must not be represented as confirmed if the UI says they are not.

**Acceptance criteria**
- Vehicle group/model cards can be selected and the selected model/group is reflected in the form.
- Inputs cover customer contact, vehicle selection, pickup/return dates, passenger count, pickup location in Agra, chauffeur preference, and notes as actually implemented.
- Required input and date-range validation works; return must not precede pickup.
- Submit has a busy state and prevents duplicate requests.
- Success is shown only when `createInquiry`/equivalent returns a valid persisted response ID.
- Network/API failure leaves the form recoverable and provides phone/WhatsApp alternatives.
- Successful rental enquiry is discoverable in the Admin Rental Requests desk with matching reference/customer/request details.

---

## 13. Contact inquiries

### FR-CONTACT-001 — Contact form

`ContactPage.tsx` submits through the public inquiry API/service and explicitly checks that the server success envelope contains a non-empty `data.id`.

**Acceptance criteria**
- Required name, phone, service interest, and message inputs (as implemented) validate correctly.
- Phone and name sanitization/normalization does not silently corrupt valid input.
- Empty, malformed, over-limit, or invalid values cannot be submitted.
- Double submission is blocked while in progress.
- HTTP 200 with missing/empty `data.id` is treated as failure, not success.
- Real persisted success shows confirmation and next steps.
- API 4xx/5xx, timeout, offline, or static hosting fallback yields a useful error and contact alternatives.
- New inquiry appears in the admin inquiries inbox, with status `new` or the backend's canonical initial state.

### FR-CONTACT-002 — Calling/WhatsApp/email

All direct support actions must open the correct phone, WhatsApp, or email destination, encode message text properly, and remain usable at phone viewport widths.

---

## 14. Review submission and public trust content

### FR-REV-001 — Invitation token and prefill

- A valid invitation token loads the server-verified invitation and prefilled name/trip metadata where available.
- Invalid/expired/missing token gives a clear failure state or explicitly documented alternate mode.
- The UI must not badge an unverifiable submission as a verified completed trip.
- Preview mode is clearly labeled and must not be mistaken for a real submission.

### FR-REV-002 — Rating and text validation

- Five selectable ratings from 1–5 have accessible names and expose selected state to assistive technology.
- Review name and review text are required and honor current length limits (observed UI: name up to 120 characters, review text up to 5,000 characters).
- Submit is disabled/guarded while the request is in progress.
- Success message is displayed only after the submission API confirms acceptance. Preview mode may simulate success only when clearly marked “Preview”.
- A rejected validation/API request shows an actionable message and preserves recoverable form state.

### FR-REV-003 — Optional photos and consent

- Accept only image types allowed by the current input/service contract (observed UI: JPEG, PNG, WebP, AVIF); maximum five images in total, each no larger than 5 MB.
- Invalid file type, too-large file, upload failure, or over-limit selection is clearly rejected.
- Uploaded image storage keys are included in the review submission; raw private storage credentials never reach the browser.
- Public-consent checkbox state matches the submitted payload.
- Consent unchecked must not be overwritten as true in request serialization or server persistence.
- Photo uploads and review text must not permit script injection or arbitrary file execution.
- Customer must be informed that the review waits for moderation before public display.

### FR-REV-004 — Public review/gallery display

- Only approved/published, consent-eligible reviews should render in public marquee/gallery.
- Public display shows correct display name, rating, review text, trip/route details, verified indicator only when backed by the data contract, and images/alt text according to current design.
- Rejected/unapproved review fixtures must never appear in public output.
- Snapshot/public API content must avoid leaking ticket IDs, private contact information, moderation notes, tokens, or storage internals.

---

## 15. Static content, policies, SEO, and pre-rendering

### FR-CONT-001 — About/services/FAQ/monuments

These pages must have meaningful content, functioning internal links, correct media, accessible expandable FAQ content, and no placeholder/error text. Published monument detail pages must correspond to the correct monument slug/data item.

### FR-CONT-002 — Terms and cancellation policy

Terms and cancellation/refund language must be consistent between the page, booking review step, and backend rules. Test the visible policy text against the current approved business policy, not older marketing copy alone. Do not assume a “100% refund” statement is correct for all scenarios without confirming the active policy.

### FR-CONT-003 — Privacy policy

- `/privacy-policy/`, `/en/privacy/`, and other supported canonical aliases must return real content and a successful HTTP response.
- No broken links or missing page content.
- The page should correctly describe active sign-in, booking/payment data, reviews/uploads, and communication practices. Flag unsupported claims or outdated policy text for human review.
- Public privacy URL used for OAuth/app branding verification must be responsive in staging and production.

### FR-SEO-001 — Canonical metadata and structured data

- Every indexable marketing/product page should have a useful non-empty title and meta description; titles/descriptions must reflect the actual page.
- Canonical URL and `hreflang`/alternate language links must be valid and internally consistent with the true implemented languages.
- Sensitive/private/noindex routes (booking, login, callback, My Bookings, payment resume, review when configured) must not be accidentally indexed.
- JSON-LD must be valid JSON, safe from markup/script injection, and match visible content. Do not assert `AggregateRating` is present unless current source enables it and reviews are eligible.
- OpenGraph/social metadata use valid absolute or resolvable assets.
- Sitemap URLs must resolve, use canonical HTTPS production origin in production artifacts, and exclude invalid/unsafe slugs and private transaction routes.
- robots.txt must not reference preview, loopback, localhost, or staging hosts in production.

### FR-SEO-002 — SSG and hydration

- First response contains usable page content for pre-rendered routes.
- Hydration preserves content and does not throw React hydration mismatch errors (including React error #418), duplicate headings, or duplicate interactive controls.
- Theme/account/menu state may mount client-side but must not change major layout/content unexpectedly.
- No uncaught browser exceptions or repeated hydration console errors.
- Direct route refresh works on the deployed host, including customer privacy URL and OAuth callback routing.
- Build-generated redirects and pages match the intended sitemap/manifest.

### FR-SEO-003 — Language behavior

If English/Hindi is an active user-facing feature:
- switcher routes to the corresponding translated page (or a documented nearest equivalent) rather than unrelated home content;
- route, package, vehicle, date, price, currency, and contact values remain semantically identical where appropriate;
- `lang`, canonical, `hreflang`, and title metadata correctly reflect the displayed language;
- language persists or changes according to documented design and does not corrupt query parameters.

Report a gap when only the path prefix changes but the actual page text/metadata remains English.

---

## 16. API contract, data integrity, and error resilience

### FR-API-001 — API base configuration

- Verify `VITE_API_BASE_URL` resolves to the expected staging backend at deployment, and to `http://localhost:4000` only for local development when intended.
- Customer deployment must never accidentally send payment/booking traffic to localhost, an admin endpoint, or an unrelated origin.
- Every authenticated call sends a current bearer access token where required.
- CORS, TLS, and error responses are handled correctly.

### FR-API-002 — Strict response validation

- JSON parse failure is surfaced as a failure where structured JSON is expected.
- Malformed successful JSON cannot trigger fake booking/inquiry/payment success.
- Invalid shape/type/null required fields produce a safe error, not silent coercion to a believable value.
- IDs, dates, statuses, fare amounts, currency units, vehicle category, trip type, quote version, and payment status match declared contracts.
- No silent fixtures substitute for live catalog data when the live catalogue is required.
- Optional fields may be omitted only where contract allows; absence of mandatory fields is a contract failure.

### FR-API-003 — Network failures

Test offline/slow/timeout/connection refused/401/403/404/409/422/429/500/502/503 and invalid JSON where relevant. UI must distinguish a safe retry from an operation that may already have succeeded. Mutations with ambiguous outcomes require reconciliation before repeating.

### FR-API-004 — Cross-system data integrity

For controlled staging fixtures, compare the following values across surfaces:

- booking ID/ticket ID;
- selected service/package/route and vehicle tier/model;
- pickup timestamp and return timestamp;
- quote/fare version, total, advance, balance, discount, and included charges;
- booking and payment status;
- provider order/payment identifiers (only where they may be shown to authorized users);
- inquiry reference/status;
- review consent/moderation status.

Source values must agree unless an explicit transformation is documented and mathematically verified.

### FR-API-005 — Amount validation

- Frontend must send only the expected identifier and idempotency fields; it may not select a client-supplied total that overrides the server quote.
- Gateway `amount` uses integer minor units as required by provider schema.
- Rupee rendering converts from paise/minor units exactly once.
- Null, missing, `NaN`, `Infinity`, negative, string-encoded unexpected values, and amounts exceeding provider/schema bounds are rejected as applicable.
- A payment order cannot be created for a zero or malformed amount unless a supported free-booking rule explicitly permits it.

---

## 17. Security and privacy requirements

### FR-SEC-001 — No secrets in the client

Inspect built `react/dist` and client-visible network responses. Do not expose `DATABASE_URL`, `RAZORPAY_KEY_SECRET`, Razorpay webhook secrets, Supabase service-role keys, `RESEND_API_KEY`, private API tokens, or signing secrets. Public Supabase publishable/anon key and Razorpay key ID may be visible where required; verify they are the correct public keys.

### FR-SEC-002 — Authentication/authorization

- Direct requests without token receive the contract-defined 401/403.
- Invalid/expired bearer token is not accepted.
- Customer A cannot read, download, resume payment on, or otherwise inspect Customer B's booking through ID substitution.
- User cannot promote role or customer ID by modifying local storage, URL, request body, or unsigned claims.
- OAuth `returnTo` cannot become an open redirect.
- Auth UI and error states do not leak provider access token, ID token, auth code, PKCE verifier, or stack trace.

### FR-SEC-003 — Payment abuse cases

- A fake success redirect or edited browser callback does not mark a payment captured.
- Replayed success/verify request cannot cause duplicate payment state transitions.
- A valid order ID belonging to another booking cannot be applied to current booking.
- Client amount tampering cannot alter captured amount or booking total.
- Payment launch/retry is prohibited for ineligible booking states and expired orders according to the backend contract.
- Do not execute real charges during security tests.

### FR-SEC-004 — Input/output handling

Test XSS payloads in search, inquiry name/message, review name/text/tour, location inputs, and query parameters. They must render as text, not execute. Validate route slug/code against path traversal/protocol payloads. API errors should not render raw HTML or executable content.

### FR-SEC-005 — Data minimization and analytics

- No sensitive form data, full phone/email, access tokens, payment signatures, or review token should appear in analytics events or verbose production console logs.
- Third-party support links must include only the information needed for the requested action.
- Public review/gallery endpoints must not expose private admin moderation metadata or customer account details.

---

## 18. Non-functional requirements

### NFR-001 — Responsive design

Test at 320×640, 375×667, 390×844, 768×1024, 1024×768, 1280×800, and 1440×900. There must be no page-level unintended horizontal overflow. Forms, dialogs, tables/cards, menus, galleries, and modals must remain operable. Critical touch targets should be at least 44×44 CSS pixels where practical.

### NFR-002 — Accessibility

Target WCAG 2.1 AA for meaningful customer flows:
- keyboard access and visible focus;
- semantic headings, landmarks, form labels, button names;
- error/success announcements via accessible status/alert patterns;
- modal focus containment and restoration;
- accessible autocomplete and star rating controls;
- sufficient contrast and no color-only status meaning;
- correct image alt text;
- reduced-motion support;
- form validation that is understandable without relying on placeholder text.

### NFR-003 — Performance

Record LCP/CLS/INP where test environment supports it. Ensure image sizes/format and lazy-loaded modules do not create huge layout shifts. Avoid unbounded route/catalog requests or repeated polling. Performance numbers are recorded as measured rather than assumed from the PRD.

Suggested staging guardrails for the test report (baseline, not an unconditional claim):
- no page crashes or unresolved fatal console errors;
- no layout shift causing a critical CTA to move under the user's pointer/focus;
- no endless spinner after the backend returns or times out;
- route/catalog search updates promptly for the tested data volume;
- payment status polling respects configured max attempts/backoff.

### NFR-004 — Browser/build quality

- No uncaught errors or unhandled promise rejections on core journeys.
- No missing asset 404s for critical branding, fleet/package imagery, fonts, icons, and local data bundles.
- No mixed-content requests on HTTPS pages.
- Browser history, direct links, refresh, and back/forward work.
- Public pages operate with pre-rendered HTML before hydration where supported.

---

## 19. Test data and execution environment

### 19.1 Required safe environment

Before testing, record:

- actual deployed frontend base URL and build/release identifier;
- actual staging backend API base URL and release identifier;
- whether Supabase staging auth is configured and available;
- the customer test identity/credentials, plus at least two different test customers for ownership isolation;
- Razorpay **test-mode** public key and test gateway availability;
- deterministic staging fixture IDs for route/package/vehicle, one pending booking, one paid booking, one failed payment, and one booking that can be used for PDF download;
- a valid review invitation token and an invalid/expired test token;
- one contact inquiry and one rental request fixture;
- permission for controlled staging test writes and cleanup method.

Do not put credentials, tokens, card details, payment secrets, or real customer personal data inside this PRD or the TestSprite prompt. Configure them through TestSprite secret/environment variable facilities.

### 19.2 Isolation and cleanup

Every state-mutating test should use a unique prefix such as `TS-CUS-<run-id>`. Save created object IDs/booking tickets and clean up only via the documented staging cleanup path. Do not delete shared fixtures or alter production content. If cleanup is unavailable, use a dedicated test dataset and provide a reconciliation report.

### 19.3 Gateway strategy

- Use Razorpay test mode only.
- Never use production key secret or real cards/UPI/transactions.
- For callback-tampering/replay tests, simulate or stub at the test harness/backend test boundary; do not try fraud actions against a real gateway.
- Separate “gateway accepted callback” from “backend has verified capture.”

---

## 20. TestSprite acceptance matrix

Use the following as the minimum test suite. TestSprite must add tests for every additional interactive control, route, form field, response state, and conditional branch discovered in the deployed `react/` build. All stateful tests must verify persisted server results where possible.

### 20.1 Global navigation and route coverage

| ID | Scenario | Expected result |
|---|---|---|
| TS-CUS-001 | Load homepage directly | Content renders; no fatal error, blank body, or critical asset failures. |
| TS-CUS-002 | Refresh each primary hub | Route remains valid after refresh and content is present. |
| TS-CUS-003 | Click every header nav item | Correct destination; active route and navigation state are correct. |
| TS-CUS-004 | Open/close mobile navigation | Drawer toggles, closes after selection, and preserves scroll/focus behavior. |
| TS-CUS-005 | Use browser back/forward across hub/detail/booking | Correct page and relevant query state are restored. |
| TS-CUS-006 | Direct-load every discovered public route | Page matches route family or explicit not-found state. |
| TS-CUS-007 | Unknown/invalid slug | Visible not-found/unavailable outcome, not unrelated content. |
| TS-CUS-008 | Footer phone/WhatsApp/email/policy links | Correct destinations and well-formed URI encoding. |
| TS-CUS-009 | Page title/meta/canonical | Metadata is present and describes the actual route. |
| TS-CUS-010 | Browser console/network baseline | No fatal console error, unhandled rejection, or critical same-origin 404. |
| TS-CUS-011 | Reduced-motion preference | Essential functionality remains; nonessential animation is reduced. |
| TS-CUS-012 | Click and keyboard interact with all shared controls | Focus is visible and controls are reachable/actionable. |

### 20.2 Homepage, catalog, discovery

| ID | Scenario | Expected result |
|---|---|---|
| TS-CUS-013 | Homepage primary booking CTA | Opens booking route with intended initial state. |
| TS-CUS-014 | Homepage reviews marquee | Only expected approved/generated reviews render; no broken layout. |
| TS-CUS-015 | Review marquee motion accessibility | Hover/focus and reduced-motion behavior remains usable. |
| TS-CUS-016 | Routes hub search | Search narrows the visible set correctly. |
| TS-CUS-017 | Routes hub filter/pagination | Filters and paging update the list; clear/reset restores the correct state. |
| TS-CUS-018 | Route detail opened from card | Correct origin/destination/slug and route details. |
| TS-CUS-019 | Route detail booking CTA | Booking query retains route, origin, destination and trip type. |
| TS-CUS-020 | Fleet category filters | Only matching fleet group appears; counts/empty state are coherent. |
| TS-CUS-021 | Fleet model detail | Model name/capacity/image match the selected model. |
| TS-CUS-022 | Missing fleet image | Fallback works without broken image or layout collapse. |
| TS-CUS-023 | Vehicle booking CTA | Selected model/tier is carried into booking, if supported. |
| TS-CUS-024 | Package category tabs | Each category yields the correct set; changing category resets page as needed. |
| TS-CUS-025 | Package search and clear | Query filters correctly and clear restores results. |
| TS-CUS-026 | Package pagination | No empty/duplicate pages or out-of-range navigation. |
| TS-CUS-027 | Package detail / itinerary | Content matches selected slug, with inclusions/exclusions and correct order. |
| TS-CUS-028 | Package image gallery | Active image changes correctly; modal opens/closes on desktop and mobile. |
| TS-CUS-029 | Dynamic catalog item loading | Loading resolves to correct live item or explicit unavailable state. |
| TS-CUS-030 | Null/unpriced catalog item | UI indicates on-request; never synthesizes ₹0. |
| TS-CUS-031 | Unavailable/archived product | Cannot continue as if bookable. |
| TS-CUS-032 | Local sightseeing detail | Duration/distance/product data match current published data. |
| TS-CUS-033 | Transfer detail | Correct pickup/drop/station/airport direction and CTA. |
| TS-CUS-034 | Monument hub/detail | Links, images, content, and slugs resolve correctly. |
| TS-CUS-035 | Live catalog API unavailable | Explicit safe error/fallback; no fabricated live fares. |
| TS-CUS-036 | Admin publish-to-customer integration | Published revision becomes public only after actual build/release activation. |
| TS-CUS-037 | Unpublish/archive integration | Item is removed/marked unavailable from public listing and sitemap after successful release. |

### 20.3 Booking form and quote integrity

| ID | Scenario | Expected result |
|---|---|---|
| TS-CUS-038 | Open booking with empty required fields | Next/submit is blocked with understandable validation. |
| TS-CUS-039 | Open booking from a prefilled route URL | Origin, destination, route/category are prefilled correctly. |
| TS-CUS-040 | Select supported trip type | Fields/quote request update as expected. |
| TS-CUS-041 | Location autocomplete by keyboard | Focus/highlight/Enter/Escape behavior is correct. |
| TS-CUS-042 | Location autocomplete API failure | Recoverable message; form does not freeze. |
| TS-CUS-043 | Origin/destination invalid or identical | Rejected unless an explicitly supported local trip permits it. |
| TS-CUS-044 | Select future pickup date and non-default time | Exact selected timestamp is preserved. |
| TS-CUS-045 | Past pickup date | Rejected in UI or backend validation. |
| TS-CUS-046 | Return before pickup | Rejected with clear validation. |
| TS-CUS-047 | Timezone round trip | Customer-selected IST time stays the same through request/response/display. |
| TS-CUS-048 | Verify no default 09:00 substitution | Enter e.g. 14:35 and confirm every surface retains that time. |
| TS-CUS-049 | Passenger count boundary | Min/max and invalid values obey contract. |
| TS-CUS-050 | Capacity eligibility | Over-capacity vehicle is disabled and cannot be submitted. |
| TS-CUS-051 | Vehicle selection changes quote | Quote corresponds to the selected eligible vehicle. |
| TS-CUS-052 | Server quote loading/error/empty states | Distinct correct UI; no stale quote presented as current. |
| TS-CUS-053 | Fare reconciliation | Total equals response line items per API rule; amount unit conversion occurs once. |
| TS-CUS-054 | Advance/balance display | UI matches backend deposit/balance; avoids hard-coded drift. |
| TS-CUS-055 | Round trip and duration-dependent pricing | Rate/distance rules match backend quote. |
| TS-CUS-056 | Night/driver/toll/tax line items | Display matches applicable response and business rule. |
| TS-CUS-057 | Promo/discount boundary | Applicable promo reflected once; invalid/ineligible promo not applied. |
| TS-CUS-058 | Quote amount changes after refresh/sign-in | Updated value is shown and explicit acceptance is required. |
| TS-CUS-059 | Null/missing/string/NaN/negative amount | Checkout disabled; readable contract error, no gateway order created. |
| TS-CUS-060 | Submit repeatedly/rapid-click | One logical booking is created, not duplicate records. |
| TS-CUS-061 | API returns HTTP 200 but malformed booking response | UI does not claim success; safely reconciles. |
| TS-CUS-062 | Booking create timeout after server persistence | Client reconciles booking before retrying create. |
| TS-CUS-063 | Try to force paid/confirmed status client-side | Backend ignores/rejects state tampering. |

### 20.4 Authentication and booking ownership

| ID | Scenario | Expected result |
|---|---|---|
| TS-CUS-064 | Submit booking while signed out | Required auth gate is respected; no unauthorized payable booking. |
| TS-CUS-065 | Email/password login valid credentials | Session created; safe return route restored. |
| TS-CUS-066 | Email/password invalid credentials | Clear generic error; no fake session. |
| TS-CUS-067 | Password/email required validation | Invalid form is blocked before auth request. |
| TS-CUS-068 | Google OAuth success | Callback exchange succeeds and safe return route is restored. |
| TS-CUS-069 | Google OAuth cancel/error | No booking or payment; friendly recoverable message. |
| TS-CUS-070 | Stale PKCE/verifier | Old state is cleared/retry path offered; no endless loop. |
| TS-CUS-071 | Malicious `returnTo` | External/protocol-relative URL rejected. |
| TS-CUS-072 | Missing Supabase configuration | Sign-in disabled or useful configuration error; no crash. |
| TS-CUS-073 | Session refresh/reload | Session is restored correctly; private data does not flash to another user. |
| TS-CUS-074 | Logout then browser back | No cached private booking content is exposed. |
| TS-CUS-075 | Customer A calls Customer B booking endpoint | 401/403/404 per contract; no private booking data leaked. |
| TS-CUS-076 | Tamper customer ID/token/local storage | Client changes do not elevate identity or access. |
| TS-CUS-077 | My Bookings signed-out state | Auth gate and sign-in options show; no booking rows visible. |
| TS-CUS-078 | My Bookings empty state | Clear empty message and functional Plan a trip CTA. |
| TS-CUS-079 | My Bookings populated state | Only account-linked records with correct ticket/date/fare/status. |
| TS-CUS-080 | My Bookings refresh | List refreshes from API and updates status. |

### 20.5 Checkout and payment

| ID | Scenario | Expected result |
|---|---|---|
| TS-CUS-081 | Open pre-checkout overlay | Correct progress state; duplicate action blocked. |
| TS-CUS-082 | Cancel before gateway launch | No charge; booking remains in expected state. |
| TS-CUS-083 | Missing public gateway key/order ID | Checkout blocked with recoverable error. |
| TS-CUS-084 | Verify order amount/currency/order ID | Checkout uses backend-provided values and minor-unit amount. |
| TS-CUS-085 | Sandbox payment success callback | Frontend submits callback values to backend verification. |
| TS-CUS-086 | Callback returned but server status pending | UI does not show confirmed state prematurely. |
| TS-CUS-087 | Verified captured webhook/status | Booking becomes confirmed only after server says so. |
| TS-CUS-088 | Payment failure | Accurate failure state and eligible retry path. |
| TS-CUS-089 | Checkout modal dismissed | Booking retained; safe reopen offered when eligible. |
| TS-CUS-090 | Forged payment success payload | Backend rejects; no capture/confirmed status. |
| TS-CUS-091 | Wrong order/payment ID for a booking | Backend rejects cross-booking association. |
| TS-CUS-092 | Replay duplicate verify/callback | Idempotent state; no duplicate capture or false transition. |
| TS-CUS-093 | Already-paid booking visits checkout/resume | No new payment is launched. |
| TS-CUS-094 | Expired/cancelled booking attempts payment | Backend rejects and UI guides user to re-quote/rebook. |
| TS-CUS-095 | Payment response `amount_paise: null` | Clear error; no Razorpay checkout opens. |
| TS-CUS-096 | Lost network after payment authorization | UI reconciles status before offering another payment. |
| TS-CUS-097 | Seven-second confirmation overlay | Progress display does not itself claim proof of payment. |
| TS-CUS-098 | Resume payment signed out | Auth prompt returns to `/payment/resume/` safely. |
| TS-CUS-099 | Resume payment, capture already complete | Displays confirmed booking and avoids duplicate charge. |
| TS-CUS-100 | Resume payment after definitive failure | Eligible new attempt uses a new attempt/idempotency key. |
| TS-CUS-101 | Payment status polling bound | Stops/retries as configured; no infinite polling. |
| TS-CUS-102 | Inspect client bundle and network | No private gateway/webhook/database/service-role secret. |

### 20.6 Confirmation and voucher

| ID | Scenario | Expected result |
|---|---|---|
| TS-CUS-103 | Open confirmation for captured booking | Correct confirmed state and booking details. |
| TS-CUS-104 | Open confirmation while payment pending | Pending verification state; no false guarantee. |
| TS-CUS-105 | Missing/invalid ticket | Actionable error; no unrelated booking shown. |
| TS-CUS-106 | Download PDF voucher | Valid PDF binary downloads with sensible ticket filename. |
| TS-CUS-107 | PDF contains correct ticket, route, pickup time and amounts | Contents match authoritative booking API exactly. |
| TS-CUS-108 | PDF endpoint returns HTML/JSON with HTTP 200 | UI rejects invalid file and shows error. |
| TS-CUS-109 | Unauthorized PDF ID substitution | Backend blocks another customer's voucher. |
| TS-CUS-110 | Voucher endpoint timeout/401/404/500 | Retryable message; no corrupt download. |
| TS-CUS-111 | Print voucher | Printable layout omits nonessential navigation controls. |
| TS-CUS-112 | Confirmation contact/WhatsApp link | Correct number and safe/minimal message content. |

### 20.7 Rental and contact inquiry

| ID | Scenario | Expected result |
|---|---|---|
| TS-CUS-113 | Rental page loads published vehicles | Current models load; clear loading/empty/error handling. |
| TS-CUS-114 | Select a rental model | Chosen vehicle/group reflected in enquiry form. |
| TS-CUS-115 | Rental date range invalid | Return before pickup is blocked. |
| TS-CUS-116 | Rental form missing required fields | Inline validation and no API mutation. |
| TS-CUS-117 | Submit rental enquiry | One persisted inquiry and success state with safe reference if exposed. |
| TS-CUS-118 | Double-click rental submit | One logical enquiry only. |
| TS-CUS-119 | Rental API failure/static fallback HTTP 200 | Not shown as persisted success without valid server ID. |
| TS-CUS-120 | New rental enquiry in Admin | The submitted staging request appears with matching details. |
| TS-CUS-121 | Contact form invalid name/phone/service | Validation prevents invalid request. |
| TS-CUS-122 | Contact form valid submission | Valid `data.id` returned and success shown. |
| TS-CUS-123 | Contact returns HTTP 200 without `data.id` | Treated as error, not success. |
| TS-CUS-124 | Contact API 4xx/5xx/offline | Form remains recoverable and support links remain usable. |
| TS-CUS-125 | New contact enquiry in Admin | Admin inbox contains matching details and initial status. |

### 20.8 Reviews, uploads, and consent

| ID | Scenario | Expected result |
|---|---|---|
| TS-CUS-126 | Valid review invitation token | Token resolves and supported trip/name details prefill. |
| TS-CUS-127 | Missing/expired/invalid token | Clear unverified state; cannot claim verified completed trip. |
| TS-CUS-128 | Preview-mode review | “Preview” is explicit; no real server submission is implied. |
| TS-CUS-129 | Select each star rating | Selected state and accessible label update 1–5. |
| TS-CUS-130 | Review text/name required | Empty form blocked; length limits enforced. |
| TS-CUS-131 | Submit valid real review | API confirms acceptance, submission pending moderation. |
| TS-CUS-132 | Review API failure | No fake success; text retained and retry available. |
| TS-CUS-133 | Upload supported image under 5 MB | Upload returns a usable storage key and count increments. |
| TS-CUS-134 | Upload >5 MB/wrong MIME/over 5 images | Input rejected with useful reason. |
| TS-CUS-135 | Consent unchecked | Submitted/persisted public consent is false. |
| TS-CUS-136 | XSS payload in review name/text | Rendered as text; no script executes. |
| TS-CUS-137 | Public reviews after submission | Pending/rejected/non-consenting review not rendered publicly. |
| TS-CUS-138 | Public review/gallery privacy | No token, phone/email, ticket ID, or moderation internals leak. |

### 20.9 SEO, rendering, reliability, security, and compatibility

| ID | Scenario | Expected result |
|---|---|---|
| TS-CUS-139 | `/privacy-policy/` HTTP responsiveness | Returns the actual policy page with non-empty content. |
| TS-CUS-140 | English/Hindi language switch | Correct route/content/lang/canonical/hreflang; report parity gaps. |
| TS-CUS-141 | Production SEO artifacts | Canonical host is production HTTPS, no preview/loopback host. |
| TS-CUS-142 | Sitemap/robots checks | Valid XML/URLs; private and unsafe slugs excluded. |
| TS-CUS-143 | Structured data parsing | JSON-LD parses and matches visible content. |
| TS-CUS-144 | Hydration test on home and representative detail pages | No hydration error (including React #418) or duplicate UI. |
| TS-CUS-145 | Direct refresh on dynamic published route | Correct page after refresh; no static host 404. |
| TS-CUS-146 | 320/375/390 px mobile | No unexpected horizontal overflow; core CTA/form usable. |
| TS-CUS-147 | 768 px tablet layout | Navigation, grids, dialog and forms remain usable. |
| TS-CUS-148 | 1280/1440 px desktop | No overlapping layout, excessive unintended content truncation, or broken action alignment. |
| TS-CUS-149 | Keyboard-only critical journey | Booking, sign-in, inquiry, rating and modal controls usable by keyboard. |
| TS-CUS-150 | Slow/offline API | Appropriate error/retry and no endless spinner or fake success. |
| TS-CUS-151 | Malformed API JSON/schema | Contract error handled; never becomes believable zero/default data. |
| TS-CUS-152 | XSS in query/search/form input | No script execution or unsafe HTML rendering. |
| TS-CUS-153 | Client assets/network audit | No critical asset 404, mixed content, or private secret. |
| TS-CUS-154 | Browser back after logout or account change | Private data is not revealed from stale cache. |
| TS-CUS-155 | Request correlation/diagnostics | Relevant requests are diagnosable without exposing sensitive payloads. |
| TS-CUS-156 | Cross-surface booking time parity | Exact time agrees across booking record, My Bookings, confirmation and PDF. |
| TS-CUS-157 | Cross-surface amount/status parity | Backend booking/payment, customer UI and voucher agree. |
| TS-CUS-158 | Fresh build route coverage | Test every emitted route and each discovered dynamic route family. |

---

## 21. End-to-end workflows

TestSprite must run these as connected workflows, not only as independent page assertions.

### E2E-01 — Browse to paid booking

1. Open homepage.
2. Navigate to Routes or Packages and open a real published item.
3. Click booking CTA and verify selected item/route is preserved.
4. Enter valid locations, a future date, a non-default time, passengers/luggage, and an eligible vehicle.
5. Retrieve a server quote and reconcile the line items.
6. Sign in, return to the same booking intent, and accept any changed quote explicitly.
7. Create one booking.
8. Launch Razorpay test-mode checkout and complete a permitted sandbox payment.
9. Wait for backend-confirmed status, then open the confirmation page.
10. Validate ticket, exact pickup date/time, selected product/model, totals, advance, balance, and voucher.
11. Verify backend row/state and relevant email delivery only if staging email is intentionally enabled and test inbox access is provided.

**Pass condition:** one booking, one intended payment attempt/capture, backend-confirmed final status, exact values across all observable surfaces, no private secrets or duplicate records.

### E2E-02 — Interrupted payment and safe recovery

1. Create a staging booking with a valid quote.
2. Close the gateway or simulate a controlled network interruption before final verification.
3. Visit `/my-bookings/` and then continue payment.
4. Reopen `/payment/resume/`.
5. Verify the latest server state before retrying.
6. If already captured, do not reopen payment; if definitively failed and eligible, create a safe new attempt.

**Pass condition:** booking is not duplicated and the customer is never prompted to pay again when capture is already complete/uncertain.

### E2E-03 — Contact and rental inquiry to Admin

1. Submit one unique contact inquiry.
2. Submit one unique rental enquiry using a selected vehicle/model.
3. Verify each is persisted once.
4. Open the staging admin inboxes and compare ID/reference, fields, timestamps, and initial status.
5. Verify failed or malformed API responses do not produce a customer-facing success message.

### E2E-04 — Review invitation and moderation

1. Create/use a valid staging review invitation from Admin.
2. Open the customer link and validate prefill.
3. Submit rating, text, optional safe image, and public-consent choice.
4. Verify a persisted pending review exists.
5. Confirm it does not appear in the public marquee before moderation/publication.
6. Approve/publish via Admin in staging and verify public snapshot/build lifecycle.
7. Test a non-consenting or rejected review remains private.

### E2E-05 — Admin content publish to customer render

1. Create a uniquely identifiable draft route/package in staging.
2. Confirm it is not visible as a published public item.
3. Publish it via Admin and observe the event/outbox lifecycle.
4. Wait for confirmed build activation/release verification using the documented staging process—not an arbitrary fixed sleep alone.
5. Open the expected customer URL directly and by catalog navigation.
6. Edit the item and confirm the expected updated fields appear only after the new revision is activated.
7. Archive/unpublish and verify the public representation is withdrawn/marked correctly after release.

### E2E-06 — Account isolation

1. Sign in as Customer A and create/access a staging booking.
2. Sign out; sign in as Customer B.
3. Visit My Bookings and attempt to access A's booking ID or voucher endpoint by URL/API substitution.
4. Attempt payment-resume reference substitution.

**Pass condition:** B sees only B's records; unauthorized direct requests are denied by backend even if a UI route is manually typed.

---

## 22. Severity, reporting, and release gate

### Severity definitions

- **P0 / Blocker:** unauthorized access to booking/customer data; false paid/confirmed state; duplicate charge; amount tampering; private secret exposure; invalid payment verification; successful booking despite invalid critical inputs.
- **P1 / Critical:** booking creation broken; wrong pickup time/date persisted; quote total/advance mismatch; account ownership failure; voucher exposes wrong customer's data; contact/rental request falsely succeeds; broken auth recovery; major public content points to incorrect product/fare.
- **P2 / Major:** core routes/hubs broken, important catalog/CTA behavior incorrect, payment recovery unusable for eligible booking, language/content mismatch, major mobile layout/accessibility defect, invalid public review visibility.
- **P3 / Moderate:** noncritical layout details, metadata omissions on isolated pages, minor responsive polish, noncritical console warnings.

### Release gate

Do not recommend production approval unless:

- all P0/P1 cases pass or there is an explicitly approved, documented exception;
- booking/payment ownership and amount/unit integrity pass;
- exact pickup date/time is preserved end-to-end;
- callback forgery/replay and duplicate payment tests are blocked;
- customer booking and voucher authorization pass;
- all main route families have direct-load coverage;
- public privacy policy URL works;
- build/hydration checks show no critical failures;
- all state mutations in staging have been recorded and reconciled;
- failed tests include browser/API evidence and are not silently skipped.

### Required TestSprite deliverables

1. Route inventory actually discovered from staging and build artifacts.
2. Test case list with test IDs, priority, preconditions, selectors, and expected outcome.
3. Execution summary with pass/fail/blocked/skipped and exact environment/build IDs.
4. Evidence for each P0/P1 failure: screenshots, console output, relevant network request/response, and associated staging fixture/booking ID (redact secrets/PII).
5. Duplicate/consistency report for created bookings, payment attempts, inquiries, reviews, and published items.
6. Contract gap register linking frontend field → request schema → backend response/storage → visible UI.
7. Explicit list of tests not run, why they were blocked, and what access/test data is missing.
8. Final recommendation: ready / not ready / blocked, with blockers sorted by severity.

---

## 23. Out of scope and safety boundaries

- Do not modify production data, publish real content, archive production catalog items, or create real payment transactions.
- Do not conduct denial-of-service testing or high-volume attack traffic against the live service.
- Do not test against real customer personal information unless explicitly approved and suitably masked.
- Do not assume email delivery, live Razorpay settlement, WhatsApp delivery, or third-party OAuth provider success without configured staging access and observable evidence.
- TestSprite is testing the deployed application; it should not silently change code or database schemas to make a test pass. Report suspected code/data defects separately for remediation.

---

## 24. Source areas reviewed

This PRD was assembled from source and repository documentation in the following areas (branch state can change; re-check files before final release):

- `react/src/app/App.tsx`, `react/src/app/ServerApp.tsx`, `react/src/app/routes.tsx`
- `react/src/auth/customerAuth.tsx`
- `react/src/features/booking/BookingPage.tsx`, `react/src/features/booking/clean/CleanBookingPage.tsx`, `react/src/features/booking/clean/BookingPaymentCountdownModal.tsx`
- `react/src/pages/BookingConfirmationPage.tsx`, `react/src/pages/PaymentResumePage.tsx`, `react/src/pages/MyBookingsPage.tsx`, `react/src/pages/LoginPage.tsx`, `react/src/pages/AuthCallbackPage.tsx`, `react/src/pages/ReviewPage.tsx`
- `react/src/pages/RoutesPage.tsx`, `PackagesPage.tsx`, `FleetPage.tsx`, `RentalPage.tsx`, `ContactPage.tsx`, `ProductDetailPage.tsx`, `RouteDetailPage.tsx`, `VehicleDetailPage.tsx`, `TransferDetailPage.tsx`, `LocalPackageDetailPage.tsx`, `LivePackageDetailPage.tsx`, `MonumentsPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`, `FaqPage.tsx`, `NotFoundPage.tsx`
- `react/src/services/cleanFareApi.ts`, `catalog.ts`, `catalogManifest.ts`, `customerAuthApi.ts`, `api.ts`
- `react/scripts/prerender.ts`, `build-manifest.ts`, `generate-sitemap.ts`, `validate-seo-artifacts.ts`
- Existing baseline: `docs/CUSTOMER_SITE_PRD.md`, `FRONTEND_RULES.md`, `BACKEND_RULES.md`, `docs/DEPLOYMENT.md`

**Document end.**
