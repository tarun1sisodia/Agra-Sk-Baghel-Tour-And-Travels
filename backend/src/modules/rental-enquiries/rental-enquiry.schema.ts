import { z } from "zod";

export const RENTAL_CARS = ["sedan", "ertiga", "innova", "tempo", "urbania"] as const;
export const CANONICAL_VEHICLE_GROUPS = ["sedan", "suv", "luxury", "tempo_traveller"] as const;
export const RENTAL_STATUSES = ["new", "contacted", "quoted", "done", "closed", "spam"] as const;

const clean = (value: string) => value.replace(/<[^>]*>/g, "").trim();

export const CreateRentalEnquirySchema = z.object({
  name: z.string().trim().min(2).max(80).regex(/^[a-zA-Z\s.'-]+$/).transform(clean),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(?:\+91)?[6-9]\d{9}$/))
    .transform((v) => `+91${v.slice(-10)}`),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  vehicleGroupCode: z.enum(CANONICAL_VEHICLE_GROUPS).optional(),
  vehicleModelId: z.string().uuid().nullable().optional().or(z.literal("")).transform((v) => (v ? v : null)),
  carTier: z.enum(RENTAL_CARS).optional(),
  pickupDate: z.string().date(),
  returnDate: z.string().date(),
  pickupLocation: z.string().trim().min(2).max(160).transform(clean),
  destinationOrItinerary: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => (v ? clean(v) : undefined)),
  passengers: z.coerce.number().int().min(1).max(50).nullable().optional(),
  withDriver: z.boolean().optional().default(true),
  note: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => (v ? clean(v) : undefined)),
  website: z.string().max(0).optional(),
}).strict().superRefine((value, ctx) => {
  if (!value.vehicleGroupCode && !value.carTier) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vehicleGroupCode"], message: "Please select a vehicle group." });
  }
  if (value.returnDate < value.pickupDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["returnDate"], message: "Return date must be on or after pickup date." });
  }
  if (value.website) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["website"], message: "Invalid submission." });
  }
});

export const RentalIdParamSchema = z.object({ id: z.string().uuid() });

export const AdminRentalQuerySchema = z.object({
  status: z.enum(RENTAL_STATUSES).optional(),
  car: z.string().optional(),
  group: z.enum(CANONICAL_VEHICLE_GROUPS).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const UpdateRentalSchema = z.object({
  status: z.enum(RENTAL_STATUSES).optional(),
  note: z.string().trim().min(1).max(1000).optional(),
}).strict();

export type CreateRentalEnquiryInput = z.input<typeof CreateRentalEnquirySchema>;
export type CreateRentalEnquiry = z.output<typeof CreateRentalEnquirySchema>;

