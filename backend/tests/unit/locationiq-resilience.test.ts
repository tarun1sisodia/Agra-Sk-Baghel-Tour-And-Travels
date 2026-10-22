import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationIqService } from "../../src/modules/routes/locationiq.service.js";
import {
  createLocationIqProvider,
  createStaticGeocodingProvider,
} from "../../src/providers/GeocodingProvider.js";
import { CURATED_PLACES } from "../../src/modules/fares/fare.catalogue.js";

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function locationIqBody(url: URL): unknown {
  if (url.pathname.includes("/search")) {
    const query = url.searchParams.get("q") ?? "Unknown";
    return [{ lat: "27.1767", lon: "78.0081", display_name: `${query}, India` }];
  }
  return { routes: [{ distance: 230456, duration: 14730 }] };
}

describe("LocationIqService resilience", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("retries HTTP 429 with the documented backoff and completes successfully", async () => {
    const calls: string[] = [];
    const statuses = [429, 200, 200, 200];
    const fetchImpl = async (input: URL | string): Promise<Response> => {
      const url = new URL(String(input));
      calls.push(url.pathname);
      const status = statuses.shift();
      return jsonResponse(status ?? 500, status === 200 ? locationIqBody(url) : undefined);
    };

    const service = new LocationIqService("test-locationiq-key", fetchImpl as typeof fetch);
    const pending = service.calculateDistance("Agra", "Delhi");

    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(799);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(400);
    expect(calls).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(400);
    expect(calls).toHaveLength(4);

    await expect(pending).resolves.toMatchObject({
      distance_km: 230.5,
      duration_minutes: 246,
      resolved_origin: "Agra, India",
      resolved_destination: "Delhi, India",
    });
  });

  it("maps exhausted HTTP 429 retries to UPSTREAM_ERROR", async () => {
    let callCount = 0;
    const fetchImpl = async (): Promise<Response> => {
      callCount += 1;
      return jsonResponse(429);
    };

    const service = new LocationIqService("test-locationiq-key", fetchImpl as typeof fetch);
    const pending = service.calculateDistance("Agra", "Delhi");
    const rejection = expect(pending).rejects.toThrow("UPSTREAM_ERROR");
    await vi.advanceTimersByTimeAsync(800);
    await vi.advanceTimersByTimeAsync(1600);

    await rejection;
    expect(callCount).toBe(3);
  });

  it("retries request exceptions and succeeds when a later request responds", async () => {
    let callCount = 0;
    const fetchImpl = async (input: URL | string): Promise<Response> => {
      callCount += 1;
      if (callCount <= 2) throw new Error("temporary socket reset");
      return jsonResponse(200, locationIqBody(new URL(String(input))));
    };

    const service = new LocationIqService("test-locationiq-key", fetchImpl as typeof fetch);
    const pending = service.calculateDistance("Agra", "Delhi");
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toMatchObject({ distance_km: 230.5, duration_minutes: 246 });
    expect(callCount).toBe(5);
  });

  it("propagates the final request exception after retry exhaustion", async () => {
    let callCount = 0;
    const networkError = new Error("socket closed");
    const fetchImpl = async (): Promise<Response> => {
      callCount += 1;
      throw networkError;
    };

    const service = new LocationIqService("test-locationiq-key", fetchImpl as typeof fetch);
    const pending = service.calculateDistance("Agra", "Delhi");
    const rejection = expect(pending).rejects.toBe(networkError);
    await vi.runAllTimersAsync();

    await rejection;
    expect(callCount).toBe(3);
  });

  it("caches geocodes by normalized query while still routing each distance request", async () => {
    let searchCalls = 0;
    let routeCalls = 0;
    const fetchImpl = async (input: URL | string): Promise<Response> => {
      const url = new URL(String(input));
      if (url.pathname.includes("/search")) searchCalls += 1;
      if (url.pathname.includes("/directions/driving")) routeCalls += 1;
      return jsonResponse(200, locationIqBody(url));
    };

    const service = new LocationIqService("test-locationiq-key", fetchImpl as typeof fetch);
    const first = service.calculateDistance(" Agra ", " Delhi ");
    await vi.runAllTimersAsync();
    await first;

    const second = service.calculateDistance("agra", "delhi");
    await vi.runAllTimersAsync();
    await second;

    expect(searchCalls).toBe(2);
    expect(routeCalls).toBe(2);
  });

  it("requires an API key before attempting a distance calculation", async () => {
    const service = new LocationIqService(undefined);
    await expect(service.calculateDistance("Agra", "Delhi")).rejects.toThrow("SETTINGS_MISSING");
  });
});

