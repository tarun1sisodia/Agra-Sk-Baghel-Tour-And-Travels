import { Label, NumberInput } from "@/components/ui/Input";
import type { VehicleTier } from "@/contracts/vehicle-tiers";
import { FLEET_KEYS, getFleetSpec } from "./fleets.constants";

interface FleetPricingGridProps {
  prices: Record<string, number | undefined>;
  onChange: (tier: VehicleTier, value: number) => void;
  title?: string;
  description?: string;
  currencyPrefix?: string;
  disabled?: boolean;
}

export function FleetPricingGrid({
  prices,
  onChange,
  title = "Group-Based Fleet Fares (₹ INR)",
  description,
  currencyPrefix = "₹",
  disabled = false,
}: FleetPricingGridProps) {
  return (
    <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20 space-y-3">
      <div>
        <h4 className="font-semibold text-ink text-sm">{title}</h4>
        {description && (
          <p className="text-xs text-ink-soft mt-0.5">{description}</p>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {FLEET_KEYS.map((k) => {
          const spec = getFleetSpec(k);
          const val = prices[k] ?? 0;

          return (
            <div key={k} className="p-2.5 rounded border border-hairline bg-surface flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-ink">{spec.label}</span>
                  <span className="text-[10px] text-ink-soft">{spec.seats.split(" ")[0]}</span>
                </div>
                <p className="text-[10px] text-ink-soft truncate" title={spec.name}>
                  {spec.name}
                </p>
              </div>

              <div className="mt-2">
                <Label className="text-[10px] text-ink-soft mb-1 block">
                  Fare ({currencyPrefix})
                </Label>
                <NumberInput
                  value={val}
                  onChange={(v) => onChange(k, v)}
                  placeholder="0"
                  disabled={disabled}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
