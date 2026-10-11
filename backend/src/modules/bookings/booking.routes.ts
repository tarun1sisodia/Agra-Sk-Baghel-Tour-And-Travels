import type { FastifyInstance } from "fastify";
import type { createBookingController } from "./booking.controller.js";

export async function registerBookingRoutes(
  app: FastifyInstance,
  controller: ReturnType<typeof createBookingController>,
): Promise<void> {
  app.post("/api/v1/bookings/draft", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: controller.createDraft,
  });
  app.get("/api/v1/me/profile", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } }, handler: controller.getMyProfile });
  app.get("/api/v1/me/bookings", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } }, handler: controller.listMine });
  app.get("/api/v1/me/bookings/:bookingId", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } }, handler: controller.getMine });
}
