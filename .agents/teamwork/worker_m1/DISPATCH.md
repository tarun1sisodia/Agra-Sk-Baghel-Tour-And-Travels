# Dispatch: Worker M1 (Critical CSS & LCP Preload)

Working directory: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\worker_m1\
Original request: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\orchestrator\PROJECT.md
Explorer handoff: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_survey_1\handoff.md

## Exclusive Write Ownership
You own ONLY these files:
- `react/scripts/prerender.ts`
- `react/src/components/home/HomeHeroSlideshow.tsx`
- `react/index.html`
Do NOT edit files outside this boundary.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks
1. Read `ORIGINAL_REQUEST.md`, `PROJECT.md`, and Explorer 1's report (`explorer_survey_1/handoff.md`).
2. In `react/scripts/prerender.ts`:
   - Inline critical above-the-fold CSS into `<style id="critical-css">` in `<head>`.
   - Transform render-blocking stylesheet to:
     `<link rel="preload" as="style" href="$1" />\n    <link rel="stylesheet" href="$1" media="print" onload="this.media='all'" />\n    <noscript><link rel="stylesheet" href="$1" /></noscript>`
   - Harmonize `imagesizes` with `HomeHeroSlideshow.tsx` `sizes` to `"(max-width: 640px) 100vw, (max-width: 1366px) 1280px, 100vw"`.
   - Set desktop preload fallback `href` to `1280.avif`.
   - Hoist `heroPreloadTags` to top of `<head>` immediately after viewport meta.
3. In `react/src/components/home/HomeHeroSlideshow.tsx`:
   - Match `sizes` on all `<source>` elements.
   - Update fallback `<img>` `src` to `slide.avif.desktop || slide.webp.desktop || slide.webp.large`.
4. Verification:
   - Run `npm --prefix react run typecheck`
   - Run `npm --prefix react run build`
   - Run `node --experimental-strip-types react/scripts/validate-pagespeed-guardrails.ts`
   - Verify `dist/index.html` contents.
5. Write your handoff report to `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\worker_m1\handoff.md`.
6. Send completion message back to orchestrator via `send_message`.

## 2026-10-29T14:53:37Z
You are Worker M1 for the PageSpeed 100/100 project.
Read ORIGINAL_REQUEST.md at: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\ORIGINAL_REQUEST.md
Your dispatch instructions: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\worker_m1\DISPATCH.md
Explorer 1 handoff: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_survey_1\handoff.md
Scope document: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\orchestrator\PROJECT.md
Your working directory: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\worker_m1\

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive file write ownership:
- react/scripts/prerender.ts
- react/src/components/home/HomeHeroSlideshow.tsx
- react/index.html

Tasks:
Implement Critical CSS inlining, non-render-blocking CSS loading (media="print" onload="this.media='all'"), and LCP hero image preload harmonization as specified in DISPATCH.md and Explorer 1's handoff.
Verify with:
- npm --prefix react run typecheck
- npm --prefix react run build
- node --experimental-strip-types react/scripts/validate-pagespeed-guardrails.ts

Write your handoff report to: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\worker_m1\handoff.md
Notify via send_message when complete with build/test results.

