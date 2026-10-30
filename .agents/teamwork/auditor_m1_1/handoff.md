# Forensic Audit Report: Milestone M1 (Critical CSS and LCP Preload)

**Work Product**: Milestone M1 implementations in `react/scripts/prerender.ts`, `react/src/components/home/HomeHeroSlideshow.tsx`, and generated artifacts in `react/dist/`  
**Profile**: General Project (Development Mode per `ORIGINAL_REQUEST.md`)  
**Verdict**: **CLEAN**  

---

### Phase Results
- **Phase 1: Source Code Analysis**:
  - *Hardcoded output detection*: **PASS** — No hardcoded test bypasses, fake strings, or mock flags found.
  - *Facade detection*: **PASS** — `CRITICAL_CSS` contains 11,557 bytes of authentic design tokens and layout rules. Preload logic dynamically references `HOME_HERO_SLIDES[0]`.
  - *Pre-populated artifact detection*: **PASS** — Clean working tree; no pre-baked verification outputs.
  - *Test & Guardrail Tampering*: **PASS** — `react/scripts/validate-pagespeed-guardrails.ts` and `react/scripts/validate-seo-artifacts.ts` are 100% untouched.
- **Phase 2: Behavioral Verification**:
  - *TypeScript Compilation*: **PASS** — `tsc --noEmit` exited 0 with 0 errors.
  - *Pre-render & SSG Generation*: **PASS** — 120 pages rendered + 29 redirects emitted without errors.
  - *Guardrails & SEO Verification*: **PASS** — `validate-pagespeed-guardrails.ts` and `validate-seo-artifacts.ts` passed cleanly.
  - *Unit & Integration Test Suites*: **PASS** — Monorepo `npm test` (162 backend + 41 react + 5 admin tests) passed with 0 failures.
  - *E2E Test Suites*: **PASS** — `pagespeed-e2e.test.ts` (79 passed, 0 failed, 21 deferred to M2/M3).
  - *Adversarial Stress Testing*: **PASS** — `challenger-1-m1.test.ts` (10/10 passed: PostCSS AST 133 rules / 356 declarations, 118 subpages verified, 24 responsive oracle checks).

---

## 1. Observation

### A. Code Modification Scope (Git Diff)
The implementation changes are strictly confined to two files:
1. `react/scripts/prerender.ts`:
   - Lines 39–234: Added authentic `CRITICAL_CSS` declaration (11,557 characters) containing CSS custom property tokens (`:root`), base resets, header styling (`#site-header`), hero layout (`.font-headline-hero`, `section.min-h-[520px]`), and booking widget structure (`.booking-reference`).
   - Lines 548–551: Rewrote synchronous stylesheet `<link>` in `baseTemplate` to:
     ```html
     <style id="critical-css">
     ${CRITICAL_CSS}
         </style>
         <link rel="preload" as="style" href="$1" />
         <link rel="stylesheet" href="$1" media="print" onload="this.media='all'" />
         <noscript><link rel="stylesheet" href="$1" /></noscript>
     ```
   - Lines 708–722: Harmonized desktop hero preload tag `imagesizes` to `"(max-width: 640px) 100vw, (max-width: 1366px) 1280px, 100vw"` and hoisted the tags immediately after `<meta name="viewport" ... />`.
2. `react/src/components/home/HomeHeroSlideshow.tsx`:
   - Lines 145 & 156: Updated AVIF and WebP `<source>` elements to `sizes="(max-width: 640px) 100vw, (max-width: 1366px) 1280px, 100vw"`.
   - Line 159: Updated fallback `<img>` src to `slide.avif.desktop || slide.webp.desktop || slide.webp.large`.

### B. Pre-existing Guardrails & Invariants
- `react/scripts/validate-pagespeed-guardrails.ts` was examined via `git diff` and was completely untouched (0 lines changed).
- `react/scripts/validate-seo-artifacts.ts` was examined via `git diff` and was completely untouched (0 lines changed).
  - Verified invariant at lines 266–268:
    ```ts
    const desktopHeroPreload = imagePreloads.find((tag) => attribute(tag, "media") === "(min-width: 641px)");
    assert.ok(desktopHeroPreload, "Homepage must preload the desktop hero image.");
    assert.equal(attribute(desktopHeroPreload, "href"), firstHero.avif.medium, "Desktop hero preload must use the initial slide's medium AVIF.");
    ```
    The worker correctly retained `firstHero.avif.medium` for the fallback `href` attribute while configuring `imagesrcset` and `imagesizes` to select `1280.avif` on desktop viewports, fully preserving this invariant without weakening tests.

