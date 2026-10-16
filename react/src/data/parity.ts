import { packages, routes, vehicles } from "./catalogue";

export function assertCatalogueInvariants(): void {
  // 1. Vehicle Invariants
  if (!vehicles || vehicles.length < 5) {
    throw new Error("Catalogue parity failed: expected at least five vehicles in fleet.");
  }

  const seenVehicleIds = new Set<string>();
  for (const v of vehicles) {
    if (!v.id || v.id.trim() === "") {
      throw new Error("Catalogue parity failed: vehicle must have a non-empty id.");
    }
    if (seenVehicleIds.has(v.id)) {
      throw new Error(`Catalogue parity failed: duplicate vehicle id "${v.id}".`);
    }
    seenVehicleIds.add(v.id);

    if (typeof v.perKm !== "number" || v.perKm <= 0) {
      throw new Error(`Catalogue parity failed: vehicle ${v.id} rate must be positive, got ${v.perKm}.`);
    }
    if (typeof v.seats !== "number" || v.seats <= 0) {
      throw new Error(`Catalogue parity failed: vehicle ${v.id} capacity must be positive, got ${v.seats}.`);
    }
  }

  // 2. Route Invariants
  if (!routes || routes.length === 0) {
    throw new Error("Catalogue parity failed: routes collection cannot be empty.");
  }

  const seenRouteIds = new Set<string>();
  const requiredVehicles = ["sedan", "ertiga", "innova", "tempo", "urbania"] as const;

  for (const r of routes) {
    // Unique slugs
    if (!r.id || r.id.trim() === "") {
      throw new Error("Catalogue parity failed: route must have a non-empty slug id.");
    }
    if (seenRouteIds.has(r.id)) {
      throw new Error(`Catalogue parity failed: duplicate route slug "${r.id}".`);
    }
    seenRouteIds.add(r.id);

    // Non-empty origin & destination
    if (!r.from || r.from.trim() === "") {
      throw new Error(`Catalogue parity failed: route "${r.id}" has empty "from" origin.`);
    }
    if (!r.to || r.to.trim() === "") {
      throw new Error(`Catalogue parity failed: route "${r.id}" has empty "to" destination.`);
    }

    // Distance must be positive
    if (typeof r.km !== "number" || r.km <= 0) {
      throw new Error(`Catalogue parity failed: route "${r.id}" distance must be positive, got ${r.km}.`);
    }

    // Valid kind
    if (!r.kind || (r.kind !== "one-way" && r.kind !== "local" && (r.kind as any) !== "round-trip")) {
      throw new Error(`Catalogue parity failed: route "${r.id}" has invalid kind "${r.kind}".`);
    }

    // Route pricing is partial by design: a vehicle without an active fare is
    // unavailable for that route. Validate supplied fares and require at least
    // one selectable fare so we do not fabricate pricing or publish a dead route.
    if (!r.fares || typeof r.fares !== "object") {
      throw new Error(`Catalogue parity failed: route "${r.id}" is missing fares object.`);
    }
    let validFareCount = 0;
    for (const vKey of requiredVehicles) {
      const fare: unknown = r.fares[vKey];
      if (fare === null || fare === undefined || fare === 0) continue;
      if (typeof fare !== "number" || !Number.isFinite(fare) || fare <= 0) {
        throw new Error(
          `Catalogue parity failed: route "${r.id}" vehicle "${vKey}" fare must be positive when supplied, got ${fare}.`
        );
      }
      validFareCount += 1;
    }
    if (validFareCount === 0) {
      throw new Error(`Catalogue parity failed: route "${r.id}" has no positive fare for any vehicle.`);
    }
  }

  // 3. Package Invariants
  if (!packages || packages.length === 0) {
    throw new Error("Catalogue parity failed: packages collection cannot be empty.");
  }

  const seenPackageIds = new Set<string>();
  const seenPackageSlugs = new Set<string>();

  for (const p of packages) {
    if (!p.id || p.id.trim() === "") {
      throw new Error("Catalogue parity failed: package must have a non-empty id.");
    }
    if (seenPackageIds.has(p.id)) {
      throw new Error(`Catalogue parity failed: duplicate package id "${p.id}".`);
    }
    seenPackageIds.add(p.id);

    if (!p.slug || p.slug.trim() === "") {
      throw new Error(`Catalogue parity failed: package "${p.id}" must have a non-empty slug.`);
    }
    if (seenPackageSlugs.has(p.slug)) {
      throw new Error(`Catalogue parity failed: duplicate package slug "${p.slug}".`);
    }
    seenPackageSlugs.add(p.slug);

    if (!p.name || p.name.trim() === "") {
      throw new Error(`Catalogue parity failed: package "${p.id}" must have a non-empty name.`);
    }

    if (typeof p.from !== "number" || p.from <= 0) {
      throw new Error(`Catalogue parity failed: package "${p.id}" starting price must be positive, got ${p.from}.`);
    }
  }
}
