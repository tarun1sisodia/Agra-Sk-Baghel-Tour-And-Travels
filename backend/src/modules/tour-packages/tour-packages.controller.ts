// backend/src/modules/tour-packages/tour-packages.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CONTENT_ROLES, requireRole, SUPER_ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import type { createTourPackagesService } from "./tour-packages.service.js";
import {
  CreateTourPackageSchema,
  TourPackageCodeSchema,
  TourPackageIdSchema,
  TourPackageQuerySchema,
  TourPackageUpgradeSchema,
  UpdateTourPackageSchema,
  UploadTourPackageImageSchema,
} from "./tour-packages.schema.js";

export function createTourPackagesController(service: ReturnType<typeof createTourPackagesService>) {
  const admin = (request: FastifyRequest) => requireRole(request, CONTENT_ROLES);

  return {
    async manifest(_request: FastifyRequest, reply: FastifyReply) {
      const result = await service.list({ status: "published", limit: 100 });
      const globalUpgrades = await service.listUpgrades(null);
      const itemsWithUpgrades = await Promise.all(
        result.items.filter((item) => item.isActive).map(async (item) => {
          const specificUpgrades = await service.listUpgrades(item.id);
          return {
            ...item,
            upgrades: specificUpgrades.length > 0 ? specificUpgrades : globalUpgrades,
          };
        })
      );
      return sendSuccess(reply, itemsWithUpgrades);
    },
    async publicGetByCode(request: FastifyRequest, reply: FastifyReply) {
      const { code } = TourPackageCodeSchema.parse(request.params);
      const item = await service.getByCode(code);
      if (item.status !== "published" || !item.isActive) {
        reply.code(404);
        return reply.send({ success: false, error: { code: "NOT_FOUND", message: "Package not found" } });
      }
      const specificUpgrades = await service.listUpgrades(item.id);
      const upgrades = specificUpgrades.length > 0 ? specificUpgrades : await service.listUpgrades(null);
      return sendSuccess(reply, { ...item, upgrades });
    },
    async list(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      return sendSuccess(reply, await service.list(TourPackageQuerySchema.parse(request.query ?? {})));
    },
    async get(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const { id } = TourPackageIdSchema.parse(request.params);
      return sendSuccess(reply, await service.get(id));
    },
    async create(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      return sendSuccess(reply, await service.create(CreateTourPackageSchema.parse(request.body)), 201);
    },
    async update(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const { id } = TourPackageIdSchema.parse(request.params);
      return sendSuccess(reply, await service.update(id, UpdateTourPackageSchema.parse(request.body)));
    },
    async publish(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      requireUser(request);
      const { id } = TourPackageIdSchema.parse(request.params);
      return sendSuccess(reply, await service.publish(id));
    },
    async archive(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      requireUser(request);
      const { id } = TourPackageIdSchema.parse(request.params);
      return sendSuccess(reply, await service.archive(id));
    },
    async remove(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const { id } = TourPackageIdSchema.parse(request.params);
      await service.remove(id);
      return sendSuccess(reply, { deleted: true });
    },
    async checkCode(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const { code } = TourPackageCodeSchema.parse(request.query ?? {});
      return sendSuccess(reply, await service.checkCode(code));
    },
    async listUpgrades(request: FastifyRequest, reply: FastifyReply) {
      const packageId = (request.query as { packageId?: string })?.packageId ?? null;
      return sendSuccess(reply, await service.listUpgrades(packageId));
    },
    async saveUpgrade(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      return sendSuccess(reply, await service.saveUpgrade(TourPackageUpgradeSchema.parse(request.body)));
    },
    async deleteUpgrade(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const { id } = TourPackageIdSchema.parse(request.params);
      await service.deleteUpgrade(id);
      return sendSuccess(reply, { deleted: true });
    },
    async uploadImage(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const input = UploadTourPackageImageSchema.parse(request.body);
      return sendSuccess(reply, await service.uploadImage(input), 201);
    },
    async getMedia(request: FastifyRequest, reply: FastifyReply) {
      const { file } = request.params as { file: string };
      const media = await service.getMedia(file);
      if (!media) {
        reply.code(404);
        return reply.send({ success: false, error: { code: "NOT_FOUND", message: "Image not found" } });
      }
      return reply
        .header("Content-Type", media.mimeType)
        .header("Cache-Control", "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, stale-if-error=604800, immutable")
        .send(media.buffer);
    },
  };
}
