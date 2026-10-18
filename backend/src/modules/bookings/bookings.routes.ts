import crypto from "node:crypto";
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

    if (booking.guest_access_token) {
      const callerToken =
        (req.headers["x-guest-token"] as string | undefined) ||
        (req.headers["x-booking-token"] as string | undefined) ||
        req.query?.token;
      const user = (req as any).user;

      const isAdmin = user && ["admin", "super_admin", "staff", "dispatcher"].includes(user.role);
      const isOwnerUser = booking.user_id && user && user.id === booking.user_id;
      let isGuestTokenValid = false;
      if (callerToken) {
        const a = Buffer.from(String(callerToken).trim(), "utf8");
        const b = Buffer.from(String(booking.guest_access_token).trim(), "utf8");
        if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
          isGuestTokenValid = true;
        }
      }

      if (!isAdmin && !isOwnerUser && !isGuestTokenValid) {
        return reply.status(403).send({
          error: "FORBIDDEN",
          message: "Invalid or missing booking access token",
        });
      }
    }

    return reply.send({ success: true, booking });
  };

  app.post("/bookings", handleCreateBooking);
  app.post("/api/v1/bookings", handleCreateBooking);

  app.get("/bookings/:id", handleGetBooking);
  app.get("/api/v1/bookings/:id", handleGetBooking);
}
