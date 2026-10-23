# TestSprite Execution Prompt — React Customer Site

You are testing the customer-facing React application for **Agra SK Baghel Tour & Travels** in the repository `tarun1sisodia/Agra-Sk-Baghel-Tour-And-Travels`, app root `react/`.

Use `CUSTOMER_REACT_PRD_TESTSPRITE.md` as the functional specification. Treat current deployed behavior and API/database state as the truth; do not trust static copy, a toast, or HTTP 200 alone. The goal is complete functional and contract coverage, not a short smoke test.

## Environment configuration

- `CUSTOMER_BASE_URL`: the active **staging** customer URL, expected to be `https://skbagheltravels-customer.coccoder999.workers.dev` unless the operator supplies a newer staging URL.
- `API_BASE_URL`: the matching staging backend API. The known production-shaped host in repository docs is `https://api.agraskbagheltourandtravels.com`; verify the currently configured staging API rather than assuming this is safe for writes.
- `CUSTOMER_A_EMAIL` / `CUSTOMER_A_PASSWORD`: dedicated staging customer A credentials.
- `CUSTOMER_B_EMAIL` / `CUSTOMER_B_PASSWORD`: separate staging customer B credentials for ownership isolation.
- `RAZORPAY_TEST_MODE`: must be enabled; use test credentials and the provider's official test instruments only.
- `VALID_REVIEW_TOKEN` and `INVALID_REVIEW_TOKEN`: dedicated staging fixture values.
- `TEST_RUN_ID`: generate a unique non-sensitive run identifier and prefix test-created records with `TS-CUS-<TEST_RUN_ID>` where possible.

Do not ask for or print private API/provider secrets. Do not switch to production credentials or run real charges. If the deployed API/environment cannot be confirmed as staging, block every mutation/payment test and report the blocker instead of continuing on production.

## Required execution method

1. Open the staging site and record frontend hostname, build/release identifier when available, browser/version, viewport, API host, and auth/gateway configuration state.
2. Crawl all reachable pages, internal navigation links, generated route manifests and static public route artifacts. Build a route inventory covering home, all marketing hubs, route/vehicle/package/local/transfer/monument detail families, SEO landing pages, login/OAuth callback, booking, My Bookings, payment resume, confirmation/voucher, review invitation, rental, legal pages and 404.
3. Derive tests from the PRD and every visible interactive element: nav links, tabs, filters, search, pagination, cards, CTA buttons, date/time widgets, forms, modals, galleries, account actions, payment recovery, review rating/upload/consent, print and downloads.
4. Run tests in risk order: security/identity/payment contracts first, booking/date/time/fare integrity second, end-to-end core customer journeys third, catalog and forms fourth, then responsive/accessibility/SEO/quality.
5. For mutations, inspect the server response and verify persisted state wherever the staging environment provides a safe inspection path. Reconcile before retrying after timeout. Do not submit twice merely because the UI did not update.
6. Exercise negative cases by injecting safe malformed values at the form/API test boundary. Do not perform denial-of-service or real-world payment attack traffic.
7. Run mobile and desktop viewports, keyboard-only paths, reduced-motion checks, direct route loads and refreshes, and browser back/forward flows.
8. Do not modify application code, database schema, deployment config or data to force a pass. Record potential product defects as findings.

## Priority zero and one tests (must execute first)

- Verify the actual staging API host; prove no frontend request points to `localhost` or an unintended production host.
- Booking auth gate cannot be bypassed through direct API requests.
- Pickup date/time (including a non-default time such as 14:35 IST) is preserved across quote, authenticated redirect, booking record, My Bookings, confirmation, and PDF voucher where each includes that field. Explicitly test against the historical default-09:00 failure class.
- Quote total, advance, balance, and paise/rupee conversion match backend response; null/missing/malformed `amount_paise` prevents checkout launch.
- Browser payment callback does not confirm the booking without backend verification.
- Duplicate submit, callback replay, multi-tab, ambiguous network result, and payment-resume flows do not duplicate booking/capture.
- Already-captured payment cannot launch a second checkout; definitely failed and eligible payment may use the documented new-attempt flow.
- Customer A cannot read Customer B's booking, resume B's payment, or download B's voucher by ID substitution.
- Voucher download returns a real PDF and includes the correct authoritative booking information.
- Contact and rental form success requires a valid persisted server response ID; HTTP 200 with malformed body must not be treated as success.
- Invalid/expired review token cannot create a falsely verified public review; public output must exclude pending/rejected/non-consenting reviews.
- No private keys/secrets in `react/dist`, HTML, source maps, browser storage, network responses, or console logs.

