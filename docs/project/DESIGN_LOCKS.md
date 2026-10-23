# Design Lock Registry — SK Baghel Tour & Travels

> **Single Source of Truth for Approved & Immutable UI, Logic & Design Patterns.**
> 
> This registry protects approved components, layouts, typography, color palettes, micro-interactions, and business logic from accidental edits, style drift, or regression during subsequent development phases.

---

## Operating Protocol for AI Agents

1. **Mandatory Pre-Edit Gate:**
   - **Before modifying, refactoring, restyling, or deleting ANY existing file, component, CSS class, or pattern, the AI MUST consult this document.**
2. **Strict Rule for `LOCKED` Items:**
   - **If a component, pattern, or file is marked `LOCKED`:**
     - **DO NOT TOUCH, EDIT, REFACTOR, OR RE-THEME IT AUTOMATICALLY.**
     - **YOU MUST STOP AND ASK THE USER FIRST.**
     - Explicit prompt format:
       > *"The component `<ComponentName />` (or style/pattern) is currently marked as **LOCKED** in `DESIGN_LOCKS.md`. Would you like to unlock it or approve this specific modification?"*
   - Only proceed with modifying a locked component if the user explicitly confirms or requests changes to it.
3. **Behavior for `UNLOCKED` / New Features:**
   - If an item is `UNLOCKED` or not listed, proceed according to `03_PHASE_PLAN.md` and `REACT-MIGRATION-PLAN.md` as normal.
4. **Registering New Locks:**
   - Whenever the user says *"Lock this design"*, *"Make this permanent"*, *"Keep this pattern"*, or approves a component/feature as final, immediately add it to the **Active Locks Registry** below with its exact file paths, critical classes, visual tokens, and date.

---

## Active Locks Registry (New Luxury Design System — 2026-09-25)

> **Migration Notice (2026-09-25):** The client explicitly authorized retiring the legacy v1 static designs (LOCK-001 through LOCK-011) to be replaced with the ultra-luxury HTML designs from `react/new_design/`. The new system is governed by `LOCK-N01` through `LOCK-N05`.

| Lock ID | Component / Pattern | Status | Primary Files & Selectors | Key Locked Characteristics | Locked Date |
|---|---|---|---|---|---|
| `LOCK-N01` | **Mughal Terracotta Design Tokens** | `LOCKED` | `react/src/styles/theme.css`<br>`react/src/styles/tokens.css` | Hex palette: Primary `#9F3C16`, Sandstone `#C85A32`, Sunlit Saffron `#D97746`, Obsidian `#0F131A`, Soft Black `#181D27`, Ivory Surface `#FDF8F5`, Gold `#D99A3E`, Jade `#2D6A4F`. Fonts: `EB Garamond` display, `Plus Jakarta Sans` body/UI, Google `Material Symbols Outlined`. | 2026-09-25 |
| `LOCK-N02` | **Universal Tour Package Template** | `LOCKED` | `react/src/pages/PackageDetailPage.tsx` | Universal dynamic template based on `taj_mahal_sunrise_guided_tour.html` taking `pkg: TourPackage` props. 4 structured chapters: 01. Experience Overview, 02. Package Accounting (Inclusions/Exclusions), 03. Monument Protocols & Guidelines, 04. Hour-by-Hour Timeline. Sticky reservation dock with starting rates and 28% deposit. | 2026-09-25 |
| `LOCK-N03` | **4-Step Booking & Billing Engine** | `LOCKED` | `react/src/features/booking/` | Step 1 Vehicle Tier selection, Step 2 Schedule & Pickup details, Step 3 Add-on Upgrades & summary, Step 4 Billing Form, and Voucher Confirmation. 28% advance token calculation with 72% balance on drop-off. | 2026-09-25 |
| `LOCK-N04` | **Ultra-Luxury Chrome Suite** | `LOCKED` | `react/src/components/chrome/` | Glassmorphic sticky header (`bg-surface/90 backdrop-blur-xl`), phone + WhatsApp CTAs, mobile navigation drawer, and 4-column luxury footer with 28% advance guarantee trust seals. | 2026-09-25 |
| `LOCK-N05` | **Fare Engine Invariants** | `LOCKED` | `react/src/features/booking/fareEngine.ts`<br>`react/src/fares.ts` | 300 km/day minimum outstation billing, toll inclusions, 28% advance deposit calculation, zero tourist trap guarantee. | 2026-09-25 |
| `LOCK-N06` | **Dual Infinite Reviews Marquee** | `LOCKED` | `react/src/components/home/ReviewsMarquee.tsx` | Two-row opposing infinite marquee roller in Mughal Terracotta tokens. Row 1 scrolls left, Row 2 reverses right. Pause-on-hover, edge-gradient masks, verified badge pills, gold 5-star Material Symbols. Data from `reviews` catalogue. All class names use `font-*` and `text-*` design tokens only. | 2026-09-25 |
| `LOCK-N07` | **HomePage Master Editorial Design & Bento System** | `LOCKED` | `react/src/pages/HomePage.tsx`<br>`react/src/components/home/` | Approved luxury design master: Dark atmospheric hero with live booking fare dock, Famous Places showcase with pure black WhatsApp CTA & white text, unified luxury dark bento cards (`bg-ink-charcoal text-ivory-surface` with `bg-primary text-white` icons & gold pills), and editorial typography hierarchy. | 2026-09-26 |
| `LOCK-N08` | **Heritage Animations & Motifs Suite** | `AUTHORIZED` | `react/src/styles/heritage-animations.css`<br>`react/src/pages/ServicesPage.tsx` | Authorized by user 2026-10-09: Mughal arch motif (`.arch`, `.arch-full`), hairline rules (`.rule`), texture overlay (`.texture`), card lift (`.lift`), link sweep (`.sweep`), rotating medallion (`.spin-slow`), marquee track (`.marquee-track`), and progressive scroll reveal (`.reveal`) applied over existing fonts. | 2026-10-09 |

