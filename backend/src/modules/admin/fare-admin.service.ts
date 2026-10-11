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
      vehicle_group_code: VehicleGroupCode;
      make: string;
      model_name: string;
      display_name: string;
      passenger_capacity: number;
      luggage_capacity?: number;
      image_url?: string;
      sort_order?: number;
    },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertSuperAdmin(actor);
    if (!Number.isInteger(data.passenger_capacity) || data.passenger_capacity <= 0) {
      throw new AppError("VALIDATION_ERROR", "Passenger capacity must be a positive integer", 400);
    }

    const groupRes = await this.pool.query(
      "SELECT id FROM vehicle_groups WHERE code = $1",
      [data.vehicle_group_code]
    );
    if (groupRes.rows.length === 0) {
      throw new AppError("NOT_FOUND", "Vehicle group not found", 404);
    }
    const groupId = groupRes.rows[0].id;

    const res = await this.pool.query(
      `
      INSERT INTO vehicle_models (
        vehicle_group_id, make, model_name, display_name, passenger_capacity,
        luggage_capacity, image_url, sort_order, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
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
      amount?: number;
    },
    actor: AdminActor,
    requestId: string
  ) {
    this.assertSuperAdmin(actor);
    if (data.amount !== undefined && (!Number.isInteger(data.amount) || data.amount <= 0)) {
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

  // ===== Routes & LocationIQ =====
  async calculateDistance(origin: string, destination: string) {
    if (!this.locationIqService) {
      throw new AppError("UPSTREAM_ERROR", "LocationIQ service not configured", 502);
    }
    // AA-09, AA-10: returns values, saves nothing
    return this.locationIqService.calculateDistance(origin, destination);
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
}
