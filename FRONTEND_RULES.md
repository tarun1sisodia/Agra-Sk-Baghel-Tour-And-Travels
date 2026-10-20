# Master Frontend Operating Rules & Architectural Standard — SK Baghel Tour & Travels

**Document Version:** 2.0.0 (Updated for production codebase)  
**Authority:** Single Source of Truth for all Frontend Engineering, Design System, Typography, Component Architecture, State Management, and SSG.  
**Target Applications:** `react/` (Customer Experience Site) · `admin/` (Operations Desk).  
**Applies To:** All AI agents, frontend developers, and UI/UX engineers.

---

## 1. Executive Summary & Purpose

This document is the **single authoritative operating standard** for the SK Baghel Tour & Travels frontend monorepo. It defines architectural boundaries, design tokens, typography scale, component blueprints, SSG requirements, and backend integration protocols.

### Core Philosophy

1. **Restrained Luxury Aesthetic:** Design inspired by premium heritage travel. Warm sandstone surfaces, authentic terracotta pigments, deep ink neutrals, subtle gold accents. Never use loud or generic colors.
2. **Harmonious Typography:** Hero headlines use EB Garamond (26px desktop, 20px mobile — never larger). Body copy uses Plus Jakarta Sans (9.5px–12px compact metadata). Never create ballooned or shouting text.
3. **Design Token Supremacy:** Every color, font size, spacing, and border-radius is derived from `@theme` tokens in `react/src/styles/theme.css`. This is a **TailwindCSS v4** project (`@import "tailwindcss"` + `@theme {}` block). Never use hardcoded color values.
4. **Server-Authoritative Fares:** The frontend shows fare estimates for UX, but financial authority belongs to `backend/modules/fare-engine/`. Client never submits totals as truth.
5. **SSG Pre-rendering:** All 31 customer pages pre-render to static HTML at build time. Dynamic data hydrates after page load.
6. **No Scroll Hijacking:** Preserve native browser scrolling. Never intercept wheel events or alter scroll inertia.

---

## 2. Document Registry & Precedence

| Priority | Document | Path | Scope |
|:---:|---|---|---|
| **1** | `FRONTEND_RULES.md` | Root | **Supreme frontend law** |
| **2** | `docs/project/DESIGN_LOCKS.md` | `docs/project/` | Locked components — NEVER modify without permission |
| **3** | `docs/project/DESIGN.md` | `docs/project/` | Visual tokens, palette, typography spec |
| **4** | `docs/project/ANIMATION_RULES.md` | `docs/project/` | Animation constraints and accessibility |
| **5** | `docs/project/CLIENT_CONFIRMATION_FARES_AND_RULES.md` | `docs/project/` | Client-agreed fare rules & pricing |
| **6** | `docs/PAYMENT_SYSTEM.md` | `docs/` | Razorpay 28% advance checkout flow |
| **7** | `BACKEND_RULES.md` | Root | Backend API contracts |

---

## 3. The 10 Golden Laws of the Frontend

### Law 1: Design Token Invariance

- **All** styles must use tokens from `react/src/styles/theme.css` (`@theme` block).
- This project uses **TailwindCSS v4** — `@theme` defines custom Tailwind utilities automatically.
- Use named tokens: `text-primary`, `bg-surface`, `bg-sandstone-wash`, `text-ink-charcoal`, `border-border-warm`, `text-success-jade`, etc.
- Never hardcode hex values in component classes or inline styles.
- Additional global styles live in `react/src/styles/global.css` (large utility stylesheet) and `react/src/styles/heritage-animations.css`.

### Law 2: Refined Editorial Typography Hierarchy

**Headings — EB Garamond (serif):**

| Token | Size (desktop) | Size (mobile) | Line-height | Usage |
|---|---|---|---|---|
| `font-headline-hero text-headline-hero` | 26px | 20px | 34px / 26px | Page `<h1>` Hero |
| `font-headline-lg text-headline-lg` | 20px | 17px | 26px / 22px | Section `<h2>` |
| `font-headline-md text-headline-md` | 15px | 15px | 20px | Card `<h3>` |
| `font-headline-sm text-headline-sm` | 13.5px | 13.5px | 18px | Sub-headings |
| `font-price-display text-price-display` | 18px | 18px | 22px | Currency figures |

**Body — Plus Jakarta Sans:**

