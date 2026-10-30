# Dispatch: Explorer 1 (CSS, LCP & Fonts)

You are Explorer 1 on the Survey team.
Working directory: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_survey_1\
Original request: f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\ORIGINAL_REQUEST.md

## Scope & Objective
Investigate CSS render-blocking, LCP resource loading, and font loading in the customer app (`react/`).
Analyze:
1. `react/index.html` - How CSS is currently linked, head structure, existing preload tags.
2. How critical CSS can be inlined or loaded asynchronously without FOUC or layout shifts.
3. LCP Taj Mahal hero image preloading (desktop: 1280, mobile: 960) and how `HomeHeroSlideshow.tsx` renders it (e.g. `fetchpriority`, `loading="eager"`, sizes/srcset).
4. `react/src/styles/fonts.css` and other style files - `@font-face` declarations, `font-display: swap` status, preloading of critical webfonts.
5. Check `docs/project/DESIGN_LOCKS.md` and `FRONTEND_RULES.md` for any locked components or design rules.

Write your findings to `f:\Dev\Projects\tarunSisodia\ArenaAI\.agents\teamwork\explorer_survey_1\handoff.md`.
Report back via `send_message` with your summary and handoff path.

## 2026-10-29T14:37:12Z
Investigate CSS render-blocking, LCP resource loading, and font loading in the customer app (react/).
Analyze:
1. react/index.html — how CSS is currently loaded, existing preload tags, critical above-the-fold styling.
2. How critical CSS can be inlined or loaded asynchronously without FOUC or layout shifts.
3. LCP Taj Mahal hero image preloading (desktop: 1280.avif, mobile: 960.avif) and how HomeHeroSlideshow.tsx renders it.
4. react/src/styles/fonts.css and other style files — @font-face declarations, font-display: swap, webfont preloads.
5. Check docs/project/DESIGN_LOCKS.md and FRONTEND_RULES.md.
