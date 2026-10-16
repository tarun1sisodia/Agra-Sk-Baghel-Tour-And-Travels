import type pg from "pg";
import type {
  CategoryCode,
  VehicleGroupCode,
  PublishedCatalogResponse,
  PublishedProductDetail,
  PublishedProductSummary,
  ProductStatus,
} from "../../contracts/fare-system.js";

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

  async getPublishedCatalog(): Promise<PublishedCatalogResponse> {
    const groupsRes = await this.pool.query(
      `SELECT code as group_code, name, driver_allowance_per_day, one_way_night_charge, round_trip_halt_per_night, sort_order
       FROM vehicle_groups
       WHERE is_active = true
       ORDER BY sort_order`
    );
    const groups = groupsRes.rows.map((r) => ({
      group_code: r.group_code as VehicleGroupCode,
      name: r.name,
      driver_allowance_per_day: Number(r.driver_allowance_per_day),
      one_way_night_charge: Number(r.one_way_night_charge),
      round_trip_halt_per_night: Number(r.round_trip_halt_per_night),
      sort_order: Number(r.sort_order),
    }));

    const vehiclesRes = await this.pool.query(
      `SELECT vm.id, vg.code as group_code, vm.make, vm.model_name, vm.display_name,
              vm.passenger_capacity, vm.luggage_capacity, vm.image_url
       FROM vehicle_models vm
       JOIN vehicle_groups vg ON vm.vehicle_group_id = vg.id
       WHERE vm.is_active = true AND vg.is_active = true
       ORDER BY vm.sort_order`
    );
    const vehicles = vehiclesRes.rows.map((r) => ({
      id: r.id,
      group_code: r.group_code as VehicleGroupCode,
      make: r.make,
      model_name: r.model_name,
      display_name: r.display_name,
      passenger_capacity: Number(r.passenger_capacity),
      luggage_capacity: r.luggage_capacity !== null ? Number(r.luggage_capacity) : null,
      image_url: r.image_url,
    }));

    const routesRes = await this.pool.query(`
      SELECT r.id, 'outstation' as category, r.code,
             (r.origin_name || ' to ' || r.destination_name) as name,
             r.description, r.image_url, r.status, r.distance_km, r.duration_minutes,
             MIN(orv.one_way_amount) as starting_price_inr
      FROM outstation_routes r
      LEFT JOIN outstation_route_vehicles orv ON r.id = orv.route_id AND orv.is_active = true AND orv.one_way_amount IS NOT NULL
      WHERE r.status = 'published'
      GROUP BY r.id, r.code, r.origin_name, r.destination_name, r.description, r.image_url, r.status, r.distance_km, r.duration_minutes
      ORDER BY r.code
    `);

    const localRes = await this.pool.query(`
      SELECT lp.id, 'local_package' as category, lp.code, lp.name,
             lp.description, lp.image_url, lp.status,
             MIN(fr.amount) as starting_price_inr
      FROM local_packages lp
      LEFT JOIN fare_rules fr ON fr.local_package_id = lp.id AND fr.is_active = true
      WHERE lp.status = 'published'
      GROUP BY lp.id, lp.code, lp.name, lp.description, lp.image_url, lp.status
      ORDER BY lp.code
    `);

    const transfersRes = await this.pool.query(`
      SELECT t.id, 'transfer' as category, t.code, t.name,
             t.description, t.image_url, t.status,
             MIN(fr.amount) as starting_price_inr
      FROM transfers t
      LEFT JOIN fare_rules fr ON fr.transfer_id = t.id AND fr.is_active = true
      WHERE t.status = 'published'
      GROUP BY t.id, t.code, t.name, t.description, t.image_url, t.status
      ORDER BY t.code
    `);

    const toursRes = await this.pool.query(`
      SELECT tp.id, 'tour_package' as category, tp.code, tp.name,
             tp.description, tp.image_url, tp.status,
             MIN(fr.amount) as starting_price_inr
      FROM tour_packages tp
      LEFT JOIN fare_rules fr ON fr.tour_package_id = tp.id AND fr.is_active = true
      WHERE tp.status = 'published'
      GROUP BY tp.id, tp.code, tp.name, tp.description, tp.image_url, tp.status
      ORDER BY tp.code
    `);

    const products: PublishedProductSummary[] = [
      ...routesRes.rows.map((r) => ({
        id: r.id,
        category: "outstation" as const,
        code: r.code,
        name: r.name,
        description: r.description,
        image_url: r.image_url,
        starting_price_inr: r.starting_price_inr ? Number(r.starting_price_inr) : null,
        status: r.status as ProductStatus,
        distance_km: r.distance_km ? Number(r.distance_km) : null,
        duration_minutes: r.duration_minutes ? Number(r.duration_minutes) : null,
      })),
      ...localRes.rows.map((r) => ({
        id: r.id,
        category: "local_package" as const,
        code: r.code,
        name: r.name,
        description: r.description,
        image_url: r.image_url,
        starting_price_inr: r.starting_price_inr ? Number(r.starting_price_inr) : null,
        status: r.status as ProductStatus,
      })),
      ...transfersRes.rows.map((r) => ({
        id: r.id,
        category: "transfer" as const,
        code: r.code,
        name: r.name,
        description: r.description,
        image_url: r.image_url,
        starting_price_inr: r.starting_price_inr ? Number(r.starting_price_inr) : null,
        status: r.status as ProductStatus,
      })),
      ...toursRes.rows.map((r) => ({
        id: r.id,
        category: "tour_package" as const,
        code: r.code,
        name: r.name,
        description: r.description,
        image_url: r.image_url,
        starting_price_inr: r.starting_price_inr ? Number(r.starting_price_inr) : null,
        status: r.status as ProductStatus,
      })),
    ];

    return { products, groups, vehicles };
  }

  async getPublishedProductDetail(
    category: CategoryCode,
    code: string
  ): Promise<PublishedProductDetail | null> {
    if (category === "outstation") {
      const res = await this.pool.query(
        `
        SELECT r.*, MIN(orv.one_way_amount) as starting_price_inr
        FROM outstation_routes r
        LEFT JOIN outstation_route_vehicles orv ON r.id = orv.route_id AND orv.is_active = true AND orv.one_way_amount IS NOT NULL
        WHERE r.code = $1 AND r.status != 'draft'
        GROUP BY r.id
      `,
        [code]
      );
      if (res.rows.length === 0) return null;
      const r = res.rows[0];

      // Related products in outstation
      const relRes = await this.pool.query(
        `SELECT id, 'outstation' as category, code, (origin_name || ' to ' || destination_name) as name,
                description, image_url, status, distance_km, duration_minutes, NULL as starting_price_inr
         FROM outstation_routes
         WHERE status = 'published' AND code != $1
         LIMIT 4`,
        [code]
      );

      return {
        id: r.id,
        category: "outstation",
        code: r.code,
        name: `${r.origin_name} to ${r.destination_name}`,
        description: r.description,
        image_url: r.image_url,
        starting_price_inr: r.starting_price_inr ? Number(r.starting_price_inr) : null,
        status: r.status as ProductStatus,
        distance_km: r.distance_km ? Number(r.distance_km) : null,
        duration_minutes: r.duration_minutes ? Number(r.duration_minutes) : null,
        origin: r.origin_name,
        destination: r.destination_name,
        gallery: Array.isArray(r.gallery) ? r.gallery : [],
        inclusions: ["Toll tax included", "State tax included", "Driver allowance included for day trip"],
        exclusions: ["Parking charges extra as per actual receipts", "Extra sightseeing beyond route"],
        highlights: `Direct highway transit from ${r.origin_name} to ${r.destination_name}`,
        notes: "Pick-up from your home, hotel, railway station or airport.",
        related_products: relRes.rows.map((row) => ({
          ...row,
          starting_price_inr: null,
          distance_km: row.distance_km ? Number(row.distance_km) : null,
          duration_minutes: row.duration_minutes ? Number(row.duration_minutes) : null,
        })),
      };
    }

    if (category === "local_package") {
      const pkg = await this.getLocalPackageByIdOrCode(code);
      if (!pkg || pkg.status === "draft") return null;

      const priceRes = await this.pool.query(
        `SELECT MIN(amount) as min_price FROM fare_rules WHERE local_package_id = $1 AND is_active = true`,
        [pkg.id]
      );
      const startingPrice = priceRes.rows[0]?.min_price ? Number(priceRes.rows[0].min_price) : null;

      const relRes = await this.pool.query(
        `SELECT id, 'local_package' as category, code, name, description, image_url, status, NULL as starting_price_inr
         FROM local_packages
         WHERE status = 'published' AND code != $1 LIMIT 4`,
        [code]
      );

      return {
        id: pkg.id,
        category: "local_package",
        code: pkg.code,
        name: pkg.name,
        description: pkg.description,
        image_url: pkg.image_url,
        starting_price_inr: startingPrice,
        status: pkg.status as ProductStatus,
        covers: pkg.covers,
        duration_hours: pkg.duration_hours,
        included_km: pkg.included_km,
        gallery: pkg.gallery.map(String),
        inclusions: pkg.inclusions,
        exclusions: pkg.exclusions,
        highlights: pkg.inclusions_highlight,
        notes: pkg.inclusions_note,
        related_products: relRes.rows,
      };
    }

    if (category === "transfer") {
      const tf = await this.getTransferByIdOrCode(code);
      if (!tf || tf.status === "draft") return null;

      const priceRes = await this.pool.query(
        `SELECT MIN(amount) as min_price FROM fare_rules WHERE transfer_id = $1 AND is_active = true`,
        [tf.id]
      );
      const startingPrice = priceRes.rows[0]?.min_price ? Number(priceRes.rows[0].min_price) : null;

      const relRes = await this.pool.query(
        `SELECT id, 'transfer' as category, code, name, description, image_url, status, NULL as starting_price_inr
         FROM transfers
         WHERE status = 'published' AND code != $1 LIMIT 4`,
        [code]
      );

      return {
        id: tf.id,
        category: "transfer",
        code: tf.code,
        name: tf.name,
        description: tf.description,
        image_url: tf.image_url,
        starting_price_inr: startingPrice,
        status: tf.status as ProductStatus,
        pickup_name: tf.pickup_name,
        drop_name: tf.drop_name,
        gallery: tf.gallery.map(String),
        inclusions: tf.inclusions,
        exclusions: tf.exclusions,
        highlights: tf.inclusions_highlight,
        notes: tf.inclusions_note,
        related_products: relRes.rows,
      };
    }

    if (category === "tour_package") {
      const tp = await this.getTourPackageByIdOrCode(code);
      if (!tp || tp.status === "draft") return null;

      const priceRes = await this.pool.query(
        `SELECT MIN(amount) as min_price FROM fare_rules WHERE tour_package_id = $1 AND is_active = true`,
        [tp.id]
      );
      const startingPrice = priceRes.rows[0]?.min_price ? Number(priceRes.rows[0].min_price) : null;

      const relRes = await this.pool.query(
        `SELECT id, 'tour_package' as category, code, name, description, image_url, status, NULL as starting_price_inr
         FROM tour_packages
         WHERE status = 'published' AND code != $1 LIMIT 4`,
        [code]
      );

      return {
        id: tp.id,
        category: "tour_package",
        code: tp.code,
        name: tp.name,
        description: tp.description,
        image_url: tp.image_url,
        starting_price_inr: startingPrice,
        status: tp.status as ProductStatus,
        duration_minutes: tp.days * 24 * 60,
        itinerary: tp.itinerary,
        gallery: tp.gallery.map(String),
        inclusions: tp.inclusions,
        exclusions: tp.exclusions,
        highlights: `${tp.days} Days / ${tp.nights} Nights Private Tour`,
        notes: `Private air-conditioned car, chauffeur, fuel and interstate taxes.`,
        related_products: relRes.rows,
      };
    }

    return null;
  }
}

