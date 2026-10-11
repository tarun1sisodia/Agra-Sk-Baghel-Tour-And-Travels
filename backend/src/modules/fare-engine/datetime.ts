/**
 * IST (Asia/Kolkata) Date & Time Utilities
 * Timezone: Asia/Kolkata is fixed UTC + 5:30 (330 minutes), no DST.
 */

export interface IstDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dateString: string; // YYYY-MM-DD
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function getIstParts(dateInput: string | Date): IstDateTimeParts {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    throw new Error("INVALID_DATE");
  }

  const istDate = new Date(d.getTime() + IST_OFFSET_MS);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth() + 1;
  const day = istDate.getUTCDate();
  const hour = istDate.getUTCHours();
  const minute = istDate.getUTCMinutes();
  const second = istDate.getUTCSeconds();
  const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { year, month, day, hour, minute, second, dateString };
}

/**
 * Returns calendar days between two datetimes in IST:
 * IST_date(return_at) - IST_date(pickup_at) + 1
 */
export function calculateIstCalendarDays(pickupAt: string | Date, returnAt: string | Date): number {
  const p = getIstParts(pickupAt);
  const r = getIstParts(returnAt);

  const pickupUtcMidnight = Date.UTC(p.year, p.month - 1, p.day);
  const returnUtcMidnight = Date.UTC(r.year, r.month - 1, r.day);

  if (returnUtcMidnight < pickupUtcMidnight) {
    throw new Error("RETURN_BEFORE_PICKUP");
  }

  const diffDays = Math.round((returnUtcMidnight - pickupUtcMidnight) / (24 * 60 * 60 * 1000)) + 1;
  return diffDays;
}

/**
 * Evaluates whether an IST pickup time falls inside the night window.
 * Default night window: 20:00 inclusive to 06:00 exclusive.
 * 19:59 -> false, 20:00 -> true, 23:59 -> true, 00:00 -> true, 05:59 -> true, 06:00 -> false
 */
export function isPickupInNightWindow(
  pickupAt: string | Date,
  nightStartHour = 20,
  nightEndHour = 6
): boolean {
  const { hour } = getIstParts(pickupAt);
  if (nightStartHour > nightEndHour) {
    // Crosses midnight (e.g. 20 to 6)
    return hour >= nightStartHour || hour < nightEndHour;
  }
  // Same-day window (e.g. 1 to 5)
  return hour >= nightStartHour && hour < nightEndHour;
}
