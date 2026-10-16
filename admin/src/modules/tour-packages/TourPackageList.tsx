import { Archive, Check, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { can, type AdminUser } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { FLEET_KEYS } from "@/modules/fleets/fleets.constants";
import type { CatalogStatus, TourPackageItem } from "./tour-packages.types";

interface TourPackageListProps {
  items: TourPackageItem[];
  user: AdminUser;
  loading: boolean;
  busy: boolean;
  status: CatalogStatus | "all";
  onStatusChange: (status: CatalogStatus | "all") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: (item: TourPackageItem) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (item: TourPackageItem) => void;
  error?: string | null;
  onRetry?: () => void;
}

export function TourPackageList({
  items,
  user,
  loading,
  busy,
  status,
  onStatusChange,
  searchQuery,
  onSearchChange,
  onOpenCreate,
  onOpenEdit,
  onPublish,
  onArchive,
  onDelete,
  error,
  onRetry,
}: TourPackageListProps) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as any)}
            className="w-auto text-xs"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search package name..."
            className="max-w-xs text-xs"
          />
        </div>

        {can(user.role, "catalog:create") && (
          <Button variant="gold" size="sm" onClick={onOpenCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New Tour Package
          </Button>
        )}
      </div>

      <Card className="divide-y divide-hairline overflow-hidden">
        {loading && (
          <div className="p-8 text-center text-sm text-ink-soft">Loading tour packages...</div>
        )}

        {items.map((pkg) => (
          <div
            key={pkg.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-surface-2 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded border border-hairline bg-surface-raised">
                <img
                  src={pkg.imageUrl || "/assets/packages/taj-dawn.webp"}
                  alt={pkg.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/assets/packages/taj-dawn.webp";
                  }}
                />
                {Array.isArray(pkg.gallery) && pkg.gallery.length > 0 && (
                  <span className="absolute bottom-0.5 right-0.5 inline-flex items-center gap-0.5 rounded bg-black/75 px-1 text-[9px] text-white font-mono">
                    <ImageIcon className="h-2.5 w-2.5" />
                    {pkg.gallery.length}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink text-sm">{pkg.name}</span>
                  <Badge
                    tone={
                      pkg.status === "published"
                        ? "success"
                        : pkg.status === "draft"
                        ? "gold"
                        : "neutral"
                    }
                  >
                    {pkg.status}
                  </Badge>
                  <span className="font-mono text-[11px] text-ink-soft">/{pkg.packageCode}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft flex items-center gap-2 flex-wrap">
                  <span>{pkg.durationText}</span>
                  <span>·</span>
                  <span className="text-primary font-medium">📍 {pkg.source || "Agra"} → {pkg.destination || "Tour"}</span>
                  <span className="font-semibold text-ink font-mono">
                    {pkg.startingPriceInr != null && pkg.startingPriceInr > 0 ? formatINR(pkg.startingPriceInr) : "On request"}
                  </span>
                  {Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0 && (
                    <span className="text-emerald-400 font-sans text-[11px] font-medium">✓ {pkg.inclusions.length} incl</span>
                  )}
                  {Array.isArray(pkg.exclusions) && pkg.exclusions.length > 0 && (
                    <span className="text-rose-400 font-sans text-[11px] font-medium">✗ {pkg.exclusions.length} excl</span>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink-soft">
                  {FLEET_KEYS.map((k) => {
                    const val = pkg.fleetPrices?.[k];
                    return (
                      <span key={k} className="rounded bg-surface-raised px-1.5 py-0.5 border border-hairline font-mono text-[10px]">
                        {k.split("-")[0]}: {val ? formatINR(val) : "—"}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {can(user.role, "catalog:edit") && (
                <Button size="sm" variant="outline" onClick={() => onOpenEdit(pkg)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {can(user.role, "catalog:publish") && pkg.status === "draft" && (
                <Button size="sm" variant="gold" onClick={() => onPublish(pkg.id)} disabled={busy}>
                  <Check className="mr-1 h-3.5 w-3.5" /> Publish
                </Button>
              )}
              {pkg.status !== "archived" && (
                <Button size="sm" variant="ghost" onClick={() => onArchive(pkg.id)} disabled={busy} title="Archive">
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}
              {pkg.status === "draft" && (
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => onDelete(pkg)} disabled={busy} title="Delete draft">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {error && !loading && (
          <div className="p-8 text-center text-sm text-red-400 flex flex-col items-center justify-center gap-2">
            <p>{error}</p>
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        )}

        {items.length === 0 && !loading && !error && (
          <div className="p-8 text-center text-sm text-ink-soft">No tour packages found.</div>
        )}
      </Card>
    </>
  );
}
