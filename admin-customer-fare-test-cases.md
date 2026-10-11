# Admin + Customer Test Cases — Fare System Adoption

Target: the rebuilt fare system (spec `fare-system-final-spec.md` + Requirement A archived pages + Requirement B `max_round_trip_days = 5`).
Scope: **frontends only** (`react/` customer, `admin/` operations desk). The backend already has 171 passing tests; these cases prove the two frontends actually use the new contract and never do their own money math.

**Finding from main (commit 8931562, 10 Oct 2026):** the rebuild is NOT on `main`. There is no `backend/src/modules/fare-engine/`, no migrations `0038/0039`, no `contracts/fare-system.ts`, and no `/book` page. Admin still has the old `FaresPage.tsx`, `RoutesPage.tsx`, `LocalTransfersPage.tsx`, `TourPackagesPage.tsx`; customer still has `react/src/fares.ts` (client-side fare maths with `outstationRules`). Push the agent's branch, then run section 0 first. Several section 0 tests are expected to FAIL on today's main — that is the proof they work.

**Tooling:** neither `react/` nor `admin/` has a UI test runner today. Use **Vitest + React Testing Library** (component/contract) and **Playwright** (E2E, mobile 390px + desktop 1440px). Backend stubbed with MSW for component tests; real staging backend + disposable DB for E2E. Razorpay test mode.

**Fixture** (from spec 12): cars DZ, HC, ER, IC, FO, CA, VE, T12, T17, UR · routes DEL 230.0, MAT 58.0, JAI 240.0, GWA 119.5, LKO 335.0, ODD 410.3 · fixed products L-8H, L-FD, T-CANTT, T-AIRPORT, T-IGI, P-SUNRISE, P-GOLDEN, P-MATHURA · advance 28%, min km/day 300, max round-trip days **5**, allowance 500 (sedan/SUV/luxury) / 700 (tempo traveller), night window 20:00–06:00 pickup IST.

Severity: P0 money/security · P1 major · P2 moderate.

---

## 0. Adoption gate (static checks, run in CI, no browser)

| ID | Check | Expected | Sev |
|---|---|---|---|
| AD-G01 | `contracts/fare-system.ts` byte-identical to `backend/src/contracts/`, `admin/src/contracts/`, `react/src/contracts/` | diff empty | P0 |
| AD-G02 | `grep -rn "outstationRules\|roundTripKm\|nightCharge\|driverAllowance\|0\.28\|advancePercent *=" react/src` | no fare maths in customer; only values read from API responses | P0 |
| AD-G03 | `react/src/fares.ts` | deleted, or contains only formatting (`formatINR`) and `localTomorrow`; no rate tables | P0 |
| AD-G04 | Customer imports of `QuoteResponse`, `OptionsResponse`, `BookingEntryParams` from `@/contracts/fare-system` | present in `/book` page and product pages | P1 |
| AD-G05 | Admin imports `FareSettingPatch`, `FareRuleCreate`, `RouteVehiclesPut`, `RouteCalculateRequest/Response` | present, no local duplicate types | P1 |
| AD-G06 | `grep -rn "locationiq" react/src admin/src` | no LocationIQ key or direct call in either frontend (admin calls `POST /admin/routes/calculate-distance`) | P0 |
| AD-G07 | Old admin pages for legacy fare tables removed or rewired; no calls to dropped endpoints | no 404 on any admin page load | P1 |
| AD-G08 | `npm run customer:typecheck && admin:typecheck` | pass with zero `any` casts on fare payloads | P1 |
| AD-G09 | Bundle scan of `react/dist` | no `LOCATIONIQ`, `RAZORPAY_KEY_SECRET`, service-role key | P0 |
| AD-G10 | Hard-coded numbers in UI: grep for `28`, `300`, `500`, `700`, `20:00` in booking UI code | none used as logic; only displayed from API | P0 |

---

## 1. Customer — booking entry link (`/book`)

