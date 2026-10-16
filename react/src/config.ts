import { resolveSiteOrigin, type SiteOriginMode } from "./config/siteOrigin";

export type SupportedLanguage = "en" | "hi";

export type SiteContact = {
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  hours: string;
  mapsUrl: string;
  companyReceipt: string;
};

export type SiteConfig = {
  name: string;
  domain: string;
  contact: SiteContact;
  defaultLanguage: SupportedLanguage;
  supportedLanguages: readonly SupportedLanguage[];
};

export const siteConfig: SiteConfig = {
  name: "Agra SK Baghel Tour and Travels",
  domain: resolveSiteOrigin(
    import.meta.env.VITE_SITE_URL,
    (import.meta.env.VITE_SITE_MODE === "production"
      ? "production"
      : import.meta.env.MODE === "development"
      ? "development"
      : "preview") as SiteOriginMode,
  ),
  defaultLanguage: "en",
  supportedLanguages: ["en", "hi"],
  contact: {
    phone: "+919762817598",
    phoneDisplay: "+91 97628 17598",
    whatsapp: "919762817598",
    email: "bookings@agraskbagheltourandtravels.com",
    address: "Near Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001",
    city: "Agra",
    region: "Uttar Pradesh",
    postalCode: "282001",
    latitude: 27.1632,
    longitude: 78.0322,
    hours: "Bookings open 24×7",
    mapsUrl: "https://maps.google.com/?q=Taj+Ganj+Agra",
    companyReceipt: "",
  },
};

export function isReactMigrationEnabled(): boolean {
  return import.meta.env.VITE_REACT_MIGRATION_ENABLED !== "false";
}
