import type { VehicleTier } from "@/contracts/vehicle-tiers";
import { getFleetSpec } from "./fleets.constants";

interface FleetBadgeProps {
  tier: VehicleTier | string;
  className?: string;
  showSeats?: boolean;
}

export function FleetBadge({ tier, className = "", showSeats = false }: FleetBadgeProps) {
  const spec = getFleetSpec(tier as VehicleTier);
  const label = spec ? spec.label : tier;
  const seats = spec?.seats;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border border-hairline bg-surface-raised text-ink ${className}`}
    >
      <span className="font-semibold">{label}</span>
      {showSeats && seats && (
        <span className="text-ink-soft text-[10px]">({seats})</span>
      )}
    </span>
  );
}
