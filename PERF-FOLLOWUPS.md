# Performance follow-ups (for manual handling)

Context: PageSpeed Insights on https://agraskbagheltourandtravels.com after PRs
#115–#125 — mobile 94, desktop 98. Remaining findings and where to handle them.

## 1. Cloudflare-injected beacon (`static.cloudflareinsights.com/beacon.min.js`, ~10 KiB)
- NOT in this repo — injected at the Cloudflare edge.
- Fix in Cloudflare Dashboard: Analytics & Logs → Web Analytics → Advanced Options →
  turn off automatic JS snippet injection; also check Speed → Optimization
  (Rocket Loader), Zaraz, Bot Fight Mode for injected scripts.

## 2. Unused CSS (~35 KiB of the 58 KiB index CSS) + render-blocking CSS (~510–580 ms mobile)
- Source is `react/src/styles/global.css` (293 KB hand-written).
- Do a Chrome DevTools Coverage pass on the built site — do NOT trust grep for
  "unused classes" (many are composed via template literals, e.g. `booking-reference__*`).
- Remove verified dead rules; optionally inline a small critical-CSS block and load
  the rest async (careful with FOUC).

## 3. Unused JS (~97 KiB): `/qcc6/` = `data-catalogue` chunk (124 KiB, 77 KiB unused), `vendor-zod` (26 KiB, 20 KiB unused)
- `react/src/data.ts` (51 KB) is imported eagerly by `HomePage.tsx` (`packages`)
  and 18 other files. Full fix: split `data.ts` by domain (packages / vehicles /
  routes / reviews / monuments) so the homepage only pulls what it needs.
- `zod` is pulled in via `react/src/contracts/fare-system.ts` (used by the booking
  flow). Safer variant: dynamic-import zod only inside the booking form, not at
  module scope. Both touch fare/booking flows — treat as sensitive, test booking end-to-end.

## 4. React error #419 (hydration mismatch, 3× in console)
- Reproduce in dev mode (`npm run dev` in react/) with the non-minified error page.
- Likely suspects: SSR (`ServerApp`/prerender) vs client (`App`) render differences
  in the hero — check date/random/locale formatting and async initial state.
- Do not just slap `suppressHydrationWarning` on it.

## 5. CSP hardening (Best Practices 92)
- `script-src 'unsafe-inline'` + host allowlists in `react/public/_headers`;
  no Trusted Types. Move to nonce-based CSP later; not performance-related.

## Already done (do not redo)
- Route/section code-splitting, idle-deferred BuddyWidget & GTM & Material Symbols,
  hero AVIF preload + fetchpriority=high + decoding=async, full img lazy-load audit,
  font swap + preconnect, immutable cache headers + SW network-first for HTML,
  responsive package-cover srcset, booking-geo chunk split, backend gzip via
  @fastify/compress, Lighthouse budget gate in `.github/workflows/render-live.yml`
  (perf ≥ 90, LCP ≤ 2.5 s, TBT ≤ 300 ms, mobile).
