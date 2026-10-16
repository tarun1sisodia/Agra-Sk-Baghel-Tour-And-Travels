import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  Globe,
  ImageIcon,
  ImagePlus,
  Loader2,
  MapPin,
  PenSquare,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  Search,
  Star,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Select } from "@/components/ui/Input";
import {
  attachCatalogMediaByPath,
  createAdminCatalogItem,
  deleteCatalogMedia,
  fetchAdminCatalog,
  fetchAdminCatalogItem,
  fetchCatalogManifestStatus,
  republishCatalogManifest,
  resolveMediaSrc,
  setCatalogItemStatus,
  updateAdminCatalogItem,
  updateCatalogMedia,
  uploadCatalogMedia,
} from "@/lib/api";
import {
  can,
  CATALOG_MEDIA_LIMITS,
  type AdminUser,
  type CatalogAvailability,
  type CatalogCategory,
  type CatalogItem,
  type CatalogMedia,
  type CatalogStatus,
  type CatalogTripType,
} from "@/lib/types";
import { cn, formatDate, formatINR } from "@/lib/utils";

const CATEGORY_TONE: Record<CatalogCategory, "neutral" | "teal" | "gold"> = {
  ride: "neutral",
  tour: "teal",
  package: "gold",
  route: "teal",
  vehicle: "neutral",
  place: "teal",
};

const CATEGORY_LABEL: Record<CatalogCategory, string> = {
  package: "Package (Heritage & Circuit Tour)",
  tour: "Tour (Local Sightseeing)",
  route: "Route (Outstation Drop/Round)",
  ride: "Ride (Airport / City Transfer)",
  vehicle: "Vehicle (Fleet Spec)",
  place: "Famous Place & Monument (multi-image gallery)",
};

const GENERAL_CATALOG_CATEGORIES: CatalogCategory[] = ["place", "vehicle"];

const TRIP_TYPE_OPTIONS: { value: CatalogTripType; label: string }[] = [
  { value: "local-tour", label: "Local tour / sightseeing" },
  { value: "one-way", label: "One-way outstation drop" },
  { value: "round-trip", label: "Round-trip outstation" },
  { value: "airport-transfer", label: "Airport / station transfer" },
];

function tripTypeOptionsFor(category: CatalogCategory): { value: CatalogTripType; label: string }[] {
  switch (category) {
    case "package":
      return TRIP_TYPE_OPTIONS.filter((option) => option.value === "local-tour" || option.value === "round-trip");
    case "tour":
      return TRIP_TYPE_OPTIONS.filter((option) => option.value === "local-tour");
    case "route":
      return TRIP_TYPE_OPTIONS.filter((option) => option.value === "one-way" || option.value === "round-trip");
    case "ride":
      return TRIP_TYPE_OPTIONS.filter((option) => option.value === "airport-transfer" || option.value === "local-tour");
    case "vehicle":
    case "place":
      return [];
  }
}

function defaultTripTypeFor(category: CatalogCategory): CatalogTripType | "" {
  return tripTypeOptionsFor(category)[0]?.value ?? "";
}

const AVAILABILITY_OPTIONS: { value: CatalogAvailability; label: string }[] = [
  { value: "available", label: "Available — bookable normally" },
  { value: "limited", label: "Limited — only a few seats left" },
  { value: "unavailable", label: "Unavailable / paused" },
];

const TYPE_FILTERS: { value: CatalogCategory | "all"; label: string }[] = [
  { value: "all", label: "All verticals" },
  { value: "package", label: "Packages" },
  { value: "tour", label: "Tours" },
  { value: "route", label: "Routes" },
  { value: "ride", label: "Rides" },
  { value: "vehicle", label: "Vehicles" },
  { value: "place", label: "Places" },
];

const MAX_UPLOAD_BYTES = 2_500_000;
const ACCEPTED_MIME = ["image/webp", "image/jpeg", "image/png", "image/avif"] as const;

type UploadMode = "file" | "path";

/**
 * An image chosen while creating a brand-new item. There's no catalog item
 * id yet to attach it to, so it's held here and uploaded automatically the
 * moment the item is created — the operator never has to re-open the item
 * in edit mode just to add its first photo.
 */
type StagedMedia =
  | { kind: "file"; file: File; previewUrl: string; altText: string; caption?: string }
  | { kind: "path"; path: string; altText: string; caption?: string };

