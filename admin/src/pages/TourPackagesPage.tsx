import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  TourPackageList,
  TourPackageFormDialog,
  EMPTY_TOUR_PACKAGE,
  fetchAdminTourPackages,
  createAdminTourPackage,
  updateAdminTourPackage,
  publishAdminTourPackage,
  archiveAdminTourPackage,
  deleteAdminTourPackage,
  checkTourPackageCode,
  resolveTourPackageBaseTierCode,
  type CatalogStatus,
  type TourPackageFormState,
  type TourPackageItem,
} from "@/modules/tour-packages";
import type { AdminUser } from "@/lib/types";

export function TourPackagesPage({ user }: { user: AdminUser }) {
  const [items, setItems] = useState<TourPackageItem[]>([]);
  const [status, setStatus] = useState<CatalogStatus | "all">("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TourPackageItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TourPackageItem | null>(null);
  const [form, setForm] = useState<TourPackageFormState>(EMPTY_TOUR_PACKAGE);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    fetchAdminTourPackages({ status, q })
      .then((data) => {
        setItems(data);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err?.message || "Failed to load tour packages.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [status, q]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_TOUR_PACKAGE);
    setModalOpen(true);
  }

  function openEdit(pkg: TourPackageItem) {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      packageCode: pkg.packageCode,
      durationText: pkg.durationText,
      days: pkg.days,
      nights: pkg.nights,
      baseTierCode: resolveTourPackageBaseTierCode(pkg.baseTierCode),
      startingPriceInr: pkg.startingPriceInr,
      fleetPrices: pkg.fleetPrices ? { ...pkg.fleetPrices } : {},
      nightChargeInr: pkg.nightChargeInr ?? 0,
      source: pkg.source ?? "Agra",
      destination: pkg.destination ?? "",
      inclusions: Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0 ? [...pkg.inclusions] : [...EMPTY_TOUR_PACKAGE.inclusions],
      exclusions: Array.isArray(pkg.exclusions) && pkg.exclusions.length > 0 ? [...pkg.exclusions] : [...EMPTY_TOUR_PACKAGE.exclusions],
      inclusionsHighlight: pkg.inclusionsHighlight ?? "",
      inclusionsNote: pkg.inclusionsNote ?? "",
      imageUrl: pkg.imageUrl ?? "/assets/packages/taj-dawn.webp",
      gallery: Array.isArray(pkg.gallery) ? [...pkg.gallery] : [],
      status: pkg.status,
      isActive: pkg.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return alert("Package name is required.");
    const code = form.packageCode.trim();
    if (!code) return alert("Package code is required.");

    setBusy(true);
    try {
      if (!editing || editing.packageCode !== code) {
        const { available } = await checkTourPackageCode(code);
        if (!available) {
          alert(`Package code "${code}" is already taken.`);
          setBusy(false);
          return;
        }
      }

      const payload = {
        name: form.name.trim(),
        package_code: code,
        duration_text: form.durationText.trim(),
        days: form.days,
        nights: form.nights,
        base_tier_code: form.baseTierCode,
        starting_price_inr: form.startingPriceInr,
        fleet_prices: form.fleetPrices,
        night_charge_inr: form.nightChargeInr ?? 0,
        source: form.source.trim() || "Agra",
        destination: form.destination.trim() || "",
        inclusions: form.inclusions,
        exclusions: form.exclusions,
        inclusions_highlight: form.inclusionsHighlight.trim(),
        inclusions_note: form.inclusionsNote.trim() || undefined,
        image_url: form.imageUrl.trim() || "/assets/packages/taj-dawn.webp",
        gallery: form.gallery,
      };

      if (editing) {
        await updateAdminTourPackage(editing.id, payload);
      } else {
        await createAdminTourPackage(payload);
      }

      setModalOpen(false);
      load();
    } catch (err: any) {
      alert(err?.message || "Failed to save tour package.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish(id: string) {
    setBusy(true);
    try {
      await publishAdminTourPackage(id);
      load();
    } catch (err: any) {
      alert(err?.message || "Failed to publish package.");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive(id: string) {
    if (!confirm("Are you sure you want to archive this package?")) return;
    setBusy(true);
    try {
      await archiveAdminTourPackage(id);
      load();
    } catch (err: any) {
      alert(err?.message || "Failed to archive package.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(pkg: TourPackageItem) {
    setBusy(true);
    try {
      await deleteAdminTourPackage(pkg.id);
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      alert(err?.message || "Failed to delete package draft.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Commercial Catalog"
        title="Tour Packages"
        description="Comprehensive tour packages across Delhi, Agra, Mathura, and Rajasthan with guaranteed 5-fleet pricing and ASI guides."
      />

      <TourPackageList
        items={items}
        user={user}
        loading={loading}
        busy={busy}
        status={status}
        onStatusChange={setStatus}
        searchQuery={q}
        onSearchChange={setQ}
        onOpenCreate={openCreate}
        onOpenEdit={openEdit}
        onPublish={handlePublish}
        onArchive={handleArchive}
        onDelete={setDeleteTarget}
        error={loadError}
        onRetry={load}
      />

      <TourPackageFormDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        editing={editing}
        busy={busy}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Draft Tour Package?"
        description="This will permanently delete the draft tour package. This action cannot be undone."
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteTarget && handleDelete(deleteTarget)}
            disabled={busy}
          >
            {busy ? "Deleting..." : "Delete Permanently"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
export default TourPackagesPage;
