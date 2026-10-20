import {
  FARE_RULES_VERSION_DEFAULT,
  OUTSTATION_RULES,
  PACKAGE_UPGRADES,
  PACKAGES,
  ROUTES,
  VEHICLES,
} from "../modules/fares/fare.catalogue.js";
import type {
  AuditLogRecord,
  BookingRecord,
  CatalogItemRecord,
  CatalogMediaRecord,
  InquiryRecord,
  NotificationJobRecord,
  PaymentRecord,
  ProfileRecord,
  PromoCodeRecord,
  RefundRecord,
  ReviewRecord,
  WebhookEventRecord,
} from "../types/domain.js";
import type { DeviceRegistrationRecord, FareRuleRecord } from "./types.js";

const BASE_TIME = "2026-09-17T08:00:00.000Z";

// ── Auth & Profiles ──────────────────────────────────────────────────────────

export const SEED_PROFILES: ProfileRecord[] = [
  {
    id: "00000000-0000-4000-a000-000000000001",
    fullName: "S. K. Baghel",
    phone: "+919876543210",
    email: "admin@agraskbagheltourandtravels.com",
    role: "super_admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: BASE_TIME,
  },
];

// ── Fare Rules ───────────────────────────────────────────────────────────────

export const SEED_FARE_RULES: FareRuleRecord[] = [
  {
    id: "10000000-0000-4000-a000-000000000001",
    version: FARE_RULES_VERSION_DEFAULT,
    config: {
      outstation: OUTSTATION_RULES,
      vehicles: VEHICLES,
      packageUpgrades: PACKAGE_UPGRADES,
      routes: ROUTES,
    },
    effectiveFrom: "2026-09-01T00:00:00.000Z",
    effectiveTo: null,
    isActive: true,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
];

// ── Promo Codes ──────────────────────────────────────────────────────────────

export const SEED_PROMO_CODES: PromoCodeRecord[] = [];

// ── Catalog Items ────────────────────────────────────────────────────────────

export const SEED_CATALOG_ITEMS: CatalogItemRecord[] = [
  ...PACKAGES.map((pack) => ({
    id: pack.id,
    type: "package" as const,
    slug: pack.slug,
    title: pack.name,
    shortDescription: `${pack.name} — guided tour with dedicated chauffeur and sanitized AC vehicle.`,
    description: `${pack.name}. Includes pickup & drop, fuel, toll taxes, parking fees, and experienced guide assistance. Duration: ${pack.duration}. Starting from ₹${pack.from}.`,
    status: "published" as const,
    durationText: pack.duration,
    routeSummary: pack.name,
    startingPriceInr: pack.from,
    distanceKm: null,
    availability: "available" as const,
    seatsLeft: null,
    stops: [],
    tripType: "local-tour" as const,
    version: 1,
    createdBy: "00000000-0000-4000-a000-000000000001",
    updatedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: BASE_TIME,
  })),
  {
    id: "cat_delhi_agra_express",
    type: "ride",
    slug: "delhi-to-agra-one-way",
    title: "Delhi to Agra Express Cab",
    shortDescription: "Doorstep pickup in Delhi NCR to anywhere in Agra via Yamuna Expressway.",
    description: "Fast, comfortable one-way taxi service via Yamuna Expressway. No hidden charges.",
    status: "published",
    durationText: "3.5 hrs",
    routeSummary: "Delhi NCR · Yamuna Expressway · Agra",
    startingPriceInr: 2800,
    distanceKm: 230,
    availability: "available",
    seatsLeft: null,
    stops: ["Jewar Toll Plaza", "Tappal Rest Area", "Mathura Road Cut"],
    tripType: "one-way",
    version: 1,
    createdBy: "00000000-0000-4000-a000-000000000001",
    updatedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: "2026-07-01T00:00:00.000Z",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: BASE_TIME,
  },
  {
    id: "cat_mathura_vrindavan_pilgrimage",
    type: "tour",
    slug: "mathura-vrindavan-spiritual-day-tour",
    title: "Mathura Vrindavan Spiritual Darshan",
    shortDescription: "Complete temple circuit covering Krishna Janmabhoomi, Banke Bihari, and Prem Mandir.",
    description: "Same-day spiritual tour covering Krishna Janmabhoomi, Banke Bihari, Prem Mandir, and ISKCON Vrindavan with evening Aarti.",
    status: "published",
    durationText: "Full Day (8-10 hrs)",
    routeSummary: "Agra · Mathura · Vrindavan · Gokul · Agra",
    startingPriceInr: 2400,
    distanceKm: 120,
    availability: "available",
    seatsLeft: null,
    stops: ["Krishna Janmabhoomi", "Dwarkadhish Temple", "Banke Bihari Temple", "Prem Mandir"],
    tripType: "local-tour",
    version: 1,
    createdBy: "00000000-0000-4000-a000-000000000001",
    updatedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: "2026-07-15T00:00:00.000Z",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: BASE_TIME,
  },
  {
    id: "cat_golden_triangle_special",
    type: "package",
    slug: "golden-triangle-luxury-4d3n",
    title: "Golden Triangle Luxury Tour (4D/3N)",
    shortDescription: "Delhi, Agra & Jaipur in an Innova Crysta or Force Urbania.",
    description: "Iconic circuit spanning Delhi, Agra and Jaipur with 5-star hotel options and monument skip-the-line coordination.",
    status: "draft",
    durationText: "4 Days / 3 Nights",
    routeSummary: "Delhi · Agra · Fatehpur Sikri · Jaipur · Delhi",
    startingPriceInr: 16500,
    distanceKm: 720,
    availability: "limited",
    seatsLeft: 3,
    stops: ["Delhi", "Agra", "Fatehpur Sikri", "Jaipur"],
    tripType: "round-trip",
    version: 1,
    createdBy: "00000000-0000-4000-a000-000000000001",
    updatedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: null,
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: BASE_TIME,
  },
  {
    id: "cat_chambal_safari_seasonal",
    type: "tour",
    slug: "national-chambal-sanctuary-safari",
    title: "Chambal Wildlife & River Safari",
    shortDescription: "Boat safari for gharials, marsh crocodiles, and Gangetic dolphins.",
    description: "Day trip to National Chambal Sanctuary near Pinahat. River safari with naturalist.",
    status: "archived",
    durationText: "6-8 hrs",
    routeSummary: "Agra · Pinahat · Chambal River · Bateshwar · Agra",
    startingPriceInr: 4200,
    distanceKm: 180,
    availability: "unavailable",
    seatsLeft: null,
    stops: ["Chambal River Safari", "Bateshwar Temples"],
    tripType: "local-tour",
    version: 1,
    createdBy: "00000000-0000-4000-a000-000000000001",
    updatedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: "2026-02-01T00:00:00.000Z",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: BASE_TIME,
  },
  {
    id: "cat_place_taj_mahal",
    type: "place",
    slug: "taj-mahal",
    title: "Taj Mahal",
    shortDescription: "Ivory-white marble mausoleum on the Yamuna riverfront — the world's greatest monument of love.",
    description:
      "Commissioned in 1631 by Mughal Emperor Shah Jahan for Empress Mumtaz Mahal. UNESCO World Heritage Site renowned for its symmetrical marble architecture, pietra dura inlay, and reflecting pools. Best experienced at dawn from the East Gate.",
    status: "published",
    durationText: "2-3 hrs visit",
    routeSummary: "Taj Ganj · Agra · Uttar Pradesh",
    startingPriceInr: 1900,
    distanceKm: 5,
    availability: "available",
    seatsLeft: null,
    stops: ["East Gate Queue", "Main Mausoleum", "Mosque & Jawab", "Mehtab Bagh Viewpoint"],
    tripType: "local-tour",
    version: 1,
    createdBy: "00000000-0000-4000-a000-000000000001",
    updatedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: BASE_TIME,
  },
];

// ── Catalog Media ────────────────────────────────────────────────────────────
// Gallery policy: `place` items (Famous Places & Monuments) carry multi-image
// galleries; every other category uses a single cover image.

export const SEED_CATALOG_MEDIA: CatalogMediaRecord[] = [
  {
    id: "30000000-0000-4000-a000-000000000001",
    catalogItemId: "agra-day",
    storagePath: "/images/packages/taj-mahal-sunrise.webp",
    mediaType: "image",
    altText: "Taj Mahal at sunrise with reflective pool",
    caption: "Taj Mahal sunrise view",
    sortOrder: 1,
    status: "published",
    sourceType: "admin_upload",
    copyrightOwner: "Agra SK Baghel Tour & Travels",
    mimeType: null,
    contentBase64: null,
    sizeBytes: null,
    createdBy: "00000000-0000-4000-a000-000000000001",
    approvedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-a000-000000000002",
    catalogItemId: "taj-sunrise",
    storagePath: "/images/packages/buland-darwaza.webp",
    mediaType: "image",
    altText: "Buland Darwaza at Fatehpur Sikri",
    caption: "Magnificent entrance to Fatehpur Sikri",
    sortOrder: 1,
    status: "published",
    sourceType: "admin_upload",
    copyrightOwner: "Agra SK Baghel Tour & Travels",
    mimeType: null,
    contentBase64: null,
    sizeBytes: null,
    createdBy: "00000000-0000-4000-a000-000000000001",
    approvedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-a000-000000000101",
    catalogItemId: "cat_place_taj_mahal",
    storagePath: "/assets/places/agra-taj-mahal.webp",
    mediaType: "image",
    altText: "Taj Mahal ivory-white marble mausoleum reflecting at sunrise in Agra",
    caption: "Sunrise reflection across the central pool",
    sortOrder: 1,
    status: "published",
    sourceType: "admin_upload",
    copyrightOwner: "Agra SK Baghel Tour & Travels",
    mimeType: null,
    contentBase64: null,
    sizeBytes: null,
    createdBy: "00000000-0000-4000-a000-000000000001",
    approvedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-a000-000000000102",
    catalogItemId: "cat_place_taj_mahal",
    storagePath: "/assets/destinations/fatehpur-sikri.webp",
    mediaType: "image",
    altText: "Buland Darwaza gateway framing the courtyard at Fatehpur Sikri",
    caption: "Buland Darwaza, Fatehpur Sikri",
    sortOrder: 2,
    status: "published",
    sourceType: "admin_upload",
    copyrightOwner: "Agra SK Baghel Tour & Travels",
    mimeType: null,
    contentBase64: null,
    sizeBytes: null,
    createdBy: "00000000-0000-4000-a000-000000000001",
    approvedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-a000-000000000103",
    catalogItemId: "cat_place_taj_mahal",
    storagePath: "/assets/places/agra-red-fort.webp",
    mediaType: "image",
    altText: "Taj Mahal viewed across the Yamuna river from Agra Fort ramparts",
    caption: "Distant Taj views from Agra Fort ramparts",
    sortOrder: 3,
    status: "published",
    sourceType: "admin_upload",
    copyrightOwner: "Agra SK Baghel Tour & Travels",
    mimeType: null,
    contentBase64: null,
    sizeBytes: null,
    createdBy: "00000000-0000-4000-a000-000000000001",
    approvedBy: "00000000-0000-4000-a000-000000000001",
    publishedAt: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

// ── Operational Data Collections (Empty — No Mock Data) ─────────────────────

export const SEED_BOOKINGS: BookingRecord[] = [];
export const SEED_PAYMENTS: PaymentRecord[] = [];
export const SEED_REFUNDS: RefundRecord[] = [];
export const SEED_REVIEWS: ReviewRecord[] = [];
export const SEED_INQUIRIES: InquiryRecord[] = [];
export const SEED_AUDIT_LOGS: AuditLogRecord[] = [];
export const SEED_NOTIFICATION_JOBS: NotificationJobRecord[] = [];
export const SEED_DEVICES: DeviceRegistrationRecord[] = [];
export const SEED_WEBHOOKS: WebhookEventRecord[] = [];


// ── Location Cache ───────────────────────────────────────────────────────────

export const SEED_LOCATION_CACHE = [
  {
    key: "delhi",
    suggestions: [
      { placeId: "loc_del_01", displayName: "Indira Gandhi International Airport (DEL), New Delhi", city: "New Delhi", state: "Delhi", country: "India", lat: 28.5562, lon: 77.1000 },
      { placeId: "loc_del_02", displayName: "New Delhi Railway Station (NDLS), Delhi", city: "New Delhi", state: "Delhi", country: "India", lat: 28.6429, lon: 77.2195 },
      { placeId: "loc_del_03", displayName: "Connaught Place, New Delhi", city: "New Delhi", state: "Delhi", country: "India", lat: 28.6315, lon: 77.2167 },
    ],
    storedAt: BASE_TIME,
  },
  {
    key: "agra",
    suggestions: [
      { placeId: "loc_agr_01", displayName: "Taj Mahal, Dharmapuri, Forest Colony, Tajganj, Agra", city: "Agra", state: "Uttar Pradesh", country: "India", lat: 27.1751, lon: 78.0421 },
      { placeId: "loc_agr_02", displayName: "Agra Fort, Rakabganj, Agra", city: "Agra", state: "Uttar Pradesh", country: "India", lat: 27.1795, lon: 78.0211 },
      { placeId: "loc_agr_03", displayName: "Agra Cantt Railway Station (AGC), Idgah, Agra", city: "Agra", state: "Uttar Pradesh", country: "India", lat: 27.1578, lon: 78.0076 },
    ],
    storedAt: BASE_TIME,
  },
  {
    key: "jaipur",
    suggestions: [
      { placeId: "loc_jai_01", displayName: "Hawa Mahal, Badi Choupad, J.D.A. Market, Jaipur", city: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9239, lon: 75.8267 },
      { placeId: "loc_jai_02", displayName: "Amber Palace, Devisinghpura, Amer, Jaipur", city: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9855, lon: 75.8513 },
    ],
    storedAt: BASE_TIME,
  },
];

