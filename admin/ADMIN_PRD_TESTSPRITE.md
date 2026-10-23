# Product Requirements Document (PRD)
## Admin Operations Desk — Agra SK Baghel Tour & Travels

**Purpose:** Source-of-truth functional specification and end-to-end test plan for TestSprite  
**Product:** Admin SPA + its authenticated backend/API integrations  
**Repository:** `tarun1sisodia/Agra-Sk-Baghel-Tour-And-Travels`  
**Admin source root:** `admin/`  
**Backend source root:** `backend/`  
**Observed source snapshot:** `main` at revision `3e3bc81b050c535576c74b4eb2a40efcae2ba8b2`, repository files inspected on 22 October 2026  
**Test target:** Use the exact staging admin URL and staging API configured for the test run. Do not assume production is safe for mutations.  
**Status:** Implementation-informed specification. Not all documented behaviors are verified as working; run the tests and report discrepancies.

---

## 1. Executive Summary

The Admin Operations Desk is the internal operations interface for Agra SK Baghel Tour & Travels. It brings together booking operations, vehicle/fleet configuration, route and product content management, fare configuration, review moderation, incoming leads, finance/refunds, policy content, trip/dossier sign-off, publication deployment events, and audit visibility.

The objective of this PRD is to let TestSprite generate and execute an end-to-end test suite against the **current implementation**, verify the critical backend contracts, and report functionality that is absent, inaccessible, inconsistent, or unsafe. Tests must not treat this document—or an older PRD—as proof that a feature is implemented. The current source routes, UI controls, API calls, backend authorization, persisted data, and observed customer-site result determine whether a requirement passes.

### 1.1 Primary goals

1. Verify that authorized staff can sign in and use every admin route supported by the application.
2. Exercise every visible create, read, update, publish, archive, retry, moderation, status-transition, note, and refund action.
3. Verify that the UI reads and writes real backend data; it must not silently replace failed requests with fixtures or fabricated records.
4. Detect frontend/backend/database contract breaks, especially missing required fields, incompatible enum values, units, null handling, timestamp interpretation, and stale-write conflicts.
5. Protect payment operations, customer contact information, publishing controls, and audit records from unauthorized access or duplicate actions.
6. Verify that a reported successful mutation is reflected after reload and, where relevant, in the customer-facing site after the publication pipeline finishes.
7. Produce reproducible TestSprite evidence: steps, environment, response, screenshot, failed assertion, and correlation/request ID when available.

### 1.2 Success metrics

- 100% of admin routes listed in Section 4 have at least one smoke test.
- 100% of visible primary actions have a positive-path and relevant negative-path test.
- All critical security and payment tests pass before production approval.
- No mutation is marked successful if the backend rejects it or the persisted state does not change.
- Zero duplicate refunds after retrying an identical idempotency key.
- Zero unauthorized access to protected PII, refunds, protected mutations, or audit modification endpoints.
- All critical cross-system workflows finish in their expected terminal state, or remain explicitly failed/pending with actionable diagnostics.

---

## 2. Important Source-of-Truth Rules and Known Discrepancies

These are **test findings to verify**, not assumptions to paper over. The repository contains an older `docs/admin/ADMIN_PRD.md` that describes five operational roles and some behaviors that differ from current source files.

### 2.1 Role model mismatch — critical

Current `admin/src/lib/types.ts` declares only `super_admin` and `finance_operator`. However, `admin/src/lib/auth.ts` extracts a normal Supabase user only when `app_metadata.role === 'super_admin'`, and `getStoredSession()` also rejects a stored role other than `super_admin`. The current UI permission constants grant most capabilities only to `super_admin`, while `finance:refund` lists both `super_admin` and `finance_operator`. The older PRD describes five roles (`dispatcher`, `content_editor`, `review_moderator`, `finance_operator`, `super_admin`) and a test role selector that is not present in the inspected `LoginPage` implementation.

**Required TestSprite behavior:**
- Do not invent or expect a five-role selector in the sign-in page.
- Test the real authentication path and report the `finance_operator` login/session inconsistency as a defect if it remains reproducible.
- Validate role restrictions at the backend/API boundary as well as button visibility. Hiding a button is not authorization.
- Do not weaken assertions just because the stale PRD claims a role should work.

### 2.2 Session storage mismatch

The older PRD says session storage is used, but `admin/src/lib/auth.ts` uses `localStorage` with the key `skb-admin-session`. Test the actual behavior and determine whether logout, token expiry, browser reload, and navigation after logout meet the intended security policy. Record this as a product/security decision if local persistence is not intended.

### 2.3 Booking response normalization can hide contract failures

The current admin API mapper contains fallback values for some fields, including a current timestamp fallback for missing pickup date/time, a fallback booking status/version, and fallback amounts. Tests must distinguish legitimate optional values from missing required contract fields. A missing timestamp must not silently turn into “now”; a missing or null payment amount must not display as a valid ₹0 payment unless the API contract explicitly defines zero as valid. Invalid records should fail validation or produce an explicit data-quality warning.

### 2.4 API path families are mixed

The admin API client calls both `/api/v1/ops/admin/...` and `/api/v1/admin/...` route families. The fare-admin UI also uses endpoints under `/api/v1/admin/...`, while the core operations desk uses `/api/v1/ops/admin/...`. Verify that authentication, authorization, validation, response schemas, and error contracts are consistent across both groups.

### 2.5 Authentication test hooks must remain non-production

`admin/src/App.tsx` includes a development-only `?dev_auth=super_admin` shortcut and `admin/src/lib/auth.ts` includes local development credentials. TestSprite must verify these shortcuts work only in local development/test configuration and are not usable in a production build or production URL.

### 2.6 Do not assume payment or publishing success from a single acknowledgement

A payment marked `captured` must be grounded in the backend’s provider/webhook-confirmed state, not merely a frontend response. A publishing event marked “Live on Website” must be checked against the expected release identifier/content served by the customer site where the environment supports that check; a successful deploy-hook HTTP response alone is not complete release verification.

---

## 3. Product Scope

### 3.1 In scope

- Admin sign-in, Google OAuth callback, session persistence/validation, logout, expiry handling, and protected routes.
- Dashboard metrics, activity feed, quick links, and refresh behavior.
- Booking list/search/filter/detail/create/status transitions/PII unmasking/concurrency behavior.
- Fleet vehicle groups, vehicle models, preset catalog, image selection/preview, activation.
- Fare settings, round-trip fare rules, extra charges, route distance calculation, and vehicle pricing matrices.
- Outstation routes and their draft/publish/archive lifecycle.
- General catalog CMS, media, status transitions, manifest state, and republish behavior.
- Tour packages, local packages/sightseeing, transfer routes, and their lifecycle actions.
- Company profile, cancellation policy, pet policy, monuments, and related content forms.
- Dossier/sign-off workflow and company dossier status.
- Review invitation link generation, QR/WhatsApp tools, review moderation, publish/unpublish actions, and publishing side effects.
- Inquiries and rental requests, notes, status workflows, search/filter, and customer contact actions.
- Finance/payment ledger, totals/reconciliation, partial/full refund workflow, and idempotency.
- Publishing Outbox event status/filter/retry, deployment diagnostics, and event lifecycle.
- Audit log viewing/filter/detail and append-only integrity.
- API contract validation, error/empty/loading states, authorization, accessibility, responsiveness, safe test data, and cross-module workflows.

### 3.2 Out of scope for this admin UI suite

- Direct testing of unrelated customer-only pages except when a successful admin mutation must be reflected on the customer site.
- Live provider payment collection, real-money refunds, real customer messages, and production database writes.
- Editing deployment secrets, Cloudflare account configuration, DNS, or Supabase project settings through browser automation.
- Treating absent routes such as an admin user-management screen as a feature; no user-management route appears in the inspected `admin/src/App.tsx` route table.
- Destructive production actions. If TestSprite is pointed to a production origin, it must run read-only smoke tests only unless the owner explicitly provides a safe production test plan.

---

## 4. Current Route Inventory

TestSprite must enumerate these routes and confirm the URL resolves to the correct screen after authentication. Any redirect or inaccessible screen must be recorded.

