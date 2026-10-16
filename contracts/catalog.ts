/**
 * @file catalog.ts — Canonical Catalog Item contract across backend, admin, and react.
 * @usage Contract C-CATALOG-001: Unified schema for published items, media, and CMS admin CRUD.
 */

import type { CatalogStatus } from "./product-verticals.js";
import type { TripType } from "./trip-types.js";

export const CATALOG_TYPES = ["package", "tour", "transfer", "route", "ride"] as const;
export type CatalogType = (typeof CATALOG_TYPES)[number];

export const CATALOG_AVAILABILITY = ["available", "limited", "unavailable"] as const;
export type CatalogAvailability = (typeof CATALOG_AVAILABILITY)[number];

export interface PublicCatalogMedia {
  url: string;
  alt?: string;
  caption?: string;
}

export interface PublicCatalogItem {
  id: string;
  type: CatalogType;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  durationText: string;
  routeSummary: string;
  startingPriceInr: number | null;
  distanceKm: number | null;
  availability: CatalogAvailability;
  seatsLeft: number | null;
  stops: string[];
  tripType: TripType | null;
  publishedAt: string | null;
  updatedAt: string | null;
  coverImage: { url: string } | null;
  gallery: PublicCatalogMedia[];
}

export interface CatalogItem extends PublicCatalogItem {
  status: CatalogStatus;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
}

export interface CreateCatalogItemInput {
  type: CatalogType;
  slug: string;
  title: string;
  shortDescription: string;
  description?: string;
  durationText: string;
  routeSummary: string;
  startingPriceInr?: number | null;
  distanceKm?: number | null;
  availability?: CatalogAvailability;
  seatsLeft?: number | null;
  stops?: string[];
  tripType?: TripType | null;
}

export type UpdateCatalogItemInput = Partial<CreateCatalogItemInput> & {
  status?: CatalogStatus;
};