export function CatalogPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Manifest status & republish state (site data regeneration control)
  const [manifestStatus, setManifestStatus] = useState<{ version: number; updatedAt: string; routeCount?: number; packageCount?: number } | null>(null);
  const [isRepublishing, setIsRepublishing] = useState(false);
  const [republishSuccess, setRepublishSuccess] = useState<string | null>(null);

  // List filters (mobile-friendly chips + search)
  const [statusFilter, setStatusFilter] = useState<CatalogStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CatalogCategory | "all">("all");
  const [search, setSearch] = useState("");

  // Dialog state for New / Edit Item
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Media manager state
  const [media, setMedia] = useState<CatalogMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [uploadPath, setUploadPath] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [busyMediaId, setBusyMediaId] = useState<string | null>(null);
  const [stagedMedia, setStagedMedia] = useState<StagedMedia | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<CatalogCategory>("package");
  const [formSummary, setFormSummary] = useState("");
  const [formDuration, setFormDuration] = useState("8 hrs / 80 km");
  const [formPrice, setFormPrice] = useState<number>(1900);
  const [formDistance, setFormDistance] = useState<string>("");
  const [formAvailability, setFormAvailability] = useState<CatalogAvailability>("available");
  const [formSeatsLeft, setFormSeatsLeft] = useState<string>("");
  const [formTripType, setFormTripType] = useState<string>("local-tour");
  const [formPlaces, setFormPlaces] = useState("Taj Mahal, Agra Fort");
  const [formStops, setFormStops] = useState("");
  const [formStatus, setFormStatus] = useState<CatalogStatus>("draft");

  const canEdit = can(user.role, "catalog:edit");
  const canPublish = can(user.role, "catalog:publish");

  useEffect(() => {
    let isMounted = true;
    setLoadError(null);
    fetchAdminCatalog({ status: statusFilter, type: typeFilter, q: search })
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch((err) => {
        if (isMounted) {
          setItems([]);
          setLoadError(err instanceof Error ? err.message : "Could not load catalog items from the backend.");
        }
      });

    fetchCatalogManifestStatus()
      .then((status) => {
        if (isMounted) setManifestStatus(status);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [reloadKey, statusFilter, typeFilter, search]);

  // Regenerate the public site manifest (routes + published packages) on demand.
  async function handleRepublish() {
    setIsRepublishing(true);
    setActionError(null);
    setRepublishSuccess(null);
    try {
      const res = await republishCatalogManifest();
      setManifestStatus(res);
      setRepublishSuccess(`Site data regenerated (Manifest v${res.version}, ${res.routeCount} routes, ${res.packageCount} packages published).`);
    } catch (err) {
      setActionError(`Could not republish site data: ${err instanceof Error ? err.message : "Backend error"}`);
    } finally {
      setIsRepublishing(false);
    }
  }

  const mediaLimit = CATALOG_MEDIA_LIMITS[formCategory];
  const activeMedia = media.filter((m) => m.status !== "archived");
  const stagedCount = stagedMedia ? 1 : 0;
  // Pre-creation there's only one staged slot (the cover) — additional
  // gallery images are added once the item exists, right after "Create Item".
  const mediaAtLimit = editingItem ? activeMedia.length + stagedCount >= mediaLimit : stagedCount >= 1;
  const isMultiImageGallery = formCategory === "place" || formCategory === "package" || formCategory === "tour";

  function clearStagedMedia() {
    setStagedMedia((prev) => {
      if (prev?.kind === "file") URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }

  const loadMedia = useCallback(async (itemId: string) => {
    setMediaLoading(true);
    setMediaError(null);
    try {
      const detail = await fetchAdminCatalogItem(itemId);
      setMedia(detail.media);
      setEditingItem((prev) => (prev && prev.id === itemId ? detail.item : prev));
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : "Could not load images for this item.");
    } finally {
      setMediaLoading(false);
    }
  }, []);

  function resetForm() {
    setFormTitle("");
    setFormSlug("");
    setFormCategory("place");
    setFormSummary("");
    setFormDuration("");
    setFormPrice(1000);
    setFormDistance("");
    setFormAvailability("available");
    setFormSeatsLeft("");
    setFormTripType("");
    setFormPlaces("");
    setFormStops("");
    setFormStatus("draft");
    setFormError(null);
    setMedia([]);
    clearStagedMedia();
    setUploadMode("file");
    setUploadPath("");
    setUploadAlt("");
    setUploadCaption("");
    setMediaError(null);
  }

  function openCreate() {
    setEditingItem(null);
    resetForm();
    setIsDialogOpen(true);
  }

  function handleFormCategoryChange(category: CatalogCategory) {
    setFormCategory(category);
    const options = tripTypeOptionsFor(category);
    if (!options.some((option) => option.value === formTripType)) {
      setFormTripType(defaultTripTypeFor(category));
    }
  }

  function openEdit(item: CatalogItem) {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormSlug(item.slug);
    setFormCategory(item.category);
    setFormSummary(item.summary);
    setFormDuration(item.duration || "8 hrs / 80 km");
    setFormPrice(item.startingPrice);
    setFormDistance(item.distanceKm !== null && item.distanceKm !== undefined ? String(item.distanceKm) : "");
    setFormAvailability(item.availability || "available");
    setFormSeatsLeft(item.seatsLeft !== null && item.seatsLeft !== undefined ? String(item.seatsLeft) : "");
    const editTripTypeOptions = tripTypeOptionsFor(item.category);
    setFormTripType(
      item.tripType && editTripTypeOptions.some((option) => option.value === item.tripType)
        ? item.tripType
        : defaultTripTypeFor(item.category),
    );
    setFormPlaces(item.places.join(", "));
    setFormStops(item.stops.join(", "));
    setFormStatus(item.status);
    setFormError(null);
    setMedia([]);
    setUploadMode("file");
    setUploadPath("");
    setUploadAlt("");
    setUploadCaption("");
    setMediaError(null);
    setIsDialogOpen(true);
    void loadMedia(item.id);
  }

  async function handleSaveItem(e: FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return setFormError("Title is required.");
    const slug = formSlug.trim() || formTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (slug.length < 2) return setFormError("Valid slug is required.");
    if (formPrice <= 0) return setFormError("Starting price must be greater than zero.");
    if (formAvailability === "limited" && formSeatsLeft.trim() && Number(formSeatsLeft) <= 0) {
      return setFormError("Seats left must be a positive number when availability is limited.");
    }

    const distanceKm = formDistance.trim() ? Number(formDistance) : null;
    if (distanceKm !== null && (Number.isNaN(distanceKm) || distanceKm < 0)) {
      return setFormError("Distance must be a non-negative number of kilometres.");
    }
    const seatsLeft = formSeatsLeft.trim() ? Number(formSeatsLeft) : null;
    const stops = formStops
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);
    const tripType = formTripType ? (formTripType as CatalogTripType) : null;

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        const updated = await updateAdminCatalogItem(editingItem.id, {
          title: formTitle.trim(),
          slug,
          type: formCategory,
          shortDescription: formSummary.trim() || formTitle.trim(),
          durationText: formDuration.trim(),
          startingPriceInr: Number(formPrice),
          routeSummary: formPlaces.trim(),
          distanceKm,
          availability: formAvailability,
          seatsLeft,
          stops,
          tripType,
          status: formStatus,
        });
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItem.id
              ? {
                  ...it,
                  ...updated,
                  title: formTitle.trim(),
                  summary: formSummary.trim(),
                  duration: formDuration.trim(),
                  startingPrice: Number(formPrice),
                  places: formPlaces.split(",").map((s) => s.trim()).filter(Boolean),
                  stops,
                }
              : it,
          ),
        );
      } else {
        const created = await createAdminCatalogItem({
          title: formTitle.trim(),
          slug,
          type: formCategory,
          shortDescription: formSummary.trim() || formTitle.trim(),
          durationText: formDuration.trim(),
          startingPriceInr: Number(formPrice),
          routeSummary: formPlaces.trim(),
          distanceKm,
          availability: formAvailability,
          seatsLeft,
          stops,
          tripType,
        });
        setItems((prev) => [created, ...prev]);
        const staged = stagedMedia;
        setIsDialogOpen(false);
        // Keep the operator in an edit-mode view of the item they just made —
        // no developer, no second trip through the list.
        openEdit(created);
        // The image picked while the "New item" form was still open (if any)
        // uploads automatically now that the item has an id.
        if (staged) {
          void attachStagedMedia(created.id, staged);
        }
        return;
      }
      setIsDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setIsSaving(false);
    }
  }

  async function setStatus(id: string, action: "publish" | "archive" | "unpublish") {
    setActionError(null);
    setBusyId(id);
    try {
      const updated = await setCatalogItemStatus(id, action);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: updated.status } : it)));
    } catch (err) {
      setActionError(`Could not update the item: ${err instanceof Error ? err.message : "backend error"}`);
    } finally {
      setBusyId(null);
    }
  }

  /* ── Media (image) manager ─────────────────────────────────────────────── */

  function handleFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_MIME.includes(file.type as (typeof ACCEPTED_MIME)[number])) {
      setMediaError("Only WebP, JPEG, PNG or AVIF images are accepted.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setMediaError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 2.5 MB.`);
      e.target.value = "";
      return;
    }
    if (!uploadAlt.trim()) {
      setUploadAlt(file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 120));
    }
    setMediaError(null);
  }

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? "");
        resolve(result.slice(result.indexOf(",") + 1));
      };
      reader.onerror = () => reject(new Error("Could not read the selected file."));
      reader.readAsDataURL(file);
    });
  }

  /** Uploads a staged (pre-item-creation) image right after the item is created. */
  async function attachStagedMedia(itemId: string, staged: StagedMedia) {
    setIsUploading(true);
    setMediaError(null);
    try {
      if (staged.kind === "path") {
        await attachCatalogMediaByPath(itemId, {
          storagePath: staged.path,
          altText: staged.altText,
          caption: staged.caption,
          sortOrder: 0,
        });
      } else {
        const dataBase64 = await readFileAsBase64(staged.file);
        await uploadCatalogMedia(itemId, {
          dataBase64,
          mimeType: staged.file.type as (typeof ACCEPTED_MIME)[number],
          altText: staged.altText,
          caption: staged.caption,
          sortOrder: 0,
        });
      }
      await loadMedia(itemId);
    } catch (err) {
      setMediaError(
        `The item was saved, but the image could not be attached: ${
          err instanceof Error ? err.message : "upload failed"
        }. Try adding it again below.`,
      );
    } finally {
      setIsUploading(false);
      clearStagedMedia();
    }
  }

  async function handleUploadMedia(e: FormEvent) {
    e.preventDefault();
    if (mediaAtLimit) {
      return setMediaError(
        !editingItem
          ? "Only one image can be staged before saving. Remove it, or add the rest after the item is created."
          : isMultiImageGallery
            ? `This gallery is full (${mediaLimit} images). Remove one first.`
            : "This category allows exactly one image. Remove the current cover first.",
      );
    }
    const alt = uploadAlt.trim();
    if (alt.length < 3) return setMediaError("Alt text (3+ characters) is required for accessibility and SEO.");

    // ── Creating a brand-new item: no id exists yet to attach media to, so
    //    stage the choice locally. It's uploaded automatically the moment
    //    "Create Item" below succeeds — no second trip through edit mode.
    if (!editingItem) {
      setMediaError(null);
      try {
        if (uploadMode === "path") {
          const path = uploadPath.trim().replace(/^\/+/, "");
          if (path.length < 3 || path.includes("..") || path.includes("//")) {
            throw new Error("Enter a site asset path without a leading slash (e.g. assets/places/taj-mahal.webp).");
          }
          clearStagedMedia();
          setStagedMedia({ kind: "path", path, altText: alt, caption: uploadCaption.trim() || undefined });
        } else {
          const file = fileInputRef.current?.files?.[0];
          if (!file) throw new Error("Choose an image file to upload.");
          clearStagedMedia();
          setStagedMedia({
            kind: "file",
            file,
            previewUrl: URL.createObjectURL(file),
            altText: alt,
            caption: uploadCaption.trim() || undefined,
          });
        }
        setUploadAlt("");
        setUploadCaption("");
        setUploadPath("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        setMediaError(err instanceof Error ? err.message : "Failed to stage image.");
      }
      return;
    }

    // ── Editing an existing item: upload immediately, as before.
    setIsUploading(true);
    setMediaError(null);
    try {
      if (uploadMode === "path") {
        const path = uploadPath.trim().replace(/^\/+/, "");
        if (path.length < 3 || path.includes("..") || path.includes("//")) {
          throw new Error("Enter a site asset path without a leading slash (e.g. assets/places/taj-mahal.webp).");
        }
        await attachCatalogMediaByPath(editingItem.id, {
          storagePath: path,
          altText: alt,
          caption: uploadCaption.trim() || undefined,
          sortOrder: activeMedia.length,
        });
      } else {
        const file = fileInputRef.current?.files?.[0];
        if (!file) throw new Error("Choose an image file to upload.");
        const dataBase64 = await readFileAsBase64(file);
        await uploadCatalogMedia(editingItem.id, {
          dataBase64,
          mimeType: file.type as (typeof ACCEPTED_MIME)[number],
          altText: alt,
          caption: uploadCaption.trim() || undefined,
          sortOrder: activeMedia.length,
        });
      }
      setUploadAlt("");
      setUploadCaption("");
      setUploadPath("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadMedia(editingItem.id);
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : "Failed to attach image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveMedia(m: CatalogMedia) {
    if (!editingItem) return;
    setBusyMediaId(m.id);
    setMediaError(null);
    try {
      await deleteCatalogMedia(m.id);
      await loadMedia(editingItem.id);
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : "Failed to remove image.");
    } finally {
      setBusyMediaId(null);
    }
  }

  async function handleSetCover(m: CatalogMedia) {
    if (!editingItem) return;
    setBusyMediaId(m.id);
    setMediaError(null);
    try {
      await updateCatalogMedia(m.id, { sortOrder: 0 });
      const others = activeMedia.filter((x) => x.id !== m.id && x.sortOrder === 0);
      await Promise.all(others.map((x, i) => updateCatalogMedia(x.id, { sortOrder: i + 1 })));
      await loadMedia(editingItem.id);
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : "Failed to set cover image.");
    } finally {
      setBusyMediaId(null);
    }
  }

  const counts = {
    draft: items.filter((i) => i.status === "draft").length,
    published: items.filter((i) => i.status === "published").length,
    archived: items.filter((i) => i.status === "archived").length,
  };

  return (
    <div>
      <PageHeader
        eyebrow="CMS"
        title="Catalog CMS"
        description="Rides, tours, packages and famous places. Published items appear on the customer site automatically — one catalog feeds both apps."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRepublish}
              disabled={isRepublishing}
              title={manifestStatus ? `Manifest v${manifestStatus.version} • last published ${formatDate(manifestStatus.updatedAt)}` : "Regenerate public site data"}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRepublishing && "animate-spin")} />
              Republish site data
            </Button>
            {canEdit ? (
              <Button variant="gold" size="sm" shine onClick={openCreate}>
                <Plus className="h-3.5 w-3.5 mr-1" /> New item
              </Button>
            ) : (
              <Badge tone="neutral">Read-only for your role</Badge>
            )}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded px-3 py-1.5 text-sm font-medium bg-ink text-surface">
            General catalog
          </span>
          <Link
            to="/routes"
            className="rounded px-3 py-1.5 text-sm font-medium text-gold hover:bg-gold/10 transition-colors inline-flex items-center gap-1.5"
          >
            <RouteIcon className="h-3.5 w-3.5" /> Intercity Routes →
          </Link>
          <Link
            to="/tour-packages"
            className="rounded px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5"
          >
            <MapPin className="h-3.5 w-3.5" /> Tour Packages →
          </Link>
        </div>
        <span className="text-xs text-ink-soft">
          Dedicated modules active for Routes & Tour Packages
        </span>
      </div>
      {/* Manifest strip + republish feedback */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {manifestStatus
            ? `Public site manifest v${manifestStatus.version} • ${manifestStatus.routeCount ?? 0} routes • ${manifestStatus.packageCount ?? 0} packages • updated ${formatDate(manifestStatus.updatedAt)}`
            : "Public site manifest status unavailable."}
        </span>
        {republishSuccess && <span className="text-emerald-600 dark:text-emerald-400">{republishSuccess}</span>}
      </div>

      {/* Status + vertical filters + search */}
      <div className="mb-4 space-y-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or slug…"
              className="pl-8"
              aria-label="Search catalog items"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "draft", "published", "archived"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setStatusFilter(k)}
                className={cn(
                  "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors",
                  statusFilter === k
                    ? "border-ink bg-ink text-surface"
                    : "border-hairline text-ink-soft hover:border-ink/30 hover:text-ink",
                )}
              >
                {k === "all" ? `all · ${items.length}` : `${k} · ${counts[k]}`}
              </button>
            ))}
          </div>
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                typeFilter === f.value
                  ? "border-gold bg-gold/10 text-ink"
                  : "border-hairline text-ink-soft hover:border-ink/30 hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{loadError}</span>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </Button>
        </div>
      )}
      {actionError && (
        <div
          className="mb-4 flex items-start gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1 leading-snug">{actionError}</span>
          <button onClick={() => setActionError(null)} className="rounded-sm p-0.5 hover:bg-error/10" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {!loadError && items.length === 0 && (
        <Card className="p-12 text-center">
          <p className="font-display text-lg text-ink">No catalog items yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
            Items created here appear on the customer site once published. Click "New item" above to add your first travel package or ride.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <motion.article
            key={item.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Card className="flex h-full flex-col justify-between p-5 transition-shadow hover:shadow-pop">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Badge tone={CATEGORY_TONE[item.category]}>{item.category}</Badge>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.tripType && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
                        <RouteIcon className="h-3 w-3" /> {item.tripType}
                      </span>
                    )}
                    <Badge tone={item.status === "published" ? "success" : item.status === "draft" ? "gold" : "neutral"}>
                      {item.status}
                    </Badge>
                  </div>
                </div>

                <h3 className="mt-3 font-display text-base font-semibold leading-snug tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                  {item.summary}
                </p>

                {item.places.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
                    <MapPin className="h-3 w-3 shrink-0 text-ink-faint" />
                    {item.places.map((place) => (
                      <span key={place} className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">
                        {place}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {item.availability === "limited" && item.seatsLeft !== null && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                      <TrendingDown className="h-3 w-3" /> Only {item.seatsLeft} left
                    </span>
                  )}
                  {item.availability === "unavailable" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-error">
                      <AlertTriangle className="h-3 w-3" /> Paused
                    </span>
                  )}
                  {item.distanceKm !== null && item.distanceKm !== undefined && (
                    <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                      ~{item.distanceKm} km
                    </span>
                  )}
                  {item.stops.length > 0 && (
                    <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                      {item.stops.length} stop{item.stops.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-hairline pt-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
                  <div>
                    <span className="text-ink-soft">From </span>
                    <span className="font-display text-base font-semibold text-ink">
                      {formatINR(item.startingPrice)}
                    </span>
                    {item.duration && (
                      <span className="ml-2 font-mono text-[11px] text-ink-faint">
                        <Clock className="inline h-3 w-3 mr-0.5 text-ink-faint" />
                        {item.duration}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                    upd {formatDate(item.updatedAt)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {canEdit && item.status !== "archived" && (
                    <Button variant="secondary" size="sm" className="min-w-0 flex-1" onClick={() => openEdit(item)}>
                      <PenSquare className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  )}
                  {canPublish && item.status === "draft" && (
                    <Button variant="gold" size="sm" className="min-w-0 flex-1" disabled={busyId === item.id} onClick={() => setStatus(item.id, "publish")}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Publish
                    </Button>
                  )}
                  {canPublish && item.status === "published" && (
                    <>
                      <Button variant="outline" size="sm" className="min-w-0 flex-1" disabled={busyId === item.id} onClick={() => setStatus(item.id, "unpublish")}>
                        Unpublish
                      </Button>
                      <Button variant="outline" size="sm" className="min-w-0 flex-1" disabled={busyId === item.id} onClick={() => setStatus(item.id, "archive")}>
                        <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                      </Button>
                    </>
                  )}
                  {canPublish && item.status === "archived" && (
                    <Button variant="outline" size="sm" className="min-w-0 flex-1" disabled={busyId === item.id} onClick={() => setStatus(item.id, "publish")}>
                      <Globe className="h-3.5 w-3.5 mr-1" /> Restore
                    </Button>
                  )}
                  {!canEdit && (
                    <span className={cn("w-full text-center font-mono text-[10px] uppercase tracking-wide text-ink-faint")}>
                      publish requires super_admin
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </motion.article>
        ))}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => !isSaving && setIsDialogOpen(false)}
        title={editingItem ? `Edit: ${editingItem.title}` : "Create New Catalog Item"}
        description="Name, price, distance, availability, stops and trip type — everything the customer site renders."
        className="sm:max-w-2xl"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-error/20 bg-error-soft p-3 text-xs text-error">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="form-title">Item Title *</Label>
              <Input
                id="form-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Taj Mahal Sunrise Tour"
                required
              />
            </div>
            <div>
              <Label htmlFor="form-slug">URL Slug</Label>
              <Input
                id="form-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g. taj-mahal-sunrise-tour"
                inputMode="url"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="form-cat">Vertical Category</Label>
              <Select
                id="form-cat"
                value={formCategory}
                onChange={(e) => handleFormCategoryChange(e.target.value as CatalogCategory)}
              >
                {GENERAL_CATALOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
                {editingItem && !GENERAL_CATALOG_CATEGORIES.includes(editingItem.category) && (
                  <option value={editingItem.category}>
                    {CATEGORY_LABEL[editingItem.category]} (Archived vertical)
                  </option>
                )}
              </Select>
              <p className="mt-1.5 text-[11px] leading-normal text-ink-soft">
                Packages, tours, transfers and routes are now managed under Tour Packages / Local &amp; Transfers / Catalog &rarr; Routes.
              </p>
            </div>
            <div>
              <Label htmlFor="form-triptype">Trip Type (customer view)</Label>
              <Select
                id="form-triptype"
                value={formTripType}
                onChange={(e) => setFormTripType(e.target.value)}
                disabled={tripTypeOptionsFor(formCategory).length === 0}
              >
                {tripTypeOptionsFor(formCategory).length === 0 && <option value="">Not applicable to this vertical</option>}
                {tripTypeOptionsFor(formCategory).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="form-price">Starting Fare (INR) *</Label>
              <Input
                id="form-price"
                type="number"
                min="1"
                inputMode="numeric"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="form-distance">Distance (km)</Label>
              <Input
                id="form-distance"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={formDistance}
                onChange={(e) => setFormDistance(e.target.value)}
                placeholder="e.g. 230"
              />
            </div>
            <div>
              <Label htmlFor="form-dur">Duration Text</Label>
              <Input
                id="form-dur"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="8 hrs / 80 km"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="form-avail">Availability</Label>
              <Select
                id="form-avail"
                value={formAvailability}
                onChange={(e) => setFormAvailability(e.target.value as CatalogAvailability)}
              >
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="form-seats">Seats / Vehicles Left {formAvailability === "limited" ? "*" : "(when limited)"}</Label>
              <Input
                id="form-seats"
                type="number"
                min="1"
                inputMode="numeric"
                value={formSeatsLeft}
                onChange={(e) => setFormSeatsLeft(e.target.value)}
                placeholder="e.g. 2"
                disabled={formAvailability !== "limited"}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="form-summary">Summary Description *</Label>
            <Input
              id="form-summary"
              value={formSummary}
              onChange={(e) => setFormSummary(e.target.value)}
              placeholder="Short 1-2 sentence overview shown in cards and search"
            />
          </div>

          <div>
            <Label htmlFor="form-places">Key Places / Route Summary (comma-separated)</Label>
            <Input
              id="form-places"
              value={formPlaces}
              onChange={(e) => setFormPlaces(e.target.value)}
              placeholder="e.g. Taj Mahal, Agra Fort, Mehtab Bagh"
            />
          </div>

          <div>
            <Label htmlFor="form-stops">Stops Between Trip (comma-separated, ordered)</Label>
            <Input
              id="form-stops"
              value={formStops}
              onChange={(e) => setFormStops(e.target.value)}
              placeholder="e.g. Jewar Toll Plaza, Mathura Road, Fatehpur Sikri"
            />
          </div>

          {editingItem && (
            <div>
              <Label htmlFor="form-status">Publication Status</Label>
              <Select
                id="form-status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as CatalogStatus)}
                disabled={!canPublish && formStatus === "draft"}
              >
                <option value="draft">Draft (Private / Staging)</option>
                {canPublish && <option value="published">Published (Live to Public)</option>}
                {canPublish && <option value="archived">Archived (Hidden)</option>}
              </Select>
            </div>
          )}

          {/* ── Image manager ─────────────────────────────────────────────── */}
          {canEdit && (
            <section
              aria-label="Image manager"
              className="rounded-md border border-hairline bg-surface-2/40 p-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
                  <ImageIcon className="h-4 w-4 text-ink-faint" />
                  Images
                </h3>
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-wide",
                    mediaAtLimit ? "text-error" : "text-ink-faint",
                  )}
                >
                  {activeMedia.length + stagedCount}/{mediaLimit} {isMultiImageGallery ? "gallery images" : "cover image"}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                {editingItem
                  ? isMultiImageGallery
                    ? "This item supports a cover image and gallery (up to 12 images) — the first image is the cover."
                    : "This category uses a single cover image. Remove the current one to replace it."
                  : "Pick an image now — it uploads automatically the moment you click \"Create Item\" below."}
              </p>

              {!editingItem && stagedMedia && (
                <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <li className="group relative overflow-hidden rounded-md border border-dashed border-gold/50 bg-surface">
                    <div className="aspect-[4/3] w-full overflow-hidden bg-surface-2">
                      {stagedMedia.kind === "file" ? (
                        <img
                          src={stagedMedia.previewUrl}
                          alt={stagedMedia.altText}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-ink-soft">
                          {stagedMedia.path}
                        </div>
                      )}
                    </div>
                    <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-sm bg-gold px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-ink">
                      <Clock className="h-2.5 w-2.5" /> pending save
                    </span>
                    <div className="flex items-center justify-between gap-1 px-1.5 py-1.5">
                      <p className="min-w-0 flex-1 truncate text-[10px] text-ink-soft" title={stagedMedia.altText}>
                        {stagedMedia.altText}
                      </p>
                      <button
                        type="button"
                        onClick={clearStagedMedia}
                        aria-label={`Remove staged image ${stagedMedia.altText}`}
                        title="Remove"
                        className="shrink-0 rounded-sm p-1 text-ink-soft hover:bg-error-soft hover:text-error"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                </ul>
              )}

              {mediaLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-ink-soft">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading images…
                </div>
              ) : (
                activeMedia.length > 0 && (
                  <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {activeMedia.map((m, idx) => (
                      <li key={m.id} className="group relative overflow-hidden rounded-md border border-hairline bg-surface">
                        <div className="aspect-[4/3] w-full overflow-hidden bg-surface-2">
                          <img
                            src={resolveMediaSrc(m.url)}
                            alt={m.altText}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        {idx === 0 && (
                          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-sm bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-surface">
                            <Star className="h-2.5 w-2.5" /> cover
                          </span>
                        )}
                        <div className="flex items-center justify-between gap-1 px-1.5 py-1.5">
                          <p className="min-w-0 flex-1 truncate text-[10px] text-ink-soft" title={m.altText}>
                            {m.altText}
                          </p>
                          <div className="flex shrink-0 items-center gap-0.5">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetCover(m)}
                                disabled={busyMediaId === m.id}
                                aria-label={`Set ${m.altText} as cover image`}
                                title="Set as cover"
                                className="rounded-sm p-1 text-ink-soft hover:bg-surface-2 hover:text-ink disabled:opacity-40"
                              >
                                <Star className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(m)}
                              disabled={busyMediaId === m.id}
                              aria-label={`Remove ${m.altText}`}
                              title="Remove image"
                              className="rounded-sm p-1 text-ink-soft hover:bg-error-soft hover:text-error disabled:opacity-40"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {mediaError && (
                <p className="mt-2.5 rounded-sm border border-error/20 bg-error-soft px-2.5 py-1.5 text-[11px] text-error" role="alert">
                  {mediaError}
                </p>
              )}

              {!mediaAtLimit && (
                <form onSubmit={handleUploadMedia} className="mt-3 space-y-2.5">
                  <div className="flex gap-1.5" role="tablist" aria-label="Image source">
                    {(["file", "path"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        role="tab"
                        aria-selected={uploadMode === mode}
                        onClick={() => setUploadMode(mode)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                          uploadMode === mode
                            ? "border-ink bg-ink text-surface"
                            : "border-hairline text-ink-soft hover:text-ink",
                        )}
                      >
                        {mode === "file" ? "Upload file" : "Reference asset path"}
                      </button>
                    ))}
                  </div>

                  {uploadMode === "file" ? (
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/webp,image/jpeg,image/png,image/avif"
                      onChange={handleFileChosen}
                      aria-label="Choose an image to upload"
                      className="w-full cursor-pointer rounded-md border border-hairline bg-surface px-3 py-2 text-xs text-ink-soft file:mr-3 file:rounded-sm file:border-0 file:bg-gold/15 file:px-2.5 file:py-1 file:text-[11px] file:font-medium file:text-ink"
                    />
                  ) : (
                    <Input
                      value={uploadPath}
                      onChange={(e) => setUploadPath(e.target.value)}
                      placeholder="assets/places/agra-taj-mahal.webp"
                      inputMode="url"
                      aria-label="Asset path"
                    />
                  )}

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <Input
                      value={uploadAlt}
                      onChange={(e) => setUploadAlt(e.target.value)}
                      placeholder="Alt text (required, e.g. Sunrise over the Taj Mahal)"
                      aria-label="Image alt text"
                    />
                    <Input
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="Caption (optional)"
                      aria-label="Image caption"
                    />
                  </div>

                  <Button type="submit" variant="secondary" size="sm" disabled={isUploading} className="w-full sm:w-auto">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> {editingItem ? "Attaching…" : "Staging…"}
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-3.5 w-3.5 mr-1" />{" "}
                        {!editingItem
                          ? "Use this image"
                          : activeMedia.length === 0
                            ? "Add cover image"
                            : "Add image"}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </section>
          )}

          <div className="sticky bottom-0 flex justify-end gap-2.5 border-t border-hairline bg-surface pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" disabled={isSaving}>
              {isSaving ? "Saving…" : editingItem ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
