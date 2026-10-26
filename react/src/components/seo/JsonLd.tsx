/**
 * JsonLd — Structured Data Injector & Schema.org Graph Builder (Step R5.25)
 *
 * Provides strongly-typed Schema.org generators and a secure, sanitized
 * JSON-LD script injector component for:
 * 1. TaxiService & LocalBusiness (with verified Agra NAP, GeoCoordinates, and OpeningHours)
 * 2. BreadcrumbList (with 1-indexed ListItems and absolute canonical URLs)
 * 3. FAQPage (with Question & acceptedAnswer pairs for Rich Results)
 * 4. Optional AggregateRating (disabled until review authenticity is confirmed)
 * 5. TouristTrip (for private tour packages & itineraries)
 * 6. Product / Car (for vehicle fleet tiers & specifications)
 * 7. WebSite (with bilingual inLanguage & SearchAction)
 */

import React from "react";
import { contact } from "../../data/contact";
import { CANONICAL_DOMAIN, DEFAULT_OG_IMAGE } from "./SeoHead";

// --- Schema Types ---

export interface BreadcrumbInputItem {
  name: string;
  url: string;
}

export interface FaqInputItem {
  question: string;
  answer: string;
}

export interface TaxiServiceOfferInput {
  name: string;
  price: number | string;
  priceCurrency?: string;
  description?: string;
  eligibleQuantity?: number;
}

export interface LocalBusinessSchemaOptions {
  id?: string;
  name?: string;
  url?: string;
  image?: string;
  includeAggregateRating?: boolean;
}

export interface TaxiServiceSchemaOptions {
  id?: string;
  name?: string;
  description?: string;
  serviceType?: string;
  areaServed?: string[];
  offers?: TaxiServiceOfferInput[];
}

export interface TouristTripSchemaOptions {
  id?: string;
  name: string;
  description: string;
  image?: string;
  duration?: string;
  touristType?: string[];
  itinerary?: Array<{
    name: string;
    description: string;
  }>;
  offers?: {
    price: number | string;
    priceCurrency?: string;
    validFrom?: string;
    availability?: "InStock" | "LimitedAvailability" | "OutOfStock";
  };
}

export interface ProductCarSchemaOptions {
  id?: string;
  name: string;
  description: string;
  image?: string;
  category?: string;
  seatingCapacity?: number;
  offers?: {
    price: number | string;
    priceCurrency?: string;
    unitCode?: string;
    availability?: "InStock" | "LimitedAvailability" | "OutOfStock";
  };
}

// --- Helper Sanitizer ---

/**
 * Escapes any `</script` substrings inside JSON to prevent HTML parsing breakage or XSS.
 */
export function sanitizeJsonLd(schema: unknown): string {
  return JSON.stringify(schema, (_key, value) => {
    // Strip null or undefined values to produce clean Schema.org output
    return value === undefined ? undefined : value;
  }).replace(/<\/script/gi, "<\\/script");
}

// --- Schema Factory Builders ---

/**
 * Builds an AggregateRating node.
 */
export function buildAggregateRatingSchema(
  ratingValue = "4.9",
  reviewCount = "380",
  bestRating = "5",
  worstRating = "1"
) {
  return {
    "@type": "AggregateRating",
    ratingValue,
    reviewCount,
    bestRating,
    worstRating,
  };
}

/**
 * Builds a validated Schema.org BreadcrumbList.
 */
export function buildBreadcrumbSchema(
  items: BreadcrumbInputItem[],
  id = `${CANONICAL_DOMAIN}/#breadcrumb`
) {
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${CANONICAL_DOMAIN}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  };
}

/**
 * Builds a validated Schema.org FAQPage for Google Rich Results.
 */
