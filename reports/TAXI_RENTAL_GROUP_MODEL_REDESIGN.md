# ArenaAI — Taxi Rental Page Redesign & Canonical Fleet/Enquiry Persistence Report

**Primary Route:** `/en/taxis/rent/` and `/hi/taxis/rent/`  
**Primary Files:** `react/src/pages/RentalPage.tsx`, `react/src/styles/rental.css`, `backend/src/modules/rental-enquiries/*`, `admin/src/pages/RentalRequestsPage.tsx`  
**Date:** 2026-10-15  
**Status:** Verification Passed (`npm run verify` exit code 0)  

---

## 1. Executive Summary

The Taxi Rental experience has been completely redesigned from a legacy 5-card static price list into a canonical, live-catalog-driven rental showroom and interactive enquiry engine. Customers can now browse authentic vehicle groups (`sedan`, `suv`, `luxury`, `tempo_traveller`), view individual active vehicle models within each group, select a group with an optional specific model (or "Any suitable model in this group"), and submit a comprehensive rental enquiry.

Enquiries are validated server-side against the canonical fleet catalog, persisted with group and model references, and surfaced cleanly in the Admin Desk's Rental Requests console, while preserving full backward compatibility for historical enquiries.

---

## 2. Current-State Audit & Root Causes

### 2.1 The Legacy Customer Experience
Prior to this redesign:
1. **Static 5-Fleet Source:** `react/src/pages/RentalPage.tsx` imported static arrays `FLEETS` from `react/src/data/fleets.ts` and `prices` from `react/src/data/prices.ts`.
2. **Artificial Grouping:** Sedan, Ertiga, Innova, Tempo, and Urbania were presented as five parallel top-level vehicle tiers, directly contradicting the canonical architecture where Ertiga and Innova belong under SUV, and Urbania belongs under Tempo Traveller.
3. **Misleading Rates:** Displayed hardcoded per-km rates (`prices.fleet_per_km`) and static starting prices (`priceFor()`), creating false price guarantees for a business that operates on bespoke rental quotes.
4. **Disconnected Form:** The legacy rental form collected basic contact details and a legacy `carTier` string, without model selection, passenger counts, or structured itinerary fields.

### 2.2 Backend & Data Model Limitations
1. **Rigid Car Tier Constraint:** Database table `rental_enquiries` strictly enforced `car_tier IN ('sedan', 'ertiga', 'innova', 'tempo', 'urbania')` as `NOT NULL`.
2. **Missing Persistence:** Canonical vehicle group codes (`vehicle_group_code`), canonical model UUIDs (`vehicle_model_id`), passenger capacity (`passengers`), and destination/itinerary details (`destination_or_itinerary`) were not stored.
3. **Admin Panel Legacy Dependency:** `admin/src/pages/RentalRequestsPage.tsx` used hardcoded string lookups (`carLabel`) mapped only to the 5 legacy car tier strings.

---

## 3. Canonical API & Architecture Integration

### 3.1 Live Catalog Source
The customer frontend now fetches the canonical catalog via:
```typescript
import { fetchPublishedCatalog } from '../services/cleanFareApi';
```
Backed by `GET /api/v1/catalog`, the response provides:
- **`groups`**: Active canonical vehicle groups (`sedan`, `suv`, `luxury`, `tempo_traveller`) with display names and ordering.
- **`vehicles`**: Active canonical vehicle models with UUID `id`, `vehicle_group_code`, `make`, `model_name`, `display_name`, `passenger_capacity`, `luggage_capacity`, and `image_url`.

### 3.2 Canonical Group Hierarchy
Vehicles strictly adhere to their backend relational group membership:
- **Sedan (`sedan`)**: Dzire, Etios, Aura, etc.
- **SUV (`suv`)**: Ertiga, Innova Crysta, Carens, etc.
- **Luxury (`luxury`)**: BMW, Audi, Mercedes, Fortuner, etc.
- **Tempo Traveller (`tempo_traveller`)**: Force Tempo Traveller (12/16/20/26 seater), Force Urbania (10/13/17 seater).

*Note: Group membership is never guessed from model names or hardcoded strings.*

---

## 4. Front-End Redesign & User Flow

### 4.1 Visual Language & Token Compliance
The redesign follows the established SK Baghel Mughal Terracotta and Sandstone design system (`LOCK-N01`):
- Warm sandstone background `#fbf8f4` and terracotta accents `#9b3d27`, `#7a2b18`.
- Deep charcoal `#1a1614` for high-contrast, accessible typography.
- Scoped component styling in `react/src/styles/rental.css`, avoiding global style bleed.
- Responsive breakpoints tested at `320px`, `360px`, `390px`, `768px`, `1024px`, `1280px`, and `1440px`.

### 4.2 Page Structure & Components
1. **Hero Header:**
   - Headline: *"Find the Right Vehicle for Your Journey"*.
   - Subtitle emphasizing verified chauffeurs, transparent quoting, and tailored charters.
   - Quick action: "Request a Quote" with smooth auto-scroll to the enquiry form.
