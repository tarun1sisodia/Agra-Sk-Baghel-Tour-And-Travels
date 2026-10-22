# Product Requirements Document (PRD) — Admin Operations Desk
**Agra SK Baghel Tour & Travels — Internal Operations & Administration Platform**

- **Document Version:** 2.1 (Authoritative Complete Production Specification)
- **Status:** Implemented & Verified in Monorepo
- **Project Root:** `admin/` (`tarun1sisodia/ArenaAI`)
- **Canonical Deployment Origin:** `https://admin.agraskbagheltourandtravels.com`
- **Active Staging Origin:** `https://skbagheltravels-admin.coccoder999.workers.dev`
- **Local Development URL:** `http://localhost:5174`
- **Backend API Origin:** `https://api.agraskbagheltourandtravels.com` / `http://localhost:4000`
- **Connected Customer Portal:** `https://skbagheltravels-customer.coccoder999.workers.dev` (Staging) / `https://agraskbagheltourandtravels.com` (Prod)
- **Target Test Automation Engine:** TestSprite (Admin UI & Role Permission Test Generation)

---

## 1. Executive Summary & Vision

**Agra SK Baghel Tour & Travels** operates a private luxury travel and chauffeur service across Agra, Mathura, Vrindavan, Delhi NCR, and the Golden Triangle corridors.

The **Admin Operations Desk** (`admin/`) serves as the central command portal for dispatchers, tour coordinators, finance operators, review moderators, and desk managers. It enables complete day-to-day operations with zero developer dependency and zero runtime ambiguity.

### Key Capabilities Delivered:
1. **Fleet Catalog Onboarding & Asset Library Selector (`/vehicles`)**:
   - 25+ curated vehicle model presets (`FLEET_PRESETS`) spanning all 4 canonical fleet groups (`sedan`, `suv`, `luxury`, `tempo_traveller`).
   - "Fleet Asset Catalog & Quick Onboarding" gallery with filter tabs ("Missing in Fleet", "All Catalog", "Active"), real-time search, and 1-click "+ Onboard to Fleet" button.
   - Add/Edit Vehicle Model modal with "Quick Template Auto-Fill" dropdown and "Fleet Asset Library" selector (`FLEET_IMAGE_OPTIONS`) featuring 35+ local high-resolution vehicle images with dimensional specs and live 16:9 photo preview.
   - Active vehicle models table with photo thumbnails and instant text search.
2. **Review Invitation & WhatsApp QR Studio (`/reviews`)**:
   - Dedicated studio for dispatchers to generate verified review invitation links.
   - 1-Click WhatsApp share with personalized bilingual invitation message.
   - Real-time HTML5 canvas QR code rendering via `qrcode`.
   - 1-Click PNG QR code download (`review-qr-[ticketId].png`) for vehicle glove compartments and chauffeur clipboards.
   - Review moderation queue enqueuing publish events to `site_publish_events` for static customer snapshot emission.
3. **Booking Operations Desk (`/bookings`)**:
   - Complete lifecycle tracking (`pending_payment` ➔ `paid_confirmed` ➔ `in_transit` ➔ `completed` / `cancelled` / `refunded`).
   - Optimistic concurrency control via `expectedVersion` to prevent concurrent overwrite collisions.
   - Unmask Customer PII toggle with mandatory immutable audit logging (`UNMASK_CUSTOMER_PII`).
   - 30-minute auto-expiry detection for unpaid bookings.
   - Manual payment recording for bank NEFT/IMPS and Taj Ganj desk cash advances.
4. **Finance Reconciliation & Idempotent Refunds (`/finance`)**:
   - Dual-ledger tracking: Captured 28% online advance deposits vs pending 72% chauffeur cash balance collections.
   - Idempotent refund subsystem requiring unique `idempotencyKey` and mandatory audit reason to eliminate double payouts.