---

## Retired Legacy Locks (Superseded by New Design System)

| Legacy Lock ID | Previous Component | Status | Superseded By | Reason |
|---|---|---|---|---|
| `LOCK-001` | Benefits Section | `SUPERSEDED` | `services.html` & `services_why_choose_us.html` | User authorized full UI replacement with new luxury HTML design. |
| `LOCK-002` | Architectural Bento Contact Card | `SUPERSEDED` | `contact-us.html` | Replaced by new luxury contact design. |
| `LOCK-003` | 2-Row Liquid Glass Reviews Marquee | `SUPERSEDED` | `home.html` reviews section | Replaced by new luxury reviews showcase. |
| `LOCK-004` | 3D Coverflow Sightseeing Carousel | `SUPERSEDED` | `home.html` tour showcase & `packages.html` | Replaced by new luxury tour packages grid. |
| `LOCK-005` | Six Operational Services Grid | `SUPERSEDED` | `services.html` & `home.html` | Replaced by new 6-vertical services showcase. |
| `LOCK-006` | Popular Outstation Routes Grid | `SUPERSEDED` | `home.html` & `routes.html` | Replaced by new route fare matrix. |
| `LOCK-007` | Trust Roller Marquee | `SUPERSEDED` | `home.html` trust badges | Replaced by new trust badges and concierge seals. |
| `LOCK-008` | Home Hero Bento Grid & Fare Widget | `SUPERSEDED` | `home.html` Hero Expedition Dock | Replaced by Mughal Dawn Hero Expedition Dock. |
| `LOCK-009` | Luxury Fleet Showcase Section | `SUPERSEDED` | `fleet.html` showroom | Replaced by new showroom cards. |
| `LOCK-010` | Brand Design System & Color Tokens | `SUPERSEDED` | `LOCK-N01` (Terracotta & Sandstone system) | Replaced by new brand tokens. |
| `LOCK-011` | Global Chrome Suite | `SUPERSEDED` | `LOCK-N04` (New Luxury Chrome Suite) | Replaced by new header & footer. |

---

## Detailed Specifications of Locked Components

### 1. `BenefitsSection.tsx` (`LOCK-001`)
- **Visual Appearance:** Pure clean canvas, 6-card bento grid with 1px border (`var(--border)`).
- **Icon Hover Animation:**
  - Card translateY(-4px)
  - Icon wrapper transforms with `scale(1.12) rotate(4deg)`
  - Background transitions to solid brand Saffron Gold (`#E5A044`)
  - Icon stroke transitions from dark charcoal (`#1A1D20`) to pure white (`#FFFFFF`)
- **Forbidden Alterations:**
  - Do NOT change the 6 card value propositions.
  - Do NOT remove the coupon pill (`ASTTCAR500OFF`) on the Exciting Offers card.
  - Do NOT change the icon transition effect or colors without user authorization.