2. **Canonical Group Tabs:**
   - Interactive group selector with live active model count badges (e.g., "SUV (3 Models)").
   - Responsive tab bar with keyboard navigation (`role="tablist"`).
3. **Vehicle Model Showroom:**
   - Responsive grid of cards rendering live active models for the active group.
   - Displays real display name, canonical group, passenger capacity, and luggage capacity.
   - Understated fallback imagery for vehicles without uploaded photography.
   - Transparent pricing disclosure: *"Final rental fare confirmed by our team after reviewing itinerary and schedule"*.
   - Direct CTA: *"Rent this vehicle"*, which preselects the model, switches the form's group/model inputs, and scrolls down smoothly.
4. **Interactive Multi-Section Rental Enquiry Form:**
   - **Section 1: Contact Details** — Full Name, Mobile Number (with international prefix normalization), Optional Email.
   - **Section 2: Vehicle Preference** — Dynamic Vehicle Group select, dynamic Vehicle Model select (including explicit "Any suitable model in this group" option). Auto-clears model when group is changed.
   - **Section 3: Dates & Route** — Pickup Date (min today), Return Date (min pickup date), Pickup Location (Agra hotels, stations, airports, residences), Destination or Itinerary details, Passenger Count.
   - **Section 4: Service Preference & Notes** — Chauffeur service preference (`with_driver`), customer notes/requirements, and anti-spam honeypot field.
   - **Submission & State Handling:**
     - Client validation with actionable inline error messages.
     - Submission spinner with double-submit prevention.
     - Confirmation screen displaying reference code (`TKT-RNT-...`), chosen group/model, itinerary, and next-steps guidance.
5. **How It Works:**
   - 3-step transparent workflow: 1. Select Vehicle, 2. Submit Itinerary, 3. Receive Verified Quote.
6. **Rental FAQ:**
   - Factual answers regarding chauffeur allowances, fuel, toll/parking policies, and booking timelines.

---

## 5. Backend Contract & Persistence

### 5.1 Database Migration: `0041_rental_enquiries_group_and_model.sql`
To support group and model selection while preserving existing data:
```sql
-- Add canonical fleet columns
ALTER TABLE rental_enquiries
  ADD COLUMN IF NOT EXISTS vehicle_group_code text,
  ADD COLUMN IF NOT EXISTS vehicle_model_id uuid REFERENCES vehicle_models(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_or_itinerary text,
  ADD COLUMN IF NOT EXISTS passengers integer;

-- Relax NOT NULL on legacy car_tier for backward compatibility
ALTER TABLE rental_enquiries
  ALTER COLUMN car_tier DROP NOT NULL;

-- Index for admin filtering and joins
CREATE INDEX IF NOT EXISTS idx_rental_enquiries_group_code ON rental_enquiries(vehicle_group_code);
CREATE INDEX IF NOT EXISTS idx_rental_enquiries_model_id ON rental_enquiries(vehicle_model_id);
```
> **Approval Notice:** Migration file `backend/migrations/0041_rental_enquiries_group_and_model.sql` is committed and ready. **It has NOT been executed against production.** It must be applied by database administrators during the scheduled release window.

### 5.2 Server-Authoritative Validation & Service Logic
In `backend/src/modules/rental-enquiries/rental-enquiry.service.ts`:
- **Group Code Validation:** Validated against `['sedan', 'suv', 'luxury', 'tempo_traveller']`.
- **Model Validation:**
  - If `vehicleModelId` is supplied, queries `fareCatalogRepo.getVehicleModels()` to verify the model exists, is active, and matches `vehicleGroupCode`.
  - Inactive or mismatched models throw `VALIDATION_ERROR` (HTTP 400).
- **Group-Only Selection:** When customer selects "Any suitable model in this group", `vehicleModelId` is stored as `null` while `vehicleGroupCode` is preserved.
- **Date Validation:** Enforces `returnDate >= pickupDate`.
- **Phone Sanitization:** Normalizes phone input by stripping whitespace and dashes before validating with `+91[6-9]\d{9}`.
- **Anti-Spam:** Honeypot field triggers immediate rejection (`SPAM_DETECTED`).
- **Backward-Compatible Writes:** Generates a fallback `car_tier` (e.g. `'sedan'`, `'ertiga'`, `'innova'`, `'tempo'`) for databases where migration 0041 has not yet been executed.

### 5.3 PostgreSQL Repository Enhancements
In `backend/src/db/postgres.ts`:
- Left joins `rental_enquiries` with `vehicle_models vm` and `vehicle_groups vg` in `SELECT` queries to retrieve `model_display_name` and `group_display_name`.
- Updated `list`, `getById`, `create`, and `update` methods to map and persist all new fields.

---

## 6. Admin Desk: Rental Requests Workflow

In `admin/src/pages/RentalRequestsPage.tsx`:
1. **Canonical Fleet Badges:** Displays the selected canonical group name (Sedan, SUV, Luxury, Tempo Traveller) and model name (e.g., "Toyota Innova Crysta" or "Any suitable model in group").
2. **Legacy Compatibility:** Preserves historical enquiries displaying legacy tiers (`carTier: sedan, ertiga, innova, tempo, urbania`) intelligibly.
3. **Itinerary & Passengers:** Shows destination / itinerary details and passenger count.
4. **Enhanced Filtering:** Filter by vehicle group or legacy car tier.
5. **Operational Actions:** Preserves status transitions (`pending` -> `contacted` -> `quoted` -> `converted` -> `rejected`), customer notes logging, and direct Call/WhatsApp deep links.

