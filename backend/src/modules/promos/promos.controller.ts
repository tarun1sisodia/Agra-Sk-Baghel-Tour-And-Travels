import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { ADMIN_ROLES, requireRole } from "../../middlewares/roleGuard.js";
import {
  CreatePromoSchema,
  PromoIdParamsSchema,
  UpdatePromoSchema,
} from "./promos.schema.js";
import type { createPromosService } from "./promos.service.js";

export function createPromosController(service: ReturnType<typeof createPromosService>) {
  const admin = (request: FastifyRequest) => {
    requireRole(request, ADMIN_ROLES);
    requireUser(request);
  };

  return {
    async publicList(_request: FastifyRequest, reply: FastifyReply) {
      const items = await service.listPublic();
      return sendSuccess(reply, items.map((promo) => ({ code: promo.code, discountAmount: promo.discountAmount, minTotal: promo.minTotal, description: promo.description, allowGroupVehicles: promo.allowGroupVehicles })));
    },

    async validatePublic(request: FastifyRequest, reply: FastifyReply) {
      const body = z.object({ code: z.string().trim().min(3).max(30), baseFare: z.number().nonnegative(), category: z.string().optional(), routeSlug: z.string().optional(), vehicleCode: z.string().optional() }).parse(request.body);
      const result = await service.validate(body.code, body.baseFare, body.vehicleCode || body.category);
      if (!result.valid) return reply.code(400).send(result);
      return sendSuccess(reply, result);
    },

    async list(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const items = await service.list();
      return sendSuccess(reply, items);
    },

    async get(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const { id } = PromoIdParamsSchema.parse(request.params);
      const promo = await service.get(id);
      return sendSuccess(reply, promo);
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const body = CreatePromoSchema.parse(request.body);
      const created = await service.create(body);
      return sendSuccess(reply, created, 201);
    },

    async update(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const { id } = PromoIdParamsSchema.parse(request.params);
      const body = UpdatePromoSchema.parse(request.body);
      const updated = await service.update(id, body);
      return sendSuccess(reply, updated);
    },

    async remove(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const { id } = PromoIdParamsSchema.parse(request.params);
      await service.remove(id);
      return sendSuccess(reply, { deleted: true });
    },

    async featured(_request: FastifyRequest, reply: FastifyReply) {
      const featured = await service.getFeatured();
      return sendSuccess(reply, featured);
    },
  };
}
