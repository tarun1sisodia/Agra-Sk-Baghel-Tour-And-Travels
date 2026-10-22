import type { CatalogStatus } from "./product-verticals.js";

export interface TransferRouteItem {
  id: string;
  routeCode: string;
  name: string;
  distanceText?: string | null;
  directionNote?: string | null;
  fleetPrices: Record<string, number>;
  usePerKm: boolean | null;
  nightChargeInr: number | null;
  status: CatalogStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransferRouteInput {
  routeCode: string;
  name: string;
  distanceText?: string | null;
  directionNote?: string | null;
  fleetPrices: Record<string, number>;
  usePerKm?: boolean;
  nightChargeInr?: number;
  status?: CatalogStatus;
  isActive?: boolean;
}

export type UpdateTransferRouteInput = Partial<CreateTransferRouteInput>;
