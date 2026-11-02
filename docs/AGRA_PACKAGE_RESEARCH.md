# Curated Agra packages — content seed

Reviewed: **2 November 2026**. Scope: private-car trips **starting in Agra**, inside the city and nearby. All copy is newly written from itinerary research, not a clone of a competitor's page. No competitor prices, reviews, company contact details or photographs are imported.

## What “people buy” means here

We cannot know competitors' actual booking volumes or promise future sales. Selection uses repeated local-operator offerings plus public traveler-review evidence where available, not search position alone. Viator's Agra listings show reviewed Taj sunrise, Taj + fort, full-day Agra, Fatehpur Sikri, evening Baby Taj/Mehtab Bagh and Mathura/Vrindavan products. This supports these itinerary *types*, not a claim that our packages have those reviews. [1](https://www.viator.com/en-IN/Agra-tours/City-Tours/d4547-g12-c5330) [4](https://www.viator.com/en-GB/Agra/d4547) [5](https://www.viator.com/en-SG/tours/Agra/Agra-to-New-Delhi-by-Train-Including-Taj-Mahal-Agra-Fort-and-Fatehpur-Sikri/d4547-13134P8)

The 10 choices are deliberately not advertised as “bestsellers” or given invented ratings, customer counts, limited seats or sales guarantees. Bharatpur is a secondary, **seasonal** choice: a reviewed Keoladeo tour explicitly offers transfers from Agra, and traveler feedback describes completed visits. It is not positioned as equal-volume to the Taj Mahal. [1](https://www.viator.com/en-HK/tours/Agra/Keoladeo-National-Park-Bharatpur-Admission-Ticket/d4547-26911P369)

## Pages actually read

- https://www.agrashivtourandtravels.com/ — local sightseeing destinations, private vehicle formats and links to sunrise, Fatehpur Sikri and Mathura/Vrindavan itineraries.
- https://www.agrashivtourandtravels.com/itinerary/from-delhi-taj-mahal-sunrise-and-agra-day-trip-by-car/ — sunrise / Taj / fort itinerary. Its Delhi pickup, VIP-style promises, prices and meal/ticket inclusions are **not** copied into our Agra-start tour.
- https://srmholidays.in/agra-city-sightseeing-tour-packages/ — half-day, full-day, Fatehpur Sikri, Mathura/Vrindavan, two-day and Bharatpur tour formats.
- https://srmholidays.in/agra/half-day-agra-tour/ — Taj + fort visit durations, Agra pickup and Friday closure.
- https://srmholidays.in/agra/taj-mahal-tour-with-fatehpur-sikri/ — early start, Taj / fort / Fatehpur order, travel and walking time.
- https://srmholidays.in/two-2-days-agra-sightseeing-tour-package-by-car/ — two-day heritage and Braj combinations. We separate destinations into realistic days instead of copying the crowded combined itinerary.

## Seed selection

| Package code | Duration | Why retained / planning constraint |
| --- | --- | --- |
| `taj-mahal-agra-fort-half-day` | 4–6 hours | Core two-monument visit, supported by SRM half-day route and reviewed marketplace products. |
| `agra-sightseeing` | 8–10 hours | Full city day: Taj, fort, Baby Taj; Mehtab Bagh only if daylight / closing time allows. |
| `taj-mahal-sunrise-tour` | 5–6 hours | Distinct early-morning intent. Starts in Agra, not an overnight drive from Delhi. |
| `baby-taj-mehtab-bagh-sunset` | 3–4 hours | A short afternoon / evening option for visitors who have already seen the Taj. Garden viewpoint, not Taj interior admission or a night-viewing ticket. |
| `fatehpur-sikri-from-agra` | 4–6 hours | Dedicated excursion for travelers whose Agra monuments are already covered. Allows for road travel, parking, shuttle and steps. |
| `taj-agra-fort-fatehpur-sikri` | 10–12 hours | Established three-site full-day format; no promise to add Baby Taj, Sikandra and sunset as well. |
| `mathura-vrindavan` | 10–12 hours | Dedicated Braj darshan from Agra. Temple windows and local transfers determine visit order. |
| `bharatpur-keoladeo-from-agra` | 8–10 hours | Reviewed seasonal nature excursion. Park time instead of an unrealistic Keoladeo + Deeg + Lohagarh circuit; no guaranteed species. |
| `agra-unhurried` | 2 days / 1 night | Existing overnight Agra format, pacing heritage visits across two days. No included hotel reservation. |
| `agra-mathura-vrindavan-two-days` | 2 days / 1 night | Established Agra + Braj combination, with a separate temple day rather than stacking every attraction in one afternoon. |

Evidence for the heritage and Braj itinerary types: [1](https://www.viator.com/en-IN/Agra-tours/City-Tours/d4547-g12-c5330) [4](https://www.viator.com/en-GB/Agra/d4547). Nature-trip evidence: [1](https://www.viator.com/en-HK/tours/Agra/Keoladeo-National-Park-Bharatpur-Admission-Ticket/d4547-26911P369).

Omitted: speculative long-distance two-day Himachal trips, duplicate Golden Triangle variants, unrelated Delhi/Jaipur city catalogs, compulsory shopping tours, unconfirmed train-ticket bundles and wildlife guarantees. Existing operator-managed database content is **not** deleted or archived by this seed.

## Photographs and licence audit

Eight real destination photographs are downloaded and locally hosted under `react/public/assets/packages/pexels/`. No AI-generated photography and no competitor image hotlinks are used in these packages. `react/src/data/package-photo-credits.json` records each actual Pexels photo ID, verified canonical photo-page URL, original download URL, photographer, licence, retrieval date, downloaded dimensions, file size and SHA-256.

Search-result landing pages sometimes pointed to a different photo. IDs were therefore taken from the **downloaded Pexels image URL** and checked against the corresponding Pexels photo page. The delivered files are WebP conversions of the available downloaded images (mostly 500px wide; Prem Mandir 960px), not full-resolution masters. They have not been artificially enlarged. Original download links are retained for future higher-resolution replacement when CDN access is available.

| Local asset | Pexels photo | Photographer |
| --- | --- | --- |
| `taj-mahal-12429714.webp` | https://www.pexels.com/photo/the-taj-mahal-in-india-12429714/ | Captured Moments |
| `taj-reflection-19149640.webp` | https://www.pexels.com/photo/pond-and-taj-mahal-behind-19149640/ | AXP Photography |
| `agra-fort-33928934.webp` | https://www.pexels.com/photo/historic-agra-fort-exterior-in-daylight-33928934/ | Ehaan Dewa |
| `fatehpur-sikri-9467805.webp` | https://www.pexels.com/photo/brown-concrete-building-under-blue-sky-9467805/ | shravan khare |
| `buland-darwaza-6264393.webp` | https://www.pexels.com/photo/jama-masjid-mosque-in-india-6264393/ | Shantanu Goyal |
| `baby-taj-16386146.webp` | https://www.pexels.com/photo/itmad-ud-daula-in-agra-16386146/ | AXP Photography |
| `prem-mandir-12429847.webp` | https://www.pexels.com/photo/the-prem-mandir-in-vrindavan-12429847/ | Captured Moments |
| `bharatpur-storks-6387604.webp` | https://www.pexels.com/photo/close-up-shot-of-birds-in-the-forest-6387604/ | Still Pixels |

Pexels licence: https://www.pexels.com/license/. Destination photos are identified as such, not represented as photos of our vehicles, customers or previously operated tours. The Taj image on the sunset package is explicitly **not** labeled as a photo taken from Mehtab Bagh. Photographer/source links appear in the customer catalog and detail pages.

## Pricing and booking safety

- `startingPriceInr: null`, `fleetPrices: {}`, `nightChargeInr: null`, no vehicle upgrades.
- The SQL inserts **content only** into existing `tour_packages`. It creates no `fare_rules`, dummy customers, operational bookings, payment records or test accounts.
- Unpriced detail pages have enquiry actions, no payable reservation, fake starting price, zero-price Schema.org offer or vehicle rate grid.
- An existing unpriced backend record cannot fall back to a legacy static fare. The existing quote engine also rejects missing vehicle fare rules.
- Admin create/edit accepts an unset starting fare, so adding itinerary content does not require a fabricated number. Valid configured monetary values remain positive integer INR.
- Quotes, confirmation of inclusions and applicable cancellation terms must precede payment. No borrowed VIP access, multilingual guide, ticket, hotel, meal or wait-time guarantees are made.

## Reproduce and apply

Canonical source: `backend/src/db/agra-packages.seed.json`.

```bash
npm run packages:sync                 # refresh offline package snapshot + additive SQL
npm run packages:check                # validate seed invariants and SQL generation
npm --prefix backend run seed:agra-packages           # dry run, no connection needed
npm --prefix backend run seed:agra-packages -- --apply # missing rows only, requires DATABASE_URL
```

For a database on the current schema, the targeted `--apply` command runs only `0057_curated_agra_packages.sql` in a transaction. The normal backend migration runner also applies that versioned migration. Both use `ON CONFLICT (code) DO NOTHING`: repeated runs do not create duplicates, and an existing operator-managed package with the same code (including configured prices) is left untouched. Restart / invalidate a running API's catalog cache and rebuild the customer site from the published manifest after applying.

No live database connection was present in this workspace, so the live database has **not** been modified. The in-memory development catalog and offline/pre-render snapshot are populated. The SQL and targeted dry run are ready for the configured production environment.

## Validation completed

- `npm run verify` passed: contract synchronization, all three TypeScript checks, site configuration, **433 backend tests**, **45 customer catalog tests**, **5 admin tests**, SEO lifecycle checks and production builds for all three applications.
- New regression coverage checks all ten unpriced records, photo hashes / Pexels attribution, public manifest and by-code itineraries, null-price normalization, empty-price admin API inputs, legacy demo-fare refusal, and quote / vehicle-option refusal when no vehicle fares are configured.
- The actual `0057` SQL was executed against the current `tour_packages` and `fare_rules` table definitions using temporary **PGlite (embedded PostgreSQL)**. A fresh database inserted 10 records, a repeated run inserted 0, and no fare rules were created. A separate test with an existing conflicting code inserted only 9; its original ID, content, draft status and fare rule remained unchanged on both runs. This is an isolated SQL validation, **not a live/production database application**.
- All 10 built detail HTML pages were inspected programmatically: researched itinerary stops, real Pexels attribution and locally present assets; no demo rating, payable tour-package booking link, advance token, `₹0` or unpriced `TouristTrip` offer.
- The development website and API were started with same-origin `/api` proxying. HTTP checks confirmed the package route, local WebP assets, preview-style host acceptance and a 10-package unpriced API manifest.
- A browser E2E / visual audit was **not run**: the repository's required Kane/browser environment is not available in this workspace. Static/HTTP checks are not a substitute for that audit.

`packages:check` intentionally validates the immutable seed and generated SQL, **not equality with the mutable live catalog snapshot**. `packages:sync` is an explicit offline-baseline refresh; normal release builds continue to use published API content as their authority.
