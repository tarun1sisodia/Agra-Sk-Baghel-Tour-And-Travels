import {
  BookingEntryParams,
  CategoryCode,
} from "../../../contracts/fare-system.js";

export interface NormalizedBookingInitialState {
  category: CategoryCode;
  product: string;
  trip: "one_way" | "round_trip";
  date?: string;
  time?: string;
  return_date?: string;
  return_time?: string;
  pax: number;
  car?: string;
  src?: string;
  from?: string;
  to?: string;
}

/**
 * Normalizes query parameters from legacy links, campaign URLs, and deep links
 * into canonical BookingEntryParams and UI initial state.
 */
export function normalizeBookingUrlParams(
  searchParams: URLSearchParams
): NormalizedBookingInitialState {
  const rawCat = (
    searchParams.get("category") ||
    searchParams.get("type") ||
    ""
  ).toLowerCase();
  const rawTrip = (
    searchParams.get("trip") ||
    searchParams.get("tripType") ||
    searchParams.get("trip_type") ||
    ""
  ).toLowerCase();

  let category: CategoryCode = "outstation";
  if (rawCat === "local_package" || rawCat === "local" || rawTrip === "local") {
    category = "local_package";
  } else if (
    rawCat === "transfer" ||
    rawCat === "airport" ||
    rawTrip === "transfer" ||
    rawTrip === "airport-transfer"
  ) {
    category = "transfer";
  } else if (
    rawCat === "tour_package" ||
    rawCat === "package" ||
    rawTrip === "package"
  ) {
    category = "tour_package";
  } else if (rawCat === "outstation" || rawTrip === "outstation") {
    category = "outstation";
  }

  let trip: "one_way" | "round_trip" = "one_way";
  if (
    rawTrip.includes("round") ||
    searchParams.get("tripType") === "round-trip" ||
    searchParams.get("trip") === "round_trip" ||
    searchParams.get("roundtrip") === "true"
  ) {
    trip = "round_trip";
  }

  const paxRaw =
    searchParams.get("pax") ||
    searchParams.get("passengers") ||
    searchParams.get("passengerCount");
  const paxNum = paxRaw ? parseInt(paxRaw, 10) : NaN;
  const pax = !isNaN(paxNum) && paxNum > 0 ? paxNum : 2;

  const product = (
    searchParams.get("product") ||
    searchParams.get("package") ||
    searchParams.get("pkg") ||
    searchParams.get("route") ||
    searchParams.get("packageCode") ||
    ""
  ).trim();

  const from = (
    searchParams.get("from") ||
    searchParams.get("pickup") ||
    searchParams.get("source") ||
    ""
  ).trim();

  const to = (
    searchParams.get("to") ||
    searchParams.get("drop") ||
    searchParams.get("destination") ||
    ""
  ).trim();

  const car = (
    searchParams.get("car") ||
    searchParams.get("vehicle") ||
    searchParams.get("vehicle_model_id") ||
    ""
  ).trim();

  const dateParam = (
    searchParams.get("date") ||
    searchParams.get("pickupDate") ||
    ""
  ).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined;

  const timeParam = (
    searchParams.get("time") ||
    searchParams.get("pickupTime") ||
    ""
  ).trim();
  const time = /^\d{2}:\d{2}$/.test(timeParam) ? timeParam : undefined;

  const returnDateParam = (
    searchParams.get("return_date") ||
    searchParams.get("returnDate") ||
    ""
  ).trim();
  const return_date = /^\d{4}-\d{2}-\d{2}$/.test(returnDateParam)
    ? returnDateParam
    : undefined;

  const returnTimeParam = (
    searchParams.get("return_time") ||
    searchParams.get("returnTime") ||
    ""
  ).trim();
  const return_time = /^\d{2}:\d{2}$/.test(returnTimeParam)
    ? returnTimeParam
    : undefined;

  const src = (searchParams.get("src") || searchParams.get("utm_source") || "").trim() || undefined;

  return {
    category,
    product,
    trip,
    date,
    time,
    return_date,
    return_time,
    pax,
    car: car || undefined,
    src,
    from: from || undefined,
    to: to || undefined,
  };
}

/**
 * Builds canonical booking deep links conforming to BookingEntryParams.
 */
export function buildCanonicalBookingUrl(
  params: {
    category?: CategoryCode;
    product?: string;
    trip?: "one_way" | "round_trip";
    date?: string;
    time?: string;
    return_date?: string;
    return_time?: string;
    pax?: number;
    car?: string;
    src?: string;
    from?: string;
    to?: string;
  }
): string {
  const sp = new URLSearchParams();
  if (params.category) sp.set("category", params.category);
  if (params.product) sp.set("product", params.product);
  if (params.trip) sp.set("trip", params.trip);
  if (params.date) sp.set("date", params.date);
  if (params.time) sp.set("time", params.time);
  if (params.return_date) sp.set("return_date", params.return_date);
  if (params.return_time) sp.set("return_time", params.return_time);
  if (params.pax && params.pax !== 2) sp.set("pax", String(params.pax));
  if (params.car) sp.set("car", params.car);
  if (params.src) sp.set("src", params.src);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);

  const qs = sp.toString();
  return `/book.html${qs ? `?${qs}` : ""}`;
}
