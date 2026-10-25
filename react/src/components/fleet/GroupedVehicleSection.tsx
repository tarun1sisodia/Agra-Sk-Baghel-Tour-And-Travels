import React, { useState } from "react";
import { Users, Briefcase, Check, ArrowRight } from "lucide-react";

export interface VehicleModelItem {
  id: string;
  name: string;
  groupCode: "sedan" | "suv" | "luxury" | "tempo_traveller" | string;
  groupName: string;
  seats: number;
  bags: number;
  fare: number | null;
  advance: number | null;
  features?: string[];
  imageUrl?: string;
}

export interface VehicleGroupItem {
  groupCode: string;
  groupName: string;
  vehicles: VehicleModelItem[];
}

export interface GroupedVehicleSectionProps {
  title?: string;
  subtitle?: string;
  category: "outstation" | "tour_package" | "local_package" | "transfer";
  productCode?: string;
  productSlug?: string;
  productName?: string;
  originName?: string;
  pickup?: string;
  destinationName?: string;
  drop?: string;
  tripType?: "one-way" | "round-trip";
  fares?: Record<string, number | null | undefined>;
  rates?: Record<string, number | null | undefined>;
  updatedAt?: string;
  selectedModel?: string;
  onSelectModel?: (model: VehicleModelItem) => void;
  className?: string;
}

const CANONICAL_VEHICLE_CATALOG: Omit<VehicleModelItem, "fare" | "advance">[] = [
  // Sedan Group
  {
    id: "dzire",
    name: "Maruti Dzire",
    groupCode: "sedan",
    groupName: "Sedan",
    seats: 4,
    bags: 2,
    features: ["Toll Tax Included", "State Tax Included"],
  },
  {
    id: "city",
    name: "Honda City",
    groupCode: "sedan",
    groupName: "Sedan",
    seats: 4,
    bags: 3,
    features: ["Toll Tax Included", "State Tax Included"],
  },
  // SUV Group
  {
    id: "ertiga",
    name: "Maruti Ertiga",
    groupCode: "suv",
    groupName: "SUV",
    seats: 6,
    bags: 3,
    features: ["Toll Tax Included", "State Tax Included"],
  },
  {
    id: "crysta",
    name: "Innova Crysta",
    groupCode: "suv",
    groupName: "SUV",
    seats: 7,
    bags: 4,
    features: ["Toll Tax Included", "State Tax Included"],
  },
  // Tempo Traveller Group
  {
    id: "traveller-12",
    name: "Force Traveller 12-Seater",
    groupCode: "tempo_traveller",
    groupName: "Tempo Traveller",
    seats: 12,
    bags: 8,
    features: ["Toll Tax Included", "Chauffeur Allowance"],
  },
  {
    id: "urbania-13",
    name: "Force Urbania VIP",
    groupCode: "tempo_traveller",
    groupName: "Tempo Traveller",
    seats: 13,
    bags: 10,
    features: ["Luxury Recline", "Climate Control"],
  },
  // Luxury Group
  {
    id: "camry",
    name: "Toyota Camry Hybrid",
    groupCode: "luxury",
    groupName: "Luxury",
    seats: 4,
    bags: 2,
    features: ["VIP Leather Lounge", "Quiet Cabin"],
  },
  {
    id: "vellfire",
    name: "Toyota Vellfire",
    groupCode: "luxury",
    groupName: "Luxury",
    seats: 6,
    bags: 4,
    features: ["Ottoman Armchairs", "Executive Suite"],
  },
];

function resolveModelPrice(
  fares: Record<string, number | null | undefined> | undefined,
  modelId: string
): number | null {
  if (!fares) return null;

  // Direct match
  if (typeof fares[modelId] === "number" && (fares[modelId] as number) > 0) {
    return fares[modelId] as number;
  }

  // Common aliases
  const aliases: Record<string, string[]> = {
    dzire: ["maruti-dzire", "dzire", "sedan"],
    city: ["honda-city", "city", "sedan"],
    ertiga: ["maruti-ertiga", "ertiga", "suv"],
    crysta: ["innova-crysta", "innova", "toyota-innova-crysta", "crysta"],
    "traveller-12": ["tempo-traveller", "traveller-12", "traveller", "tempo"],
    "urbania-13": ["urbania-13", "urbania", "force-urbania"],
    camry: ["camry", "toyota-camry"],
    vellfire: ["vellfire", "toyota-vellfire"],
  };

  const candidateKeys = aliases[modelId] || [modelId];
  for (const k of candidateKeys) {
    if (typeof fares[k] === "number" && (fares[k] as number) > 0) {
      return fares[k] as number;
    }
  }

  return null;
}

