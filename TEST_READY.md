# TEST_READY: PageSpeed 100/100 4-Tier E2E Testing Suite

**Target:** `https://agraskbagheltourandtravels.com` (`react/` app)  
**Date:** 2026-10-29  
**Suite Status:** ✅ **READY & VERIFIED** (100 Tests Executing)  
**Pass / Skip / Fail:** **79 PASS | 21 DEFERRED (M2/M3) | 0 FAIL** (Duration: ~210ms)  

---

## 1. Overview & Objectives
This test suite delivers comprehensive, opaque-box E2E validation for achieving 100/100 PageSpeed Insights across Performance, Accessibility, Best Practices, and SEO on both mobile and desktop. It is structured around the rigorous 4-tier testing methodology:
- **Tier 1: Feature Coverage** (>=5 tests per feature across all 8 features = 40 tests)
- **Tier 2: Boundary & Corner Cases** (>=5 tests per feature across all 8 features = 40 tests)
- **Tier 3: Cross-Feature Combinations** (Pairwise interactions across optimizations = 10 tests)
- **Tier 4: Real-World Application Scenarios** (Lighthouse audit simulations & PageSpeed synthetic benchmarks = 10 tests)

Total Suite: **100 tests** validating pre-rendered static artifacts (`react/dist`), component runtime sources, security headers, DOM tree depth, and client bundle splits.

---

## 2. Test Files Manifest

| File Path | Description | Test Count |
|---|---|---|
| `react/scripts/pagespeed-test-utils.ts` | Shared utilities: DOM metrics analyzer, CSP parser, preload/script extractors, and progressive milestone runner. | Shared Harness |
| `react/scripts/pagespeed-e2e-tier1.test.ts` | **Tier 1**: Feature Coverage for all 8 features. | 40 tests |
| `react/scripts/pagespeed-e2e-tier2.test.ts` | **Tier 2**: Boundary, extreme state, and corner case tests for all 8 features. | 40 tests |
| `react/scripts/pagespeed-e2e-tier3.test.ts` | **Tier 3**: Pairwise cross-feature interactions and system synergies. | 10 tests |
| `react/scripts/pagespeed-e2e-tier4.test.ts` | **Tier 4**: Real-world Lighthouse mobile/desktop simulation, accessibility, and SEO scenarios. | 10 tests |
| `react/scripts/pagespeed-e2e.test.ts` | **Master Runner**: Single entrypoint importing and orchestrating all 4 tiers. | 100 tests |

---

## 3. How to Run the Tests

### Single Standard Command (Recommended)
```bash
npm --prefix react test
```
*or directly via Node built-in test runner:*
```bash
node --experimental-strip-types --test react/scripts/pagespeed-e2e.test.ts
```

### Running Individual Tiers
```bash
# Tier 1: Feature Coverage (40 tests)
node --experimental-strip-types --test react/scripts/pagespeed-e2e-tier1.test.ts

# Tier 2: Boundary & Corner Cases (40 tests)
node --experimental-strip-types --test react/scripts/pagespeed-e2e-tier2.test.ts

# Tier 3: Cross-Feature Combinations (10 tests)
node --experimental-strip-types --test react/scripts/pagespeed-e2e-tier3.test.ts

# Tier 4: Real-World Scenarios (10 tests)
node --experimental-strip-types --test react/scripts/pagespeed-e2e-tier4.test.ts
```

### Progressive Milestone Scoping
```bash
# Milestone M1 Strict Mode (Features 1, 2 & baseline 8)
PAGESPEED_MILESTONE=M1 node --experimental-strip-types --test react/scripts/pagespeed-e2e.test.ts

# Milestone M2 Strict Mode (Features 1, 2, 3, 4)
PAGESPEED_MILESTONE=M2 node --experimental-strip-types --test react/scripts/pagespeed-e2e.test.ts

# Strict Full-Audit Mode (Enforces 100% end-state completion across all milestones)
PAGESPEED_STRICT=1 node --experimental-strip-types --test react/scripts/pagespeed-e2e.test.ts
```

---

## 4. Feature Coverage Matrix (100 Tests)

