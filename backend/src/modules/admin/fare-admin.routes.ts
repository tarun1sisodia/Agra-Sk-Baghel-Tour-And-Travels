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
  RouteCalculateRequest,
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

  // Vehicle Models
  app.post(
    "/admin/vehicle-models",
    wrap(async (req, reply) => {
      const actor = getActor(req);
      const parsed = VehicleModelCreate.parse(req.body);
      const created = await adminService.createVehicleModel(parsed, actor, req.id);
      return reply.status(201).send({ success: true, vehicle_model: created });
    })
  );

  app.patch(
    "/admin/vehicle-models/:id",
    wrap(async (req, reply) => {
      const actor = getActor(req);
      const { id } = req.params as { id: string };
      const parsed = VehicleModelPatch.parse(req.body);
      const updated = await adminService.patchVehicleModel(id, parsed, actor, req.id);
      return reply.send({ success: true, vehicle_model: updated });
    })
  );

  // Vehicle Groups
  app.patch(
    "/admin/vehicle-groups/:id",
    wrap(async (req, reply) => {
      const actor = getActor(req);
      const { id } = req.params as { id: string };
      const parsed = VehicleGroupPatch.parse(req.body);
      const updated = await adminService.patchVehicleGroup(id, parsed, actor, req.id);
      return reply.send({ success: true, vehicle_group: updated });
    })
  );

  // Fare Settings
  app.patch(
    "/admin/fare-settings/:key",
    wrap(async (req, reply) => {
      const actor = getActor(req);
      const { key } = req.params as { key: string };
      const parsed = FareSettingPatch.parse(req.body);
      const updated = await adminService.patchFareSetting(key, parsed.value, actor, req.id);
      return reply.send({ success: true, setting: updated });
    })
  );

  // Fare Rules
  app.post(
    "/admin/fare-rules",
    wrap(async (req, reply) => {
      const actor = getActor(req);
      const parsed = FareRuleCreate.parse(req.body);
      const created = await adminService.createFareRule(parsed, actor, req.id);
      return reply.status(201).send({ success: true, fare_rule: created });
    })
  );

  app.patch(
    "/admin/fare-rules/:id",
    wrap(async (req, reply) => {
      const actor = getActor(req);
      const { id } = req.params as { id: string };
      const parsed = FareRulePatch.parse(req.body);
      const updated = await adminService.patchFareRule(id, parsed, actor, req.id);
      return reply.send({ success: true, fare_rule: updated });
    })
  );

  // Extra Charges
  app.post(
    "/admin/extra-charges",
    wrap(async (req, reply) => {
      const actor = getActor(req);
      const parsed = ExtraChargeCreate.parse(req.body);
      const created = await adminService.createExtraCharge(parsed, actor, req.id);
      return reply.status(201).send({ success: true, extra_charge: created });
    })
  );

  // Routes LocationIQ Calculate
  app.post(
    "/admin/routes/calculate-distance",
    wrap(async (req, reply) => {
      getActor(req);
      const parsed = RouteCalculateRequest.parse(req.body);
      const res = await adminService.calculateDistance(parsed.origin, parsed.destination);
      return reply.send({ success: true, ...res });
    })
  );

  // Route Vehicles Grid
  app.put(
    "/admin/routes/:id/vehicles",
    wrap(async (req, reply) => {
      const actor = getActor(req);
      const { id } = req.params as { id: string };
      const parsed = RouteVehiclesPut.parse(req.body);
      const updated = await adminService.putRouteVehicles(id, parsed.vehicles, actor, req.id);
      return reply.send({ success: true, vehicles: updated });
    })
  );

  // Status Publishing
  app.patch(
    "/admin/:entityType/:id/status",
    wrap(async (req, reply) => {
      const actor = getActor(req);
      const { entityType, id } = req.params as { entityType: any; id: string };
      const { status } = req.body as { status: "published" | "archived" };
      if (status !== "published" && status !== "archived") {
        throw new AppError("VALIDATION_ERROR", "Status must be published or archived", 400);
      }
      const updated = await adminService.updateProductStatus(entityType, id, status, actor, req.id);
      return reply.send({ success: true, entity: updated });
    })
  );
}