### 2. `ContactCard.tsx` (`LOCK-002`)
- **Visual Appearance:** 2-column architectural bento card (1.3fr contact details, 1fr form).
- **Corner Markers:** 4 corner plus crosses (`.corner-plus`) rotating 90° on hover via CSS matrix transform.
- **Inquiry Form:**
  - Interactive Name, Phone, and Trip Message fields.
  - Validation error shake animation (`.input-error`).
  - Simulated 600ms dispatch submission delay.
  - Floating auto-dismiss feedback toast with checkmark and close button.
  - In-card success state with direct WhatsApp pre-filled message deep link.
- **Forbidden Alterations:**
  - Do NOT remove or modify the corner plus crosses.
  - Do NOT remove verified NAP details (`+91 98765 43210`, `bookings@agraskbagheltourandtravels.com`, Taj Ganj live map link).
  - Do NOT strip the feedback toast or success card state.

### 3. `ReviewsMarquee.tsx` (`LOCK-003`)
- **Visual Appearance:** Dual opposing liquid glass marquee tracks (Row 1 scrolls left at 52s, Row 2 scrolls right at 56s).
- **Cards:** Glassmorphism surface, 5 gold Lucide star SVGs, verified traveler checkmark badge, and monogram avatar with smooth image fade-in.
- **Forbidden Alterations:**
  - Do NOT alter track scroll directions or remove pause-on-hover.
  - Do NOT remove avatar monogram fallback logic or edge-fade masks.

### 4. `Theme Tokens & Typography` (`LOCK-010`)
- **Clean White Light Mode:** Primary background `#FFFFFF`, alternate `#F8F9FA`, text `#1A1D20`, soft text `#5A626A`, border `#E8ECEF`, brand gold `#E5A044`.
- **Solar Dusk Dark Mode:** Primary background `#181615`, alternate `#201E1D`, surface `#242220`, border `#3D3936`, text `#FDFCFB`, soft text `#A8A29E`.
- **Forbidden Alterations:**
  - Do NOT introduce blue colors (navy, slate blue, indigo) or generic unbranded palettes.
  - Do NOT alter `--font-display: 'Fraunces', serif`, `--font-sans: 'DM Sans', sans-serif`, `--font-mono: 'DM Mono', monospace`.

---

## How to Request an Unlock or Modification

If a future phase task (e.g. backend wiring, marketing detail template, internationalization) appears to require changes to a locked item:
1. **Stop immediately before editing the code.**
2. **Present the proposed change to the user:**
   - Explain *what* needs to change.
   - Explain *why* the change is requested.
   - Show the exact proposed diff or preview.
3. **Wait for explicit user approval:**
   - If the user approves: update `DESIGN_LOCKS.md` with the new revision and proceed.
   - If the user declines: preserve the locked design intact and find an alternative non-destructive implementation.

---

## Amendment Log

### 2026-09-15 — Additive CSS completion (no locked design altered)

A frontend repair pass added `react/src/styles/ui-kit.css` and converted six
bare `<div>` page roots into `<main id="main-content">`. This was **purely
additive**: 17 undefined CSS custom properties were declared as aliases of the
locked LOCK-010 tokens, 87 undefined class names received their missing rules
(`.container`, `.page-hero*`, `.cta-banner-*`, `.faq-accordion-*`,
`.button-gold/secondary/block`, icon size contracts, …), and the 44–76px
campaign `h1` scale was **scoped to `.home-hero h1`** instead of applying to
every page.

Nothing in this pass re-themes, re-lays-out or restructures any locked
component. Specifically:

- `LOCK-001 … LOCK-009` — markup and class names untouched; only previously
  undefined helper classes used by their markup (`.container`, `.icon-call`,
  `.icon-wa`, `.sun`, `.moon`, `.section--paper*`, `.brand-compass-icon`,
  `.cinematic-puck-icon`, `.roll-label`, `.footer-col`) received definitions.
- `LOCK-010` — `tokens.css` and `DESIGN.md` were **not modified**. The new
  alias layer points at the locked values (`--primary: var(--gold)`,
  `--font-heading: var(--font-display)`, `--text-dim: var(--text-soft)`, …).
- `LOCK-011` — chrome components were not restructured; the new rules only
  size the icon spans and footer columns their existing markup already used.

Future edits to locked components still require the unlock protocol above.
See `react/docs/07_UI_REPAIR_REPORT.md` for the full root-cause analysis.

### 2026-10-23 — User-authorized homepage review readiness threshold

Per explicit user request, the `LOCK-N06` dual marquee keeps its approved
two-row opposing infinite animation, but its build-time data snapshot is empty
until at least 10 approved, consented, homepage-published reviews are available.
The admin review page reports progress toward that threshold. The client still
renders only the generated JSON snapshot and does not fetch reviews at runtime.
