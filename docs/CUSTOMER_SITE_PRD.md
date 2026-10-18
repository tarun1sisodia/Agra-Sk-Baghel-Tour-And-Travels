**Product Requirements Document (PRD)**  
**Customer Site (`react/`) — SK Baghel Tour & Travels**  
**Version:** 1.0  
**Date:** 2024-06-15  
**Monorepo:** `tarun1sisodia/ArenaAI`  
**Product:** *SK Baghel Luxe — Ultra-Premium Chauffeur Taxi & Curated Tour Platform*  
**Owner:** Principal Product Architect & Frontend Engineering Lead  

---

## 1. Document Overview, Vision & Target Audience

### 1.1 Vision  
To establish SK Baghel as the *definitive luxury mobility and curated travel experience* for North India — where seamless, transparent, and human-centric service meets world-class operational rigor. The customer site must function as a **conversion-optimized, brand-authentic, zero-friction digital concierge** for Agra, the Golden Triangle, and 963 outstation corridors.

### 1.2 Strategic Objectives  
- Achieve ≥ 68% mobile-first conversion rate (from landing to booking confirmation).  
- Maintain < 1.2s TTFB on all critical pages (SSG-optimized).  
- Ensure 100% fare accuracy via server-authoritative pricing (no client-side fallback).  
- Deliver end-to-end guest-to-registered-user continuity via `x-guest-token`.  
- Support bilingual (EN/HI) content with zero layout shift or SEO dilution.

### 1.3 Target Audience  
| Segment | Profile | Key Needs |
|--------|---------|-----------|
| **Luxury Leisure Traveler** | High-income (₹25L+ annual), 30–55, seeks curated experiences (Taj, temples, heritage) | Trust, transparency, comfort, no hidden costs |
| **Business Traveler** | Corporate, frequent traveler (Agra-Delhi-Jaipur loop), time-sensitive | Reliability, punctuality, professional chauffeurs, invoice-ready vouchers |
| **Family Group** | 4–8 pax, multi-city itineraries (e.g., Agra→Jaipur→Delhi) | Vehicle capacity, child safety, driver assistance, flexible timing |
| **Religious Pilgrim** | Devotees visiting Mathura, Vrindavan, Ayodhya, etc. | Cultural sensitivity, punctuality for rituals, clean vehicles |

---

## 2. Core User Personas & Key User Journeys

### 2.1 Personas  
- **Priya (38, Mumbai)**: Planning a 3-day Golden Triangle trip. Values *visual storytelling*, fare clarity, and instant confirmation.  
- **Rahul (42, Delhi)**: Frequent Agra business traveler. Prioritizes *reliability*, invoice generation, and seamless airport transfers.  
- **Ananya (29, Bangalore)**: Solo traveler booking Same Day Taj. Needs *one-click booking*, no signup friction, and real-time tracking.

### 2.2 Key User Journeys (KUJs)  
| Journey | Steps | Success Metric |
|--------|-------|----------------|
| **Route Booking (Outstation)** | 1. Enter origin/destination → 2. Select date/time → 3. Choose vehicle → 4. Review fare → 5. Guest checkout → 6. Pay 28% → 7. Receive voucher | ≥ 68% completion rate; < 15s avg. time-to-book |
| **Tour Package Booking** | 1. Browse packages → 2. Select (e.g., *Taj Sunrise*) → 3. Add pax → 4. Confirm itinerary → 5. Pay deposit → 6. Get itinerary PDF | ≥ 72% conversion from package detail page |
| **Post-Booking Management** | 1. Access `/my-bookings` via email link → 2. View/modify/cancel (if allowed) → 3. Track trip → 4. Rate post-trip | ≥ 40% of users revisit post-booking |
| **Payment Resume Flow** | 1. Payment fails → 2. Redirect to `/payment/resume/{token}` → 3. Re-attempt → 4. Auto-resume voucher dispatch | < 2% drop-off on resume; 100% voucher delivery post-payment |

---

## 3. Comprehensive Feature & Functional Requirements

### 3.1 Homepage & Discovery Engine  
- **Corridor Search**:  
  - Autocomplete with 963 routes (debounced, server-side).  
  - Popular routes (Agra–Delhi, Delhi–Jaipur, Agra–Jaipur) highlighted with *“Most Booked”* badges.  
  - Filter by corridor (e.g., *“Agra Corridor”*, *“Golden Triangle”*).  
