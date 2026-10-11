import type {
  QuoteRequest,
  QuoteResponse,
  OptionsRequest,
  OptionsResponse,
  VehicleGroupCode,
  OptionsGroupItem,
  OptionsVehicleItem,
} from "../../contracts/fare-system.js";
import {
  calculateOneWayOutstation,
  calculateRoundTripOutstation,
  calculateFixedProduct,
  calculateIstCalendarDays,
} from "../fare-engine/index.js";
import type { FareCatalogRepository } from "../fare-catalog/fare-catalog.repository.js";

const GROUP_ORDER: VehicleGroupCode[] = ["sedan", "suv", "luxury", "tempo_traveller"];

export class QuotesService {
  constructor(private repo: FareCatalogRepository) {}

  async quote(req: QuoteRequest): Promise<QuoteResponse> {
    const pickupDate = new Date(req.pickup_at);
    if (isNaN(pickupDate.getTime())) {
      throw new Error("VALIDATION_ERROR");
    }

    const settings = await this.repo.getFareSettings();
    const car = await this.repo.getVehicleModelById(req.vehicle_model_id);
    if (!car) {
      throw new Error("NOT_FOUND");
    }
    if (!car.is_active) {
      throw new Error("VEHICLE_NOT_AVAILABLE");
    }

    if (req.passenger_count > car.passenger_capacity) {
      throw new Error("CAPACITY_EXCEEDED");
    }

    const groups = await this.repo.getVehicleGroups();
    const group = groups.find((g) => g.code === car.group_code);
    if (!group || !group.is_active) {
      throw new Error("VEHICLE_NOT_AVAILABLE");
    }

    const extraCharges = await this.repo.getExtraCharges(req.category);

    if (req.category === "outstation") {
      const route = await this.repo.getOutstationRouteByIdOrCode(req.route_id);
      if (!route) {
        throw new Error("NOT_FOUND");
      }
      if (route.status !== "published") {
        throw new Error("PRODUCT_INACTIVE");
      }
      if (route.distance_km === null || route.duration_minutes === null) {
        throw new Error("PRODUCT_INACTIVE");
      }

      const routeVehicles = await this.repo.getOutstationRouteVehicles(route.id);
      const rv = routeVehicles.find((v) => v.vehicle_model_id === car.id);
      if (!rv || !rv.is_active) {
        throw new Error("VEHICLE_NOT_AVAILABLE");
      }

      if (req.trip_type === "one_way") {
        if (rv.one_way_amount === null || rv.one_way_amount <= 0) {
          throw new Error("VEHICLE_NOT_AVAILABLE");
        }
        return calculateOneWayOutstation({
          route: {
            id: route.id,
            distance_km: route.distance_km,
            duration_minutes: route.duration_minutes,
          },
          vehicle: {
            id: car.id,
            display_name: car.display_name,
            passenger_capacity: car.passenger_capacity,
            group_code: car.group_code,
          },
          routeVehicle: {
            one_way_amount: rv.one_way_amount,
            is_active: rv.is_active,
          },
          groupSettings: group,
          settings,
          pickup_at: req.pickup_at,
          extraCharges,
        });
      }

      if (req.trip_type === "round_trip") {
        if (!rv.round_trip_enabled) {
          throw new Error("VEHICLE_NOT_AVAILABLE");
        }
        if (!req.return_at) {
          throw new Error("VALIDATION_ERROR");
        }

        const fareRules = await this.repo.getFareRules("outstation");
        const rule = fareRules.find((r) => r.vehicle_model_id === car.id);
        if (!rule || rule.amount <= 0) {
          throw new Error("VEHICLE_NOT_AVAILABLE");
        }

        return calculateRoundTripOutstation({
          route: {
            id: route.id,
            distance_km: route.distance_km,
            duration_minutes: route.duration_minutes,
          },
          vehicle: {
            id: car.id,
            display_name: car.display_name,
            passenger_capacity: car.passenger_capacity,
            group_code: car.group_code,
          },
          routeVehicle: {
            round_trip_enabled: rv.round_trip_enabled,
            is_active: rv.is_active,
          },
          ratePerKm: rule.amount,
          groupSettings: group,
          settings,
          pickup_at: req.pickup_at,
          return_at: req.return_at,
          extraCharges,
        });
      }

      throw new Error("VALIDATION_ERROR");
    }

    if (req.category === "local_package") {
      const pkg = await this.repo.getLocalPackageByIdOrCode(req.local_package_id);
      if (!pkg) {
        throw new Error("NOT_FOUND");
      }
      if (pkg.status !== "published") {
        throw new Error("PRODUCT_INACTIVE");
      }

      const fareRules = await this.repo.getFareRules("local_package");
      const rule = fareRules.find(
        (r) => r.vehicle_model_id === car.id && r.local_package_id === pkg.id
      );
      if (!rule || rule.amount <= 0) {
        throw new Error("VEHICLE_NOT_AVAILABLE");
      }

      return calculateFixedProduct({
        category: "local_package",
        productId: pkg.id,
        vehicle: {
          id: car.id,
          display_name: car.display_name,
          passenger_capacity: car.passenger_capacity,
          group_code: car.group_code,
        },
        fixedAmount: rule.amount,
        advancePercent: settings.advance_percent,
        extraCharges,
      });
    }

    if (req.category === "transfer") {
      const transfer = await this.repo.getTransferByIdOrCode(req.transfer_id);
      if (!transfer) {
        throw new Error("NOT_FOUND");
      }
      if (transfer.status !== "published") {
        throw new Error("PRODUCT_INACTIVE");
      }

      const fareRules = await this.repo.getFareRules("transfer");
      const rule = fareRules.find(
        (r) => r.vehicle_model_id === car.id && r.transfer_id === transfer.id
      );
      if (!rule || rule.amount <= 0) {
        throw new Error("VEHICLE_NOT_AVAILABLE");
      }

      return calculateFixedProduct({
        category: "transfer",
        productId: transfer.id,
        vehicle: {
          id: car.id,
          display_name: car.display_name,
          passenger_capacity: car.passenger_capacity,
          group_code: car.group_code,
        },
        fixedAmount: rule.amount,
        advancePercent: settings.advance_percent,
        extraCharges,
      });
    }

    if (req.category === "tour_package") {
      const pkg = await this.repo.getTourPackageByIdOrCode(req.tour_package_id);
      if (!pkg) {
        throw new Error("NOT_FOUND");
      }
      if (pkg.status !== "published") {
        throw new Error("PRODUCT_INACTIVE");
      }

      const fareRules = await this.repo.getFareRules("tour_package");
      const rule = fareRules.find(
        (r) => r.vehicle_model_id === car.id && r.tour_package_id === pkg.id
      );
      if (!rule || rule.amount <= 0) {
        throw new Error("VEHICLE_NOT_AVAILABLE");
      }

      return calculateFixedProduct({
        category: "tour_package",
        productId: pkg.id,
        vehicle: {
          id: car.id,
          display_name: car.display_name,
          passenger_capacity: car.passenger_capacity,
          group_code: car.group_code,
        },
        fixedAmount: rule.amount,
        advancePercent: settings.advance_percent,
        extraCharges,
      });
    }

    throw new Error("VALIDATION_ERROR");
  }

