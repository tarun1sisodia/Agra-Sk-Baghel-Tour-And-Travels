# Homepage UI/UX Audit & Defect Report

**Date:** 2026-10-14  
**Repository:** `tarun1sisodia/ArenaAI`  
**Branch:** `main`  
**Reviewed Commit:** `d117258f6f2f32178fa4746bd05929b95f369a20`  
**Target Page:** Customer Homepage (`react/src/pages/HomePage.tsx`)  
**Auditor:** Antigravity AI Pair Programmer

---

## Executive Summary

A comprehensive multi-viewport visual, responsive, and functional audit of the customer homepage was conducted across 7 canonical viewports (`320px`, `360px`, `390px`, `768px`, `1024px`, `1280px`, `1440px`). Baseline screenshots were captured and inspected alongside live interactive state tests (booking form mode switching, date picker activation, fleet showcase inspection, route pricing, service tags, guided tour catalog resolution, and floating widget collisions).

The audit identified 10 distinct defect areas spanning layout stability, date input overlay rendering, synthetic/hardcoded fallback prices, static vehicle card grids, and lack of canonical live data binding for local packages.

---

## Baseline Screenshot Artifacts

The following baseline viewport screenshots were recorded:

| Viewport | Device Class | Baseline Screenshot Artifact |
|---|---|---|
| **320px × 700px** | Ultra-narrow mobile | `viewport_320x700_1791977852212.png`, `viewport_320_scrolled_1791977864028.png` |
| **360px × 700px** | Standard compact mobile | `viewport_360x700_1791977905389.png` |
| **390px × 800px** | Modern mobile (iPhone 14/15/16) | `viewport_390x800_1791977917516.png` |
| **768px × 1024px** | Tablet portrait | `viewport_768x1024_1791977929957.png` |
| **1024px × 768px** | Small desktop / iPad landscape | `viewport_1024x768_1791977973454.png` |
| **1280px × 800px** | Medium desktop | `viewport_1280x800_1791978016507.png` |
| **1440px × 900px** | Large widescreen desktop | `viewport_1440x900_1791978035206.png` |

---

## Detailed Defect Inventory

### Defect 1: Booking Widget Mode Switching Layout Instability
- **Section:** Hero / Home Booking Widget (`#home-booking-widget`)
- **Screen Width:** All widths (320px to 1440px)
- **Severity:** High
- **Affected Files:** `react/src/components/home/HomeBookingWidget.tsx`, `react/src/styles/global.css`
- **Reproduction Steps:**
  1. Open homepage at any viewport.
  2. Note default height and layout under "One Way" mode.
  3. Click "Round Trip" tab: an extra "Return Date" field is dynamically inserted, increasing height.
  4. Click "Local Tour" tab: Origin and Destination fields are replaced by a single Local Tour dropdown, and a completely separate 4-card grid (`booking-reference__tour-cards`) renders below the controls, doubling the card height and shifting page content dramatically.
- **Expected Result:** The widget container maintains a stable, deliberate height and structure across all three modes without sudden layout shifts, clipping, or content jumping.
- **Actual Result:** Form height jumps abruptly between ~340px (One Way), ~400px (Round Trip), and ~580px (Local Tour with 4 auxiliary cards).
- **Evidence:** `viewport_320_scrolled_1791977864028.png`, `HomeBookingWidget.tsx:125-235`.

---

### Defect 2: Date Input Value Display Bleed & Triple-Layer Overlay
- **Section:** Home Booking Widget Date Fields (Pickup Date, Return Date)
- **Screen Width:** 320px – 768px
- **Severity:** High
- **Affected Files:** `react/src/components/home/HomeBookingWidget.tsx`, `react/src/styles/global.css:14529-14541`
- **Reproduction Steps:**
  1. Inspect the Pickup Date control in DOM.
  2. Notice it contains:
     - An invisible `<input type="date">` styled with `opacity: 0; position: absolute; inset: 0; z-index: 2`.
     - A formatted text `<span>` (`15 Oct 2026`).
     - A transparent `<button>` overlay at `z-index: 3`.
  3. On narrow viewports or browser engines with native date picker popups, clicking the button triggers `showPicker()`, while the invisible input may also capture focus, leading to desynchronization and visible date text clipping or bleeding outside the input border.
- **Expected Result:** Clean, accessible input presentation where the selected date is clearly inside the input boundary, icon aligned on the left, accessible native date picker activation, with no stacked conflicting click targets.
- **Actual Result:** 3 stacked elements (button over input over span) cause hit-test interference and date text clipping on narrow mobile widths.
- **Evidence:** `global.css:14539-14541`, `HomeBookingWidget.tsx:187-205`.

