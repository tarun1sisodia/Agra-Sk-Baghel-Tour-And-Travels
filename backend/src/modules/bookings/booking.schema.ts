import { z } from "zod";
import { IsoDatetimeSchema } from "../../shared/datetime.js";
import { TICKET_ID_PATTERN } from "../../shared/ids.js";
import { BookingSelectionSchema } from "../../shared/bookingSelection.js";
import { TRIP_TYPES, VEHICLE_TIERS } from "../../types/domain.js";

// Secure validation: prevent XSS, injection, and unrealistic values
const SafeNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-zA-Z\s.'-]+$/, "Name must contain only letters, spaces, and .'-")
  .transform((v) => v.replace(/<[^>]*>/g, "").trim());

const SafeAddressSchema = z
  .string()
  .trim()
  .min(5)
  .max(300)
  .refine((v) => !/<script|javascript:|on\w+=/i.test(v), "Invalid characters in address");

const SafeNotesSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => !/<script|javascript:|on\w+=/i.test(v), "Invalid characters in notes")
  .optional();

const CreateDraftBookingBaseSchema = z.object({
  tripType: z.enum(TRIP_TYPES).optional(),
  vehicleTier: z.enum(VEHICLE_TIERS).default("sedan"),
  originName: z.string().trim().min(2).max(120).optional(),
  destinationName: z.string().trim().min(2).max(120).optional(),
  bookingSelection: BookingSelectionSchema.optional(),
  pickupAddress: SafeAddressSchema,
  dropAddress: z.string().trim().max(300).optional().refine((v) => !v || !/<script/i.test(v), "Invalid drop address"),
  pickupDatetime: IsoDatetimeSchema.refine((value) => {
    const date = new Date(value);
    const now = new Date();
    // Must be at least 1 hour in future (allow 5 min clock skew)
    const minFuture = new Date(now.getTime() + 55 * 60 * 1000);
    if (date < minFuture) return false;
    // Not more than 365 days ahead
    const maxFuture = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    return date <= maxFuture;
  }, "Pickup must be 1 hour to 365 days in future"),
  returnDatetime: IsoDatetimeSchema.optional().refine((value) => {
    if (!value) return true;
    const date = new Date(value);
    const now = new Date();
    const maxFuture = new Date(now.getTime() + 395 * 24 * 60 * 60 * 1000);
    return date <= maxFuture;
  }, "Return datetime too far in future"),
  // distanceKm is intentionally absent: the server derives/looks up distance.
  customerName: SafeNameSchema,
  customerPhone: z.string().regex(/^\+?[0-9]{10,14}$/, "Valid phone number required"),
  customerEmail: z.string().email().max(255).optional(),
  flightTrainNumber: z.string().trim().max(50).optional().refine((v) => !v || /^[A-Za-z0-9-_ ]+$/.test(v), "Invalid flight/train number"),
  specialNotes: SafeNotesSchema,
  promoCode: z.string().trim().max(30).regex(/^[A-Za-z0-9_-]+$/, "Promo code must be alphanumeric with dash/underscore").optional(),
  // Historical fields remain accepted for older clients; new clients send bookingSelection.
  packageId: z.string().trim().max(80).optional(),
  localPackageKey: z.enum(["8hr-80km", "12hr-120km", "airport-transfer"]).optional(),
}).strip();

export const CreateDraftBookingSchema = CreateDraftBookingBaseSchema
  .superRefine((data, ctx) => {
    if (data.bookingSelection && "source" in data.bookingSelection && data.bookingSelection.source === "historical") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bookingSelection", "source"], message: "Historical booking selections are read-only." });
    }
    const effectiveTripType = data.bookingSelection?.kind === "outstation"
      ? data.bookingSelection.tripType
      : data.bookingSelection
        ? undefined
        : data.tripType;
    if (effectiveTripType === "round-trip" && !data.returnDatetime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["returnDatetime"], message: "Return datetime is required for round-trip bookings." });
    }
    if (!data.bookingSelection) {
      if (!data.tripType) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tripType"], message: "Trip type is required." });
      if (!data.originName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["originName"], message: "Origin is required for direct bookings without a selection." });
      if (!data.destinationName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["destinationName"], message: "Destination is required for direct bookings without a selection." });
      if (data.originName && data.destinationName && data.originName.toLowerCase() === data.destinationName.toLowerCase() && data.tripType !== "local-tour" && !data.localPackageKey) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["destinationName"], message: "Origin and destination must differ for non-local trips." });
      }
      return;
    }
    if (data.bookingSelection.kind === "outstation" && data.bookingSelection.originName.toLowerCase() === data.bookingSelection.destinationName.toLowerCase()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bookingSelection", "destinationName"], message: "Origin and destination must differ for outstation trips." });
    }
  })
  .transform((data) => {
    const selection = data.bookingSelection;
    if (!selection) {
      return {
        ...data,
        tripType: data.tripType!,
        originName: data.originName!,
        destinationName: data.destinationName!,
      };
    }
    if (selection.kind === "outstation") {
      return {
        ...data,
        tripType: selection.tripType,
        originName: selection.originName,
        destinationName: selection.destinationName,
      };
    }
    if (selection.kind === "local") {
      return {
        ...data,
        tripType: selection.tripType,
        originName: selection.pickupLocation,
        destinationName: selection.transferTarget ?? (selection.tripType === "airport-transfer" ? "Agra Airport" : ""),
        packageId: selection.source === "catalog" ? selection.id : undefined,
        localPackageKey: selection.source === "curated" ? selection.localPackageKey : undefined,
      };
    }
    return {
      ...data,
      tripType: "round-trip" as const,
      originName: data.originName || "",
      destinationName: data.destinationName || "",
      packageId: selection.id,
      localPackageKey: undefined,
    };
  })
  .refine((data) => {
    if (!data.returnDatetime) return true;
    return new Date(data.returnDatetime).getTime() > new Date(data.pickupDatetime).getTime();
  }, { message: "Return datetime must be after pickup", path: ["returnDatetime"] })
  .refine((data) => {
    if (!data.returnDatetime) return true;
    const diffDays = (new Date(data.returnDatetime).getTime() - new Date(data.pickupDatetime).getTime()) / (24 * 60 * 60 * 1000);
    return diffDays <= 30;
  }, { message: "Return cannot be more than 30 days after pickup", path: ["returnDatetime"] });

export type CreateDraftBookingRequest = z.infer<typeof CreateDraftBookingSchema>;

export const TicketIdParamSchema = z.object({ ticketId: z.string().regex(TICKET_ID_PATTERN) });
export const BookingAccessQuerySchema = z.object({
  token: z.string().min(16).max(128).optional(),
  phone: z.string().regex(/^\+?[0-9]{10,14}$/).optional(),
});
export const MyBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export const BookingIdParamSchema = z.object({ bookingId: z.string().uuid() });
