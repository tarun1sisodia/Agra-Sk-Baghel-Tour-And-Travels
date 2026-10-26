// backend/src/modules/dossier-signoffs/dossier-signoffs.routes.ts
import type { FastifyInstance } from "fastify";
import type { createDossierSignoffsController } from "./dossier-signoffs.controller.js";

export async function registerDossierSignoffsRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createDossierSignoffsController>
): Promise<void> {
  // Public - Canonical
  app.get("/api/v1/dossier-signoffs", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: controller.publicList,
  });

  // Admin Operations - Canonical
  app.get("/api/v1/ops/admin/dossier-signoffs", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.list,
  });
  app.get("/api/v1/ops/admin/dossier-signoffs/:id", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.get,
  });
  app.patch("/api/v1/ops/admin/dossier-signoffs/:id", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.update,
  });
}
