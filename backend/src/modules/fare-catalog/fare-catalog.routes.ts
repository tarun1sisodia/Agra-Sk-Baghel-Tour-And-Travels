import type { FastifyInstance } from "fastify";
import type { FareCatalogRepository } from "./fare-catalog.repository.js";
import { CategoryCode } from "../../contracts/fare-system.js";

export function registerFareCatalogRoutes(fastify: FastifyInstance, repo: FareCatalogRepository): void {
  const catalogHandler = async (_req: any, reply: any) => {
    try {
      const data = await repo.getPublishedCatalog();
      return reply.status(200).send(data);
    } catch (err: any) {
      return reply.status(500).send({ error: "INTERNAL_ERROR", message: err.message });
    }
  };

  const productDetailHandler = async (req: any, reply: any) => {
    const { category, code } = req.params as { category: string; code: string };
    const parsedCat = CategoryCode.safeParse(category);
    if (!parsedCat.success) {
      return reply.status(400).send({ error: "VALIDATION_ERROR", message: `Invalid category: ${category}` });
    }

    try {
      const product = await repo.getPublishedProductDetail(parsedCat.data, code);
      if (!product) {
        return reply.status(404).send({ error: "NOT_FOUND", message: "Product not found or not published" });
      }
      return reply.status(200).send(product);
    } catch (err: any) {
      return reply.status(500).send({ error: "INTERNAL_ERROR", message: err.message });
    }
  };

  // Mount at root and /api/v1 canonical prefix
  fastify.get("/catalog", catalogHandler);
  fastify.get("/api/v1/catalog", catalogHandler);

  fastify.get("/catalog/:category/:code", productDetailHandler);
  fastify.get("/api/v1/catalog/:category/:code", productDetailHandler);
}
