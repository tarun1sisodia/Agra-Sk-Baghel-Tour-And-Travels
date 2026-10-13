import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, NumberInput } from "@/components/ui/Input";
import { LocationAutocompleteInput } from "@/components/admin/LocationAutocompleteInput";
import { CanonicalFleetPricingGrid } from "@/modules/fleets";
import type { TransferRouteFormState, TransferRouteItem } from "./transfer-routes.types";

interface TransferRouteFormDialogProps {
  open: boolean;
  onClose: () => void;
  form: TransferRouteFormState;
  setForm: React.Dispatch<React.SetStateAction<TransferRouteFormState>>;
  onSave: () => Promise<void>;
  editing: TransferRouteItem | null;
  busy: boolean;
}

export function TransferRouteFormDialog({
  open,
  onClose,
  form,
  setForm,
  onSave,
  editing,
  busy,
}: TransferRouteFormDialogProps) {
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
        routeCode: !editing || !prev.routeCode ? autoSlug : prev.routeCode,
      };
    });
  }

  function syncSlugFromName() {
    const autoSlug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((prev) => ({ ...prev, routeCode: autoSlug }));
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? `Edit: ${editing.name}` : "New Airport / Station Transfer"}
      description="Configure point-to-point station or airport transfers with fixed fares across canonical vehicle models."
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Route Name</Label>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Agra Cantt Railway Station to Taj East Gate"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="mb-0">Slug / Route Code</Label>
              <button
                type="button"
                onClick={syncSlugFromName}
                className="text-[11px] text-gold hover:underline font-medium"
              >
                ⚡ Auto-generate
              </button>
            </div>
            <Input
              value={form.routeCode}
              onChange={(e) => setForm((p) => ({ ...p, routeCode: e.target.value }))}
              placeholder="e.g. agra-cantt-to-taj-east-gate"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Distance Text</Label>
            <Input
              value={form.distanceText}
              onChange={(e) => setForm((p) => ({ ...p, distanceText: e.target.value }))}
              placeholder="~15–20 km"
            />
          </div>
          <div>
            <Label>Night Charge per Night (₹, Default 0)</Label>
            <NumberInput
              value={form.nightChargeInr}
              onChange={(v) => setForm((p) => ({ ...p, nightChargeInr: v }))}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <LocationAutocompleteInput
            label="Station / Destination Location (LocationIQ)"
            value={form.directionNote}
            onChange={(val) => setForm((p) => ({ ...p, directionNote: val }))}
            placeholder="e.g. Agra Cantt Railway Station, Agra Airport Kheria"
          />
        </div>

        {/* Canonical fleet pricing */}
        <CanonicalFleetPricingGrid
          prices={form.fleetPrices}
          onChange={setFleetPrice}
          title="Fixed Transfer Fares across Canonical Fleet (₹ INR)"
          description="Fixed doorstep pickup / drop fares including all driver charges and local tolls. Unconfigured models remain unavailable."
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="gold" onClick={onSave} disabled={busy}>
            {busy ? "Saving..." : editing ? "Save Changes" : "Create Transfer Route"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