5. **Fare Engine, Rates & Commercial Exceptions (`/fares`)**:
   - Versioned commercial fare rules (e.g., `2026-09-13`).
   - Strict commercial rules for Force Urbania and Tempo Traveller (forced round-trip distance doubling `km * 2` and 300km/day minimum floor).
6. **Curated Product Catalog CMS (`/routes`, `/tour-packages`, `/local-transfers`)**:
   - Outstation routes (980+ corridors).
   - Local sightseeing hourly charters (4h/40km, 8h/80km, 12h/120km).
   - Station and airport transfers (Agra Cantt, Agra Fort, Delhi IGI, Jewar).
   - Multi-day tour packages with day-by-day itineraries and vehicle pricing grids.
7. **Lead Management (`/rental-requests`, `/inquiries`)**:
   - Call-first taxi rental quote management with status workflow (`new` ➔ `contacted` ➔ `quoted` ➔ `confirmed` ➔ `closed`).
   - General inquiry inbox with operator assignment.
8. **Operational Sign-Off & Trip Readiness (`/sign-off`)**:
   - Pre-departure vehicle sanitation, AC cooling, FASTag balance, driver badge, and emergency kit checklists.
9. **Enterprise Security & Immutable Audit (`/audit`)**:
   - Role-Based Access Control (RBAC) with 5 granular roles.
   - Tamper-proof security audit trail logging every administrative mutation.

---

## 2. System Architecture & Monorepo Integration

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ADMIN DESK SPA (admin/)                         │
│  React 19 • Vite • React Router 7 • Tailwind CSS • Motion • Lucide     │
│  Auth: Supabase Auth in Production / Role Selector in Test Mode        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Bearer JWT / Admin API Client
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      FASTIFY BACKEND (backend/)                        │
│   Auth Guards • Role Guards • Fare Engine • Idempotent Refund Service  │
│   Auto-Expiry Worker (60s) • Review Outbox Publisher                   │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌───────────────────────────────────┐    ┌───────────────────────────────┐
│     PostgreSQL (Supabase)         │    │       External Gateways       │
│  Bookings • Catalog • Fare Rules  │    │  Razorpay / PayPal APIs       │
│  Reviews • Leads • Audit Logs     │    │  (Signed Webhooks & Refunds)  │
└───────────────────────────────────┘    └───────────────────────────────┘
```

---

## 3. User Roles & Permission Matrix (RBAC)

The admin platform enforces strict Role-Based Access Control across 5 distinct roles:

| Administrative Capability | `dispatcher` | `content_editor` | `review_moderator` | `finance_operator` | `super_admin` |
|---|:---:|:---:|:---:|:---:|:---:|
| **Dashboard Metrics & Analytics** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Search & Filter Bookings** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Inspect Booking Details** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Unmask Customer PII (Phone/Email)** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Advance Booking Status (`in_transit`, `completed`)** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Record Manual Offline Payment** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Trigger Idempotent Refund** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Manage Fleet Models & Presets** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Edit Fare Settings & Commercial Rates** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Manage Routes & Corridors** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Manage Tour Packages & Itineraries** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Manage Local Sightseeing & Transfers** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Moderate Customer Reviews** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Review Invitation & WhatsApp QR Studio** | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Manage Rental Requests & Leads** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Publish Catalog Outbox** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Execute Operational Sign-Off** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Inspect System Audit Logs** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 4. Comprehensive Functional Specifications by Module

### 4.1. Authentication & Session Security (`/login`, `/auth/callback`)
- **Dual Authentication Modes**:
  - **Production Mode**: Supabase email/password authentication with JWT bearer tokens and automatic background refresh.
  - **Staging / Test Mode (`ALLOW_TEST_AUTH=true`)**: Demo Role Switcher enabling instantaneous test switching between `dispatcher`, `content_editor`, `review_moderator`, `finance_operator`, and `super_admin`.
- **Session Lifecycle**: Bearer access tokens stored in browser session storage. Automatic session termination on 401 Unauthorized via `AUTH_EXPIRED_EVENT`.
- **Route Guards**: Evaluates active role before mounting protected administrative routes, gracefully redirecting unauthorized attempts.

### 4.2. Operations Dashboard (`/`)
- **Key Real-Time Operational Metrics**:
  - `Total Active Bookings`: Current in-flight and upcoming trips.
  - `Today's Confirmed Departures`: Vehicles scheduled for dispatch today.
  - `Financial Reconciliation`: Captured 28% advance deposits vs pending 72% chauffeur cash collections.
  - `Review Moderation Queue`: Pending customer reviews awaiting publication.
  - `New Rental Enquiries`: Uncontacted taxi rental quote requests.
