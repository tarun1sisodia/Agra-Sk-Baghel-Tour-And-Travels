import { Archive, Check, Pencil, Plane, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { can, type AdminUser } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { FLEET_KEYS } from "@/modules/fleets/fleets.constants";
import type { TransferRouteItem } from "./transfer-routes.types";

interface TransferRouteListProps {
  items: TransferRouteItem[];
  user: AdminUser;
  loading: boolean;
  busy: boolean;
  onOpenEdit: (item: TransferRouteItem) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (item: TransferRouteItem) => void;
  error?: string | null;
  onRetry?: () => void;
}

export function TransferRouteList({
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
}: TransferRouteListProps) {
  return (
    <Card className="divide-y divide-hairline overflow-hidden">
      {loading && (
        <div className="p-8 text-center text-sm text-ink-soft">Loading transfer routes...</div>
      )}

      {items.map((route) => (
        <div
          key={route.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="rounded p-2 bg-surface-raised border border-hairline text-gold">
              <Plane className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink text-sm">{route.name}</span>
                <Badge
                  tone={
                    route.status === "published"
                      ? "success"
                      : route.status === "draft"
                      ? "gold"
                      : "neutral"
                  }
                >
                  {route.status}
                </Badge>
                <span className="font-mono text-[11px] text-ink-soft">/{route.routeCode}</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft flex items-center gap-2 flex-wrap">
                <span>{route.distanceText}</span>
                <span>·</span>
                <span className="text-primary font-medium">📍 {route.directionNote}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink-soft">
                {FLEET_KEYS.map((k) => {
                  const val = route.fleetPrices?.[k];
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
              <Button size="sm" variant="outline" onClick={() => onOpenEdit(route)}>
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {can(user.role, "catalog:publish") && route.status === "draft" && (
              <Button size="sm" variant="gold" onClick={() => onPublish(route.id)} disabled={busy}>
                <Check className="mr-1 h-3.5 w-3.5" /> Publish
              </Button>
            )}
            {route.status !== "archived" && (
              <Button size="sm" variant="ghost" onClick={() => onArchive(route.id)} disabled={busy} title="Archive">
                <Archive className="h-3.5 w-3.5" />
              </Button>
            )}
            {route.status === "draft" && (
              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => onDelete(route)} disabled={busy} title="Delete draft">
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
        <div className="p-8 text-center text-sm text-ink-soft">No airport / station transfer routes found.</div>
      )}
    </Card>
  );
}
