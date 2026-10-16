import { AppError } from "../../shared/errors.js";
import {
  FARE_RULES_VERSION_DEFAULT,
  isGroupExceptionVehicle,
  toInternalVehicleId,
  vehicleSpec,
} from "./fare.catalogue.js";
import { PricingEngineContext } from "./fare.strategy.js";
import { toCanonicalTierKey } from "../../contracts/vehicle-tiers.js";
import type { FareEngineInput, FareEngineResult } from "./fare.types.js";
import {
  evaluateDossierTierBaseFare,
  calculateTourPackageFare,
} from "./calculators/tour-package.calculator.js";
import { calculateAirportTransferFare } from "./calculators/transfer.calculator.js";
import { calculateLocalTourFare, calculateLocalRouteFare } from "./calculators/local-tour.calculator.js";
import { finalizeFare } from "./calculators/fare.finalizer.js";
import { assertPromoEligibleForVehicle } from "./rules/promo.rules.js";
import { findRoute, titleCase } from "./resolvers/route.resolver.js";

// Re-exports for public domain API & backward compatibility
export {
  calculateCancellationRefund,
  DEFAULT_CANCELLATION_SLABS,
  type CancellationPolicyType,
  type CancellationRefundResult,
  type CancellationPolicySlab,
} from "./cancellation.engine.js";

export { isNightPickup, getNightAllowanceForTier } from "./rules/night.rules.js";
export { applyPromo, assertPromoEligibleForVehicle } from "./rules/promo.rules.js";
export { calculateAdvanceAndBalance } from "./rules/advance.rules.js";
export { findRoute, estimateDistanceKm, perKmFares, titleCase } from "./resolvers/route.resolver.js";
export { evaluateDossierTierBaseFare } from "./calculators/tour-package.calculator.js";

/**
 * Pure fare engine orchestrator. No I/O.
 * Validates trip inputs and dispatches to specialized domain calculators:
 * - Dossier tier pricing (strict admin precedence)
 * - Tour package pricing (heritage & curated tours)
 * - Airport and station transfers
 * - Local sightseeing packages (8hr/80km, 12hr/120km)
 * - Outstation point-to-point & round-trip (standard fleet & group commercial exception)
 */
