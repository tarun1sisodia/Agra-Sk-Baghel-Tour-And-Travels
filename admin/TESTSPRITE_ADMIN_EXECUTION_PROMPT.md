# TestSprite Prompt — Admin Operations Desk

Test the Agra SK Baghel Tour & Travels Admin Operations Desk end-to-end against the **staging environment only**. Use `ADMIN_PRD_TESTSPRITE.md` as the source coverage contract and create named, repeatable tests for every route, visible action, and cross-module journey in that document.

## Required coverage

1. Authentication, Google OAuth callback, session restoration, logout, token expiry, direct-link protection and unknown routes.
2. Overview dashboard.
3. Bookings: search/filter/detail/create, legal status transitions, expected-version conflicts, PII masking/unmasking, pickup date/time, amount validation.
4. Fleet & vehicles: groups/models, preset tabs/search/onboarding, image library/preview, activate/deactivate.
5. Fare settings, round-trip rates and extra charges.
6. Outstation routes: CRUD, distance calculation, pricing matrix, publish/archive.
7. Catalog CMS: CRUD, media constraints, publish/unpublish/archive, manifest republish.
8. Tour packages and local sightseeing/transfer routes.
9. Policies/company profile/monuments and dossier sign-off.
10. Reviews: generate invite link, copy, WhatsApp URI, QR code/download, moderation, consent, publish/unpublish.
11. Inquiries and rental requests: search/filter, status, notes and call link.
12. Finance: ledger totals, currency/minor-unit mapping, partial/full refund, invalid inputs, authorization, idempotency and provider failure.
13. Publishing outbox: status counters/filters, diagnostics, safe retry and release verification.
14. Audit log: filters/details, mutation denial and sensitive-data exposure checks.
15. Responsive, keyboard accessibility, loading/empty/error states, network resilience, XSS input handling and console/network hygiene.

## Must-check current source inconsistencies

- Current TypeScript role union contains only `super_admin` and `finance_operator`, but normal auth extraction and stored-session validation require `super_admin`. Older documentation claims five roles and a demo role selector. Do not invent the selector; verify the `finance_operator` mismatch and classify it accurately.
- Current auth uses `localStorage` (`skb-admin-session`), while older docs say session storage. Test actual logout/expiry/deep-link behavior and report the policy mismatch.
- Do not allow missing booking pickup date/time to default to the current time or 9:00 AM.
- Do not allow a null/missing/non-finite payment amount to launch a gateway checkout or display as a valid ₹0 transaction.
- Verify paise/minor units are converted to rupees exactly once.
- Verify backend authorization, not just UI-hidden/disabled buttons.
- Publishing is complete only when the expected build/release is activated and the customer staging site serves that release, not merely when a deploy hook responds successfully.

## Safety rules

- Set admin/API/customer URLs explicitly to the matching staging services before the run.
- Use synthetic data prefixed `TSADM-<run-id>` and payment-provider sandbox credentials only.
- Never execute live payment/refund operations or destructive production mutations.
- Do not delete audit, payment or publication-event history.
- If credentials, seeded states or sandbox prerequisites are missing, mark cases blocked rather than passed.
- Verify authoritative persistence after mutations; a click or optimistic UI change is not sufficient evidence.

## Evidence and final report

For every failure, capture the exact steps, page/route, expected vs actual result, screenshot, relevant request/response, console error, test data ID and correlation/request ID if available. Report test counts (passed/failed/blocked), route coverage, severity P0–P3, data/API contract defects, security findings, source/documentation mismatches, reproduction steps and a prioritized remediation list. Do not modify repository code, DNS, deployment configuration, payment settings or production data during the run.
