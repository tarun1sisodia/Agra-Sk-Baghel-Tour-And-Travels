# Verification and Lighthouse Audit Report

**Project:** Agra SK Baghel Tour and Travels  
**Repository:** `tarun1sisodia/Agra-Sk-Baghel-Tour-And-Travels`  
**Branch audited:** `main` at `74abdb1` plus the fixes in this change  
**Production site:** https://agraskbagheltourandtravels.com/  
**Production API:** https://api.agraskbagheltourandtravels.com/  
**Audit date:** 2026-10-22

## Changes applied

- Fixed the admin nullable contract regression by normalizing nullable `usePerKm` values to `false` when populating local-package and transfer-route edit forms.
- Fixed homepage fleet accessibility semantics by adding the required `tablist` role around vehicle category tabs.
- Marked the decorative arrow glyph in fleet booking links as `aria-hidden`, preventing it from corrupting accessible names.
- Added `https://static.cloudflareinsights.com` to the customer-site Content Security Policy so the deployed Cloudflare Insights script is explicitly permitted.
- Added three bounded catalog-fetch attempts with incremental backoff to the release manifest builder. Release builds remain fail-closed after all attempts fail; transient Render cold-start/connectivity failures no longer cause avoidable single-shot build failures.

## Verification results

### Passing checks

- Contract synchronization check: **passed**
- Customer TypeScript check: **passed**
- Admin TypeScript check: **passed after the nullable `usePerKm` fix**
- Backend TypeScript check: **passed**
- Customer production configuration validation: **passed**
- Backend CI suite: **360 tests passed across 24 files**
- Customer catalog and regression suite: **41 tests passed**
- Admin test suite: **11 tests passed**
- Customer SEO lifecycle suite: **passed**
- Customer production build: **passed** after catalog retry implementation
- SEO artifact validation: **passed** — 85 HTML files and 53 sitemap URLs

The full verification pipeline initially failed on the new admin nullable contract. After that fix, the full pipeline passed through tests and failed only during a transient production catalog connection timeout. The retry implementation was added and the customer build subsequently completed successfully. A final full rerun was started, successfully completed catalog collection and customer prerender/SEO validation, and was interrupted while the admin build was running to honor the request to push the changes; the admin typecheck and admin test suite had already passed independently.

## Lighthouse audit

Lighthouse was run against the live homepage with Lighthouse 12.8.2 in both mobile and desktop configurations. Full HTML and JSON reports are stored beside this document.

| Configuration | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| Mobile | 56 | 92 | 93 | 100 |
| Desktop | 86 | 95 | 93 | 100 |

### Core metrics

| Metric | Mobile | Desktop |
|---|---:|---:|
| First Contentful Paint | 3.0 s | 1.1 s |
| Largest Contentful Paint | 8.6 s | 1.9 s |
| Speed Index | 3.1 s | 2.1 s |
| Total Blocking Time | 510 ms | 30 ms |
| Cumulative Layout Shift | 0 | 0.014 |
| Time to Interactive | 9.5 s | 1.9 s |
| Root document response | 80 ms | 260 ms |

### SEO and crawlability

- Lighthouse SEO score: **100 mobile and desktop**.
- Homepage, representative route and package pages returned HTTP 200 with meaningful server-rendered HTML.
- Unknown route returned HTTP 404 with a dedicated not-found page.
- Canonical URLs use `https://agraskbagheltourandtravels.com`.
- Served sitemap and robots documents returned HTTP 200.
- Sitemap contains 53 canonical production URLs.
- The production robots file points to the canonical sitemap.

### Remaining Lighthouse opportunities

The live audit still identifies performance and accessibility opportunities that are separate from the blocking build/contract failures:

1. Mobile JavaScript execution and unused JavaScript are high. The homepage loads large shared bundles, including Supabase and catalog data, before all interactive sections are needed.
2. Mobile LCP is 8.6 seconds. The homepage fleet/hero imagery should be further optimized with responsive `srcset` variants and stricter above-the-fold image prioritization.
3. Lighthouse reports oversized/responsive-image opportunities, including fleet imagery and the booking reference image.
4. The homepage DOM is large at approximately 1,195 elements; below-the-fold sections should be progressively loaded or split where practical.
5. The audit observed a React hydration warning on the currently deployed live build. This should be re-audited after the pushed deployment because the audit was run before these source changes reached production.

These are optimization backlog items, not SEO blockers: the live SEO score is 100, canonical metadata is present, and the crawl documents are valid.

## Saved audit artifacts

- `home-mobile.report.html`
- `home-mobile.report.json`
- `home-desktop.report.html`
- `home-desktop.report.json`
