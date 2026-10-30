# Project: PageSpeed 100/100 All Categories (Mobile & Desktop)

## Architecture
- Monorepo: `react/` (customer site), `admin/`, `backend/`. Target of PageSpeed optimizations is `react/` deployed at `https://agraskbagheltourandtravels.com`.
- Data flow & rendering pipeline:
  1. Vite build compiles React 19 SPA (`react/src/main.tsx` -> `react/src/app/App.tsx`).
  2. Pre-rendering script (`react/scripts/prerender.ts`) runs `ServerApp.tsx` via Node SSR to generate 120 static HTML pages with hydration markers (`<!--$-->`).
  3. Pre-rendered HTML is served via Cloudflare Pages with headers defined in `react/public/_headers`.
  4. Client-side hydration takes over asynchronously in the browser.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Critical CSS Inlining & Non-blocking CSS | Inline above-the-fold CSS in `<style id="critical-css">` in `prerender.ts`; load main stylesheet asynchronously with `media="print" onload="this.media='all'"` + noscript | M1 | Survey (Explorer 1 & 3) |
| 2 | LCP Hero Image Preload Harmonization | Unify `imagesizes` in `prerender.ts` with `HomeHeroSlideshow.tsx` `sizes`; fix fallback href to 1280.avif; hoist preload to top of `<head>` | M1 | Survey (Explorer 1) |
| 3 | Forced Reflow Elimination in Components | Fix `liquid-glass-navbar.tsx` layout thrashing (batch style writes, use `contentRect.width`, extract `NIMBUS_CSS`), throttle `StickyLeadBar.tsx` and fix `CoverflowCarousel.tsx` | M2 | Survey (Explorer 2) |
| 4 | DOM Size & Complexity Reduction | Flatten 6 intermediate wrapper `<div>` levels in `HomeBookingWidget.tsx` and streamline inline SVGs in `SvgIcon` to reduce DOM nodes to <900 and depth to <=11 | M2 | Survey (Explorer 2) |
| 5 | Route Code-Splitting & Zod Decoupling | Lazy-load `HomePage` with `React.lazy()` in `App.tsx`; load `fetchCatalogManifest` on idle; group static JSON in `data-catalogue` chunk in `vite.config.ts`; strip console/debugger in prod | M3 | Survey (Explorer 3) |
| 6 | Security Headers & Trusted Types | Add `require-trusted-types-for 'script'; trusted-types default 'allow-duplicates';` in `react/public/_headers` and default fallback policy in `index.html` to achieve 100/100 Best Practices | M3 | Survey (Explorer 3) |
| 7 | Third-Party Script Mitigation | Ensure GTM remains deferred to user interaction/bot-gated; add bot mitigation script in `<head>` for Cloudflare beacon and edge challenge scripts | M3 | Survey (Explorer 2) |
| 8 | E2E Testing, Monorepo Validation & Git Push | Run E2E verification suite, pass `npm run verify` (typecheck x3 + backend tests + build x3 + SEO + guardrails), and commit & push to GitHub `main` | M4 | Survey & User Dispatch |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Critical CSS & LCP Preload | `react/scripts/prerender.ts`, `react/src/components/home/HomeHeroSlideshow.tsx`, `react/index.html` | none | DONE |
| M2 | Forced Reflows & DOM Optimization | `react/src/components/ui/liquid-glass-navbar.tsx`, `react/src/components/chrome/StickyLeadBar.tsx`, `react/src/components/home/CoverflowCarousel.tsx`, `react/src/components/home/HomeBookingWidget.tsx`, `react/src/components/home/FleetSection.tsx` | none | IN_PROGRESS (Fix Iteration 2 queued) |
| M3 | Code-Splitting, Security Headers & Script Deferral | `react/vite.config.ts`, `react/src/app/App.tsx`, `react/public/_headers`, `react/index.html` | M1, M2 | PLANNED |
| M4 | Final E2E Pass, Full Verification & Git Push | Monorepo root `npm run verify`, E2E test verification, git commit and push to `main` | M1, M2, M3 | PLANNED |

## Interface Contracts
### Prerender ↔ Client App
- `prerender.ts` injects `<style id="critical-css">` in `<head>` and rewrites CSS link to non-render-blocking loader.
- `HomeHeroSlideshow.tsx` uses matching `sizes="(max-width: 640px) 100vw, (max-width: 1366px) 1280px, 100vw"`.
- React hydration markers (`<!--$-->`) must be preserved across client SPA and server pre-render.

### Client Router ↔ Chunking
- `App.tsx` uses `React.lazy()` for all route components including `HomePage`.
- `ServerApp.tsx` retains static imports for Node SSR.
- `data-catalogue` chunk isolates static catalog JSON without leaking into critical path.

## Code Layout
- `react/scripts/prerender.ts` — Pre-rendering script, critical CSS inlining, preload tag injection
- `react/index.html` — Production HTML template, font preloads, head meta
- `react/src/components/home/HomeHeroSlideshow.tsx` — Taj Mahal hero image component
- `react/src/components/ui/liquid-glass-navbar.tsx` — Luxury glass navbar (reflow optimization)
- `react/src/components/chrome/StickyLeadBar.tsx` — Sticky lead bar (reflow throttling)
- `react/src/components/home/CoverflowCarousel.tsx` — Coverflow carousel (reflow fix)
- `react/src/components/home/HomeBookingWidget.tsx` — Booking widget (DOM flattening & SVG consolidation)
- `react/src/components/home/FleetSection.tsx` — Fleet cards container (DOM depth & node count reduction)
- `react/src/app/App.tsx` — Client routing and code splitting
- `react/vite.config.ts` — Rollup manualChunks and esbuild optimization
- `react/public/_headers` — Cloudflare Pages security headers (CSP & Trusted Types)