Contract: `BookingEntryParams` carries inputs only, never prices. Example: `/book?category=outstation&product=agra-to-delhi&trip=one_way&date=2026-10-13&time=10:00&pax=2&src=seo_route_page`.

| ID | Steps | Expected | Sev |
|---|---|---|---|
| CU-01 | Open the example URL | Trip summary bar shows Agra → Delhi, one way, 13 Oct, 10:00, 2 pax; grouped car selector loads from `POST /quotes/options` | P0 |
| CU-02 | Same URL with `&price=1` / `&total=999` / `&advance=1` appended | Params ignored; no price shown from URL; request body to `/quotes` has no price field | P0 |
| CU-03 | `category=garbage` | Friendly "choose a trip" state, no crash, no API 500 | P1 |
| CU-04 | `product=unknown-slug` | Not-found state with link back to routes list | P1 |
| CU-05 | Missing `date` / `time` | Form asks for them; no options request until valid | P1 |
| CU-06 | `trip=round_trip` without return date | Return date field shown required; no quote until filled | P1 |
| CU-07 | Past date | Validation message; no quote | P1 |
| CU-08 | `pax=0`, `pax=-1`, `pax=abc`, `pax=99` | Validation or clamped message; vehicles over capacity never shown | P1 |
| CU-09 | Click "Book" on a route page, a local package page, a transfer page and a tour page | Each lands on `/book` with correct `category`, `product`, `src`; fields prefilled | P0 |
| CU-10 | Reload `/book` mid-flow | State restored from URL; no stale quote reused | P2 |

## 2. Customer — grouped fleet selector

| ID | Steps | Expected | Sev |
|---|---|---|---|
| CU-20 | Outstation DEL one way, pax 2 | Group tabs shown (only groups with at least one priced car); empty groups hidden | P0 |
| CU-21 | Switch tabs | Cars listed per group; price per car comes from options response | P0 |
| CU-22 | Car with no price for that route (admin removed it) | Car not displayed anywhere, no "₹0", no "on request" fallback to group price | P0 |
| CU-23 | pax 7 | Cars with seats < 7 hidden | P0 |
| CU-24 | Tempo traveller on one-way route | Priced with admin's fixed one-way amount (not forced round trip) | P0 |
| CU-25 | Car with `round_trip_enabled = false` and trip round trip | Car hidden for round trip, still shown for one way | P0 |
| CU-26 | Round trip option card | Shows separate round-trip include/exclude list from one-way list | P1 |
| CU-27 | One way vs round trip toggle | Same grouped selector layout; prices refetch, not recomputed locally | P0 |
| CU-28 | Select a car, change date | New options request; previous selection kept only if still available, else cleared with message | P1 |
| CU-29 | Local package / transfer / tour | Same selector; price is the fixed per-car price; no km/day/allowance wording | P0 |
| CU-30 | Group with zero priced cars after admin change | Tab disappears; selection falls back to first available tab | P1 |
| CU-31 | Mobile 390px | Tabs scroll horizontally, cards stack, no horizontal page scroll | P2 |

## 3. Customer — included / not included panel

| ID | Steps | Expected | Sev |
|---|---|---|---|
| CU-40 | Open "What's included" on a one-way car | Lists the route's one-way inclusions/exclusions from admin terms | P0 |
| CU-41 | Same car, round trip | Shows round-trip lists (allowance, halt, km policy) not one-way lists | P0 |
| CU-42 | Extra charges with amount null (message only) | Shown as text ("pay as per actual"), no price | P1 |
| CU-43 | Extra charges with amount | Shown with ₹ amount from API | P1 |
| CU-44 | Parking/toll wording | Shown in not-included when admin lists them; not invented by UI | P1 |
| CU-45 | Extra km beyond limit | Displayed as "paid to driver" per admin text; not added into total | P0 |
| CU-46 | Fixed products (local, transfer, tour) | Show their own include/exclude lists | P1 |

## 4. Customer — fare summary and advance

All amounts must equal the API response exactly.

