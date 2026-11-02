import { AppError } from "../../../shared/errors.js";
import { roundRupees } from "../../../shared/money.js";
import { resolveTierKey } from "../../../contracts/vehicle-tiers.js";
import {
  PACKAGES,
  PACKAGE_UPGRADES,
  isGroupExceptionVehicle,
  toInternalVehicleId,
  type VehicleSpec,
} from "../fare.catalogue.js";
import type { FareEngineInput, FareRuleOverrides } from "../fare.types.js";
import type { VehicleTier } from "../../../types/domain.js";
import type { IntermediateFareCalculation } from "./calculator.types.js";
import type { TourPackageRecord } from "../../../db/dossier-types.js";
import { calculateAdvanceAndBalance } from "../rules/advance.rules.js";

export interface PackageFleetPriceResult {
  fleetCode: VehicleTier;
  packageCode: string;
  packageName: string;
  durationText: string;
  totalFare: number;
  advanceAmount: number;
  balanceAmount: number;
  pricingType: "fixed-package";
  priceSource: "tour_packages";
  rules: string[];
}

export function packageByIdOrSlug(id?: string): (typeof PACKAGES)[number] | undefined {
  if (!id) return undefined;
  const clean = id.trim().toLowerCase();
  const direct = PACKAGES.find((item) => item.id === clean || item.slug === clean);
  if (direct) return direct;
  const stripped = clean.replace(/-tour$/, "");
  return PACKAGES.find((item) => item.id === stripped || item.slug === stripped);
}

/**
 * Resolves tour package fixed pricing strictly from tour package definitions.
 *
 * SPECIFICATION (Section 5.2):
 * - Authority: tour_packages.fleet_prices[fleetCode] ?? starting_price_inr
 * - Total = tourPackageRow.fleet_prices[fleetCode] ?? (starting_price_inr + upgradeSurcharge)
 * - Advance = 28% rounded to ₹100, min ₹500 floor (capped at totalFare)
 * - Zero route distance arithmetic.
 */
export function resolvePackageFleetPrice(
  packageCodeOrId: string,
  fleetCode: VehicleTier,
  tourPackageRow?: Partial<TourPackageRecord> | null,
  upgradeSurcharges?: Record<string, number>,
): PackageFleetPriceResult {
  const row = tourPackageRow;
  const tierKey = toInternalVehicleId(fleetCode);

  let totalFare = 0;
  let packageName = "Tour Package";
  let durationText = "Tour Package";
  let packageCode = packageCodeOrId;
  const rules: string[] = ["package-fixed"];

  if (row) {
    if (row.packageCode) packageCode = row.packageCode;
    if (row.name) packageName = row.name;
    if (row.durationText) durationText = row.durationText;

    if (row.fleetPrices) {
      const hit = resolveTierKey(row.fleetPrices, fleetCode);
      if (typeof hit.value === "number" && hit.value > 0) {
        totalFare = hit.value;
        rules.push("dossier-admin-fleet-price");
      }
    }

    if (totalFare <= 0 && typeof row.startingPriceInr === "number" && row.startingPriceInr > 0) {
      const upgradeHit = resolveTierKey(upgradeSurcharges, fleetCode);
      const upgradeSurcharge = upgradeHit.value ?? PACKAGE_UPGRADES[tierKey] ?? 0;
      totalFare = row.startingPriceInr + upgradeSurcharge;
      rules.push("dossier-starting-price-upgrade");
    }
  }

  if (totalFare <= 0) {
    const pack = packageByIdOrSlug(packageCodeOrId);
    if (pack) {
      packageCode = pack.id;
      packageName = pack.name;
      durationText = pack.duration;
      const upgradeHit = resolveTierKey(upgradeSurcharges, fleetCode);
      const upgradeSurcharge = upgradeHit.value ?? PACKAGE_UPGRADES[tierKey] ?? 0;
      totalFare = pack.from + upgradeSurcharge;
      rules.push("catalog-fixed-package");
    }
  }

  if (totalFare <= 0) {
    throw new AppError(
      "TOUR_PACKAGE_NOT_FOUND",
      `Tour package "${packageCodeOrId}" not found or has no price for tier "${fleetCode}".`,
      404,
    );
  }

  const { advanceAmount, balanceAmount } = calculateAdvanceAndBalance(totalFare);

  return {
    fleetCode,
    packageCode,
    packageName,
    durationText,
    totalFare,
    advanceAmount,
    balanceAmount,
    pricingType: "fixed-package",
    priceSource: "tour_packages",
    rules,
  };
}

