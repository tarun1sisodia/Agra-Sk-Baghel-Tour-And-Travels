import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

/**
 * Network & Transport Protocol Headers Plugin (Technique 1)
 *
 * Implements hyper-scale network optimizations:
 * 1. Advertises HTTP/3 (QUIC) capability via Alt-Svc header.
 *
 * NOTE (SEC-002): Timing-Allow-Origin has been intentionally removed.
 * Setting Timing-Allow-Origin: * allows any cross-origin page to measure precise
 * API response times via the Resource Timing API, creating a timing oracle.
 * Browser same-origin policy adequately protects same-origin RUM measurements.
 */
export function registerNetworkHeaders(app: FastifyInstance): void {
  app.addHook("onSend", async (_request: FastifyRequest, reply: FastifyReply, payload) => {
    // 1. Advertise HTTP/3 over QUIC on port 443 with a 24-hour max-age
    reply.header("Alt-Svc", 'h3=":443"; ma=86400');

    // 2. Enforce private, non-cached delivery for dynamic API endpoints if not already specified
    if (!reply.hasHeader("cache-control")) {
      reply.header("Cache-Control", "no-store, no-cache, must-revalidate, private");
    }

    return payload;
  });
}
