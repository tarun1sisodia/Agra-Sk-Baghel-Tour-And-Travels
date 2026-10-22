import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { registerLegacyRouteTelemetry } from "../../src/middlewares/legacyRouteTelemetry.js";

describe("legacy route telemetry", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    "/api/v1/fares/calculate",
    "/api/v1/bookings/draft",
    "/api/v1/payments/create-checkout",
  ])("marks %s as deprecated while preserving response behavior", async (url) => {
    const app = Fastify({ logger: false });
    registerLegacyRouteTelemetry(app);
    app.post(url, async () => ({ success: true }));
    const response = await app.inject({ method: "POST", url, payload: {} });
    expect(response.statusCode).toBe(200);
    expect(response.headers.deprecation).toBe("true");
    expect(response.headers["x-api-deprecated"]).toBe("true");
    await app.close();
  });

  it("does not mark unrelated endpoints deprecated", async () => {
    const app = Fastify({ logger: false });
    registerLegacyRouteTelemetry(app);
    app.get("/api/v1/bookings", async () => ({ success: true }));
    const response = await app.inject({ method: "GET", url: "/api/v1/bookings" });
    expect(response.statusCode).toBe(200);
    expect(response.headers.deprecation).toBeUndefined();
    await app.close();
  });
});
