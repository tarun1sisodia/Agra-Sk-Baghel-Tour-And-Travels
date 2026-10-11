import type pg from "pg";
import type { CategoryCode, VehicleGroupCode } from "../../contracts/fare-system.js";

export interface VehicleGroupEntity {
  id: string;
  code: VehicleGroupCode;
  name: string;
  driver_allowance_per_day: number;
  one_way_night_charge: number;
  round_trip_halt_per_night: number;
  sort_order: number;
  is_active: boolean;
}

export interface VehicleModelEntity {
  id: string;
  vehicle_group_id: string;
  group_code: VehicleGroupCode;
  group_name: string;
  make: string;
  model_name: string;
  display_name: string;
  passenger_capacity: number;
  luggage_capacity: number | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface OutstationRouteEntity {
  id: string;
  code: string;
  origin_name: string;
  destination_name: string;
  distance_km: number | null;
  duration_minutes: number | null;
  description: string | null;
  image_url: string | null;
  gallery: unknown[];
  status: "draft" | "published" | "archived";
  created_at: string;
}

export interface OutstationRouteVehicleEntity {
  id: string;
  route_id: string;
  vehicle_model_id: string;
  one_way_amount: number | null;
  round_trip_enabled: boolean;
  terms: {
    one_way?: { inclusions: string[]; exclusions: string[] };
    round_trip?: { inclusions: string[]; exclusions: string[] };
  };
  sort_order: number;
  is_active: boolean;
}

export interface LocalPackageEntity {
  id: string;
  code: string;
  name: string;
  duration_hours: number | null;
  included_km: number | null;
  covers: string | null;
  description: string | null;
  inclusions_highlight: string | null;
  inclusions_note: string | null;
  image_url: string | null;
  gallery: unknown[];
  inclusions: string[];
  exclusions: string[];
  status: "draft" | "published" | "archived";
  created_at: string;
}

export interface TransferEntity {
  id: string;
  code: string;
  name: string;
  pickup_name: string;
  drop_name: string;
  description: string | null;
  inclusions_highlight: string | null;
  inclusions_note: string | null;
  image_url: string | null;
  gallery: unknown[];
  inclusions: string[];
  exclusions: string[];
  status: "draft" | "published" | "archived";
  created_at: string;
}

export interface TourPackageEntity {
  id: string;
  code: string;
  name: string;
  duration_text: string;
  days: number;
  nights: number;
  source: string;
  destination: string;
  description: string | null;
  inclusions_highlight: string | null;
  inclusions_note: string | null;
  image_url: string | null;
  gallery: unknown[];
  inclusions: string[];
  exclusions: string[];
  itinerary: unknown[];
  status: "draft" | "published" | "archived";
  created_at: string;
}

export interface FareRuleEntity {
  id: string;
  category: CategoryCode;
  vehicle_model_id: string;
  local_package_id: string | null;
  transfer_id: string | null;
  tour_package_id: string | null;
  amount: number;
  is_active: boolean;
}

export interface ExtraChargeEntity {
  id: string;
  category: CategoryCode;
  vehicle_group_id: string | null;
  vehicle_group_code?: VehicleGroupCode | null;
  route_id: string | null;
  local_package_id: string | null;
  transfer_id: string | null;
  tour_package_id: string | null;
  label: string;
  amount: number | null;
  is_active: boolean;
}

export interface FareSettingsMap {
  advance_percent: number;
  min_km_per_day: number;
  max_round_trip_days: number;
  night_start_hour: number;
  night_end_hour: number;
}

export class FareCatalogRepository {
  constructor(private pool: pg.Pool) {}

  async getFareSettings(): Promise<FareSettingsMap> {
    const res = await this.pool.query("SELECT key, value FROM fare_settings");
    const map: Record<string, number> = {};
    for (const r of res.rows) {
      map[r.key] = Number(r.value);
    }

    if (
      map.advance_percent === undefined ||
      map.min_km_per_day === undefined ||
      map.max_round_trip_days === undefined ||
      map.night_start_hour === undefined ||
      map.night_end_hour === undefined
    ) {
      throw new Error("SETTINGS_MISSING");
    }

    return {
      advance_percent: map.advance_percent,
      min_km_per_day: map.min_km_per_day,
      max_round_trip_days: map.max_round_trip_days,
      night_start_hour: map.night_start_hour,
      night_end_hour: map.night_end_hour,
    };
  }

