import type { InternalVehicleId, TripType } from "../../types/domain.js";
import type { RouteFare, VehicleSpec } from "./fare.catalogue.js";
import type { FareEngineInput } from "./fare.types.js";
import { StandardVehiclePricingStrategy } from "./calculators/route.calculator.js";
import { GroupCommercialVehicleStrategy } from "./calculators/commercial-group.calculator.js";

export { StandardVehiclePricingStrategy } from "./calculators/route.calculator.js";
export { GroupCommercialVehicleStrategy } from "./calculators/commercial-group.calculator.js";

export interface PricingStrategyContext {
  route: RouteFare;
  vehicleId: InternalVehicleId;
  spec: VehicleSpec;
  fareVersion: string;
  hasCustomRate?: boolean;
  minKmPerDay?: number;
  sameDayRoundMultiplier?: number;
  driverAllowance?: number;
  usePerKm?: boolean;
}

export interface PricingCalculationResult {
  effectiveTripType: TripType;
  baseFare: number;
  driverAllowance: number;
  distanceKm: number;
  billedKm: number;
  alwaysRoundTrip: boolean;
  roundMultiplierApplied: boolean;
  rules: string[];
  allowPromo: boolean;
}

export interface PricingStrategy {
  readonly name: string;
  isApplicable(vehicleTier: string): boolean;
  calculate(input: FareEngineInput, ctx: PricingStrategyContext): PricingCalculationResult;
}

/**
 * Strategy Registry & Dispatcher
 */
export class PricingEngineContext {
  private static instance: PricingEngineContext;
  private strategies: PricingStrategy[];

  constructor() {
    this.strategies = [
      new GroupCommercialVehicleStrategy(),
      new StandardVehiclePricingStrategy(),
    ];
  }

  public static getInstance(): PricingEngineContext {
    if (!PricingEngineContext.instance) {
      PricingEngineContext.instance = new PricingEngineContext();
    }
    return PricingEngineContext.instance;
  }

  public getStrategy(vehicleTier: string): PricingStrategy {
    const found = this.strategies.find((strategy) => strategy.isApplicable(vehicleTier));
    if (!found) {
      return new StandardVehiclePricingStrategy();
    }
    return found;
  }
}
