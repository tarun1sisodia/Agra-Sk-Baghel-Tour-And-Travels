import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Moon,
  Percent,
  RotateCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { NumberInput } from "@/components/ui/Input";
import {
  fetchFareSettings,
  patchFareSetting,
  type CleanFareSetting,
} from "@/services/cleanAdminApi";
import type { AdminUser } from "@/lib/types";

interface SettingConfig {
  label: string;
  description: string;
  unit: string;
  min: number;
  max: number;
  impact: string;
  icon: typeof Timer;
}

const SETTING_CONFIGS: Record<string, SettingConfig> = {
  advance_percent: {
    label: "Advance Deposit Percentage",
    description: "Percentage of total fare collected upfront via Razorpay during booking.",
    unit: "%",
    min: 5,
    max: 100,
    impact: "Affects the advance amount paid by all customers during checkout.",
    icon: Percent,
  },
  min_km_per_day: {
    label: "Minimum Daily Km (Outstation)",
    description: "Minimum distance billed per calendar day on outstation round trips.",
    unit: "km",
    min: 100,
    max: 1000,
    impact: "Outstation round trips are billed at at least this mileage per IST calendar day.",
    icon: Scale,
  },
  max_round_trip_days: {
    label: "Maximum Round-Trip Duration",
    description: "Maximum allowable trip duration in IST calendar days for customer self-service booking.",
    unit: "days",
    min: 1,
    max: 30,
    impact: "Customer booking attempts exceeding this duration will receive a TRIP_TOO_LONG validation error.",
    icon: Timer,
  },
  night_start_hour: {
    label: "Night Window Start Hour",
    description: "Starting hour (0–23 in 24h format, IST) of the one-way night surcharge window.",
    unit: ":00 IST",
    min: 0,
    max: 23,
    impact: "One-way trips with pickup at or after this hour incur the vehicle group night surcharge.",
    icon: Moon,
  },
  night_end_hour: {
    label: "Night Window End Hour",
    description: "Ending hour (0–23 in 24h format, IST) of the one-way night surcharge window.",
    unit: ":00 IST",
    min: 0,
    max: 23,
    impact: "One-way trips with pickup before this hour incur the vehicle group night surcharge.",
    icon: Moon,
  },
};

export function FareSettingsPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const canEdit = user.role === "super_admin";

  const [settings, setSettings] = useState<CleanFareSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Edit Setting State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchFareSettings();
      setSettings(data);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load fare settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reloadKey]);

  const handleStartEdit = (key: string, currentVal: number) => {
    setEditingKey(key);
    setEditValue(currentVal);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handlePromptConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!editingKey) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await patchFareSetting(editingKey, editValue);
      setSaveSuccess(`Setting "${editingKey}" updated successfully!`);
      setConfirmOpen(false);
      setEditingKey(null);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update setting.");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const currentSetting = settings.find((s) => s.key === editingKey);
  const currentConfig = editingKey ? SETTING_CONFIGS[editingKey] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commercial Configuration"
        title="Fare System Settings"
        description="Database-authoritative operating parameters governing deposit percentages, trip duration limits, and night surcharge windows."
        actions={
          <div className="flex items-center gap-2.5">
            <Badge tone="teal">
              <ShieldCheck className="h-3.5 w-3.5" /> Immutable Rules
            </Badge>
          </div>
        }
      />

      {loading && (
        <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
          Loading fare settings from database…
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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {settings.map((setting, i) => {
            const config = SETTING_CONFIGS[setting.key] || {
              label: setting.key,
              description: setting.description || "Database setting",
              unit: "",
              min: 0,
              max: 9999,
              impact: "Commercial fare computation parameter.",
              icon: Scale,
            };
            const Icon = config.icon;

            return (
              <motion.div
                key={setting.key}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Card className="flex h-full flex-col justify-between">
                  <div>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gold-soft text-gold-text">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <CardTitle className="text-base">{config.label}</CardTitle>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                            {setting.key}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2 text-xs">
                      <div className="flex items-baseline justify-between rounded-md bg-surface-2 p-3">
                        <span className="font-medium text-ink-soft">Active Value</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-2xl font-bold text-ink">
                            {setting.value}
                          </span>
                          <span className="font-mono text-xs text-ink-faint">{config.unit}</span>
                        </div>
                      </div>

                      <p className="leading-relaxed text-ink-soft">{config.description}</p>

                      <div className="rounded border border-hairline bg-surface/50 p-2 text-[11px] text-ink-faint">
                        <p className="font-semibold text-ink-soft">Impact Note:</p>
                        <p>{config.impact}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-ink-faint">
                        <span>Allowed Range:</span>
                        <span className="font-mono font-medium text-ink">
                          {config.min} – {config.max} {config.unit}
                        </span>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-4 pt-0">
                    {canEdit ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handleStartEdit(setting.key, setting.value)}
                      >
                        <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Change Value
                      </Button>
                    ) : (
                      <div className="text-center text-[11px] text-ink-faint">
                        Super Admin permissions required to modify
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={Boolean(editingKey && !confirmOpen)}
        onClose={() => setEditingKey(null)}
        title={currentConfig ? `Edit ${currentConfig.label}` : "Edit Setting"}
        description={`Modify the database value for ${editingKey}. Requires confirmation.`}
        className="sm:max-w-md"
      >
        {currentConfig && currentSetting && (
          <form onSubmit={handlePromptConfirm} className="space-y-4">
            <div className="rounded-md border border-hairline bg-surface-2 p-3 text-xs text-ink-soft">
              <p className="font-semibold text-ink">Setting Details:</p>
              <p className="mt-1">{currentConfig.description}</p>
              <p className="mt-2 text-[11px] text-ink-faint">
                Valid bounds: {currentConfig.min} to {currentConfig.max} {currentConfig.unit}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                New Value ({currentConfig.unit})
              </label>
              <NumberInput
                min={currentConfig.min}
                max={currentConfig.max}
                required
                value={editValue}
                onChange={(val) => setEditValue(val)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-rule">
              <Button type="button" variant="outline" onClick={() => setEditingKey(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold">
                Review & Confirm
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Confirmation Dialog (Old vs New Impact Review) */}
      <Dialog
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        title="Confirm Fare Setting Change"
        description="Verify the proposed change before writing to the database."
        className="sm:max-w-md"
      >
        {currentConfig && currentSetting && (
          <div className="space-y-4">
            <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="font-semibold">Live Customer Calculation Impact</span>
              </div>
              <p className="mt-1 text-[11px] opacity-90">{currentConfig.impact}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded border border-hairline bg-surface-2 p-3">
                <p className="text-[11px] font-medium text-ink-faint">Current Value</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">
                  {currentSetting.value} {currentConfig.unit}
                </p>
              </div>
              <div className="rounded border border-gold-border bg-gold-soft p-3">
                <p className="text-[11px] font-medium text-gold-text">New Value</p>
                <p className="mt-1 font-display text-xl font-bold text-gold-text">
                  {editValue} {currentConfig.unit}
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
                {saving ? "Updating Setting…" : "Yes, Apply Change"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
