import { describe, it, expect } from "vitest";
import { LocationIqService } from "../../src/modules/routes/locationiq.service.js";

describe("LocationIQ Service Unit Tests (AA-09 to AA-11)", () => {
  it("AA-10: Mocked LocationIQ returns 230,456 m and 14,730 s -> 230.5 km and 246 min", async () => {
    const mockFetch = async (urlStr: string) => {
      const url = new URL(urlStr);
      if (url.pathname.includes("/search")) {
        const q = url.searchParams.get("q");
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              lat: q === "Agra" ? "27.1767" : "28.6139",
              lon: q === "Agra" ? "78.0081" : "77.2090",
              display_name: `${q}, India`,
            },
          ],
        } as Response;
      }
      if (url.pathname.includes("/directions/driving")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            routes: [
              {
                distance: 230456, // meters
                duration: 14730,  // seconds
              },
            ],
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    };

    const service = new LocationIqService("test-key-mock", mockFetch as any);
    const result = await service.calculateDistance("Agra", "Delhi");

    expect(result.distance_km).toBe(230.5);
    expect(result.duration_minutes).toBe(246);
    expect(result.resolved_origin).toBe("Agra, India");
    expect(result.resolved_destination).toBe("Delhi, India");
  });

  it("AA-11: Geocode failure throws GEOCODE_FAILED", async () => {
    const mockFetch = async (urlStr: string) => {
      if (urlStr.includes("/search")) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    };

    const service = new LocationIqService("test-key-mock", mockFetch as any);
    await expect(service.calculateDistance("NonExistentPlace123", "Delhi")).rejects.toThrow("GEOCODE_FAILED");
  });

  it("AA-11: Routing failure throws ROUTING_FAILED", async () => {
    const mockFetch = async (urlStr: string) => {
      if (urlStr.includes("/search")) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ lat: "27.1", lon: "78.0", display_name: "Place" }],
        } as Response;
      }
      if (urlStr.includes("/directions/driving")) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: "Cannot route" }),
        } as Response;
      }
      return { ok: false, status: 500 } as Response;
    };

    const service = new LocationIqService("test-key-mock", mockFetch as any);
    await expect(service.calculateDistance("Agra", "Unreachable")).rejects.toThrow("ROUTING_FAILED");
  });

  it("Throws SETTINGS_MISSING if API key is omitted", async () => {
    const service = new LocationIqService(undefined);
    await expect(service.calculateDistance("Agra", "Delhi")).rejects.toThrow("SETTINGS_MISSING");
  });
});
