import { describe, expect, it } from "vitest";
import { mapLocalPackage } from "../../src/db/postgres.js";

describe("mapLocalPackage fields", () => {
  it("returns saved surcharges and keeps legacy missing rates unknown", () => {
    const row = {
      id: "30000000-0000-0000-0001-000000000001",
      code: "agra-local",
      name: "Agra Local",
      duration_hours: 8,
      included_km: 80,
      status: "published",
      created_at: "2026-10-16T00:00:00.000Z",
      updated_at: "2026-10-16T00:00:00.000Z",
    };
    expect(mapLocalPackage(row).extraRates).toBeNull();
    const mapped = mapLocalPackage({
      ...row,
      extra_rates: { sedan: { per_km: 13, per_hr: 175 }, suv: { per_km: 19, per_hr: 240 } },
      night_charge_inr: 225,
      use_per_km: true,
    });
    expect(mapped.extraRates).toEqual({ sedan: { per_km: 13, per_hr: 175 }, suv: { per_km: 19, per_hr: 240 } });
    expect(mapped.nightChargeInr).toBe(225);
    expect(mapped.usePerKm).toBe(true);
  });

  it("preserves the cover image and gallery from the canonical local_packages row", () => {
    const gallery = [
      {
        url: "/assets/booking/taj-mahal.webp",
        alt: "Agra Sightseeing - Taj Mahal",
        caption: "Agra Sightseeing",
      },
    ];

    const mapped = mapLocalPackage({
      id: "30000000-0000-0000-0001-000000000001",
      code: "agra-8h-80km",
      name: "Agra Sightseeing (8 Hours / 80 KM)",
      duration_hours: 8,
      included_km: 80,
      covers: "Taj Mahal, Agra Fort, Mehtab Bagh",
      inclusions_note: "Monument entry fees & parking billed at actuals",
      image_url: "/assets/booking/taj-mahal.webp",
      gallery,
      status: "published",
      is_active: true,
      created_at: "2026-10-16T00:00:00.000Z",
      updated_at: "2026-10-16T00:00:00.000Z",
    });

    expect(mapped.imageUrl).toBe("/assets/booking/taj-mahal.webp");
    expect(mapped.gallery).toEqual(gallery);
  });
});
