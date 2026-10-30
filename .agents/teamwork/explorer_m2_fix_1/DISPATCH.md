# Dispatch Task: Explorer M2 Fix 1 (Liquid Navbar Lifecycle)

**Role**: teamwork_explorer  
**Milestone**: Milestone M2 (Iteration 2 Fix Cycle)  
**Assigned Focus**: `react/src/components/ui/liquid-glass-navbar.tsx` lifecycle and resize mechanics  
**Working Directory**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_m2_fix_1\`  
**Scope Document**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\orchestrator\PROJECT.md`  
**Original Request**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\ORIGINAL_REQUEST.md`  
**Reviewer Finding**: `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\reviewer_m2_1_rep\handoff.md`  

## Objective
Analyze the lifecycle flaw in `liquid-glass-navbar.tsx` reported in Finding 2 of Reviewer 1's handoff.
Currently, `isMobileOrHidden` inside mount `useEffect` hooks causes an early return when viewport < 1280px, permanently preventing `ResizeObserver` from attaching and WebGL from initializing when resized to desktop (since `Header.tsx` toggles display via `hidden xl:flex` without unmounting the navbar).
Formulate a safe, verified fix strategy that:
1. Always attaches `ResizeObserver` on mount.
2. In the observer callback, checks if `entry.contentRect.width >= 1280` and `!isAuditOrBot`, lazily initializes WebGL if not already initialized, and runs `measure()`.
3. Handles all resize, rotation, and split-screen transitions cleanly without layout thrashing.
Write a structured handoff report to `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_m2_fix_1\handoff.md`.
Do NOT write or modify application code. Only analyze and provide verified technical strategy.
