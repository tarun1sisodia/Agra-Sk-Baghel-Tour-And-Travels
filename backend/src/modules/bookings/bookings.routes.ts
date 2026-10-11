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

    // Guest token check if requested via token
    const token = req.query.token || (req.headers["x-guest-token"] as string);
    const user = (req as any).user;
    if (booking.user_id && user && user.id === booking.user_id) {
      return reply.send({ success: true, booking });
    }
    if (token && booking.guest_access_token === token) {
      return reply.send({ success: true, booking });
    }
    if (!booking.user_id && !token) {
      // Return public safe view without token
      const { guest_access_token, ...safe } = booking;
      return reply.send({ success: true, booking: safe });
    }

    return reply.send({ success: true, booking });
  };

  app.post("/bookings", handleCreateBooking);
  app.post("/api/v1/bookings", handleCreateBooking);

  app.get("/bookings/:id", handleGetBooking);
  app.get("/api/v1/bookings/:id", handleGetBooking);
}
