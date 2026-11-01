// backend/src/modules/local-packages/local-packages.schema.ts
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
    duration_hours: z.number().int().min(1).max(48),
    included_km: z.number().int().min(10).max(1000),
    covers: cleanText(2, 500),
    parking_note: cleanOptional(200),
    fleet_prices: z.record(z.string(), z.number().positive().max(1_000_000).finite()),
    use_per_km: z.boolean().default(false),
    extra_rates: z
      .record(
        z.string(),
        z.object({
          per_km: z.number().positive().finite(),
          per_hr: z.number().positive().finite(),
        })
      )
      .nullable()
      .optional(),
    night_charge_inr: z.number().nonnegative().max(100_000).default(0),
    status: z.enum(["draft", "published", "archived"]).optional(),
    is_active: z.boolean().default(true),
  })
  .strict();

export const CreateLocalPackageSchema = base;
export const UpdateLocalPackageSchema = base.partial().omit({ status: true }).extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});
export const LocalPackageIdSchema = z.object({ id: z.string().uuid() });
export const LocalPackageCodeSchema = z.object({ code: z.string().trim().min(2).max(80) });
export const LocalPackageQuerySchema = z.object({
  status: z.enum(["draft", "published", "archived", "all"]).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateLocalPackageInput = z.infer<typeof CreateLocalPackageSchema>;
export type UpdateLocalPackageInput = z.infer<typeof UpdateLocalPackageSchema>;
