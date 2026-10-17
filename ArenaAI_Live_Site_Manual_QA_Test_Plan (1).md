# ArenaAI — Live Customer Site & Admin Panel Manual QA Test Plan

**Purpose:** Execute real user-facing tests against the deployed customer website, admin panel, and their connected backend. This is a manual, end-to-end test plan; automated unit tests and successful builds do not replace these checks.

**Basis:** The reported fixes D-01 through D-11 and verification summary in the supplied report, plus the ArenaAI booking/catalog/admin functionality discussed for this project. Some cases are conditional on the corresponding feature being enabled in the currently deployed UI.

## 1. Before testing

Fill these in before starting:

- Customer site URL: `________________________________`
- Admin site URL: `________________________________`
- Backend/API base URL (if known): `________________________________`
- Git commit/deployment version: `________________________________`
- Date/time and tester: `________________________________`
- Browser/device: `________________________________`
- Admin test account/role: `________________________________`
- Test booking/customer details: use a dedicated test identity and email/phone where possible.

### Safety rules for live testing

1. Do not use a real customer's personal information. Use clearly identified test details.
2. Do not create a real payment, refund, cancellation, or customer notification in production unless it has been explicitly approved. Use the payment gateway's test mode or an approved low-risk test procedure.
3. Do not delete or overwrite real packages, routes, fare rules, reviews, images, users, bookings, or settings. Use a test record, capture current values first, and restore any temporary changes.
4. For admin write tests, record the record ID and before/after values so changes can be reversed.
5. Open browser DevTools → **Console** and **Network** while testing. Record failed requests, status codes, response bodies with secrets/PII redacted, and screenshots. Never capture access tokens, passwords, API keys, or full payment details.

### How to record each test

For every case, mark **PASS**, **FAIL**, **BLOCKED**, or **N/A**. On FAIL, record: actual result, expected result, URL, exact steps, timestamp, screenshot/video, relevant request URL + status, and console error. A page merely loading is not a pass if its controls or data do not work.

**Priority:** P0 = release blocker; P1 = high priority; P2 = important but lower-risk. “Expected result” is the acceptance criteria.

---

# 2. Customer website — manual test cases

## A. Site availability, navigation, and rendering

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-001 | P0 | Open the production customer URL in a fresh private/incognito window. | HTTPS page loads without certificate warnings, blank screen, redirect loop, or fatal error. | |
| CUS-002 | P0 | Reload the homepage several times; then open it in a second supported browser. | Site consistently renders and requests succeed; no uncaught JavaScript error prevents use. | |
| CUS-003 | P1 | Click every primary header/navigation link once. | Each link opens the correct page and active navigation state is sensible. | |
| CUS-004 | P1 | Test logo/home link, footer links, contact links, terms/privacy links if present. | Links lead to the intended destination; no placeholder `#`, dead links, or accidental admin-only destination. | |
| CUS-005 | P1 | Directly paste a known canonical route URL into a new tab. | Correct page loads without needing to visit the homepage first. | |
| CUS-006 | P1 | Refresh a deep route such as a package, monument, or booking page. | The route survives refresh; no server 404 or blank SPA fallback. | |
| CUS-007 | P1 | Use browser Back and Forward across homepage → package/monument → booking. | Navigation history works and form state is not unexpectedly corrupted. | |
| CUS-008 | P1 | Open a deliberately invalid/non-existent route. | A useful not-found page or intentional redirect appears; no crash or misleading unrelated page. | |
| CUS-009 | P1 | Open a public route with query parameters, then refresh and use Back. | Query parameters are preserved or normalized intentionally; no stale or duplicated values. | |
| CUS-010 | P1 | Inspect the Console and Network panel on home and one deep page. | No unexplained failed first-party API requests, runtime exceptions, hydration errors, or mixed-content requests. Third-party blocked analytics may be separately classified if nonessential. | |

## B. Homepage and booking-widget layout

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-011 | P0 | Check the primary booking widget and its One Way, Round Trip, and Local Tour options. | All displayed options are selectable, clearly labelled, and lead to the correct form state. | |
| CUS-012 | P0 | Select each trip type slowly and quickly several times. | Widget remains stable: no sudden resize, overlap, lost controls, flicker, or layout jump that makes it unusable. | |
| CUS-013 | P1 | Select Local Tour, then switch to One Way and Round Trip, then back to Local Tour. | Fields and labels match the current trip type; stale fields from the prior type do not affect the quote. | |
| CUS-014 | P1 | Change trip type after entering pickup, drop, date, time, or package data. | Only intentionally compatible values persist; irrelevant stale values are cleared or safely ignored. | |
| CUS-015 | P1 | Select a date in the date picker. | Selected date remains visibly inside the correct input/control; it does not render outside or become clipped. | |
| CUS-016 | P1 | Resize browser width while the booking widget is open. | Inputs, date picker, trip-type controls, dropdowns, and submit button remain visible and usable. | |
| CUS-017 | P1 | Try keyboard navigation through widget controls using Tab, Shift+Tab, Enter, Space, and arrow keys where appropriate. | Focus order is logical, focus is visible, and controls are keyboard operable. | |
| CUS-018 | P1 | Check homepage CTA buttons, including booking, call, and WhatsApp actions if displayed. | Each CTA performs its advertised action and carries the correct business contact/booking destination. | |
| CUS-019 | P1 | Click the main Book Now/booking CTA without entering any details. | User reaches the intended booking flow or receives clear validation; no dead button. | |
| CUS-020 | P1 | Test the widget at desktop, tablet, and narrow mobile widths (at least 320–375 px wide). | No horizontal overflow, clipped labels, overlapping inputs, hidden submit control, or unusable dropdowns. | |