### C. Generated Static Artifacts (`react/dist/`)
- In `react/dist/index.html`:
  - `<style id="critical-css">`: Verified present at line 117 (AST parse: 133 rules, 356 declarations, 13 media queries).
  - Non-render-blocking link: Verified present at line 314 (`media="print" onload="this.media='all'"`).
  - Preload hoisting: Verified at lines 6–7 directly adjacent to `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`.
  - Hydration markers: Verified present (`<!--$-->` intact, 0 hydration mismatches).
- Across all 147 HTML files in `react/dist/`:
  - 118 regular SSR marketing pages contain `<style id="critical-css">`, `<link rel="preload" as="style">`, non-blocking `media="print"` loader, and `<noscript>` fallback.
  - 29 redirect stubs appropriately omit full payload.
  - Non-homepage subpages (e.g. `/en/services/`, `/en/about/`, `/en/contact/`) correctly omit the Taj Mahal hero image preload.

---

## 2. Logic Chain

```
[Observation 1]: git diff shows changes strictly in prerender.ts and HomeHeroSlideshow.tsx.
                 Existing guardrails (validate-pagespeed-guardrails.ts, validate-seo-artifacts.ts) are untouched.
       │
       ▼
[Inference 1]: No tests or guardrail scripts were weakened, bypassed, or commented out.
       │
       ▼
[Observation 2]: PostCSS parsed <style id="critical-css"> extracted from dist/index.html into 133 rules,
                 356 declarations, and 13 at-rules matching actual homepage DOM elements (#site-header, .booking-reference).
       │
       ▼
[Inference 2]: Critical CSS is genuine and authentic, not an empty or dummy facade.
       │
       ▼
[Observation 3]: Preload scanner tags in prerender.ts and <picture> in HomeHeroSlideshow.tsx use the identical
                 sizes string: "(max-width: 640px) 100vw, (max-width: 1366px) 1280px, 100vw".
                 Desktop preload tags are hoisted directly after <meta name="viewport">.
       │
       ▼
[Inference 3]: Zero asset divergence occurs between speculative preloading and DOM picture evaluation;
                 resource load delay is minimized with earliest possible discovery in <head>.
       │
       ▼
[Observation 4]: npm test (162 backend + 41 react + 5 admin), npm run customer:seo (13/13),
                 pagespeed-e2e.test.ts (79 pass / 0 fail), and challenger-1-m1.test.ts (10/10) all executed cleanly.
       │
       ▼
[Conclusion]: All M1 claims are verified empirically. No integrity violations exist. Verdict: CLEAN.
```

---

## 3. Caveats

1. **Subsequent Milestones Required for 100/100 PSI**:
   Milestone M1 solves CSS render-blocking (360ms desktop, 1,420ms mobile) and LCP preload discovery delay. Remaining PageSpeed opportunities (forced reflows in `liquid-glass-navbar.tsx` and `StickyLeadBar.tsx`, DOM tree flattening in `HomeBookingWidget.tsx`, route code-splitting, CSP Trusted Types, and third-party bot gating) belong to Milestones M2 and M3.
2. **CSP 'unsafe-inline' Style Compatibility**:
   Inlined `<style id="critical-css">` requires `style-src 'unsafe-inline'` or a hash/nonce. Verified in `react/public/_headers` line 11 that `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` is actively configured.

---

## 4. Conclusion

The work product for Milestone M1 (Critical CSS & LCP Preload) demonstrates authentic engineering integrity:
- **No hardcoded test bypasses**: All logic is dynamic and data-driven.
- **No facade implementations**: Critical CSS contains 11.5 KB of valid, PostCSS-verified layout CSS; preload sizes are authentically unified across SSR and client components.
- **No weakened tests**: Existing CI invariants and guardrail assertions were preserved without alteration.
- **Empirically verified**: All typechecks, builds, tests, and adversarial stress tests passed cleanly with 0 failures.

**Final Verdict**: **CLEAN**

---

## 5. Verification Method

To independently reproduce the forensic verification, execute the following commands in order:

```bash
# 1. Typecheck validation
npm --prefix react run typecheck

# 2. Pre-render build and guardrail validation
npm --prefix react run build

# 3. Direct guardrail verification
node --experimental-strip-types react/scripts/validate-pagespeed-guardrails.ts

# 4. SEO & catalog source suites
npm --prefix react run test:seo
npm --prefix react run test:catalog-sources

# 5. Milestone M1 4-Tier E2E test suite
node --experimental-strip-types --test react/scripts/pagespeed-e2e.test.ts

# 6. Empirical Adversarial Stress Test Suite (PostCSS AST, 118-page scan, responsive oracle)
node --experimental-strip-types --test react/scripts/challenger-1-m1.test.ts
```
