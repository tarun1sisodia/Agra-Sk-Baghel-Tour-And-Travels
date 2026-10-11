import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import {
  CreateDraftBookingSchema,
  MyBookingsQuerySchema,
  BookingIdParamSchema,
} from "./booking.schema.js";
import type { createBookingService } from "./booking.service.js";
import { Errors } from "../../shared/errors.js";

export function createBookingController(service: ReturnType<typeof createBookingService>, requireAuthForNewBookings = false) {
  return {
    async createDraft(request: FastifyRequest, reply: FastifyReply) {
      const body = CreateDraftBookingSchema.parse(request.body);
      if (requireAuthForNewBookings && !request.user) {
        throw Errors.unauthorized("Authentication is required for new bookings.");
      }
      const result = await service.createDraft(body, request.user ?? null);
      return sendSuccess(
        reply,
        {
          bookingId: result.booking.id,
          ticketId: result.booking.ticketId,
          guestAccessToken: result.guestAccessToken,
          status: result.booking.status,
          fare: result.booking.fareSnapshot,
          next: {
            action: "create-checkout",
            path: "/api/v1/payments/create-checkout",
          },
        },
        201,
      );
    },

    async listMine(request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) throw Errors.unauthorized();
      const query = MyBookingsQuerySchema.parse(request.query);
      return sendSuccess(reply, await service.listOwned(request.user.id, query.page, query.pageSize));
    },

    async getMine(request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) throw Errors.unauthorized();
      const params = BookingIdParamSchema.parse(request.params);
      return sendSuccess(reply, await service.getOwned(request.user.id, params.bookingId));
    },

    async getMyProfile(request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) throw Errors.unauthorized();
      const profile = await service.getOwnProfile(request.user.id);
      return sendSuccess(reply, {
        fullName: profile?.fullName ?? null,
        phone: profile?.phone ?? null,
        email: profile?.email ?? request.user.email ?? null,
      });
    },
  };
}
