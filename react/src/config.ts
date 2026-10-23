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
    address: "1Nandlalpur, Hathras Rd, near Khusum, Nagla, Agra, Uttar Pradesh 282006",
    city: "Agra",
    region: "Uttar Pradesh",
    postalCode: "282006",
    latitude: 27.1632,
    longitude: 78.0322,
    hours: "Bookings open 24×7",
    mapsUrl: "https://maps.google.com/?q=1Nandlalpur%2C+Hathras+Rd%2C+near+Khusum%2C+Nagla%2C+Agra%2C+Uttar+Pradesh+282006",
    companyReceipt: "",
  },
};

export function isReactMigrationEnabled(): boolean {
  return import.meta.env.VITE_REACT_MIGRATION_ENABLED !== "false";
}
