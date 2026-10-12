/**
 * @file product.resolver.ts — Resolves canonical product entities across tour packages, routes, local tours, and transfers.
 * @usage Used by FareService and FareEngine to fetch server-authoritative rates and distances from PostgreSQL.
 */

import { resolveTierKey } from "../../../contracts/vehicle-tiers.js";
import type { RouteCatalogRecord } from "../../../db/route-catalog-types.js";
import type { Repositories } from "../../../db/types.js";
import { Errors } from "../../../shared/errors.js";
import { PACKAGE_UPGRADES, slugifyPlace } from "../fare.catalogue.js";
import type {
  CalculateFareInput,
  FareRuleOverrides,
  FareVehicleOverride,
} from "../fare.types.js";

export interface ResolvedProductContext {
  effectiveVersion: string;
  ruleOverrides: FareRuleOverrides;
  productDistanceKm?: number;
  catalogDistanceKm?: number;
}

/** Compatibility alias for backward compatibility during phased deployment */
export type ResolvedDossierContext = ResolvedProductContext;

/**
 * Resolves published product database entities across:
 * - tour_packages (fixed fleet prices, nights, upgrades)
 * - transfer_routes (airport/station transfers)
 * - local_packages (8hr-80km, 12hr-120km, extra rates)
 * - routes (corridor rates, tolls, driver charges)
 * - active fare_rules configuration
 *
 * @param input - Client fare request with trip type, coordinates, and optional package ID
 * @param db - Active database repositories
 * @param fallbackVersion - Default fare rule version if none found in DB
 * @returns Resolved fare rule overrides and corridor distance
 * @caller FareService.calculate
 * @destination RouteCalculator, TourPackageCalculator, LocalTourCalculator, TransferCalculator
 */