| ID | Steps | Expected | Sev |
|---|---|---|---|
| CU-50 | One-way DEL, DZ, pickup 10:00 | Total = fixed amount; no night line; advance = round_half_up(total×28%); balance = total − advance | P0 |
| CU-51 | One-way pickup 20:00 | Night charge line appears (value from API; ₹0 until admin sets it → line hidden when 0) | P0 |
| CU-52 | One-way pickup 05:59 / 06:00 | 05:59 shows night line (if admin set), 06:00 does not | P0 |
| CU-53 | Round trip 1 day, DEL | Billable km row ≥ 300 per day; allowance ₹500 (sedan), ₹700 (tempo traveller); no night line | P0 |
| CU-54 | Round trip 3 days | Allowance × 3, halt × 2 nights (if admin set), billable km = max(2×route, 300×3) | P0 |
| CU-55 | Round trip crossing midnight, e.g. 23:00 to 01:00 next day | 2 IST calendar days used, as returned by API | P0 |
| CU-56 | Round trip 5 days | Quote accepted | P0 |
| CU-57 | Round trip 6 days | `TRIP_TOO_LONG` shown as message "up to 5 days online; call us", booking disabled | P0 |
| CU-58 | Admin changes `max_round_trip_days` to 3, reload | 4 days now blocked with no code change | P0 |
| CU-59 | Total line, advance line, balance line | Advance label shows percent from API (28%), not typed in UI | P0 |
| CU-60 | Total ≤ small amount where advance rounds | `advance ≤ total`, balance ≥ 0, integers only | P1 |
| CU-61 | Tamper in DevTools: edit DOM total | Booking request still carries only quote inputs; server total wins | P0 |
| CU-62 | Currency format | ₹ with Indian grouping (e.g. ₹1,23,456), no decimals | P2 |

## 5. Customer — booking, payment, PRICE_CHANGED

| ID | Steps | Expected | Sev |
|---|---|---|---|
| CU-70 | Fill passenger details, submit | `POST /bookings` payload contains inputs + quoted total for comparison, no computed breakdown trusted | P0 |
| CU-71 | Admin raises price between quote and submit | 409 `PRICE_CHANGED` → modal "Price updated: was ₹X now ₹Y", shows new summary, requires explicit "Confirm new price"; no payment opened automatically | P0 |
| CU-72 | Confirm new price | New booking created at new price; advance recalculated | P0 |
| CU-73 | Decline new price | Returns to selector; no booking row | P1 |
| CU-74 | Proceed to payment | Razorpay amount = advance (paise = advance×100), shown in checkout | P0 |
| CU-75 | Double-click Pay | One order only (idempotent); one Razorpay window | P0 |
| CU-76 | Close Razorpay window | Booking stays "awaiting payment"; resume link works via `PaymentResumePage` | P1 |
| CU-77 | Payment success callback before webhook | UI shows "confirming payment…" until backend marks confirmed; does not claim confirmed from browser callback | P0 |
| CU-78 | Payment failure | Clear retry option; no duplicate booking | P1 |
| CU-79 | Network drop on submit | Error toast; retry does not double-create | P1 |
| CU-80 | Optional social accounts field (Instagram/Facebook/etc.) | Saved with booking if filled, optional, URL/handle sanitised | P2 |
| CU-81 | My Bookings page | Shows total, advance paid, balance due matching DB | P1 |

## 6. Customer — product pages, archived pages, SEO (Requirement A)

