import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { createCatalogController } from "../../src/modules/catalog/catalog.controller.js";
import { isAllowedReturnUrl } from "../../src/modules/payments/payment.service.js";
import { LocationIqService } from "../../src/modules/routes/locationiq.service.js";
import { createTestApp } from "../helpers.js";

describe("Strix security finding regressions", () => {
  it("blocks anonymous and customer requests before admin handlers run", async () => {
    const { app } = await createTestApp();
    const anonymous = await app.inject({ method: "GET", url: "/api/v1/ops/admin/catalog" });
    expect(anonymous.statusCode).toBe(401);

    const customer = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/catalog",
      headers: { authorization: "Bearer test-customer" },
    });
    expect(customer.statusCode).toBe(403);
    await app.close();
  });

  it("denies draft media preview to customers but permits operations roles", async () => {
    const calls: Array<{ allowUnpublished?: boolean }> = [];
    const controller = createCatalogController({
      getMediaContent: async (_id: string, options?: { allowUnpublished?: boolean }) => {
        calls.push(options ?? {});
        return options?.allowUnpublished
          ? { buffer: Buffer.from("draft"), mimeType: "image/webp", isPublished: false }
          : null;
      },
    } as any);

    const app = Fastify();
    app.addHook("preHandler", async (request) => {
      const role = request.headers["x-test-role"];
      (request as any).user = role ? { id: "test-user", role, email: null, phone: null } : undefined;
    });
    app.get("/api/v1/media/:id", controller.serveMedia);

    const customer = await app.inject({
      method: "GET",
      url: "/api/v1/media/draft-1",
      headers: { "x-test-role": "customer" },
    });
    expect(customer.statusCode).toBe(404);

    const editor = await app.inject({
      method: "GET",
      url: "/api/v1/media/draft-1",
      headers: { "x-test-role": "content_editor" },
    });
    expect(editor.statusCode).toBe(200);
    expect(calls).toEqual([{ allowUnpublished: false }, { allowUnpublished: true }]);
    await app.close();
  });

  it("accepts only exact configured payment callback origins", () => {
    const allowed = ["https://customer.example.test/", "http://localhost:5173"];
    expect(isAllowedReturnUrl("https://customer.example.test/payment/resume", allowed)).toBe(true);
    expect(isAllowedReturnUrl("http://localhost:5173/payment/resume", allowed)).toBe(true);
    expect(isAllowedReturnUrl("https://attacker.customer.example.test/payment/resume", allowed)).toBe(false);
    expect(isAllowedReturnUrl("https://customer.example.test.attacker.test/payment/resume", allowed)).toBe(false);
    expect(isAllowedReturnUrl("https://customer.example.test@attacker.test/payment/resume", allowed)).toBe(false);
  });

  it("sends LocationIQ requests with redirect following disabled", async () => {
    const requestOptions: RequestInit[] = [];
    const mockFetch = async (_url: string, options?: RequestInit) => {
      requestOptions.push(options ?? {});
      return {
        ok: true,
        status: 200,
        json: async () => [{ lat: "27.1", lon: "78.0", display_name: "Agra, India" }],
      } as Response;
    };
    const service = new LocationIqService("test-key", mockFetch as typeof fetch);
    await expect(service.calculateDistance("Agra", "Agra")).rejects.toThrow("ROUTING_FAILED");
    expect(requestOptions.length).toBe(2);
    expect(requestOptions.every((options) => options.redirect === "error")).toBe(true);
  });
});
