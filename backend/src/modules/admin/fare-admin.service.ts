import type pg from "pg";
import { AppError } from "../../shared/errors.js";
import type { UserRole } from "../../types/domain.js";
import type { FareAdminRepository } from "./fare-admin.repository.js";
import type { LocationIqService } from "../routes/locationiq.service.js";
import type { CategoryCode, VehicleGroupCode } from "../../contracts/fare-system.js";

export interface AdminActor {
  id: string;
  role: UserRole;
}

export class FareAdminService {
  constructor(
    private pool: pg.Pool,
    private auditRepo: FareAdminRepository,
    private locationIqService?: LocationIqService
  ) {}

  private assertSuperAdmin(actor: AdminActor) {
    if (actor.role !== "super_admin") {
      throw new AppError("FORBIDDEN", "Super admin permission required.", 403);
    }
  }

  private assertContentOrSuperAdmin(actor: AdminActor) {
    if (actor.role !== "super_admin" && actor.role !== "content_editor") {
      throw new AppError("FORBIDDEN", "Content editor or super admin permission required.", 403);
    }
  }

  // ===== Vehicles =====
  async createVehicleModel(
    data: {
      vehicle_group_code?: VehicleGroupCode;
      vehicle_group_id?: string;
      make: string;
      model_name: string;
      display_name: string;
      passenger_capacity: number;
      luggage_capacity?: number;
      image_url?: string;
      sort_order?: number;
      is_active?: boolean;
    },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertSuperAdmin(actor);
    if (!Number.isInteger(data.passenger_capacity) || data.passenger_capacity <= 0) {
      throw new AppError("VALIDATION_ERROR", "Passenger capacity must be a positive integer", 400);
    }

    const groupIdentifier = data.vehicle_group_code || data.vehicle_group_id;
    if (!groupIdentifier) {
      throw new AppError("VALIDATION_ERROR", "Either vehicle_group_code or vehicle_group_id is required", 400);
    }

    const groupRes = await this.pool.query(
      "SELECT id FROM vehicle_groups WHERE code = $1 OR id::text = $1",
      [groupIdentifier]
    );
    if (groupRes.rows.length === 0) {
      throw new AppError("NOT_FOUND", "Vehicle group not found", 404);
    }
    const groupId = groupRes.rows[0].id;

    const isActive = data.is_active !== undefined ? Boolean(data.is_active) : true;
    const res = await this.pool.query(
      `
      INSERT INTO vehicle_models (
        vehicle_group_id, make, model_name, display_name, passenger_capacity,
        luggage_capacity, image_url, sort_order, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        groupId,
        data.make,
        data.model_name,
        data.display_name,
        data.passenger_capacity,
        data.luggage_capacity ?? null,
        data.image_url ?? null,
        data.sort_order ?? 0,
        isActive,
      ]
    );
    const created = res.rows[0];

    await this.auditRepo.recordAudit({
      actor_id: actor.id,
      actor_role: actor.role,
      resource_type: "vehicle_models",
      resource_id: created.id,
      action: "create",
      after_state: created,
      request_id: requestId,
    });

    return created;
  }

  async patchVehicleModel(
    id: string,
    data: {
      make?: string;
      model_name?: string;
      display_name?: string;
      passenger_capacity?: number;
      luggage_capacity?: number | null;
      image_url?: string | null;
      sort_order?: number;
      is_active?: boolean;
    },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertSuperAdmin(actor);
    const beforeRes = await this.pool.query("SELECT * FROM vehicle_models WHERE id = $1", [id]);
    if (beforeRes.rows.length === 0) throw new AppError("NOT_FOUND", "Vehicle model not found", 404);
    const before = beforeRes.rows[0];

    if (data.passenger_capacity !== undefined) {
      if (!Number.isInteger(data.passenger_capacity) || data.passenger_capacity <= 0) {
        throw new AppError("VALIDATION_ERROR", "Passenger capacity must be positive integer", 400);
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        updates.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (updates.length === 0) return before;
    values.push(id);

    const res = await this.pool.query(
      `UPDATE vehicle_models SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    const after = res.rows[0];

    await this.auditRepo.recordAudit({
      actor_id: actor.id,
      actor_role: actor.role,
      resource_type: "vehicle_models",
      resource_id: id,
      action: "update",
      before_state: before,
      after_state: after,
      request_id: requestId,
    });

    return after;
  }

  async patchVehicleGroup(
    id: string,
    data: {
      driver_allowance_per_day?: number;
      one_way_night_charge?: number;
      round_trip_halt_per_night?: number;
      is_active?: boolean;
    },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertSuperAdmin(actor);
    const beforeRes = await this.pool.query("SELECT * FROM vehicle_groups WHERE id = $1", [id]);
    if (beforeRes.rows.length === 0) throw new AppError("NOT_FOUND", "Vehicle group not found", 404);
    const before = beforeRes.rows[0];

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        if (typeof val === "number" && (!Number.isInteger(val) || val < 0)) {
          throw new AppError("VALIDATION_ERROR", `${key} must be a non-negative integer`, 400);
        }
        updates.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (updates.length === 0) return before;
    values.push(id);

    const res = await this.pool.query(
      `UPDATE vehicle_groups SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    const after = res.rows[0];

    await this.auditRepo.recordAudit({
      actor_id: actor.id,
      actor_role: actor.role,
      resource_type: "vehicle_groups",
      resource_id: id,
      action: "update",
      before_state: before,
      after_state: after,
      request_id: requestId,
    });

    return after;
  }

  // ===== Fare Settings =====
  async patchFareSetting(key: string, value: number, actor: AdminActor, requestId: string) {
    this.assertSuperAdmin(actor);
    if (!Number.isInteger(value)) {
      throw new AppError("VALIDATION_ERROR", "Setting value must be an integer", 400);
    }

    const beforeRes = await this.pool.query("SELECT * FROM fare_settings WHERE key = $1", [key]);
    if (beforeRes.rows.length === 0) throw new AppError("NOT_FOUND", "Setting not found", 404);
    const before = beforeRes.rows[0];

    const res = await this.pool.query(
      "UPDATE fare_settings SET value = $1 WHERE key = $2 RETURNING *",
      [value, key]
    );
    const after = res.rows[0];

    await this.auditRepo.recordAudit({
      actor_id: actor.id,
      actor_role: actor.role,
      resource_type: "fare_settings",
      resource_id: key,
      action: "update",
      before_state: before,
      after_state: after,
      request_id: requestId,
    });

    return after;
  }

  // ===== Fare Rules =====
  async createFareRule(
    data: {
      category: CategoryCode;
      vehicle_model_id: string;
      local_package_id?: string;
      transfer_id?: string;
      tour_package_id?: string;
      amount: number;
    },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertSuperAdmin(actor);
    // AA-05: amount must be positive integer
    if (!Number.isInteger(data.amount) || data.amount <= 0) {
      throw new AppError("VALIDATION_ERROR", "Fare rule amount must be a positive integer", 400);
    }

    // Category / product id match checks
    if (data.category === "outstation") {
      if (data.local_package_id || data.transfer_id || data.tour_package_id) {
        throw new AppError("VALIDATION_ERROR", "Outstation fare rules cannot have product ids", 400);
      }
    } else {
      const pIds = [data.local_package_id, data.transfer_id, data.tour_package_id].filter(Boolean);
      if (pIds.length !== 1) {
        throw new AppError("VALIDATION_ERROR", "Fixed product fare rules must have exactly one product id", 400);
      }
    }

    // AA-06: Second active rule for same car and product -> CONFLICT
    const dupCheck = await this.pool.query(
      `
      SELECT id FROM fare_rules
      WHERE vehicle_model_id = $1
        AND category = $2
        AND local_package_id IS NOT DISTINCT FROM $3
        AND transfer_id IS NOT DISTINCT FROM $4
        AND tour_package_id IS NOT DISTINCT FROM $5
        AND is_active = true
    `,
      [
        data.vehicle_model_id,
        data.category,
        data.local_package_id ?? null,
        data.transfer_id ?? null,
        data.tour_package_id ?? null,
      ]
    );

    if (dupCheck.rows.length > 0) {
      throw new AppError("CONFLICT", "An active fare rule already exists for this car and product", 409);
    }

    const res = await this.pool.query(
      `
      INSERT INTO fare_rules (
        category, vehicle_model_id, local_package_id, transfer_id, tour_package_id, amount, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `,
      [
        data.category,
        data.vehicle_model_id,
        data.local_package_id ?? null,
        data.transfer_id ?? null,
        data.tour_package_id ?? null,
        data.amount,
      ]
    );
    const created = res.rows[0];

    await this.auditRepo.recordAudit({
      actor_id: actor.id,
      actor_role: actor.role,
      resource_type: "fare_rules",
      resource_id: created.id,
      action: "create",
      after_state: created,
      request_id: requestId,
    });

    return created;
  }

  async patchFareRule(
    id: string,
    data: { amount?: number; is_active?: boolean },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertSuperAdmin(actor);
    const beforeRes = await this.pool.query("SELECT * FROM fare_rules WHERE id = $1", [id]);
    if (beforeRes.rows.length === 0) throw new AppError("NOT_FOUND", "Fare rule not found", 404);
    const before = beforeRes.rows[0];

    if (data.amount !== undefined) {
      if (!Number.isInteger(data.amount) || data.amount <= 0) {
        throw new AppError("VALIDATION_ERROR", "Amount must be a positive integer", 400);
      }
    }

    if (data.is_active === true && !before.is_active) {
      const dupCheck = await this.pool.query(
        `
        SELECT id FROM fare_rules
        WHERE id != $1
          AND vehicle_model_id = $2
          AND category = $3
          AND local_package_id IS NOT DISTINCT FROM $4
          AND transfer_id IS NOT DISTINCT FROM $5
          AND tour_package_id IS NOT DISTINCT FROM $6
          AND is_active = true
      `,
        [
          id,
          before.vehicle_model_id,
          before.category,
          before.local_package_id,
          before.transfer_id,
          before.tour_package_id,
        ]
      );
      if (dupCheck.rows.length > 0) {
        throw new AppError("CONFLICT", "Another active fare rule exists for this car and product", 409);
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (data.amount !== undefined) {
      updates.push(`amount = $${idx++}`);
      values.push(data.amount);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(data.is_active);
    }
    if (updates.length === 0) return before;
    values.push(id);

    const res = await this.pool.query(
      `UPDATE fare_rules SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    const after = res.rows[0];

    await this.auditRepo.recordAudit({
      actor_id: actor.id,
      actor_role: actor.role,
      resource_type: "fare_rules",
      resource_id: id,
      action: "update",
      before_state: before,
      after_state: after,
      request_id: requestId,
    });

    return after;
  }

  // ===== Extra Charges =====
  async createExtraCharge(
    data: {
      category: CategoryCode;
      vehicle_group_code?: VehicleGroupCode;
      route_id?: string;
      local_package_id?: string;
      transfer_id?: string;
      tour_package_id?: string;
      label: string;
      amount?: number | null;
      is_active?: boolean;
    },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertSuperAdmin(actor);
    if (data.amount !== undefined && data.amount !== null && (!Number.isInteger(data.amount) || data.amount <= 0)) {
      throw new AppError("VALIDATION_ERROR", "Extra charge amount must be a positive integer", 400);
    }

    // AA-07: at most one product id, category must match
    const pIds = [data.route_id, data.local_package_id, data.transfer_id, data.tour_package_id].filter(Boolean);
    if (pIds.length > 1) {
      throw new AppError("VALIDATION_ERROR", "Extra charge can target at most one product", 400);
    }

    if (data.category === "outstation" && (data.local_package_id || data.transfer_id || data.tour_package_id)) {
      throw new AppError("VALIDATION_ERROR", "Outstation category cannot reference non-route product ids", 400);
    }
    if (data.category === "local_package" && (data.route_id || data.transfer_id || data.tour_package_id)) {
      throw new AppError("VALIDATION_ERROR", "Local package category cannot reference non-local product ids", 400);
    }
    if (data.category === "transfer" && (data.route_id || data.local_package_id || data.tour_package_id)) {
      throw new AppError("VALIDATION_ERROR", "Transfer category cannot reference non-transfer product ids", 400);
    }
    if (data.category === "tour_package" && (data.route_id || data.local_package_id || data.transfer_id)) {
      throw new AppError("VALIDATION_ERROR", "Tour package category cannot reference non-tour product ids", 400);
    }

    let vehicleGroupId: string | null = null;
    if (data.vehicle_group_code) {
      const gRes = await this.pool.query("SELECT id FROM vehicle_groups WHERE code = $1", [data.vehicle_group_code]);
      if (gRes.rows.length === 0) throw new AppError("NOT_FOUND", "Vehicle group not found", 404);
      vehicleGroupId = gRes.rows[0].id;
    }

    // EX-14: Two active rows with same scope and label -> CONFLICT
    const dupCheck = await this.pool.query(
      `
      SELECT id FROM extra_charges
      WHERE category = $1
        AND vehicle_group_id IS NOT DISTINCT FROM $2
        AND route_id IS NOT DISTINCT FROM $3
        AND local_package_id IS NOT DISTINCT FROM $4
        AND transfer_id IS NOT DISTINCT FROM $5
        AND tour_package_id IS NOT DISTINCT FROM $6
        AND label = $7
        AND is_active = true
    `,
      [
        data.category,
        vehicleGroupId,
        data.route_id ?? null,
        data.local_package_id ?? null,
        data.transfer_id ?? null,
        data.tour_package_id ?? null,
        data.label,
      ]
    );

    if (dupCheck.rows.length > 0) {
      throw new AppError("CONFLICT", "An active extra charge already exists for this scope and label", 409);
    }

    const res = await this.pool.query(
      `
      INSERT INTO extra_charges (
        category, vehicle_group_id, route_id, local_package_id, transfer_id, tour_package_id, label, amount, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `,
      [
        data.category,
        vehicleGroupId,
        data.route_id ?? null,
        data.local_package_id ?? null,
        data.transfer_id ?? null,
        data.tour_package_id ?? null,
        data.label,
        data.amount ?? null,
      ]
    );
    const created = res.rows[0];

    await this.auditRepo.recordAudit({
      actor_id: actor.id,
      actor_role: actor.role,
      resource_type: "extra_charges",
      resource_id: created.id,
      action: "create",
      after_state: created,
      request_id: requestId,
    });

    return created;
  }

  async patchExtraCharge(
    id: string,
    data: { amount?: number | null; is_active?: boolean; label?: string },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertSuperAdmin(actor);
    const prev = await this.pool.query("SELECT * FROM extra_charges WHERE id = $1", [id]);
    if (prev.rows.length === 0) throw new AppError("NOT_FOUND", "Extra charge not found", 404);
    const before = prev.rows[0];

    if (data.amount !== undefined && data.amount !== null && (!Number.isInteger(data.amount) || data.amount <= 0)) {
      throw new AppError("VALIDATION_ERROR", "Extra charge amount must be a positive integer", 400);
    }

    const nextAmount = data.amount !== undefined ? data.amount : before.amount;
    const nextActive = data.is_active !== undefined ? data.is_active : before.is_active;
    const nextLabel = data.label !== undefined ? data.label.trim() : before.label;

    const res = await this.pool.query(
      `
      UPDATE extra_charges
      SET amount = $1, is_active = $2, label = $3
      WHERE id = $4
      RETURNING *
    `,
      [nextAmount, nextActive, nextLabel, id]
    );
    const updated = res.rows[0];

    await this.auditRepo.recordAudit({
      actor_id: actor.id,
      actor_role: actor.role,
      resource_type: "extra_charges",
      resource_id: id,
      action: "update",
      before_state: before,
      after_state: updated,
      request_id: requestId,
    });

    return updated;
  }

  // ===== Routes & LocationIQ =====
  async calculateDistance(origin: string, destination: string) {
    if (!this.locationIqService) {
      throw new AppError("UPSTREAM_ERROR", "LocationIQ service not configured", 502);
    }
    // AA-09, AA-10: returns values, saves nothing
    try {
      return await this.locationIqService.calculateDistance(origin, destination);
    } catch (err: any) {
      if (err.message === "SETTINGS_MISSING") {
        throw new AppError("UPSTREAM_ERROR", "LocationIQ API key is not configured.", 502);
      }
      if (err.message === "GEOCODE_FAILED") {
        throw new AppError("GEOCODE_FAILED", `Could not geocode "${origin}" or "${destination}". Please specify city and state name.`, 400);
      }
      if (err.message === "ROUTING_FAILED") {
        throw new AppError("ROUTING_FAILED", "Could not calculate driving directions between these locations. You can enter km and duration manually.", 400);
      }
      throw new AppError("UPSTREAM_ERROR", `LocationIQ service error: ${err.message || "Request failed"}. You can enter km and duration manually.`, 502);
    }
  }

  async putRouteVehicles(
    routeId: string,
    vehicles: Array<{
      vehicle_model_id: string;
      one_way_amount: number | null;
      round_trip_enabled: boolean;
      terms?: any;
      sort_order?: number;
      is_active?: boolean;
    }>,
    actor: AdminActor,
    requestId: string
  ) {
    this.assertSuperAdmin(actor);
    const routeRes = await this.pool.query("SELECT * FROM outstation_routes WHERE id = $1", [routeId]);
    if (routeRes.rows.length === 0) throw new AppError("NOT_FOUND", "Route not found", 404);

    // VO-16: a row that offers neither trip type is rejected
    for (const v of vehicles) {
      if (v.one_way_amount === null && !v.round_trip_enabled) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Vehicle ${v.vehicle_model_id} offers neither one-way nor round trip and is rejected`,
          400
        );
      }
      if (v.one_way_amount !== null && (!Number.isInteger(v.one_way_amount) || v.one_way_amount <= 0)) {
        throw new AppError("VALIDATION_ERROR", "one_way_amount must be a positive integer or null", 400);
      }
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const beforeRes = await client.query(
        "SELECT * FROM outstation_route_vehicles WHERE route_id = $1",
        [routeId]
      );
      const before = beforeRes.rows;

      const after: any[] = [];
      for (const v of vehicles) {
        const res = await client.query(
          `
          INSERT INTO outstation_route_vehicles (
            route_id, vehicle_model_id, one_way_amount, round_trip_enabled, terms, sort_order, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (route_id, vehicle_model_id) DO UPDATE SET
            one_way_amount = EXCLUDED.one_way_amount,
            round_trip_enabled = EXCLUDED.round_trip_enabled,
            terms = EXCLUDED.terms,
            sort_order = EXCLUDED.sort_order,
            is_active = EXCLUDED.is_active
          RETURNING *
        `,
          [
            routeId,
            v.vehicle_model_id,
            v.one_way_amount,
            v.round_trip_enabled,
            JSON.stringify(v.terms ?? {}),
            v.sort_order ?? 0,
            v.is_active ?? true,
          ]
        );
        after.push(res.rows[0]);
      }

      await this.auditRepo.recordAudit(
        {
          actor_id: actor.id,
          actor_role: actor.role,
          resource_type: "outstation_route_vehicles",
          resource_id: routeId,
          action: "update_grid",
          before_state: before,
          after_state: after,
          request_id: requestId,
        },
        client
      );

      await client.query("COMMIT");
      return after;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async createRoute(
    data: {
      code: string;
      origin_name: string;
      destination_name: string;
      distance_km?: number | null;
      duration_minutes?: number | null;
      description?: string | null;
      image_url?: string | null;
    },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertContentOrSuperAdmin(actor);
    const existing = await this.pool.query(
      "SELECT id FROM outstation_routes WHERE code = $1 OR (origin_name = $2 AND destination_name = $3)",
      [data.code, data.origin_name, data.destination_name]
    );
    if (existing.rows.length > 0) {
      throw new AppError("CONFLICT", "Route with this code or origin-destination pair already exists", 409);
    }

    const gallery = data.image_url ? [data.image_url] : [];
    const res = await this.pool.query(
      `INSERT INTO outstation_routes (code, origin_name, destination_name, distance_km, duration_minutes, description, image_url, gallery, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
       RETURNING *`,
      [
        data.code,
        data.origin_name,
        data.destination_name,
        data.distance_km ?? null,
        data.duration_minutes ?? null,
        data.description ?? null,
        data.image_url ?? null,
        JSON.stringify(gallery),
      ]
    );
    const created = res.rows[0];

    await this.auditRepo.recordAudit({
      actor_id: actor.id,
      actor_role: actor.role,
      resource_type: "outstation_routes",
      resource_id: created.id,
      action: "create",
      after_state: created,
      request_id: requestId,
    });

    return created;
  }

  async patchRoute(
    id: string,
    data: {
      origin_name?: string;
      destination_name?: string;
      distance_km?: number | null;
      duration_minutes?: number | null;
      description?: string | null;
      image_url?: string | null;
    },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertContentOrSuperAdmin(actor);
    const beforeRes = await this.pool.query("SELECT * FROM outstation_routes WHERE id = $1", [id]);
    if (beforeRes.rows.length === 0) throw new AppError("NOT_FOUND", "Route not found", 404);
    const before = beforeRes.rows[0];

    const origin = data.origin_name ?? before.origin_name;
    const dest = data.destination_name ?? before.destination_name;
    const dist = data.distance_km !== undefined ? data.distance_km : before.distance_km;
    const dur = data.duration_minutes !== undefined ? data.duration_minutes : before.duration_minutes;
    const desc = data.description !== undefined ? data.description : before.description;
    const img = data.image_url !== undefined ? data.image_url : before.image_url;
    const gallery = img ? [img] : (before.gallery || []);

    const res = await this.pool.query(
      `UPDATE outstation_routes
       SET origin_name = $1, destination_name = $2, distance_km = $3, duration_minutes = $4, description = $5, image_url = $6, gallery = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [origin, dest, dist, dur, desc, img, JSON.stringify(gallery), id]
    );
    const updated = res.rows[0];

    await this.auditRepo.recordAudit({
      actor_id: actor.id,
      actor_role: actor.role,
      resource_type: "outstation_routes",
      resource_id: id,
      action: "update",
      before_state: before,
      after_state: updated,
      request_id: requestId,
    });

    return updated;
  }

  // ===== Status updates (Publishing Pipeline) =====
  async updateProductStatus(
    entityType: "outstation_route" | "local_package" | "transfer" | "tour_package",
    id: string,
    status: "published" | "archived",
    actor: AdminActor,
    requestId: string
  ) {
    this.assertContentOrSuperAdmin(actor);

    const tableName =
      entityType === "outstation_route"
        ? "outstation_routes"
        : entityType === "local_package"
        ? "local_packages"
        : entityType === "transfer"
        ? "transfers"
        : "tour_packages";

    const beforeRes = await this.pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    if (beforeRes.rows.length === 0) throw new AppError("NOT_FOUND", `${entityType} not found`, 404);
    const before = beforeRes.rows[0];

    // AA-12: A route is published only with distance and duration
    if (entityType === "outstation_route" && status === "published") {
      if (before.distance_km === null || before.duration_minutes === null) {
        throw new AppError(
          "VALIDATION_ERROR",
          "A route can only be published with distance_km and duration_minutes set",
          400
        );
      }
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const res = await client.query(
        `UPDATE ${tableName} SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id]
      );
      const after = res.rows[0];

      // Insert site_publish_events in same transaction
      await client.query(
        `
        INSERT INTO site_publish_events (entity_type, entity_id, event_type, status)
        VALUES ($1, $2, $3, 'pending')
        ON CONFLICT (entity_type, entity_id, event_type) WHERE status = 'pending' DO NOTHING
      `,
        [entityType, id, status]
      );

      await this.auditRepo.recordAudit(
        {
          actor_id: actor.id,
          actor_role: actor.role,
          resource_type: tableName,
          resource_id: id,
          action: status,
          before_state: before,
          after_state: after,
          request_id: requestId,
        },
        client
      );

      await client.query("COMMIT");
      return after;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // ===== Admin Read Methods =====
  async listVehicleGroups(_actor: AdminActor) {
    const res = await this.pool.query("SELECT * FROM vehicle_groups ORDER BY sort_order ASC");
    return res.rows;
  }

  async listVehicleModels(_actor: AdminActor) {
    const res = await this.pool.query(`
      SELECT vm.*, vg.code as group_code, vg.name as group_name
      FROM vehicle_models vm
      JOIN vehicle_groups vg ON vm.vehicle_group_id = vg.id
      ORDER BY vm.sort_order ASC
    `);
    return res.rows;
  }

  async listFareSettings(_actor: AdminActor) {
    const res = await this.pool.query("SELECT * FROM fare_settings ORDER BY key ASC");
    return res.rows;
  }

  async listFareRules(_actor: AdminActor) {
    const res = await this.pool.query(`
      SELECT fr.*, vm.display_name as vehicle_name, vg.code as group_code,
             lp.code as local_package_code,
             t.code as transfer_code, tp.code as tour_package_code
      FROM fare_rules fr
      JOIN vehicle_models vm ON fr.vehicle_model_id = vm.id
      JOIN vehicle_groups vg ON vm.vehicle_group_id = vg.id
      LEFT JOIN local_packages lp ON fr.local_package_id = lp.id
      LEFT JOIN transfers t ON fr.transfer_id = t.id
      LEFT JOIN tour_packages tp ON fr.tour_package_id = tp.id
      ORDER BY fr.category, vm.display_name
    `);
    return res.rows;
  }

  async listExtraCharges(_actor: AdminActor) {
    const res = await this.pool.query(`
      SELECT ec.*, vg.code as group_code
      FROM extra_charges ec
      LEFT JOIN vehicle_groups vg ON ec.vehicle_group_id = vg.id
      ORDER BY ec.category, ec.label
    `);
    return res.rows;
  }

  async listRoutes(_actor: AdminActor) {
    const res = await this.pool.query("SELECT * FROM outstation_routes ORDER BY code ASC");
    return res.rows;
  }

  async getRouteWithVehicles(routeId: string, _actor: AdminActor) {
    const routeRes = await this.pool.query("SELECT * FROM outstation_routes WHERE id = $1", [routeId]);
    if (routeRes.rows.length === 0) throw new AppError("NOT_FOUND", "Route not found", 404);
    const vehiclesRes = await this.pool.query(
      `SELECT orv.*, vm.display_name, vm.passenger_capacity, vm.luggage_capacity, vg.code as group_code
       FROM outstation_route_vehicles orv
       JOIN vehicle_models vm ON orv.vehicle_model_id = vm.id
       JOIN vehicle_groups vg ON vm.vehicle_group_id = vg.id
       WHERE orv.route_id = $1
       ORDER BY orv.sort_order ASC`,
      [routeId]
    );
    return {
      route: routeRes.rows[0],
      vehicles: vehiclesRes.rows,
    };
  }

  async listAuditLogs(_actor: AdminActor, limit = 100) {
    return this.auditRepo.getAuditLogs(limit);
  }

  async listPublishEvents(_actor: AdminActor, limit = 50) {
    const res = await this.pool.query(
      "SELECT * FROM site_publish_events ORDER BY created_at DESC LIMIT $1",
      [limit]
    );
    return res.rows;
  }
}
