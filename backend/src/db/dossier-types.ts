// backend/src/db/dossier-types.ts
// Domain records for Dossier v2 content entities

export type ContentStatus = "draft" | "published" | "archived";

export type LocalSightseeingPackageRecord = {
  id: string;
  packageCode: string;
  name: string;
  durationHours: number;
  includedKm: number;
  covers: string;
  parkingNote: string | null;
  fleetPrices: Record<string, number>;
  usePerKm: boolean | null;
  extraRates: Record<string, { per_km: number; per_hr: number }> | null;
  nightChargeInr: number | null;
  imageUrl?: string | null;
  gallery?: TourPackageGalleryImage[];
  status: ContentStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TransferRouteRecord = {
  id: string;
  routeCode: string;
  name: string;
  distanceText: string | null;
  directionNote: string | null;
  fleetPrices: Record<string, number>;
  usePerKm: boolean | null;
  nightChargeInr: number | null;
  status: ContentStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TourPackageGalleryImage = {
  url: string;
  caption?: string;
  alt?: string;
};

export type TourPackageRecord = {
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
  inclusionsHighlight: string | null;
  inclusionsNote: string | null;
  source?: string | null;
  destination?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: Array<{ time?: string; title: string; desc: string }>;
  imageUrl?: string | null;
  gallery?: TourPackageGalleryImage[];
  status: ContentStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PackageVehicleUpgradeRecord = {
  id: string;
  packageId: string | null;
  tierCode: string;
  passengerNote: string | null;
  surchargeInr: number;
  createdAt: string;
  updatedAt: string;
};

export type CancellationPolicyRecord = {
  id: string;
  policyType: "cab" | "tour_package";
  noticePeriodText: string;
  sortOrder: number;
  feeRetainedPercent: number;
  refundPercent: number;
  ruleText: string;
  refundTimelineNote: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyProfileRecord = {
  id: string;
  brandName: string;
  officeAddress: string;
  primaryPhone: string;
  whatsappNumber: string;
  email: string;
  gstin: string;
  operatingHours: string;
  mapsLocation: string;
  dossierVersion: string;
  dossierStatus: "pending_review" | "signed_off" | "modifications_needed";
  createdAt: string;
  updatedAt: string;
};

export type DossierSignoffRecord = {
  id: string;
  sectionKey: string;
  sectionTitle: string;
  status: "pending" | "approved" | "modification_requested";
  clientNotes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MonumentRecord = {
  id: string;
  name: string;
  visitingHours: string;
  closedNote: string;
  historicalContext: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PetTaxiPolicyRecord = {
  id: string;
  isOffered: boolean;
  seatProtectionNote: string;
  breedRestrictionNote: string;
  comfortStopNote: string;
  bookingInstruction: string;
  createdAt: string;
  updatedAt: string;
};