---

### Defect 3: Local Tour Selector Disconnected from Canonical Published Catalog
- **Section:** Home Booking Widget — Local Tour mode
- **Screen Width:** All widths
- **Severity:** High
- **Affected Files:** `react/src/components/home/HomeBookingWidget.tsx`
- **Reproduction Steps:**
  1. Switch to "Local Tour".
  2. Inspect the options in `<select id="home-local-tour">` and the 4 cards below.
  3. The code imports static `packages` from `../../data/catalogue` filtered by duration `1 day` (line 22) and defines hardcoded `localTourCards` with static slugs (`agra-sightseeing`, `mathura-vrindavan`, `same-day-tour-of-jaipur`, `same-day-tour-of-fatehpur-sikri`).
- **Expected Result:** The selector and any preview cards should load canonical published local packages from `fetchPublishedLocalTransfers()` (`/api/v1/local-tours`), displaying truthful available packages and passing canonical IDs to `/book.html`.
- **Actual Result:** Static catalog snapshot is used, ignoring real published packages from the database.
- **Evidence:** `HomeBookingWidget.tsx:22-28`.

---

### Defect 4: Hardcoded Fallback Prices in Cab & Tour Services Badges
- **Section:** Cab & Tour Services Grid
- **Screen Width:** All widths
- **Severity:** Medium
- **Affected Files:** `react/src/pages/HomePage.tsx`
- **Reproduction Steps:**
  1. Inspect `cabServiceTags` and `directTransferPrices` in `HomePage.tsx`.
  2. Notice fallback operators:
     ```tsx
     "local-sightseeing": `From ₹${directTransferPrices["agra-sightseeing"] || 1900}`,
     "airport-transfers": `From ₹${directTransferPrices["delhi-airport-transfer"] || 3499}`,
     "railway-transfers": `From ₹${directTransferPrices["agra-cantt-railway-station-transfer"] || 800}`,
     ```
- **Expected Result:** Prices must be resolved directly from published routes/transfers. If unconfigured or missing, display "On request" or a truthful non-numeric label; never synthesize ₹1900, ₹3499, or ₹800.
- **Actual Result:** Guessed numerical fallbacks appear if the database record is not loaded or missing.
- **Evidence:** `HomePage.tsx:190-210`.

---

### Defect 5: "Choose Your Vehicle" Uses Outdated Static 3-Column Card Grid Instead of Group-Switching Showcase
- **Section:** Choose Your Vehicle (`#fleet-section` / `FleetSection.tsx`)
- **Screen Width:** All widths
- **Severity:** High
- **Affected Files:** `react/src/components/home/FleetSection.tsx`, `backend/src/modules/fares/fleet/fleet.service.ts`
- **Reproduction Steps:**
  1. Scroll down to "Choose Your Vehicle".
  2. Notice a rigid 3-column grid rendering static vehicle cards (Sedan, Ertiga, Crysta).
  3. Also, `/api/v1/fleet` previously crashed with `column "created_at" does not exist` when `db.fareRules.getActive()` was queried on PostgreSQL.
- **Expected Result:** An animated, tabbed/group-switching fleet showcase for the canonical groups: **Sedan**, **SUV**, **Luxury**, and **Tempo Traveller**, loaded with real canonical active vehicle models from `/api/v1/fleet` (displaying passengers, bags, perKm rate, and direct canonical Book link).
- **Actual Result:** Static 3-column cards without canonical groups (Luxury and Tempo Traveller not accessible in the main grid).
- **Evidence:** `FleetSection.tsx:1-120`.

---

### Defect 6: Popular Outstation Routes Round-Trip Rate Display and Ordering
- **Section:** Popular Outstation Routes (`#popular-routes`)
- **Screen Width:** 320px – 390px mobile
- **Severity:** Medium
- **Affected Files:** `react/src/pages/HomePage.tsx`
- **Reproduction Steps:**
  1. Inspect the Outstation route rows.
  2. Under Round-Trip mode, verify the displayed fare basis and ensure pricing comes from the approved per-km rate or route quote.
  3. On 320px mobile viewport, route action CTA "Book Cab" can wrap awkwardly or squeeze the distance/duration pills.
- **Expected Result:** Mobile layout stacks cleanly, prices reflect canonical rates, and button text remains fully visible without truncation.
- **Actual Result:** Pill badges and book button can crowd on narrow 320px screens.
- **Evidence:** `viewport_320_scrolled_1791977864028.png`.

---

