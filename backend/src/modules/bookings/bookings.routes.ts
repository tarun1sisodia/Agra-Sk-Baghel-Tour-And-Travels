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
      if (!user || !user.id) {
        return reply.status(401).send({
          error: "AUTH_REQUIRED",
          message: "You must be signed in to book a service.",
        });
      }
      const booking = await bookingsService.createBooking(parsed, user.id);
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
    req: FastifyRequest<{ Params: { id: string } }>,
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

    const user = (req as any).user;
    if (!user || !user.id) {
      return reply.status(401).send({
        error: "AUTH_REQUIRED",
        message: "You must be signed in to view booking details.",
      });
    }

    const isAdmin = ["admin", "super_admin", "staff", "dispatcher"].includes(user.role);
    const isOwnerUser =
      (booking.user_id && user.id === booking.user_id) ||
      (booking.customer_email && user.email && user.email.toLowerCase() === booking.customer_email.toLowerCase());

    if (!isAdmin && !isOwnerUser) {
      return reply.status(403).send({
        error: "FORBIDDEN",
        message: "You do not have permission to view this booking.",
      });
    }

    if (typeof bookingsService.getBookingDetail === "function") {
      const detail = await bookingsService.getBookingDetail(id);
      if (detail) {
        return reply.send({ success: true, booking: detail });
      }
    }

    return reply.send({ success: true, booking });
  };

  app.post("/bookings", handleCreateBooking);
  app.post("/api/v1/bookings", handleCreateBooking);

  app.get("/bookings/:id", handleGetBooking);
  app.get("/api/v1/bookings/:id", handleGetBooking);
}
