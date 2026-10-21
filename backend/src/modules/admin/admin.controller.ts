import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { ADMIN_ROLES, DISPATCH_ROLES, requireRole } from "../../middlewares/roleGuard.js";
import type { createBookingService } from "../bookings/booking.service.js";
import type { createPaymentService } from "../payments/payment.service.js";
import {
  AdminActivateFareRuleSchema,
  AdminBookingQuerySchema,
  AdminInquiryIdParamSchema,
  AdminInquiryQuerySchema,
  AdminPaymentQuerySchema,
  AdminUpdateFareRulesSchema,
  AdminUpdateInquirySchema,
  BookingIdParamSchema,
  CreateRefundSchema,
  TransitionBookingSchema,
} from "./admin.schema.js";
import type { createAdminService } from "./admin.service.js";

export function createAdminController(
  service: ReturnType<typeof createAdminService>,
  payments: ReturnType<typeof createPaymentService>,
  bookings: ReturnType<typeof createBookingService>,
) {
  return {
    async listBookings(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const query = AdminBookingQuerySchema.parse(request.query);
      const data = await service.listBookings(query);
      return sendSuccess(reply, data);
    },

    async transitionBooking(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const { id } = BookingIdParamSchema.parse(request.params);
      const body = TransitionBookingSchema.parse(request.body);
      const actor = requireUser(request);
      const updated = await bookings.transition(id, body.to, body.expectedVersion, {
        actorId: actor.id,
        actorRole: actor.role,
        requestId: request.id,
      });
      return sendSuccess(reply, updated);
    },

    async unmaskBooking(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, DISPATCH_ROLES);
      const { id } = BookingIdParamSchema.parse(request.params);
      const actor = requireUser(request);
      const data = await service.unmaskBooking(id, actor, request.id);
      return sendSuccess(reply, data);
    },

    async auditLogs(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const logs = await service.listAuditLogs(100);
      return sendSuccess(reply, logs);
    },

    async refund(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const actor = requireUser(request);
      const body = CreateRefundSchema.parse(request.body);
      const data = await payments.refund({
        bookingId: body.bookingId,
        reason: body.reason,
        idempotencyKey: body.idempotencyKey,
        actorId: actor.id,
        amountMinor: body.amountMinor,
      });
      return sendSuccess(reply, data, 201);
    },

    async listInquiries(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const query = AdminInquiryQuerySchema.parse(request.query);
      const data = await service.listInquiries(query);
      return sendSuccess(reply, data);
    },

    async updateInquiry(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const { id } = AdminInquiryIdParamSchema.parse(request.params);
      const body = AdminUpdateInquirySchema.parse(request.body);
      const updated = await service.updateInquiry(id, body);
      return sendSuccess(reply, updated);
    },

    async listPayments(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const query = AdminPaymentQuerySchema.parse(request.query);
      const data = await service.listPayments(query);
      return sendSuccess(reply, data);
    },

    async getFareRules(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const rules = await service.getFareRules();
      return sendSuccess(reply, rules);
    },

    async updateFareRules(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const actor = requireUser(request);
      const body = AdminUpdateFareRulesSchema.parse(request.body);
      const rules = await service.updateFareRules(actor, body, request.ip);
      return sendSuccess(reply, rules, 200);
    },

    async activateFareRules(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const actor = requireUser(request);
      const body = AdminActivateFareRuleSchema.parse(request.body);
      const rules = await service.activateFareRules(actor, body.version);
      return sendSuccess(reply, rules, 200);
    },

    async listFareRuleVersions(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const versions = await service.listFareRuleVersions();
      return sendSuccess(reply, versions);
    },
  };
}
