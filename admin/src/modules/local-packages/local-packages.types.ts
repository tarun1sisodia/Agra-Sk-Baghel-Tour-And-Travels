import type { CatalogStatus, LocalPackageItem } from "@/lib/types";

export type { CatalogStatus, LocalPackageItem };

export interface LocalExtraRate {
  per_km: number;
  per_hr: number;
}

export interface LocalPackageFormState {
  name: string;
  packageCode: string;
  durationHours: number;
  includedKm: number;
  covers: string;
  parkingNote: string;
  fleetPrices: Record<string, number>;
  usePerKm: boolean;
  extraRates: Record<string, LocalExtraRate>;
  nightChargeInr: number;
  status: CatalogStatus;
  isActive: boolean;
}

export const EMPTY_LOCAL_PACKAGE: LocalPackageFormState = {
  name: "",
  packageCode: "",
  durationHours: 8,
  includedKm: 80,
  covers: "Taj Mahal, Agra Fort, Mehtab Bagh",
  parkingNote: "Monument entry fees & parking billed at actuals",
  fleetPrices: {},
  usePerKm: false,
  extraRates: {},
  nightChargeInr: 0,
  status: "published" as CatalogStatus,
  isActive: true,
};