| Route | Screen / capability | Minimum coverage |
|---|---|---|
| `/login` (default unauthenticated screen) | Sign in with email/password; Google sign-in initiation | Valid/invalid credentials, validation, backend unavailable, busy/error UI |
| `/auth/callback` | Supabase OAuth callback | Valid code/session, provider error, missing session, non-admin rejection, clean URL after success |
| `/` | Operations Overview | KPI/source consistency, loading/error/empty behavior, refresh, quick links, activity feed |
| `/bookings` | Booking Operations | Search, status/vehicle filter, details, desk booking creation, status changes, PII unmask, concurrency |
| `/vehicles` | Vehicles & Vehicle Groups | Preset gallery, groups/models, create/edit, image picker/preview, activate/deactivate |
| `/fares/settings` | Fare System Settings | Read, edit, validation, confirmation, persisted values |
| `/fares/rates` | Round-Trip ₹/Km Rates | List, select/edit rate, confirmation, validation, persistence |
| `/fares/extra-charges` | Extra Charges & Policy Notes | Create/edit, category filters, validation, persisted values |
| `/routes` | Intercity Outstation Routes | Search/status filters, CRUD, distance calculation, vehicle pricing matrix, publish/archive |
| `/catalog` | Catalog CMS | Search/status/type filters, CRUD, media, publish/archive/unpublish, manifest republish |
| `/tour-packages` | Tour Packages | CRUD, price/itinerary fields, publish/archive, draft deletion safeguards |
| `/local-transfers` | Local Sightseeing & Transfers | Switch local/transfer tabs; CRUD, publish/archive, search/status filtering |
| `/policies` | Policies & Company Content | Cancellation policies, pet policy, company profile, monuments |
| `/sign-off` | Client Dossier Sign-Off | Checklist record updates, approval count, final sign-off guard |
| `/reviews` | Review Moderation + invitation/QR studio | Link, copy, WhatsApp, QR download, queue filters, approve/reject/publish/unpublish |
| `/publishing` | Publishing Events Outbox | Counters, filters, refresh, failed-event diagnostics, retry and resulting lifecycle |
| `/inquiries` | Inquiries & Leads | Select/view inquiry, status workflow, note persistence, errors |
| `/rental-requests` | Rental Requests | Search, status/vehicle filtering, call link, status advance, note persistence |
| `/finance` | Finance & Refunds | Payments, reconciled totals, booking ledger, eligible refund, partial/full/idempotent refund |
| `/audit` | System Audit Log | Load/filter/inspect events, immutable entries, no edit/delete affordance |

The app has a wildcard route that redirects unknown paths to `/`. TestSprite should verify this behavior and ensure unknown paths never reveal protected data.

---

## 5. Actors, Authentication, and Permissions

### 5.1 Supported user model as represented in source

- **`super_admin`**: Current normal sign-in path; expected to administer protected modules.
- **`finance_operator`**: Present in TypeScript types/permission constants but appears inconsistent with the Supabase extraction and stored-session checks. TestSprite must attempt a valid non-production test identity if provisioned and report whether access is possible. Do not fabricate credentials.
- Any other role must be rejected by the current authentication path unless the implementation is deliberately changed and verified.

### 5.2 Authorization requirements

1. A valid session is required for every route below `/` that renders admin data or permits mutation.
2. A user without a valid session must see sign-in, not protected records, when opening a deep link or refreshing a protected route.
3. A token/session rejected by the backend must be invalidated and the UI must return to a safe unauthenticated state.
4. Backend requests must carry a bearer token when a session exists and a per-request correlation ID (`X-Correlation-Id` and/or `X-Request-Id`) where supported by the current client.
5. UI role checks are a presentation feature only. The backend must independently enforce access to bookings, PII unmasking, refunds, fare/catalog mutations, reviews, sign-off, publishing retry, and audit data.
6. Unauthorized requests must not return sensitive record bodies. Expected responses are 401 for unauthenticated requests and 403 for authenticated but unauthorized requests, unless the documented API contract intentionally uses another consistent status.
7. Finance/refund actions must only be exposed and executable for roles allowed by the current approved policy. The current code and older PRD disagree about whether `finance_operator` is supported; report this as a release-blocking policy mismatch until resolved.
8. Logout must clear the app session and cached sensitive state. Back navigation, direct deep links, reload, and previously opened dialogs must not expose protected data after logout.
9. Google OAuth callback must reject users whose authoritative role metadata is not allowed; failure should sign out/clear state and display a useful error.
10. Local development auth shortcuts must never be available in production builds/origins.

### 5.3 Authentication acceptance criteria

- Empty/invalid email and password inputs produce inline errors and do not submit.
- Valid credentials create an authenticated admin state and render the dashboard.
- Invalid credentials, network failure, rate limit, unauthorized email, OAuth errors, and expired sessions produce safe actionable errors without leaking tokens or stack traces.
- Buttons disable while the authentication request is in flight and are restored after failure.
- Refresh validates the stored session with the backend; invalid sessions are cleared.
- Authentication success does not rely solely on client-side state or a fabricated role value.

---

## 6. Global UI and Data Requirements

Every page and mutation must obey the following shared requirements.

### 6.1 Loading, success, empty, and error states

- Show an explicit loading state while required requests are pending.
- Show a specific empty state when the backend successfully returns no records; do not display fake rows.
- Show a visible error state and retry path for failed required requests.
- If a screen requires several requests, distinguish required data from optional widgets. A non-critical optional activity feed may fail without hiding the whole dashboard, but the failure must not be presented as valid data.
- Disable duplicate submission while a request is in flight.
- Display a success message only after the server confirms the operation. Re-fetch or reconcile from the authoritative API after mutations.
- On API errors, preserve form values where safe so operators do not lose work.

### 6.2 Search, filters, sorting, and pagination

- Filters must affect displayed rows and counts consistently.
- Changing a filter must not accidentally submit or mutate an entity.
- Clearing search restores the unfiltered result set.
- Empty results should distinguish “no records exist” from “no records match your filter.”
- Pagination and limits must not duplicate or omit records. If a backend endpoint is paginated, the UI must not label one page as the entire ledger unless the count is known.

### 6.3 Data contract integrity

- Validate required response fields before mapping API payloads to UI models.
- Do not silently synthesize required data such as pickup date/time, payment amount, ticket ID, status, or identifier when the server omits it.
- Optional fields may be empty only when their contract explicitly permits null/absence.
- Enums must be validated against shared domain values. Unknown statuses must be shown as an explicit unknown state or rejected with a contract error; they must not trigger an unsafe transition.
- Every record mutation must use the expected ID and correct entity type.
- UI optimistic updates must be rolled back or reconciled when the server rejects a write.

### 6.4 Currency and payment units

- UI displays INR in rupees with consistent rounding/formatting.
- Backend/payment provider amounts may use paise/minor units. Conversion occurs exactly once at a clear boundary.
- Null, missing, string-numeric, negative, `NaN`, infinite, or out-of-range amounts must be handled according to the schema, not converted to zero without an explicit rule.
- For payment contract tests, use at least one amount whose rupee representation is not a whole number (e.g. ₹1,234.56) where supported by the API, then verify exact minor-unit preservation end-to-end.
- `amount_paise`/`amountMinor` must be a finite integer greater than zero for a valid positive payment amount. A create-booking/payment-start request with null amount must be rejected before a gateway checkout is launched.

### 6.5 Date/time and timezone

- Store/transfer timestamps in the contract-defined format (prefer ISO 8601 with offset or UTC `Z`); display in `Asia/Kolkata` where that is the product's local operating timezone.
- Booking pickup date and time must reflect the selected booking time through the admin UI, persisted row, booking detail, email/voucher integrations, and customer view; it must never default to 9:00 AM or “now” because a response field is missing.
- Test morning, afternoon, evening, midnight boundary, month-end, daylight/offset parsing, and date-only input separately.
- For one-off events, assert the exact chosen local wall-clock time after save/reload, not just that a timestamp is present.
- Missing or invalid required time data is a contract defect, not a valid default.

### 6.6 Mutation safety and auditability

- Destructive or financial operations must show clear target details and require confirmation where applicable.
- Failed operations must not mutate local rows into a success state.
- Retries must be safe. Refund retries require the same idempotency key for the same logical operation; publication retry must not create conflicting duplicate releases for the same event.
- Audit entries must record who acted, what changed, target entity/ID, timestamp, outcome, and correlation/request ID where supported. PII access and financial/publishing actions are especially sensitive.
- Audit logs must be append-only; there must be no edit/delete controls and unauthorized API mutation attempts must fail.