| ID | Steps | Expected | Sev |
|---|---|---|---|
| CU-90 | Route/package page "from ₹X" | X = minimum priced car from catalog API for that product; no client minimum calculation | P0 |
| CU-91 | Product with no priced cars | No "from" label; Book button disabled or "call us" | P1 |
| CU-92 | Archive a route in admin, publish pipeline completes, open URL | Page still loads (200), banner "Currently Unavailable", Book button disabled, related-service links shown | P0 |
| CU-93 | Archived page canonical and robots | Same canonical URL, indexable (no `noindex`) | P0 |
| CU-94 | Archived page in `sitemap.xml` | Present | P0 |
| CU-95 | Draft page | 404, not in sitemap | P0 |
| CU-96 | Archived page discoverable in ≤3 clicks from home | Reachable via routes list or related links | P1 |
| CU-97 | Restore archived to published | Banner gone, Book enabled after pipeline success | P1 |
| CU-98 | Page templates `/taxi/<code>`, `/local-sightseeing/<code>`, `/transfers/<code>`, `/tours/<code>` | Render with title, H1, meta description, JSON-LD, correct canonical, bilingual hreflang | P1 |
| CU-99 | `npm run customer:seo` | passes with 0 draft URLs in sitemap | P1 |

## 7. Customer — reviews

| ID | Steps | Expected | Sev |
|---|---|---|---|
| CU-100 | Open `/review/:token` from QR | Form loads; route/tour name dropdown, rating, text, name, optional social handle, up to 5 photos, consent checkbox | P1 |
| CU-101 | Expired QR token (>30 days) | Friendly "link expired" | P1 |
| CU-102 | Booking-link token submitted twice | Second attempt rejected as already used | P0 |
| CU-103 | Submit without consent | Blocked | P1 |
| CU-104 | 6 photos / 9 MB photo / non-image | Rejected client-side and server-side with message | P1 |
| CU-105 | `<script>` in text | Rendered inert on admin and public views | P0 |
| CU-106 | Review pending | Not visible on homepage/About until approved | P0 |
| CU-107 | Approved review | Appears in homepage animation and About gallery, preserving design locks LOCK-N06/N08 | P2 |
| CU-108 | Email link from Resend contains booking ID and works once | Opens form prefilled with booking | P1 |

---

## 8. Admin — access and roles

| ID | Steps | Expected | Sev |
|---|---|---|---|
| AM-01 | Log in as each role: super_admin, content_editor, review_moderator, dispatcher, finance_operator | Sidebar shows only permitted screens | P0 |
| AM-02 | Non-super-admin opens fare settings / rates / extra charges by URL | Forbidden state; API returns 403; no data shown | P0 |
| AM-03 | content_editor edits product content | Allowed; cannot edit prices | P0 |
| AM-04 | review_moderator | Only reviews moderation | P1 |
| AM-05 | dispatcher | Bookings view/assign; no price edits | P1 |
| AM-06 | finance_operator | Bookings ledger, payments; no rate edits | P1 |
| AM-07 | Expired session during edit | Redirect to login without losing form silently (warning) | P2 |

## 9. Admin — Fare Settings

| ID | Steps | Expected | Sev |
|---|---|---|---|
| AM-10 | Open Fare Settings | Shows advance_percent 28, min_km_per_day 300, max_round_trip_days 5, night start 20, night end 6 from DB | P0 |
| AM-11 | Change advance to 30, save | Audit row written; customer `/book` shows 30% on next quote | P0 |
| AM-12 | advance 0, 101, -1, 12.5, "abc" | Validation errors; nothing saved | P0 |
| AM-13 | `max_round_trip_days` 0, 1, 31, decimal | Rejected per contract limits | P0 |
| AM-14 | Set `max_round_trip_days` 3 | Customer 4-day quote returns `TRIP_TOO_LONG` | P0 |
| AM-15 | Night start/end set to 22/5 | One-way quote at 21:00 has no night line; 22:00 has | P0 |
| AM-16 | Save fails (500) | Error shown, form not marked saved | P1 |
| AM-17 | Two admins edit simultaneously | Last write wins with no corruption; both audited | P2 |

## 10. Admin — Vehicles & Groups

| ID | Steps | Expected | Sev |
|---|---|---|---|
| AM-20 | Groups list | Shows allowance per day and halt per night per group; tempo traveller shows 700, others 500 | P0 |
| AM-21 | Change tempo traveller allowance to 800 | Customer round-trip quote for T12 rises by 800×days | P0 |
| AM-22 | Set halt per night 300 | Round-trip 3 days adds ₹600 for halt | P0 |
| AM-23 | Set one-way night charge | Applies to pickups in the night window | P0 |
| AM-24 | Add vehicle model with seats and group | Appears in route car grid; no price until set | P1 |
| AM-25 | Seats 0 / negative | Rejected | P1 |
| AM-26 | Deactivate a model | Disappears from customer selector after publish/refresh | P0 |