### Defect 7: Guided Tours Starting Fare Fallbacks & Missing Detail Context
- **Section:** Guided Tours (`#guided-tours`)
- **Screen Width:** All widths
- **Severity:** Medium
- **Affected Files:** `react/src/pages/HomePage.tsx`
- **Reproduction Steps:**
  1. Inspect the tour cards rendered from `publishedPackages`.
  2. If starting price is null or unconfigured, it must cleanly show "On request" instead of ₹0 or any fallback.
  3. Book links must pass canonical package slug/ID (`/book.html?category=tour_package&product=...`).
- **Expected Result:** Honest display with proper "On request" badge and canonical booking URL handoff.
- **Actual Result:** Missing price could default or link with partial query parameters.
- **Evidence:** `HomePage.tsx:280-340`.

---

### Defect 8: Famous Places & Monuments Booking Handoff
- **Section:** Famous Places & Monuments (`FamousPlacesSection.tsx`)
- **Screen Width:** All widths
- **Severity:** Medium
- **Affected Files:** `react/src/components/home/FamousPlacesSection.tsx`
- **Reproduction Steps:**
  1. Click "Book Cab" on any monument card (Taj Mahal, Agra Fort, Fatehpur Sikri).
  2. Inspect the generated destination booking link: verify whether it links to a canonical destination or generic booking.
- **Expected Result:** Links preserve the monument name/destination in the booking URL (`/book.html?category=outstation&to=...` or custom quote path) and WhatsApp booking messages reflect the actual monument.
- **Actual Result:** Some cards had generic or static booking parameters.
- **Evidence:** `FamousPlacesSection.tsx:120-180`.

---

### Defect 9: Direct Charters & Transfers Slugs Parity
- **Section:** Direct Charters & Transfers Directory
- **Screen Width:** All widths
- **Severity:** Medium
- **Affected Files:** `react/src/pages/HomePage.tsx`
- **Reproduction Steps:**
  1. Inspect the 6 predefined direct transfer cards.
  2. Confirm slugs match published `transfer_routes` records from `/api/v1/transfers`.
  3. Remove any hardcoded price fallbacks (`|| 800`, `|| 3499`).
- **Expected Result:** Every card matches a published transfer route and displays dynamic fares from the database.
- **Actual Result:** Fallback prices used if transfer route is not in cache.
- **Evidence:** `HomePage.tsx:190-210`.

---

### Defect 10: Trust Claim and Metric Substantiation
- **Section:** Trust ticker, Why Book With Us, Footer
- **Screen Width:** 320px – 768px
- **Severity:** Low / Medium
- **Affected Files:** `react/src/pages/HomePage.tsx`, `react/src/components/home/HomeBookingWidget.tsx`
- **Reproduction Steps:**
  1. Inspect trust statements across the page.
  2. Ensure non-numeric or verified honest editorial claims are used rather than synthetic numbers ("3,800+ Verified Trips" / "4.9/5" without live review aggregation).
- **Expected Result:** Verified truthful editorial badges and assurances ("Verified Commercial Drivers", "Transparent Fare Quotes", "24/7 Booking Support").
- **Actual Result:** Mix of static marketing numbers.
- **Evidence:** `HomePage.tsx:140-170`.

---

## Action Plan & Remediation Matrix

| Phase | Component / Target | Primary Fixes |
|---|---|---|
| **Phase 1** | `HomeBookingWidget.tsx`, `global.css` | Fix date input overlay (clean internal text, native activation, min-date sync); stabilize layout across 3 modes; bind Local Tour to `fetchPublishedLocalTransfers()`. |
| **Phase 2** | `HomePage.tsx` Hero | Prevent fixed header collision, check mobile headline clamp, contrast overlay. |
| **Phase 3** | `HomePage.tsx` Routes | Ensure canonical route order, dynamic sedan rate, clean 320px mobile flex layout. |
| **Phase 4** | `HomePage.tsx` Services | Remove `|| 1900`, `|| 3499`, `|| 800`; render "On request" or truthful label when price absent. |
| **Phase 5** | `FleetSection.tsx` | Redesign into animated group-switching showcase (**Sedan**, **SUV**, **Luxury**, **Tempo Traveller**) consuming `/api/v1/fleet` canonical data. |
| **Phase 6** | `HomePage.tsx` Tours | Real published packages, "On request" for unpriced tours, canonical booking links. |
| **Phase 7** | `FamousPlacesSection.tsx` | Preserve selected destination in canonical booking link and WhatsApp text. |
| **Phase 8** | `HomePage.tsx` Transfers | Match cards to published transfer routes with zero hardcoded fallbacks. |
| **Phase 9** | `HomePage.tsx` Trust/Lead | Eliminate unsubstantiated stats; verify z-index and spacing on 320–390px. |
| **Phase 10** | Monorepo Verification | Visual post-remediation capture across 7 viewports + `npm run verify`. |
