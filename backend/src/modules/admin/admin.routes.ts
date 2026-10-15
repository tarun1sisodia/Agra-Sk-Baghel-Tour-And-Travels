import type { FastifyInstance } from "fastify";
import type { createAdminController } from "./admin.controller.js";

export async function registerAdminRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createAdminController>,
): Promise<void> {
  app.get("/api/v1/ops/admin/audit-logs", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.auditLogs,
  });

  app.get("/api/v1/ops/admin/bookings", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listBookings,
  });

  app.post("/api/v1/ops/admin/bookings/:id/transition", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.transitionBooking,
  });

  app.post("/api/v1/ops/admin/bookings/:id/unmask", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.unmaskBooking,
  });

  app.get("/api/v1/ops/admin/bookings/:id/unmask", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.unmaskBooking,
  });

  app.post("/api/v1/ops/admin/refunds", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    handler: controller.refund,
  });

  app.get("/api/v1/ops/admin/inquiries", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listInquiries,
  });

  app.patch("/api/v1/ops/admin/inquiries/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.updateInquiry,
  });

  app.get("/api/v1/ops/admin/payments", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listPayments,
  });

  app.get("/api/v1/ops/admin/fare-rules", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.getFareRules,
  });

  app.put("/api/v1/ops/admin/fare-rules", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.updateFareRules,
  });

  app.post("/api/v1/ops/admin/fare-rules/activate", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.activateFareRules,
  });

  app.get("/api/v1/ops/admin/fare-rules/versions", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listFareRuleVersions,
  });
}
