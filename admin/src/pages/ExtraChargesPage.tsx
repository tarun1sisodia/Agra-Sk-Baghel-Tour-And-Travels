import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Edit3,
  FileText,
  Filter,
  Plus,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, NumberInput } from "@/components/ui/Input";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import {
  fetchExtraCharges,
  createExtraCharge,
  patchExtraCharge,
  type CleanExtraCharge,
} from "@/services/cleanAdminApi";
import type { CategoryCode, VehicleGroupCode } from "@/contracts/fare-system";
import type { AdminUser } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

const CATEGORIES: { code: CategoryCode; label: string }[] = [
  { code: "outstation", label: "Outstation Cabs" },
  { code: "local_package", label: "Local Packages" },
  { code: "transfer", label: "Transfers" },
  { code: "tour_package", label: "Tour Packages" },
];

const VEHICLE_GROUPS: { code: VehicleGroupCode; label: string }[] = [
  { code: "sedan", label: "Sedan" },
  { code: "suv", label: "SUV" },
  { code: "luxury", label: "Luxury" },
  { code: "tempo_traveller", label: "Tempo Traveller" },
];

export function ExtraChargesPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const canEdit = user.role === "super_admin";

  const [charges, setCharges] = useState<CleanExtraCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<CategoryCode | "all">("all");

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<{
    category: CategoryCode;
    vehicle_group_code?: VehicleGroupCode;
    label: string;
    isAmount: boolean;
    amount: number;
  }>({
    category: "outstation",
    label: "",
    isAmount: true,
    amount: 150,
  });

  // Edit Modal State
  const [editingCharge, setEditingCharge] = useState<CleanExtraCharge | null>(null);
  const [editForm, setEditForm] = useState<{
    label: string;
    isAmount: boolean;
    amount: number;
    is_active: boolean;
  }>({
    label: "",
    isAmount: true,
    amount: 0,
    is_active: true,
  });

  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchExtraCharges();
      setCharges(data);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load extra charges.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reloadKey]);

  // Handle Add Submit
  const handleOpenAdd = () => {
    setAddForm({
      category: "outstation",
      vehicle_group_code: undefined,
      label: "",
      isAmount: true,
      amount: 150,
    });
    setSaveError(null);
    setSaveSuccess(null);
    setIsAddOpen(true);
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.label.trim()) {
      setSaveError("Charge label is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await createExtraCharge({
        category: addForm.category,
        vehicle_group_code: addForm.vehicle_group_code,
        label: addForm.label.trim(),
        amount: addForm.isAmount ? Number(addForm.amount) : undefined,
      });
      setSaveSuccess(`Extra charge "${addForm.label}" created successfully!`);
      setIsAddOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setSaveError(err.message || "Failed to create extra charge.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit Submit
  const handleOpenEdit = (charge: CleanExtraCharge) => {
    setEditingCharge(charge);
    setEditForm({
      label: charge.label,
      isAmount: charge.amount !== null && charge.amount > 0,
      amount: charge.amount ?? 0,
      is_active: charge.is_active,
    });
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handlePromptEditConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.label.trim()) {
      setSaveError("Charge label cannot be blank.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmEditSave = async () => {
    if (!editingCharge) return;
    setSaving(true);
    setSaveError(null);
    try {
      await patchExtraCharge(editingCharge.id, {
        label: editForm.label.trim(),
        amount: editForm.isAmount ? Number(editForm.amount) : null,
        is_active: editForm.is_active,
      });
      setSaveSuccess(`Extra charge "${editForm.label}" updated successfully!`);
      setConfirmOpen(false);
      setEditingCharge(null);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update extra charge.");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const filteredCharges = charges.filter(
    (c) => selectedCategory === "all" || c.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commercial Matrix"
        title="Extra Charges & Policy Notes"
        description="Configure line-item surcharge line items and policy disclaimer notes scoped by vertical category or vehicle group. Server-authoritative."
        actions={
          <div className="flex items-center gap-2.5">
            <Badge tone="teal">
              <ShieldCheck className="h-3.5 w-3.5" /> Quote Integrated
            </Badge>
            {canEdit && (
              <Button variant="gold" size="sm" onClick={handleOpenAdd}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New Charge or Note
              </Button>
            )}
          </div>
        }
      />

      {loading && (
        <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
          Loading extra charges from database…
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
        <>
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft mr-2">
              <Filter className="h-3.5 w-3.5" /> Scope:
            </span>
            <Button
              variant={selectedCategory === "all" ? "gold" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="text-xs"
            >
              All Categories ({charges.length})
            </Button>
            {CATEGORIES.map((cat) => {
              const count = charges.filter((c) => c.category === cat.code).length;
              return (
                <Button
                  key={cat.code}
                  variant={selectedCategory === cat.code ? "gold" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.code)}
                  className="text-xs"
                >
                  {cat.label} ({count})
                </Button>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Configured Extra Charges & Disclaimers ({filteredCharges.length})</CardTitle>
                <CardDescription>
                  Line items with an amount appear in <code className="font-mono text-xs">quote.lines</code>. Notes with no amount appear in <code className="font-mono text-xs">quote.messages</code>.
                </CardDescription>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TRow>
                    <TH>Type & Label</TH>
                    <TH>Category Scope</TH>
                    <TH>Vehicle Scope</TH>
                    <TH className="text-right">Amount (₹)</TH>
                    <TH className="text-center">Status</TH>
                    {canEdit && <TH className="text-right">Action</TH>}
                  </TRow>
                </THead>
                <TBody>
                  {filteredCharges.length === 0 ? (
                    <TRow>
                      <TD colSpan={6} className="py-8 text-center text-sm text-ink-soft">
                        No extra charges configured for this category scope.
                      </TD>
                    </TRow>
                  ) : (
                    filteredCharges.map((c, i) => {
                      const isLineItem = c.amount !== null && c.amount > 0;
                      return (
                        <motion.tr
                          key={c.id}
                          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 + i * 0.02, duration: 0.25 }}
                          className={cn(
                            "transition-colors hover:bg-gold-wash/50",
                            !c.is_active && "opacity-50"
                          )}
                        >
                          <TD>
                            <div className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm",
                                  isLineItem
                                    ? "bg-gold-soft text-gold-text"
                                    : "bg-surface-2 text-ink-soft"
                                )}
                              >
                                {isLineItem ? (
                                  <DollarSign className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                              </span>
                              <div>
                                <p className="font-semibold text-ink">{c.label}</p>
                                <p className="font-mono text-[10px] uppercase text-ink-faint">
                                  {isLineItem ? "Billed Line Item" : "Policy Note Only"}
                                </p>
                              </div>
                            </div>
                          </TD>
                          <TD>
                            <Badge tone="gold">
                              {CATEGORIES.find((cat) => cat.code === c.category)?.label || c.category}
                            </Badge>
                          </TD>
                          <TD>
                            {c.group_code ? (
                              <Badge tone="neutral">{c.group_code}</Badge>
                            ) : (
                              <span className="text-xs text-ink-faint">All Vehicles</span>
                            )}
                          </TD>
                          <TD className="text-right">
                            {isLineItem ? (
                              <span className="font-display text-sm font-semibold text-gold-text">
                                {formatINR(c.amount!)}
                              </span>
                            ) : (
                              <span className="text-xs text-ink-faint">—</span>
                            )}
                          </TD>
                          <TD className="text-center">
                            <Badge tone={c.is_active ? "success" : "neutral"}>
                              {c.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TD>
                          {canEdit && (
                            <TD className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleOpenEdit(c)}
                              >
                                <Edit3 className="mr-1 h-3 w-3" /> Edit
                              </Button>
                            </TD>
                          )}
                        </motion.tr>
                      );
                    })
                  )}
                </TBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {/* Create Modal */}
      <Dialog
        open={isAddOpen}
        onClose={() => !saving && setIsAddOpen(false)}
        title="Create Extra Charge or Policy Note"
        description="Add a line-item fee or a disclaimer message displayed during booking quotes."
        className="sm:max-w-md"
      >
        <form onSubmit={handleCreateCharge} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Category Scope</label>
            <select
              className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-gold"
              value={addForm.category}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, category: e.target.value as CategoryCode }))
              }
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Vehicle Group Scope (Optional)
            </label>
            <select
              className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-gold"
              value={addForm.vehicle_group_code || ""}
              onChange={(e) =>
                setAddForm((f) => ({
                  ...f,
                  vehicle_group_code: e.target.value
                    ? (e.target.value as VehicleGroupCode)
                    : undefined,
                }))
              }
            >
              <option value="">All Vehicles</option>
              {VEHICLE_GROUPS.map((g) => (
                <option key={g.code} value={g.code}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Charge / Note Label</label>
            <Input
              placeholder="e.g. State Border Tax or Night Parking Charge"
              value={addForm.label}
              required
              onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>

          <div className="rounded-md border border-hairline bg-surface-2 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Type</span>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="addType"
                    checked={addForm.isAmount}
                    onChange={() => setAddForm((f) => ({ ...f, isAmount: true }))}
                    className="accent-gold"
                  />
                  <span>Billed Amount</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="addType"
                    checked={!addForm.isAmount}
                    onChange={() => setAddForm((f) => ({ ...f, isAmount: false }))}
                    className="accent-gold"
                  />
                  <span>Policy Note</span>
                </label>
              </div>
            </div>

            {addForm.isAmount && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Amount (₹)</label>
                <NumberInput
                  min={1}
                  max={50000}
                  required
                  value={addForm.amount}
                  onChange={(val) => setAddForm((f) => ({ ...f, amount: val }))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-rule">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={saving}>
              {saving ? "Creating…" : "Create Charge"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={Boolean(editingCharge && !confirmOpen)}
        onClose={() => setEditingCharge(null)}
        title="Edit Extra Charge"
        description={`Update settings for "${editingCharge?.label}".`}
        className="sm:max-w-md"
      >
        {editingCharge && (
          <form onSubmit={handlePromptEditConfirm} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Charge Label</label>
              <Input
                value={editForm.label}
                required
                onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
              />
            </div>

            <div className="rounded-md border border-hairline bg-surface-2 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Type</span>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="editType"
                      checked={editForm.isAmount}
                      onChange={() => setEditForm((f) => ({ ...f, isAmount: true }))}
                      className="accent-gold"
                    />
                    <span>Billed Amount</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="editType"
                      checked={!editForm.isAmount}
                      onChange={() => setEditForm((f) => ({ ...f, isAmount: false }))}
                      className="accent-gold"
                    />
                    <span>Policy Note</span>
                  </label>
                </div>
              </div>

              {editForm.isAmount && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Amount (₹)</label>
                  <NumberInput
                    min={1}
                    max={50000}
                    required
                    value={editForm.amount}
                    onChange={(val) => setEditForm((f) => ({ ...f, amount: val }))}
                  />
                </div>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink">
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 accent-gold"
              />
              <span>Active on customer site</span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-rule">
              <Button type="button" variant="outline" onClick={() => setEditingCharge(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold">
                Review & Confirm
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        title="Confirm Extra Charge Modification"
        description="Verify details before writing to the database."
        className="sm:max-w-md"
      >
        {editingCharge && (
          <div className="space-y-4">
            <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="font-semibold">Live Quote Impact</span>
              </div>
              <p className="mt-1 text-[11px] opacity-90">
                Updating this extra charge will affect the line items and totals of new quotes in the {editingCharge.category} category.
              </p>
            </div>

            <div className="rounded border border-hairline bg-surface-2 p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-soft">Label:</span>
                <span className="font-semibold text-ink">{editForm.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Billing:</span>
                <span className="font-mono font-semibold text-ink">
                  {editForm.isAmount ? formatINR(editForm.amount) : "Policy Note Only"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Status:</span>
                <span className="font-semibold text-ink">
                  {editForm.is_active ? "Active" : "Inactive"}
                </span>
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
                onClick={handleConfirmEditSave}
              >
                {saving ? "Saving…" : "Yes, Apply Changes"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