## C. One-way booking flow

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-021 | P0 | Select One Way and enter valid pickup, drop, future date, time, and other required fields; continue. | Form accepts valid data and proceeds to the correct quote/vehicle-selection stage. | |
| CUS-022 | P0 | Leave each required field empty one at a time and submit. | A clear validation message identifies the missing field; no silent failure or uncaught exception. | |
| CUS-023 | P1 | Enter identical pickup and drop addresses. | System either blocks the invalid route with clear guidance or handles it according to documented business rules; no nonsensical quote. | |
| CUS-024 | P1 | Enter a past pickup date. | Past date is rejected or prevented by the date picker; no booking/quote is created. | |
| CUS-025 | P1 | Enter the current date with a pickup time already in the past. | Invalid time/date combination is rejected or corrected with clear guidance. | |
| CUS-026 | P1 | Enter valid addresses using autocomplete suggestions rather than only typed text. | Selected locations are retained and used consistently in quote/checkout. | |
| CUS-027 | P1 | Enter a very long address, punctuation, apartment number, and common Indian address formats. | Input is handled safely, remains readable, and does not break the form or API payload. | |
| CUS-028 | P1 | Submit once, then double-click or rapidly click the continue/quote button. | Only one active quote/booking action is generated; the button shows a loading/disabled state as appropriate. | |
| CUS-029 | P1 | Use browser Back from vehicle selection to the form. | Previously entered valid values are preserved appropriately and can be edited. | |
| CUS-030 | P1 | Change pickup or drop after a quote is displayed. | The previous quote is invalidated/recalculated; old pricing is not silently reused. | |

## D. Round-trip booking flow

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-031 | P0 | Select Round Trip and complete all required outbound and return journey fields. | Return-specific fields are available and a valid quote can be requested. | |
| CUS-032 | P0 | Set return date before outbound date. | UI/API blocks the invalid sequence with a clear validation message. | |
| CUS-033 | P1 | Set outbound and return dates equal, if same-day round trips are allowed. | System follows the defined business rule and calculates the quote correctly; otherwise it clearly rejects the combination. | |
| CUS-034 | P1 | Select a return date several days after outbound date. | Both dates are retained; quote reflects the complete round trip and relevant day/distance rules. | |
| CUS-035 | P1 | Change a round trip to One Way after filling return details. | Return details no longer influence the quote or submitted payload. | |
| CUS-036 | P1 | Submit a round trip with one required return field missing. | Clear field-level validation appears and no incomplete quote/booking is accepted. | |
| CUS-037 | P1 | Navigate backward and forward between round-trip form, vehicle selection, and checkout. | Outbound and return details remain consistent without swapping or losing dates/locations. | |
| CUS-038 | P1 | Refresh the round-trip page after completing the form, including any URL prefill parameters used by the site. | The form restores only intended, validated data; no duplicate or contradictory fields. | |

## E. Local tour and package booking flow

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-039 | P0 | Select Local Tour and choose a listed package/duration/route, where offered. | Relevant local-tour options load and the user can proceed to vehicle/quote selection. | |
| CUS-040 | P0 | Open a package page and click its Book/Book Now CTA. | Booking form is prefilled with the correct selected package and expected trip type/route details. | |
| CUS-041 | P1 | Compare the selected package title on the package page, booking form, quote, and checkout. | The same package is carried end to end; no different package is silently selected. | |
| CUS-042 | P1 | Change the vehicle after choosing a package. | Package remains selected while the fare updates for the selected vehicle, where vehicle-specific pricing exists. | |
| CUS-043 | P1 | Remove/change the package or change to another trip type. | No stale package ID or old package price remains in the booking request. | |
| CUS-044 | P1 | Open each published local package from the listing and directly from its canonical URL. | Each package loads with correct title, content, images, availability, and working booking CTA. | |
| CUS-045 | P1 | Test a package whose starting price is missing, null, zero, or otherwise unpriced, if such a record exists. | UI does not advertise a false ₹0 fare; it displays an appropriate “contact/request quote” state or other defined unpriced state. | |
| CUS-046 | P1 | Open the booking flow from a monument page, including the monument-specific booking CTA. | Correct corresponding local sightseeing package or supported package match is selected. | |