---

## 7. Functional Requirements by Module

### 7.1 Operations Overview (`/`)

**Purpose:** Surface a trusted summary of current operational activity and provide safe navigation to common tasks.

**Requirements**
- Load admin bookings, payments, inquiries, and audit/activity records from the API.
- Show the implemented KPI cards and charts based on returned data. All totals must reconcile to the corresponding filtered/source records within a defined period.
- Provide a refresh action that re-queries data and displays loading feedback.
- Quick links must navigate to the intended modules without creating records by themselves.
- Activity feed entries must link or identify real actions; missing optional activity data must not be rendered as fabricated events.
- Show recoverable failure state when core dashboard queries fail.

**Acceptance tests**
- Dashboard loads from a valid session and not from a static fixture.
- KPI numbers equal independently calculated seeded backend records.
- Refresh fetches updated values after a test record is changed.
- Empty database produces a meaningful zero/empty state.
- API down/401/403/500 does not show stale “success” data as current.
- Quick links go to the route in the link label and the browser back button behaves normally.

### 7.2 Bookings (`/bookings`)

**Purpose:** Let authorized operators search and inspect bookings, create desk/phone bookings, advance permissible statuses, and reveal customer contact details only when authorized.

**Requirements**
- List and search by supported ticket/customer fields; current screen description specifies ticket ID, phone, and customer name. Exercise other fields only if implemented by the current UI/API contract.
- Filter by status and vehicle. Counts and rows must agree.
- Open a booking detail view with origin/destination, selected service/vehicle, pickup/return date and time, notes, fare breakdown, payment/advance/balance, status, version, and identifying ticket number where available.
- Create a desk/phone booking with validated customer, trip, service/vehicle, pickup date/time, and required fare/booking fields defined by the backend schema.
- Status transitions must follow the explicit UI transition map and backend state machine. The set represented in types includes `draft`, `pending_payment`, `paid_confirmed`, `confirmed`, `driver_assigned`, `in_transit`, `completed`, `cancelled`, and `refunded`; legal edges must be verified against backend service rules rather than guessed from the enum.
- Send `expectedVersion` when the update contract requires optimistic concurrency. A stale update returns a conflict, preserves the server's newest state, and asks the user to refresh.
- Customer phone/email are masked by default. The unmask action must require authorization and create an audit record; revealed data must not remain visible after closing the record, logging out, or expiring the session.
- Unpaid expiry should be displayed only when backend state confirms expiry; the frontend must not independently cancel bookings based solely on browser time.
- Location autocomplete must handle selection, no result, network failure, keyboard navigation, and invalid free-text values according to the contract.

**Acceptance tests**
- Search finds an exact ticket and a partial customer-name match if supported, and clearing restores records.
- Each visible status/vehicle filter returns correct rows/counts.
- Required-field, malformed date/time, invalid passenger count, unsupported vehicle/service, and impossible return-date values are blocked before submission or rejected by the API with inline feedback.
- Create booking -> response returns the canonical booking ID/ticket ID -> the same record appears after reload.
- Selected pickup time remains exactly correct in `Asia/Kolkata` after save/reload and is not replaced by 9:00 AM or current time.
- Legal transition succeeds; illegal transition is rejected and UI remains consistent with server.
- Simulate stale `expectedVersion`; user sees conflict and refreshed current status.
- Unmask works only for an authorized role, records audit evidence, and stays masked for unauthorized roles.
- API `amount_paise: null` or missing required amount does not trigger checkout or show a successful payment.
- 401 expires session; 403 does not expose sensitive details.

### 7.3 Fleet & Vehicles (`/vehicles`)

**Purpose:** Manage vehicle groups and individual models surfaced by customer booking/showroom flows.

**Requirements**
- Load vehicle groups, vehicle models, preset catalog and image options from their authoritative sources.
- Filter the preset gallery by `Missing in Fleet`, `All Catalog`, and `Active`; search by make/model/group/description.
- Onboarding a preset opens the model editor with the mapped group, make, model name, display name, capacities, image, and sort order prefilled.
- Add/edit vehicle model fields must enforce required strings, positive passenger capacity, sensible luggage capacity, valid group, and supported image URL/path.
- Group configuration supports the displayed driver allowance, night charge and halt-charge fields; validate numeric values and persist them to the backend.
- Activate/deactivate must survive refresh and affect customer-facing vehicle availability only according to the intended business rule.
- Image preview must show selected assets or a clear fallback; broken images must not break the modal/table.

**Acceptance tests**
- All three catalog tabs show the correct set and counts.
- Search is case-insensitive where appropriate and can be cleared.
- Preset onboarding auto-fills the intended values exactly.
- Missing required fields/negative capacities are blocked.
- Image library selection updates the form and preview; broken external image produces an explicit fallback.
- Create/edit/toggle persists after reload.
- Duplicate or conflicting model creation is rejected or resolved according to backend uniqueness rules.
- Unauthorized user cannot mutate groups/models by bypassing disabled controls and calling the API directly.

### 7.4 Fare Settings (`/fares/settings`)

**Purpose:** View and update global fare-engine settings in the backend.

**Requirements**
- Load the current set of settings with units and descriptions where returned.
- Editing a setting must be explicit and require the existing confirmation step.
- Values must be numeric, finite, within business-valid bounds, and stored using the backend’s canonical keys/units.
- On success, reload the setting and show the new saved value; on failure, keep the previous server value and show an error.
- Changes affecting active prices should record actor and change details in the audit stream.

**Acceptance tests**
- Settings load and match the API response.
- Valid value edit survives reload.
- Negative, empty, nonnumeric, infinite and out-of-range values fail safely.
- Canceling confirmation leaves backend data unchanged.
- Double-click/repeated submit does not create duplicate changes.
- Backend conflict/validation failure is displayed and doesn't show a false success.

### 7.5 Round-Trip Rates (`/fares/rates`)

**Purpose:** Manage model-associated round-trip rate values.

**Requirements**
- Display vehicle/model and current rate/active status from the API.
- Selecting edit opens the intended record and shows a confirmation step before mutation.
- Rate updates must be valid finite non-negative/positive currency values according to backend schema and persist exactly.
- Prevent a rate update from accidentally affecting a different vehicle, route, or fare-rule row.

**Acceptance tests**
- Correct records are listed and selected.
- Updating one model changes only that rate.
- Invalid amount and request errors are rejected visibly.
- Cancel confirmation makes no mutation; repeated submission is guarded.
- Audit log and any pricing preview/customer API reflect the update as intended.

### 7.6 Extra Charges (`/fares/extra-charges`)

**Purpose:** Manage defined extra charge and policy-note records.

**Requirements**
- List records with category filters and existing values.
- Create and edit forms validate category, description, amount/rule fields and applicable vehicle/route/service references.
- Confirm edits before save where the UI requires confirmation.
- Unsupported category or negative/invalid amount must not be accepted.
- Changes persist and remain bound to the intended target/category.

**Acceptance tests**
- Each filter returns the correct records and counts.
- Create/edit valid record -> visible after refresh.
- Invalid numeric input, missing category, stale/deleted target and API failure are handled correctly.
- No duplicate record from double-click; no silent overwriting of unrelated rows.

### 7.7 Outstation Routes (`/routes`)

**Purpose:** Manage route corridors, distances/durations, vehicle tariffs and publication status.

**Requirements**
- List/search/filter by all/draft/published/archived state.
- Create/edit route origin, destination, code/slug, distance, duration, tags and supported toll/policy data according to the actual form.
- Distance calculation must use selected origin/destination and surface loading/errors; no fabricated distance on failure.
- Route pricing matrix must bind the selected route to its vehicle records. Save must affect the selected route only.
- Publishing requires all required route fields (the screen explicitly notes distance and duration) and should create/trigger the proper publication event.
- Archive is a deliberate state transition; it must not hard-delete the record.
- Slug/code uniqueness checks and fare suggestion endpoints must show server errors distinctly from successful validation.

**Acceptance tests**
- Search and each publication filter work.
- Create draft, edit, save and reload route.
- Missing distance/duration prevents publish.
- Distance calculation response maps to the route form accurately; API failure does not populate a guessed value.
- Vehicle pricing matrix edits persist to the route's correct vehicle records.
- Publish -> outbox event created -> customer site receives the updated route after successful release verification.
- Archive removes route from published customer output but preserves the admin record.
- Duplicate route slug/code returns an actionable error.

