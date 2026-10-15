import { Archive, Car, Check, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { can, type AdminUser } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { FLEET_KEYS } from "@/modules/fleets/fleets.constants";
import type { LocalPackageItem } from "./local-packages.types";

interface LocalPackageListProps {
  items: LocalPackageItem[];
  user: AdminUser;
  loading: boolean;
  busy: boolean;
  onOpenEdit: (item: LocalPackageItem) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (item: LocalPackageItem) => void;
  error?: string | null;
  onRetry?: () => void;
}

export function LocalPackageList({
  items,
  user,
  loading,
  busy,
  onOpenEdit,
  onPublish,
  onArchive,
  onDelete,
  error,
  onRetry,
}: LocalPackageListProps) {
  return (
    <Card className="divide-y divide-hairline overflow-hidden">
      {loading && (
        <div className="p-8 text-center text-sm text-ink-soft">Loading local packages...</div>
      )}

      {items.map((pkg) => (
        <div
          key={pkg.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="rounded p-2 bg-surface-raised border border-hairline text-gold">
              <Car className="h-5 w-5" />
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
                <span>{pkg.durationHours} Hours</span>
                <span>·</span>
                <span>{pkg.includedKm} KM Included</span>
                <span>·</span>
                <span className="text-primary font-medium">📍 {pkg.covers}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink-soft">
                {FLEET_KEYS.map((k) => {
                  const val = pkg.fleetPrices?.[k];
                  const extra = pkg.extraRates?.[k];
                  return (
                    <span key={k} className="rounded bg-surface-raised px-1.5 py-0.5 border border-hairline font-mono text-[10px]">
                      {k.split("-")[0]}: {val ? formatINR(val) : "—"}
                      {extra && <span className="text-ink-soft"> (+₹{extra.per_km}/km)</span>}
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
        <div className="p-8 text-center text-sm text-ink-soft">No local sightseeing packages found.</div>
      )}
    </Card>
  );
}
