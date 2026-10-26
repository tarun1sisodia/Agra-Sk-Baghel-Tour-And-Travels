import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { FareAdminService } from "./fare-admin.service.js";
import { AppError } from "../../shared/errors.js";
import {
  VehicleModelCreate,
  VehicleModelPatch,
  VehicleGroupPatch,
  FareSettingPatch,
  FareRuleCreate,
  FareRulePatch,
  ExtraChargeCreate,
  ExtraChargePatch,
  RouteVehiclesPut,
} from "../../contracts/fare-system.js";
import { z } from "zod";

function getActor(req: FastifyRequest) {
  const user = (req as any).user;
  if (!user) {
    throw new AppError("FORBIDDEN", "Authentication required", 401);
  }
  return { id: user.id || "00000000-0000-0000-0000-000000000001", role: user.role };
}

export function registerFareAdminRoutes(app: FastifyInstance, adminService: FareAdminService) {
  const wrap = (fn: (req: FastifyRequest<any>, reply: FastifyReply) => Promise<any>) => {
    return async (req: FastifyRequest<any>, reply: FastifyReply) => {
      try {
        return await fn(req, reply);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.status(400).send({
            error: "VALIDATION_ERROR",
            message: "Validation failed",
            issues: err.issues,
          });
        }
        if (err instanceof AppError) {
          return reply.status(err.statusCode).send({
            error: err.code,
            message: err.message,
            details: err.details,
          });
        }
        throw err;
      }
    };
  };

  type RouteHandler = (req: FastifyRequest<any>, reply: FastifyReply) => Promise<any>;

  const mountRoute = (
    method: "get" | "post" | "patch" | "put",
    canonicalPath: string,
    handler: RouteHandler
  ) => {
    app[method](canonicalPath, wrap(handler));
    if (canonicalPath.startsWith("/api/v1/admin/")) {
      app[method](canonicalPath.replace("/api/v1", ""), wrap(handler));
    }
  };

  // Vehicle Models
  mountRoute("post", "/api/v1/admin/vehicle-models", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const parsed = VehicleModelCreate.parse(req.body);
    const created = await adminService.createVehicleModel(parsed, actor, req.id);
    return reply.status(201).send({ success: true, vehicle_model: created });
  });

  mountRoute("get", "/api/v1/admin/vehicle-models", async (req: FastifyRequest<any>) => {
    const actor = getActor(req);
    const models = await adminService.listVehicleModels(actor);
    return { success: true, vehicle_models: models };
  });

  mountRoute("patch", "/api/v1/admin/vehicle-models/:id", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const { id } = req.params as { id: string };
    const parsed = VehicleModelPatch.parse(req.body);
    const updated = await adminService.patchVehicleModel(id, parsed, actor, req.id);
    return reply.send({ success: true, vehicle_model: updated });
  });

  // Vehicle Groups
  mountRoute("get", "/api/v1/admin/vehicle-groups", async (req: FastifyRequest<any>) => {
    const actor = getActor(req);
    const groups = await adminService.listVehicleGroups(actor);
    return { success: true, vehicle_groups: groups };
  });

  mountRoute("patch", "/api/v1/admin/vehicle-groups/:id", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const { id } = req.params as { id: string };
    const parsed = VehicleGroupPatch.parse(req.body);
    const updated = await adminService.patchVehicleGroup(id, parsed, actor, req.id);
    return reply.send({ success: true, vehicle_group: updated });
  });

  // Fare Settings
  mountRoute("get", "/api/v1/admin/fare-settings", async (req: FastifyRequest<any>) => {
    const actor = getActor(req);
    const settings = await adminService.listFareSettings(actor);
    return { success: true, settings };
  });

  mountRoute("patch", "/api/v1/admin/fare-settings/:key", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const { key } = req.params as { key: string };
    const parsed = FareSettingPatch.parse(req.body);
    const updated = await adminService.patchFareSetting(key, parsed.value, actor, req.id);
    return reply.send({ success: true, setting: updated });
  });

  // Fare Rules
  mountRoute("get", "/api/v1/admin/fare-rules", async (req: FastifyRequest<any>) => {
    const actor = getActor(req);
    const rules = await adminService.listFareRules(actor);
    return { success: true, fare_rules: rules };
  });

  mountRoute("post", "/api/v1/admin/fare-rules", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const parsed = FareRuleCreate.parse(req.body);
    const created = await adminService.createFareRule(parsed, actor, req.id);
    return reply.status(201).send({ success: true, fare_rule: created });
  });

  mountRoute("patch", "/api/v1/admin/fare-rules/:id", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const { id } = req.params as { id: string };
    const parsed = FareRulePatch.parse(req.body);
    const updated = await adminService.patchFareRule(id, parsed, actor, req.id);
    return reply.send({ success: true, fare_rule: updated });
  });

  // Extra Charges
  mountRoute("get", "/api/v1/admin/extra-charges", async (req: FastifyRequest<any>) => {
    const actor = getActor(req);
    const charges = await adminService.listExtraCharges(actor);
    return { success: true, extra_charges: charges };
  });

  mountRoute("post", "/api/v1/admin/extra-charges", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const parsed = ExtraChargeCreate.parse(req.body);
    const created = await adminService.createExtraCharge(parsed, actor, req.id);
    return reply.status(201).send({ success: true, extra_charge: created });
  });

  mountRoute("patch", "/api/v1/admin/extra-charges/:id", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const { id } = req.params as { id: string };
    const parsed = ExtraChargePatch.parse(req.body);
    const updated = await adminService.patchExtraCharge(id, parsed, actor, req.id);
    return reply.send({ success: true, extra_charge: updated });
  });

  // Routes LocationIQ Calculate
  mountRoute("post", "/api/v1/admin/routes/calculate-distance", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    getActor(req);
    const body = (req.body || {}) as any;
    const origin = body.origin || body.origin_name;
    const destination = body.destination || body.destination_name;
    if (!origin || !destination) {
      throw new AppError("VALIDATION_ERROR", "Origin and destination are required", 400);
    }
    const res = await adminService.calculateDistance(origin, destination);
    return reply.send({ success: true, ...res });
  });

  // Routes & Route Vehicles Grid
  mountRoute("get", "/api/v1/admin/routes", async (req: FastifyRequest<any>) => {
    const actor = getActor(req);
    const routes = await adminService.listRoutes(actor);
    return { success: true, routes };
  });

  mountRoute("post", "/api/v1/admin/routes", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const body = req.body as any;
    const created = await adminService.createRoute(body, actor, req.id);
    return reply.status(201).send({ success: true, route: created });
  });

  mountRoute("patch", "/api/v1/admin/routes/:id", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const updated = await adminService.patchRoute(id, body, actor, req.id);
    return reply.send({ success: true, route: updated });
  });

  mountRoute("get", "/api/v1/admin/routes/:id/vehicles", async (req: FastifyRequest<any>) => {
    const actor = getActor(req);
    const { id } = req.params as { id: string };
    const res = await adminService.getRouteWithVehicles(id, actor);
    return { success: true, ...res };
  });

  mountRoute("put", "/api/v1/admin/routes/:id/vehicles", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const { id } = req.params as { id: string };
    const rawVehicles = (req.body as any)?.vehicles || [];
    const normalizedVehicles = rawVehicles.map((v: any) => {
      let terms = v.terms;
      if (!terms) {
        terms = {
          one_way: {
            inclusions: v.inclusions || [],
            exclusions: v.exclusions || [],
          },
          round_trip: {
            inclusions: v.round_trip_inclusions || v.inclusions || [],
            exclusions: v.round_trip_exclusions || v.exclusions || [],
          },
        };
      }
      return {
        vehicle_model_id: v.vehicle_model_id,
        one_way_amount: v.one_way_amount,
        round_trip_enabled: Boolean(v.round_trip_enabled),
        terms,
        sort_order: v.sort_order ?? 0,
        is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
      };
    });
    const parsed = RouteVehiclesPut.parse({ vehicles: normalizedVehicles });
    const updated = await adminService.putRouteVehicles(id, parsed.vehicles, actor, req.id);
    return reply.send({ success: true, vehicles: updated });
  });

  // Status Publishing
  mountRoute("patch", "/api/v1/admin/:entityType/:id/status", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const { entityType, id } = req.params as { entityType: any; id: string };
    const { status } = req.body as { status: "published" | "archived" };
    if (status !== "published" && status !== "archived") {
      throw new AppError("VALIDATION_ERROR", "Status must be published or archived", 400);
    }
    const updated = await adminService.updateProductStatus(entityType, id, status, actor, req.id);
    return reply.send({ success: true, entity: updated });
  });

  // Audit Logs
  mountRoute("get", "/api/v1/admin/audit-logs", async (req: FastifyRequest<any>) => {
    const actor = getActor(req);
    const logs = await adminService.listAuditLogs(actor);
    return { success: true, audit_logs: logs };
  });

  // Publishing Events
  mountRoute("get", "/api/v1/admin/publishing/events", async (req: FastifyRequest<any>) => {
    const actor = getActor(req);
    const events = await adminService.listPublishEvents(actor);
    return { success: true, publish_events: events };
  });

  mountRoute("post", "/api/v1/admin/publishing/events/:id/retry", async (req: FastifyRequest<any>, reply: FastifyReply) => {
    const actor = getActor(req);
    const { id } = req.params as { id: string };
    const event = await adminService.retryPublishEvent(id, actor, req.id);
    return reply.send({ success: true, event });
  });
}
