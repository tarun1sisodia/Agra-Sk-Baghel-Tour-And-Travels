import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { CreateBookingRequest } from "../../contracts/fare-system.js";
import { BookingsService, PriceChangedError } from "./bookings.service.js";
import { AppError } from "../../shared/errors.js";

export function registerBookingsRoutes(app: FastifyInstance, bookingsService: BookingsService) {
  const handleCreateBooking = async (req: FastifyRequest, reply: FastifyReply) => {
    let parsed: any;
    try {
      parsed = CreateBookingRequest.parse(req.body);
    } catch (err: any) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: err.message,
        issues: err.issues,
      });
    }

    try {
      const user = (req as any).user;
      const booking = await bookingsService.createBooking(parsed, user?.id);
      return reply.status(201).send({
        success: true,
        booking,
      });
    } catch (err: any) {
      if (err instanceof PriceChangedError) {
        return reply.status(409).send({
          error: "PRICE_CHANGED",
          message: "The fare has changed. Please confirm the updated quote.",
          fresh_quote: err.freshQuote,
        });
      }

      if (
        err.message === "PRODUCT_INACTIVE" ||
        err.message === "VEHICLE_NOT_AVAILABLE" ||
        err.message === "CAPACITY_EXCEEDED" ||
        err.message === "TRIP_TOO_LONG"
      ) {
        return reply.status(400).send({
          error: err.message,
          message: err.message,
        });
      }

      if (err.message === "NOT_FOUND") {
        return reply.status(404).send({
          error: "NOT_FOUND",
          message: "The requested route, product, or car was not found.",
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

  const handleGetBooking = async (
    req: FastifyRequest<{ Params: { id: string }; Querystring: { token?: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    if (typeof bookingsService.getBookingDetail === "function") {
      const detail = await bookingsService.getBookingDetail(id);
      if (detail) {
        return reply.send({ success: true, booking: detail });
      }
    }

    let booking = await bookingsService.getBookingById(id);
    if (!booking) {
      booking = await bookingsService.getBookingByTicketId(id);
    }
    if (!booking) {
      return reply.status(404).send({
        error: "NOT_FOUND",
        message: "Booking not found",
      });
    }

    return reply.send({ success: true, booking });
  };

  app.post("/bookings", handleCreateBooking);
  app.post("/api/v1/bookings", handleCreateBooking);

  app.get("/bookings/:id", handleGetBooking);
  app.get("/api/v1/bookings/:id", handleGetBooking);
}