## 11. Admin — Round-Trip Rates grid

| ID | Steps | Expected | Sev |
|---|---|---|---|
| AM-30 | Open grid | One ₹/km rate per car, whole-website scope | P0 |
| AM-31 | Change DZ rate, save | Applied automatically to every route round trip (no per-route edit) | P0 |
| AM-32 | Rate empty | Car hidden on round trip, not zero-priced | P0 |
| AM-33 | Rate negative or text | Rejected | P0 |
| AM-34 | Audit | Exactly one audit row per save with before/after | P1 |

## 12. Admin — Routes and Route Cars

| ID | Steps | Expected | Sev |
|---|---|---|---|
| AM-40 | Create route, press **Calculate distance** | Distance (1 decimal km) and duration (whole minutes) filled by backend; no LocationIQ call from browser | P0 |
| AM-41 | Calculate with bad place names | Error message; nothing persisted | P1 |
| AM-42 | Calculate then leave without saving | Nothing stored | P1 |
| AM-43 | Save route | Row created; audit logged | P0 |
| AM-44 | Route Cars grid | Per car: one-way fixed amount, round-trip enabled toggle, separate one-way and round-trip include/exclude lists | P0 |
| AM-45 | Leave a car's one-way amount empty | Car hidden for one way on customer | P0 |
| AM-46 | Toggle round trip off for T12 | Round trip hides T12 | P0 |
| AM-47 | Edit one-way include list only | Round-trip list unchanged | P1 |
| AM-48 | Amount `-1`, `abc`, `0` | Rejected (0 rejected unless contract allows) | P0 |
| AM-49 | Override: change route distance later | Round-trip quote uses new km; one-way fixed price unchanged | P1 |
| AM-50 | Archive route | Customer page gets banner (CU-92), Book disabled | P0 |
| AM-51 | Slug edit | Redirect created in `url_redirects`; old URL redirects | P1 |

## 13. Admin — product content (local packages, transfers, tour packages)

| ID | Steps | Expected | Sev |
|---|---|---|---|
| AM-60 | Price-per-car grid for each category | One fixed price per car; blanks hide the car | P0 |
| AM-61 | Edit include/exclude lists | Shown on customer panel after publish | P0 |
| AM-62 | No day/hour/km inputs on tour packages | Tours are package-based only | P1 |
| AM-63 | Draft → publish | Publishing monitor shows pending → running → succeeded; page live | P0 |
| AM-64 | Publish twice quickly | Pending events collapsed into one | P1 |
| AM-65 | SEO fields (title, description, slug) | Validated lengths; used by template | P2 |

## 14. Admin — Extra Charges

| ID | Steps | Expected | Sev |
|---|---|---|---|
| AM-70 | Add charge with amount on category outstation | Added to totals for matching quotes only | P0 |
| AM-71 | Add message-only charge (no amount) | Shown as text, not added to total | P0 |
| AM-72 | Scope to route / group / category | Resolves deterministically; narrower scope wins as per spec | P1 |
| AM-73 | Disable charge | Removed from quotes | P1 |
| AM-74 | Negative amount | Rejected | P0 |
| AM-75 | Parkometer, toll, extra km, extra hour entries | Can be created as message-only text with admin wording | P1 |

## 15. Admin — Bookings ledger and payments

| ID | Steps | Expected | Sev |
|---|---|---|---|
| AM-80 | Booking row | Shows total, advance, balance, status; amounts match customer view | P0 |
| AM-81 | Booking after price change | Stores price at time of booking; later rate edits do not alter it | P0 |
| AM-82 | Payment captured | Status confirmed; one captured payment per booking | P0 |
| AM-83 | Webhook amount mismatch | Booking shown as needs_review with reason | P0 |
| AM-84 | Duplicate webhook | No duplicate payment/status change | P0 |
| AM-85 | Filter by date, status, category | Correct rows | P2 |