### 7.8 Catalog CMS (`/catalog`)

**Purpose:** Manage the shared catalog feeding rides, tours, packages and place/monument content.

**Requirements**
- List and filter by `draft`, `published`, `archived`, category/type and search query.
- Create/edit title, slug, summary, duration, price, status, places/stops, distance, availability, trip type and any other field shown by the actual form.
- Catalog media: support upload path/file selection according to current implementation, alt text, caption, sort order and media status. Apply category-specific media limits from `CATALOG_MEDIA_LIMITS`: place/package/tour may support multiple images (up to 12); ride/route/vehicle use one cover image.
- Validate MIME type, size, image metadata and URL/path; unsafe files must not be accepted.
- Publish, unpublish and archive must call the appropriate API and respect permissions.
- Manifest status and manual republish must show version/updated time/counts returned by backend. A successful click alone is insufficient evidence that the public site has changed.

**Acceptance tests**
- Search/status/type filters compose correctly and survive repeated changes.
- Create draft -> edit -> reload preserves all fields.
- Invalid/duplicate slug and invalid price/media input are rejected.
- Upload accepted media -> metadata persists; invalid type/oversized/malformed image fails safely.
- Category media limit is enforced by UI and API.
- Publish/unpublish/archive actions create correct status and audit/outbox events.
- Republish errors are shown; success must update manifest version and be followed by the release verification step.
- Customer page shows published changes and does not show draft/archived content after deployment finishes.

### 7.9 Tour Packages (`/tour-packages`)

**Purpose:** Manage named tours, itineraries, upgrade/vehicle pricing and publication lifecycle.

**Requirements**
- Search by query and filter by publication status.
- Create/edit package identity, customer-facing description, pricing, itinerary, inclusions/exclusions, vehicle prices/upgrades, image/gallery and status fields that exist in the form/schema.
- Publish and archive using their dedicated API actions.
- Draft deletion must require confirmation and must not delete published or archived package content unless the backend explicitly allows it.
- Code/slug uniqueness check must prevent duplicate customer URLs/IDs.

**Acceptance tests**
- Create/edit package persists all submitted sections.
- Required-field/invalid-price/duplicate-code errors are surfaced.
- Publish moves draft to published and triggers publication event.
- Archive removes the package from public availability while preserving admin history.
- Delete confirmation canceled -> no change; confirmed draft deletion -> removed and cannot be fetched as active content.

### 7.10 Local Sightseeing & Transfers (`/local-transfers`)

**Purpose:** Manage local charter packages and station/airport transfer routes.

**Requirements**
- Separate local-package and transfer-route tabs retain their own filters/forms and data models.
- CRUD, search, status filtering, publish/archive and draft deletion must target the correct entity type.
- Local packages support the duration/distance package values configured by the business; transfer records support origin/destination/transfer code and vehicle pricing where present.
- Publication action must enqueue the correct event/entity type and refresh customer-facing pages after verified deployment.

**Acceptance tests**
- Switching tabs does not submit or cross-contaminate form state.
- CRUD for a local package and a transfer route persists to the correct endpoint/table.
- Invalid duration, distance, route/code or fare values are rejected.
- Publish/archive changes only the chosen entity type and produces correct public-site visibility.
- Duplicate code checks work.

### 7.11 Policies & Company Content (`/policies`)

**Purpose:** Maintain public and operational policy/content records.

**Current sections represented in source**
- Cancellation policy slabs: notice-period text, fee retained percentage, refund percentage, rule text and refund timeline note.
- Pet policy.
- Company profile, including dossier review status/content fields.
- Monuments/place content, with editing of an existing monument.

**Requirements**
- Tabs load independently or display an explicit error if their data request fails.
- Numeric percentages must be bounded between 0 and 100; dependent percentages must follow the declared policy rules.
- Text inputs must enforce reasonable length and safely render user content (no executable HTML/script).
- Save must update the intended record and persist on reload.
- Policy/company changes that affect public pages should trigger required cache/rebuild/publication behavior when specified by the backend.

**Acceptance tests**
- All four tabs render the authoritative values.
- Valid cancellation policy changes persist; invalid percentages and missing required content are blocked.
- Pet/company profile changes persist and don't overwrite unrelated company fields.
- Monument edit persists only to selected monument.
- Script-like input is escaped/sanitized and does not execute.
- API failure preserves unsaved values and clearly indicates the write failed.

### 7.12 Client Dossier Sign-Off (`/sign-off`)

**Purpose:** Track section-by-section approval and only finalize when all required sections are approved.

**Requirements**
- Load dossier sign-off records and company profile.
- Show approved/total count and progress based on actual records. Current UI treats the checklist as 10 sections; empty/unloaded results must not be mistaken for 10 real records.
- Each item can be updated only through allowed statuses; approval metadata must record approver and timestamp.
- Finalize sign-off is available only when every required section is approved and current profile is not already signed off.
- Concurrent changes must not allow premature finalization.

**Acceptance tests**
- Loading state doesn't show false completion.
- Approving/unapproving an item updates counts accurately and persists after reload.
- Attempting finalization with one or more sections incomplete is blocked both by UI and API.
- All required sections approved -> finalize succeeds -> company dossier status becomes `signed_off` and survives refresh.
- Failure to update one section does not incorrectly increment the approved count or finalize the dossier.

### 7.13 Reviews and Invitation/QR Studio (`/reviews`)

**Purpose:** Generate review links and moderate submitted reviews before making them public.

**Requirements**
- Invitation form fields represented in the UI: customer name, booking ticket ID, chauffeur name and tour name.
- Generate official tokenized link via backend; do not fabricate a token locally if the API fails.
- Copy link to clipboard and show confirmed success only when the clipboard operation succeeds.
- WhatsApp share must create a valid link containing the generated review URL and properly encoded message text.
- QR code must render from the generated URL and download a valid PNG with the expected filename convention.
- Queue filters: pending, approved, published, rejected and all, with counts consistent with rows.
- Moderation actions: approve, reject with reason, publish to homepage, unpublish where available. Validate any public-consent and moderation rules at both UI and backend.
- A review must not be published if backend policy prohibits it (for example, lack of public consent). Show the backend decision clearly.
- Ticket-reference validation must follow the current backend requirement; do not add a client-only ticket-existence rule that the backend does not require.
- Moderation/publishing must result in an outbox event where required; successful moderation and successful public release are separate states.

**Acceptance tests**
- Generate link with valid data -> stable token URL returned.
- Missing required name/data fails with inline validation; backend failure creates no fake link.
- Copy link returns visible feedback; clipboard denied/error is handled.
- WhatsApp URL has correct encoded customer name and full review link.
- QR image can be decoded by a QR reader and opens the expected review URL; downloaded file is a PNG.
- Queue tabs/counts map to current status and homepage flags.
- Approve/reject/publish/unpublish succeeds only when permitted and valid.
- Reject reason is persisted and shown; HTML/script is not executed.
- Publishing is blocked when consent/required status fails; the UI must not claim it is live.
- Approve/publish -> outbox event appears -> customer reviews snapshot/site updates after release verification.

### 7.14 Inquiries (`/inquiries`)

**Purpose:** Process contact-form and other customer enquiries.

**Requirements**
- List and inspect inquiry name, phone, email if returned, interest/type, subject/message, current status, notes and created time.
- Status updates must use supported inquiry statuses (`new`, `contacted`, `quoted`, `converted`, `resolved`, `closed`, `spam`) and legal workflow rules.
- Add notes through the backend and preserve existing notes.
- Do not lose selection or unsaved note text on transient errors unless the user explicitly discards it.

**Acceptance tests**
- Load/query/select record, update status, reload and verify persistence.
- Add a note; it appears in record history and remains after refresh.
- Invalid transition, invalid ID and backend failure show errors without optimistic false success.
- Search/filter does not accidentally modify a record.
- PII is not exposed to an unauthorized session.

### 7.15 Rental Requests (`/rental-requests`)

**Purpose:** Manage call-first vehicle rental enquiries.