---

## 7. Modified & Created Files

| File | Type | Changes |
|---|---|---|
| `react/src/pages/RentalPage.tsx` | Modified | Complete redesign; live catalog fetch, tabs, showroom, multi-section form, confirmation |
| `react/src/styles/rental.css` | Modified | Brand design tokens, responsive showroom grid, accessible form styles, reduced motion |
| `react/src/app/ServerApp.tsx` | Modified | Added language prop to RentalPage and route-specific SEO metadata |
| `react/src/app/App.tsx` | Modified | Added language prop to RentalPage |
| `react/package.json` | Modified | Added `test:rental` script |
| `react/scripts/rental-page.test.ts` | Created | Frontend test suite (6 tests) for fleet grouping, selection, and form rules |
| `backend/migrations/0041_rental_enquiries_group_and_model.sql` | Created | Additive migration for canonical vehicle fields |
| `backend/src/types/domain.ts` | Modified | Added canonical fields to `RentalEnquiryRecord` and `CanonicalVehicleGroup` |
| `backend/src/db/types.ts` | Modified | Added fields to `Repositories.rentalEnquiries` and `RentalEnquiryListFilter` |
| `backend/src/db/postgres.ts` | Modified | Persistence, LEFT JOIN queries for model/group names, filter handling |
| `backend/src/db/memory.ts` | Modified | In-memory repository support for tests |
| `backend/src/modules/rental-enquiries/rental-enquiry.schema.ts` | Modified | Zod schemas with phone normalization and date validations |
| `backend/src/modules/rental-enquiries/rental-enquiry.service.ts` | Modified | Canonical model verification, active status check, group mismatch guard |
| `backend/src/modules/rental-enquiries/rental-enquiry.controller.ts` | Modified | Response serialization and query filter passing |
| `backend/src/app.ts` | Modified | Injected `fareCatalogRepo` into rental enquiry service |
| `backend/tests/unit/rental-enquiries.test.ts` | Created | Comprehensive backend unit tests (13 tests) |
| `admin/src/lib/types.ts` | Modified | Added canonical fields to `RentalEnquiry` |
| `admin/src/pages/RentalRequestsPage.tsx` | Modified | Redesigned table columns, badges, filtering, and model/group display |

---

## 8. Verification Results

### 8.1 Automated Test Suites
1. **Backend Unit Tests (`backend/tests/unit/rental-enquiries.test.ts`):**
   - 13/13 tests passed:
     - Group code validation (`sedan`, `suv`, `luxury`, `tempo_traveller`).
     - Canonical model verification (valid UUID lookup).
     - Group-only selection ("Any suitable model in group").
     - Rejection of nonexistent or invalid UUID models.
     - Rejection of inactive models.
     - Rejection of group/model mismatches (e.g. Innova in sedan group).
     - Return date on or after pickup date enforcement.
     - Phone normalization and format validation.
     - Anti-spam honeypot rejection.
     - Admin enquiry listing and filtering by group and car tier.
2. **Frontend Component Tests (`react/scripts/rental-page.test.ts`):**
   - 6/6 tests passed:
     - Active models count calculation per group.
     - Showroom filtering by active tab.
     - Model selection auto-populating form.
     - Incompatible model clearing on group change.
     - Placeholder image fallback handling.
     - Date and phone input validation.

### 8.2 Full Monorepo Build & Typecheck (`npm run verify`)
- **Customer Typecheck (`skb-react`):** 0 errors.
- **Admin Typecheck (`skb-admin`):** 0 errors.
- **Backend Typecheck (`@sk-baghel/backend`):** 0 errors.
- **Backend Vitest Suite:** 233 unit tests passed across 13 test files (100% green).
- **Admin Tests:** 9 tests passed.
- **SEO Lifecycle Checks:** Passed.
- **Production Builds:**
  - `react/dist`: Built successfully; 59 SSG pages pre-rendered, sitemap.xml (50 URLs) + robots.txt generated.
  - `admin/dist`: Built successfully (Vite production bundle).
  - `backend/dist`: Built successfully (tsc build).
- **Command Exit Code:** `0`.

---

## 9. Visual Inspection & Responsive Verification

The page was evaluated across key viewports:
- **320px (Small Mobile):** Single-column layout, compact tabs, full-width inputs, no horizontal scroll.
- **360px & 390px (Standard Mobile / iPhone):** Ergonomic touch targets, clean card spacing, visible group badges.
- **768px (Tablet):** 2-column model showroom, 2-column form grid for dates and contact details.
- **1024px & 1280px (Desktop):** 3-column showroom grid, prominent 2-column form card with floating summary.
- **1440px (Wide Desktop):** Centered max-width container, balanced whitespace, high visual hierarchy.