## F. Outstation and route-specific quotes

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-047 | P0 | Open several published route pages, then start a booking from each route CTA. | Each CTA passes the correct origin/destination and route identity into the booking form. | |
| CUS-048 | P0 | Request a quote for a common outstation route with available vehicles. | Quote returns valid vehicle options and the correct route-specific price/rules. | |
| CUS-049 | P1 | Test route pairs in both directions, e.g. A→B then B→A. | Pricing and route identity follow configured rules; the reverse direction is not accidentally treated as the same route unless specified. | |
| CUS-050 | P1 | Test routes near the configured short/long-distance threshold (including just below, at, and above 300 km if this threshold is used). | Distance bands and applicable rules are applied consistently; boundary values do not result in missing or duplicate charges. | |
| CUS-051 | P1 | Test a route that has a specific fare override and compare with a route that uses global fleet pricing. | Specific route fare takes precedence where configured; global rules are used only when appropriate. | |
| CUS-052 | P1 | Test a valid route with no configured route-specific fare rule. | System uses the documented fallback/global rule or returns a clear unavailability state; never invents a ₹0 quote. | |
| CUS-053 | P1 | Test routes with toll, driver allowance, night charge, and other configured package/outstation charges. | Each applicable charge is included exactly according to the configured rule; no duplicate or missing charge. | |
| CUS-054 | P1 | Compare the fare shown on route/package listing, vehicle card, quote breakdown, and checkout. | Amounts and inclusions agree throughout the flow or differences are clearly explained. | |
| CUS-055 | P1 | Select an unpriced vehicle tier, if one is deliberately configured. | Vehicle is not presented as a confirmed ₹0 booking; the flow follows the intended request-a-quote/unavailable behavior. | |
| CUS-056 | P1 | Simulate or wait for a quote API error/timeout using a safe test environment or browser Network throttling. | User sees a readable retry/error state; no stale fare is shown as current and no uncaught crash occurs. | |

## G. Vehicle selection and fare rendering

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-057 | P0 | Load the vehicle selection step for an ordinary valid quote. | Correct available vehicle models appear with correct names, capacities, images, and pricing where configured. | |
| CUS-058 | P1 | Select each available vehicle model in turn. | Selection state is clear and the quote/continue action uses the chosen model ID and price. | |
| CUS-059 | P1 | Inspect the displayed capacity, luggage, description, and image fields for vehicles with incomplete optional metadata. | Missing optional values do not break layout or cause a contract/runtime error; absent details are handled gracefully. | |
| CUS-060 | P0 | Exercise a normal booking where backend returns a valid UUID vehicle/model identifier. | Vehicle selection and quote succeed without identifier-related errors. | |
| CUS-061 | P1 | Exercise a safe test response with a malformed/non-UUID vehicle/model identifier, if test tooling permits. | Invalid identifier fails safely with a useful in-page message; no alert loop, crash, or malformed checkout request. | |
| CUS-062 | P1 | Compare an unpriced/null/zero-price tier with a genuinely priced tier. | Null and non-positive values are not converted into a falsely bookable ₹0 price. | |
| CUS-063 | P1 | Refresh vehicle selection or use Back/Forward after a quote exists. | Selected vehicle and quote state remain valid or are refetched; outdated quote data is not silently accepted. | |

## H. Location autocomplete

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-064 | P0 | Type a known pickup location slowly in the pickup field. | Suggestions appear after a short debounce, are relevant, and can be selected. | |
| CUS-065 | P0 | Repeat for the drop location. | Drop suggestions appear in the correct field and do not overwrite pickup. | |
| CUS-066 | P1 | Type quickly, pause, then keep typing before suggestions return. | Latest query wins; stale suggestions do not replace newer results. | |
| CUS-067 | P1 | Select a suggestion and then edit the text manually. | The app does not silently treat old selected coordinates/IDs as valid for changed text. | |
| CUS-068 | P1 | Search for a location with no results or an intentionally misspelled name. | Clear empty/no-results feedback appears and user can try again. | |
| CUS-069 | P1 | Test with network offline or the autocomplete API unavailable in a safe way. | UI remains usable, reports the issue gracefully, and does not hang or crash. | |
| CUS-070 | P1 | Inspect the Network request used for autocomplete. | Request goes through the intended backend proxy endpoint (reported as `/api/v1/locations/autocomplete`), succeeds with expected status, and does not expose the provider secret in the browser. | |
| CUS-071 | P1 | Test keyboard selection of suggestions and dismissal with Escape/outside click. | Accessible, predictable selection behavior; dropdown does not trap focus or cover the submit button irrecoverably. | |

