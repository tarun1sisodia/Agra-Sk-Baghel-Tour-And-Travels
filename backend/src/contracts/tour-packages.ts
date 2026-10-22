/**
 * GENERATED — do not edit by hand.
 * Source: contracts/tour-packages.ts
 * Regenerate: npx tsx contracts/scripts/sync-contracts.ts
 * Contract: C-CONTRACT-ALL · contracts/LOCKED.md
 */
import type { CatalogStatus } from "./product-verticals.js";

export interface TourPackageGalleryImage {
  url: string;
  caption?: string;
  alt?: string;
}

export interface TourPackageUpgrade {
  id: string;
  packageId?: string | null;
  tierCode: string;
  passengerNote?: string | null;
  surchargeInr: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TourPackageItem {
  id: string;
  packageCode: string;
  name: string;
  durationText: string;
  days: number;
  nights: number;
  baseTierCode: string | null;
  startingPriceInr: number | null;
  fleetPrices: Record<string, number>;
  nightChargeInr: number | null;
  source?: string | null;
  destination?: string | null;
  inclusionsHighlight?: string | null;
  inclusionsNote?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: Array<{ time?: string; title: string; desc: string }>;
  imageUrl?: string | null;
  gallery?: TourPackageGalleryImage[];
  status: CatalogStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  upgrades?: TourPackageUpgrade[];
}

export interface CreateTourPackageInput {
  name: string;
  packageCode: string;
  durationText: string;
  days: number;
  nights: number;
  baseTierCode?: string | null;
  startingPriceInr?: number | null;
  fleetPrices: Record<string, number>;
  nightChargeInr?: number | null;
  source?: string | null;
  destination?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  inclusionsHighlight?: string;
  inclusionsNote?: string;
  imageUrl?: string;
  gallery?: TourPackageGalleryImage[];
  status?: CatalogStatus;
  isActive?: boolean;
}

export type UpdateTourPackageInput = Partial<CreateTourPackageInput>;