/**
 * Evaluates the dossier fare path with strict precedence per tier:
 * 1. Admin fleetPrices[tier] for dossier tour packages and fixed local/transfer prices
 * 2. startingPrice + upgrade surcharge when no fleet-specific price exists
 * 3. per-km only for routes and local-package extra-distance rules
 */
export function evaluateDossierTierBaseFare(input: {
  vehicleTier: VehicleTier;
  distanceKm: number;
  spec: { perKm: number };
  ruleOverrides?: FareRuleOverrides;
}): { baseFare: number; rule: string } | null {
  const overrides = input.ruleOverrides;
  if (!overrides) return null;
  const tierKey = toInternalVehicleId(input.vehicleTier);

  const hasDossierFields =
    overrides.fleetPrices !== undefined ||
    overrides.usePerKm !== undefined ||
    overrides.perKmRateOverride !== undefined ||
    overrides.upgradeSurcharges !== undefined ||
    overrides.packageBasePrice !== undefined;

  if (!hasDossierFields) return null;

  // Tour packages are always fixed-price by vehicle tier. Never fall through
  // to a per-km calculation for a tour package.
  if ((overrides.catalogItemType === "tour" || overrides.usePerKm === false) && overrides.fleetPrices) {
    const hit = resolveTierKey(overrides.fleetPrices, input.vehicleTier);
    const rawPrice = hit.value;
    if (typeof rawPrice === "number" && rawPrice > 0) {
      return { baseFare: rawPrice, rule: "dossier-admin-fleet-price" };
    }
  }

  // Fixed package fallback when a tier-specific fleet price is unavailable.
  if (
    (overrides.catalogItemType !== "ride" || overrides.usePerKm === false) &&
    typeof overrides.packageBasePrice === "number" &&
    overrides.packageBasePrice > 0
  ) {
    const upgradeHit = resolveTierKey(overrides.upgradeSurcharges, input.vehicleTier);
    const upgradeSurcharge = upgradeHit.value ?? PACKAGE_UPGRADES[tierKey] ?? 0;
    return {
      baseFare: overrides.packageBasePrice + upgradeSurcharge,
      rule: "dossier-starting-price-upgrade",
    };
  }

  // Precedence 3: per-km
  if (overrides.usePerKm === false) {
    throw new AppError(
      "TIER_NOT_PRICED",
      `No fixed price configured for tier "${input.vehicleTier}" on this route/package.`,
      400,
    );
  }
  const rate =
    typeof overrides.perKmRateOverride === "number" && overrides.perKmRateOverride > 0
      ? overrides.perKmRateOverride
      : input.spec.perKm;
  return {
    baseFare: roundRupees(rate * input.distanceKm),
    rule: "dossier-per-km-rate",
  };
}

/**
 * Calculates tour package pricing for heritage packages or dossier tour packages.
 * All 5 vehicle tiers use fixed package rates with zero route distance arithmetic.
 */
export function calculateTourPackageFare(
  input: FareEngineInput,
  _spec: VehicleSpec,
  fareVersion: string,
): IntermediateFareCalculation | null {
  const isForce = isGroupExceptionVehicle(input.vehicleTier);
  const pack = packageByIdOrSlug(input.packageId);
  const packageBasePrice = input.ruleOverrides?.packageBasePrice ?? pack?.from;
  const packageName = input.ruleOverrides?.packageName ?? pack?.name;
  const packageDuration = input.ruleOverrides?.packageDuration ?? pack?.duration;

  if (
    (pack || input.ruleOverrides?.packageBasePrice !== undefined) &&
    input.ruleOverrides?.catalogItemType !== "tour" &&
    input.ruleOverrides?.catalogItemType !== "ride"
  ) {
    const tierKey = toInternalVehicleId(input.vehicleTier);
    const upgradeHit = resolveTierKey(input.ruleOverrides?.upgradeSurcharges, input.vehicleTier);
    const upgradeSurcharge = upgradeHit.value ?? PACKAGE_UPGRADES[tierKey] ?? 0;
    const basePrice = packageBasePrice ?? 0;
    const baseFare = basePrice + upgradeSurcharge;

    return {
      tripType: input.tripType,
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: !isForce || Boolean(input.promoAllowGroupVehicles),
      fareVersion,
      baseFare,
      nightAllowance: 0,
      driverAllowance: input.ruleOverrides?.driverAllowance ?? 0,
      distanceKm: input.distanceKm,
      billedKm: input.distanceKm,
      alwaysRoundTrip: false,
      label: packageName ?? "Tour Package",
      duration: packageDuration ?? "Tour Package",
      roundMultiplierApplied: false,
      applyNight: false,
      rules: ["package-fixed", "vehicle-upgrade"],
      ruleOverrides: input.ruleOverrides,
    };
  }

  return null;
}