- **Tour Packages Carousel**:  
  - 13 static + 4 dynamic CMS packages (lazy-loaded, 3D flip animation on hover).  
  - Each package includes: duration, inclusions (e.g., *“Entry tickets + guide”*), vehicle recommendation, and *“Similar Routes”* CTA.  
- **Hero Section**:  
  - Dynamic A/B-tested CTA: *“Book Taj Sunrise Tour”* or *“Agra to Delhi in 3.5 hrs”*.  
  - Schema.org `TaxiService` JSON-LD embedded in SSR payload.

### 3.2 Route Catalog & Dynamic Corridor Details  
- **Route Detail Page (`/routes/:id`)**:  
  - Route map (static SVG, no external JS), distance, duration, tolls, state taxes.  
  - Fare breakdown: Base fare + (km × rate) + tolls + night allowance (if applicable).  
  - *“Frequently Booked Together”* section (e.g., *Agra–Delhi* + *Taj Sightseeing*).  
- **Corridor Explorer**:  
  - Interactive map (Leaflet-based, lightweight) showing 12 corridors.  
  - Clickable corridor cards → filter routes by origin/destination.

### 3.3 Tour Packages & Local Sightseeing Engine  
- **Package Detail Page (`/tours/:id`)**:  
  - Itinerary grid (time, activity, location), vehicle compatibility, max pax.  
  - *“Customize”* button to add extra stops (e.g., *Baby Taj* to *Taj Sunrise*).  
- **Local Sightseeing**:  
  - 5 packages (e.g., *Taj Sightseeing*, *Agra Fort & Taj*) with time-based pricing (4H/6H/8H).  
  - Real-time availability check (server-side, 200ms SLA).

### 3.4 Vehicle Fleet Matrix & Specification Comparison  
- **Fleet Tier Cards**:  
  - Sedan (Dzire/Etios), Ertiga, Innova Crysta, Tempo Traveller (9–26 seater), Force Urbania.  
  - Each card shows: luggage capacity, AC/non-AC, child seat availability, base fare/km.  
- **Comparison Table**:  
  - Toggle between *“Luxury”* (Innova Crysta, Urbania) and *“Economy”* (Sedan, Ertiga).  
  - *“Best for Families”* / *“Best for Business”* badges.

### 3.5 Clean Fare Calculation & Transparent Tariff Engine  
- **Fare Engine Contract (Server-Only)**:  
  ```ts
  interface FareCalculation {
    baseFare: number;
    perKmRate: number;
    distanceKm: number;
    nightAllowance: number; // 22:00–05:00
    tollCharges: number;
    stateTax: number; // 5% GST
    driverAllowance: number;
    totalFare: number;
    advanceDue: number; // 28% of totalFare
  }
  ```
- **Client-Side Display**:  
  - Real-time fare update on date/time/vehicle change.  
  - *“Fare Includes”* tooltip: *“Driver allowance, tolls, GST, night charge (if applicable)”*.  
  - *“No Hidden Charges”* badge (green checkmark animation).

### 3.6 Customer Booking Funnel & Intake Forms  
- **Guest-First Intake**:  
  - Step 1: Trip details (origin, destination, date, time, pax).  
  - Step 2: Vehicle selection (with fleet comparison).  
  - Step 3: Contact details (name, email, phone) — *auto-prefilled via Google OAuth if logged in*.  
  - Step 4: Special requests (child seat, extra stops, etc.).  
- **Guest Token Architecture**:  
  - On Step 3 submission → generate `x-guest-token` (UUIDv4, 72h expiry).  
  - Token stored in `localStorage` + sent as header for all subsequent API calls.  
  - Token persists across sessions (no auth required).

### 3.7 Payment Gateway Integration  
- **Razorpay Checkout Flow**:  
  - 28% advance payment via Razorpay Checkout (custom modal, no redirect).  
  - Payment intent stored server-side with `guestToken` reference.  
- **Resume Flow**:  
  - `/payment/resume/:token` page (SSG, 0.8s TTFB).  
  - Auto-retry payment on load (max 2 attempts).  
  - Fallback: *“Pay via UPI/Cards”* button.  