  async getVehicleGroups(): Promise<VehicleGroupEntity[]> {
    const res = await this.pool.query(
      "SELECT id, code, name, driver_allowance_per_day, one_way_night_charge, round_trip_halt_per_night, sort_order, is_active FROM vehicle_groups ORDER BY sort_order ASC, name ASC"
    );
    return res.rows.map((r) => ({
      ...r,
      driver_allowance_per_day: Number(r.driver_allowance_per_day),
      one_way_night_charge: Number(r.one_way_night_charge),
      round_trip_halt_per_night: Number(r.round_trip_halt_per_night),
      sort_order: Number(r.sort_order),
    }));
  }

  async getVehicleModels(): Promise<VehicleModelEntity[]> {
    const res = await this.pool.query(`
      SELECT 
        vm.id, vm.vehicle_group_id, vm.make, vm.model_name, vm.display_name,
        vm.passenger_capacity, vm.luggage_capacity, vm.image_url, vm.sort_order, vm.is_active,
        vg.code AS group_code, vg.name AS group_name, vg.is_active AS group_is_active
      FROM vehicle_models vm
      JOIN vehicle_groups vg ON vm.vehicle_group_id = vg.id
      ORDER BY vg.sort_order ASC, vm.sort_order ASC, vm.display_name ASC
    `);
    return res.rows.map((r) => ({
      id: r.id,
      vehicle_group_id: r.vehicle_group_id,
      group_code: r.group_code as VehicleGroupCode,
      group_name: r.group_name,
      make: r.make,
      model_name: r.model_name,
      display_name: r.display_name,
      passenger_capacity: Number(r.passenger_capacity),
      luggage_capacity: r.luggage_capacity !== null ? Number(r.luggage_capacity) : null,
      image_url: r.image_url,
      sort_order: Number(r.sort_order),
      is_active: Boolean(r.is_active) && Boolean(r.group_is_active),
    }));
  }