- **Quick Operations Bar**: Instant buttons to Create Booking, Onboard Vehicle, Add Tour Package, or Open QR Studio.
- **Live Activity Feed**: Chronological stream of status changes, payments, unmasked PII events, and admin logins.

### 4.3. Bookings Operations Desk (`/bookings`)
- **Instant Search & Query Filters**:
  - Search by Ticket ID (`AGR-YYYYMMDD-XXXX`), Customer Phone, Email, or UUID.
  - Filter by Status (`pending_payment`, `paid_confirmed`, `in_transit`, `completed`, `cancelled`, `refunded`).
  - Filter by Category (`outstation`, `local_package`, `transfer`, `tour_package`).
  - Filter by Fleet Group (`sedan`, `suv`, `luxury`, `tempo_traveller`).
  - Date pickers for pickup date range.
- **Inspection Drawer**:
  - Route Summary: Origin, destination, pickup address, drop address, scheduled date/time, estimated distance (km).
  - Selected Vehicle Model, passenger capacity, and luggage count.
  - Immutable Fare Breakdown: Base fare, km charge, driver allowance, night surcharge, tolls/GST included, total fare, advance paid, balance due to chauffeur.
- **PII Privacy & Unmasking**:
  - Customer contact details are masked by default (`+91 98*** **598`).
  - Authorized dispatchers click **"Unmask PII"**, which reveals phone/email and asynchronously records an immutable security audit entry (`UNMASK_CUSTOMER_PII`) with user ID, IP address, and timestamp.
- **Optimistic Concurrency Control**:
  - Status updates submit the current `version` integer (`expectedVersion`).
  - If another operator updated the booking in parallel, the update is rejected with a conflict alert, prompting a reload to prevent stale overwrites.
- **30-Minute Auto-Expiry Awareness**:
  - Unpaid bookings abandoned past 30 minutes display `cancelled` with an `Auto-Expired` badge.
- **Manual Payment Recording**:
  - For customers paying deposits via direct bank NEFT/IMPS or at the Taj Ganj desk, staff can record payment with transaction reference and payment method.

### 4.4. Canonical Vehicles & Fleet Showroom (`/vehicles`)
- **4 Canonical Fleet Groups**:
  - `sedan`: 4 passengers, 2 bags (Maruti Dzire, Honda Amaze, Skoda Slavia).
  - `suv`: 6-7 passengers, 3-4 bags (Maruti Ertiga, Toyota Innova Crysta, Toyota Fortuner).
  - `luxury`: 4-6 passengers, 3-4 bags (Toyota Camry Hybrid, Toyota Vellfire Lounge, Mercedes E-Class).
  - `tempo_traveller`: 10-17 passengers, 8-12 bags (Force Traveller 12/17-seater, Force Urbania VIP).
  - Group Rule Configuration: Driver allowance per day (round trips), one-way night surcharge, round-trip halt charge per night.
