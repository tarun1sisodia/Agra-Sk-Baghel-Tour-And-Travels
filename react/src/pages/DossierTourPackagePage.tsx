import React from "react";
import type { SupportedLanguage } from "../config";
import { TourPackageTemplate } from "../templates/TourPackageTemplate";

export interface DossierTourPackageItem {
  id: string;
  slug: string;
  packageCode?: string;
  name: string;
  durationText: string;
  days: number;
  nights: number;
  baseTierCode: string;
  startingPriceInr: number;
  fleetPrices: Record<string, number>;
  nightChargeInr: number;
  inclusionsHighlight?: string | null;
  inclusionsNote?: string | null;
  status: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  gallery?: Array<{ url: string; caption?: string }>;
  image?: string;
  upgrades?: Array<{
    id?: string;
    tierCode: string;
    passengerNote?: string | null;
    surchargeInr: number;
  }>;
}

export type TourPackageItem = DossierTourPackageItem;

export interface DossierTourPackagePageProps {
  language?: SupportedLanguage;
  item: DossierTourPackageItem;
}

export function DossierTourPackagePage({ language = "en", item }: DossierTourPackagePageProps) {
  return <TourPackageTemplate language={language} pkg={item} />;
}

export default DossierTourPackagePage;
