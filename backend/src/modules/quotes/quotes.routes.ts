import type { FastifyInstance } from "fastify";
import { QuoteRequest, OptionsRequest } from "../../contracts/fare-system.js";
import type { QuotesService } from "./quotes.service.js";

export function registerQuotesRoutes(fastify: FastifyInstance, quotesService: QuotesService): void {
  // POST /quotes
  fastify.post("/quotes", async (req, reply) => {
    const parseResult = QuoteRequest.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        details: parseResult.error.format(),
      });
    }

    try {
      const response = await quotesService.quote(parseResult.data);
      return reply.status(200).send(response);
    } catch (err: any) {
      const message = err.message || "INTERNAL_ERROR";
      if (message === "NOT_FOUND") return reply.status(404).send({ error: "NOT_FOUND" });
      if (message === "PRODUCT_INACTIVE") return reply.status(400).send({ error: "PRODUCT_INACTIVE" });
      if (message === "VEHICLE_NOT_AVAILABLE") return reply.status(400).send({ error: "VEHICLE_NOT_AVAILABLE" });
      if (message === "CAPACITY_EXCEEDED") return reply.status(400).send({ error: "CAPACITY_EXCEEDED" });
      if (message === "TRIP_TOO_LONG") return reply.status(400).send({ error: "TRIP_TOO_LONG" });
      if (message === "SETTINGS_MISSING") return reply.status(500).send({ error: "SETTINGS_MISSING" });
      if (message === "VALIDATION_ERROR") return reply.status(400).send({ error: "VALIDATION_ERROR" });

      return reply.status(500).send({ error: message });
    }
  });

  // POST /quotes/options
  fastify.post("/quotes/options", async (req, reply) => {
    const parseResult = OptionsRequest.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        details: parseResult.error.format(),
      });
    }

    try {
      const response = await quotesService.options(parseResult.data);
      return reply.status(200).send(response);
    } catch (err: any) {
      const message = err.message || "INTERNAL_ERROR";
      if (message === "NOT_FOUND") return reply.status(404).send({ error: "NOT_FOUND" });
      if (message === "PRODUCT_INACTIVE") return reply.status(400).send({ error: "PRODUCT_INACTIVE" });
      if (message === "TRIP_TOO_LONG") return reply.status(400).send({ error: "TRIP_TOO_LONG" });
      if (message === "SETTINGS_MISSING") return reply.status(500).send({ error: "SETTINGS_MISSING" });
      if (message === "VALIDATION_ERROR") return reply.status(400).send({ error: "VALIDATION_ERROR" });

      return reply.status(500).send({ error: message });
    }
  });
}
