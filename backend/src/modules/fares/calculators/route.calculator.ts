import { calendarDaysInclusiveIst } from "../../../shared/clock.js";
import { roundRupees } from "../../../shared/money.js";
import { OUTSTATION_RULES, isGroupExceptionVehicle } from "../fare.catalogue.js";
import type { FareEngineInput } from "../fare.types.js";
import type { PricingCalculationResult, PricingStrategy, PricingStrategyContext } from "../fare.strategy.js";

/**
 * Standard Pricing Strategy for Standard Passenger Fleet (Sedans, Ertigas, Innova Crystas).
 * Enforces:
 * - One-way catalogue rates
 * - Same-day round-trip multipliers (1.85x)
 * - Multi-day 300 km/day minimum floor
 * - Driver allowance ₹300/day for multi-day trips
 */
export class StandardVehiclePricingStrategy implements PricingStrategy {
  readonly name = "StandardVehiclePricingStrategy";

  isApplicable(vehicleTier: string): boolean {
    return !isGroupExceptionVehicle(vehicleTier);
  }

  calculate(input: FareEngineInput, ctx: PricingStrategyContext): PricingCalculationResult {
    const catalogFare = ctx.route.fares[ctx.vehicleId];
    const shouldUsePerKm = Boolean(ctx.hasCustomRate || ctx.usePerKm || input.ruleOverrides?.usePerKm);
    const billedDistance = shouldUsePerKm ? input.distanceKm : Math.max(input.distanceKm, ctx.route.km);
    const baseOneWayFare = shouldUsePerKm ? roundRupees(billedDistance * ctx.spec.perKm) : catalogFare;
    const rules: string[] = [];

    const minKmPerDay = ctx.minKmPerDay ?? OUTSTATION_RULES.minKmPerDay;
    const sameDayRoundMultiplier = ctx.sameDayRoundMultiplier ?? OUTSTATION_RULES.sameDayRoundMultiplier;

    if (input.tripType === "round-trip") {
      const days = calendarDaysInclusiveIst(input.pickupDatetime, input.returnDatetime);
      const minDayKmTotal = roundRupees(minKmPerDay * days * ctx.spec.perKm);
      const actualRound = roundRupees(Math.max(billedDistance, ctx.route.km) * (days > 1 ? 1 : 2) * ctx.spec.perKm);
      const standardRound = roundRupees(baseOneWayFare * sameDayRoundMultiplier);
      const dailyDriverAllowance = ctx.driverAllowance !== undefined ? ctx.driverAllowance * days : 300 * days;

      if (days > 1) {
        rules.push(`outstation-${minKmPerDay}km-per-day`, `days:${days}`);
        return {
          effectiveTripType: "round-trip",
          baseFare: Math.max(minDayKmTotal, actualRound),
          driverAllowance: dailyDriverAllowance,
          distanceKm: billedDistance,
          billedKm: billedDistance,
          alwaysRoundTrip: false,
          roundMultiplierApplied: false,
          rules,
          allowPromo: true,
        };
      } else {
        rules.push(`same-day-round-${sameDayRoundMultiplier}x`, `outstation-${minKmPerDay}km-per-day`);
        return {
          effectiveTripType: "round-trip",
          baseFare: Math.max(standardRound, minDayKmTotal),
          driverAllowance: 0,
          distanceKm: billedDistance,
          billedKm: billedDistance,
          alwaysRoundTrip: false,
          roundMultiplierApplied: true,
          rules,
          allowPromo: true,
        };
      }
    }

    // Default: Standard point-to-point / one-way
    return {
      effectiveTripType: input.tripType,
      baseFare: baseOneWayFare,
      driverAllowance: 0,
      distanceKm: billedDistance,
      billedKm: billedDistance,
      alwaysRoundTrip: false,
      roundMultiplierApplied: false,
      rules,
      allowPromo: true,
    };
  }
}
