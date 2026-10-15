import type {
  PublishedCatalogResponse,
  PublishedProductSummary,
} from "../../contracts/fare-system.js";

export type BookingMode = "oneway" | "round" | "local";
export type CanonicalVehicleGroupCode = "sedan" | "suv" | "luxury" | "tempo_traveller";

export type IconName =
  | "car"
  | "swap"
  | "pin"
  | "calendar"
  | "sedan"
  | "van"
  | "bus"
  | "shield"
  | "rupee"
  | "clock"
  | "support"
  | "arrow";

export interface VehicleGroupOption {
  code: CanonicalVehicleGroupCode;
  label: string;
  icon: IconName;
  defaultSub: string;
}

export const CANONICAL_VEHICLE_GROUPS: VehicleGroupOption[] = [
  { code: "sedan", label: "Sedan", icon: "sedan", defaultSub: "Dzire / Etios" },
  { code: "suv", label: "SUV", icon: "car", defaultSub: "Ertiga / Crysta" },
  { code: "luxury", label: "Luxury", icon: "car", defaultSub: "BMW / Mercedes" },
  { code: "tempo_traveller", label: "Tempo", icon: "bus", defaultSub: "12-26 Seater" },
];

export interface ActiveVehicleGroup {
  code: CanonicalVehicleGroupCode;
  label: string;
  icon: IconName;
  defaultSub: string;
  modelCount: number;
}

export interface PublishedLocalTour {
  id: string;
  code: string;
  name: string;
  durationText: string;
  covers?: string;
  description?: string;
  image: string;
  startingPrice: number | null;
}

export interface ParsedRoute {
  id: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm?: number | null;
  startingPrice?: number | null;
}

/**
 * Derives active vehicle groups strictly from live catalog data.
 * A group is only active if it exists in catalog.groups AND has active models in catalog.vehicles.
 * If catalog is null, empty, or failed, returns [].
 */
export function deriveActiveVehicleGroups(
  catalog: PublishedCatalogResponse | null
): ActiveVehicleGroup[] {
  if (!catalog || !catalog.groups || catalog.groups.length === 0) {
    return [];
  }
  const activeVehicles = catalog.vehicles || [];

  return catalog.groups
    .map((g) => {
      const code = g.group_code as CanonicalVehicleGroupCode;
      const models = activeVehicles.filter((v) => v.group_code === code);
      const matched = CANONICAL_VEHICLE_GROUPS.find((cg) => cg.code === code);
      const modelNames = models
        .map((m) => m.display_name || m.model_name)
        .slice(0, 2)
        .join(" / ");

      return {
        code,
        label: g.name || matched?.label || code,
        icon: (code === "sedan" ? "sedan" : code === "tempo_traveller" ? "bus" : "car") as IconName,
        defaultSub: modelNames || matched?.defaultSub || "Commercial Fleet",
        modelCount: models.length,
      };
    })
    .filter((g) => g.modelCount > 0);
}

/**
 * Parses route cities strictly from the product's published name and code.
 * Does NOT fall back to static city names (e.g. Agra/Delhi) when missing.
 */
export function parseRouteCities(route: PublishedProductSummary): ParsedRoute {
  const parts = route.name.split(/\s+to\s+/i);
  let origin = (parts[0] || "").trim();
  let destination = (parts[1] || "").trim();

  if (!destination && route.code.includes("-to-")) {
    const codeParts = route.code.split("-to-");
    origin = codeParts[0].charAt(0).toUpperCase() + codeParts[0].slice(1);
    destination = codeParts[1].charAt(0).toUpperCase() + codeParts[1].slice(1);
  }

  return {
    id: route.id,
    code: route.code,
    name: route.name,
    origin,
    destination,
    distanceKm: route.distance_km,
    startingPrice: route.starting_price_inr,
  };
}

/**
 * Finds matching outstation route for an origin and destination.
 * Returns null if no exact or normalized corridor match is found.
 */
export function findMatchingOutstationRoute(
  routes: ParsedRoute[],
  origin: string,
  destination: string
): ParsedRoute | null {
  const o = origin.trim().toLowerCase();
  const d = destination.trim().toLowerCase();
  if (!o || !d) return null;

  return (
    routes.find(
      (r) => r.origin.toLowerCase() === o && r.destination.toLowerCase() === d
    ) ||
    routes.find((r) => {
      const code = r.code.toLowerCase();
      return code === `${o}-to-${d}` || code === `${o}-${d}`;
    }) ||
    null
  );
}

export interface CustomEnquiryParams {
  origin: string;
  destination: string;
  mode: BookingMode;
  pickupDate: string;
  returnDate?: string;
  selectedVehicle?: string;
  whatsappNumber?: string;
}

export function buildCustomEnquiryHref({
  origin,
  destination,
  mode,
  pickupDate,
  returnDate,
  selectedVehicle,
}: CustomEnquiryParams): string {
  const trip = mode === "round" ? "round_trip" : "one_way";
  const params = new URLSearchParams({
    serviceType: "custom_route",
    from: origin.trim(),
    to: destination.trim(),
    trip,
    date: pickupDate,
  });
  if (mode === "round" && returnDate) {
    params.set("return_date", returnDate);
  }
  if (selectedVehicle) {
    params.set("car", selectedVehicle);
  }
  return `/contact.html?${params.toString()}`;
}

export function buildWhatsAppCustomEnquiryHref({
  origin,
  destination,
  mode,
  pickupDate,
  returnDate,
  selectedVehicle,
  whatsappNumber,
}: CustomEnquiryParams): string {
  const tripText = mode === "round" ? "Round Trip" : "One Way";
  const num = whatsappNumber || "919762817598";
  const msg = `Hello Agra SK Baghel Tour and Travels, I am looking for a custom route from ${origin.trim()} to ${destination.trim()} (${tripText}, Travel Date: ${pickupDate}${mode === "round" && returnDate ? `, Return: ${returnDate}` : ""}, Vehicle Class: ${selectedVehicle || "Sedan"}). Please provide availability and fare quotation.`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

export interface BookingHrefParams {
  mode: BookingMode;
  origin: string;
  destination: string;
  matchedRoute: ParsedRoute | null;
  localTourCode?: string;
  selectedVehicle: string;
  pickupDate: string;
  returnDate?: string;
}

/**
 * Builds the booking handoff URL.
 * NEVER outputs an empty product parameter for outstation routes.
 * If unmatched, returns the custom enquiry URL.
 */
export function buildBookingHref({
  mode,
  origin,
  destination,
  matchedRoute,
  localTourCode,
  selectedVehicle,
  pickupDate,
  returnDate,
}: BookingHrefParams): string {
  if (mode === "local") {
    const tourCode = localTourCode || "taj-agra-day-tour";
    const params = new URLSearchParams({
      category: "local_package",
      product: tourCode,
      trip: "one_way",
      car: selectedVehicle,
      date: pickupDate,
    });
    return `/book.html?${params.toString()}`;
  }

  // Outstation mode
  if (!matchedRoute) {
    return buildCustomEnquiryHref({
      origin,
      destination,
      mode,
      pickupDate,
      returnDate,
      selectedVehicle,
    });
  }

  const trip = mode === "round" ? "round_trip" : "one_way";
  const params = new URLSearchParams({
    category: "outstation",
    trip,
    product: matchedRoute.code,
    from: origin.trim(),
    to: destination.trim(),
    car: selectedVehicle,
    date: pickupDate,
  });
  if (mode === "round" && returnDate) {
    params.set("return_date", returnDate);
  }
  return `/book.html?${params.toString()}`;
}
