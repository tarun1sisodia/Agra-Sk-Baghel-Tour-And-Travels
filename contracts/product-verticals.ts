/**
 * @file product-verticals.ts — Canonical 5 Product Verticals contract.
 * @usage Contract C-ENUM-004: Eliminates polymorphic catalog ambiguity across all layers.
 */

export const PRODUCT_VERTICALS = [
  "tour-package",
  "route",
  "local-tour",
  "transfer",
  "monument",
] as const;

export type ProductVertical = (typeof PRODUCT_VERTICALS)[number];

export const CATALOG_STATUSES = ["draft", "published", "archived"] as const;
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];

export const USER_ROLES = ["super_admin", "developer", "customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ROLES = ["super_admin", "developer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PRODUCT_VERTICAL_META: Record<ProductVertical, { label: string; primaryPricing: string }> = {
  "tour-package": {
    label: "Tour Package",
    primaryPricing: "Fixed Tier Pricing",
  },
  "route": {
    label: "Intercity Highway Route",
    primaryPricing: "Distance (km) x Rate + Tolls",
  },
  "local-tour": {
    label: "Local Tour",
    primaryPricing: "Fixed Slab (8hr/80km or 12hr/120km) + Extra Surcharges",
  },
  "transfer": {
    label: "Airport / Railway Transfer",
    primaryPricing: "Fixed Pickup/Drop Rate",
  },
  "monument": {
    label: "Monument Sightseeing",
    primaryPricing: "Sightseeing Guide & Ticket Fees",
  },
};
