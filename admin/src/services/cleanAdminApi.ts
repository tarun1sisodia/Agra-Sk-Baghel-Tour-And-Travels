import { apiFetch } from "@/lib/api";
import type {
  VehicleGroupCode,
  VehicleModelCreate,
  VehicleModelPatch,
  VehicleGroupPatch,
  FareRuleCreate,
  FareRulePatch,
  ExtraChargeCreate,
  ExtraChargePatch,
  RouteCalculateResponse,
  RouteVehiclesPut,
} from "@/contracts/fare-system";

export interface CleanVehicleGroup {
  id: string;
  code: VehicleGroupCode;
  name: string;
  driver_allowance_per_day: number;
  one_way_night_charge: number;
  round_trip_halt_per_night: number;
  sort_order: number;
  is_active: boolean;
}

export interface CleanVehicleModel {
  id: string;
  vehicle_group_id: string;
  group_code: VehicleGroupCode;
  group_name: string;
  make: string;
  model_name: string;
  display_name: string;
  passenger_capacity: number;
  luggage_capacity: number | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CleanFareSetting {
  key: string;
  value: number;
  description?: string;
}

export interface CleanFareRule {
  id: string;
  category: string;
  vehicle_model_id: string;
  vehicle_name: string;
  group_code: string;
  route_id?: string | null;
  route_code?: string | null;
  local_package_id?: string | null;
  transfer_id?: string | null;
  tour_package_id?: string | null;
  amount: number;
  is_active: boolean;
}

export interface CleanExtraCharge {
  id: string;
  category: string;
  vehicle_group_id?: string | null;
  group_code?: string | null;
  route_id?: string | null;
  local_package_id?: string | null;
  transfer_id?: string | null;
  tour_package_id?: string | null;
  label: string;
  amount: number | null;
  is_active: boolean;
}

export interface CleanRoute {
  id: string;
  code: string;
  origin_name: string;
  destination_name: string;
  distance_km: number | null;
  duration_minutes: number | null;
  description: string | null;
  image_url: string | null;
  status: "draft" | "published" | "archived";
}

export interface CleanRouteWithVehicles {
  route: CleanRoute;
  vehicles: Array<{
    id: string;
    route_id: string;
    vehicle_model_id: string;
    display_name: string;
    group_code: string;
    passenger_capacity: number;
    luggage_capacity: number | null;
    one_way_amount: number | null;
    round_trip_enabled: boolean;
    terms?: any;
    sort_order: number;
    is_active: boolean;
  }>;
}

export interface CleanAuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  resource_type: string;
  resource_id: string;
  action: string;
  before_state?: any;
  after_state?: any;
  request_id: string;
  created_at: string;
}

export interface CleanPublishEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  status: string;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

export async function fetchVehicleGroups(): Promise<CleanVehicleGroup[]> {
  const res = await apiFetch("/api/v1/admin/vehicle-groups");
  return res.vehicle_groups ?? [];
}

export async function patchVehicleGroup(id: string, patch: VehicleGroupPatch): Promise<any> {
  return apiFetch(`/api/v1/admin/vehicle-groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function fetchVehicleModels(): Promise<CleanVehicleModel[]> {
  const res = await apiFetch("/api/v1/admin/vehicle-models");
  return res.vehicle_models ?? [];
}

export async function createVehicleModel(input: VehicleModelCreate): Promise<any> {
  return apiFetch("/api/v1/admin/vehicle-models", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function patchVehicleModel(id: string, patch: VehicleModelPatch): Promise<any> {
  return apiFetch(`/api/v1/admin/vehicle-models/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function fetchFareSettings(): Promise<CleanFareSetting[]> {
  const res = await apiFetch("/api/v1/admin/fare-settings");
  return res.settings ?? [];
}

export async function patchFareSetting(key: string, value: number): Promise<any> {
  return apiFetch(`/api/v1/admin/fare-settings/${key}`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });
}

export async function fetchFareRules(): Promise<CleanFareRule[]> {
  const res = await apiFetch("/api/v1/admin/fare-rules");
  return res.fare_rules ?? [];
}

export async function createFareRule(input: FareRuleCreate): Promise<any> {
  return apiFetch("/api/v1/admin/fare-rules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function patchFareRule(id: string, patch: FareRulePatch): Promise<any> {
  return apiFetch(`/api/v1/admin/fare-rules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function fetchExtraCharges(): Promise<CleanExtraCharge[]> {
  const res = await apiFetch("/api/v1/admin/extra-charges");
  return res.extra_charges ?? [];
}

export async function createExtraCharge(input: ExtraChargeCreate): Promise<any> {
  return apiFetch("/api/v1/admin/extra-charges", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function patchExtraCharge(id: string, patch: ExtraChargePatch): Promise<any> {
  return apiFetch(`/api/v1/admin/extra-charges/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function calculateRouteDistance(origin: string, destination: string): Promise<RouteCalculateResponse> {
  return apiFetch("/api/v1/admin/routes/calculate-distance", {
    method: "POST",
    body: JSON.stringify({ origin, destination }),
  });
}

export async function fetchRoutes(): Promise<CleanRoute[]> {
  const res = await apiFetch("/api/v1/admin/routes");
  return res.routes ?? [];
}

export async function createRoute(input: {
  code: string;
  origin_name: string;
  destination_name: string;
  distance_km?: number | null;
  duration_minutes?: number | null;
  description?: string | null;
  image_url?: string | null;
}): Promise<any> {
  return apiFetch("/api/v1/admin/routes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function patchRoute(
  id: string,
  patch: {
    origin_name?: string;
    destination_name?: string;
    distance_km?: number | null;
    duration_minutes?: number | null;
    description?: string | null;
    image_url?: string | null;
  }
): Promise<any> {
  return apiFetch(`/api/v1/admin/routes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function fetchRouteWithVehicles(routeId: string): Promise<CleanRouteWithVehicles> {
  return apiFetch(`/api/v1/admin/routes/${routeId}/vehicles`);
}

export async function putRouteVehicles(routeId: string, vehicles: RouteVehiclesPut["vehicles"]): Promise<any> {
  return apiFetch(`/api/v1/admin/routes/${routeId}/vehicles`, {
    method: "PUT",
    body: JSON.stringify({ vehicles }),
  });
}

export async function updateProductStatus(
  entityType: string,
  id: string,
  status: "published" | "archived"
): Promise<any> {
  return apiFetch(`/api/v1/admin/${entityType}/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAuditLogs(limit = 100): Promise<CleanAuditLog[]> {
  const res = await apiFetch("/api/v1/admin/audit-logs");
  return (res.audit_logs ?? []).slice(0, limit);
}

export async function fetchPublishEvents(limit = 50): Promise<CleanPublishEvent[]> {
  const res = await apiFetch("/api/v1/admin/publishing/events");
  return (res.publish_events ?? []).slice(0, limit);
}
