import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCanonicalBookingUrl,
  normalizeBookingUrlParams,
} from "../src/features/booking/clean/urlNormalizer.ts";

test("normalizes category and field aliases with the documented defaults", () => {
  assert.deepEqual(
    normalizeBookingUrlParams(
      new URLSearchParams({
        serviceType: "airport",
        trip_type: "one_way",
        route: "delhi-airport",
        pickup: " Delhi ",
        destination: " IGI Airport ",
        vehicle: "sedan",
        utm_source: "google_ads",
        passengers: "4",
      })
    ),
    {
      category: "transfer",
      product: "delhi-airport",
      trip: "one_way",
      date: undefined,
      time: undefined,
      return_date: undefined,
      return_time: undefined,
      pax: 4,
      car: "sedan",
      src: "google_ads",
      from: "Delhi",
      to: "IGI Airport",
    }
  );

  assert.deepEqual(normalizeBookingUrlParams(new URLSearchParams()), {
    category: "outstation",
    product: "",
    trip: "one_way",
    date: undefined,
    time: undefined,
    return_date: undefined,
    return_time: undefined,
    pax: 2,
    car: undefined,
    src: undefined,
    from: undefined,
    to: undefined,
  });
});

test("recognizes the implemented category aliases", () => {
  const aliases: Array<[string, string]> = [
    ["local", "local_package"],
    ["localtour", "local_package"],
    ["local-tour", "local_package"],
    ["local_tour", "local_package"],
    ["transfers", "transfer"],
    ["airport", "transfer"],
    ["package", "tour_package"],
    ["packages", "tour_package"],
    ["tour", "tour_package"],
    ["tours", "tour_package"],
    ["outstation", "outstation"],
  ];

  for (const [alias, category] of aliases) {
    assert.equal(
      normalizeBookingUrlParams(new URLSearchParams({ category: alias })).category,
      category,
      `category alias ${alias}`
    );
  }

  assert.equal(
    normalizeBookingUrlParams(new URLSearchParams({ package: "goa-tour" })).category,
    "tour_package"
  );
  assert.equal(
    normalizeBookingUrlParams(new URLSearchParams({ trip: "local" })).category,
    "local_package"
  );
  assert.equal(
    normalizeBookingUrlParams(new URLSearchParams({ trip: "airport-transfer" })).category,
    "transfer"
  );
});

test("sanitizes malformed date, time, and passenger values", () => {
  const normalized = normalizeBookingUrlParams(
    new URLSearchParams({
      date: "01/02/2026",
      time: "9:30 AM",
      returnDate: "2026-01-02T00:00",
      returnTime: "noon",
      pax: "0",
    })
  );

  assert.equal(normalized.date, undefined);
  assert.equal(normalized.time, undefined);
  assert.equal(normalized.return_date, undefined);
  assert.equal(normalized.return_time, undefined);
  assert.equal(normalized.pax, 2);

  assert.equal(
    normalizeBookingUrlParams(new URLSearchParams({ passengerCount: "not-a-number" })).pax,
    2
  );
  assert.equal(
    normalizeBookingUrlParams(new URLSearchParams({ passengers: "3" })).pax,
    3
  );
});

test("normalizes round-trip aliases and return fields", () => {
  assert.deepEqual(
    normalizeBookingUrlParams(
      new URLSearchParams({
        service: "outstation",
        tripType: "round-trip",
        product: "goa-return",
        pickupDate: "2026-02-14",
        pickupTime: "08:30",
        returnDate: "2026-02-16",
        returnTime: "18:45",
        pax: "5",
        source: "Panaji",
        drop: "Mumbai",
        car: "suv",
        src: "partner",
      })
    ),
    {
      category: "outstation",
      product: "goa-return",
      trip: "round_trip",
      date: "2026-02-14",
      time: "08:30",
      return_date: "2026-02-16",
      return_time: "18:45",
      pax: 5,
      car: "suv",
      src: "partner",
      from: "Panaji",
      to: "Mumbai",
    }
  );

  assert.equal(
    normalizeBookingUrlParams(new URLSearchParams({ trip: "round_trip" })).trip,
    "round_trip"
  );
  assert.equal(
    normalizeBookingUrlParams(new URLSearchParams({ roundtrip: "true" })).trip,
    "round_trip"
  );
});

test("serializes a canonical one-way booking URL and omits the default pax", () => {
  assert.equal(
    buildCanonicalBookingUrl({
      category: "transfer",
      product: "delhi-airport",
      trip: "one_way",
      date: "2026-02-14",
      time: "08:30",
      pax: 2,
      car: "sedan",
      src: "google_ads",
      from: "New Delhi",
      to: "IGI Airport",
    }),
    "/book.html?category=transfer&product=delhi-airport&trip=one_way&date=2026-02-14&time=08%3A30&car=sedan&src=google_ads&from=New+Delhi&to=IGI+Airport"
  );
});

test("serializes all canonical round-trip fields in stable order", () => {
  assert.equal(
    buildCanonicalBookingUrl({
      category: "outstation",
      product: "goa-return",
      trip: "round_trip",
      date: "2026-02-14",
      time: "08:30",
      return_date: "2026-02-16",
      return_time: "18:45",
      pax: 5,
      car: "suv",
      src: "partner",
      from: "Panaji",
      to: "Mumbai",
    }),
    "/book.html?category=outstation&product=goa-return&trip=round_trip&date=2026-02-14&time=08%3A30&return_date=2026-02-16&return_time=18%3A45&pax=5&car=suv&src=partner&from=Panaji&to=Mumbai"
  );

  assert.equal(buildCanonicalBookingUrl({}), "/book.html");
});