- **Fleet Asset Catalog & Quick Onboarding Gallery**:
  - `FLEET_PRESETS`: 25+ curated models with pre-filled makes, models, passenger capacities, luggage allowances, descriptions, and high-resolution photos.
  - Status Filter Tabs:
    - `Missing in Fleet (count)`: Shows vehicles from the catalog not yet activated in the active database.
    - `All Catalog (count)`: Complete preset repository.
    - `Active (count)`: Catalog vehicles already onboarded.
  - Catalog Search: Real-time search by make, model, group code, or description.
  - Vehicle Cards: Aspect-video image with fallback to `sedan.webp`, canonical group badge (`SEDAN`, `SUV`, `LUXURY`, `TEMPO_TRAVELLER`), seat/luggage pills, and active status pill.
  - Action Button: **"+ Onboard to Fleet"** (pre-populates the Add Vehicle Model modal with all specifications ready for 1-click activation).
- **Add / Edit Vehicle Model Modal (`isModelModalOpen`)**:
  - **Quick Template Auto-Fill Dropdown**: Allows instant selection of any preset from `FLEET_PRESETS`, immediately populating make, model name, display name, seat capacity, luggage count, and photo URL.
  - Vehicle Group selector: Binds model to canonical group (`sedan`, `suv`, `luxury`, `tempo_traveller`).
  - Form Fields: Make, Model Name, Customer Display Name, Passenger Capacity, Luggage Capacity, Sort Order.
  - **Fleet Asset Library Selector (`FLEET_IMAGE_OPTIONS`)**:
    - Dropdown featuring 35+ local high-resolution vehicle images with dimensions and descriptions (e.g. `toyota-camry-hybrid-executive-luxury-360x536.jpg`, `honda-amaze-red-sedan-921x519.webp`, `toyota-vellfire-ultra-luxury-mpv-360x536.jpg`, `skoda-slavia-montecarlo-jodhpur-palace-921x519.jpg`, `tempo.webp`, `urbania.webp`).
    - Eliminates manual URL typing.
    - Custom URL input field for external photo links.
  - **Live Photo Preview**:
    - Responsive 16:9 container displaying the selected vehicle image.
    - Status badge: Displays `✓ Image linked` when valid image is loaded.
    - Error fallback: Displays `<Car />` icon with "Could not load image at this path" if URL is invalid.
  - Active model checkbox: Toggles visibility in customer booking showroom.
- **Active Vehicle Models Table**:
  - Model Column: Renders vehicle photo thumbnail with clean fallback to `<Car />` icon.
  - Instant Search Input: Filters table by display name, make, model, or group.
  - Action Buttons: Edit Model, Deactivate/Activate toggle.

### 4.5. Fare Settings & Commercial Rules (`/fares/settings`, `/fares/rates`, `/fares/extra-charges`)
- **Versioned Commercial Rules**: Active version e.g. `2026-09-13`.
- **Distance Floors & Surcharges**:
  - Standard Outstation floor: 250 km/day.
  - Night travel surcharge window: 10:00 PM to 06:00 AM.
  - Driver daily allowance by group (Sedan ₹400, SUV ₹500, Luxury ₹700, Tempo ₹800).
- **Commercial Exception Rules (Force Urbania & Tempo Traveller)**:
  - Forced round-trip distance doubling (`km * 2`).
  - Strict 300 km/day floor (`Math.max(km * 2, 300 * days)`).
  - Mandatory ₹500/day driver allowance and locked rate structure immune to coupon discounts.
- **Interstate Toll & State Tax Policies**:
  - Configurable inclusion rules for Yamuna Expressway, Eastern Peripheral, and Agra-Lucknow Expressway.

### 4.6. Routes Directory CMS (`/routes`)
- **980+ Point-to-Point Corridors**: Complete CRUD for intercity travel.
- Parameters: Origin, Destination, Distance (km), Duration (hours), Corridor tag, Tolls included toggle, Per-group tariffs.
- Search & Filter: Filter by city pair, highway corridor, and publication state.

