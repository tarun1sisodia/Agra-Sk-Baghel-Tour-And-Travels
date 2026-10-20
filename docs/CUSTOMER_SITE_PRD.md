# Product Requirements Document (PRD) — Customer Portal (`react/`)
**Agra SK Baghel Tour & Travels — Ultra-Premium Chauffeur Taxi & Curated Tour Platform**

- **Document Version:** 2.0 (Authoritative 2026 Production Specification)
- **Status:** Implemented & Verified in Monorepo
- **Project Root:** `react/` (`tarun1sisodia/ArenaAI`)
- **Canonical Production Origin:** `https://agraskbagheltourandtravels.com`
- **Active Staging Origin:** `https://skbagheltravels-customer.coccoder999.workers.dev`
- **Local Development URL:** `http://localhost:5173`
- **Backend API Origin:** `https://skb-baghel-api-staging.onrender.com` / `http://localhost:4000`
- **Target Test Automation Engine:** TestSprite (E2E & UI Functional Test Generation)

---

## 1. Executive Summary & Product Vision

### 1.1 Product Vision
**Agra SK Baghel Tour & Travels** is a premier luxury mobility and curated travel service based in Agra, Uttar Pradesh. The platform serves as a high-converting, brand-authentic, zero-friction digital concierge for private chauffeur-driven intercity travel, monument tours, hourly local charters, and airport/station transfers across Agra, Mathura, Vrindavan, Delhi NCR, and the Golden Triangle (Agra–Delhi–Jaipur).

### 1.2 Operational Model Distinction
Per executive mandate, the customer portal operates as an authentic private boutique travel desk, **not** an on-demand ride-hailing app (like Uber or Ola).
- Every booking locks chauffeur and vehicle custody on the backend.
- Fares are 100% server-authoritative with transparent line-item breakdowns (base rate, km tariff, toll inclusion, driver allowance, night halt surcharge).
- Booking commitment is established via a **28% advance deposit token** paid through digital gateways (Razorpay/Cards/UPI), with the remaining **72% cash balance** collected directly by the chauffeur upon trip completion.
- Instant booking passes are delivered as branded A4 PDFs via Resend email and authenticated customer downloads (`GET /api/v1/bookings/:id/pdf`).