## Full test scope

Use all test cases in Sections 20 and 21 of `CUSTOMER_REACT_PRD_TESTSPRITE.md` as the minimum baseline (TS-CUS-001 through TS-CUS-158 plus the six end-to-end workflows). Expand beyond the listed cases to cover every additional route, branch, form field, button, status variant, and dynamic slug discovered during crawling.

For data-driven pages, test at least:
- one valid published item;
- one empty/invalid/missing slug;
- one unpriced item if available;
- one unavailable/archived item if safe staging fixture exists;
- one backend timeout/failure;
- one item opened directly and one reached via navigation.

For forms, test happy path, required-field omissions, malformed/over-limit fields, double submit, server validation failure, server 5xx/offline, response body malformed despite 2xx, and successful persistence. For stateful money/booking flows, test the state before and after every action.

## Route and product data rules

- Do not assume the route list in older documentation is fully current. Discover current routes from `react/src/app/App.tsx`, `react/src/app/ServerApp.tsx`, generated manifests, crawl links, and staging behavior.
- Explicitly test English/Hindi switch behavior and compare visible language, `<html lang>`, canonical links and `hreflang`; do not pass language tests just because the URL changes. Record mismatch as a gap.
- Do not hard-code a 28%/72% split if current backend quote returns a different approved value; compare UI with the returned quote and current terms. Report inconsistency if displayed rule conflicts with the active backend contract.
- Do not accept a synthesized zero price for missing/null price fields.
- Do not use generated static content as proof of live booking price or payment status.

## Evidence and output required

Produce a final report with:

1. **Run summary:** environment, release/build, date/time, browser, viewport, test counts by pass/fail/blocked/skipped and severity.
2. **Complete route matrix:** route URL, route family, load/refresh result, title/canonical/language, broken links/assets, and test IDs.
3. **Test results:** ID, preconditions, action, expected vs actual, status, priority, evidence link/screenshot, console/network evidence, and staging record ID if stateful.
4. **P0/P1 defects first:** concise reproduction steps, real impact, response/status details, affected source/API contract, and why the failure is confirmed.
5. **Contract integrity matrix:** frontend value → request payload → response schema → persisted server value → customer-visible value for booking ID, pickup date/time/timezone, trip/product/vehicle, total/advance/balance, payment status, PDF data, inquiry IDs and review consent/status.
6. **Payment attempt reconciliation:** list the IDs/statuses of every test booking/payment attempt and prove there are no unexplained duplicates. Redact personal/payment information.
7. **Publishing integration results:** when a staging Admin fixture is available, distinguish saved, queued, build started, build complete, activated, release verified, and customer-visible. Do not collapse these into a generic “published” result.
8. **Security/privacy findings:** ownership/IDOR, open redirect, XSS, storage, secrets, sensitive URLs/logs, review consent, and noindex/privacy issues.
9. **Responsive/accessibility report:** tested viewport and keyboard/screen reader relevant failures.
10. **Uncovered/blocked tests:** exact reason, missing fixture/permissions, and the next action needed.
11. **Release verdict:** `READY`, `NOT READY`, or `BLOCKED`; no `READY` recommendation while any unapproved P0/P1 remains or payment/booking integrity cannot be proven.

## Rules for classifying outcomes

- `PASS`: evidence supports the expected behavior and persistence/authority requirements.
- `FAIL`: observed behavior contradicts a requirement.
- `BLOCKED`: required staging access, credentials, fixture, or test-safe environment is missing.
- `SKIPPED`: not executed; must include an explicit reason. A blocked/skip is not a pass.
- Never invent a selector, booking ID, payment event, successful deployment, test fixture or screenshot. Inspect the actual DOM/API first and ground evidence in the current run.

Start with the environment check and route crawl. Continue into the full suite only after staging safety is confirmed.