## 16. Admin — Reviews moderation

| ID | Steps | Expected | Sev |
|---|---|---|---|
| AM-90 | Pending queue | Shows text, photos, social handle, route/tour name, source (QR or booking link) | P1 |
| AM-91 | Approve / reject | Visible/hidden on site; audit row | P0 |
| AM-92 | Admin adds a review manually | Marked as admin-created; shown after approval | P1 |
| AM-93 | Edit review text | Audited | P2 |
| AM-94 | Generate QR / booking review link | Link works; tokens never stored in plain text (hash only) | P1 |
| AM-95 | Resend email | Sent once per booking (idempotency); error shown if Resend fails | P1 |

## 17. Admin — Publishing monitor and Audit Log

| ID | Steps | Expected | Sev |
|---|---|---|---|
| AM-100 | Publish content | Event appears with states pending → running → succeeded | P0 |
| AM-101 | Cloudflare hook fails | Event shows failed with retry; retry works | P1 |
| AM-102 | Verify-live failure | Event shows failed verify, not succeeded | P1 |
| AM-103 | Audit viewer | Lists every admin write above with actor, time, before/after; filter by actor/table | P0 |
| AM-104 | Audit pagination/limit | Respects page size (known gap in old audit) | P2 |
| AM-105 | Audit rows immutable from UI | No edit/delete controls | P1 |

---

## 18. End-to-end consistency (admin edit → customer sees it)

| ID | Flow | Expected | Sev |
|---|---|---|---|
| E2E-01 | Admin changes DEL one-way price for DZ from X to X+200 → customer opens same link | Price X+200, advance recalculated, no cache serving old | P0 |
| E2E-02 | Admin changes round-trip ₹/km for IC | Customer round-trip DEL, 1 day: billable max(460, 300)×rate + 500 | P0 |
| E2E-03 | Admin removes VE from MAT one way | VE gone from selector and from "from ₹X" if it was the cheapest | P0 |
| E2E-04 | Admin sets allowance for tempo traveller to 900 | Customer round trip T12 reflects 900/day | P0 |
| E2E-05 | Customer holds quote; admin edits price; customer books | PRICE_CHANGED flow (CU-71) | P0 |
| E2E-06 | Archive then restore a route | Banner on/off, sitemap always contains it | P0 |
| E2E-07 | New route created, distance calculated, cars priced, published | New page + sitemap entry + bookable | P1 |
| E2E-08 | Same quote from customer UI and `POST /quotes` via curl | Identical totals | P0 |

## 19. Cross-cutting

| ID | Check | Expected | Sev |
|---|---|---|---|
| X-01 | Accessibility (axe) on `/book` and admin grids | No critical violations; tabs keyboard-operable | P2 |
| X-02 | Hindi page `/hi/...` of booking | Labels translated; numbers identical | P2 |
| X-03 | Design locks | Mughal Terracotta tokens, chrome components, animations unchanged (LOCK-N01/N04/N06/N08) | P2 |
| X-04 | Slow 3G | Skeleton states in selector, no layout jump | P2 |
| X-05 | API 500 on `/quotes/options` | Error panel with retry; no stale prices shown | P0 |
| X-06 | Console | No errors, no secrets, no fare maths logs | P2 |

---

## Suggested automation split

- **Vitest/RTL (fast, mocked API):** CU-01..10, CU-20..30, CU-40..46, CU-50..62 (render from fixture responses), AM-02, AM-12, AM-13, AM-33, AM-48, AM-74.
- **Playwright E2E (staging):** CU-70..79, CU-92..97, AM-40..46, AM-63, E2E-01..08.
- **CI gate:** AD-G01..G10 as a script added to `npm run verify`.

Totals: 10 gate + 107 customer/admin + 8 end-to-end + 6 cross-cutting.