## I. Monument and content catalogue

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-072 | P0 | Open each published monument page from its listing and by direct URL. | Correct page content renders; no blank page, crash, or wrong monument details. | |
| CUS-073 | P0 | On every monument page, click its main booking CTA. | CTA opens a valid booking path with the intended monument/package selection. | |
| CUS-074 | P1 | Test secondary/fleet-tier booking CTAs on monument pages, if shown. | Each CTA carries the correct package/vehicle choice and does not drop the monument context. | |
| CUS-075 | P1 | Verify the five reported Agra sightseeing package connections by opening each relevant monument CTA. | Each expected monument maps to a valid published/bookable local package; no dead or mismatched package IDs. | |
| CUS-076 | P1 | Use monument listing/search/filter controls, if present. | Filters return relevant records, counts match results, and empty state is understandable. | |
| CUS-077 | P1 | Inspect monument images, alt text, title, description, and related links. | Images load correctly, content matches the monument, and related links lead to valid pages. | |
| CUS-078 | P1 | Open package/monument pages at mobile width. | Gallery, content, booking CTA, and navigation fit the screen and remain operable. | |

## J. Checkout, submission, and recovery

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-079 | P0 | Complete a valid test booking through the last step before any irreversible payment/confirmation. | All entered data is displayed accurately and the user can review it before final submission. | |
| CUS-080 | P0 | Submit checkout with missing required customer/contact fields. | Field-level validation appears; no incomplete booking is persisted. | |
| CUS-081 | P1 | Enter invalid email, invalid phone, leading/trailing spaces, and boundary-length values. | Inputs are validated/normalized according to rules with actionable error messages. | |
| CUS-082 | P1 | Enter text containing apostrophes, hyphens, Unicode, and other ordinary characters in names/address fields. | Valid characters are handled safely; values are neither corrupted nor rendered as executable content. | |
| CUS-083 | P0 | Submit the same booking action twice rapidly. | Duplicate bookings/payments are prevented or safely idempotent; loading state communicates progress. | |
| CUS-084 | P1 | Reload the page during a pending quote/checkout, or navigate away and return. | App recovers clearly; no phantom success, accidental duplicate, or misleading status. | |
| CUS-085 | P1 | Cause a quote/checkout API request to fail in a safe test setup. | User gets a clear retry path; failed request is not displayed as a confirmed booking. | |
| CUS-086 | P1 | Inspect the final booking request in DevTools (redact PII). | Submitted trip type, dates, route/package ID, vehicle ID, and price context match the UI selection. | |
| CUS-087 | P0 | If payment is enabled, run a payment success case only with an approved test-mode/safe transaction. | Payment and booking statuses reconcile correctly; success screen matches backend/admin record. | |
| CUS-088 | P0 | If payment is enabled, test a declined/cancelled/failed test payment. | Failure/cancel state is explicit; booking is not falsely marked paid and retry does not duplicate charges. | |
| CUS-089 | P1 | If online payment is enabled, return from the payment provider using Back, refresh, or a delayed callback in test mode. | Status is checked server-side and reconciled; frontend does not trust only the redirect/query string. | |
| CUS-090 | P1 | After a successful approved test booking, locate it in admin and compare all details. | Booking ID, customer, trip, vehicle, amount, and status agree across customer confirmation, API, and admin. | |

## K. SEO, accessibility, responsiveness, and performance

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| CUS-091 | P1 | View source or inspect document head on homepage, route, package, and monument pages. | Each indexable page has a unique relevant title/description and the correct canonical URL. | |
| CUS-092 | P1 | Inspect page links and canonical redirects for trailing slash, casing, and known aliases. | Duplicate variants resolve to the intended canonical URL; no redirect loop or chain that breaks navigation. | |
| CUS-093 | P1 | Open `/sitemap.xml` and `robots.txt` on the live customer domain. | Files load and reference the deployed canonical domain; sitemap contains intended published URLs and not stale dev URLs. | |
| CUS-094 | P1 | Check several generated route/package/monument pages by direct request with JavaScript disabled or before hydration completes. | Useful page content and metadata are present in rendered HTML wherever server/static rendering is intended. | |
| CUS-095 | P1 | Check images on home, package, monument, and vehicle pages. | No broken images; responsive image sizing is sensible and key images are not needlessly huge. | |
| CUS-096 | P1 | Use keyboard-only navigation through header, form, dropdowns, modal/dialog, and footer. | Focus is visible and logical; no keyboard trap. | |
| CUS-097 | P1 | Check readable labels, contrast, form error association, image alternative text, and heading hierarchy. | Controls can be understood without relying solely on color or placeholder text. | |
| CUS-098 | P1 | Run a live performance audit on representative home, route, package, and monument pages using the agreed tool/device/network. | Record actual metrics and compare to the team's release budget; pages are not blocked by avoidable errors or excessive asset payload. | |
| CUS-099 | P1 | Test slow network and mobile emulation on booking pages. | Loading feedback is visible, controls do not freeze indefinitely, and recoverable errors can be retried. | |
| CUS-100 | P2 | Test browser zoom at 200% and 320 CSS-pixel width. | Core booking, navigation, and checkout tasks remain possible without content overlap. | |

