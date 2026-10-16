/**
 * @file fare.service.ts — Authoritative fare calculations and fleet pricing resolution.
 * @usage Used by FareController, BookingService, and Admin Fare API.
 */

import type { Repositories } from "../../db/types.js";
import {
  applyPromo,
  calculateFare,
  resolvePackageFleetPrice,
  type PackageFleetPriceResult,
} from "./fare.engine.js";
import { isGroupExceptionVehicle, PACKAGE_UPGRADES } from "./fare.catalogue.js";
import { calculateAdvanceAndBalance } from "./rules/advance.rules.js";
import { resolveFleet } from "./fleet/fleet.service.js";
import { resolveProductContext } from "./resolvers/product.resolver.js";
import { resolveTripDistanceKm } from "./resolvers/distance.resolver.js";
import { resolveDbPromo } from "./resolvers/promo.resolver.js";
import type {
  CalculateFareInput,
  FareEngineInput,
  FareEngineResult,
} from "./fare.types.js";
import type { PublicFleetVehicle } from "./fleet/fleet.types.js";
import type { VehicleTier } from "../../types/domain.js";
import type { TourPackageRecord } from "../../db/dossier-types.js";

export type { PublicFleetVehicle } from "./fleet/fleet.types.js";
export {
  resolvePackageFleetPrice,
  type PackageFleetPriceResult,
} from "./fare.engine.js";

/**
 * Service orchestrator for fare calculations and live fleet resolution.
 * Coordinates database product resolvers, distance resolution, promo lookups,
 * and delegates pure deterministic math to the FareEngine.
 */
export function createFareService(fareVersion: string, db?: Repositories) {
  return {
    /**
     * PUBLIC — returns the live fleet read from active database fare rules (with desk-side edits)
     * merged over static specifications.
     */
    async getFleet(): Promise<{ version: string; vehicles: PublicFleetVehicle[] }> {
      return resolveFleet(db, fareVersion);
    },

    /**
     * Server-authoritative fare calculation. Client-submitted prices and advances are completely ignored.
     */
    async calculate(input: CalculateFareInput): Promise<FareEngineResult> {
      // 1. Resolve product entities & active fare rules overrides
      const productCtx = await resolveProductContext(input, db, fareVersion);

      // 2. Resolve authoritative distance in km
      const distanceKm = resolveTripDistanceKm(
        input,
        productCtx.productDistanceKm,
        productCtx.catalogDistanceKm,
      );

      // 3. Resolve database promo code if present
      const promoContext = await resolveDbPromo(input.promoCode, db);

      const engineInput: FareEngineInput = {
        ...input,
        distanceKm,
        fareVersion: productCtx.effectiveVersion,
        ruleOverrides: productCtx.ruleOverrides,
        promoAllowGroupVehicles: promoContext.allowGroupVehicles,
      };

      // 4. Calculate fare via pure engine
      const resultWithoutPromoLookup = calculateFare({
        ...engineInput,
        promoCode: undefined,
      });

      if (
        !input.promoCode ||
        (isGroupExceptionVehicle(input.vehicleTier) && !promoContext.allowGroupVehicles)
      ) {
        return resultWithoutPromoLookup;
      }

      // 5. Re-apply validated database promo
      const subtotal =
        resultWithoutPromoLookup.baseFare +
        resultWithoutPromoLookup.nightAllowance +
        resultWithoutPromoLookup.driverAllowance;

      const promoEval = applyPromo(input.promoCode, subtotal, promoContext.lookup);
      const totalFare = Math.max(1, subtotal - promoEval.discount);
      const { advanceAmount, balanceAmount } = calculateAdvanceAndBalance(totalFare);

      return {
        ...resultWithoutPromoLookup,
        discountAmount: promoEval.discount,
        totalFare,
        advanceAmount,
        balanceAmount,
        promoCode: promoEval.valid ? promoEval.code : input.promoCode.trim().toUpperCase(),
        promoValid: promoEval.valid,
      };
    },

    /**
     * Synchronous calculation helper for isolated offline test flows.
     */
    calculateSync(input: CalculateFareInput): FareEngineResult {
      const distanceKm = resolveTripDistanceKm(input);
      return calculateFare({
        ...input,
        distanceKm,
        fareVersion: input.fareVersion ?? fareVersion,
      });
    },

    /**
     * Server-authoritative tour package fleet price resolver.
     * Guaranteed zero distance arithmetic and complete isolation from route per-km rates.
     */
    async resolvePackageFleetPrice(
      packageCodeOrId: string,
      fleetCode: VehicleTier,
    ): Promise<PackageFleetPriceResult> {
      let tourPkg: TourPackageRecord | null = null;
      let upgradeMap: Record<string, number> | undefined;

      if (db) {
        tourPkg =
          (await db.tourPackages.getById(packageCodeOrId)) ??
          (await db.tourPackages.getByCode(packageCodeOrId));
        if (!tourPkg && packageCodeOrId.includes("-tour")) {
          const alt = packageCodeOrId.replace(/-tour$/, "");
          tourPkg = (await db.tourPackages.getById(alt)) ?? (await db.tourPackages.getByCode(alt));
        } else if (!tourPkg) {
          const alt = `${packageCodeOrId}-tour`;
          tourPkg = (await db.tourPackages.getById(alt)) ?? (await db.tourPackages.getByCode(alt));
        }

        if (tourPkg) {
          const [globalUpgrades, pkgUpgrades] = await Promise.all([
            db.tourPackages.listUpgrades(null),
            db.tourPackages.listUpgrades(tourPkg.id),
          ]);
          upgradeMap = { ...PACKAGE_UPGRADES };
          for (const u of globalUpgrades) {
            upgradeMap[u.tierCode] = u.surchargeInr;
          }
          for (const u of pkgUpgrades) {
            upgradeMap[u.tierCode] = u.surchargeInr;
          }
        }
      }

      return resolvePackageFleetPrice(
        packageCodeOrId,
        fleetCode,
        tourPkg,
        upgradeMap,
      );
    },
  };
}