| Token | Size | Line-height | Usage |
|---|---|---|---|
| `font-body-lg text-body-lg` | 12px | 18px | Hero lead paragraphs |
| `font-body-md text-body-md` | 10.5px | 16px | Standard descriptions |
| `font-body-sm text-body-sm` | 9.5px | 14px | Specs, captions, itinerary |
| `font-label-lg text-label-lg` | 10px | 14px | Buttons, primary links |
| `font-label-caps text-label-caps` | 8.5px | 11px | Category pills, status badges (uppercase) |

**Hard rules:**
- Hero `<h1>` NEVER exceeds 26px desktop / 20px mobile.
- No font-size above 26px anywhere on any page.

### Law 3: Financial & Fare Display Precision

- Display the **28% advance deposit guarantee** formula:
  ```
  advanceAmount = max(500, round(totalFare × 0.28 / 100) × 100)
  ```
- Show transparent breakdown tags: *Yamuna Toll Included*, *GST Invoice Available*, *Zero Return Surcharge*.
- Currency figures in Indian notation: `₹3,499`, `₹12,500` via `.toLocaleString("en-IN")`.
- Client-side fare logic lives in `react/src/fares.ts` (display estimates only). Server recalculates all totals authoritatively.

### Law 4: SSG Pre-rendering & Hydration Hygiene

- All 31 public customer pages pre-render to static HTML during `npm --prefix react run build`.
- Never access `window`, `document`, or `localStorage` during initial render — wrap in `useEffect` or state guards.
- Each pre-rendered page must have: `<title>`, `<meta name="description">`, OpenGraph tags, canonical URL, and Schema.org JSON-LD where applicable.

### Law 5: Component Architecture & Source Layout

```
react/src/
├── pages/                        # 31 page components (thin orchestrators)
├── components/
│   ├── chrome/                   # Header, navigation, mobile drawer
│   ├── layout/                   # Page layout wrappers
│   ├── home/                     # Homepage-specific components
│   ├── catalog/                  # Route/package/transfer catalog cards
│   ├── routes/                   # Outstation route components
│   ├── search/                   # Booking search/fare dock
│   ├── seo/                      # SEO meta components
│   ├── ui/                       # Generic UI primitives
│   ├── icons/                    # SVG icon components
│   ├── avatar/                   # User avatar components
│   ├── badges.tsx                # Status badge components
│   ├── cards.tsx                 # Reusable card shells
│   └── reveal.tsx                # Scroll-reveal animation wrapper
├── features/                     # Feature-level composite components
├── layouts/                      # Route layout wrappers
├── auth/                         # Supabase Auth + Google OAuth integration
├── hooks/                        # Custom React hooks
├── services/                     # API client functions (fetch wrappers)
├── lib/                          # Utility libraries
├── utils/                        # Helper functions
├── templates/                    # Email/voucher templates
├── data/                         # Static data modules
├── data.ts                       # Large static vehicle/route data file (~54KB)
├── fares.ts                      # Client-side fare display calculator (~13KB)
├── config.ts                     # Frontend config constants
├── contracts/                    # Shared Zod schemas (synced with backend/contracts/)
├── styles/
│   ├── theme.css                 # TailwindCSS v4 @theme tokens (CANONICAL)
│   ├── global.css                # Global utility classes (~307KB)
│   ├── heritage-animations.css   # Animation definitions
│   ├── rental.css                # Rental page specific styles
│   └── tokens.css                # Additional design tokens
└── app/                          # React Router configuration
```

**Admin panel** lives independently in `admin/src/` with its own Vite config, entry, and `admin/dist/` build output.

### Law 6: Mobile-First Ergonomics

- Minimum touch target: 44×44px (or accessible hit-slop padding).
- Sticky bottom booking bar on mobile for route/package detail pages.
- Horizontal filter scrollbars hidden with `overflow-x-auto no-scrollbar` + swipe support.

### Law 7: Accessible High-Contrast (WCAG AA)

- Text contrast must exceed 4.5:1 against its background.
- On Ivory/Surface (`#FDF8F5`): Use `text-ink-charcoal` (`#181D27`) or `text-primary` (`#9F3C16`).
- On Dark Midnight (`#0F131A`): Use `text-ivory-surface` (`#FDF8F5`) or `text-terracotta-sunlit` (`#D97746`).
- **Special:** `terracotta-deep` (`#B4502A`) — use instead of `#C85A32` on white (WCAG AA compliant at 5.10:1).
- **Special:** `gold-bronze` (`#8C5E14`) — use instead of `#D99A3E` for small text on light surfaces (5.12:1).
- Every page has exactly **one `<h1>`**. All interactive elements carry descriptive `aria-label` attributes.