**Requirements**
- Show request reference, customer contact, vehicle group/model, itinerary, passenger count, pickup/return dates, chauffeur preference, notes and current status when present.
- Current TypeScript statuses include `new`, `contacted`, `quoted`, `done`, `closed`, and `spam`. Do not assume the older doc's `confirmed` status exists unless backend returns and supports it.
- Support status filter, vehicle/car filter and free-text query. Provide a usable call action for a valid phone number.
- Add operator note and advance status only through supported transitions.

**Acceptance tests**
- Search and status/vehicle filters produce correct rows.
- Missing optional vehicle/date fields display gracefully without fabricated values.
- Status and note changes persist after reload.
- `tel:` link contains an appropriately normalized phone number.
- API errors do not advance local state; malformed phone values do not generate broken outbound links.

### 7.16 Finance & Refunds (`/finance`)

**Purpose:** Display payment records and reconciliation figures, and allow tightly controlled refunds.

**Requirements**
- Load payment records, related bookings and summary totals from the backend.
- Payment fields include provider/method, provider payment/order IDs, checkout identifiers where present, reconciliation state, amount, status and capture time.
- Distinguish captured, pending, failed, refunded and needs-review states; don't treat `matched` reconciliation as the same thing as provider capture unless the contract explicitly says so.
- Summary amounts must reconcile with source ledger rows and explicit inclusion rules. Gateway fee estimates must be labeled as estimates, not exact settlements.
- Refund only eligible payments/bookings. Require valid amount no greater than refundable amount, mandatory reason, and a stable idempotency key for each logical refund request.
- Backend is authoritative for booking/payment eligibility and final status. Frontend must handle duplicate key, provider failure, timeout, partial refund and full refund.
- A repeated request using the same idempotency key must not issue a second external refund. After a timeout, query/reconcile state before creating a new logical request.
- Financial operations require explicit authorization at backend and UI levels.

**Acceptance tests**
- Finance page totals reconcile with seeded captured/refunded payments.
- Paise/minor units convert to displayed INR exactly once; decimal amounts do not round incorrectly.
- Null/missing/non-finite amount does not masquerade as a valid ₹0 payment.
- Refund button is shown only for eligible records and permitted users; API denies direct unauthorized attempts.
- Empty/whitespace reason, zero/negative amount, amount greater than refundable amount, nonnumeric value and invalid booking ID are rejected.
- Confirmation identifies the right ticket/payment/amount/provider and cancellation makes no mutation.
- Valid partial refund updates authoritative records correctly; valid full refund updates statuses per the provider/backend contract.
- Re-send same idempotency key after timeout or double click -> one logical refund only.
- Provider/backend error shows failure/reconciliation state and does not claim settlement.
- Audit log contains refund requested/executed events and reason/actor metadata without storing secrets.

### 7.17 Publishing Outbox (`/publishing`)

**Purpose:** Observe the content publication pipeline and safely retry failed/superseded events.

**Requirements**
- Load up to the requested event limit from the publication API and show total, pending/triggered, succeeded and failed counts derived from the fetched set.
- Filter by status. Current screen buttons include all, pending, processing, triggered, succeeded and failed; the event label mapping also includes superseded/coalesced. Verify superseded events are discoverable in an appropriate way and do not disappear without explanation.
- Display entity type, event type, entity ID, attempts, status, processed/created time and error/HTTP status for failed events.
- Retry is available only for eligible failed/superseded events, disabled during an in-flight retry, and should refresh authoritative state afterward.
- Publishing success requires evidence of build completion, activated deployment, and release verification before labeling content live where those stages are part of the deployment contract.
- Preserve event history/identity; a retry should not mutate an unrelated entity or erase original failure diagnostics.

**Acceptance tests**
- Summary counts equal the current returned event set.
- Each filter yields only matching records and `all` restores them.
- Failed record displays error and HTTP status safely, including long error text.
- Retry submits the correct event ID; duplicate clicks do not start duplicate retries.
- Retry failure is shown and original event remains inspectable.
- Retry success refreshes status/attempt count and continues through the expected publication lifecycle.
- Event with successful hook but wrong release ID is not considered fully verified/live.
- 401/403/500/network timeout produces visible recoverable error, never an empty-success state.

### 7.18 Audit Log (`/audit`)

**Purpose:** Provide reviewable evidence of administrative actions and security-sensitive events.

**Requirements**
- Load records with timestamp, actor, actor role, action, resource type/ID, IP and details where available.
- Filter by supported resource/action fields and allow inspecting an individual record.
- Handle UTC timestamps consistently and show timezone/format clearly.
- Audit logs are read-only through the UI; no delete/edit controls.
- Backend/database/API must reject attempts to change or delete audit records, including by `super_admin`.
- Avoid rendering secrets, access tokens, payment secrets or excessive PII inside details.

**Acceptance tests**
- Audit entries for test actions appear after eventual consistency delay if applicable.
- Filters and details show the selected record, not the previous row.
- Refresh surfaces new entries without duplicating old records.
- Mutation buttons are absent; direct mutation requests are forbidden/rejected.
- Sensitive credential/token strings never appear in UI/network responses.

---

## 8. Cross-Module End-to-End Journeys

TestSprite must create dedicated multi-step tests for these journeys; isolated component tests are not enough.

### E2E-01: Desk booking creation and persistence
1. Sign in as an authorized test admin.
2. Open `/bookings` and create a desk/phone booking with a unique test marker, valid customer data, supported trip/vehicle, and an explicit pickup date/time.
3. Capture the returned booking ID/ticket ID and correlation ID.
4. Verify the booking is listed and details match the submitted form after refresh.
5. Verify exact pickup time and timezone through API response and UI.
6. Verify amount/currency fields are valid and no payment checkout starts from null/invalid amount data.

### E2E-02: Booking state transition and audit
1. Select an eligible seeded booking.
2. Perform one legal transition.
3. Reload and verify authoritative state/version.
4. Inspect audit log for corresponding actor/action/resource/timestamp.
5. Attempt a stale version update and verify conflict handling.

### E2E-03: PII unmask security
1. Open a booking whose contact fields are masked by default.
2. Confirm phone/email are masked.
3. Unmask using an authorized identity.
4. Verify the values are revealed only after server authorization and an audit event is created.
5. Close the detail, logout, or expire the session and verify the values are no longer exposed.
6. Attempt the endpoint as an unauthorized role/token and verify denial.

### E2E-04: Catalog-to-customer release
1. Create or select a unique draft catalog item/route/package in staging.
2. Verify draft does not appear in customer public content.
3. Publish the item and inspect the outbox event.
4. Track processing/build/deploy/activation/verification as observable by the system.
5. Verify expected release ID and the content on the customer site.
6. Archive/unpublish the item and verify it is removed from published customer content after the next verified release.

### E2E-05: Review approval-to-homepage
1. Generate a review invitation link using the review studio.
2. Verify copy/WhatsApp/QR utilities use the same generated token URL.
3. Create/seed a pending review with the consent state needed for publication.
4. Approve and then publish it, if the workflow requires separate steps.
5. Verify audit/outbox records and the published review on the customer site only after a verified release.
6. Verify rejection or missing consent prevents public exposure.

### E2E-06: Finance refund idempotency
1. Use a staging/test-mode captured payment and eligible booking; never use a real payment.
2. Open refund form, enter mandatory reason and a valid partial/full amount.
3. Confirm the target and submit once using the generated idempotency key.
4. Simulate retry/timeout or repeat the same request with the same key.
5. Verify only one refund is recorded/provider action is triggered; final payment/booking statuses match backend/provider results.
6. Verify audit record exists and finance summaries reconcile.

### E2E-07: Rental lead handling
1. Seed/create a rental enquiry.
2. Find it through query and vehicle/status filters.
3. Open the phone/call link and verify its target.
4. Add a note and advance through legal statuses.
5. Reload and verify status/note persist without altering another enquiry.

### E2E-08: Dossier sign-off guard
1. Start with at least one unapproved sign-off section.
2. Attempt finalize; it must be disabled or rejected.
3. Approve remaining sections with audit metadata.
4. Finalize only when every required section is approved.
5. Reload and verify all records and company dossier status.

### E2E-09: Authentication expiry and recovery
1. Sign in and navigate to a protected module.
2. Invalidate/expire the test token or configure the test API to return 401.
3. Trigger a request; protected data is cleared and user returns to sign-in.
4. Verify direct deep-link/reload/back navigation doesn't reveal cached content.
5. Re-authenticate and verify the application recovers normally.

