import { z } from "zod";

/** Convert an ISO timestamp to UTC, interpreting zone-less customer input as IST. */
export function normalizeToIstIso(input: string): string {
  const value = input.trim();
  const hasExplicitZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const normalized = hasExplicitZone
    ? value
    : value.includes("T")
      ? `${value}+05:30`
      : `${value}T00:00:00+05:30`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid datetime");
  return date.toISOString();
}

export const IsoDatetimeSchema = z.string().min(10).transform((value, ctx) => {
  try {
    return normalizeToIstIso(value);
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid ISO datetime" });
    return z.NEVER;
  }
});

export function isIsoDatetime(value: string): boolean {
  try {
    normalizeToIstIso(value);
    return true;
  } catch {
    return false;
  }
}