  async getVehicleModelById(id: string): Promise<VehicleModelEntity | null> {
    const res = await this.pool.query(
      `
      SELECT 
        vm.id, vm.vehicle_group_id, vm.make, vm.model_name, vm.display_name,
        vm.passenger_capacity, vm.luggage_capacity, vm.image_url, vm.sort_order, vm.is_active,
        vg.code AS group_code, vg.name AS group_name, vg.is_active AS group_is_active
      FROM vehicle_models vm
      JOIN vehicle_groups vg ON vm.vehicle_group_id = vg.id
      WHERE vm.id = $1
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      vehicle_group_id: r.vehicle_group_id,
      group_code: r.group_code as VehicleGroupCode,
      group_name: r.group_name,
      make: r.make,
      model_name: r.model_name,
      display_name: r.display_name,
      passenger_capacity: Number(r.passenger_capacity),
      luggage_capacity: r.luggage_capacity !== null ? Number(r.luggage_capacity) : null,
      image_url: r.image_url,
      sort_order: Number(r.sort_order),
      is_active: Boolean(r.is_active) && Boolean(r.group_is_active),
    };
  }

  async getOutstationRouteByIdOrCode(idOrCode: string): Promise<OutstationRouteEntity | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const query = isUuid
      ? "SELECT * FROM outstation_routes WHERE id = $1"
      : "SELECT * FROM outstation_routes WHERE code = $1";
    const res = await this.pool.query(query, [idOrCode]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      distance_km: r.distance_km !== null ? Number(r.distance_km) : null,
      duration_minutes: r.duration_minutes !== null ? Number(r.duration_minutes) : null,
      gallery: Array.isArray(r.gallery) ? r.gallery : [],
    };
  }

  async getOutstationRouteVehicles(routeId: string): Promise<OutstationRouteVehicleEntity[]> {
    const res = await this.pool.query(
      "SELECT * FROM outstation_route_vehicles WHERE route_id = $1 AND is_active = true ORDER BY sort_order ASC",
      [routeId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      route_id: r.route_id,
      vehicle_model_id: r.vehicle_model_id,
      one_way_amount: r.one_way_amount !== null ? Number(r.one_way_amount) : null,
      round_trip_enabled: Boolean(r.round_trip_enabled),
      terms: typeof r.terms === "object" && r.terms !== null ? r.terms : {},
      sort_order: Number(r.sort_order),
      is_active: Boolean(r.is_active),
    }));
  }

  async getFareRules(category: CategoryCode): Promise<FareRuleEntity[]> {
    const res = await this.pool.query(
      "SELECT * FROM fare_rules WHERE category = $1 AND is_active = true",
      [category]
    );
    return res.rows.map((r) => ({
      id: r.id,
      category: r.category as CategoryCode,
      vehicle_model_id: r.vehicle_model_id,
      local_package_id: r.local_package_id,
      transfer_id: r.transfer_id,
      tour_package_id: r.tour_package_id,
      amount: Number(r.amount),
      is_active: Boolean(r.is_active),
    }));
  }

  async getExtraCharges(category: CategoryCode): Promise<ExtraChargeEntity[]> {
    const res = await this.pool.query(
      `
      SELECT ec.*, vg.code AS vehicle_group_code
      FROM extra_charges ec
      LEFT JOIN vehicle_groups vg ON ec.vehicle_group_id = vg.id
      WHERE ec.category = $1 AND ec.is_active = true
    `,
      [category]
    );
    return res.rows.map((r) => ({
      id: r.id,
      category: r.category as CategoryCode,
      vehicle_group_id: r.vehicle_group_id,
      vehicle_group_code: r.vehicle_group_code as VehicleGroupCode | null,
      route_id: r.route_id,
      local_package_id: r.local_package_id,
      transfer_id: r.transfer_id,
      tour_package_id: r.tour_package_id,
      label: r.label,
      amount: r.amount !== null ? Number(r.amount) : null,
      is_active: Boolean(r.is_active),
    }));
  }

  async getLocalPackageByIdOrCode(idOrCode: string): Promise<LocalPackageEntity | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const query = isUuid
      ? "SELECT * FROM local_packages WHERE id = $1"
      : "SELECT * FROM local_packages WHERE code = $1";
    const res = await this.pool.query(query, [idOrCode]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      duration_hours: r.duration_hours !== null ? Number(r.duration_hours) : null,
      included_km: r.included_km !== null ? Number(r.included_km) : null,
      inclusions: Array.isArray(r.inclusions) ? r.inclusions : [],
      exclusions: Array.isArray(r.exclusions) ? r.exclusions : [],
      gallery: Array.isArray(r.gallery) ? r.gallery : [],
    };
  }

  async getTransferByIdOrCode(idOrCode: string): Promise<TransferEntity | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const query = isUuid ? "SELECT * FROM transfers WHERE id = $1" : "SELECT * FROM transfers WHERE code = $1";
    const res = await this.pool.query(query, [idOrCode]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      inclusions: Array.isArray(r.inclusions) ? r.inclusions : [],
      exclusions: Array.isArray(r.exclusions) ? r.exclusions : [],
      gallery: Array.isArray(r.gallery) ? r.gallery : [],
    };
  }

  async getTourPackageByIdOrCode(idOrCode: string): Promise<TourPackageEntity | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const query = isUuid
      ? "SELECT * FROM tour_packages WHERE id = $1"
      : "SELECT * FROM tour_packages WHERE code = $1";
    const res = await this.pool.query(query, [idOrCode]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      days: Number(r.days),
      nights: Number(r.nights),
      inclusions: Array.isArray(r.inclusions) ? r.inclusions : [],
      exclusions: Array.isArray(r.exclusions) ? r.exclusions : [],
      itinerary: Array.isArray(r.itinerary) ? r.itinerary : [],
      gallery: Array.isArray(r.gallery) ? r.gallery : [],
    };
  }
}
