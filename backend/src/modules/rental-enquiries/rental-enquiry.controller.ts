import type { FastifyReply, FastifyRequest } from "fastify";
import { requireRole } from "../../middlewares/roleGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import {
  CreateRentalEnquirySchema,
  AdminRentalQuerySchema,
  RentalIdParamSchema,
  UpdateRentalSchema,
} from "./rental-enquiry.schema.js";
import type { createRentalEnquiryService } from "./rental-enquiry.service.js";

export function createRentalEnquiryController(service: ReturnType<typeof createRentalEnquiryService>) {
  return {
    async create(request: FastifyRequest, reply: FastifyReply) {
      const body = CreateRentalEnquirySchema.parse(request.body);
      const created = await service.create(body);
      return sendSuccess(
        reply,
        {
          ref: created.ref,
          phone: created.phone,
          id: created.id,
          vehicleGroupCode: created.vehicleGroupCode,
          vehicleModelId: created.vehicleModelId,
        },
        201
      );
    },

    async list(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const query = AdminRentalQuerySchema.parse(request.query ?? {});
      const result = await service.list({
        status: query.status,
        car: query.car,
        vehicleGroupCode: query.group,
        from: query.from,
        to: query.to,
        q: query.q,
        page: query.page,
        limit: query.limit,
      });
      return sendSuccess(reply, { ...result, rentalEnquiries: result.items });
    },

    async update(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, ADMIN_ROLES);
      const { id } = RentalIdParamSchema.parse(request.params);
      const body = UpdateRentalSchema.parse(request.body);
      return sendSuccess(reply, await service.update(id, body));
    },
  };
}
