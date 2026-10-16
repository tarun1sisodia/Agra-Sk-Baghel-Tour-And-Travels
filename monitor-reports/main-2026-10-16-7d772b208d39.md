# Main branch verification — 7d772b208d39

- **Result:** FAIL
- **Commit:** [7d772b208d39951f4c351373c873220c4a26e63b](https://github.com/tarun1sisodia/ArenaAI/commit/7d772b208d39951f4c351373c873220c4a26e63b)
- **Checked at:** 2026-10-16T18:41:11Z
- **Workflow run:** [38949097610](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38949097610)

## Changed files

- M	backend/src/modules/quotes/quotes.service.ts
- M	backend/tests/unit/admin-fare.test.ts
- M	backend/tests/unit/quotes.service.test.ts
- M	react/package.json
- A	react/scripts/booking-date-time.test.ts
- M	react/src/features/booking/clean/CleanBookingPage.tsx
- M	react/src/features/booking/clean/dateTime.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/bookings-payments.test.ts[2m > [22mSection 12.12: Booking and payment (BK-01 to PM-10)[2m > [22mPM-06: Invalid signature -> rejected; no state change
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.quote src/modules/quotes/quotes.service.ts:[2m43:29[22m[39m
[90m [2m❯[22m BookingsService.createBooking src/modules/bookings/bookings.service.ts:[2m21:49[22m[39m
[90m [2m❯[22m tests/unit/bookings-payments.test.ts:[2m670:43[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/bookings-payments.test.ts[2m > [22mSection 12.12: Booking and payment (BK-01 to PM-10)[2m > [22mPM-08: Webhook after the booking was cancelled -> payment needs_review; booking stays cancelled
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.quote src/modules/quotes/quotes.service.ts:[2m43:29[22m[39m
[90m [2m❯[22m BookingsService.createBooking src/modules/bookings/bookings.service.ts:[2m21:49[22m[39m
[90m [2m❯[22m tests/unit/bookings-payments.test.ts:[2m724:43[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/bookings-payments.test.ts[2m > [22mSection 12.12: Booking and payment (BK-01 to PM-10)[2m > [22mPM-09: Create payment for a booking not in pending_payment -> INVALID_STATE
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.quote src/modules/quotes/quotes.service.ts:[2m43:29[22m[39m
[90m [2m❯[22m BookingsService.createBooking src/modules/bookings/bookings.service.ts:[2m21:49[22m[39m
[90m [2m❯[22m tests/unit/bookings-payments.test.ts:[2m763:43[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/bookings-payments.test.ts[2m > [22mSection 12.12: Booking and payment (BK-01 to PM-10)[2m > [22mPM-10: 'Failed' webhook -> payment failed; booking stays pending_payment; a new payment can be created
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.quote src/modules/quotes/quotes.service.ts:[2m43:29[22m[39m
[90m [2m❯[22m BookingsService.createBooking src/modules/bookings/bookings.service.ts:[2m21:49[22m[39m
[90m [2m❯[22m tests/unit/bookings-payments.test.ts:[2m779:43[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/property-matrix.test.ts[2m > [22mSection 12.18: Property and matrix tests (PR-01 to PR-11)[2m > [22mPR-01: Generated over every car × every published product × trip type × 1–5 days: total = sum(lines), integers, advance <= total, balance = total - advance
[31m[1mAssertionError[22m: expected [ 'VEHICLE_NOT_AVAILABLE', …(2) ] to include 'VALIDATION_ERROR'[39m
[36m [2m❯[22m tests/unit/property-matrix.test.ts:[2m365:78[22m[39m
    [90m363| [39m        } [35mcatch[39m (e[33m:[39m any) {
    [90m364| [39m          // If vehicle is not enabled for this route, it's expected n…
    [90m365| [39m          expect(["VEHICLE_NOT_AVAILABLE", "NOT_FOUND", "PRODUCT_INACT…
    [90m   | [39m                                                                             [31m^[39m
    [90m366| [39m        }
    [90m367| [39m      }

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/property-matrix.test.ts[2m > [22mSection 12.18: Property and matrix tests (PR-01 to PR-11)[2m > [22mPR-02: Same request and data give an identical response twice (determinism)
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.quote src/modules/quotes/quotes.service.ts:[2m43:29[22m[39m
[90m [2m❯[22m tests/unit/property-matrix.test.ts:[2m440:36[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/property-matrix.test.ts[2m > [22mSection 12.18: Property and matrix tests (PR-01 to PR-11)[2m > [22mPR-04: Round trip: with max_round_trip_days raised (1 to 5 days), more days never lowers the fare
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.quote src/modules/quotes/quotes.service.ts:[2m43:29[22m[39m
[90m [2m❯[22m tests/unit/property-matrix.test.ts:[2m489:37[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[19/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/property-matrix.test.ts[2m > [22mSection 12.18: Property and matrix tests (PR-01 to PR-11)[2m > [22mPR-05: Round-trip fare is never below 300 × days × ₹/km
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.quote src/modules/quotes/quotes.service.ts:[2m43:29[22m[39m
[90m [2m❯[22m tests/unit/property-matrix.test.ts:[2m514:37[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[20/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/property-matrix.test.ts[2m > [22mSection 12.18: Property and matrix tests (PR-01 to PR-11)[2m > [22mPR-06: Changing the return time within the same IST date never changes the fare
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.quote src/modules/quotes/quotes.service.ts:[2m43:29[22m[39m
[90m [2m❯[22m tests/unit/property-matrix.test.ts:[2m541:23[22m[39m
[90m [2m❯[22m tests/unit/property-matrix.test.ts:[2m540:13[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[21/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/property-matrix.test.ts[2m > [22mSection 12.18: Property and matrix tests (PR-01 to PR-11)[2m > [22mPR-09: Matrix: every car × every product × trip type: quote exists iff rules met
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.quote src/modules/quotes/quotes.service.ts:[2m43:29[22m[39m
[90m [2m❯[22m tests/unit/property-matrix.test.ts:[2m617:39[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[22/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/property-matrix.test.ts[2m > [22mSection 12.18: Property and matrix tests (PR-01 to PR-11)[2m > [22mPR-10: Every quote total equals what the booking stores and what payment charges (advance × 100) end to end
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.quote src/modules/quotes/quotes.service.ts:[2m43:29[22m[39m
[90m [2m❯[22m tests/unit/property-matrix.test.ts:[2m652:39[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[23/24]⎯[22m[39m

[41m[1m FAIL [22m[49m tests/unit/property-matrix.test.ts[2m > [22mSection 12.18: Property and matrix tests (PR-01 to PR-11)[2m > [22mPR-11: POST /quotes/options and POST /quotes agree for every car in every case above
[31m[1mError[22m: VALIDATION_ERROR[39m
[36m [2m❯[22m QuotesService.validatePickupAt src/modules/quotes/quotes.service.ts:[2m29:13[22m[39m
    [90m 27| [39m    [35mconst[39m pickupDate [33m=[39m [35mnew[39m [33mDate[39m(pickupAt)[33m;[39m
    [90m 28| [39m    if (!Number.isFinite(pickupDate.getTime()) || pickupDate.getTime()…
    [90m 29| [39m      [35mthrow[39m [35mnew[39m [33mError[39m([32m"VALIDATION_ERROR"[39m)[33m;[39m
    [90m   | [39m            [31m^[39m
    [90m 30| [39m    }
    [90m 31| [39m    [35mreturn[39m pickupDate[33m;[39m
[90m [2m❯[22m QuotesService.options src/modules/quotes/quotes.service.ts:[2m259:29[22m[39m
[90m [2m❯[22m tests/unit/property-matrix.test.ts:[2m686:41[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[24/24]⎯[22m[39m


[2m Test Files [22m [1m[31m2 failed[39m[22m[2m | [22m[1m[32m17 passed[39m[22m[90m (19)[39m
[2m      Tests [22m [1m[31m24 failed[39m[22m[2m | [22m[1m[32m281 passed[39m[22m[90m (305)[39m
[2m   Start at [22m 18:41:00
[2m   Duration [22m 10.97s[2m (transform 982ms, setup 0ms, collect 2.97s, tests 4.78s, environment 3ms, prepare 1.00s)[22m

```