- **Post-Payment**:  
  - Voucher dispatch via Resend (HTML email with booking ID, itinerary, chauffeur contact).  
  - Booking ID format: `SB-${YYYYMMDD}-${6-char-uuid}`.

### 3.8 Post-Booking Experience  
- **My Bookings (`/my-bookings`)**:  
  - Filter by status (Upcoming, Completed, Cancelled).  
  - Guest users access via `/my-bookings?token=xxx`.  
  - Actions: *Track Trip*, *Cancel (if >24h before pickup)*, *Request Invoice*.  
- **Trip Tracking (`/booking/confirmation/:id`)**:  
  - Real-time map (polling every 30s, no WebSockets).  
  - Chauffeur details (name, photo, rating, vehicle number).  
  - *“Contact Driver”* button (WhatsApp/Call).  
- **Post-Trip**:  
  - Rating modal (1–5 stars) + feedback text.  
  - *“Share Experience”* (WhatsApp, Instagram Story).

### 3.9 Customer Authentication & Profile Management  
- **Guest-to-Registered Transition**:  
  - After 2 bookings → prompt *“Create Account”* (email + password).  
  - Auto-migrate guest bookings to registered profile.  
- **Profile Page (`/profile`)**:  
  - Edit contact details, view booking history, manage saved routes.  
  - *“Save for Later”* (e.g., *Agra–Delhi for next month*).  
- **Security**:  
  - JWT for registered users (HttpOnly cookie, 7-day expiry).  
  - Guest tokens never stored in cookies.

---

## 4. Non-Functional Requirements

| Category | Requirement | Validation |
|----------|-------------|------------|
| **Performance** | TTFB ≤ 1.2s (SSG), LCP ≤ 1.8s, FID ≤ 100ms | Lighthouse ≥ 95 (all categories) |
| **SSG** | 72 pages + 23 redirects pre-rendered at build time | `npm run build` → `react/dist` contains static HTML |
| **Accessibility** | WCAG 2.1 AA compliant (contrast ≥ 4.5:1, keyboard nav, ARIA labels) | Axe-core scan: 0 critical issues |
| **Mobile Responsiveness** | 100% fluid layout (mobile-first), no horizontal scroll, touch targets ≥ 48px | Test on 5 devices (iPhone 14, Pixel 7, iPad, etc.) |
| **Browser Support** | Chrome, Safari, Firefox (latest 2 versions), Edge (Chromium) | BrowserStack test matrix |
| **Offline Capability** | Service worker caches critical assets (HTML, CSS, JS, fonts) | Lighthouse PWA audit: 100% |

---

## 5. SEO, Structured Data, Open Graph & Social Cards

### 5.1 SEO Strategy  
- **Sitemap**: 63 canonical URLs (including `/routes`, `/tours`, `/corridors`).  
- **Bilingual Content**:  
  - English primary, Hindi secondary (via `lang="hi"` in SSR).  
  - No duplicate content (canonical tags on all pages).  
- **Dynamic Meta Tags**:  
  - Per-route: `title`, `description`, `keywords` (e.g., *“Agra to Delhi Taxi – Luxury Innova Crysta | SK Baghel”*).  
  - Per-tour: `og:title`, `og:description`, `og:image` (custom SVG card with route map).

### 5.2 Structured Data (JSON-LD)  
- **TaxiService** (on homepage):  
  ```json
  {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    "name": "SK Baghel Luxe",
    "serviceType": "Chauffeur-driven taxi",
    "areaServed": ["Agra", "Delhi", "Jaipur", "Lucknow"],
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": "1200",
      "url": "https://skbaghel.com/routes/agra-delhi"
    }
  }
  ```
- **TouristTrip** (on tour pages):  
  ```json
  {
    "@type": "TouristTrip",
    "name": "Taj Sunrise Tour",
    "duration": "P4H",
    "offers": { ... }
  }
  ```

### 5.3 Social Cards  
- **Dynamic OG Images**:  
  - Generated at build time (Vite plugin: `vite-plugin-og-image`).  
  - Template: Brand green background, route name, vehicle icon, QR code to booking link.  
- **Twitter Card**: `summary_large_image`.

---

## 6. Security, Privacy & PII Protection

### 6.1 Guest Token Architecture  
- **Token Generation**:  
  - Server-side (Node.js microservice), signed with HMAC-SHA256.  
  - Stored in `localStorage` (not cookies) → mitigates CSRF.  