### Law 8: Subtle Motion & Native Scroll Preservation

- Transitions use **only** `opacity` and `transform` properties.
- Duration: 150ms–300ms, `ease-out`.
- Never hijack wheel scroll speed or alter native inertia.
- Honour `prefers-reduced-motion` for all animations.
- Animation definitions live in `react/src/styles/heritage-animations.css` — consult `docs/project/ANIMATION_RULES.md` before adding animations.

### Law 9: Strict Monorepo Separation & Secret Safety

- `react/` and `admin/` have independent Vite configs, entry points, and build artifacts.
- **Public builds must NEVER contain:** backend secrets, Supabase service-role keys, Razorpay secrets, or payment private keys.
- Only public keys are permitted: `VITE_RAZORPAY_KEY_ID`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`.

### Law 10: Verification Gate

No change is complete without passing:
```bash
npm run verify    # typecheck x3 + backend tests + build x3
```

Individual app checks:
```bash
npm --prefix react run typecheck
npm --prefix react run build
npm --prefix admin run typecheck
npm --prefix admin run build
```

---

## 4. Color Palette Reference

```
Primary Terracotta:    #9F3C16  (Buttons, active states, key accents)
Terracotta Deep:       #B4502A  (White-text badges — WCAG AA on white: 5.10:1)
Terracotta Sandstone:  #C85A32  (Highlighted serif text — do NOT use for white text)
Sunlit Terracotta:     #D97746  (Warm accents on dark surfaces)
Gold Accent:           #D99A3E  (Ratings, stars — large text only)
Gold Bronze:           #8C5E14  (Small gold text on light bg — WCAG AA: 5.12:1)
Success Jade:          #2D6A4F  (Verified status, 28% advance pill, WhatsApp green)
Ink Midnight:          #0F131A  (Hero dark underlays)
Ink Charcoal:          #181D27  (Primary high-contrast text)
Ink Slate:             #252B37  (Secondary dark text)
Ivory Surface:         #FDF8F5  (Main page background)
Sandstone Wash:        #F5EBE1  (Card backgrounds, tag containers)
Border Warm:           #E9DFD5  (Card outlines, dividers)
Surface Low:           #F8F3F0  (Subtle section backgrounds)
```

---

## 5. Card & Section Dimension Standards

- **Card padding:** `p-3.5 sm:p-4` — never `p-6` or `p-8` (causes oversized cards).
- **Grid gaps:** `gap-3 sm:gap-4` or `gap-4 sm:gap-5`.
- **Card images:**
  - Vehicle showroom: `min-h-[190px] sm:min-h-[220px] lg:min-h-[260px]`
  - Package catalog: `h-44 sm:h-48`
  - Service banners: `min-h-[190px] lg:min-h-[260px]`
- **CTA buttons:** `px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs`
- **Max content width:** `max-w-[1280px] mx-auto`
- **Horizontal margins:** `px-margin-mobile` (mobile) / `px-margin` (desktop, `lg:`)

---

## 6. Pages Inventory (31 Pages)

| Page | File | Route |
|---|---|---|
| Home | `HomePage.tsx` | `/` |
| Fleet | `FleetPage.tsx` | `/fleet` |
| Packages | `PackagesPage.tsx` | `/packages` |
| Routes | `RoutesPage.tsx` | `/routes` |
| Services | `ServicesPage.tsx` | `/services` |
| Rental | `RentalPage.tsx` | `/rental` |
| About | `AboutPage.tsx` | `/about` |
| Contact | `ContactPage.tsx` | `/contact` |
| FAQ | `FaqPage.tsx` | `/faq` |
| Terms | `TermsPage.tsx` | `/terms` |
| Privacy | `PrivacyPage.tsx` | `/privacy` |
| Vehicle Detail | `VehicleDetailPage.tsx` | `/fleet/:slug` |
| Route Detail | `RouteDetailPage.tsx` | `/routes/:slug` |
| Transfer Detail | `TransferDetailPage.tsx` | `/transfer/:slug` |
| Package Detail | `PackageDetailPage.tsx` | `/packages/:slug` |
| Live Package Detail | `LivePackageDetailPage.tsx` | `/packages/live/:slug` |
| Local Package Detail | `LocalPackageDetailPage.tsx` | `/local/:slug` |
| Dossier Tour | `DossierTourPackagePage.tsx` | `/tour/:slug` |
| Dynamic Package | `DynamicPackageDetailPage.tsx` | dynamic |
| Product Detail | `ProductDetailPage.tsx` | `/product/:slug` |
| Monument Detail | `MonumentDetailPage.tsx` | `/monuments/:slug` |
| Monuments | `MonumentsPage.tsx` | `/monuments` |
| Booking Confirmation | `BookingConfirmationPage.tsx` | `/booking/confirmed` |
| Payment Resume | `PaymentResumePage.tsx` | `/payment/resume` |
| My Bookings | `MyBookingsPage.tsx` | `/my-bookings` |
| Review | `ReviewPage.tsx` | `/review/:token` |
| Login | `LoginPage.tsx` | `/login` |
| Auth Callback | `AuthCallbackPage.tsx` | `/auth/callback` |
| SEO Landing | `SeoLandingPage.tsx` | `/taxi/:route` |
| Marketing | `MarketingPage.tsx` | `/m/:slug` |
| 404 | `NotFoundPage.tsx` | `*` |

---

## 7. Auth Architecture

Authentication uses **Supabase Auth + Google OAuth**:
- `react/src/auth/` — auth context, hooks, protected route wrappers.
- Google Sign-In OAuth flow via Supabase with redirect to `/auth/callback`.
- Guest bookings allowed (no login required by default — controlled by `CUSTOMER_AUTH_REQUIRED_FOR_NEW_BOOKINGS` backend env).
- Admin panel uses Supabase Auth with `user_role` check (must be `super_admin` or `dispatcher`).

---

## 8. Frontend → Backend Integration

```
VITE_API_BASE_URL=/api/v1   (proxied to http://localhost:4000 in dev)
```

### Booking Flow
```
1. User enters trip details → POST /api/v1/fares/calculate (preview)
2. User submits form → POST /api/v1/bookings/draft
   ← { ticketId, guestAccessToken, advanceAmount, totalFare }
3. POST /api/v1/payments/create-order (ticketId + guestAccessToken)
   ← { razorpayOrderId, keyId, amount }
4. Razorpay checkout opens
5. Payment complete → Browser polls GET /api/v1/bookings/:ticketId
   until status === 'paid_confirmed'
6. Redirect to /booking/confirmed?ticketId=...
```

### Key Frontend Env Vars
```bash
VITE_API_BASE_URL=https://sk-baghel-backend.onrender.com
VITE_RAZORPAY_KEY_ID=rzp_live_...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_CLIENT_ID=...
```

---

## 9. Design Lock Compliance

**Before modifying any existing component**, check [`docs/project/DESIGN_LOCKS.md`](docs/project/DESIGN_LOCKS.md).

- `LOCKED` components must **not** be modified, restyled, or overridden without explicit user permission.
- If a task touches a locked component, STOP and ask first.
- If not locked, proceed normally.

---

## 10. Developer Hygiene Checklist

Before completing any frontend task:

1. ✅ No locked component from `DESIGN_LOCKS.md` was altered without permission.
2. ✅ No headline font exceeds 26px desktop / 20px mobile.
3. ✅ No hardcoded hex colors — only design tokens.
4. ✅ Native scrolling unaffected (no wheel event listeners, no overflow locking).
5. ✅ All new routes added to pre-render script if they need SSG.
6. ✅ `npm --prefix react run typecheck` passes.
7. ✅ `npm --prefix react run build` succeeds.
8. ✅ `npm run verify` passes (all 3 apps).

---

## References

- [`docs/project/DESIGN.md`](docs/project/DESIGN.md) — Visual tokens & typography spec
- [`docs/project/DESIGN_LOCKS.md`](docs/project/DESIGN_LOCKS.md) — Locked components registry
- [`docs/project/ANIMATION_RULES.md`](docs/project/ANIMATION_RULES.md) — Animation constraints
- [`docs/project/CLIENT_CONFIRMATION_FARES_AND_RULES.md`](docs/project/CLIENT_CONFIRMATION_FARES_AND_RULES.md) — Client-agreed fare rules
- [`docs/CUSTOMER_SITE_PRD.md`](docs/CUSTOMER_SITE_PRD.md) — Customer site PRD
- [`docs/admin/ADMIN_PRD.md`](docs/admin/ADMIN_PRD.md) — Admin PRD
- [`docs/PAYMENT_SYSTEM.md`](docs/PAYMENT_SYSTEM.md) — Razorpay payment spec
- [`BACKEND_RULES.md`](BACKEND_RULES.md) — Backend API contracts
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Deployment config
