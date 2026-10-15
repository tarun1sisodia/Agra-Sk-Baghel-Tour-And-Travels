import type { FastifyInstance } from "fastify";
import type { createReviewController } from "./review.controller.js";

export async function registerReviewRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createReviewController>,
): Promise<void> {
  app.get("/api/v1/catalog/:id/reviews", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: controller.listPublished,
  });
  app.post("/api/v1/reviews", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    handler: controller.submit,
  });
  // Admin moderation endpoints are served canonically by registerReviewsRoutes
}
