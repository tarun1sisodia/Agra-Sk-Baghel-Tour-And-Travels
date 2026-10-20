# Routes Module (Intercity Highway Corridors)

## 1. Executive Purpose & Business Role
The **Routes** module manages all point-to-point intercity highway corridors (e.g., Agra to Delhi, Agra to Jaipur, Mathura to Agra) operated by Agra SK Baghel Tour & Travels.

It replaces the prior technical term `route_catalog` with the canonical domain entity **`routes`**.

## 2. Core Responsibilities
- **Corridor Distance & Duration**: Stores highway distances in kilometers and estimated travel times.
- **Toll Inclusions**: Tracks whether tolls are included in the fare or charged extra, plus exact toll amounts in INR.
- **Trip Types**: Supports `"one-way"` and `"round-trip"` intercity journeys.
- **Driver Charges & Night Halts**: Stores mandatory driver allowance and night halt charges.
- **Bidirectional Coverage**: Generates reverse routes automatically for SEO ranking and full customer coverage (e.g., Delhi to Agra alongside Agra to Delhi).

## 3. Database Architecture
- **Table**: `public.routes` (renamed from `route_catalog` in migration `0037_dejargon_and_rename_routes.sql`).
- **Primary Key**: `id` (UUID).
- **Unique Constraint**: `slug` (text, e.g. `agra-to-delhi-taxi`).
- **Indexes**: `routes_status_idx`, `routes_trip_type_idx`, `routes_slug_key`.
- **Security**: Row Level Security (RLS) enabled with public read access for `status = 'published'`.

## 4. Interaction Flows
```
Admin Desk (Route Management) ──► POST /api/v1/ops/admin/routes ──► routes Table
                                                                          │
Customer Website (Route Page) ◄── GET /api/v1/routes/manifest ◄──────────┘
```