### 4.7. Tour Packages CMS (`/tour-packages`)
- **Curated Multi-Day & Day Tour Management**: Taj Sunrise Tour, Same Day Agra, Golden Triangle, Mathura-Vrindavan.
- **Itinerary Timeline Builder**: Day-by-day monument stops, duration, and descriptions.
- **Vehicle Pricing Grid**: Fixed tariffs per vehicle group (Sedan, Ertiga, Innova, Tempo, Urbania).
- **Inclusions & Exclusions**: Contractual bullet points.

### 4.8. Local Sightseeing & Transfers CMS (`/local-transfers`)
- Hourly Sightseeing Charters: 4h/40km, 8h/80km, 12h/120km packages.
- Station Transfers: Agra Cantt (AGC) and Agra Fort railway station drops.
- Airport Charters: Delhi IGI Airport, Jewar Airport, and Kheria Airport transfers.

### 4.9. Customer Review Moderation & WhatsApp QR Studio (`/reviews`)
- **Review Invitation & WhatsApp QR Studio (Top Section)**:
  - Form Fields: Customer Name, Booking Ticket ID, Chauffeur Name, Tour Name.
  - Submission URL Generation: Generates pre-filled review URL pointing to active customer site (`/review/:token` or `/review?...`).
  - **Action: "Generate Token Link"**: Calls `createAdminReviewLink` to generate an official verified token.
  - **Action: "Copy Link"**: Copies full URL to clipboard with visual confirmation.
  - **Action: "Share on WhatsApp"**: Formats personalized message (`Namaste [Name]! Thank you for traveling with SK Baghel Tour & Travels... Please share your feedback: [URL]`) and opens WhatsApp Web/API.
  - **Live Dynamic QR Code Canvas**: Real-time rendering via `QRCode.toDataURL` with dark ink `#1a1a1a` on white background.
  - **Action: "Download Printable QR Code (PNG)"**: Downloads `review-qr-[ticketId].png` for driver clipboards and vehicle glove compartments.
- **Customer Review Moderation Queue**:
  - Reviews Table: Rating (1-5 stars), review text, photo attachments, customer name, ticket reference, submission date.
  - Moderation Actions: Approve, Reject, Archive.
  - Outbox Publishing: Approving a review enqueues an event in `site_publish_events`, triggering static customer review snapshot generation.

### 4.10. Call-First Taxi Rental Requests (`/rental-requests`)
- Dedicated desk for inquiries submitted through `/en/taxis/rent/`.
- Fields: Customer Name, Phone, Email, Selected Vehicle Class, Specific Model, Pickup Date, Return Date, Passenger Count, Chauffeur Included toggle.
- Workflow State Machine: `new` ➔ `contacted` ➔ `quoted` ➔ `confirmed` ➔ `closed`.
- Chauffeur assignment and negotiated rate notes log.

### 4.11. Customer Inquiries & Leads Desk (`/inquiries`)
- Inbox for contact form inquiries with operator assignment and status tracking.

### 4.12. Finance & Payment Reconciliation (`/finance`)
- **Advance Deposit Ledger**: Audits 28% online advances captured via Razorpay, Cards, or UPI.
- **Chauffeur Cash Collection Ledger**: Tracks remaining 72% cash balance due to drivers upon arrival.
- **Idempotent Refund Subsystem**:
  - Super Admin and Finance Operators can initiate partial or full refunds against eligible bookings.
  - Modal requires mandatory Refund Reason and generates a unique client `idempotencyKey`.
  - Submits to backend refund route, updating payment and booking states to `refunded` while preventing accidental duplicate transactions under network retries.

### 4.13. Operational Sign-Off Desk (`/sign-off`)
- Pre-departure vehicle checklist: Sanitation, AC cooling, FASTag balance, driver badge, emergency kit.
- Permanent sign-off record attached to booking ticket.

### 4.14. Immutable Security Audit Trail (`/audit`)
- Append-only security ledger logging:
  - `UNMASK_CUSTOMER_PII`
  - `BOOKING_STATUS_CHANGE`
  - `PAYMENT_REFUND_EXECUTED`
  - `FARE_RULE_MUTATION`
  - `CATALOG_PUBLISHED`
  - `USER_LOGIN`