| # | Feature | Milestone | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross) | Tier 4 (Scenario) | Total Tests |
|---|---------|-----------|-------------------|-------------------|----------------|-------------------|-------------|
| 1 | Critical CSS Inlining & Non-blocking CSS | M1 | T1.1.1 – T1.1.5 (5) | T2.1.1 – T2.1.5 (5) | T3.1, T3.2 | T4.1, T4.7 | 14 tests |
| 2 | LCP Hero Image Preload Harmonization | M1 | T1.2.1 – T1.2.5 (5) | T2.2.1 – T2.2.5 (5) | T3.1, T3.6 | T4.2 | 13 tests |
| 3 | Forced Reflow Elimination in Components | M2 | T1.3.1 – T1.3.5 (5) | T2.3.1 – T2.3.5 (5) | T3.5 | T4.9 | 12 tests |
| 4 | DOM Size & Complexity Reduction | M2 | T1.4.1 – T1.4.5 (5) | T2.4.1 – T2.4.5 (5) | T3.2 | T4.6 | 12 tests |
| 5 | Route Code-Splitting & Zod Decoupling | M3 | T1.5.1 – T1.5.5 (5) | T2.5.1 – T2.5.5 (5) | T3.3, T3.8 | T4.7 | 13 tests |
| 6 | Security Headers & Trusted Types | M3 | T1.6.1 – T1.6.5 (5) | T2.6.1 – T2.6.5 (5) | T3.4, T3.9 | T4.4 | 13 tests |
| 7 | Third-Party Script Mitigation | M3 | T1.7.1 – T1.7.5 (5) | T2.7.1 – T2.7.5 (5) | T3.6 | T4.7, T4.9 | 13 tests |
| 8 | Monorepo Validation & SEO Audits | M4 | T1.8.1 – T1.8.5 (5) | T2.8.1 – T2.8.5 (5) | T3.10 | T4.3, T4.5, T4.8, T4.10 | 17 tests |
| **Total** | | | **40 tests** | **40 tests** | **10 tests** | **10 tests** | **100 tests** |

---

## 5. Verification & Progressive Testability Status

### Test Run Execution Report
```text
> skb-react@0.1.0 test
> node --experimental-strip-types --test scripts/pagespeed-e2e.test.ts

ℹ tests 100
ℹ suites 20
ℹ pass 79
ℹ fail 0
ℹ cancelled 0
ℹ skipped 21
ℹ todo 0
ℹ duration_ms 210.5059
```

- **Milestone 1 Features (Critical CSS & LCP Preload)**: **100% PASSING**.
  - `CRITICAL_CSS` inlining in `prerender.ts` into `<style id="critical-css">`.
  - Non-render-blocking stylesheet loader (`media="print"` with `onload="this.media='all'"` and `<noscript>` fallback).
  - Preload hoisting beneath viewport meta tag.
  - Image sizes harmonized to `(max-width: 640px) 100vw, (max-width: 1366px) 1280px, 100vw`.
  - Fallback href configured to `1280.avif`.
- **Milestone 2 Features (Reflows & DOM Depth)**: 6 passed (baseline guards), 6 deferred to worker_m2.
- **Milestone 3 Features (Code-Splitting, Headers, Scripts)**: 12 passed (GTM bot-gating, idle deferral, cache headers), 10 deferred to worker_m3.
- **Milestone 4 Features (E2E Validation & SEO Integrity)**: **100% PASSING** (Doctype, hydration markers, sitemap, security guardrails).

---

## 6. Implementation Escalations for Upcoming Milestones

1. **For Worker M2 (Forced Reflows & DOM Optimization)**:
   - `react/src/components/ui/liquid-glass-navbar.tsx`: Replace `navRef.current?.offsetWidth` query inside `ResizeObserver` callback with `entry.contentRect.width`, extract `NIMBUS_CSS` out of `<nav>` render tree.
   - `react/src/components/chrome/StickyLeadBar.tsx`: Wrap `handleScroll` in `requestAnimationFrame` throttle and avoid calling `handleScroll()` synchronously during initial component mount.
   - `react/src/components/home/HomeBookingWidget.tsx`: Flatten intermediate wrapper `<div>`s to reduce homepage element count from ~1,414 down to <900 and max depth from 18 to <=12.

2. **For Worker M3 (Code-Splitting & Security Headers)**:
   - `react/src/app/App.tsx`: Convert `import { HomePage } from "../pages/HomePage";` to `const HomePage = lazy(() => import("../pages/HomePage").then(m => ({ default: m.HomePage })));`.
   - `react/vite.config.ts`: Add `esbuild: { drop: ['console', 'debugger'] }` for production mode.
   - `react/public/_headers`: Add `require-trusted-types-for 'script';` and `trusted-types default 'allow-duplicates';` to `Content-Security-Policy`.
   - `react/index.html`: Initialize default Trusted Types policy fallback if supported by browser.
