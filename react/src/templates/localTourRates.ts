// These are the four canonical fleet groups configured by the local-package
// admin form. Labels are presentation only; prices come solely from the package.
const LOCAL_RATE_TIERS = [
  { key: "sedan", group: "Sedan (Dzire, City)", seats: "4 Passengers" },
  { key: "suv", group: "SUV (Ertiga, Innova Crysta)", seats: "6-7 Passengers" },
  { key: "tempo_traveller", group: "Tempo Traveller (12/17 Seater)", seats: "12–16 Passengers" },
  { key: "luxury", group: "Luxury Executive (Camry, Vellfire)", seats: "4–6 Passengers" },
] as const;

type ExtraRates = Record<string, { per_km?: number; per_hr?: number }> | null | undefined;

function publishedRate(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function getLocalExtraRateRows(extraRates: ExtraRates) {
  return LOCAL_RATE_TIERS.map((tier) => ({
    ...tier,
    perKm: publishedRate(extraRates?.[tier.key]?.per_km),
    perHr: publishedRate(extraRates?.[tier.key]?.per_hr),
  }));
}

export function getLocalExtraRateFaq(
  rows: ReturnType<typeof getLocalExtraRateRows>,
  durationHours: number,
  includedKm: number,
): string {
  const tariffs = rows.flatMap((row) => {
    const charges = [
      row.perKm !== null ? `₹${row.perKm.toLocaleString("en-IN")}/km` : null,
      row.perHr !== null ? `₹${row.perHr.toLocaleString("en-IN")}/hr` : null,
    ].filter(Boolean);
    return charges.length ? [`${row.group}: ${charges.join(" and ")}`] : [];
  });
  const intro = `If your tour exceeds ${durationHours} hours or ${includedKm} km, extra distance or time may be billed.`;
  return tariffs.length
    ? `${intro} Configured rates are ${tariffs.join("; ")}. Please confirm any unlisted rates before booking.`
    : `${intro} Please contact us to confirm the applicable vehicle rates before booking.`;
}
