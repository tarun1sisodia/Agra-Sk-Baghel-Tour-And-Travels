import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Eye,
  Filter,
  Lock,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import { fetchAuditLogs, type CleanAuditLog } from "@/services/cleanAdminApi";
import { ROLE_LABELS, type AdminUser, type AdminRole } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

export function AuditPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const [logs, setLogs] = useState<CleanAuditLog[]>([]);
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Inspector Modal State
  const [inspectLog, setInspectLog] = useState<CleanAuditLog | null>(null);

  const canRead = user.role === "super_admin";

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchAuditLogs(100);
      setLogs(data);
    } catch (err: any) {
      setLoadError(err.message || "Could not load audit logs from clean backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canRead) {
      loadData();
    }
  }, [reloadKey, canRead]);

  const uniqueResources = Array.from(new Set(logs.map((l) => l.resource_type)));

  const visibleLogs = logs.filter(
    (l) => resourceFilter === "all" || l.resource_type === resourceFilter
  );

  if (!canRead) {
    return (
      <div>
        <PageHeader eyebrow="Security Governance" title="System Audit Log" />
        <Card className="p-10 text-center">
          <Lock className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 font-display text-lg text-ink">Audit records are super-admin only</p>
          <p className="mt-1 text-sm text-ink-soft">
            The immutable trail of all system mutations and commercial updates is restricted to the{" "}
            <code className="font-mono">super_admin</code> role.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security Governance"
        title="System Audit Log"
        description="Immutable, append-only log of every system mutation — fare adjustments, vehicle modifications, status transitions, and publish dispatches."
        actions={
          <div className="flex items-center gap-2.5">
            <Badge tone="gold" className="px-3 py-1.5">
              <Lock className="h-3.5 w-3.5" /> Immutable Audit Trail
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
          Loading audit records from database…
        </div>
      )}

      {loadError && (
        <div
          className="flex flex-wrap items-center gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{loadError}</span>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {/* Resource Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft mr-2">
              <Filter className="h-3.5 w-3.5" /> Target Resource:
            </span>
            <Button
              variant={resourceFilter === "all" ? "gold" : "outline"}
              size="sm"
              onClick={() => setResourceFilter("all")}
              className="text-xs"
            >
              All ({logs.length})
            </Button>
            {uniqueResources.map((res) => {
              const count = logs.filter((l) => l.resource_type === res).length;
              return (
                <Button
                  key={res}
                  variant={resourceFilter === res ? "gold" : "outline"}
                  size="sm"
                  onClick={() => setResourceFilter(res)}
                  className="font-mono text-xs"
                >
                  {res} ({count})
                </Button>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Mutation Audit Trail ({visibleLogs.length})</CardTitle>
                <CardDescription>
                  Before and after snapshots recorded for every commercial and content modification.
                </CardDescription>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TRow>
                    <TH>Timestamp</TH>
                    <TH>Action</TH>
                    <TH>Resource Type</TH>
                    <TH>Resource ID</TH>
                    <TH>Actor Role</TH>
                    <TH className="text-right">Inspection</TH>
                  </TRow>
                </THead>
                <TBody>
                  {visibleLogs.length === 0 ? (
                    <TRow>
                      <TD colSpan={6} className="py-8 text-center text-sm text-ink-soft">
                        No audit records recorded for this resource type.
                      </TD>
                    </TRow>
                  ) : (
                    visibleLogs.map((log, i) => (
                      <motion.tr
                        key={log.id}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.02, duration: 0.25 }}
                        className="transition-colors hover:bg-gold-wash/50"
                      >
                        <TD className="whitespace-nowrap font-mono text-xs text-ink-soft">
                          {formatDateTime(log.created_at)}
                        </TD>
                        <TD>
                          <Badge
                            tone={
                              log.action === "create"
                                ? "success"
                                : log.action === "update"
                                ? "gold"
                                : "neutral"
                            }
                            className="capitalize font-mono text-[10px]"
                          >
                            {log.action}
                          </Badge>
                        </TD>
                        <TD>
                          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink font-semibold">
                            {log.resource_type}
                          </code>
                        </TD>
                        <TD>
                          <code className="font-mono text-[11px] text-ink-faint">
                            {log.resource_id}
                          </code>
                        </TD>
                        <TD>
                          <Badge tone="teal" className="text-[10px]">
                            {ROLE_LABELS[log.actor_role as AdminRole] || log.actor_role}
                          </Badge>
                        </TD>
                        <TD className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setInspectLog(log)}
                          >
                            <Eye className="mr-1 h-3 w-3" /> Diff State
                          </Button>
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

      {/* Structured Diff Inspector Modal */}
      <Dialog
        open={Boolean(inspectLog)}
        onClose={() => setInspectLog(null)}
        title="Audit Record State Inspector"
        description={`Record ID: ${inspectLog?.id}`}
        className="sm:max-w-2xl"
      >
        {inspectLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-md border border-hairline bg-surface-2 p-3 text-xs">
              <div>
                <p className="text-ink-faint">Action / Resource</p>
                <p className="font-semibold text-ink mt-0.5">
                  {inspectLog.action.toUpperCase()} on {inspectLog.resource_type}
                </p>
              </div>
              <div>
                <p className="text-ink-faint">Request ID</p>
                <p className="font-mono text-[11px] text-ink mt-0.5">{inspectLog.request_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold text-ink-soft">Before State</p>
                <div className="rounded-md border border-hairline bg-surface-2/60 p-3 max-h-64 overflow-y-auto font-mono text-[11px] text-ink leading-relaxed">
                  {inspectLog.before_state ? (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(inspectLog.before_state, null, 2)}
                    </pre>
                  ) : (
                    <span className="italic text-ink-faint">Initial creation (None)</span>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-gold-text">After State</p>
                <div className="rounded-md border border-gold-border bg-gold-soft/40 p-3 max-h-64 overflow-y-auto font-mono text-[11px] text-ink leading-relaxed">
                  {inspectLog.after_state ? (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(inspectLog.after_state, null, 2)}
                    </pre>
                  ) : (
                    <span className="italic text-ink-faint">Record removed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-rule">
              <Button type="button" variant="outline" onClick={() => setInspectLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
