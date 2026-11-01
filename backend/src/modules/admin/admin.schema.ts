import { z } from "zod";
import { BOOKING_STATUSES, INQUIRY_STATUSES, PAYMENT_STATUSES } from "../../types/domain.js";

export const AdminBookingQuerySchema = z.object({
  status: z
    .enum(BOOKING_STATUSES)
    .optional(),
  ticketId: z.string().max(30).optional(),
  page: z.coerce.number().int().positive().max(1000).default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const BookingIdParamSchema = z.object({
  id: z.string().min(1).max(64),
});

export const TransitionBookingSchema = z
  .object({
    to: z.enum(BOOKING_STATUSES),
    expectedVersion: z.number().int().nonnegative().optional(),
  })
  .strict();

export const CreateRefundSchema = z
  .object({
    bookingId: z.string().min(1).max(64),
    reason: z.string().trim().min(5).max(500).refine((v) => !/<script/i.test(v), "Invalid reason content"),
    idempotencyKey: z.string().min(1).max(64),
    amountMinor: z.number().int().positive().optional(),
  })
  .strict();

export const AdminInquiryQuerySchema = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().max(1000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const AdminInquiryIdParamSchema = z.object({
  id: z.string().min(1).max(64),
});

export const AdminUpdateInquirySchema = z
  .object({
    status: z.enum(INQUIRY_STATUSES).optional(),
    note: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

export const AdminPaymentQuerySchema = z.object({
  bookingId: z.string().uuid().optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  provider: z.string().max(50).optional(),
  page: z.coerce.number().int().positive().max(1000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const AdminUpdateFareRulesSchema = z.object({
  version: z.string().max(20).optional(),
  effectiveFrom: z.string().max(50).optional(),
  outstation: z
    .object({
      minKmPerDay: z.number().int().positive().optional(),
      nightAllowanceCab: z.number().int().nonnegative().optional(),
      nightAllowanceTempo: z.number().int().nonnegative().optional(),
      nightStartHour: z.number().int().min(0).max(23).optional(),
      nightEndHour: z.number().int().min(0).max(23).optional(),
      deadheadKmRate: z.number().int().nonnegative().optional(),
    })
    .optional(),
  vehicles: z
    .array(
      z.object({
        tier: z.string(),
        name: z.string().optional(),
        seats: z.number().int().positive().optional(),
        bags: z.number().int().nonnegative().optional(),
        perKm: z.number().positive(),
        active: z.boolean().optional(),
      }),
    )
    .optional(),
  localPackages: z.record(z.string(), z.any()).optional(),
  airportTransfers: z.record(z.string(), z.any()).optional(),
  notes: z.array(z.string()).optional(),
  dynamicConfig: z.record(z.string(), z.any()).optional(),
});

export const AdminActivateFareRuleSchema = z.object({
  version: z.string().min(1).max(20),
});