---

# 3. Admin panel — manual test cases

## A. Access, login, and permissions

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| ADM-001 | P0 | Open the production admin URL in a private window without an existing session. | Login/authentication screen appears; protected dashboard data is not exposed before authentication. | |
| ADM-002 | P0 | Log in with an approved valid admin account. | User reaches the authorized dashboard and identity/role is correct. | |
| ADM-003 | P0 | Attempt login with an incorrect password. | Access is denied with a generic safe error; no sensitive account details are disclosed. | |
| ADM-004 | P1 | Submit the login form with required fields empty. | Required-field validation appears and no request is accepted as successful. | |
| ADM-005 | P0 | Log out and then use browser Back or reload a protected admin URL. | Protected content is not accessible without a valid session; user is redirected to sign-in or receives an authorization response. | |
| ADM-006 | P1 | Open admin in two tabs, log out in one, then interact with the other. | Expired/revoked session is handled safely; privileged operations do not silently continue. | |
| ADM-007 | P0 | While logged out, directly request an admin API endpoint through the browser/network tooling. | Backend enforces authentication; hidden UI alone is not the security boundary. | |
| ADM-008 | P0 | If multiple roles exist, log in with a restricted role and inspect navigation and direct route access. | Only authorized functions are accessible; APIs independently enforce the same permissions. | |
| ADM-009 | P1 | Open admin at desktop, tablet, and mobile widths. | Login, sidebar, tables, forms, modals, and action menus remain usable. | |
| ADM-010 | P1 | Inspect Console and Network during login and page navigation. | No leaking tokens/secrets in URLs/logs, unexplained API failures, or uncaught rendering errors. | |

## B. Dashboard and operational visibility

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| ADM-011 | P0 | Open the dashboard after login. | Dashboard loads without a fatal error and displays the appropriate summary data or clear empty states. | |
| ADM-012 | P1 | Compare displayed bookings, payments, and inquiries to the underlying list views for the same time/filter scope. | Counts and statuses are consistent, allowing for explicitly documented filters or refresh timing. | |
| ADM-013 | P1 | Use dashboard cards/links to navigate to each underlying admin module. | Links open the correct module and do not route to a missing page. | |
| ADM-014 | P1 | Simulate or use an account without audit-log permission, if applicable. | Dashboard remains useful if audit-log retrieval fails; non-audit data is not hidden by that failure. | |
| ADM-015 | P1 | Test empty data, slow API response, and an API error using a safe test environment. | Clear loading, empty, and error states appear; dashboard does not display false zero/success states for a failed request. | |
| ADM-016 | P1 | Refresh dashboard after creating or changing a test record. | Data updates according to refresh/cache behavior and does not remain indefinitely stale. | |

## C. Tour packages and media management

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| ADM-017 | P0 | Open the tour-package management page. | Published and draft records load; table controls and create/edit actions work. | |
| ADM-018 | P0 | Create a clearly named test package with valid required fields and an approved test image. | Package saves once with a stable ID and correct values; no duplicate record appears. | |
| ADM-019 | P0 | Open the package on the customer site after publishing. | Published package appears with the same title, description, price/status, and media as admin. | |
| ADM-020 | P1 | Edit a test package title, description, and price; save and reopen it. | Updates persist and are visible correctly in admin and customer views after expected cache/revalidation time. | |
| ADM-021 | P1 | Attempt to save a package missing required fields or containing invalid price data. | Validation blocks invalid data with clear messages; backend does not accept invalid values merely because UI validation is bypassed. | |
| ADM-022 | P1 | Upload an allowed image format and reasonable file size. | Upload succeeds; image preview works and uploaded media URL resolves on the customer site. | |
| ADM-023 | P1 | Upload a disallowed format, oversized file, empty file, or corrupted image in a safe test record. | Upload is rejected gracefully; no broken record or server crash. | |
| ADM-024 | P1 | Test image upload when remote media storage is unavailable only in staging or another approved safe setup. | Reported in-memory/media fallback behaves as intended; user gets clear feedback and image resolution remains consistent for the supported fallback's lifetime. | |
| ADM-025 | P1 | Add multiple images to a package; reorder/remove one if the UI supports it. | Gallery order and membership persist and match the customer page. | |
| ADM-026 | P1 | Save a package with no optional image or optional metadata. | Admin and customer UI display a safe fallback; no broken image icon or runtime failure. | |
| ADM-027 | P1 | Unpublish/archive a test package, then open its public URL and listing. | Package is removed from public listings or handled according to its intended visibility policy; no invalid booking CTA remains. | |
| ADM-028 | P1 | Delete only a disposable test package, if delete is a supported action and deletion is approved. | Deletion is confirmed and handled consistently; related public listing does not keep a stale bookable record. | |
| ADM-029 | P1 | Inspect media URL resolution for an `/assets/` and `/images/` path from admin. | URL resolves against the configured customer site origin, not an incorrect admin origin; asset returns success. | |
| ADM-030 | P1 | Try a package title/description containing markup-like text in a test record. | Content is safely escaped/sanitized and cannot execute script in admin or customer pages. | |

