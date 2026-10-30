# Dispatch: Worker M2 (Forced Reflows & DOM Optimization)

Working directory: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\worker_m2\
Original request: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\orchestrator\PROJECT.md
Explorer handoff: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_survey_2\handoff.md
Test harness: f:\Dev\Projects\tarunSisodia\ArenaAI\TEST_READY.md

## Exclusive Write Ownership
You own ONLY these files:
- `react/src/components/ui/liquid-glass-navbar.tsx`
- `react/src/components/chrome/StickyLeadBar.tsx`
- `react/src/components/home/CoverflowCarousel.tsx`
- `react/src/components/home/HomeBookingWidget.tsx`
Do NOT edit files outside this boundary.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks
1. Read `ORIGINAL_REQUEST.md`, `PROJECT.md`, `explorer_survey_2/handoff.md`, and `TEST_READY.md`.
2. In `react/src/components/ui/liquid-glass-navbar.tsx`:
   - Replace `navRef.current?.offsetWidth` query inside `ResizeObserver` with `entry.contentRect.width` from the ResizeObserver callback entry.
   - Batch style writes in `measure()` using `requestAnimationFrame`.
   - Guard `measure()` and `ResizeObserver` with bot/mobile checks.
   - Extract `NIMBUS_CSS` out of the `<nav>` component render cycle into a static block so it does not invalidate CSSOM on component mounts.
3. In `react/src/components/chrome/StickyLeadBar.tsx`:
   - Throttle `handleScroll` via `requestAnimationFrame`.
   - Remove synchronous `handleScroll()` execution during initial component mount.
4. In `react/src/components/home/CoverflowCarousel.tsx`:
   - Initialize `stageWidth` safely without synchronous forced reflow on mount.
5. In `react/src/components/home/HomeBookingWidget.tsx`:
   - Flatten intermediate decorative/grouping wrapper `<div>` elements in the booking reference dock.
   - Streamline inline `SvgIcon` SVGs to reduce total DOM elements to <900 and max depth to <=12.
6. Verify:
   - `npm --prefix react run typecheck`
   - `npm --prefix react run build`
   - `node --experimental-strip-types react/scripts/validate-pagespeed-guardrails.ts`
   - `npm --prefix react test`
7. Write your handoff report to `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\worker_m2\handoff.md` and notify via `send_message`.


## 2026-10-29T15:28:43Z
[Message] timestamp=2026-10-29T15:28:43Z sender=3fcebbf1-d8e3-4d3a-9ba0-af6be3b0cd59 priority=MESSAGE_PRIORITY_HIGH content=You are Worker M2 for Milestone M2 (Forced Reflows & DOM Optimization).
Read ORIGINAL_REQUEST.md: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\ORIGINAL_REQUEST.md
Your dispatch instructions: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\worker_m2\DISPATCH.md
Explorer handoff: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_survey_2\handoff.md
Scope document: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\orchestrator\PROJECT.md
Test harness: f:\Dev\Projects\tarunSisodia\ArenaAI\TEST_READY.md
Your working directory: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\worker_m2\