describe("GeocodingProvider exports", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("maps LocationIQ autocomplete results and sends the configured query parameters", async () => {
    let requestedUrl: URL | undefined;
    const fetchImpl = async (input: URL | string, init?: RequestInit): Promise<Response> => {
      requestedUrl = new URL(String(input));
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return jsonResponse(200, [
        {
          place_id: "98765",
          display_name: "<b>Taj Mahal</b>, Agra",
          address: { city: "Agra", state: "Uttar Pradesh" },
          lat: "27.1751",
          lon: "78.0421",
        },
      ]);
    };

    const provider = createLocationIqProvider("valid-locationiq-token", fetchImpl as typeof fetch);
    await expect(provider.autocomplete("  Taj Mahal ")).resolves.toEqual([
      {
        placeId: "98765",
        displayName: "Taj Mahal, Agra",
        city: "Agra",
        state: "Uttar Pradesh",
        country: "India",
        lat: 27.1751,
        lon: 78.0421,
      },
    ]);

    expect(requestedUrl?.toString()).toContain("https://api.locationiq.com/v1/autocomplete?");
    expect(requestedUrl?.searchParams.get("key")).toBe("valid-locationiq-token");
    expect(requestedUrl?.searchParams.get("q")).toBe("Taj Mahal");
    expect(requestedUrl?.searchParams.get("limit")).toBe("8");
    expect(requestedUrl?.searchParams.get("countrycodes")).toBe("in");
    expect(requestedUrl?.searchParams.get("dedupe")).toBe("1");
  });

  it("does not fall back when createLocationIqProvider receives an upstream error", async () => {
    const fetchImpl = async (): Promise<Response> => jsonResponse(503, { error: "temporarily unavailable" });
    const provider = createLocationIqProvider("valid-locationiq-token", fetchImpl as typeof fetch);

    await expect(provider.autocomplete("Agra")).rejects.toThrow("LocationIQ HTTP 503");
  });

  it("propagates request exceptions from the injected autocomplete fetch", async () => {
    const networkError = new Error("autocomplete socket reset");
    const fetchImpl = async (): Promise<Response> => {
      throw networkError;
    };
    const provider = createLocationIqProvider("valid-locationiq-token", fetchImpl as typeof fetch);

    await expect(provider.autocomplete("Agra")).rejects.toBe(networkError);
  });

  it("rejects short tokens and does not turn an absent token into a LocationIQ provider", () => {
    expect(() => createLocationIqProvider("")).toThrow("LocationIQ token is required");
    expect(() => createLocationIqProvider("short")).toThrow("LocationIQ token is required");
  });

  it("uses the curated static provider for tokenless configuration and short queries return no results", async () => {
    const provider = createStaticGeocodingProvider(CURATED_PLACES);

    await expect(provider.autocomplete("tAj")).resolves.toEqual([
      expect.objectContaining({
        placeId: "taj-mahal",
        displayName: "Taj Mahal East Gate, Uttar Pradesh",
        city: "Agra",
        state: "Uttar Pradesh",
        country: "India",
        lat: null,
        lon: null,
      }),
    ]);
    await expect(provider.autocomplete("a")).resolves.toEqual([]);
  });
});