## D. Fleet, route, fare rules, and catalog administration

*Run this section for each corresponding management screen present in the deployed admin panel. If fare rules are not editable in admin, mark the admin-specific test N/A and execute the associated customer quote cases instead.*

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| ADM-031 | P0 | Open fleet/vehicle management or the relevant fare catalogue screen. | Current vehicle types and pricing configuration load without missing/duplicate entries. | |
| ADM-032 | P1 | Inspect available vehicle details: name/model, capacity, luggage, image, description, status, and pricing. | Optional nullable metadata is handled; missing values do not break forms or catalog views. | |
| ADM-033 | P1 | Edit a test vehicle's non-critical descriptive field and save. | Update persists and is reflected in customer vehicle selection after expected cache refresh. | |
| ADM-034 | P0 | Inspect route-specific fare rules for a test route with a known override. | The intended route rule is identifiable and its values are displayed accurately. | |
| ADM-035 | P0 | Compare a route with a specific fare rule to one using global fleet pricing. | Effective pricing follows the precedence rule: route-specific rule overrides global default when configured. | |
| ADM-036 | P1 | Test create/edit validation for fare amount, distance, kilometre rate, fixed charge, night charge, driver allowance, toll, and other fields actually present. | Invalid/negative/missing values are rejected or explicitly supported; valid values persist accurately. | |
| ADM-037 | P1 | Set or inspect a tier that is intentionally unpriced (null/unconfigured). | Admin preserves the unpriced state and public APIs/frontend do not convert it to a false zero-price fare. | |
| ADM-038 | P1 | If a price is set to zero, confirm the business rule for zero versus “not priced.” | UI/backend handle zero according to documented policy and do not confuse null/unpriced with free service. | |
| ADM-039 | P1 | Inspect local-tour/package pricing and any included toll/driver/night/extra-day charges. | Components are clear and align with the quote calculation; charges are not silently omitted or double counted. | |
| ADM-040 | P1 | Save a change to a test fare rule and request the affected customer quote again. | New rule becomes effective according to cache/publishing behavior; unrelated routes remain unchanged. | |
| ADM-041 | P1 | Enter a value near an important threshold, including the configured 300 km boundary if used. | Admin accepts the intended boundary values and customer quote applies the corresponding band correctly. | |
| ADM-042 | P1 | Attempt to disable/unpublish a route or vehicle used by a disposable test case. | It is no longer offered for new bookings as intended; existing records are not silently corrupted. | |
| ADM-043 | P1 | Review catalogue entries and published flags for the five reported Agra local sightseeing packages. | All expected records are present, have valid IDs and route/package mappings, and are actually published in the deployed data source. | |
| ADM-044 | P1 | Change one safe test catalogue entry, then reload the customer page and API-backed selector. | Customer UI and API show the same authoritative value rather than inconsistent hard-coded fallback data. | |

## E. Bookings, rental requests, inquiries, and payment visibility

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| ADM-045 | P0 | Open booking management/list view. | Booking records load with useful status, ID, date, customer-safe fields, and filters where implemented. | |
| ADM-046 | P0 | Find the approved test booking created from the customer site. | Exactly one matching record exists and its route, dates, vehicle, quote, and status match the customer journey. | |
| ADM-047 | P1 | Open a booking detail view. | Detail fields are complete and consistent; status and amount are clearly displayed. | |
| ADM-048 | P1 | Use booking search/filter/sort/pagination, if present. | Results match the selected criteria; moving pages does not duplicate or lose records. | |
| ADM-049 | P1 | Change a permitted status on a disposable test booking. | Change is authorized, persists, and is reflected in the detail/list/customer status where appropriate. | |
| ADM-050 | P0 | Open rental requests from the sidebar and directly by its route. | `/rental-requests` route and navigation both work; page displays requests or a clear empty state. | |
| ADM-051 | P1 | Submit a permitted test rental request from the customer-facing rental flow, if present. | New request reaches the expected admin rental-request view with correct details and status. | |
| ADM-052 | P1 | Open inquiries/contact submissions. | List/details load and a test customer inquiry is associated with the correct timestamp and submitted data. | |
| ADM-053 | P1 | Submit the public contact/inquiry form with valid test details. | Request is received once, feedback is shown to customer, and it appears in admin/backend as expected. | |
| ADM-054 | P1 | Submit contact/rental form with missing or malformed fields. | Customer-side and server-side validation prevent invalid submissions and do not create partial phantom records. | |
| ADM-055 | P0 | Open payments view, if available, and compare it with the approved test payment/booking. | Amount, provider reference, payment status, and linked booking reconcile correctly. | |
| ADM-056 | P0 | Verify a failed/cancelled test payment. | It is not shown as paid; failed attempts and booking statuses are unambiguous and non-duplicated. | |
| ADM-057 | P1 | Cause a dashboard audit-log request failure using an authorized safe test setup. | Bookings, payments, and inquiries remain usable; audit-log failure is isolated and gracefully handled. | |

