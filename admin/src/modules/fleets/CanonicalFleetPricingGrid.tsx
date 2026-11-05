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

  // Helper to find price for model strictly per-model.
  // Never falls back to a group code (e.g. "sedan" / "suv" / "tempo_traveller") across different models.
  const getModelPrice = (model: CleanVehicleModel): number | undefined => {
    // 1. Direct ID match (UUID)
    if (prices[model.id] !== undefined && prices[model.id]! > 0) return prices[model.id];

    // 2. Exact slugified model name match (e.g. "dzire", "ertiga", "innova-crysta", "urbania-13", "urbania-17", "traveller-12", "traveller-17", "amaze", "glanza")
    const slugName = model.model_name.toLowerCase().replace(/[\s_]+/g, "-");
    if (prices[slugName] !== undefined && prices[slugName]! > 0) return prices[slugName];

    // 3. Exact slugified display name match
    const displaySlug = model.display_name.toLowerCase().replace(/[\s_]+/g, "-");
    if (prices[displaySlug] !== undefined && prices[displaySlug]! > 0) return prices[displaySlug];

    // 4. Strict legacy aliases — ONLY for the single baseline model of that legacy key:
    const mLow = model.model_name.toLowerCase();
    if (mLow === "dzire" && prices["sedan"] !== undefined && prices["sedan"]! > 0) {
      return prices["sedan"];
    }
    if (mLow === "ertiga" && prices["suv"] !== undefined && prices["suv"]! > 0) {
      return prices["suv"];
    }
    if (mLow === "innova crysta" || mLow === "crysta") {
      if (prices["innova-crysta"] !== undefined && prices["innova-crysta"]! > 0) return prices["innova-crysta"];
      if (prices["innova"] !== undefined && prices["innova"]! > 0) return prices["innova"];
    }
    if (mLow === "traveller 12") {
      if (prices["traveller-12"] !== undefined && prices["traveller-12"]! > 0) return prices["traveller-12"];
      if (prices["tempo-traveller"] !== undefined && prices["tempo-traveller"]! > 0) return prices["tempo-traveller"];
      if (prices["tempo"] !== undefined && prices["tempo"]! > 0) return prices["tempo"];
    }
    if (mLow === "urbania 13") {
      if (prices["urbania-13"] !== undefined && prices["urbania-13"]! > 0) return prices["urbania-13"];
      if (prices["urbania"] !== undefined && prices["urbania"]! > 0) return prices["urbania"];
    }

    return undefined;
  };

  const handlePriceChange = (model: CleanVehicleModel, val: number | undefined) => {
    // Save per-model only: canonical model ID plus the slugified model-name key.
    // Do NOT mirror the value onto group/tier keys — every model is configured independently.
    const slugName = model.model_name.toLowerCase().replace(/[\s_]+/g, "-");
    onChange(model.id, val);
    onChange(slugName, val);

    // Purge legacy group keys from state so they never bleed into other models
    const grpCode = model.group_code.toLowerCase().replace(/[\s_]+/g, "-");
    const legacyKeysToPurge = [
      grpCode,
      model.group_code,
      "sedan",
      "suv",
      "tempo_traveller",
      "tempo-traveller",
      "tempo",
      "urbania",
    ];
    for (const lk of legacyKeysToPurge) {
      if (prices[lk] !== undefined) {
        onChange(lk, undefined);
      }
    }
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
