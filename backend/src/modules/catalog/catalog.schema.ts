import { z } from "zod";
import {
  CATALOG_AVAILABILITY,
  CATALOG_TYPES,
  CONTENT_STATUSES,
  MEDIA_MAX_BYTES,
  MEDIA_MIME_TYPES,
  TRIP_TYPES,
} from "../../types/domain.js";

export const CatalogSlugParamSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
});

export const CatalogIdParamSchema = z.object({
  id: z.string().min(1).max(80),
});

export const MediaIdParamSchema = z.object({
  id: z.string().min(1).max(80),
});

const CreateCatalogObjectSchema = z
  .object({
    type: z.enum(CATALOG_TYPES),
    slug: z.string().regex(/^[a-z0-9-]{2,80}$/),
    title: z.string().trim().min(3).max(160).transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    shortDescription: z.string().trim().min(3).max(280).transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    description: z
      .string()
      .trim()
      .min(3)
      .max(8000)
      .transform((v) => v.replace(/<[^>]*>/g, "").trim())
      .optional(),
    durationText: z.string().trim().min(1).max(80),
    routeSummary: z.string().trim().min(1).max(280).transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    startingPriceInr: z.number().positive().max(1000000).finite().nullable().optional(),
    distanceKm: z.number().nonnegative().max(10000).finite().nullable().optional(),
    availability: z.enum(CATALOG_AVAILABILITY).default("available"),
    seatsLeft: z.number().int().nonnegative().max(500).nullable().optional(),
    stops: z
      .array(z.string().trim().min(2).max(80).transform((v) => v.replace(/<[^>]*>/g, "").trim()))
      .max(24)
      .default([]),
    tripType: z.enum(TRIP_TYPES).nullable().optional(),
  })
  .strict();

export const CreateCatalogSchema = CreateCatalogObjectSchema.refine(
  (v) => v.availability !== "limited" || v.seatsLeft === null || v.seatsLeft === undefined || v.seatsLeft > 0,
  { message: "seatsLeft must be a positive count when availability is limited." },
);

export const UpdateCatalogSchema = CreateCatalogObjectSchema.partial().extend({
  status: z.enum(CONTENT_STATUSES).optional(),
});

export const AttachMediaSchema = z
  .object({
    storagePath: z
      .string()
      .min(3)
      .max(500)
      .refine((v) => !v.includes("..") && !v.includes("//") && !v.startsWith("/"), "Invalid storage path")
      .optional(),
    dataBase64: z
      .string()
      .min(16)
      .max(3_500_000)
      .refine((v) => /^[A-Za-z0-9+/]+={0,2}$/.test(v.replace(/\s/g, "")), "Invalid base64 payload")
      .optional(),
    mimeType: z.enum(MEDIA_MIME_TYPES).optional(),
    mediaType: z.enum(["image", "video"]).default("image"),
    altText: z.string().trim().min(3).max(200).transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    caption: z.string().trim().max(280).optional().transform((v) => v?.replace(/<[^>]*>/g, "").trim()),
    sortOrder: z.number().int().nonnegative().max(1000).default(0),
  })
  .strict()
  .refine((v) => Boolean(v.storagePath) !== Boolean(v.dataBase64), {
    message: "Provide exactly one of storagePath (asset/URL reference) or dataBase64 (inline upload).",
  })
  .refine((v) => !v.dataBase64 || Boolean(v.mimeType), {
    message: "mimeType is required for inline uploads.",
  })
  .refine((v) => v.mediaType !== "video" || Boolean(v.storagePath), {
    message: "Inline uploads are limited to images; videos must use a storagePath reference.",
  })
  .refine(
    (v) => !v.dataBase64 || Buffer.from(v.dataBase64, "base64").length <= MEDIA_MAX_BYTES,
    { message: `Inline uploads must be ${MEDIA_MAX_BYTES} bytes or smaller.` },
  );

export const UpdateMediaSchema = z
  .object({
    altText: z.string().trim().min(3).max(200).optional().transform((v) => v?.replace(/<[^>]*>/g, "").trim()),
    caption: z.string().trim().max(280).optional().transform((v) => v?.replace(/<[^>]*>/g, "").trim()),
    sortOrder: z.number().int().nonnegative().max(1000).optional(),
    status: z.enum(CONTENT_STATUSES).optional(),
  })
  .strict();

export const AdminCatalogQuerySchema = z.object({
  type: z.enum(CATALOG_TYPES).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});

/** Public (customer site) listing filters. */
export const PublicCatalogQuerySchema = z.object({
  type: z.enum(CATALOG_TYPES).optional(),
  tripType: z.enum(TRIP_TYPES).optional(),
});
