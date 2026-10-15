import { useEffect, useState } from "react";
import { Car, Plane, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import {
  LocalPackageList,
  LocalPackageFormDialog,
  EMPTY_LOCAL_PACKAGE,
  fetchAdminLocalPackages,
  createAdminLocalPackage,
  updateAdminLocalPackage,
  publishAdminLocalPackage,
  archiveAdminLocalPackage,
  deleteAdminLocalPackage,
  checkLocalPackageCode,
  type LocalPackageFormState,
  type LocalPackageItem,
} from "@/modules/local-packages";
import {
  TransferRouteList,
  TransferRouteFormDialog,
  EMPTY_TRANSFER_ROUTE,
  fetchAdminTransferRoutes,
  createAdminTransferRoute,
  updateAdminTransferRoute,
  publishAdminTransferRoute,
  archiveAdminTransferRoute,
  deleteAdminTransferRoute,
  checkTransferRouteCode,
  type TransferRouteFormState,
  type TransferRouteItem,
} from "@/modules/transfer-routes";
import { can, type AdminUser, type CatalogStatus } from "@/lib/types";

export function LocalTransfersPage({ user }: { user: AdminUser }) {
  const [activeTab, setActiveTab] = useState<"local" | "transfer">("local");
  const [localItems, setLocalItems] = useState<LocalPackageItem[]>([]);
  const [transferItems, setTransferItems] = useState<TransferRouteItem[]>([]);
  const [status, setStatus] = useState<CatalogStatus | "all">("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local Modal
  const [localModalOpen, setLocalModalOpen] = useState(false);
  const [editingLocal, setEditingLocal] = useState<LocalPackageItem | null>(null);
  const [localForm, setLocalForm] = useState<LocalPackageFormState>(EMPTY_LOCAL_PACKAGE);

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<TransferRouteItem | null>(null);
  const [transferForm, setTransferForm] = useState<TransferRouteFormState>(EMPTY_TRANSFER_ROUTE);

  const loadData = () => {
    setLoading(true);
    setError(null);
    if (activeTab === "local") {
      fetchAdminLocalPackages({ status, q })
        .then(setLocalItems)
        .catch((e) => setError(e?.message || "Failed to load local packages."))
        .finally(() => setLoading(false));
    } else {
      fetchAdminTransferRoutes({ status, q })
        .then(setTransferItems)
        .catch((e) => setError(e?.message || "Failed to load transfer routes."))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeTab, status, q]);

  // Local Handlers
  function openCreateLocal() {
    setEditingLocal(null);
    setLocalForm(EMPTY_LOCAL_PACKAGE);
    setLocalModalOpen(true);
  }

  function openEditLocal(item: LocalPackageItem) {
    setEditingLocal(item);
    setLocalForm({
      name: item.name,
      packageCode: item.packageCode,
      durationHours: item.durationHours,
      includedKm: item.includedKm,
      covers: item.covers,
      parkingNote: item.parkingNote ?? "",
      fleetPrices: item.fleetPrices ? { ...item.fleetPrices } : {},
      usePerKm: item.usePerKm,
      extraRates: item.extraRates ? { ...item.extraRates } : {},
      nightChargeInr: item.nightChargeInr ?? 0,
      status: item.status,
      isActive: item.isActive,
    });
    setLocalModalOpen(true);
  }

  async function handleSaveLocal() {
    if (!localForm.name.trim()) return alert("Name is required.");
    const code = localForm.packageCode.trim();
    if (!code) return alert("Code is required.");

    setBusy(true);
    try {
      if (!editingLocal || editingLocal.packageCode !== code) {
        const { available } = await checkLocalPackageCode(code);
        if (!available) {
          alert(`Package code "${code}" is already taken.`);
          setBusy(false);
          return;
        }
      }

      const payload = {
        name: localForm.name.trim(),
        package_code: code,
        duration_hours: localForm.durationHours,
        included_km: localForm.includedKm,
        covers: localForm.covers.trim(),
        parking_note: localForm.parkingNote.trim() || undefined,
        fleet_prices: localForm.fleetPrices,
        extra_rates: localForm.extraRates,
        night_charge_inr: localForm.nightChargeInr ?? 0,
      };

      if (editingLocal) {
        await updateAdminLocalPackage(editingLocal.id, payload);
      } else {
        await createAdminLocalPackage(payload);
      }
      setLocalModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to save local package.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublishLocal(id: string) {
    setBusy(true);
    try {
      await publishAdminLocalPackage(id);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to publish.");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchiveLocal(id: string) {
    if (!confirm("Archive this local package?")) return;
    setBusy(true);
    try {
      await archiveAdminLocalPackage(id);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to archive.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteLocal(item: LocalPackageItem) {
    if (!confirm(`Permanently delete draft "${item.name}"?`)) return;
    setBusy(true);
    try {
      await deleteAdminLocalPackage(item.id);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to delete.");
    } finally {
      setBusy(false);
    }
  }

  // Transfer Handlers
  function openCreateTransfer() {
    setEditingTransfer(null);
    setTransferForm(EMPTY_TRANSFER_ROUTE);
    setTransferModalOpen(true);
  }

  function openEditTransfer(item: TransferRouteItem) {
    setEditingTransfer(item);
    setTransferForm({
      name: item.name,
      routeCode: item.routeCode,
      distanceText: item.distanceText ?? "",
      directionNote: item.directionNote ?? "",
      fleetPrices: item.fleetPrices ? { ...item.fleetPrices } : {},
      usePerKm: item.usePerKm,
      nightChargeInr: item.nightChargeInr ?? 0,
      status: item.status,
      isActive: item.isActive,
    });
    setTransferModalOpen(true);
  }

  async function handleSaveTransfer() {
    if (!transferForm.name.trim()) return alert("Name is required.");
    const code = transferForm.routeCode.trim();
    if (!code) return alert("Route code is required.");

    setBusy(true);
    try {
      if (!editingTransfer || editingTransfer.routeCode !== code) {
        const { available } = await checkTransferRouteCode(code);
        if (!available) {
          alert(`Route code "${code}" is already taken.`);
          setBusy(false);
          return;
        }
      }

      const payload = {
        name: transferForm.name.trim(),
        route_code: code,
        distance_text: transferForm.distanceText.trim(),
        direction_note: transferForm.directionNote.trim(),
        fleet_prices: transferForm.fleetPrices,
        night_charge_inr: transferForm.nightChargeInr ?? 0,
      };

      if (editingTransfer) {
        await updateAdminTransferRoute(editingTransfer.id, payload);
      } else {
        await createAdminTransferRoute(payload);
      }
      setTransferModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to save transfer route.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublishTransfer(id: string) {
    setBusy(true);
    try {
      await publishAdminTransferRoute(id);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to publish.");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchiveTransfer(id: string) {
    if (!confirm("Archive this transfer route?")) return;
    setBusy(true);
    try {
      await archiveAdminTransferRoute(id);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to archive.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTransfer(item: TransferRouteItem) {
    if (!confirm(`Permanently delete draft "${item.name}"?`)) return;
    setBusy(true);
    try {
      await deleteAdminTransferRoute(item.id);
      loadData();
    } catch (e: any) {
      alert(e?.message || "Failed to delete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Commercial Catalog"
        title="Local Sightseeing & Transfers"
        description="Point-to-point transfers and local hourly sightseeing packages with fixed commercial rates across all 5 canonical fleet tiers."
      />

      {/* Tabs */}
      <div className="mb-4 flex border-b border-hairline gap-2">
        <button
          onClick={() => setActiveTab("local")}
          className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "local"
              ? "border-gold text-gold"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Car className="h-4 w-4" /> Local Sightseeing Packages
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "transfer"
              ? "border-gold text-gold"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Plane className="h-4 w-4" /> Airport &amp; Station Transfers
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-auto text-xs"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or code..."
            className="max-w-xs text-xs"
          />
        </div>

        {can(user.role, "catalog:create") && (
          <Button
            variant="gold"
            size="sm"
            onClick={activeTab === "local" ? openCreateLocal : openCreateTransfer}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {activeTab === "local" ? "New Local Package" : "New Transfer Route"}
          </Button>
        )}
      </div>

      {error && <p className="mb-3 text-xs text-error">{error}</p>}

      {activeTab === "local" ? (
        <LocalPackageList
          items={localItems}
          user={user}
          loading={loading}
          busy={busy}
          onOpenEdit={openEditLocal}
          onPublish={handlePublishLocal}
          onArchive={handleArchiveLocal}
          onDelete={handleDeleteLocal}
          error={error}
          onRetry={loadData}
        />
      ) : (
        <TransferRouteList
          items={transferItems}
          user={user}
          loading={loading}
          busy={busy}
          onOpenEdit={openEditTransfer}
          onPublish={handlePublishTransfer}
          onArchive={handleArchiveTransfer}
          onDelete={handleDeleteTransfer}
          error={error}
          onRetry={loadData}
        />
      )}

      {/* Local Package Form Dialog */}
      <LocalPackageFormDialog
        open={localModalOpen}
        onClose={() => setLocalModalOpen(false)}
        form={localForm}
        setForm={setLocalForm}
        onSave={handleSaveLocal}
        editing={editingLocal}
        busy={busy}
      />

      {/* Transfer Route Form Dialog */}
      <TransferRouteFormDialog
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        form={transferForm}
        setForm={setTransferForm}
        onSave={handleSaveTransfer}
        editing={editingTransfer}
        busy={busy}
      />
    </div>
  );
}
export default LocalTransfersPage;
