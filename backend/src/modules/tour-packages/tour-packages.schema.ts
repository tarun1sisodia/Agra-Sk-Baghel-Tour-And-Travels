// backend/src/modules/tour-packages/tour-packages.schema.ts
import { z } from "zod";

const cleanText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((value) => value.replace(/<[^>]*>/g, "").trim());

const cleanOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value.replace(/<[^>]*>/g, "").trim())
    .optional();

export const GalleryImageSchema = z.object({
  url: z.string().trim().min(1).max(1000),
  caption: z.string().trim().max(300).optional().default(""),
  alt: z.string().trim().max(300).optional().default(""),
});

const base = z
  .object({
    package_code: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]{2,80}$/)
      .refine(
        (value) => !/^\d+-btn-/.test(value) && !/command/i.test(value) && !/--/.test(value),
        "Slug contains a reserved or junk pattern."
      ),
    name: cleanText(2, 100),
    duration_text: cleanText(2, 60),
    days: z.number().int().min(1).max(30).default(1),
    nights: z.number().int().min(0).max(30).default(0),
    base_tier_code: cleanText(2, 40).default("sedan"),
    starting_price_inr: z.number().int().positive().max(1_000_000).finite().nullable().default(null),
    fleet_prices: z.record(z.string(), z.number().int().positive().max(1_000_000).finite()).default({}),
    night_charge_inr: z.number().nonnegative().max(100_000).default(0),
    inclusions_highlight: cleanOptional(500),
    inclusions_note: cleanOptional(1000),
    source: cleanText(1, 100).default("Agra"),
    // Destination may be empty (DB column is NOT NULL DEFAULT ''). min(1) would
    // contradict the default(""), so empty strings are accepted here.
    destination: z.string().trim().max(200).transform((value) => value.replace(/<[^>]*>/g, "").trim()).default(""),
    inclusions: z.array(z.string().trim().max(300)).max(50).optional().default([]),
    exclusions: z.array(z.string().trim().max(300)).max(50).optional().default([]),
    itinerary: z.array(z.object({
      time: z.string().trim().max(60).optional(),
      title: z.string().trim().min(1).max(200),
      desc: z.string().trim().min(1).max(1000),
    })).max(50).optional().default([]),
    image_url: z.string().trim().max(1000).optional().nullable(),
    gallery: z.array(GalleryImageSchema).max(30).optional().default([]),
    status: z.enum(["draft", "published", "archived"]).optional(),
    is_active: z.boolean().default(true),
  })
  .strict();

export const CreateTourPackageSchema = base;
export const UpdateTourPackageSchema = base.partial().omit({ status: true }).extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});
export const UploadTourPackageImageSchema = z.object({
  dataBase64: z.string().min(10),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  altText: z.string().trim().min(1).max(300).optional().default("Tour package image"),
  caption: z.string().trim().max(300).optional().default(""),
});
export type UploadTourPackageImageInput = z.infer<typeof UploadTourPackageImageSchema>;
export const TourPackageIdSchema = z.object({ id: z.string().uuid() });
export const TourPackageCodeSchema = z.object({ code: z.string().trim().min(2).max(80) });
export const TourPackageQuerySchema = z.object({
  status: z.enum(["draft", "published", "archived", "all"]).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const TourPackageUpgradeSchema = z
  .object({
    id: z.string().uuid().optional(),
    package_id: z.string().uuid().nullable().optional(),
    tier_code: cleanText(2, 40),
    passenger_note: cleanOptional(120),
    surcharge_inr: z.number().nonnegative().max(100_000).default(0),
  })
  .strict();

export type CreateTourPackageInput = z.infer<typeof CreateTourPackageSchema>;
export type UpdateTourPackageInput = z.infer<typeof UpdateTourPackageSchema>;
export type TourPackageUpgradeInput = z.infer<typeof TourPackageUpgradeSchema>;
