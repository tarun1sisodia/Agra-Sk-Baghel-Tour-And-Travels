import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, NumberInput, Select } from "@/components/ui/Input";
import { LocationAutocompleteInput } from "@/components/admin/LocationAutocompleteInput";
import { CanonicalFleetPricingGrid, FLEET_KEYS, CANONICAL_FLEET_SPECS } from "@/modules/fleets";
import type { LocalPackageFormState, LocalPackageItem } from "./local-packages.types";

interface LocalPackageFormDialogProps {
  open: boolean;
  onClose: () => void;
  form: LocalPackageFormState;
  setForm: React.Dispatch<React.SetStateAction<LocalPackageFormState>>;
  onSave: () => Promise<void>;
  editing: LocalPackageItem | null;
  busy: boolean;
}

export function LocalPackageFormDialog({
  open,
  onClose,
  form,
  setForm,
  onSave,
  editing,
  busy,
}: LocalPackageFormDialogProps) {
  function handleNameChange(name: string) {
    setForm((prev) => {
      const autoSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return {
        ...prev,
        name,
        packageCode: !editing || !prev.packageCode ? autoSlug : prev.packageCode,
      };
    });
  }

  function syncSlugFromName() {
    const autoSlug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((prev) => ({ ...prev, packageCode: autoSlug }));
  }

  function setFleetPrice(modelKeyOrId: string, val: number | undefined) {
    setForm((p) => {
      const updated = { ...p.fleetPrices };
      if (val !== undefined && val > 0) {
        updated[modelKeyOrId] = val;
      } else {
        delete updated[modelKeyOrId];
      }
      return {
        ...p,
        fleetPrices: updated,
      };
    });
  }

  function setExtraRate(tier: string, field: "per_km" | "per_hr", val: number) {
    setForm((p) => ({
      ...p,
      extraRates: {
        ...p.extraRates,
        [tier]: {
          ...(p.extraRates[tier] ?? { per_km: 12, per_hr: 150 }),
          [field]: val,
        },
      },
    }));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? `Edit: ${editing.name}` : "New Local Sightseeing Package"}
      description="Configure city tours (e.g. 8h/80km Taj Ganj & Fort) with 5 canonical fleet tiers and extra km/hr rates."
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Package Name</Label>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. 8 Hours / 80 KM Taj & Agra Fort Tour"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="mb-0">Slug / Package Code</Label>
              {!editing && (
                <button
                  type="button"
                  onClick={syncSlugFromName}
                  className="text-[11px] text-gold hover:underline font-medium"
                >
                  ⚡ Auto-generate
                </button>
              )}
            </div>
            <Input
              value={form.packageCode}
              disabled={Boolean(editing)}
              onChange={(e) => setForm((p) => ({ ...p, packageCode: e.target.value }))}
              placeholder="e.g. 8hr-80km-agra-tour"
              className={editing ? "opacity-70 bg-surface-2 cursor-not-allowed" : ""}
            />
            {editing && (
              <p className="mt-1 text-[11px] text-ink-faint">
                Package code is locked and cannot be changed after creation.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Duration (Hours)</Label>
            <NumberInput
              value={form.durationHours}
              onChange={(v) => setForm((p) => ({ ...p, durationHours: v || 8 }))}
              placeholder="8"
            />
          </div>
          <div>
            <Label>Included Distance (KM)</Label>
            <NumberInput
              value={form.includedKm}
              onChange={(v) => setForm((p) => ({ ...p, includedKm: v || 80 }))}
              placeholder="80"
            />
          </div>
        </div>

        <div>
          <LocationAutocompleteInput
            label="Monuments & Sights Covered (LocationIQ)"
            value={form.covers}
            onChange={(val) => setForm((p) => ({ ...p, covers: val }))}
            placeholder="e.g. Taj Mahal, Agra Fort, Mehtab Bagh, Itimad-ud-Daulah"
          />
        </div>

        <div>
          <Label>Parking &amp; Entry Protocol Note</Label>
          <Input
            value={form.parkingNote}
            onChange={(e) => setForm((p) => ({ ...p, parkingNote: e.target.value }))}
            placeholder="Monument entry fees & parking billed at actuals"
          />
        </div>

        {/* Canonical fleet pricing */}
        <CanonicalFleetPricingGrid
          prices={form.fleetPrices}
          onChange={setFleetPrice}
          title="Base Package Fares across Canonical Fleet (₹ INR)"
          description="Fixed package fare covering the specified hours and kilometers. Unconfigured models will not be bookable."
        />

        {/* Extra km and extra hr rate inputs */}
        <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20 space-y-3">
          <Label>Extra KM &amp; Extra Hour Rates (₹)</Label>
          <div className="grid gap-3 sm:grid-cols-5">
            {FLEET_KEYS.map((k) => {
              const spec = CANONICAL_FLEET_SPECS[k];
              const extra = form.extraRates[k] ?? { per_km: 12, per_hr: 150 };
              return (
                <div key={k} className="p-2.5 rounded border border-hairline bg-surface space-y-2">
                  <span className="font-semibold text-xs text-ink block">{spec.label}</span>
                  <div>
                    <Label className="text-[10px] text-ink-soft mb-0.5">₹/km extra</Label>
                    <NumberInput
                      value={extra.per_km}
                      onChange={(v) => setExtraRate(k, "per_km", v)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-ink-soft mb-0.5">₹/hr extra</Label>
                    <NumberInput
                      value={extra.per_hr}
                      onChange={(v) => setExtraRate(k, "per_hr", v)}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Night Charge per Night (₹, Default 0)</Label>
            <NumberInput
              value={form.nightChargeInr}
              onChange={(v) => setForm((p) => ({ ...p, nightChargeInr: v }))}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Catalog Publication Status</Label>
            <Select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
            >
              <option value="published">Published (Customer Active)</option>
              <option value="draft">Draft (Admin Only)</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="gold" onClick={onSave} disabled={busy}>
            {busy ? "Saving..." : editing ? "Save Changes" : "Create Local Package"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