export function GroupedVehicleSection({
  title = "Choose Available Vehicle",
  subtitle = "Transparent, group-based vehicle options. Fares are all-inclusive with zero hidden toll surprises.",
  category,
  productCode,
  productSlug,
  productName,
  originName,
  pickup,
  destinationName,
  drop,
  tripType = "one-way",
  fares,
  rates,
  updatedAt,
  selectedModel: propSelectedModel,
  onSelectModel,
  className = "",
}: GroupedVehicleSectionProps) {
  const effectiveProductCode = productCode || productSlug || "";
  const effectiveProductName = productName || drop || effectiveProductCode;
  const effectiveOrigin = originName || pickup || "Agra";
  const effectiveDestination = destinationName || drop || "";
  const effectiveFares = fares || rates || {};

  const [internalSelected, setInternalSelected] = useState<string>(
    propSelectedModel || "dzire"
  );
  const activeSelected = propSelectedModel || internalSelected;

  // Build groups from canonical catalog and provided fares
  const groups: VehicleGroupItem[] = [];
  const groupOrder = ["sedan", "suv", "tempo_traveller", "luxury"];
  const groupDisplayNames: Record<string, string> = {
    sedan: "Sedan",
    suv: "SUV",
    tempo_traveller: "Tempo Traveller",
    luxury: "Luxury",
  };

  for (const groupCode of groupOrder) {
    const catalogVehicles = CANONICAL_VEHICLE_CATALOG.filter(
      (v) => v.groupCode === groupCode
    );

    const vehicleItems: VehicleModelItem[] = catalogVehicles.map((v) => {
      const price = resolveModelPrice(effectiveFares, v.id);
      const advance = price ? Math.round(price * 0.28) : null;
      return {
        ...v,
        fare: price,
        advance,
      };
    });

    // Only include groups that have at least one vehicle with a priced fare,
    // or if no fares are provided at all (catalog mode), show active groups
    const hasPriced = vehicleItems.some((v) => v.fare !== null);
    if (hasPriced || Object.keys(effectiveFares).length === 0) {
      // Filter out vehicles that have explicitly null fare if other vehicles in the group are priced
      const displayVehicles = hasPriced
        ? vehicleItems.filter((v) => v.fare !== null)
        : vehicleItems;

      if (displayVehicles.length > 0) {
        groups.push({
          groupCode,
          groupName: groupDisplayNames[groupCode] || groupCode.toUpperCase(),
          vehicles: displayVehicles,
        });
      }
    }
  }

  const handleSelect = (v: VehicleModelItem) => {
    setInternalSelected(v.id);
    if (onSelectModel) {
      onSelectModel(v);
    }
  };

  const getBookingUrl = (v: VehicleModelItem) => {
    const tripParam = tripType === "round-trip" ? "round_trip" : "one_way";
    return `/book.html?category=${category}&product=${encodeURIComponent(
      effectiveProductCode
    )}&trip=${tripParam}&from=${encodeURIComponent(
      effectiveOrigin
    )}&to=${encodeURIComponent(effectiveDestination || effectiveProductName)}&car=${encodeURIComponent(
      v.id
    )}`;
  };

  if (groups.length === 0) {
    return (
      <div className={`rounded-xl border border-border-warm bg-sandstone-wash/30 p-8 text-center ${className}`}>
        <h3 className="font-title-lg text-title-lg font-serif text-ink-charcoal">
          Custom Fleet Allocation
        </h3>
        <p className="mt-2 text-sm text-on-surface-variant max-w-lg mx-auto">
          Fares for {effectiveProductName} are custom-scheduled based on your group size and exact dates.
          Contact our 24×7 desk for an instant guaranteed quotation.
        </p>
        <div className="mt-4">
          <a
            href={`/book.html?category=${category}&product=${encodeURIComponent(effectiveProductCode)}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Request Instant Quote <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-headline-md text-headline-md text-ink-charcoal font-serif">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 font-body-sm text-body-sm text-on-surface-variant">
            {subtitle}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.groupCode} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border-warm/60 pb-2">
              <span className="font-serif text-base font-bold text-ink-charcoal">
                {group.groupName}
              </span>
              <span className="text-xs text-on-surface-variant">
                ({group.vehicles.length}{" "}
                {group.vehicles.length === 1 ? "model" : "models"} available)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.vehicles.map((v) => {
                const isSelected = activeSelected === v.id;
                const bookUrl = getBookingUrl(v);

                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelect(v)}
                    className={`group relative flex flex-col justify-between rounded-xl border p-5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                        : "border-border-warm bg-surface hover:border-primary/50 hover:shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-base text-ink-charcoal group-hover:text-primary transition-colors">
                            {v.name}
                          </h3>
                        </div>
                        <span
                          className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border-warm bg-surface"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-terracotta-sandstone" />
                          <span>{v.seats} seats</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-terracotta-sandstone" />
                          <span>{v.bags} bags</span>
                        </span>
                      </div>

                      {v.features && v.features.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {v.features.map((feat, i) => (
                            <span
                              key={i}
                              className="rounded bg-sandstone-wash px-2 py-0.5 text-[11px] font-medium text-terracotta-sandstone"
                            >
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-border-warm/50 flex items-end justify-between">
                      <div>
                        {v.fare !== null ? (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="font-headline-md text-headline-sm font-serif font-bold text-terracotta-sandstone">
                                ₹{v.fare.toLocaleString("en-IN")}
                              </span>
                              <span className="text-xs text-on-surface-variant">
                                All-Inclusive
                              </span>
                            </div>
                            {v.advance !== null && (
                              <p className="font-mono text-[11px] text-secondary">
                                Advance: ₹{v.advance.toLocaleString("en-IN")} (28%)
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="font-serif text-base font-medium text-secondary">
                            On request
                          </span>
                        )}
                      </div>

                      <a
                        href={bookUrl}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(v);
                        }}
                        className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-primary text-white shadow-xs"
                            : "bg-sandstone-wash text-primary hover:bg-primary hover:text-white"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </a>
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
