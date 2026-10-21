import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Compass, Edit3, Moon, RotateCw, ShieldCheck, Timer, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, NumberInput } from "@/components/ui/Input";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import { fetchAdminFareRules, updateAdminFareRules } from "@/lib/api";
import { can, type AdminUser, type FareRuleset, type VehicleTier } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

const CANONICAL_TIERS: VehicleTier[] = ["sedan", "ertiga", "innova-crysta", "tempo-traveller", "urbania"];

const CANONICAL_FLEET_DEFAULTS: Record<VehicleTier, { name: string; seats: number; perKm: number }> = {
  sedan: { name: "Sedan", seats: 4, perKm: 10 },
  ertiga: { name: "Ertiga", seats: 6, perKm: 14 },
  "innova-crysta": { name: "Innova Crysta", seats: 6, perKm: 18 },
  "tempo-traveller": { name: "Tempo Traveller", seats: 12, perKm: 25 },
  urbania: { name: "Force Urbania", seats: 16, perKm: 34 },
};

interface EditableVehicle {
  tier: VehicleTier;
  name: string;
  seats: number;
  perKm: number;
  active: boolean;
}

export function FaresPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const canRead = can(user.role, "fares:read");
  const canEdit = user.role === "super_admin" || user.role === "finance_operator";

  const [rs, setRs] = useState<FareRuleset | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Edit Fare Rules Dialog State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    minKmPerDay: 300,
    nightAllowanceCab: 300,
    nightAllowanceTempo: 500,
  });
  const [editVehicles, setEditVehicles] = useState<EditableVehicle[]>([]);

  const handleOpenEdit = () => {
    if (!rs) return;
    setEditForm({
      minKmPerDay: rs.rules.find((r) => r.vehicleTier === "sedan")?.minDailyKm ?? 300,
      nightAllowanceCab: 300,
      nightAllowanceTempo: 500,
    });
    const rulesMap = new Map(rs.rules.map((r) => [r.vehicleTier, r]));
    setEditVehicles(
      CANONICAL_TIERS.map((tier) => {
        const existing = rulesMap.get(tier);
        const defaults = CANONICAL_FLEET_DEFAULTS[tier];
        return {
          tier,
          name: existing ? existing.label.replace(/\s*\([0-9]+-seater\)\s*$/, "").trim() : defaults.name,
          seats: existing?.seats || defaults.seats,
          perKm: existing?.perKm || defaults.perKm,
          active: existing?.active !== false,
        };
      })
    );
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditOpen(true);
  };

  const handleResetToCanonical = () => {
    setEditForm({
      minKmPerDay: 300,
      nightAllowanceCab: 300,
      nightAllowanceTempo: 500,
    });
    setEditVehicles(
      CANONICAL_TIERS.map((tier) => ({
        tier,
        name: CANONICAL_FLEET_DEFAULTS[tier].name,
        seats: CANONICAL_FLEET_DEFAULTS[tier].seats,
        perKm: CANONICAL_FLEET_DEFAULTS[tier].perKm,
        active: true,
      }))
    );
    setSaveError(null);
  };

  const handleVehicleChange = (tier: VehicleTier, patch: Partial<EditableVehicle>) => {
    setEditVehicles((prev) => prev.map((v) => (v.tier === tier ? { ...v, ...patch } : v)));
  };

  const handleSaveFares = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editVehicles.some((v) => !v.name.trim())) {
      setSaveError("Every vehicle needs a display name.");
      return;
    }
    if (editVehicles.some((v) => !(v.perKm > 0) || !(v.seats > 0))) {
      setSaveError("Per-km rate and seats must be positive numbers for every vehicle.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await updateAdminFareRules({
        outstation: {
          minKmPerDay: Number(editForm.minKmPerDay),
          nightAllowanceCab: Number(editForm.nightAllowanceCab),
          nightAllowanceTempo: Number(editForm.nightAllowanceTempo),
        },
        vehicles: editVehicles.map((v) => ({
          tier: v.tier,
          name: v.name.trim(),
          seats: Number(v.seats),
          perKm: Number(v.perKm),
          active: v.active,
        })),
      });

      setSaveSuccess("Fleet and fare rules updated! Synchronized across backend and customer apps.");
      setReloadKey((k) => k + 1);
      setTimeout(() => {
        setIsEditOpen(false);
        setSaveSuccess(null);
      }, 1200);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update fare rules.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    fetchAdminFareRules()
      .then((data) => {
        if (isMounted && data) {
          setRs(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setRs(null);
          setLoadError(err instanceof Error ? err.message : "Could not reach the backend fare engine.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  if (!canRead) {
    return (
      <div>
        <PageHeader eyebrow="Access" title="Fare Rules" />
        <Card className="p-10 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 font-display text-lg text-ink">Fare rules are role-gated</p>
          <p className="mt-1 text-sm text-ink-soft">Requires dispatcher, finance_operator or super_admin.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Commercial"
        title="Fleet & Fare Rules"
        description="Full desk control of the fleet — names, seats, per-km rates and availability. Changes flow to the customer site automatically."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {rs ? (
              <Badge tone="gold" className="px-3 py-1.5">
                <Compass className="h-3.5 w-3.5" /> Ruleset {rs.version}
              </Badge>
            ) : undefined}
            {canEdit && (
              <Button variant="gold" size="sm" onClick={handleOpenEdit} disabled={!rs || loading}>
                <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit Fleet & Fares
              </Button>
            )}
          </div>
        }
      />

      {loading && (
        <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
          Loading fare rules from backend…
        </div>
      )}

      {loadError && (
        <div
          className="mb-4 flex items-center justify-between rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
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

      {rs && !loading && (
        <>
          {rs.rules.some((r) => r.perKm <= 1) && (
            <div className="mb-4 flex items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Corrupt ₹1/km rates detected</p>
                  <p className="text-xs opacity-90">Vehicles with ₹1/km will heavily undercharge quotes. Click Fix Now to load the canonical rates.</p>
                </div>
              </div>
              {canEdit && (
                <Button variant="gold" size="sm" onClick={() => { handleOpenEdit(); handleResetToCanonical(); }}>
                  Fix Now
                </Button>
              )}
            </div>
          )}

          {/* Rule chips */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Timer, label: "Minimum daily km", value: "300 km (outstation)", note: "billed at tier minimum" },
              { icon: Moon, label: "Night window", value: rs.nightWindow, note: "tier hourly rate accrues" },
              { icon: Users, label: "Driver allowance", value: "₹300–500 / day", note: "fixed per agreement" },
            ].map((chip, i) => (
              <motion.div
                key={chip.label}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="flex items-center gap-4 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-gold-soft text-gold-text">
                    <chip.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{chip.label}</p>
                    <p className="text-sm font-semibold text-ink">{chip.value}</p>
                    <p className="text-[12px] text-ink-soft">{chip.note}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Fleet & per-km rate table</CardTitle>
                <CardDescription>Effective from {rs.effectiveFrom} · version {rs.version}</CardDescription>
              </div>
              <Badge tone="teal"><ShieldCheck className="h-3 w-3" /> Server-authoritative</Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TRow>
                    <TH>Vehicle</TH>
                    <TH className="text-right">Seats</TH>
                    <TH className="text-right">Per km</TH>
                    <TH className="text-right">Min daily km</TH>
                    <TH className="text-right">Night / hr</TH>
                    <TH className="text-right">Driver / day</TH>
                    <TH className="text-center">Availability</TH>
                  </TRow>
                </THead>
                <TBody>
                  {rs.rules
                    .filter((r) => CANONICAL_TIERS.includes(r.vehicleTier as VehicleTier))
                    .map((r, i) => (
                      <motion.tr
                        key={r.vehicleTier}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                        className={cn("transition-colors hover:bg-gold-wash/50", r.active === false && "opacity-60")}
                      >
                        <TD className="text-[13px] font-medium">{r.label}</TD>
                        <TD className="text-right font-mono text-[13px]">{r.seats}</TD>
                        <TD className="text-right font-display text-[15px] font-semibold text-gold-text">
                          {formatINR(r.perKm)}
                        </TD>
                        <TD className="text-right font-mono text-[13px]">{r.minDailyKm}</TD>
                        <TD className="text-right font-mono text-[13px]">{formatINR(r.nightChargePerHour)}</TD>
                        <TD className="text-right font-mono text-[13px]">{formatINR(r.driverAllowance)}</TD>
                        <TD className="text-center">
                          {r.active === false ? (
                            <Badge tone="neutral">Off fleet</Badge>
                          ) : (
                            <Badge tone="success">Available</Badge>
                          )}
                        </TD>
                      </motion.tr>
                    ))}
                </TBody>
              </Table>
            </div>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Rule notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {rs.notes.map((n, i) => (
                  <motion.li
                    key={i}
                    initial={reduce ? { opacity: 1 } : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.35 }}
                    className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft"
                  >
                    <span className="font-mono text-[11px] text-gold-text">{String(i + 1).padStart(2, "0")}</span>
                    {n}
                  </motion.li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modify Fleet & Fare Rules Modal */}
      <Dialog
        open={isEditOpen}
        onClose={() => !saving && setIsEditOpen(false)}
        title="Edit Fleet & Fare Rules"
        description="Update vehicle names, seats, per-km rates and availability. Changes take effect immediately for the customer site and all subsequent bookings while preserving past booking snapshots."
        className="sm:max-w-2xl"
      >
        <form onSubmit={handleSaveFares} className="space-y-4">
          {saveError && (
            <div className="flex items-center gap-2 rounded-md bg-error-soft px-3 py-2 text-xs text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-teal-soft px-3 py-2 text-xs text-teal-text">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <div className="rounded-lg border border-gold/20 bg-gold-wash/30 p-3 text-xs text-ink-soft">
            <span className="font-semibold text-ink">Zero Client Trust Enforcement:</span> Rates updated here are strictly validated on the backend and saved with a versioned audit trail.
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Min Daily Km (Outstation)</label>
              <NumberInput
                min={100}
                max={1000}
                required
                value={editForm.minKmPerDay}
                onChange={(val) => setEditForm((f) => ({ ...f, minKmPerDay: val }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Cab Driver/Night (₹)</label>
              <NumberInput
                min={100}
                max={2000}
                required
                value={editForm.nightAllowanceCab}
                onChange={(val) => setEditForm((f) => ({ ...f, nightAllowanceCab: val }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Tempo Driver/Night (₹)</label>
              <NumberInput
                min={200}
                max={3000}
                required
                value={editForm.nightAllowanceTempo}
                onChange={(val) => setEditForm((f) => ({ ...f, nightAllowanceTempo: val }))}
              />
            </div>
          </div>

          <div className="border-t border-rule pt-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Fleet — names, seats, ₹/km rate and availability
            </p>
            <p className="mb-3 text-[11px] leading-relaxed text-ink-soft">
              Deactivating a vehicle hides it from the customer site's live fleet (shown as "on request") without
              touching existing bookings.
            </p>
            <div className="space-y-3">
              {editVehicles.map((v) => (
                <fieldset
                  key={v.tier}
                  className="rounded-md border border-hairline bg-surface-2/40 p-3"
                >
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-end">
                    <div className="sm:col-span-5">
                      <label className="mb-1 block text-[11px] font-semibold text-ink" htmlFor={`v-name-${v.tier}`}>
                        Display name
                      </label>
                      <Input
                        id={`v-name-${v.tier}`}
                        value={v.name}
                        required
                        maxLength={60}
                        onChange={(e) => handleVehicleChange(v.tier, { name: e.target.value })}
                        placeholder="e.g. Innova Crysta"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] font-semibold text-ink" htmlFor={`v-seats-${v.tier}`}>
                        Seats
                      </label>
                      <NumberInput
                        id={`v-seats-${v.tier}`}
                        min={1}
                        max={60}
                        required
                        value={v.seats}
                        onChange={(val) => handleVehicleChange(v.tier, { seats: val })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] font-semibold text-ink" htmlFor={`v-perkm-${v.tier}`}>
                        ₹ / km
                      </label>
                      <NumberInput
                        id={`v-perkm-${v.tier}`}
                        min={1}
                        max={400}
                        step="0.5"
                        inputMode="decimal"
                        required
                        value={v.perKm}
                        onChange={(val) => handleVehicleChange(v.tier, { perKm: val })}
                      />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-2 text-xs font-medium text-ink sm:col-span-3 sm:justify-self-end">
                      <input
                        type="checkbox"
                        checked={v.active}
                        onChange={(e) => handleVehicleChange(v.tier, { active: e.target.checked })}
                        className="h-4 w-4 accent-gold"
                      />
                      {v.active ? "On fleet" : "Off fleet"}
                    </label>
                  </div>
                </fieldset>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-rule bg-surface pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToCanonical}
              disabled={saving}
              className="text-xs"
            >
              <RotateCw className="mr-1.5 h-3.5 w-3.5" />
              Reset to standard rates
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gold" disabled={saving}>
                {saving ? "Saving…" : "Save Fleet & Rates"}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