## F. Reviews, review invitations, WhatsApp, and QR Studio

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| ADM-058 | P0 | Open the Reviews page. | Reviews list loads or shows a clear empty state; no runtime error. | |
| ADM-059 | P1 | Test review list search/filter/pagination and opening a review detail, if present. | Relevant reviews appear and values are not mixed between records. | |
| ADM-060 | P1 | Add/edit a review using a disposable test record if review CRUD is available. | Valid change persists and public review presentation follows publish/moderation rules. | |
| ADM-061 | P1 | Open Review Invitation / WhatsApp QR Studio. | Studio is visible and all expected fields—Customer Name, Ticket ID, Chauffeur Name, Tour Description—are usable. | |
| ADM-062 | P0 | Enter valid test data into every invitation field. | A live invitation link is generated with the correct intended ticket/customer context. | |
| ADM-063 | P1 | Change each field after generating a link. | Preview/link updates without requiring a page reload and does not retain stale values. | |
| ADM-064 | P1 | Test empty fields, punctuation, spaces, Unicode, ampersands, and long-but-reasonable values. | Link encoding is correct; output remains valid and safe; required fields are validated as intended. | |
| ADM-065 | P0 | Use “Share via WhatsApp.” | WhatsApp opens with the correctly encoded message/link, with no broken URL or missing required context. | |
| ADM-066 | P0 | Generate and scan the displayed QR code using a phone camera. | QR resolves to the same valid invitation URL shown in the Studio. | |
| ADM-067 | P0 | Download the QR Code PNG and open it. | Download completes; PNG is not blank/corrupt and remains scannable at normal print/display sizes. | |
| ADM-068 | P1 | Change invitation data and download a second QR. | Download reflects the latest data and not a stale earlier QR. | |
| ADM-069 | P1 | Test invitation URL on a mobile browser and a browser where the recipient is not logged into admin. | Intended public-facing review page opens without requiring admin authentication and provides a clear next action. | |
| ADM-070 | P1 | Open the generated invitation URL with expired/invalid ticket data, if supported. | It fails safely with a clear message; it does not reveal other customers' records. | |

## G. Security, auditability, and resilience

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| ADM-071 | P0 | Attempt to access a record/action outside the test account's permissions through direct URL or API request, where safe. | Backend denies unauthorized access; UI restrictions are backed by server authorization. | |
| ADM-072 | P0 | Enter script-like text into test package/review/inquiry fields and view it in admin/customer pages. | Text is escaped/sanitized and cannot execute script or alter page structure. | |
| ADM-073 | P1 | Check that passwords, access tokens, payment secrets, and provider API keys do not appear in browser responses, query strings, console logs, or visible admin pages. | Sensitive values remain server-side or masked; public API returns only necessary fields. | |
| ADM-074 | P1 | Test browser refresh/back on admin pages with unsaved form changes. | User is warned or unsaved state is handled intentionally; no silent partial save. | |
| ADM-075 | P1 | Trigger API timeout or server error while viewing a list or saving a test record, in staging/safe conditions. | User receives a clear error; partial writes are not misrepresented as success; retry is safe. | |
| ADM-076 | P1 | Open audit logs, if authorized, and perform one approved test mutation. | The expected actor/action/time/record is recorded, without exposing secrets or excessive customer data. | |
| ADM-077 | P1 | Verify the audit log is not required for the dashboard to render its other core data. | A denied/unavailable audit-log call does not take down unrelated dashboard functionality. | |
| ADM-078 | P1 | Test all forms against double-submit, browser retry, and refresh after save. | No duplicate package/review/inquiry/booking is created from one intended action. | |

---

# 4. Cross-site end-to-end journeys

Run these after individual customer and admin checks. Use approved test records only.

