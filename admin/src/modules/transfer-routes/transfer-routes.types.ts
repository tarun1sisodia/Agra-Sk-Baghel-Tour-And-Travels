import type { CatalogStatus, TransferRouteItem } from "@/lib/types";

export type { CatalogStatus, TransferRouteItem };

export interface TransferRouteFormState {
  name: string;
  routeCode: string;
  distanceText: string;
  directionNote: string;
  fleetPrices: Record<string, number>;
  usePerKm: boolean;
  nightChargeInr: number;
  status: CatalogStatus;
  isActive: boolean;
}

export const EMPTY_TRANSFER_ROUTE: TransferRouteFormState = {
  name: "",
  routeCode: "",
  distanceText: "~15–20 km",
  directionNote: "Doorstep pickup or drop at station / airport",
  fleetPrices: {},
  usePerKm: false,
  nightChargeInr: 0,
  status: "draft" as CatalogStatus,
  isActive: true,
};
