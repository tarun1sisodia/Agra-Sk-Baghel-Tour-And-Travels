import { useEffect, useState } from "react";
import { AlertCircle, Pencil, Plus, Radio, Tag, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label } from "@/components/ui/Input";
import {
  createAdminPromo,
  deleteAdminPromo,
  fetchAdminPromos,
  updateAdminPromo,
} from "@/lib/api";
import type { AdminUser, PromoCodeItem } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const emptyPromo = {
  code: "",
  discountAmount: 500,
  minTotal: 2000,
  description: "",
  isActive: true,
  maxRedemptions: "" as string | number,
  validFrom: "",
  validTo: "",
  allowGroupVehicles: false,
  isBroadcast: false,
};

export function PromosPage({ user: _user }: { user: AdminUser }) {
  const [items, setItems] = useState<PromoCodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromoCodeItem | null>(null);
  const [form, setForm] = useState(emptyPromo);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromoCodeItem | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminPromos();
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load promo codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const currentBroadcast = items.find((p) => p.isBroadcast && p.id !== editing?.id);

  function openNew() {
    setEditing(null);
    setForm(emptyPromo);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(promo: PromoCodeItem) {
    setEditing(promo);
    setForm({
      code: promo.code,
      discountAmount: promo.discountAmount,
      minTotal: promo.minTotal,
      description: promo.description,
      isActive: promo.isActive,
      maxRedemptions: promo.maxRedemptions ?? "",
      validFrom: promo.validFrom ? promo.validFrom.slice(0, 16) : "",
      validTo: promo.validTo ? promo.validTo.slice(0, 16) : "",
      allowGroupVehicles: promo.allowGroupVehicles,
      isBroadcast: promo.isBroadcast,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    setFormError(null);
    const cleanCode = form.code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      setFormError("Promo code must be at least 3 characters.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Description is required.");
      return;
    }
    if (form.discountAmount <= 0) {
      setFormError("Discount amount must be greater than 0.");
      return;
    }

    const payload = {
      code: cleanCode,
      discountAmount: Number(form.discountAmount),
      minTotal: Number(form.minTotal) || 0,
      description: form.description.trim(),
      isActive: Boolean(form.isActive),
      maxRedemptions: form.maxRedemptions !== "" ? Number(form.maxRedemptions) : null,
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
      validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
      allowGroupVehicles: Boolean(form.allowGroupVehicles),
      isBroadcast: Boolean(form.isBroadcast),
    };

    setBusy(true);
    try {
      if (editing) {
        await updateAdminPromo(editing.id, payload);
      } else {
        await createAdminPromo(payload);
      }
      setModalOpen(false);
      await reload();
    } catch (e: any) {
      setFormError(e.message || "Failed to save promo code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteAdminPromo(deleteTarget.id);
      await reload();
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message || "Failed to delete promo code.");
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commercial Operations"
        title="Promotional Voucher Codes"
        description="Manage universal discount codes, broadcast banners on the booking page, and commercial vehicle permissions."
        actions={
          <Button onClick={openNew} variant="gold">
            <Plus className="mr-1.5 h-4 w-4" /> New Promo Code
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Broadcast Summary Card */}
      <Card className="p-4 bg-surface-2 border-hairline-strong">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">Live Website Broadcast</p>
              {items.find((p) => p.isBroadcast && p.isActive) ? (
                <p className="text-sm font-semibold text-ink">
                  Active code:{" "}
                  <span className="font-mono text-gold font-bold">
                    {items.find((p) => p.isBroadcast && p.isActive)?.code}
                  </span>{" "}
                  ({formatINR(items.find((p) => p.isBroadcast && p.isActive)?.discountAmount ?? 0)} OFF, min order{" "}
                  {formatINR(items.find((p) => p.isBroadcast && p.isActive)?.minTotal ?? 0)})
                </p>
              ) : (
                <p className="text-sm text-ink-soft">No promo code is currently broadcast to customer booking widgets.</p>
              )}
            </div>
          </div>
          <span className="text-xs text-ink-faint">
            Database enforces exactly 0 or 1 live broadcast codes at any time.
          </span>
        </div>
      </Card>

      {/* Promos Table */}
      <Card className="overflow-hidden border border-hairline-strong bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-hairline bg-surface-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Redemptions</th>
                <th className="px-4 py-3">Validity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Broadcast</th>
                <th className="px-4 py-3">Group Vans</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {items.map((promo) => (
                <tr key={promo.id} className="transition-colors hover:bg-surface-2/50">
                  <td className="px-4 py-3 font-mono font-bold text-ink">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-gold" />
                      <span>{promo.code}</span>
                    </div>
                    <span className="text-xs font-normal font-sans text-ink-soft block mt-0.5 max-w-xs truncate">
                      {promo.description}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">
                    {formatINR(promo.discountAmount)}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {formatINR(promo.minTotal)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {promo.redemptionCount} / {promo.maxRedemptions ?? "∞"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-soft">
                    {promo.validFrom || promo.validTo ? (
                      <div>
                        {promo.validFrom && <span>From: {new Date(promo.validFrom).toLocaleDateString()}</span>}
                        {promo.validTo && <span className="block">To: {new Date(promo.validTo).toLocaleDateString()}</span>}
                      </div>
                    ) : (
                      <span className="text-ink-faint">Always valid</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={promo.isActive ? "success" : "neutral"}>
                      {promo.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {promo.isBroadcast ? (
                      <Badge tone="gold" className="gap-1">
                        <Radio className="h-3 w-3" /> Live
                      </Badge>
                    ) : (
                      <span className="text-xs text-ink-faint">Off</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {promo.allowGroupVehicles ? (
                      <Badge tone="teal" className="gap-1">
                        <Users className="h-3 w-3" /> Allowed
                      </Badge>
                    ) : (
                      <span className="text-xs text-ink-faint">Cars Only</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(promo)}
                        disabled={busy}
                        title="Edit code"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => setDeleteTarget(promo)}
                        disabled={busy}
                        title="Delete code"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-sm text-ink-soft">
                    No promotional voucher codes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Editor Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Promo: ${editing.code}` : "New Promo Code"}
        description="Configure discount rules, redemption limits, vehicle allowances, and site-wide broadcast."
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {formError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              {formError}
            </div>
          )}

          {form.isBroadcast && currentBroadcast && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong>Notice:</strong> Code <code>{currentBroadcast.code}</code> is currently broadcast.
                Only one code can be broadcast at a time. The database will reject this change unless you turn broadcast off on <code>{currentBroadcast.code}</code> first.
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Promo Code (Uppercase)</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUMMER500"
              />
            </div>
            <div>
              <Label>Discount Amount (₹)</Label>
              <Input
                type="number"
                min={1}
                value={form.discountAmount}
                onChange={(e) => setForm((p) => ({ ...p, discountAmount: Number(e.target.value) }))}
                placeholder="500"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Minimum Order Total (₹)</Label>
              <Input
                type="number"
                min={0}
                value={form.minTotal}
                onChange={(e) => setForm((p) => ({ ...p, minTotal: Number(e.target.value) }))}
                placeholder="2000"
              />
            </div>
            <div>
              <Label>Max Redemptions (Leave empty for unlimited)</Label>
              <Input
                type="number"
                min={1}
                value={form.maxRedemptions}
                onChange={(e) => setForm((p) => ({ ...p, maxRedemptions: e.target.value }))}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Flat ₹500 off on outstation and local tours"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Valid From (Optional)</Label>
              <Input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))}
              />
            </div>
            <div>
              <Label>Valid To (Optional)</Label>
              <Input
                type="datetime-local"
                value={form.validTo}
                onChange={(e) => setForm((p) => ({ ...p, validTo: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-hairline">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-hairline bg-surface text-gold focus:ring-gold"
              />
              <div>
                <span className="text-sm font-medium text-ink block">Active</span>
                <span className="text-xs text-ink-soft">Allow customers to redeem this code at checkout.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowGroupVehicles}
                onChange={(e) => setForm((p) => ({ ...p, allowGroupVehicles: e.target.checked }))}
                className="h-4 w-4 rounded border-hairline bg-surface text-gold focus:ring-gold"
              />
              <div>
                <span className="text-sm font-medium text-ink block">Allow on Group Commercial Vehicles</span>
                <span className="text-xs text-ink-soft">Opt-in for Tempo Traveller and Force Urbania bookings.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isBroadcast}
                onChange={(e) => setForm((p) => ({ ...p, isBroadcast: e.target.checked }))}
                className="h-4 w-4 rounded border-hairline bg-surface text-gold focus:ring-gold"
              />
              <div>
                <span className="text-sm font-medium text-ink block">Broadcast to Website Booking Widget</span>
                <span className="text-xs text-ink-soft">Feature this code prominently above voucher input on Step 2.</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="gold" onClick={() => void handleSave()} disabled={busy}>
              {busy ? "Saving..." : editing ? "Save Changes" : "Create Code"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete promo code"
        description={
          deleteTarget
            ? `Delete promo code "${deleteTarget.code}"? This action cannot be undone.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()} disabled={busy}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete code
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