### E2E-10: Admin mutation survives API refresh
For one representative entity from vehicles, fares, routes, catalog, packages, policies and sign-off, perform a valid mutation, reload the screen, and compare persisted API state to the UI. This journey is designed to catch optimistic-only updates and response-mapping mismatches.

---

## 9. TestSprite Test Case Inventory

Use the IDs below as stable identifiers in TestSprite. Add deeper cases if the generated implementation reveals additional visible actions. A case passes only when the expected persisted/backend outcome is proven, not when a click merely succeeds.

### Authentication and route protection

| ID | Scenario | Expected result |
|---|---|---|
| ADM-AUTH-01 | Open admin without session | Sign-in screen; no protected record data |
| ADM-AUTH-02 | Submit empty/invalid email | Validation shown; no request submitted |
| ADM-AUTH-03 | Submit short/empty password | Validation shown; no request submitted |
| ADM-AUTH-04 | Valid super-admin sign-in | Dashboard renders and protected API works |
| ADM-AUTH-05 | Invalid credentials | Useful error; no session created |
| ADM-AUTH-06 | Backend unreachable during login | Explicit connectivity error; no false authenticated state |
| ADM-AUTH-07 | Google OAuth starts | Correct callback URL/provider request; busy state shown |
| ADM-AUTH-08 | OAuth callback missing/error/non-admin | Session rejected, cleared, safe error rendered |
| ADM-AUTH-09 | Reload with valid/invalid stored session | Valid session restored; invalid session cleared |
| ADM-AUTH-10 | 401/403 from protected request | Safe logout/denial with no leaked data |
| ADM-AUTH-11 | Logout, then back/deep link/reload | No protected data remains visible |
| ADM-AUTH-12 | Try `?dev_auth=super_admin` on production build | Shortcut is ineffective |
| ADM-AUTH-13 | Try finance_operator identity if provisioned | Current inconsistency verified/reported; no role fabricated |
| ADM-AUTH-14 | Unknown route | Redirect to `/` safely; unauthenticated user remains unauthenticated |

### Dashboard

| ID | Scenario | Expected result |
|---|---|---|
| ADM-DASH-01 | Dashboard with seeded records | KPIs match authoritative records |
| ADM-DASH-02 | Refresh after source mutation | Updated figures appear |
| ADM-DASH-03 | Empty dataset | Legitimate zero/empty state, no fabricated rows |
| ADM-DASH-04 | Required API failure | Visible error/retry; no false-success content |
| ADM-DASH-05 | Quick links | Each link navigates to correct route |

### Booking operations

| ID | Scenario | Expected result |
|---|---|---|
| ADM-BKG-01 | Search by exact ticket ID | Matching booking only/first as designed |
| ADM-BKG-02 | Search by customer name/phone | Correct matching records; clear search restores rows |
| ADM-BKG-03 | Status and vehicle filters | Rows and counts agree with filter criteria |
| ADM-BKG-04 | Open booking details | Values and fare breakdown match backend |
| ADM-BKG-05 | Create valid desk booking | Created record persists and appears after reload |
| ADM-BKG-06 | Create with missing required fields | Validation error; no partial record |
| ADM-BKG-07 | Invalid/ambiguous pickup time | Rejected or explicitly resolved; never replaced by 9 AM/current time |
| ADM-BKG-08 | Legal status transition | Server state/version changes correctly |
| ADM-BKG-09 | Illegal transition | Backend/UI reject; no false optimistic success |
| ADM-BKG-10 | Stale expectedVersion | Conflict shown; current server state retained |
| ADM-BKG-11 | PII is masked by default | Phone/email remain masked until authorized action |
| ADM-BKG-12 | Unmask PII | Authorized request reveals data and creates audit record |
| ADM-BKG-13 | Unauthorized unmask request | 401/403 and no PII response |
| ADM-BKG-14 | Missing/null payment amount | Payment start fails safely before gateway launch |

### Fleet and fares

| ID | Scenario | Expected result |
|---|---|---|
| ADM-FLT-01 | Fleet preset tabs | Correct missing/all/active records and counts |
| ADM-FLT-02 | Fleet search | Correct case-insensitive matches, clear restores results |
| ADM-FLT-03 | Onboard preset | Form receives exact preset values/image/group |
| ADM-FLT-04 | Create/edit vehicle model | Valid record persists after reload |
| ADM-FLT-05 | Invalid capacity/image | Validation/error and no invalid persisted record |
| ADM-FLT-06 | Activate/deactivate model | Correct status persists and public availability follows rule |
| ADM-FAR-01 | Fare settings load | UI matches canonical backend values/units |
| ADM-FAR-02 | Valid fare setting update | Confirmation, successful persistence and audit evidence |
| ADM-FAR-03 | Cancel fare confirmation | No server mutation |
| ADM-FAR-04 | Invalid fare setting values | Rejected with clear validation |
| ADM-FAR-05 | Round-trip rate edit | Only intended model's rate changes |
| ADM-FAR-06 | Extra charge category filters | Correct rows and counts |
| ADM-FAR-07 | Create/edit extra charge | Persisted to correct category/reference |
| ADM-FAR-08 | Duplicate submit/API failure | No duplicate record or false success |

### Routes and content CMS

| ID | Scenario | Expected result |
|---|---|---|
| ADM-ROUTE-01 | Route search/status filter | Correct list for selected state |
| ADM-ROUTE-02 | Create/edit route | Values persist after refresh |
| ADM-ROUTE-03 | Distance calculation | Result maps to selected origin/destination; failure does not invent distance |
| ADM-ROUTE-04 | Publish incomplete route | Blocked until required distance/duration exist |
| ADM-ROUTE-05 | Route pricing matrix | Rates persist against selected route/vehicle |
| ADM-ROUTE-06 | Publish/Archive route | Correct status, outbox event and customer visibility |
| ADM-ROUTE-07 | Duplicate route slug/code | API/UI reject duplicate safely |
| ADM-CAT-01 | Catalog search/status/type filters | Correct intersecting filter behavior |
| ADM-CAT-02 | Create/edit catalog item | All fields persist after reload |
| ADM-CAT-03 | Invalid slug/price/required field | Validation error; no invalid write |
| ADM-CAT-04 | Upload valid media | Media record and metadata persist |
| ADM-CAT-05 | Invalid type/oversized media | Rejected with useful error |
| ADM-CAT-06 | Per-category media limit | UI and API enforce configured limit |
| ADM-CAT-07 | Publish/unpublish/archive item | Correct status and outbox event |
| ADM-CAT-08 | Republish manifest | Version/counts refresh; release verification follows |
| ADM-PKG-01 | Create/edit tour package | Package content persists correctly |
| ADM-PKG-02 | Duplicate package code/invalid amount | Rejected safely |
| ADM-PKG-03 | Publish/archive package | Correct status and public visibility |
| ADM-PKG-04 | Cancel/confirm draft delete | Cancel leaves data; confirmed delete applies only to eligible draft |
| ADM-LOCAL-01 | Switch local/transfer tabs | Forms/state remain separated |
| ADM-LOCAL-02 | Local package CRUD | Correct entity persists |
| ADM-LOCAL-03 | Transfer route CRUD | Correct entity persists |
| ADM-LOCAL-04 | Publish/archive either entity | Correct event/entity type and public visibility |
| ADM-POL-01 | Load all policy tabs | Data and loading/error state are correct |
| ADM-POL-02 | Cancellation values 0/100 boundaries | Valid bounds saved correctly |
| ADM-POL-03 | Invalid policy percentages/text | Rejected; no mutation |
| ADM-POL-04 | Update pet/company profile | Correct fields persist without overwriting unrelated fields |
| ADM-POL-05 | Edit monument | Selected record only changes; content is safely escaped |

### Sign-off, reviews, leads, finance, publishing, audit