export function calculateFare(input: FareEngineInput): FareEngineResult {
  if (!Number.isFinite(input.distanceKm) || input.distanceKm <= 0) {
    throw new AppError("VALIDATION_ERROR", "Distance must be a positive finite number.", 400);
  }
  if (input.distanceKm > 5000) {
    throw new AppError("VALIDATION_ERROR", "Distance exceeds maximum allowed (5000 km).", 400);
  }
  if (input.returnDatetime) {
    const start = Date.parse(input.pickupDatetime);
    const end = Date.parse(input.returnDatetime);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      throw new AppError("INVALID_TRIP_DATES", "Return datetime must be at or after pickup datetime.", 400);
    }
    const diffDays = (end - start) / (24 * 60 * 60 * 1000);
    if (diffDays > 30) {
      throw new AppError("INVALID_TRIP_DATES", "Return cannot be more than 30 days after pickup.", 400);
    }
  }

  // Force commercial vehicles cannot use promo codes
  assertPromoEligibleForVehicle(input.vehicleTier, input.promoCode, input.promoAllowGroupVehicles);

  // Check vehicle availability from overrides
  const vehicleOverride = input.ruleOverrides?.vehicles?.find((v) => {
    const k = toCanonicalTierKey(String(v.tier ?? (v as any).id ?? ""));
    return k !== undefined && k === input.vehicleTier;
  });
  if (vehicleOverride?.active === false) {
    throw new AppError(
      "VEHICLE_UNAVAILABLE",
      `Vehicle tier "${input.vehicleTier}" is currently not available for booking.`,
      400,
    );
  }

  let spec = vehicleSpec(input.vehicleTier);
  let hasCustomRate = false;
  if (vehicleOverride && typeof vehicleOverride.perKm === "number" && vehicleOverride.perKm > 0) {
    spec = { ...spec, perKm: vehicleOverride.perKm };
    hasCustomRate = true;
  }

  const fareVersion = input.fareVersion ?? FARE_RULES_VERSION_DEFAULT;

  // 1. Dossier Authoritative Path: check dossier strict precedence per tier
  const dossierFare = evaluateDossierTierBaseFare({
    vehicleTier: input.vehicleTier,
    distanceKm: input.distanceKm,
    spec,
    ruleOverrides: input.ruleOverrides,
  });

  if (dossierFare) {
    const isAirport =
      input.ruleOverrides?.catalogItemType === "ride" ||
      input.tripType === "airport-transfer" ||
      input.localPackageKey === "airport-transfer";
    const isLocal =
      input.tripType === "local-tour" ||
      input.localPackageKey === "8hr-80km" ||
      input.localPackageKey === "12hr-120km";
    const isForce = isGroupExceptionVehicle(input.vehicleTier);

    let effectiveTripType = input.tripType;
    if (isAirport) effectiveTripType = "airport-transfer";
    else if (isLocal) effectiveTripType = "local-tour";

    const label =
      input.ruleOverrides?.packageName ??
      (isAirport ? "Airport / Station Transfer" : isLocal ? "Local Sightseeing Tour" : "Tour Package");
    const duration =
      input.ruleOverrides?.packageDuration ??
      (isAirport ? "Point to Point" : isLocal ? "Sightseeing Tour" : "Tour Package");

    return finalizeFare({
      tripType: effectiveTripType,
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: !isForce || Boolean(input.promoAllowGroupVehicles),
      fareVersion,
      baseFare: dossierFare.baseFare,
      nightAllowance: 0,
      driverAllowance:
        input.ruleOverrides?.driverAllowance !== undefined
          ? input.ruleOverrides.driverAllowance
          : isForce &&
            (input.ruleOverrides?.catalogItemType === "tour" ||
              input.ruleOverrides?.catalogItemType === "package")
          ? 500
          : 0,
      distanceKm: input.ruleOverrides?.catalogDistanceKm ?? input.distanceKm,
      billedKm: input.ruleOverrides?.catalogDistanceKm ?? input.distanceKm,
      alwaysRoundTrip: isForce && (input.ruleOverrides?.catalogDistanceKm ?? input.distanceKm) < 300,
      label,
      duration,
      roundMultiplierApplied: false,
      applyNight: true,
      rules: ["dossier-authoritative", dossierFare.rule],
      ruleOverrides: input.ruleOverrides,
    });
  }

  // 2. Heritage Tour Package Calculator
  const tourFare = calculateTourPackageFare(input, spec, fareVersion);
  if (tourFare) {
    return finalizeFare(tourFare);
  }

  // 3. Local Tour or Ride Catalog Offering with Desk Pricing
  if (
    (input.ruleOverrides?.catalogItemType === "tour" ||
      input.ruleOverrides?.catalogItemType === "ride") &&
    input.ruleOverrides.packageBasePrice !== undefined
  ) {
    if (input.ruleOverrides.catalogItemType === "ride" || input.tripType === "airport-transfer") {
      const transferRes = calculateAirportTransferFare(input, spec, fareVersion);
      if (transferRes) return finalizeFare(transferRes);
    } else {
      const localRes = calculateLocalTourFare(input, spec, fareVersion);
      if (localRes) return finalizeFare(localRes);
    }
  }

  // 4. Curated Local Packages (8hr-80km, 12hr-120km)
  const localPackageFare = calculateLocalTourFare(input, spec, fareVersion);
  if (localPackageFare) {
    return finalizeFare(localPackageFare);
  }

  // 5. Airport / Station Transfers
  const airportFare = calculateAirportTransferFare(input, spec, fareVersion);
  if (airportFare) {
    return finalizeFare(airportFare);
  }

  // 6. Corridor Route Lookup (One-Way, Round-Trip, or Local Route)
  const route = findRoute(input.originName, input.destinationName);
  const vehicleId = toInternalVehicleId(input.vehicleTier);
  const rules: string[] = [`route:${route.id}`];

  if (route.kind === "local") {
    return finalizeFare(calculateLocalRouteFare(input, route, fareVersion));
  }

  // 7. Outstation Route Strategy (Standard Fleet or Commercial Group Exception)
  const pricingContext = PricingEngineContext.getInstance();
  const strategy = pricingContext.getStrategy(input.vehicleTier);
  const calculation = strategy.calculate(input, {
    route,
    vehicleId,
    spec,
    fareVersion,
    hasCustomRate,
    minKmPerDay: input.ruleOverrides?.minKmPerDay,
    sameDayRoundMultiplier: input.ruleOverrides?.sameDayRoundMultiplier,
    driverAllowance: input.ruleOverrides?.driverAllowance,
    usePerKm: input.ruleOverrides?.usePerKm,
  });

  return finalizeFare({
    tripType: calculation.effectiveTripType,
    vehicleTier: input.vehicleTier,
    pickupDatetime: input.pickupDatetime,
    promoCode: input.promoCode,
    allowPromo: calculation.allowPromo || Boolean(input.promoAllowGroupVehicles),
    fareVersion,
    baseFare: calculation.baseFare,
    nightAllowance: 0,
    driverAllowance: calculation.driverAllowance,
    distanceKm: calculation.distanceKm,
    billedKm: calculation.billedKm,
    alwaysRoundTrip: calculation.alwaysRoundTrip,
    label: `${titleCase(input.originName)} → ${titleCase(input.destinationName)}`,
    duration: route.duration,
    roundMultiplierApplied: calculation.roundMultiplierApplied,
    applyNight: true,
    rules: [...rules, ...calculation.rules],
    ruleOverrides: input.ruleOverrides,
  });
}

/**
 * Strips client-supplied monetary fields to ensure zero client trust.
 */
export function ignoreClientMoney(body: Record<string, unknown>): void {
  delete body.totalFare;
  delete body.advanceAmount;
  delete body.balanceAmount;
  delete body.baseFare;
  delete body.amount;
  delete body.advance;
  delete body.amountMinor;
}
