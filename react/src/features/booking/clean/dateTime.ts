/**
 * DateTime helpers for IST (Indian Standard Time, UTC+05:30) calculations
 */

export function toIstISOString(dateStr: string, timeStr: string): string {
  // Input: dateStr = "YYYY-MM-DD", timeStr = "HH:mm"
  // Output: "YYYY-MM-DDTHH:mm:00+05:30"
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim();
  return `${cleanDate}T${cleanTime}:00+05:30`;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function getTodayIstDate(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function getDefaultPickupDate(now: Date = new Date()): string {
  // Advance the IST calendar date, not the UTC date, so late-evening IST does not skip a day.
  return getDefaultReturnDate(getTodayIstDate(now), 1);
}

export function getDefaultReturnDate(pickupDate: string, daysOffset = 1): string {
  const parts = pickupDate.split("-").map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  date.setUTCDate(date.getUTCDate() + daysOffset);
  return date.toISOString().split("T")[0];
}

export function formatIstDisplay(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
