import { useEffect, useState, useMemo } from "react";
import { Label, NumberInput } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  fetchVehicleGroups,
  fetchVehicleModels,
  type CleanVehicleGroup,
  type CleanVehicleModel,
} from "@/services/cleanAdminApi";

interface CanonicalFleetPricingGridProps {
  prices: Record<string, number | undefined>;
  onChange: (modelKeyOrId: string, value: number | undefined) => void;
  title?: string;
  description?: string;
  currencyPrefix?: string;
  disabled?: boolean;
}

export function CanonicalFleetPricingGrid({
  prices,
  onChange,
  title = "Canonical Vehicle Options & Fares",
  description = "Configure explicit commercial fares per active vehicle model. Unconfigured models remain unavailable to customers.",
  currencyPrefix = "₹",
  disabled = false,
}: CanonicalFleetPricingGridProps) {
  const [groups, setGroups] = useState<CleanVehicleGroup[]>([]);
  const [models, setModels] = useState<CleanVehicleModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchVehicleGroups(), fetchVehicleModels()])
      .then(([g, m]) => {
        if (!mounted) return;
        setGroups(g.filter((group) => group.is_active));
        setModels(m.filter((model) => model.is_active));
      })
      .catch((err) => {
        console.error("Failed to load canonical fleet groups/models:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const groupedModels = useMemo(() => {
    const map = new Map<string, { group: CleanVehicleGroup; models: CleanVehicleModel[] }>();

    for (const group of groups) {
      map.set(group.id, { group, models: [] });
    }

    for (const model of models) {
      const entry = map.get(model.vehicle_group_id);
      if (entry) {
        entry.models.push(model);
      }
    }

    return Array.from(map.values()).filter((item) => item.models.length > 0);
  }, [groups, models]);

  // Helper to find price for model (checks model ID, model_name, display_name, group code)
  const getModelPrice = (model: CleanVehicleModel): number | undefined => {
    // 1. Direct ID match
    if (prices[model.id] !== undefined && prices[model.id]! > 0) return prices[model.id];

    // 2. Slugified display name or model name match
    const slugName = model.model_name.toLowerCase().replace(/[\s_]+/g, "-");
    if (prices[slugName] !== undefined && prices[slugName]! > 0) return prices[slugName];

    // 3. Group code match (for backward-compatible tier keys: sedan, ertiga, innova-crysta, etc.)
    const grpCode = model.group_code.toLowerCase().replace(/[\s_]+/g, "-");
    if (prices[grpCode] !== undefined && prices[grpCode]! > 0) return prices[grpCode];

    // 4. Common aliases
    if (model.display_name.toLowerCase().includes("dzire") && prices["sedan"] !== undefined) return prices["sedan"];
    if (model.display_name.toLowerCase().includes("ertiga") && prices["ertiga"] !== undefined) return prices["ertiga"];
    if (model.display_name.toLowerCase().includes("innova") && (prices["innova-crysta"] !== undefined || prices["innova"] !== undefined)) {
      return prices["innova-crysta"] ?? prices["innova"];
    }
    if (model.display_name.toLowerCase().includes("traveller") && (prices["tempo-traveller"] !== undefined || prices["tempo"] !== undefined)) {
      return prices["tempo-traveller"] ?? prices["tempo"];
    }
    if (model.display_name.toLowerCase().includes("urbania") && prices["urbania"] !== undefined) return prices["urbania"];

    return undefined;
  };

  const handlePriceChange = (model: CleanVehicleModel, val: number | undefined) => {
    // Save under canonical model ID as well as slug key for full compatibility
    const grpCode = model.group_code.toLowerCase().replace(/[\s_]+/g, "-");
    onChange(model.id, val);
    // Also mirror to group/tier code for backward compatibility
    onChange(grpCode, val);
    if (model.display_name.toLowerCase().includes("dzire")) onChange("sedan", val);
    if (model.display_name.toLowerCase().includes("ertiga")) onChange("ertiga", val);
    if (model.display_name.toLowerCase().includes("innova")) {
      onChange("innova", val);
      onChange("innova-crysta", val);
    }
    if (model.display_name.toLowerCase().includes("traveller")) {
      onChange("tempo", val);
      onChange("tempo-traveller", val);
    }
    if (model.display_name.toLowerCase().includes("urbania")) onChange("urbania", val);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20 space-y-3">
        <h4 className="font-semibold text-ink text-sm">{title}</h4>
        <p className="text-xs text-ink-soft">Loading canonical vehicle models...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20 space-y-4">
      <div>
        <h4 className="font-semibold text-ink text-sm">{title}</h4>
        {description && <p className="text-xs text-ink-soft mt-0.5">{description}</p>}
      </div>

      <div className="space-y-4">
        {groupedModels.map(({ group, models: grpModels }) => (
          <div key={group.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                {group.name} ({group.code})
              </span>
              <span className="h-px flex-1 bg-border-hairline" />
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {grpModels.map((m) => {
                const currentPrice = getModelPrice(m);
                const isConfigured = currentPrice !== undefined && currentPrice > 0;

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isConfigured
                        ? "border-emerald-500/40 bg-surface shadow-xs"
                        : "border-hairline bg-surface/60 opacity-90"
                    } flex flex-col justify-between gap-2`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <p className="font-bold text-xs text-ink leading-tight">{m.display_name}</p>
                          <p className="text-[11px] text-ink-soft">
                            {m.make} {m.model_name}
                          </p>
                        </div>
                        <Badge
                          tone={isConfigured ? "success" : "neutral"}
                          className="text-[10px] shrink-0"
                        >
                          {isConfigured ? `Configured` : "Unavailable"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-ink-soft mt-1">
                        <span>{m.passenger_capacity} seats</span>
                        {m.luggage_capacity !== null && (
                          <>
                            <span>•</span>
                            <span>{m.luggage_capacity} bags</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-1">
                      <Label className="text-[10px] text-ink-soft mb-1 block">
                        Fixed Package Price ({currencyPrefix})
                      </Label>
                      <NumberInput
                        value={currentPrice ?? 0}
                        onChange={(val) => handlePriceChange(m, val && val > 0 ? val : undefined)}
                        placeholder="Leave 0 for unavailable"
                        disabled={disabled}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
