import type { FastifyInstance } from "fastify";

const LEGACY_ROUTE_PREFIXES = [
  "/api/v1/fares/calculate",
  "/api/v1/bookings/draft",
  "/api/v1/payments/create-checkout",
] as const;

function isLegacyRoute(url: string): boolean {
  const pathname = url.split("?", 1)[0] ?? url;
  return LEGACY_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Emits structured usage evidence and deprecation metadata without changing legacy behavior. */
export function registerLegacyRouteTelemetry(app: FastifyInstance): void {
  app.addHook("onRequest", async (request) => {
    if (!isLegacyRoute(request.url)) return;
    request.log.warn(
      { event: "LEGACY_ENDPOINT_CALLED", method: request.method, route: request.url.split("?", 1)[0] },
      "Deprecated compatibility endpoint called",
    );
  });

  app.addHook("onSend", async (request, reply, payload) => {
    if (isLegacyRoute(request.url)) {
      reply.header("Deprecation", "true");
      reply.header("X-API-Deprecated", "true");
    }
    return payload;
  });
}