| ID | Scenario | Expected result |
|---|---|---|
| ADM-SO-01 | Sign-off load/progress | Counts reflect actual required records, not placeholder totals |
| ADM-SO-02 | Approve/unapprove section | Status, approver and timestamp persist |
| ADM-SO-03 | Finalize incomplete dossier | Blocked at UI and API |
| ADM-SO-04 | Finalize complete dossier | Company status becomes signed off after successful save |
| ADM-REV-01 | Generate invitation link | API-issued token URL displayed |
| ADM-REV-02 | Copy link/share WhatsApp | Correct URL/message and success feedback |
| ADM-REV-03 | QR generation/download | Valid PNG encodes the generated URL |
| ADM-REV-04 | Queue tabs/counts | Counts and review membership match status flags |
| ADM-REV-05 | Approve/reject with reason | Persisted state and rejection reason |
| ADM-REV-06 | Publish/unpublish with consent rules | Backend permission/consent governs public state |
| ADM-REV-07 | Moderation -> outbox -> public site | Only appears after verified release |
| ADM-INQ-01 | Update inquiry status | Correct legal state persisted |
| ADM-INQ-02 | Add inquiry note | Note persists and existing notes remain |
| ADM-INQ-03 | API failure while updating | No false optimistic success or lost note |
| ADM-RENT-01 | Rental request search/filters | Correct records and counts |
| ADM-RENT-02 | Add note/advance status | Correct state persists after reload |
| ADM-RENT-03 | Phone/call action | Valid normalized telephone URI |
| ADM-FIN-01 | Finance totals | Totals reconcile with authoritative payment rows |
| ADM-FIN-02 | Minor-unit-to-INR amount | Exact amount preserved; no double conversion |
| ADM-FIN-03 | Invalid/null amount | Explicit contract error, not a fabricated valid payment |
| ADM-FIN-04 | Refund eligibility/authorization | Only eligible payment and allowed role can open/execute |
| ADM-FIN-05 | Refund invalid amount/reason | Rejected before provider call |
| ADM-FIN-06 | Valid partial refund | Correct partial amount/status and ledger reconciliation |
| ADM-FIN-07 | Valid full refund | Correct final payment/booking state |
| ADM-FIN-08 | Repeat identical idempotency key | Exactly one logical refund; state remains consistent |
| ADM-FIN-09 | Provider/network failure | Failure/unknown state is explicit; no false settled status |
| ADM-PUB-01 | Outbox status counters/filters | Counts and records match current result set |
| ADM-PUB-02 | Failed event diagnostics | Error and HTTP status shown safely |
| ADM-PUB-03 | Retry eligible failed event | Correct event retried once and refreshed |
| ADM-PUB-04 | Retry in-flight/duplicate click | Duplicate retry prevented |
| ADM-PUB-05 | Deploy hook succeeds but release mismatch | Not marked verified/live |
| ADM-AUD-01 | Audit list and filters | Correct audit entries displayed |
| ADM-AUD-02 | Inspect one audit record | Correct selected details shown |
| ADM-AUD-03 | Action creates audit event | Actor/action/resource/time are present |
| ADM-AUD-04 | Attempt audit update/delete via API | Rejected; stored event unchanged |
| ADM-AUD-05 | Sensitive data scan in log UI | No tokens/secrets/excessive payment/PII leakage |

### Responsive, accessibility, and resilience

| ID | Scenario | Expected result |
|---|---|---|
| ADM-NFR-01 | 1280px desktop viewport | No clipped primary controls/tables unexpectedly |
| ADM-NFR-02 | 768px tablet viewport | Sidebar/layout/tables usable and operable |
| ADM-NFR-03 | 375px mobile viewport | Collapsible navigation, usable forms and horizontally scrollable tables where intended |
| ADM-NFR-04 | Keyboard-only navigation | All primary controls reachable with visible focus |
| ADM-NFR-05 | Reduced-motion preference | Core operations remain functional without essential motion |
| ADM-NFR-06 | Slow API/network timeout | Busy state, timeout/error feedback, safe retry |
| ADM-NFR-07 | API returns malformed JSON/schema | Explicit error rather than crash or fake success |
| ADM-NFR-08 | Repeated clicks on mutations | One operation or safe idempotent response, no duplicate writes |
| ADM-NFR-09 | XSS test values in notes/content | Display is escaped/sanitized; script does not execute |
| ADM-NFR-10 | Console/network inspection | No unhandled promise errors, leaked credentials, or secret-bearing frontend requests |

---

## 10. Backend and API Contract Verification

TestSprite should check API behavior using browser-driven actions and, where its setup supports API assertions, direct non-production requests. Never bypass the UI only; many contract defects occur while mapping API responses into UI state.

### 10.1 Core operation endpoints observed in admin client

- `GET /api/v1/ops/admin/bookings`
- `POST /api/v1/ops/admin/bookings/:id/transition`
- `POST /api/v1/ops/admin/bookings/:id/unmask`
- `GET /api/v1/ops/admin/audit-logs`
- `POST /api/v1/ops/admin/refunds`
- `GET/PATCH /api/v1/ops/admin/inquiries` and `/api/v1/ops/admin/inquiries/:id`
- `GET/PATCH /api/v1/ops/admin/rental-enquiries` and `/api/v1/ops/admin/rental-enquiries/:id`
- `GET /api/v1/ops/admin/payments`
- `GET/PUT /api/v1/ops/admin/fare-rules` and related fare-rule activation/version routes
- `GET/POST/PATCH` catalog, media, route, tour-package, local-package, transfer-route, policy, company-profile, monument, promo, and sign-off endpoints under `/api/v1/ops/admin/...`
- Vehicle groups/models, fare settings/rules, extra charges, route-distance calculation, audit and publishing endpoints under `/api/v1/admin/...`
- Review submission/moderation and invitation endpoints under `/api/v1/admin/review-submissions...` and `/api/v1/admin/review-links`

Use `admin/src/lib/api.ts`, `admin/src/services/cleanAdminApi.ts`, and backend route registrations as the definitive endpoint list for the exact test version. Do not infer an endpoint from an older document if it is absent from current source.

### 10.2 Required request/response assertions

- HTTP status is appropriate for success, creation, validation failure, unauthenticated, unauthorized, conflict, and server error.
- Success envelope and resource shape matches the frontend contract. Do not silently accept malformed `data`, `items`, or object structures.
- Created resource ID is non-empty and refers to the expected entity type.
- Request body contains required fields, valid enum strings and the correct units.
- Correlation/request IDs are attached where expected and are traceable in backend logs if available.
- Mutations return canonical persisted values, not values computed only on the frontend.
- Errors do not expose stack traces, SQL, environment variables, raw authorization headers, payment secrets or connection strings.
- `401`/`403` errors clear or deny access consistently; `409`/version conflict preserves current server state; validation failures identify the offending field where safe.

### 10.3 High-priority contract assertions

1. **Booking creation/payment initiation:** amount must be finite and in the canonical unit; null amount must be rejected before a payment checkout is opened.
2. **Booking time:** the selected pickup date/time must remain the same after the create API, read API, UI mapping and any connected communication/voucher flow.
3. **Payment mapping:** confirm whether backend fields are `amountMinor`, `amountPaise`, or `amount_paise` in the deployed contract. Reject null/missing required fields; convert paise to INR once only.
4. **Enum alignment:** UI booking, inquiry, rental, review, publication and payment status enums must match backend-supported values and legal transitions.
5. **Optimistic concurrency:** `expectedVersion` is required and conflict responses are handled wherever the endpoint enforces version locking.
6. **Authorization parity:** all aliases/routes enforce the same security rules for the same action.
7. **Publishing lifecycle:** persist entity type, entity ID, event type, source revision, created/processed timestamp, correlation ID, attempt count, deployment response, build result, activation result and release verification where the system tracks those stages.
8. **Audit integrity:** all successful sensitive mutations create audit entries; rejected operations do not create misleading success events.

---

## 11. Test Environment, Test Data, and Safety

### 11.1 Environment setup

Before running TestSprite, explicitly set:
- Admin base URL for the intended **staging/test** build.
- API base URL for the corresponding staging backend.
- Test credentials using TestSprite’s protected secrets/credential store, not inside this PRD or source code.
- Supabase/auth redirect origins for that staging domain, if OAuth is in the test scope.
- Payment provider test mode and test webhook configuration for refund/payment flows.
- A test database or dedicated test records with permission to create/modify/delete disposable data.
- Customer-site staging base URL for publication verification.

Do not assume an environment variable is correctly set merely because the page opens. Verify requests target the intended API. A non-local build with blank `VITE_API_BASE_URL` can make the admin client fail; report misconfiguration rather than passing on a rendered login page.

### 11.2 Test data conventions

