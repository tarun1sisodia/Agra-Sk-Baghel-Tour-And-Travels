import { roundHalfUp } from "../fare-engine/rounding.js";

export interface RouteCalculateResult {
  distance_km: number;
  duration_minutes: number;
  resolved_origin: string;
  resolved_destination: string;
}

export class LocationIqService {
  constructor(
    private apiKey?: string,
    private fetchImpl: typeof fetch = fetch
  ) {}

  async calculateDistance(origin: string, destination: string): Promise<RouteCalculateResult> {
    if (!this.apiKey) {
      throw new Error("SETTINGS_MISSING");
    }

    // 1. Geocode origin
    const originGeo = await this.geocode(origin);
    // 2. Geocode destination
    const destGeo = await this.geocode(destination);

    // 3. Routing driving directions
    const routeData = await this.route(originGeo.lat, originGeo.lon, destGeo.lat, destGeo.lon);

    // Rounding per spec §5:
    // distance_km = round_half_up(metres / 1000, 1 decimal)
    // duration_minutes = round_half_up(seconds / 60)
    const distanceKm = Math.floor((routeData.distanceMeters / 1000) * 10 + 0.5) / 10;
    const durationMinutes = roundHalfUp(routeData.durationSeconds / 60);

    return {
      distance_km: distanceKm,
      duration_minutes: durationMinutes,
      resolved_origin: originGeo.displayName,
      resolved_destination: destGeo.displayName,
    };
  }

  private async geocode(query: string): Promise<{ lat: number; lon: number; displayName: string }> {
    const url = new URL("https://us1.locationiq.com/v1/search");
    url.searchParams.set("key", this.apiKey!);
    url.searchParams.set("q", query.trim());
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "in");

    let res: Response;
    try {
      res = await this.fetchImpl(url.toString(), {
        headers: { Accept: "application/json" },
      });
    } catch {
      throw new Error("UPSTREAM_ERROR");
    }

    if (!res.ok) {
      if (res.status === 404 || res.status === 422) {
        throw new Error("GEOCODE_FAILED");
      }
      throw new Error("UPSTREAM_ERROR");
    }

    const data = (await res.json()) as any[];
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("GEOCODE_FAILED");
    }

    const first = data[0];
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error("GEOCODE_FAILED");
    }

    return {
      lat,
      lon,
      displayName: String(first.display_name ?? query),
    };
  }

  private async route(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): Promise<{ distanceMeters: number; durationSeconds: number }> {
    const url = new URL(
      `https://us1.locationiq.com/v1/directions/driving/${lon1},${lat1};${lon2},${lat2}`
    );
    url.searchParams.set("key", this.apiKey!);
    url.searchParams.set("overview", "false");

    let res: Response;
    try {
      res = await this.fetchImpl(url.toString(), {
        headers: { Accept: "application/json" },
      });
    } catch {
      throw new Error("UPSTREAM_ERROR");
    }

    if (!res.ok) {
      if (res.status === 400 || res.status === 404) {
        throw new Error("ROUTING_FAILED");
      }
      throw new Error("UPSTREAM_ERROR");
    }

    const data = (await res.json()) as any;
    const routes = data?.routes;
    if (!Array.isArray(routes) || routes.length === 0) {
      throw new Error("ROUTING_FAILED");
    }

    const primaryRoute = routes[0];
    const distanceMeters = Number(primaryRoute.distance);
    const durationSeconds = Number(primaryRoute.duration);

    if (isNaN(distanceMeters) || isNaN(durationSeconds)) {
      throw new Error("ROUTING_FAILED");
    }

    return { distanceMeters, durationSeconds };
  }
}