  async options(req: OptionsRequest): Promise<OptionsResponse> {
    const allCars = await this.repo.getVehicleModels();
    const groups = await this.repo.getVehicleGroups();

    let productName = "";
    let productCode = "";
    let outstationRouteVehicles: any[] = [];
    let productInclusions: string[] = [];
    let productExclusions: string[] = [];

    if (req.category === "outstation") {
      const route = await this.repo.getOutstationRouteByIdOrCode(req.route_id);
      if (!route) throw new Error("NOT_FOUND");
      if (route.status !== "published") throw new Error("PRODUCT_INACTIVE");
      productName = `${route.origin_name} to ${route.destination_name}`;
      productCode = route.code;
      outstationRouteVehicles = await this.repo.getOutstationRouteVehicles(route.id);

      if (req.trip_type === "round_trip") {
        if (!req.return_at) throw new Error("VALIDATION_ERROR");
        const settings = await this.repo.getFareSettings();
        const days = calculateIstCalendarDays(req.pickup_at, req.return_at);
        if (days > settings.max_round_trip_days) {
          throw new Error("TRIP_TOO_LONG");
        }
      }
    } else if (req.category === "local_package") {
      const pkg = await this.repo.getLocalPackageByIdOrCode(req.local_package_id);
      if (!pkg) throw new Error("NOT_FOUND");
      if (pkg.status !== "published") throw new Error("PRODUCT_INACTIVE");
      productName = pkg.name;
      productCode = pkg.code;
      productInclusions = pkg.inclusions;
      productExclusions = pkg.exclusions;
    } else if (req.category === "transfer") {
      const transfer = await this.repo.getTransferByIdOrCode(req.transfer_id);
      if (!transfer) throw new Error("NOT_FOUND");
      if (transfer.status !== "published") throw new Error("PRODUCT_INACTIVE");
      productName = transfer.name;
      productCode = transfer.code;
      productInclusions = transfer.inclusions;
      productExclusions = transfer.exclusions;
    } else if (req.category === "tour_package") {
      const pkg = await this.repo.getTourPackageByIdOrCode(req.tour_package_id);
      if (!pkg) throw new Error("NOT_FOUND");
      if (pkg.status !== "published") throw new Error("PRODUCT_INACTIVE");
      productName = pkg.name;
      productCode = pkg.code;
      productInclusions = pkg.inclusions;
      productExclusions = pkg.exclusions;
    }

    // Filter cars by capacity and active state
    const eligibleCars = allCars.filter(
      (c) => c.is_active && req.passenger_count <= c.passenger_capacity
    );

    const vehicleMap = new Map<VehicleGroupCode, OptionsVehicleItem[]>();
    for (const gCode of GROUP_ORDER) {
      vehicleMap.set(gCode, []);
    }

    for (const car of eligibleCars) {
      try {
        const quoteReq = {
          ...req,
          vehicle_model_id: car.id,
        } as QuoteRequest;

        const quote = await this.quote(quoteReq);

        let inclusions: string[] = [];
        let exclusions: string[] = [];

        if (req.category === "outstation") {
          const rv = outstationRouteVehicles.find((v) => v.vehicle_model_id === car.id);
          const terms = rv?.terms ?? {};
          if (req.trip_type === "one_way" && terms.one_way) {
            inclusions = terms.one_way.inclusions ?? [];
            exclusions = terms.one_way.exclusions ?? [];
          } else if (req.trip_type === "round_trip" && terms.round_trip) {
            inclusions = terms.round_trip.inclusions ?? [];
            exclusions = terms.round_trip.exclusions ?? [];
          }
        } else {
          inclusions = productInclusions;
          exclusions = productExclusions;
        }

        vehicleMap.get(car.group_code)?.push({
          vehicle_model_id: car.id,
          display_name: car.display_name,
          passenger_capacity: car.passenger_capacity,
          luggage_capacity: car.luggage_capacity,
          image_url: car.image_url,
          quote,
          inclusions,
          exclusions,
        });
      } catch {
        // Car not offered or missing price - omit cleanly per spec §4
      }
    }

    const resultGroups: OptionsGroupItem[] = [];
    for (const gCode of GROUP_ORDER) {
      const cars = vehicleMap.get(gCode) ?? [];
      if (cars.length > 0) {
        const groupInfo = groups.find((g) => g.code === gCode);
        resultGroups.push({
          group_code: gCode,
          name: groupInfo?.name ?? gCode,
          vehicles: cars,
        });
      }
    }

    return {
      product: {
        category: req.category,
        code: productCode,
        name: productName,
      },
      groups: resultGroups,
    };
  }
}