- **Token Lifecycle**:  
  - Expiry: 72 hours from creation.  
  - Revoked on booking completion or cancellation.  
- **Data Minimization**:  
  - Guest tokens contain *only* booking ID and timestamp (no PII).  
  - PII (name, phone) encrypted at rest (AES-256) in booking records.

### 6.2 Compliance  
- **GDPR/CCPA**:  
  - Cookie consent banner (pre-consent: no tracking).  
  - *“Delete my data”* button in profile.  
- **PCI-DSS**:  
  - Razorpay handles all card data (no PII in frontend logs).  
  - `x-guest-token` never logged in analytics.

---

## 7. Analytics, Conversion Tracking & Operations Handoff

### 7.1 Tracking Stack  
- **Core Events**:  
  - `booking_initiated`, `fare_viewed`, `payment_started`, `payment_completed`, `voucher_sent`.  
- **Tools**:  
  - Plausible (privacy-first, no cookies).  
  - Google Analytics 4 (enhanced measurement).  
  - Hotjar (session replay for high-value pages).  

### 7.2 Conversion Funnel Metrics  
| Step | Target Rate | Monitoring |
|------|-------------|------------|
| Landing → Route Search | ≥ 85% | Plausible event tracking |
| Search → Fare View | ≥ 92% | Heatmaps (Hotjar) |
| Fare View → Payment Start | ≥ 78% | A/B test CTA variants |
| Payment Start → Completion | ≥ 88% | Razorpay webhook logs |

### 7.3 Operations Handoff  
- **Booking Confirmation Workflow**:  
  1. Payment success → webhook to backend.  
  2. Backend:  
     - Generate voucher (HTML/PDF) via Resend.  
     - Queue SMS (Twilio) to customer + chauffeur.  
     - Notify operations team (Slack #bookings channel).  
- **Escalation Path**:  
  - Failed payments → auto-alert to ops (email + Slack).  
  - Booking modifications → ops team approval (internal dashboard).

---

## 8. Acceptance Criteria & Quality Gates

### 8.1 Functional Acceptance Criteria  
| Feature | Acceptance Criteria | Test Method |
|---------|---------------------|-------------|
| **Fare Calculation** | Server returns exact fare (base + km + tolls + tax) | Jest + Supertest (mocked fare engine) |
| **Guest Checkout** | `x-guest-token` persists across page reloads | Cypress: `cy.visit('/booking?token=xxx')` |
| **Payment Resume** | `/payment/resume/:token` shows payment modal within 1.5s | Lighthouse + manual test |
| **Voucher Dispatch** | 100% of bookings receive email within 60s of payment | Resend webhook logs |

### 8.2 Quality Gates  
| Gate | Tool | Threshold | Owner |
|------|------|-----------|-------|
| **Build** | Vite | `npm run build` succeeds | Dev Lead |
| **Tests** | Jest + Cypress | 95% coverage (unit), 100% critical paths (e2e) | QA Lead |
| **SEO** | Screaming Frog | 0 broken links, 100% canonicals | SEO Specialist |
| **Performance** | Lighthouse | ≥ 95 (all categories), TTFB ≤ 1.2s | Frontend Lead |
| **Accessibility** | Axe-core | 0 critical issues | UX Designer |

### 8.3 Go-Live Checklist  
- [ ] All 72 pages pre-rendered (verified via `dist/` diff).  
- [ ] Fare engine contract signed off by operations team.  
- [ ] Razorpay webhook tested in staging (sandbox).  
- [ ] Resend templates approved (English + Hindi).  
- [ ] Sitemap submitted to Google Search Console.  
- [ ] Hotjar session recording enabled for 10% traffic.  

---

**Approvals**  
| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | — | — | — |
| Engineering Lead | — | — | — |
| Operations Head | — | — | — |

**Next Steps**  
1. Freeze PRD → Kickoff sprint (2 weeks).  
2. Build `react/dist` in CI/CD pipeline (Vercel preview deployments).  
3. Conduct UAT with 5 beta users (Priya, Rahul, Ananya archetypes).  

---  
*This PRD is the single source of truth for the `react/` customer site. All changes require PRD amendment + stakeholder sign-off.*  
**SK Baghel Tour & Travels — Where Every Journey Begins in Luxury**