export async function resolveProductContext(
  input: CalculateFareInput,
  db?: Repositories,
  fallbackVersion: string = "2026-09-13",
): Promise<ResolvedProductContext> {
  let productFleetPrices: Record<string, number> | undefined;
  let productUsePerKm: boolean | undefined;
  let productPerKmRateOverride: number | null | undefined;
  let productNightChargeInr: number | undefined;
  let productNights: number | undefined;
  let productUpgradeSurcharges: Record<string, number> | undefined;
  let productNightHaltInr: number | undefined;
  let productDriverAllowance: number | undefined;
  let productMinKmPerDay: number | undefined;
  let productPackageName: string | undefined;
  let productPackageDuration: string | undefined;
  let productCatalogItemType: "package" | "tour" | "ride" | undefined;
  let productDistanceKm: number | undefined;
  let productPackageBasePrice: number | undefined;
  let productTollAmountInr: number | undefined;

  let catalogItem: any = null;

  if (db) {
    if (input.packageId) {
      catalogItem =
        (await db.catalog.getById(input.packageId)) ??
        (await db.catalog.getBySlug(input.packageId));
    }

    // 1. Tour packages
    if (input.packageId) {
      const tourPkg =
        (await db.tourPackages.getById(input.packageId)) ??
        (await db.tourPackages.getByCode(input.packageId));
      if (tourPkg && tourPkg.status === "published" && tourPkg.isActive) {
        productFleetPrices = tourPkg.fleetPrices;
        productNightChargeInr = tourPkg.nightChargeInr ?? undefined;
        productNights = tourPkg.nights;
        productPackageName = tourPkg.name;
        productPackageDuration = tourPkg.durationText;
        productPackageBasePrice = tourPkg.startingPriceInr ?? undefined;
        productCatalogItemType = "tour";
        productUsePerKm = false;
        productDistanceKm = tourPkg.days ? tourPkg.days * 300 : undefined;

        const [globalUpgrades, pkgUpgrades] = await Promise.all([
          db.tourPackages.listUpgrades(null),
          db.tourPackages.listUpgrades(tourPkg.id),
        ]);
        const upgradesMap: Record<string, number> = { ...PACKAGE_UPGRADES };
        for (const u of globalUpgrades) {
          upgradesMap[u.tierCode] = u.surchargeInr;
        }
        for (const u of pkgUpgrades) {
          upgradesMap[u.tierCode] = u.surchargeInr;
        }
        productUpgradeSurcharges = upgradesMap;
      }
    }

    // 2. Transfer routes
    if (
      !productFleetPrices &&
      (input.packageId ||
        input.localPackageKey === "airport-transfer" ||
        input.tripType === "airport-transfer")
    ) {
      const lookupCode =
        input.packageId ??
        (input.localPackageKey === "airport-transfer" ? "kheria-airport" : undefined);
      const xfer = lookupCode
        ? (await db.transferRoutes.getById(lookupCode)) ??
          (await db.transferRoutes.getByCode(lookupCode))
        : null;
      if (xfer && xfer.status === "published" && xfer.isActive) {
        productFleetPrices = xfer.fleetPrices;
        productUsePerKm = xfer.usePerKm ?? undefined;
        productNightChargeInr = xfer.nightChargeInr ?? undefined;
        productPackageName = xfer.name;
        productPackageDuration = xfer.distanceText ?? undefined;
        productCatalogItemType = "ride";
        productDistanceKm =
          xfer.distanceText && /\d+/.test(xfer.distanceText)
            ? parseInt(xfer.distanceText.match(/\d+/)![0], 10)
            : undefined;
      }
    }

    // 3. Local packages (8hr-80km / 12hr-120km)
    if (!productFleetPrices) {
      let localCode = input.packageId;
      if (!localCode) {
        if (input.localPackageKey === "8hr-80km") localCode = "agra-standard-sightseeing";
        else if (input.localPackageKey === "12hr-120km") localCode = "agra-extended-city-tour";
      }
      if (localCode) {
        const localPkg =
          (await db.localPackages.getById(localCode)) ??
          (await db.localPackages.getByCode(localCode));
        if (localPkg && localPkg.status === "published" && localPkg.isActive) {
          productFleetPrices = localPkg.fleetPrices;
          productUsePerKm = localPkg.usePerKm ?? undefined;
          const extraRateHit = resolveTierKey(localPkg.extraRates, input.vehicleTier);
          productPerKmRateOverride = extraRateHit.value?.per_km ?? undefined;
          productNightChargeInr = localPkg.nightChargeInr ?? undefined;
          productPackageName = localPkg.name;
          productPackageDuration = `${localPkg.durationHours} hrs / ${localPkg.includedKm} km`;
          productCatalogItemType = "package";
          productDistanceKm = localPkg.includedKm;
        }
      }
    }

    // 4. Intercity highway routes
    if (!productFleetPrices) {
      let routeRow: RouteCatalogRecord | null = null;
      if (input.packageId) {
        routeRow =
          (await db.routeCatalog.getById(input.packageId)) ??
          (await db.routeCatalog.getBySlug(input.packageId));
      }
      if (!routeRow && input.originName && input.destinationName) {
        const s = slugifyPlace(input.originName);
        const d = slugifyPlace(input.destinationName);
        const candidates = [
          `${s}-to-${d}-taxi`,
          `${s}-to-${d}`,
          `${s}-to-${d}-round-trip-taxi`,
          `${d}-to-${s}-taxi`,
          `${d}-to-${s}`,
          `${d}-to-${s}-round-trip-taxi`,
        ];
        for (const cand of candidates) {
          const found = await db.routeCatalog.getBySlug(cand);
          if (found) {
            routeRow = found;
            break;
          }
        }
      }
      if (routeRow && routeRow.status === "published" && !routeRow.needsReview) {
        productFleetPrices = routeRow.usePerKm ? undefined : routeRow.faresInr;
        productUsePerKm = routeRow.usePerKm ?? undefined;
        productNightHaltInr = routeRow.nightHaltInr ?? undefined;
        productDriverAllowance = routeRow.driverChargeInr ?? undefined;
        productMinKmPerDay = routeRow.minKmPerDay ?? undefined;
        productTollAmountInr = routeRow.tollIncluded ? undefined : (routeRow.tollAmountInr ?? undefined);
        productDistanceKm = routeRow.distanceKm ?? undefined;
        productPackageName = `${routeRow.sourceCity} to ${routeRow.destinationCity ?? ""}`;
        productPackageDuration = routeRow.durationText ?? undefined;
      }
    }
  }

  // Active fare rules configuration
  const activeRule = db ? await db.fareRules.getActive() : null;
  const effectiveVersion = activeRule?.version ?? fallbackVersion;
  const cfg = (activeRule?.config as Record<string, unknown>) || {};
  const outstationCfg =
    typeof cfg.outstation === "object" && cfg.outstation !== null
      ? (cfg.outstation as Record<string, unknown>)
      : {};

  const nightStartHour =
    typeof outstationCfg.nightStartHour === "number" ? outstationCfg.nightStartHour : undefined;
  const nightEndHour =
    typeof outstationCfg.nightEndHour === "number" ? outstationCfg.nightEndHour : undefined;

  let packageBasePrice: number | undefined;
  let packageName: string | undefined;
  let packageDuration: string | undefined;

  if (db && input.packageId && catalogItem) {
    if (catalogItem.status !== "published") {
      throw Errors.notFound("CATALOG_ITEM_NOT_FOUND", "Package is not available for booking.");
    }
    if (typeof catalogItem.startingPriceInr === "number" && catalogItem.startingPriceInr > 0) {
      packageBasePrice = catalogItem.startingPriceInr;
    }
    packageName = catalogItem.title;
    packageDuration = catalogItem.durationText;
  }

  const ruleOverrides: FareRuleOverrides = {
    vehicles: Array.isArray(cfg.vehicles) ? (cfg.vehicles as FareVehicleOverride[]) : undefined,
    minKmPerDay:
      productMinKmPerDay !== undefined && productMinKmPerDay > 0
        ? productMinKmPerDay
        : typeof outstationCfg.minKmPerDay === "number"
        ? outstationCfg.minKmPerDay
        : undefined,
    sameDayRoundMultiplier:
      typeof outstationCfg.sameDayRoundMultiplier === "number"
        ? outstationCfg.sameDayRoundMultiplier
        : undefined,
    nightAllowanceCab:
      typeof outstationCfg.nightAllowanceCab === "number" ? outstationCfg.nightAllowanceCab : undefined,
    nightAllowanceTempo:
      typeof outstationCfg.nightAllowanceTempo === "number" ? outstationCfg.nightAllowanceTempo : undefined,
    driverAllowance:
      productDriverAllowance !== undefined && productDriverAllowance > 0
        ? productDriverAllowance
        : typeof outstationCfg.driverAllowance === "number"
        ? outstationCfg.driverAllowance
        : undefined,
    packageBasePrice: productPackageBasePrice ?? packageBasePrice,
    packageName: productPackageName ?? packageName,
    packageDuration: productPackageDuration ?? packageDuration,
    catalogItemType:
      productCatalogItemType ??
      (catalogItem?.type === "package" || catalogItem?.type === "tour" || catalogItem?.type === "ride"
        ? catalogItem.type
        : undefined),
    catalogDistanceKm: productDistanceKm ?? catalogItem?.distanceKm ?? undefined,

    fleetPrices: productFleetPrices,
    usePerKm: productUsePerKm,
    perKmRateOverride: productPerKmRateOverride,
    nightChargeInr: productNightChargeInr,
    nights: productNights,
    upgradeSurcharges: productUpgradeSurcharges,
    nightHaltInr: productNightHaltInr,
    tollAmountInr: productTollAmountInr,

    nightStartHour,
    nightEndHour,

    ...input.ruleOverrides,
  };

  return {
    effectiveVersion,
    ruleOverrides,
    productDistanceKm,
    catalogDistanceKm: catalogItem?.distanceKm,
  };
}

/** Backward-compatible export alias */
export const resolveDossierContext = resolveProductContext;
