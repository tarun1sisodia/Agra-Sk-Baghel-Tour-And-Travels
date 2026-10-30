# Dispatch Task: Explorer M2 Fix 2 (HomeBookingWidget Label & Flattening)

**Role**: teamwork_explorer  
**Milestone**: Milestone M2 (Iteration 2 Fix Cycle)  
**Assigned Focus**: `react/src/components/home/HomeBookingWidget.tsx` visual parity and DOM optimization  
**Working Directory**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_m2_fix_2\`  
**Scope Document**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\orchestrator\PROJECT.md`  
**Original Request**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\ORIGINAL_REQUEST.md`  
**Reviewer Finding**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\reviewer_m2_1_rep\handoff.md`  

## Objective
Analyze the visual and semantic regression in `HomeBookingWidget.tsx` reported in Finding 3 of Reviewer 1's handoff.
Worker M2 removed `<label>Vehicle Class</label>` from the fleet selector to merge container divs.
Formulate a clean strategy to:
1. Restore the visual label `<label className="booking-reference__label">Vehicle Class</label>` above the vehicle buttons without adding unnecessary nesting.
2. Preserve accessibility landmarks (`role="radiogroup"`, `role="radio"`, `aria-checked`, `role="tablist"`).
3. Ensure DOM nodes and nesting within the booking widget remain strictly minimal (currently 79-80 nodes, depth 7).
Write a structured handoff report to `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_m2_fix_2\handoff.md`.
Do NOT write or modify application code. Only analyze and provide verified technical strategy.

## 2026-10-29T16:25:06Z
You are Explorer M2 Fix 2 (teamwork_explorer).
Your working directory: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_m2_fix_2\
Read DISPATCH.md in your working directory first.
Read ORIGINAL_REQUEST.md at f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\ORIGINAL_REQUEST.md.
Read Reviewer 1's report at f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\reviewer_m2_1_rep\handoff.md (specifically Finding 3).
Read PROJECT.md at f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\orchestrator\PROJECT.md.

Task:
Analyze `react/src/components/home/HomeBookingWidget.tsx`.
Worker M2 removed `<label>Vehicle Class</label>` from the fleet selector to merge container divs.
Formulate a clean strategy to:
1. Restore the visual label `<label className="booking-reference__label">Vehicle Class</label>` above the vehicle buttons without adding unnecessary nesting.
2. Preserve accessibility landmarks (`role="radiogroup"`, `role="radio"`, `aria-checked`, `role="tablist"`).
3. Ensure DOM nodes and nesting within the booking widget remain strictly minimal (currently 79-80 nodes, depth 7).

Write your report to `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_m2_fix_2\handoff.md`.
Do NOT edit application code.
Update progress.md in your directory as you work.
When done, send a message back to me with a summary and link to handoff.md.
