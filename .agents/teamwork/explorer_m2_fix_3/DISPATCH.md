# Dispatch Task: Explorer M2 Fix 3 (DOM Budget & FleetSection Optimization)

**Role**: teamwork_explorer  
**Milestone**: Milestone M2 (Iteration 2 Fix Cycle)  
**Assigned Focus**: `react/src/components/home/FleetSection.tsx`, `App.tsx`, `HomePage.tsx`, and pre-rendered DOM budget  
**Working Directory**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_m2_fix_3\`  
**Scope Document**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\orchestrator\PROJECT.md`  
**Original Request**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\ORIGINAL_REQUEST.md`  
**Reviewer Finding**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\reviewer_m2_1_rep\handoff.md`  

## Objective
Analyze Finding 1 and the 7 test failures that occur under `PAGESPEED_MILESTONE="M2"`:
`$env:PAGESPEED_MILESTONE="M2"; node --experimental-strip-types --test react/scripts/pagespeed-e2e.test.ts`
Failing tests: T1.4.1, T1.4.2, T1.4.5, T2.4.1, T2.4.2, T2.4.5, T4.6.
Root cause:
- Pre-rendered homepage has 1,398 elements (budget is < 900).
- Maximum DOM depth is 17 (budget is <= 12).
- Peak depth 17 is located in `FleetSection.tsx`:
  `html > body > #root > .app-shell > .pt-16 > div.bg-surface > main#main-content > section#fleet > div#fleet-panel-sedan > div.relative > div.flex.gap-4 > div.min-w-[280px] > div.p-4 > div.flex > a.min-h-[44px] > svg.w-3.5 > path`.
Investigate:
1. How to flatten redundant wrapper `<div>`s in `FleetSection.tsx` without breaking fleet carousel/tabs or styling.
2. How to streamline nested wrappers in `App.tsx` / `HomePage.tsx` (`app-shell`, `pt-16`, `bg-surface`, `main`).
3. What exact changes will bring total pre-rendered DOM count under 900 (or under test thresholds) and max depth to <= 12.
Write a structured handoff report to `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_m2_fix_3\handoff.md`.
Do NOT write or modify application code. Only analyze and provide verified technical strategy.

## 2026-10-29T16:25:06Z
Received message from parent agent (3fcebbf1-d8e3-4d3a-9ba0-af6be3b0cd59):
Task: Analyze the 7 test failures that occur under PAGESPEED_MILESTONE="M2".
Failing tests: T1.4.1, T1.4.2, T1.4.5, T2.4.1, T2.4.2, T2.4.5, T4.6.
Root cause: Pre-rendered homepage has 1,398 elements (budget < 900), max DOM depth 17 (budget <= 12).
Peak depth 17 in FleetSection.tsx.
Investigate flattening FleetSection, App.tsx / HomePage.tsx wrappers, and exact changes to bring DOM count < 900 and max depth <= 12.