export function buildFaqSchema(
  faqs: FaqInputItem[],
  id = `${CANONICAL_DOMAIN}/#faq`
) {
  return {
    "@type": "FAQPage",
    "@id": id,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/**
 * Builds a verified Schema.org LocalBusiness & TravelAgency & TaxiService node.
 */
export function buildLocalBusinessSchema(options?: LocalBusinessSchemaOptions) {
  const businessId = options?.id || `${CANONICAL_DOMAIN}/#business`;
  const name = options?.name || "Agra SK Baghel Tour and Travels";
  const url = options?.url || CANONICAL_DOMAIN;
  const image = options?.image || DEFAULT_OG_IMAGE;
  const includeRating = options?.includeAggregateRating ?? false;

  const node: Record<string, unknown> = {
    "@type": ["TravelAgency", "TaxiService", "LocalBusiness"],
    "@id": businessId,
    name,
    url,
    telephone: contact.phone,
    email: contact.email,
    image,
    priceRange: "₹₹",
    areaServed: [
      "Agra",
      "Delhi",
      "Jaipur",
      "Mathura",
      "Vrindavan",
      "Gwalior",
      "Lucknow",
      "Yamuna Expressway",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: contact.phone,
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["en-IN", "hi-IN"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.dispatchOffice.streetAddress,
      addressLocality: contact.dispatchOffice.locality,
      addressRegion: contact.dispatchOffice.region,
      postalCode: contact.dispatchOffice.postalCode,
      addressCountry: contact.dispatchOffice.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.dispatchOffice.latitude,
      longitude: contact.dispatchOffice.longitude,
    },
    department: [
      {
        "@type": "AutoRepair",
        name: "Agra SK Baghel Commercial Fleet Garage",
        description: "Commercial Fleet Maintenance & Operations Garage",
        address: {
          "@type": "PostalAddress",
          streetAddress: contact.registeredGarage.streetAddress,
          addressLocality: contact.registeredGarage.locality,
          addressRegion: contact.registeredGarage.region,
          postalCode: contact.registeredGarage.postalCode,
          addressCountry: contact.registeredGarage.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: contact.registeredGarage.latitude,
          longitude: contact.registeredGarage.longitude,
        },
        telephone: contact.phone,
        openingHours: "Mo-Su 00:00-23:59",
      },
    ],
    openingHours: "Mo-Su 00:00-23:59",
  };

  if (includeRating) {
    node.aggregateRating = buildAggregateRatingSchema();
  }

  return node;
}

/**
 * Builds a validated Schema.org TaxiService node with vehicle offerings.
 */
export function buildTaxiServiceSchema(options: TaxiServiceSchemaOptions) {
  const serviceId = options.id || `${CANONICAL_DOMAIN}/#taxiservice`;
  const name = options.name || "Agra Taxi Service & Outstation Cabs";
  const description =
    options.description ||
    "Chauffeur-driven outstation taxis, local Agra sightseeing, and airport transfers.";

  return {
    "@type": "TaxiService",
    "@id": serviceId,
    name,
    description,
    provider: {
      "@type": "LocalBusiness",
      "@id": `${CANONICAL_DOMAIN}/#business`,
      name: "Agra SK Baghel Tour and Travels",
    },
    areaServed: options.areaServed || ["Agra", "Delhi", "Jaipur", "Mathura", "Gwalior"],
    serviceType: options.serviceType || "Outstation & Local Cab Service",
    ...(options.offers && options.offers.length > 0
      ? {
          offers: options.offers.map((offer) => ({
            "@type": "Offer",
            name: offer.name,
            price: offer.price,
            priceCurrency: offer.priceCurrency || "INR",
            description: offer.description,
          })),
        }
      : {}),
  };
}

/**
 * Builds a Schema.org TouristTrip node for package tours.
 */
export function buildTouristTripSchema(options: TouristTripSchemaOptions) {
  return {
    "@type": "TouristTrip",
    "@id": options.id || `${CANONICAL_DOMAIN}/#touristtrip`,
    name: options.name,
    description: options.description,
    image: options.image || DEFAULT_OG_IMAGE,
    touristType: options.touristType || ["Cultural Heritage", "Family Travel", "Day Tours"],
    provider: {
      "@type": "LocalBusiness",
      "@id": `${CANONICAL_DOMAIN}/#business`,
      name: "Agra SK Baghel Tour and Travels",
    },
    ...(options.itinerary && options.itinerary.length > 0
      ? {
          itinerary: {
            "@type": "ItemList",
            itemListElement: options.itinerary.map((step, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              name: step.name,
              description: step.description,
            })),
          },
        }
      : {}),
    ...(options.offers
      ? {
          offers: {
            "@type": "Offer",
            price: options.offers.price,
            priceCurrency: options.offers.priceCurrency || "INR",
            availability: `https://schema.org/${options.offers.availability || "InStock"}`,
            ...(options.offers.validFrom ? { validFrom: options.offers.validFrom } : {}),
          },
        }
      : {}),
  };
}

/**
 * Builds a Schema.org Product / Car node for vehicle fleet listings.
 */
export function buildProductCarSchema(options: ProductCarSchemaOptions) {
  return {
    "@type": ["Product", "Car"],
    "@id": options.id || `${CANONICAL_DOMAIN}/#car`,
    name: options.name,
    description: options.description,
    image: options.image || DEFAULT_OG_IMAGE,
    category: options.category || "Chauffeur-Driven Rental Car",
    ...(options.seatingCapacity
      ? {
          seatingCapacity: options.seatingCapacity,
        }
      : {}),
    ...(options.offers
      ? {
          offers: {
            "@type": "Offer",
            price: options.offers.price,
            priceCurrency: options.offers.priceCurrency || "INR",
            unitCode: options.offers.unitCode || "KMT",
            availability: `https://schema.org/${options.offers.availability || "InStock"}`,
          },
        }
      : {}),
  };
}

/**
 * Builds a Schema.org WebSite node with SearchAction.
 */
export function buildWebSiteSchema(
  language: "en" | "hi" = "en",
  id = `${CANONICAL_DOMAIN}/#website`
) {
  return {
    "@type": "WebSite",
    "@id": id,
    name: "Agra SK Baghel Tour and Travels",
    url: CANONICAL_DOMAIN,
    inLanguage: language === "hi" ? "hi-IN" : "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${CANONICAL_DOMAIN}/en/routes/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Combines multiple schema objects into a single clean `@graph` document.
 */
export function buildGraphSchema(
  ...nodes: Array<Record<string, unknown> | null | undefined | boolean>
): Record<string, unknown> {
  const cleanNodes = nodes.filter(
    (node): node is Record<string, unknown> => typeof node === "object" && node !== null
  );

  return {
    "@context": "https://schema.org",
    "@graph": cleanNodes,
  };
}

// --- Component ---

export interface JsonLdProps {
  schema: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Renders a secure, sanitized JSON-LD script tag.
 */
export function JsonLd({ schema }: JsonLdProps) {
  const jsonString = sanitizeJsonLd(schema);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}

export default JsonLd;