- Prefix created records with `TSADM-<run-id>` or a similarly unique, searchable marker.
- Keep a map of created entity IDs to clean them up safely after the run.
- Use synthetic customer names, phone numbers and email addresses; do not use real customer PII.
- Use seeded staging bookings/payments for refund tests. Never initiate real-money refunds.
- Ensure seeded payment statuses are internally consistent (provider payment/order ID, amount, captured state, booking state and reconciliation status).
- Keep at least one test record per important status, one malformed-response fixture/API fault for contract tests, and one unauthorized token/role test.
- If TestSprite cannot provision a needed state, mark the test `BLOCKED - prerequisite missing`; do not call it passed.

### 11.3 Cleanup rules

- Clean up only records created by that specific TestSprite run and only if the API supports safe deletion for that entity.
- Do not delete audit logs, payment records or publishing event history to make the environment look clean.
- For append-only ledgers, use a dedicated test dataset or mark test records; do not attempt destructive cleanup.
- Never retry a refund using a new idempotency key until the previous key’s result is reconciled.

---

## 12. Non-Functional Requirements

### 12.1 Security

- No backend private secret (`DATABASE_URL`, service-role keys, payment provider secret, webhook secret, email API key) appears in frontend bundles, console output, browser storage, URLs or user-visible errors.
- Access tokens must not be written to logs or exposed to unrelated scripts. Test actual storage policy against the intended threat model; current source uses localStorage and this needs an explicit decision.
- XSS payloads in names, notes, review text, descriptions and policy fields do not execute.
- UI authorization and backend authorization are both enforced.
- Sensitive data (customer contact information, provider IDs, payment details) is disclosed only to authorized staff and only where necessary.
- Rate-limit failures and repeated authentication attempts are handled without revealing whether an email is registered beyond the approved product behavior.
- Audit records are append-only and cannot be modified/deleted by admin users.

### 12.2 Reliability and consistency

- A transient error must not leave an optimistic mutation falsely committed.
- Duplicate clicks/retries do not duplicate bookings, model records, publish operations, notes or refunds unless duplicate creation is the intended behavior and a confirmation exists.
- UI should recover after refresh and network interruption.
- Authoritative reads after mutations match the last confirmed server response.
- Outbox state transitions are observable; failed events retain diagnostic context and support a safe retry.

### 12.3 Accessibility and responsive operation

- Primary buttons/forms work with keyboard and have accessible labels.
- Validation/errors are discoverable to assistive technology and focus moves sensibly after dialog open/close.
- Dialogs trap focus where appropriate and Escape/cancel behavior is predictable.
- Color is not the only signal for statuses.
- Respect reduced-motion settings without disabling functionality.
- Test at 1280px desktop, 768px tablet and 375px mobile. Critical actions must remain visible/reachable; wide tables may scroll horizontally rather than causing whole-page clipping.

### 12.4 Performance

- Each module renders a visible loading indicator for pending requests and becomes interactive when needed data arrives.
- No infinite spinner after a failed request.
- Search/filter interaction is responsive on a realistic staging dataset.
- Images/media failures do not crash the page.
- No repeated polling/refetch loop is triggered by opening a module or changing a local input.

---

## 13. Severity and Release Gates

**P0 — Block production approval:**
- Unauthorized access to admin data, PII, refunds, protected mutations or audit modification.
- Real money action can be triggered in test mode or without intended authorization/confirmation.
- Duplicate refund is possible for the same idempotency key.
- Booking/payment contract allows null or invalid amount through to the payment gateway.
- Booking pickup date/time is silently changed or fabricated (including the recurring 9:00 AM issue).
- Publishing falsely reports a release as live while the expected release is not serving traffic.
- Secret/token leakage or executable XSS.

**P1 — Block acceptance of the affected module:**
- CRUD/publish/moderation/status update doesn't persist or modifies the wrong record.
- Invalid state transitions are accepted or stale-write conflict is ignored.
- Auth/session recovery is broken.
- Critical API schema/enumeration mismatch causes records to be lost or misrepresented.
- Refund/finance totals materially misstate ledger records.

**P2 — Fix before broad rollout:**
- Search/filter/count mismatch on noncritical views.
- Missing clear error/retry state, broken empty state, layout overflow or accessibility issue that impairs normal operation.

**P3 — Low priority:**
- Cosmetic defects without loss of functionality, data integrity, accessibility or security.

### Release acceptance

- All P0 cases pass.
- All P1 cases pass or have formally accepted, explicitly documented blockers with an owner and reproduction steps.
- Every route in Section 4 is covered.
- Every visible mutation has a test proving persisted state.
- TestSprite report includes a summary by feature/priority, traceable failures, screenshots, network/API evidence where available, and the exact app/API build URLs.
- No test report labels blocked or skipped tests as passed.

---

## 14. TestSprite Execution Instructions (Ready to Use)

Use the following as the TestSprite project prompt after setting the staging base URL and protected test credentials.

> **Test the Agra SK Baghel Tour & Travels Admin Operations Desk end-to-end.** Use the current application implementation and this PRD as the coverage contract. First discover every route and visible control; create separate, named, repeatable tests for each requirement and test ID in Section 9. Do not assume features or roles exist just because an older PRD mentions them. In particular, the current role definitions/authentication path may support only `super_admin`; verify the `finance_operator` mismatch instead of inventing a role selector. Use only staging/test data and provider sandbox credentials; never issue real payments or refunds.
>
> Cover sign-in/OAuth/session/logout, all 18 protected admin route areas, every visible CRUD/status/publish/moderation/retry/refund action, empty/loading/error states, responsive UI, and the cross-module journeys in Section 8. For each mutation, verify the authoritative backend response and persisted state after reload. For publishing and reviews, verify the customer-facing staging site only after the system reaches the expected release-verified state. Check network requests, console errors and response schema when available.
>
> Treat missing required contract fields as defects, not acceptable fallback values. Pay special attention to booking pickup date/time (must not be fabricated or defaulted to 9:00 AM/current time), payment amounts and paise-to-rupee conversion (null amount must never launch checkout), booking version/concurrency, authorization at the API boundary, refund reason/amount/idempotency, append-only audit records, and publishing release verification.
>
> Use unique test data prefixed with `TSADM-<run-id>`. Keep a record of created IDs and clean up only safe disposable test entities. Do not delete audit/payment/event histories. If a prerequisite, test credential or provider sandbox is unavailable, mark that test blocked with the exact prerequisite; do not invent data or report a false pass. Capture screenshots, relevant request/response details, correlation/request IDs, console errors and reproducible steps for every failure.
>
> Report: tests generated, tests run/passed/failed/blocked, coverage by route/module, P0/P1/P2/P3 issues, discrepancy between the old documented role model and current source, backend contract mismatches, UI usability/accessibility defects, evidence for every failure, and a prioritized fix list. Do not modify code, production configuration, production data, DNS or payment settings as part of this test run.

---

## 15. Source Files to Use When Resolving Ambiguity

The current source should be consulted if this PRD and implementation disagree.

- App route table and auth shell: `admin/src/App.tsx`
- Current role/types/permission constants: `admin/src/lib/types.ts`
- Authentication/session/OAuth: `admin/src/lib/auth.ts`, `admin/src/components/login/LoginPage.tsx`, `admin/src/pages/AuthCallbackPage.tsx`
- Shared API client and current response mappings: `admin/src/lib/api.ts`
- Fleet/fare/routes/publishing client: `admin/src/services/cleanAdminApi.ts`
- Navigation inventory: `admin/src/components/admin/Sidebar.tsx`
- Page components: `admin/src/pages/*.tsx`
- Core ops REST registration: `backend/src/modules/admin/admin.routes.ts`
- Ops validation/schema/controller/service: `backend/src/modules/admin/admin.schema.ts`, `admin.controller.ts`, `admin.service.ts`
- Fare/content/publishing routes: `backend/src/modules/admin/fare-admin.routes.ts`
- Old/possibly stale written specification: `docs/admin/ADMIN_PRD.md` — compare it, but do not treat it as stronger evidence than code and runtime behavior.

---

## 16. Final Principle

Test the admin as a connected operational system, not as a collection of buttons. A module passes only when the action is authorized, the request/response contract is valid, the correct record is persisted, the UI accurately reflects backend state, audit evidence exists where required, and downstream effects (payment, customer data, publication) are verified to the level appropriate for that workflow.
