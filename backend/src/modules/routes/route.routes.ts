/**
 * @file route.routes.ts — HTTP Route registrations for Intercity Highway Routes.
 * @usage Registered in Fastify app; serves both canonical /api/v1/routes and compatibility /api/v1/route-catalog endpoints.
 */

import type { FastifyInstance } from "fastify";
import type { createRouteController } from "./route.controller.js";

export async function registerRouteRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createRouteController>,
): Promise<void> {
  // --- Canonical Public Endpoints ---
  app.get("/api/v1/routes", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, controller.manifest);
  app.get("/api/v1/routes/manifest", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, controller.manifest);
  app.get("/api/v1/routes/fleets", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, controller.fleets);
  app.get("/api/v1/routes/by-slug/:slug", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, controller.getBySlug);

  // --- Canonical Admin Operations Endpoints ---
  app.get("/api/v1/ops/admin/routes", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, controller.list);
  app.get("/api/v1/ops/admin/routes/slug-check", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, controller.slugCheck);
  app.get("/api/v1/ops/admin/routes/:id", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, controller.get);
  app.post("/api/v1/ops/admin/routes", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, controller.create);
  app.patch("/api/v1/ops/admin/routes/:id", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, controller.update);
  app.post("/api/v1/ops/admin/routes/:id/publish", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, controller.publish);
  app.post("/api/v1/ops/admin/routes/:id/archive", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, controller.archive);
  app.delete("/api/v1/ops/admin/routes/:id", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, controller.remove);
  app.post("/api/v1/ops/admin/routes/suggest-fares", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, controller.suggestFares);

  // --- Backward Compatibility Aliases for route-catalog Endpoints ---
  app.get("/api/v1/route-catalog/manifest", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, controller.manifest);
}