- Metadata: Timestamp (UTC), Actor UUID, User Role, Resource Type, Resource UUID, Client IP, User-Agent, and detailed JSON diff.

---

## 5. TestSprite Acceptance & Admin UI Assertion Matrix

| ID | Test Scenario | Expected UI Selector / Action | Pass Criteria |
|---|---|---|---|
| **TS-ADM-01** | Demo Role Login | Select role `dispatcher` on `/login` and submit | Authenticated session created; dashboard displays dispatcher navigation. |
| **TS-ADM-02** | Role-Based Access Enforcement | Log in as `content_editor` and navigate to `/finance` | Navigation is blocked or route redirects safely without exposing financial ledger. |
| **TS-ADM-03** | Bookings Search & Filter | Enter Ticket ID `AGR-` in `/bookings` search input | Table filters rows in real-time matching the entered ticket ID. |
| **TS-ADM-04** | Unmask Customer PII | Click "Unmask PII" on a booking drawer | Masked phone/email becomes readable text; audit event `UNMASK_CUSTOMER_PII` is recorded. |
| **TS-ADM-05** | Fleet Catalog Tab Filtering | Click "Missing in Fleet" on `/vehicles` | Displays only vehicle presets not currently active in the database. |
| **TS-ADM-06** | Fleet Preset Onboard Action | Click "+ Onboard to Fleet" on preset card | Add Vehicle Model dialog opens pre-filled with preset make, model, seats, and photo URL. |
| **TS-ADM-07** | Template Auto-Fill Dropdown | Select "Toyota Innova Crysta" in Auto-Fill dropdown | Dialog fields update immediately with Innova specifications and luggage capacity. |
| **TS-ADM-08** | Fleet Asset Library Picker | Choose image from Fleet Asset Library dropdown | Form updates `image_url`; Live Photo Preview renders 16:9 photo with "✓ Image linked". |
| **TS-ADM-09** | Vehicle Model Thumbnail Preview | Inspect Model column in Active Models table | Vehicle photo thumbnail renders cleanly with `<Car />` fallback for missing assets. |
| **TS-ADM-10** | Review Studio Link Generation | Enter Customer & Ticket ID, click "Generate Token Link" | Generates tokenized review submission URL without errors. |
| **TS-ADM-11** | Review Studio WhatsApp Share | Click "Share on WhatsApp" | Generates valid `https://wa.me/?text=...` URI containing customer name and review link. |
| **TS-ADM-12** | Review Studio QR Canvas & Download | Inspect QR canvas on `/reviews` and click Download | HTML5 canvas renders QR code; browser downloads `review-qr-[ticketId].png`. |
| **TS-ADM-13** | Review Moderation Queue | Click "Approve" on a pending review | Status changes to Approved; publish event is enqueued for customer static snapshot. |
| **TS-ADM-14** | Idempotent Refund Confirmation | Initiate refund on `/finance` with reason | Requires confirmation modal; executes refund with unique idempotency key. |
| **TS-ADM-15** | Logout & Session Clearing | Click "Logout" in sidebar | Session storage is wiped; user returns to login screen; back navigation blocked. |

---

## 6. Non-Functional & Security Requirements

1. **Zero Frontend Secret Leakage**: Admin build artifacts must never contain private backend keys (`DATABASE_URL`, `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`).
2. **Optimistic Locking**: Every mutation against bookings, fleet models, and pricing includes `expectedVersion` to prevent concurrent overwrite collisions.
3. **Responsive Operations**: Admin layout supports desktop screens (1280px+), tablets (768px), and mobile dispatch phones (375px) with collapsible sidebar and responsive data tables.
4. **Audit Immutability**: No administrative user (including `super_admin`) can delete or alter audit log entries via the UI or REST endpoints.
