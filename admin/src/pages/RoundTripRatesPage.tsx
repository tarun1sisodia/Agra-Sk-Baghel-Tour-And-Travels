import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Edit3,
  Plus,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { NumberInput } from "@/components/ui/Input";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import {
  fetchVehicleModels,
  fetchFareRules,
  createFareRule,
  patchFareRule,
  type CleanVehicleModel,
  type CleanFareRule,
} from "@/services/cleanAdminApi";
import type { AdminUser } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

interface ModelWithRate {
  model: CleanVehicleModel;
  rule: CleanFareRule | null;
  ratePerKm: number | null;
}

export function RoundTripRatesPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const canEdit = user.role === "super_admin";

  const [items, setItems] = useState<ModelWithRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Edit / Add Rate Dialog State
  const [selectedItem, setSelectedItem] = useState<ModelWithRate | null>(null);
  const [newRate, setNewRate] = useState<number>(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [models, rules] = await Promise.all([
        fetchVehicleModels(),
        fetchFareRules(),
      ]);

      // Filter rules for general outstation round-trip rates (category = outstation & no specific product/route attached)
      const outstationRules = rules.filter(
        (r) =>
          r.category === "outstation" &&
          !r.route_id &&
          !r.local_package_id &&
          !r.transfer_id &&
          !r.tour_package_id
      );

      const combined: ModelWithRate[] = models.map((m) => {
        const matchingRule = outstationRules.find((r) => r.vehicle_model_id === m.id);
        return {
          model: m,
          rule: matchingRule || null,
          ratePerKm: matchingRule && matchingRule.is_active ? matchingRule.amount : null,
        };
      });

      setItems(combined);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load vehicle models or fare rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reloadKey]);

  const handleOpenEdit = (item: ModelWithRate) => {
    setSelectedItem(item);
    setNewRate(item.ratePerKm || 12);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handlePromptConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRate <= 0) {
      setSaveError("Per-km rate must be a positive integer.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!selectedItem) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      if (selectedItem.rule) {
        // Update existing rule
        await patchFareRule(selectedItem.rule.id, {
          amount: newRate,
          is_active: true,
        });
      } else {
        // Create new outstation rule
        await createFareRule({
          category: "outstation",
          vehicle_model_id: selectedItem.model.id,
          amount: newRate,
        });
      }

      setSaveSuccess(`Updated outstation rate for ${selectedItem.model.display_name} to ₹${newRate}/km!`);
      setConfirmOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save fare rule.");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commercial Matrix"
        title="Round-Trip ₹ / Km Rates"
        description="Authoritative per-km billing rates for outstation round trips. If a vehicle model has no active rate, it cannot be offered for round trips."
        actions={
          <div className="flex items-center gap-2.5">
            <Badge tone="teal">
              <ShieldCheck className="h-3.5 w-3.5" /> Live Quote Calculation
            </Badge>
          </div>
        }
      />

      {loading && (
        <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
          Loading round-trip fare rules…
        </div>
      )}

      {loadError && (
        <div
          className="flex items-center justify-between rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{loadError}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2.5 rounded-md border border-teal-500/20 bg-teal-soft px-4 py-3 text-[13px] text-teal-text">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {!loading && !loadError && (
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Vehicle Models Round-Trip Rate Sheet</CardTitle>
              <CardDescription>
                Rates apply across all outstation round-trip quotations. Positive whole numbers in INR.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-soft">
              <TrendingUp className="h-4 w-4 text-gold" />
              <span>Zero client calculation: engine calculates total based on min_km_per_day.</span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TRow>
                  <TH>Vehicle Model</TH>
                  <TH>Group</TH>
                  <TH className="text-center">Capacity</TH>
                  <TH className="text-right">Round-Trip Rate (₹ / km)</TH>
                  <TH className="text-center">Availability</TH>
                  {canEdit && <TH className="text-right">Action</TH>}
                </TRow>
              </THead>
              <TBody>
                {items.map((item, i) => {
                  const hasRate = item.ratePerKm !== null && item.ratePerKm > 0;
                  return (
                    <motion.tr
                      key={item.model.id}
                      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.03, duration: 0.25 }}
                      className={cn(
                        "transition-colors hover:bg-gold-wash/50",
                        !hasRate && "bg-amber-500/5"
                      )}
                    >
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gold-soft text-gold-text">
                            <Car className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-ink">{item.model.display_name}</p>
                            <p className="text-[11px] text-ink-soft">
                              {item.model.make} {item.model.model_name}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge tone="gold">{item.model.group_name}</Badge>
                      </TD>
                      <TD className="text-center font-mono text-xs">
                        {item.model.passenger_capacity} seats
                      </TD>
                      <TD className="text-right">
                        {hasRate ? (
                          <span className="font-display text-base font-semibold text-gold-text">
                            {formatINR(item.ratePerKm!)} / km
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-amber-600 dark:text-amber-400">
                            Missing Rate
                          </span>
                        )}
                      </TD>
                      <TD className="text-center">
                        {hasRate ? (
                          <Badge tone="success">Bookable</Badge>
                        ) : (
                          <Badge tone="neutral">Unavailable</Badge>
                        )}
                      </TD>
                      {canEdit && (
                        <TD className="text-right">
                          <Button
                            variant={hasRate ? "ghost" : "gold"}
                            size="sm"
                            className="text-xs"
                            onClick={() => handleOpenEdit(item)}
                          >
                            {hasRate ? (
                              <>
                                <Edit3 className="mr-1 h-3 w-3" /> Edit Rate
                              </>
                            ) : (
                              <>
                                <Plus className="mr-1 h-3 w-3" /> Set Rate
                              </>
                            )}
                          </Button>
                        </TD>
                      )}
                    </motion.tr>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Edit Rate Dialog */}
      <Dialog
        open={Boolean(selectedItem && !confirmOpen)}
        onClose={() => setSelectedItem(null)}
        title={`Set Round-Trip Rate: ${selectedItem?.model.display_name}`}
        description="Updates the ₹/km outstation billing rate. Used immediately in customer round-trip fare calculations."
        className="sm:max-w-md"
      >
        {selectedItem && (
          <form onSubmit={handlePromptConfirm} className="space-y-4">
            <div className="rounded-md border border-hairline bg-surface-2 p-3 text-xs text-ink-soft">
              <p className="font-semibold text-ink">Vehicle Information:</p>
              <p className="mt-1">
                {selectedItem.model.display_name} ({selectedItem.model.group_name} group, {selectedItem.model.passenger_capacity} passengers)
              </p>
              <p className="mt-2 text-[11px] text-ink-faint">
                Current rate: {selectedItem.ratePerKm ? `${formatINR(selectedItem.ratePerKm)} / km` : "No rate assigned"}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                New Rate (₹ per km)
              </label>
              <NumberInput
                min={5}
                max={500}
                required
                value={newRate}
                onChange={(val) => setNewRate(val)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-rule">
              <Button type="button" variant="outline" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold">
                Review & Confirm
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        title="Confirm New Round-Trip Rate"
        description="Verify the rate change before saving to the database."
        className="sm:max-w-md"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="font-semibold">Immediate Price Impact</span>
              </div>
              <p className="mt-1 text-[11px] opacity-90">
                All subsequent customer quotes for {selectedItem.model.display_name} on round-trip outstation journeys will calculate using ₹{newRate}/km. Existing bookings remain frozen.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded border border-hairline bg-surface-2 p-3">
                <p className="text-[11px] font-medium text-ink-faint">Old Rate</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">
                  {selectedItem.ratePerKm ? `${formatINR(selectedItem.ratePerKm)}/km` : "None"}
                </p>
              </div>
              <div className="rounded border border-gold-border bg-gold-soft p-3">
                <p className="text-[11px] font-medium text-gold-text">New Rate</p>
                <p className="mt-1 font-display text-xl font-bold text-gold-text">
                  {formatINR(newRate)}/km
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-rule">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setConfirmOpen(false)}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="gold"
                disabled={saving}
                onClick={handleConfirmSave}
              >
                {saving ? "Saving…" : "Yes, Apply Rate"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