### 1.3 Key Performance & SEO Objectives
1. **Sub-Second Initial Load (SSG)**: 72 pre-rendered canonical HTML pages + 23 redirects generated during build time with Lighthouse scores ≥ 95.
2. **Hydration Reliability**: 100% DOM tree symmetry between SSG pre-render and client hydration (zero React Error #418), with `<CustomerAuthProvider>` and mounted client state in Header and Theme toggles.
3. **Decoupled Performance**: Homepage reviews marquee renders statically from `react/src/data/generated-published-reviews.json`, requiring zero runtime API calls on cold visits.
4. **Bilingual Parity**: Full English (`/`) and Hindi (`/hi/`) route mirrors with synchronized pricing, canonical links, and hreflang tags.
5. **Mobile-First Conversions**: Fluid responsive layouts across 320px, 375px, 768px, and 1280px+ viewports with minimum touch targets of 44x44px.

---

## 2. System Architecture & Entry Points

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER APPLICATION (react/)                   │
│   React 19 • Vite • React Router 7 • Tailwind CSS • Motion • Lucide    │
│   SSG Pre-render: 72 HTML Pages + 23 Redirects • Client Hydration      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Authoritative REST & JSON-LD
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       BACKEND API (backend/)                           │
│   Fastify 5 • Zod Validation • Server Fare Engine • @pdfme Generator   │
│   Pending Booking Auto-Expiry Worker (30m) • Razorpay Webhook Guard    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                   ┌─────────────────┴─────────────────┐
                   ▼                                   ▼
┌─────────────────────────────────────┐ ┌────────────────────────────────┐
│      PostgreSQL (Supabase)          │ │       External Gateways        │
│ Bookings • Catalog • Reviews Outbox │ │ Razorpay Gateway • Resend Mail │
└─────────────────────────────────────┘ └────────────────────────────────┘
```

### Primary Application Routes:
- `/` or `/index.html`: Luxury Homepage (Hero, corridor search, fleet showroom, static review marquee, 24/7 travel desk CTA).
- `/routes.html` / `/routes/:slug`: Outstation corridor catalog with 980+ point-to-point intercity routes.
- `/tours.html` / `/tours/:id`: Curated day and multi-day tour packages (Taj Sunrise, Golden Triangle, Mathura-Vrindavan).
- `/fleet.html`: Comprehensive fleet showroom (4 canonical groups + 25+ model presets).
- `/rentals.html`: Call-first rental quotation intake form.
- `/book.html` / `/booking`: Interactive 5-step booking funnel with 3s pre-checkout and 7s post-payment countdown overlays.
- `/booking/confirmation/:id` or `/booking-confirmation.html`: Confirmed reservation pass with branded PDF download (`#btn-download-pdf-voucher`).
- `/review/:token`: Verified customer review submission portal with star ratings and photo uploads.
- `/about.html`, `/contact.html`, `/faq.html`, `/terms.html`, `/privacy.html`: Static editorial and compliance pages.

---

## 3. Core User Journeys & Functional Specifications

### 3.1 KUJ-01: Five-Step Booking Funnel & Rate Calculation
**Path:** `/book.html` or `/booking`  
**Goal:** Convert customer route and travel intent into a locked server reservation with verified 28% deposit.

1. **Step 1 — Journey & Itinerary Configuration**:
   - **Trip Type**: Toggle between `One-Way` and `Round-Trip`.
   - **Origin & Destination**: Location input with LocationIQ autocomplete and curated Agra pickup presets (Taj Ganj, Cantt Station, Fatehabad Rd, Dayalbagh).
   - **Date & Pickup Time**: HTML5 date picker rejecting past dates; time picker supporting 24h format.
   - **Passenger & Luggage Counter**: Numeric inputs bounded by vehicle capacity.
   - **Validation**: "Next: Select Vehicle" remains disabled or surfaces inline validation if required fields are missing.
2. **Step 2 — Fleet Model Selection & Tariff Breakdown**:
   - Displays eligible vehicle cards filtered by passenger capacity (Sedan: up to 4; SUV: up to 6-7; Luxury: up to 4-6; Tempo Traveller: 10-17).
   - Ineligible vehicles are visibly disabled with "Exceeds Seating Capacity" badge.
   - Each card displays vehicle photo thumbnail, luggage capacity, and server-calculated tariff:
     - `Total Fare`: Base rate + distance tariff + tolls/taxes + driver allowance.
     - `Advance Due (28%)`: Deposit required today to lock vehicle custody.
     - `Balance Due to Chauffeur (72%)`: Cash amount payable directly to the driver on trip completion.
3. **Step 3 — Passenger Contact & Guest Token Continuity**:
   - Fields: Full Name, WhatsApp Mobile Number (+91 format), Email Address, Detailed Pickup Address / Landmark, Special Requests (child seat, luggage carrier, monument guide).
   - Generates or binds `x-guest-token` (UUIDv4) in browser `localStorage`, ensuring guest users can resume or retrieve booking details without upfront account registration.
4. **Step 4 — Commercial Review & Deposit Confirmation**:
   - Comprehensive fare summary showing line-item inclusions (Driver Allowance, Night Charge if between 22:00–06:00, GST, Tolls).
   - Displays clear policy notice: "24-Hour Free Cancellation & Full Deposit Refund Guarantee".
   - Primary Action: Click "Proceed to Secure Payment".

### 3.2 KUJ-02: Pre-Checkout 3-Second Bank-Grade Encryption Overlay
**Component:** `BookingPaymentCountdownModal.tsx` (`stage="preparing_checkout"`)  
**Trigger:** Customer clicks "Proceed to Secure Payment" on Step 4 of the booking form.

- **Modal Presentation**: Fullscreen modal dialog (`role="dialog"`, `aria-modal="true"`) with dark backdrop blur (`backdrop-blur-md`).
- **Circular Animated Countdown**:
  - 3-second auto-decrementing timer with smooth SVG circular progress stroke (`stroke-primary`).
  - Centered countdown number displaying `3` ➔ `2` ➔ `1` ➔ `✓` (Ready).
- **Security Trust Badges & Header**:
  - Badge: `ShieldCheck` icon + `BANK-GRADE ENCRYPTION` (mono uppercase).
  - Heading: `Launching Payment Gateway`.
  - Body: `Opening Razorpay in Xs. Please keep this window open to complete your reservation.`
- **Real-Time Step Checkpoints**:
  1. `[✓] Vehicle allocation locked on server`
  2. `[✓] 28% advance deposit invoice generated` (Activates when ≤ 2s)
  3. `[✓] Launching secure Razorpay portal` (Activates when ≤ 1s)
- **Advance Due Display**: Displays `Advance Due Today (28%): ₹X,XXX`.
- **User Actions**:
  - Auto-triggers Razorpay checkout modal upon timer completion (3.0 seconds).
  - Dismiss Action: "Cancel and return to form" button dismisses overlay without triggering gateway.

### 3.3 KUJ-03: Post-Payment 7-Second Dispatch Verification Overlay
**Component:** `BookingPaymentCountdownModal.tsx` (`stage="verifying_payment"`)  
**Trigger:** Razorpay payment callback is received and verified by customer browser.

- **Modal Presentation**: Fullscreen modal dialog with emerald ambient glow (`bg-emerald-500`).
- **Circular Animated Countdown**:
  - 7-second auto-decrementing timer with SVG progress stroke (`stroke-emerald-500`).
  - Centered countdown number displaying `7` ➔ `6` ➔ ... ➔ `1` ➔ `✓`.
- **Verification Header**:
  - Badge: `CheckCircle2` icon + `PAYMENT RECEIVED` (mono uppercase).
  - Heading: `Reservation Confirmed!`.
  - Body: `Confirming with Agra dispatch and issuing your ticket pass in Xs…`.
- **Automated Dispatch Checkpoints**:
  1. `[✓] Digital payment signature verified`
  2. `[✓] Vehicle and chauffeur schedule assigned` (Activates when ≤ 4s)
  3. `[✓] Generating official PDF booking pass & SMS` (Activates when ≤ 2s)
- **Booking Reference**: Displays `Booking Reference: AGR-YYYYMMDD-XXXX`.
- **Immediate Action**: "Click here to view confirmation now" button allows instant bypass to `/booking/confirmation/:id`.

### 3.4 KUJ-04: Booking Confirmation & Branded PDF Voucher Download
**Path:** `/booking/confirmation/:id` or `/booking-confirmation.html?id=AGR-YYYYMMDD-XXXX`  
**Component:** `BookingConfirmationPage.tsx`  
**Backend Route:** `GET /api/v1/bookings/:id/pdf`

- **Status Banner**:
  - `Paid & Confirmed`: Emerald card displaying Ticket ID (`AGR-YYYYMMDD-XXXX`), "Booking Confirmed & Guaranteed", and confirmation that 28% deposit was received.
  - `Polling Verification`: If payment is in flight, shows animated spinner `Verifying…` (polls up to 6 cycles / 15 seconds).
- **Branded PDF Voucher Download Button**:
  - **Selector / ID**: `id="btn-download-pdf-voucher"`
  - **Initial State**: Icon `<Download />` + "Download PDF Voucher".
  - **Loading State**: Icon `<RefreshCw className="animate-spin" />` + "Generating PDF…", button disabled.
  - **Error Handling**: Displays dismissible amber error alert if network or token fails, with "Dismiss" button.
  - **Download Execution**: Fetches binary PDF from backend, downloads `${ticketId}-confirmation-voucher.pdf` with `%PDF` header.
- **Voucher Layout & Content**:
  - Header: SK Baghel Luxury branding (`#8B2E0B` Terracotta), Ticket ID, booking timestamp.
  - Passenger & Journey: Customer Name, Phone, Pickup Address, Drop Address, Scheduled Date & IST Time.
  - Vehicle & Chauffeur: Assigned Vehicle Model (e.g. Toyota Innova Crysta), Luggage capacity, 2-Hour Chauffeur Dispatch Protocol notice.
  - Financial Ledger: Total Guaranteed Fare, Advance Paid Online (28%), Balance Due in Cash to Chauffeur (72%).
  - 24/7 Operations Desk Hotline & WhatsApp contact.
- **Secondary Actions**:
  - "Print Voucher" button (`window.print()`).
  - "Contact Travel Desk via WhatsApp" button pre-populating message with Ticket ID.

### 3.5 KUJ-05: 30-Minute Pending Booking Auto-Expiry
**Backend Worker:** Active interval worker running every 60 seconds.

- Any booking created in `pending_payment` or `pending` status that does not receive a verified payment webhook or manual desk confirmation within 30 minutes is automatically expired.
- State transitions to `cancelled` with audit note: `Auto-expired after 30 minutes of payment inactivity`.
- Customer attempting to pay for an expired booking receives a clean error modal prompting them to recalculate current live rates.

### 3.6 KUJ-06: Static Review Snapshot & Verified Customer Review Submission
**Components:** `ReviewsMarquee.tsx`, `ReviewPage.tsx` (`/review/:token` or `/review?token=...`)

1. **Static Homepage Review Marquee**:
   - Zero runtime API dependency: Built from `react/src/data/generated-published-reviews.json` during SSG pre-render.
   - Displays customer testimonials with verified badges, 5-star rating icons, travel route, and reviewer photo/avatar.
   - Fully accessible with CSS marquee pause on hover or keyboard focus, respecting `prefers-reduced-motion`.
2. **Verified Customer Review Submission Flow (`/review/:token`)**:
   - Customer opens review invitation URL generated by Admin Review Studio.
   - Automatically validates invitation token, pre-filling:
     - Customer Name
     - Booking Reference Ticket ID
     - Chauffeur Name
     - Tour / Route Name
   - Interactive Form:
     - Star Rating selector (1 to 5 stars with hover preview).
     - Review Title & Detailed Experience text area.
     - Optional travel photo attachment.
     - Submission triggers backend review moderation queue, immediately returning a success banner.

### 3.7 KUJ-07: Extended Fleet Showroom & Model Presets
**Path:** `/fleet.html`  
**Component:** `FleetPage.tsx`, `FleetSection.tsx`

- Organized into 4 canonical fleet groups:
  1. **Executive Sedans**: Maruti Dzire, Honda Amaze, Skoda Slavia, Toyota Belta (4 Passengers, 2-3 Bags).
  2. **Family SUVs & MUVs**: Maruti Ertiga Hybrid, Toyota Innova Crysta, Toyota Fortuner, Mahindra XUV700 (6-7 Passengers, 3-4 Bags).
  3. **Ultra-Luxury VIP**: Toyota Camry Hybrid, Toyota Vellfire Lounge, Mercedes E-Class (4-6 Passengers, Luxury Leather Recliners).
  4. **Tempo Travellers & Mini-Coaches**: Force Traveller 12-17 Seater, Force Urbania VIP 13-Seater (10-17 Passengers, 8-12 Bags).
- High-Resolution Dimensional Assets: All vehicles use organized, dimensionally named images in `/assets/fleet/` with zero missing image fallbacks.
- "Available Makes & Custom Models" extended showroom grid featuring 12 individual vehicle profiles with luggage/seat specifications and direct WhatsApp inquiry CTA.

### 3.8 KUJ-08: Call-First Taxi Rental Intake
**Path:** `/rentals.html`  
**Component:** `RentalPage.tsx`

- Captures custom charter quotes for complex multi-day or corporate travel.
- Vehicle resolver recognizes 18 distinct vehicle models.
- Form inputs: Selected Vehicle Class, Specific Model preference, Pickup Date, Return Date, Passenger Count, Chauffeur Included toggle, Pickup Location in Agra, and Customer Phone.
- Submissions create actionable leads on Admin Rental Desk (`/rental-requests`).

---

## 4. TestSprite Acceptance & UI Assertion Matrix

| ID | Test Scenario | Expected UI Selector / Action | Pass Criteria |
|---|---|---|---|
| **TS-CUS-01** | Homepage Brand & Navigation | `header nav a[href="/routes.html"]` | Page loads with zero console errors; navigates cleanly to Routes catalog. |
| **TS-CUS-02** | English to Hindi Localization | Language toggle button in Header | URL switches between `/` and `/hi/`; copy translates with exact fare parity. |
| **TS-CUS-03** | Step 1 Booking Validation | Form submission with empty origin/date | Step 1 remains active; inline validation alerts highlight missing required fields. |
| **TS-CUS-04** | Passenger Capacity Guard | Set passenger counter to 6 | Sedan cards become disabled with "Exceeds Seating Capacity"; SUV/Tempo cards remain selectable. |
| **TS-CUS-05** | Server-Authoritative Fare Quote | Select vehicle in Step 2 | Summary displays Total Fare, 28% Advance Due, and 72% Driver Cash Balance. |
| **TS-CUS-06** | 3-Second Pre-Checkout Overlay | Click "Proceed to Secure Payment" | `BookingPaymentCountdownModal` opens with 3s timer, `BANK-GRADE ENCRYPTION` badge, and auto-launches gateway. |
| **TS-CUS-07** | Pre-Checkout Dismissal | Click "Cancel and return to form" | Modal closes immediately; user returns to Step 4 without payment execution. |
| **TS-CUS-08** | 7-Second Post-Payment Overlay | Verify payment callback | Modal displays emerald progress circle, 7s countdown, and Ticket ID. |
| **TS-CUS-09** | Confirmation Page Status | Navigate to `/booking/confirmation/:id` | Status banner displays `Booking Confirmed & Guaranteed` with verified ticket ID. |
| **TS-CUS-10** | PDF Voucher Download | Click `#btn-download-pdf-voucher` | Button shows "Generating PDF…"; browser downloads binary `.pdf` file with valid content. |
| **TS-CUS-11** | Static Reviews Marquee | Inspect DOM of `/` | Marquee renders directly from static JSON snapshot with zero network calls to `/api/v1/public/reviews`. |
| **TS-CUS-12** | Verified Review Submission | Open `/review/:token` and submit 5 stars | Form pre-populates ticket details; submission displays success acknowledgment. |
| **TS-CUS-13** | Fleet Showroom Image Integrity | Inspect `/fleet.html` images | All vehicle images return 200 OK with no fallback broken icons. |
| **TS-CUS-14** | Responsive Mobile Layout | Viewport 375x667 | Zero horizontal scrollbar; touch targets ≥ 44px; mobile navigation drawer functional. |
| **TS-CUS-15** | SSR Hydration Symmetry | Page load inspection | Zero React Error #418; theme toggle and header user menu mount seamlessly without layout shifts. |

---

## 5. Non-Functional & Security Requirements

1. **Zero Secret Leakage**: Public client bundles (`react/dist`) must never contain `DATABASE_URL`, `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or `RESEND_API_KEY`. Enforced by CI build scanners.
2. **Guest Token Privacy**: `x-guest-token` is stored exclusively in client `localStorage` and sent via HTTP headers for booking continuity. It never contains plain customer PII.
3. **Accessibility Standards**: WCAG 2.1 AA compliance:
   - Color contrast ratio ≥ 4.5:1 against luxury background tokens (`#8B2E0B`, `#1A1A1A`, `#FBF9F5`).
   - Visible keyboard focus rings on all interactive buttons, inputs, and links.
   - Screen-reader accessible labels (`aria-label`, `aria-modal`, `role="dialog"`).
   - Strict `prefers-reduced-motion` compliance across all CSS and Motion transitions.
4. **Resilient Fallbacks**: If Razorpay gateway encounters transient timeouts, the booking remains in `pending_payment` allowing resumption via `/booking/confirmation/:id` or payment recovery links.