# Main branch verification — 2ea4d7b0a55b

- **Result:** FAIL
- **Commit:** [2ea4d7b0a55b8cff6e182ac7e2f25e6514b8c5f6](https://github.com/tarun1sisodia/ArenaAI/commit/2ea4d7b0a55b8cff6e182ac7e2f25e6514b8c5f6)
- **Checked at:** 2026-10-19T14:11:54Z
- **Workflow run:** [39266535518](https://github.com/tarun1sisodia/ArenaAI/actions/runs/39266535518)

## Changed files

- M	backend/tests/unit/reviews-engine.test.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text
[90mstdout[2m | tests/unit/publication-worker.test.ts[2m > [22m[2mPublicationWorker (Section 12.17: PB-04 to PB-06)[2m > [22m[2mverifyDeployment: for archived event, returns false if page returns 200 with active title
[22m[39m{
  eventId: [32m'ev-archive-fail-page'[39m,
  path: [32m'/en/packages/monsoon-heritage-special/'[39m
} Archived item still served as active HTTP 200 page

[90mstdout[2m | tests/unit/publication-worker.test.ts[2m > [22m[2mPublicationWorker (Section 12.17: PB-04 to PB-06)[2m > [22m[2mverifyDeployment: for archived event, returns false if sitemap returns HTTP 500
[22m[39m{ eventId: [32m'ev-archive-500'[39m, status: [33m500[39m } Sitemap.xml did not return 200 for archive verification

[90mstdout[2m | tests/unit/publication-worker.test.ts[2m > [22m[2mPublicationWorker (Section 12.17: PB-04 to PB-06)[2m > [22m[2mverifyDeployment: for archived event, returns false if sitemap fetch throws network error
[22m[39m{ eventId: [32m'ev-archive-net-err'[39m, err: [32m'Connection refused'[39m } Sitemap.xml fetch failed for archive verification

[90mstdout[2m | tests/unit/publication-worker.test.ts[2m > [22m[2mPublicationWorker (Section 12.17: PB-04 to PB-06)[2m > [22m[2mverifyDeployment: returns false if title does not match database record
[22m[39m{
  eventId: [32m'ev-title-mismatch'[39m,
  expectedTitle: [32m'Updated Sunrise Taj Tour'[39m
} Detail page does not yet reflect published title

[90mstdout[2m | tests/unit/publication-worker.test.ts[2m > [22m[2mPublicationWorker (Section 12.17: PB-04 to PB-06)[2m > [22m[2mverifyDeployment: returns false if cover image returns HTTP 404
[22m[39m{
  eventId: [32m'ev-img-fail'[39m,
  imageUrl: [32m'https://agraskbagheltourandtravels.com/assets/packages/broken-cover.webp'[39m,
  status: [33m404[39m
} Cover image not reachable

[90mstdout[2m | tests/unit/publication-worker.test.ts[2m > [22m[2mPublicationWorker (Section 12.17: PB-04 to PB-06)[2m > [22m[2mverifyDeployment: returns false if customer site origin check fails or throws
[22m[39m{ eventId: [32m'ev-health-fail'[39m, status: [33m503[39m } Customer site origin responded with error

 [32m✓[39m tests/unit/publication-worker.test.ts [2m([22m[2m22 tests[22m[2m)[22m[32m 34[2mms[22m[39m
[90mstdout[2m | tests/unit/dynamic-publishing.test.ts[2m > [22m[2mPhase D — Dynamic Catalog Publishing & SEO Integration[2m > [22m[2mdispatches exactly one deployment attempt through the authoritative PublicationWorker, not duplicate direct calls
[22m[39m{
  eventId: [32m'0308ab6a-0547-4622-86f4-c7b994665c49'[39m,
  entityType: [32m'tour_package'[39m,
  eventType: [32m'published'[39m,
  target: [32m'https://api.cloudflare.com/client/v4/page...[redacted]'[39m
} dispatching deploy hook

[90mstdout[2m | tests/unit/dynamic-publishing.test.ts[2m > [22m[2mPhase D — Dynamic Catalog Publishing & SEO Integration[2m > [22m[2mdispatches exactly one deployment attempt through the authoritative PublicationWorker, not duplicate direct calls
[22m[39m[catalog-release] {
  correlationId: [32m'0308ab6a-0547-4622-86f4-c7b994665c49'[39m,
  reason: [32m'tour_package-published'[39m,
  entityType: [32m'tour_package'[39m,
  entityId: [32m'77777777-7777-4777-8777-777777777777'[39m,
  slug: [1mnull[22m,
  sourceVersion: [1mnull[22m,
  releaseState: [32m'release_queued'[39m,
  deployHookStatus: [32m'queued'[39m,
  httpStatus: [33m200[39m
}
{
  eventId: [32m'0308ab6a-0547-4622-86f4-c7b994665c49'[39m,
  deploymentRef: [32m'deploy-123'[39m
} deploy hook accepted; publication status moved to triggered

[90mstdout[2m | tests/unit/dynamic-publishing.test.ts[2m > [22m[2mPhase D — Dynamic Catalog Publishing & SEO Integration[2m > [22m[2mdispatches exactly one deployment attempt through the authoritative PublicationWorker, not duplicate direct calls
[22m[39m[catalog-release] {
  correlationId: [32m'0308ab6a-0547-4622-86f4-c7b994665c49'[39m,
  reason: [32m'tour_package-published'[39m,
  entityType: [32m'tour_package'[39m,
  entityId: [32m'77777777-7777-4777-8777-777777777777'[39m,
  slug: [1mnull[22m,
  sourceVersion: [1mnull[22m,
  releaseState: [32m'release_deployed'[39m,
  deployHookStatus: [32m'queued'[39m,
  httpStatus: [33m200[39m
}
{ eventId: [32m'0308ab6a-0547-4622-86f4-c7b994665c49'[39m } deployment verification succeeded; event finalized

 [32m✓[39m tests/unit/dynamic-publishing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[33m 398[2mms[22m[39m
[90mstderr[2m | tests/unit/bookings-payments.test.ts[2m > [22m[2mSection 12.12: Booking and payment (BK-01 to PM-10)[2m > [22m[2mEM-03: sendBookingConfirmationEmail returns false without crashing when Resend returns HTTP 500
[22m[39m[payments] Resend confirmation email delivery failed for AGR-20261019-1278: Internal Resend Server Error

 [32m✓[39m tests/unit/bookings-payments.test.ts [2m([22m[2m21 tests[22m[2m)[22m[32m 205[2mms[22m[39m
 [32m✓[39m tests/unit/fare-engine.test.ts [2m([22m[2m91 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [31m❯[39m tests/unit/reviews-engine.test.ts [2m([22m[2m32 tests[22m[2m | [22m[31m2 failed[39m[2m)[22m[32m 32[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-01: Valid QR token -> form loads with prefill[32m 4[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-02: Expired, revoked or unknown token -> rejected; nothing leaked[32m 2[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-03: Booking link used twice -> second submit rejected[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-04: QR link used by many customers -> separate pending submissions[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-05: New submission -> pending; absent from /public/reviews and /public/gallery[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-06: Approve with homepage placement -> in /public/reviews only[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-07 & RV-08: Approve gallery placement with approved and rejected photos[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-09: Rejected submission -> never public[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-10: consent_public false -> cannot be placed publicly[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-11: Instagram john_doe -> link https://www.instagram.com/john_doe/[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-12: Username with spaces, a pasted URL or / -> VALIDATION_ERROR[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-13: Unknown platform; platform without username or reverse -> VALIDATION_ERROR[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-14: Review text with <script> -> stored as text, rendered escaped[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-15: 6 photos -> rejected[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-18: Booking review email -> has ticket id and trip summary; no phone or email in the URL[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-19: Resend retried with the same idempotency key[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-20: Booking without email marked completed -> no automatic email; admin can copy the link[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-21: Resend fails -> email_last_error set[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-22: Admin approves, rejects, edits or revokes -> audit row each with before and after[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-23: Non-admin calls a review admin endpoint -> FORBIDDEN[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-24: Pending or draft items in any public endpoint -> never returned[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-25: Incomplete booking cannot generate review link[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-26: Admin approval and publication do not require a completed-booking status match[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-27: Admin list submissions returns ticket ID and completed verification flag[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-28: Admin can publish a consented QR review without a linked booking[32m 0[2mms[22m[39m
[31m   [31m×[31m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-29: Admin can publish a consented QR review photo to the gallery[39m[32m 9[2mms[22m[39m
[31m     → expected false to be true // Object.is equality[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-30: A missing linked booking does not block an otherwise approved review[32m 0[2mms[22m[39m
[31m   [31m×[31m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-31: A booking status change does not block gallery publication[39m[32m 1[2mms[22m[39m
[31m     → expected false to be true // Object.is equality[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-32: Missing customer public consent rejected from homepage and gallery publication[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-33: Publication rejected if submission is not approved[32m 0[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-34: Eligible completed-ticket review publishes successfully to homepage and gallery[32m 1[2mms[22m[39m
   [32m✓[39m Section 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-35: Public queries return approved, consented reviews even when no booking is linked[32m 0[2mms[22m[39m
[90mstderr[2m | tests/unit/admin-finance-status.test.ts[2m > [22m[2mAdmin Finance Visibility & Booking Status Alignment[2m > [22m[2mpayments.service: Durable Webhook Retry & Idempotency[2m > [22m[2msafeguards booking creation when user_id is not present in profiles
[22m[39m[bookings] Profile auto-provision attempt for non-existent-user-id: violates foreign key constraint on auth.users

 [32m✓[39m tests/unit/admin-finance-status.test.ts [2m([22m[2m12 tests[22m[2m)[22m[32m 96[2mms[22m[39m
 [32m✓[39m tests/unit/property-matrix.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m tests/unit/quotes.service.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/unit/admin-fare.test.ts [2m([22m[2m13 tests[22m[2m)[22m[33m 1615[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)[2m > [22mAA-14: LocationIQ key is absent from every response and log line [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/booking-pdf.service.test.ts [2m([22m[2m19 tests[22m[2m)[22m[33m 406[2mms[22m[39m
 [32m✓[39m tests/unit/rental-enquiries.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 33[2mms[22m[39m
 [32m✓[39m tests/unit/legacy-schema-reconciliation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 229[2mms[22m[39m
 [32m✓[39m tests/unit/package-fleet-price.test.ts [2m([22m[2m20 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m tests/unit/contracts.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 60[2mms[22m[39m
 [32m✓[39m tests/unit/admin-catalog-create.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/unit/admin-unmask.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 261[2mms[22m[39m
 [32m✓[39m tests/unit/fare-strategy-boundary.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m tests/unit/clean-routes-alias.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 95[2mms[22m[39m
 [32m✓[39m tests/unit/catalog-manifest.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 125[2mms[22m[39m
 [32m✓[39m tests/unit/locationiq.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1608[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min [33m 803[2mms[22m[39m
   [33m[2m✓[22m[39m LocationIQ Service Unit Tests (AA-09 to AA-11)[2m > [22mAA-11: Routing failure throws ROUTING_FAILED [33m 802[2mms[22m[39m
 [32m✓[39m tests/unit/booking-schema.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/unit/local-package-media.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m

[31m⎯⎯⎯⎯⎯⎯⎯[39m[1m[41m Failed Tests 2 [49m[22m[31m⎯⎯⎯⎯⎯⎯⎯[39m

[41m[1m FAIL [22m[49m tests/unit/reviews-engine.test.ts[2m > [22mSection 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-29: Admin can publish a consented QR review photo to the gallery
[31m[1mAssertionError[22m: expected false to be true // Object.is equality[39m

[32m- Expected[39m
[31m+ Received[39m

[32m- true[39m
[31m+ false[39m

[36m [2m❯[22m tests/unit/reviews-engine.test.ts:[2m690:99[22m[39m
    [90m688| [39m    [34mexpect[39m(updated[33m.[39mstatus)[33m.[39m[34mtoBe[39m([32m"approved"[39m)[33m;[39m
    [90m689| [39m    [34mexpect[39m(updated[33m.[39mshow_in_gallery)[33m.[39m[34mtoBe[39m([35mtrue[39m)[33m;[39m
    [90m690| [39m    expect((await reviewsService.getPublicGallery()).some((img) => img…
    [90m   | [39m                                                                                                  [31m^[39m
    [90m691| [39m  })[33m;[39m
    [90m692| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/reviews-engine.test.ts[2m > [22mSection 12.16: Reviews engine (RV-01 to RV-24)[2m > [22mRV-31: A booking status change does not block gallery publication
[31m[1mAssertionError[22m: expected false to be true // Object.is equality[39m

[32m- Expected[39m
[31m+ Received[39m

[32m- true[39m
[31m+ false[39m

[36m [2m❯[22m tests/unit/reviews-engine.test.ts:[2m728:99[22m[39m
    [90m726| [39m    [34mexpect[39m(updated[33m.[39mstatus)[33m.[39m[34mtoBe[39m([32m"approved"[39m)[33m;[39m
    [90m727| [39m    [34mexpect[39m(updated[33m.[39mshow_in_gallery)[33m.[39m[34mtoBe[39m([35mtrue[39m)[33m;[39m
    [90m728| [39m    expect((await reviewsService.getPublicGallery()).some((img) => img…
    [90m   | [39m                                                                                                  [31m^[39m
    [90m729| [39m  })[33m;[39m
    [90m730| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯[22m[39m


[2m Test Files [22m [1m[31m1 failed[39m[22m[2m | [22m[1m[32m21 passed[39m[22m[90m (22)[39m
[2m      Tests [22m [1m[31m2 failed[39m[22m[2m | [22m[1m[32m342 passed[39m[22m[90m (344)[39m
[2m   Start at [22m 14:11:21
[2m   Duration [22m 32.62s[2m (transform 1.26s, setup 0ms, collect 23.50s, tests 5.33s, environment 3ms, prepare 1.14s)[22m

```
