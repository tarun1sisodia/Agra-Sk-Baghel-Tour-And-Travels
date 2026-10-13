import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, NumberInput } from "@/components/ui/Input";
import { LocationAutocompleteInput } from "@/components/admin/LocationAutocompleteInput";
import { CanonicalFleetPricingGrid } from "@/modules/fleets";
import { TourPackageGalleryUploader } from "./TourPackageGalleryUploader";
import { INCLUSION_PRESETS, EXCLUSION_PRESETS } from "./tour-packages.constants";
import type { TourPackageFormState, TourPackageItem } from "./tour-packages.types";

interface TourPackageFormDialogProps {
  open: boolean;
  onClose: () => void;
  form: TourPackageFormState;
  setForm: React.Dispatch<React.SetStateAction<TourPackageFormState>>;
  onSave: () => Promise<void>;
  editing: TourPackageItem | null;
  busy: boolean;
}

export function TourPackageFormDialog({
  open,
  onClose,
  form,
  setForm,
  onSave,
  editing,
  busy,
}: TourPackageFormDialogProps) {
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");

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
    const autoSlug = (form.name || `${form.source} to ${form.destination}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((prev) => ({ ...prev, packageCode: autoSlug }));
  }

  function setFleetPrice(modelKeyOrId: string, value: number | undefined) {
    setForm((prev) => {
      const updated = { ...prev.fleetPrices };
      if (value !== undefined && value > 0) {
        updated[modelKeyOrId] = value;
      } else {
        delete updated[modelKeyOrId];
      }
      const validPrices = Object.values(updated).filter((p): p is number => typeof p === "number" && p > 0);
      const startingPriceInr = validPrices.length > 0 ? Math.min(...validPrices) : 0;
      return {
        ...prev,
        fleetPrices: updated,
        startingPriceInr,
      };
    });
  }

  function addInclusion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || form.inclusions.includes(trimmed)) return;
    setForm((p) => ({ ...p, inclusions: [...p.inclusions, trimmed] }));
  }

  function addCustomInclusion() {
    if (!newInclusion.trim()) return;
    addInclusion(newInclusion);
    setNewInclusion("");
  }

  function removeInclusion(idx: number) {
    setForm((p) => ({ ...p, inclusions: p.inclusions.filter((_, i) => i !== idx) }));
  }

  function addExclusion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || form.exclusions.includes(trimmed)) return;
    setForm((p) => ({ ...p, exclusions: [...p.exclusions, trimmed] }));
  }

  function addCustomExclusion() {
    if (!newExclusion.trim()) return;
    addExclusion(newExclusion);
    setNewExclusion("");
  }

  function removeExclusion(idx: number) {
    setForm((p) => ({ ...p, exclusions: p.exclusions.filter((_, i) => i !== idx) }));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? `Edit: ${editing.name}` : "New Tour Package"}
      description="Configure fixed commercial fares across active canonical vehicle models, durations, and inclusions."
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Package Name</Label>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Same Day Agra Taj Mahal Tour"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="mb-0">Package Slug / Code</Label>
              <button
                type="button"
                onClick={syncSlugFromName}
                className="text-[11px] text-gold hover:underline font-medium"
              >
                ⚡ Auto-generate from name
              </button>
            </div>
            <Input
              value={form.packageCode}
              onChange={(e) => setForm((p) => ({ ...p, packageCode: e.target.value }))}
              placeholder="e.g. same-day-agra-tour"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Duration Text</Label>
            <Input
              value={form.durationText}
              onChange={(e) => setForm((p) => ({ ...p, durationText: e.target.value }))}
              placeholder="e.g. 1 Day (12-14 Hours)"
            />
          </div>
          <div>
            <Label>Days</Label>
            <NumberInput
              min={1}
              max={30}
              value={form.days}
              onChange={(v) => setForm((p) => ({ ...p, days: v || 1 }))}
            />
          </div>
          <div>
            <Label>Nights</Label>
            <NumberInput
              min={0}
              max={30}
              value={form.nights}
              onChange={(v) => setForm((p) => ({ ...p, nights: v }))}
            />
          </div>
        </div>

        {/* Canonical fleet pricing editor */}
        <CanonicalFleetPricingGrid
          prices={form.fleetPrices}
          onChange={setFleetPrice}
          title="Canonical Fleet Fares (₹ INR)"
          description="Fixed commercial package prices across configured vehicle models. Unconfigured models will not be bookable."
        />

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
            <Label>Starting Display Price (₹)</Label>
            <NumberInput
              value={form.startingPriceInr}
              onChange={(v) => setForm((p) => ({ ...p, startingPriceInr: v }))}
              placeholder="0"
            />
          </div>
        </div>

        {/* Source and Destination with LocationIQ Autocomplete */}
        <div className="grid gap-3 sm:grid-cols-2">
          <LocationAutocompleteInput
            label="Source / Pickup Location (LocationIQ)"
            value={form.source}
            onChange={(val) => setForm((p) => ({ ...p, source: val }))}
            placeholder="e.g. Agra, Uttar Pradesh"
          />
          <LocationAutocompleteInput
            label="Destination / Route Covered (LocationIQ)"
            value={form.destination}
            onChange={(val) => setForm((p) => ({ ...p, destination: val }))}
            placeholder="e.g. Mathura, Vrindavan, Jaipur"
          />
        </div>

        <div>
          <Label>Inclusions Highlight (Short summary)</Label>
          <Input
            value={form.inclusionsHighlight}
            onChange={(e) => setForm((p) => ({ ...p, inclusionsHighlight: e.target.value }))}
            placeholder="e.g. AC Cab, Fuel, Chauffeur, Sightseeing, Tolls"
          />
        </div>

        {/* Inclusions Manager */}
        <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20 space-y-3">
          <Label>What is Included</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {INCLUSION_PRESETS.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addInclusion(item)}
                className={`text-[11px] px-2 py-0.5 rounded border ${
                  form.inclusions.includes(item)
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                    : "bg-surface border-hairline text-ink-soft hover:text-ink"
                }`}
              >
                {form.inclusions.includes(item) ? "✓ " : "+ "}
                {item}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              placeholder="Add custom inclusion..."
              className="text-xs"
            />
            <Button size="sm" variant="outline" type="button" onClick={addCustomInclusion}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {form.inclusions.length > 0 && (
            <ul className="space-y-1 text-xs">
              {form.inclusions.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between p-1.5 rounded bg-surface border border-hairline">
                  <span className="text-emerald-400">✓ {item}</span>
                  <button type="button" onClick={() => removeInclusion(idx)} className="text-ink-soft hover:text-red-400">
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Exclusions Manager */}
        <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20 space-y-3">
          <Label>What is Excluded</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {EXCLUSION_PRESETS.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addExclusion(item)}
                className={`text-[11px] px-2 py-0.5 rounded border ${
                  form.exclusions.includes(item)
                    ? "bg-rose-950/60 border-rose-500/50 text-rose-300"
                    : "bg-surface border-hairline text-ink-soft hover:text-ink"
                }`}
              >
                {form.exclusions.includes(item) ? "✗ " : "+ "}
                {item}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              placeholder="Add custom exclusion..."
              className="text-xs"
            />
            <Button size="sm" variant="outline" type="button" onClick={addCustomExclusion}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {form.exclusions.length > 0 && (
            <ul className="space-y-1 text-xs">
              {form.exclusions.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between p-1.5 rounded bg-surface border border-hairline">
                  <span className="text-rose-400">✗ {item}</span>
                  <button type="button" onClick={() => removeExclusion(idx)} className="text-ink-soft hover:text-red-400">
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Multi-Photo Supabase Gallery Uploader */}
        <TourPackageGalleryUploader
          gallery={form.gallery}
          primaryImageUrl={form.imageUrl}
          onGalleryChange={(next) => setForm((p) => ({ ...p, gallery: next }))}
          onPrimaryImageChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
          disabled={busy}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="gold" onClick={onSave} disabled={busy}>
            {busy ? "Saving..." : editing ? "Save Changes" : "Create Tour Package"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