| ID | Priority | Steps | Expected result | Result / evidence |
|---|---|---|---|---|
| E2E-001 | P0 | Customer opens a route page → clicks Book → confirms pickup/drop → selects vehicle → gets quote. | Route, locations, vehicle, and fare remain consistent through every step. | |
| E2E-002 | P0 | Customer opens a local package → clicks Book → completes the flow to the pre-payment/review step. | Correct package is prefilled and no unrelated package or stale trip type is carried over. | |
| E2E-003 | P0 | Customer opens a monument page → clicks main booking CTA. | The correct canonical monument/package mapping leads to a valid booking flow. | |
| E2E-004 | P0 | Customer requests a valid one-way outstation quote and selects each relevant priced vehicle tier. | Each tier's quote is correct and unpriced tiers are not rendered as ₹0. | |
| E2E-005 | P0 | Customer completes a valid round-trip quote with outbound and return dates. | Return details and resulting price are consistent in the UI and submitted payload. | |
| E2E-006 | P0 | Customer completes a valid local tour selection. | Local-tour layout remains stable and pricing matches the selected package/vehicle. | |
| E2E-007 | P1 | Customer selects a pickup/drop autocomplete suggestion, then changes it and requotes. | Latest selected location is the one used by the quote; old coordinates are not reused. | |
| E2E-008 | P0 | Create one approved test booking and find it in admin. | The same booking exists exactly once; customer/route/date/vehicle/price/status match. | |
| E2E-009 | P1 | Admin changes a test package's published description/image/price and customer reloads its page. | Published customer page reflects the approved change after the expected cache/revalidation interval. | |
| E2E-010 | P1 | Admin updates a test fare rule and a customer requests the matching quote. | New effective price follows rule precedence and is consistent in the quote breakdown. | |
| E2E-011 | P1 | Admin creates a review invitation and a tester opens the link on a mobile device. | Link works without admin login and points to the intended review workflow. | |
| E2E-012 | P1 | Admin generates a QR PNG and a tester scans the downloaded PNG. | Scanned URL is identical to the Studio's invite URL and leads to the expected page. | |
| E2E-013 | P1 | Submit a test rental/contact inquiry from customer site and inspect admin. | The request reaches the correct admin queue with accurate values and no duplicate record. | |
| E2E-014 | P0 | In the approved payment test flow, compare provider outcome, customer confirmation, admin payment status, and booking status. | All systems agree on success/failure; no false paid status or duplicate charge/booking. | |
| E2E-015 | P0 | Walk through all core journeys while monitoring Console and Network. | No unexplained first-party API failures or runtime errors; every failed request has an understood, acceptable reason. | |

---

# 5. Regression checklist mapped to report defects D-01 through D-11

| Report defect | Manual live verification | Must pass before sign-off? |
|---|---|---|
| D-01 — checkout/quote invalid model UUID | CUS-057–063; test normal UUID success and safe invalid-ID failure behavior where test tooling permits. | Yes |
| D-02 — nullable/optional fare contract fields | CUS-059, CUS-062; ADM-032, ADM-037–038. | Yes |
| D-03 / D-09 — unpriced tiers and hydration/price parity | CUS-045, CUS-055, CUS-062; ADM-037–038, ADM-044. Confirm no false ₹0 and no console hydration mismatch. | Yes |
| D-04 — monument booking integration | CUS-072–075; E2E-003. | Yes |
| D-05 — location autocomplete | CUS-064–071; E2E-007. | Yes |
| D-06 — catalog route hygiene, manifests, canonical pages | CUS-005–009, CUS-091–095. Validate deployed routes and live sitemap, not just source files. | Yes |
| D-07 — media fallback and admin asset resolution | ADM-022–029; E2E-009. | Yes |
| D-08 — rental requests in admin sidebar | ADM-050–051; E2E-013. | Yes |
| D-10 — dashboard audit-log fallback | ADM-014–016, ADM-057, ADM-077. | Yes |
| D-11 — review invitation / WhatsApp QR Studio | ADM-061–070; E2E-011–012. | Yes |

---

# 6. Final release sign-off

## P0 release blockers

Do not sign off while any of these fail:

- [ ] Customer site opens, primary navigation works, and no fatal runtime error blocks bookings.
- [ ] One Way, Round Trip, and Local Tour all complete a valid quote flow.
- [ ] Invalid dates and missing required fields are rejected safely.
- [ ] Vehicle IDs and unpriced tiers are handled safely; no incorrect ₹0 fare is shown.
- [ ] Route-specific/global fare precedence and quote-to-checkout price consistency are correct.
- [ ] Monument and local-package booking CTAs point to the correct bookable packages.
- [ ] Pickup and drop autocomplete work without exposing provider secrets.
- [ ] Admin authentication and server-side access control protect private data.
- [ ] Package/media changes persist and are reflected on the customer site.
- [ ] Rental requests and review invitation/QR functionality work if enabled in the deployment.
- [ ] Approved test booking/payment statuses reconcile between customer site and admin.
- [ ] No duplicate bookings/payments are produced by double-clicks/retries.

## Execution summary

- Total executable test cases: **193** (100 customer-site, 78 admin-panel, and 15 cross-site end-to-end cases). The defect regression table maps back to these cases and is not counted as additional cases.
- Passed: `_____`  Failed: `_____`  Blocked: `_____`  N/A: `_____`
- P0 failures outstanding: `_____`
- Deployment/commit tested: `________________________________`
- Tester and date: `________________________________`
- Release decision: `GO / NO-GO`
- Open defects and evidence links: `________________________________`

**Important:** A test marked “PASS” means the tester performed the described actions on the deployed site and observed the expected result. Do not mark a case passed merely because a test suite or production build succeeded.
