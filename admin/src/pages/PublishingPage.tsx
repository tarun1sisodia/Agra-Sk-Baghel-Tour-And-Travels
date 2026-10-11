import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import {
  fetchPublishEvents,
  type CleanPublishEvent,
} from "@/services/cleanAdminApi";
import type { AdminUser } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function PublishingPage({ user: _user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const [events, setEvents] = useState<CleanPublishEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchPublishEvents(100);
      setEvents(data);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load publishing events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reloadKey]);

  const filteredEvents = events.filter(
    (e) => statusFilter === "all" || e.status === statusFilter
  );

  const pendingCount = events.filter((e) => e.status === "pending" || e.status === "triggered").length;
  const failedCount = events.filter((e) => e.status === "failed").length;
  const succeededCount = events.filter((e) => e.status === "succeeded").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline & Deployments"
        title="Publishing Events Outbox"
        description="Immutable audit trail of all content publish, price change, and review approval triggers. Drives SSG page regeneration and sitemap updates."
        actions={
          <div className="flex items-center gap-2.5">
            <Badge tone="teal">
              <ShieldCheck className="h-3.5 w-3.5" /> Outbox Pattern
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        }
      />

      {loading && (
        <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
          Loading publishing outbox events…
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

      {!loading && !loadError && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                    Total Events
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-ink">{events.length}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-2 text-ink-soft">
                  <Layers className="h-5 w-5" />
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-gold-text">
                    Pending / Triggered
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-gold-text">
                    {pendingCount}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-gold-soft text-gold-text">
                  <Clock className="h-5 w-5" />
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Succeeded
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {succeededCount}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-teal-soft text-teal-text">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-error">Failed</p>
                  <p className="mt-1 font-display text-2xl font-bold text-error">{failedCount}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-error-soft text-error">
                  <XCircle className="h-5 w-5" />
                </span>
              </div>
            </Card>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft mr-2">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            {(["all", "pending", "triggered", "succeeded", "failed"] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "gold" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="capitalize text-xs"
              >
                {s} ({events.filter((e) => s === "all" || e.status === s).length})
              </Button>
            ))}
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Outbox Event Log ({filteredEvents.length})</CardTitle>
                <CardDescription>
                  Transactional event emission ensures zero desynchronization between database state and pre-rendered customer site pages.
                </CardDescription>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TRow>
                    <TH>Entity Type</TH>
                    <TH>Event</TH>
                    <TH>Entity ID</TH>
                    <TH className="text-center">Attempts</TH>
                    <TH className="text-center">Status</TH>
                    <TH className="text-right">Created At</TH>
                  </TRow>
                </THead>
                <TBody>
                  {filteredEvents.length === 0 ? (
                    <TRow>
                      <TD colSpan={6} className="py-8 text-center text-sm text-ink-soft">
                        No events match the selected status filter.
                      </TD>
                    </TRow>
                  ) : (
                    filteredEvents.map((e, i) => (
                      <motion.tr
                        key={e.id}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.02, duration: 0.25 }}
                        className={cn(
                          "transition-colors hover:bg-gold-wash/50",
                          e.status === "failed" && "bg-error/5"
                        )}
                      >
                        <TD>
                          <Badge tone="gold" className="font-mono text-[11px]">
                            {e.entity_type}
                          </Badge>
                        </TD>
                        <TD className="text-xs font-semibold text-ink capitalize">
                          {e.event_type.replace(/_/g, " ")}
                        </TD>
                        <TD>
                          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
                            {e.entity_id}
                          </code>
                        </TD>
                        <TD className="text-center font-mono text-xs">{e.attempt_count}</TD>
                        <TD className="text-center">
                          <Badge
                            tone={
                              e.status === "succeeded"
                                ? "success"
                                : e.status === "failed"
                                ? "error"
                                : e.status === "pending" || e.status === "triggered"
                                ? "gold"
                                : "neutral"
                            }
                          >
                            {e.status}
                          </Badge>
                        </TD>
                        <TD className="text-right font-mono text-xs text-ink-soft">
                          {formatDate(e.created_at)}
                        </TD>
                      </motion.tr>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
