import type { FastifyInstance } from "fastify";
import type { createPromosController } from "./promos.controller.js";

export async function registerPromosRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createPromosController>,
): Promise<void> {
  // Public rate-limited featured promo endpoint (120 req/min like manifest endpoints)
  app.get("/api/v1/promos/featured", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.featured,
  });

  // Admin operations routes with admin auth
  app.get("/api/v1/ops/admin/promos", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.list,
  });

  app.get("/api/v1/ops/admin/promos/:id", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.get,
  });

  app.post("/api/v1/ops/admin/promos", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.create,
  });

  app.patch("/api/v1/ops/admin/promos/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.update,
  });

  app.delete("/api/v1/ops/admin/promos/:id", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: controller.remove,
  });
}
