import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Car, CheckCircle2, IndianRupee, Map, MessageSquare, Package, Plane } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AreaChart, DonutChart, RankedBars, VerticalBars } from "@/components/charts/Charts";
import { StatCard } from "@/components/admin/StatCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";
import { fetchAdminAuditLogs, fetchAdminBookings, fetchAdminInquiries, fetchAdminPayments } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import type { AuditEntry, Booking, Inquiry, Payment } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  paid_confirmed: "var(--teal)",
  in_transit: "var(--ink-soft)",
  completed: "var(--success)",
  pending_payment: "var(--gold)",
  draft: "var(--text-faint)",
  cancelled: "var(--coral)",
  refunded: "var(--gold-deep)",
};

const STATUS_LABELS: Record<string, string> = {
  paid_confirmed: "Paid · confirmed",
  in_transit: "In transit",
  completed: "Completed",
  pending_payment: "Pending payment",
  draft: "Draft",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const TIER_LABELS: Record<string, string> = {
  sedan: "Sedan",
  ertiga: "Ertiga",
  "innova-crysta": "Innova",
  "tempo-traveller": "Tempo",
  urbania: "Urbania",
};

function monthKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 7); // YYYY-MM
}

function shortMonth(d: Date): string {
  return d.toLocaleString("en-IN", { month: "short" });
}

export function DashboardPage() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      fetchAdminBookings(),
      fetchAdminPayments(),
      fetchAdminInquiries(),
      fetchAdminAuditLogs(50).catch(() => []),
    ])
      .then(([b, p, iq, au]) => {
        if (!isMounted) return;
        setBookings(b);
        setPayments(p.items);
        setInquiries(iq);
        setAudit(au);
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : "Could not load operations data from the backend.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevMonth = prevDate.toISOString().slice(0, 7);

  const captured = useMemo(() => payments.filter((p) => p.status === "captured"), [payments]);

  const revenueThisMonth = useMemo(
    () => captured.filter((p) => p.capturedAt && monthKey(p.capturedAt) === thisMonth).reduce((s, p) => s + p.amount, 0),
    [captured, thisMonth],
  );
  const revenuePrevMonth = useMemo(
    () => captured.filter((p) => p.capturedAt && monthKey(p.capturedAt) === prevMonth).reduce((s, p) => s + p.amount, 0),
    [captured, prevMonth],
  );
  const bookingsThisMonth = useMemo(
    () => bookings.filter((b) => monthKey(b.createdAt) === thisMonth).length,
    [bookings, thisMonth],
  );
  const bookingsPrevMonth = useMemo(
    () => bookings.filter((b) => monthKey(b.createdAt) === prevMonth).length,
    [bookings, prevMonth],
  );
  const inTransit = bookings.filter((b) => b.status === "in_transit").length;
  const newInquiries = inquiries.filter((i) => i.status === "new").length;

  function pctDelta(current: number, previous: number): number | undefined {
    if (previous <= 0) return undefined;
    return ((current - previous) / previous) * 100;
  }

  const statusCounts = useMemo(
    () =>
      bookings.reduce<Record<string, number>>((acc, b) => {
        acc[b.status] = (acc[b.status] ?? 0) + 1;
        return acc;
      }, {}),
    [bookings],
  );

  const tierCounts = useMemo(
    () =>
      bookings.reduce<Record<string, number>>((acc, b) => {
        acc[b.vehicleTier] = (acc[b.vehicleTier] ?? 0) + 1;
        return acc;
      }, {}),
    [bookings],
  );

  /** Trailing 12 months of captured revenue, computed from real payments. */
  const revenueSeries = useMemo(() => {
    const buckets: { label: string; value: number; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = d.toISOString().slice(0, 7);
      const inMonth = captured.filter((p) => p.capturedAt && monthKey(p.capturedAt) === key);
      buckets.push({
        label: shortMonth(d),
        value: inMonth.reduce((s, p) => s + p.amount, 0),
        count: inMonth.length,
      });
    }
    return buckets;
  }, [captured, now]);

  const revenueHasData = revenueSeries.some((b) => b.value > 0);

  const topRoutes = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const b of bookings) {
      const key = `${b.origin} → ${b.destination}`;
      acc[key] = (acc[key] ?? 0) + 1;
    }
    return Object.entries(acc)
      .map(([label, value]) => ({ label, value, sub: `${value} ${value === 1 ? "trip" : "trips"}` }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [bookings]);

  const recent = useMemo(
    () => [...audit].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6),
    [audit],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Live board"
        title="Operations Overview"
        description="Live figures from the bookings, payments and audit systems."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-[32px]" onClick={() => setReloadKey((k) => k + 1)}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-[32px]" onClick={() => navigate("/bookings")}>
              Bookings
            </Button>
            <Button variant="gold" size="sm" className="min-h-[44px] sm:min-h-[32px]" onClick={() => navigate("/routes")}>
              <Map className="mr-1.5 h-3.5 w-3.5" />
              Routes
            </Button>
            <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-[32px]" onClick={() => navigate("/tour-packages")}>
              <Package className="mr-1.5 h-3.5 w-3.5" />
              Tours
            </Button>
            <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-[32px]" onClick={() => navigate("/local-transfers")}>
              <Plane className="mr-1.5 h-3.5 w-3.5" />
              Transfers
            </Button>
            <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-[32px]" onClick={() => navigate("/vehicles")}>
              <Car className="mr-1.5 h-3.5 w-3.5" />
              Fleet
            </Button>
          </div>
        }
      />

      {loadError && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <span className="flex-1">{loadError}</span>
          <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-[32px]" onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </Button>
        </div>
      )}
      {loading && !loadError && (
        <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-faint" role="status">
          Loading operations data…
        </p>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={0}
          label="Revenue · MTD"
          value={revenueThisMonth}
          format="inr"
          icon={IndianRupee}
          delta={pctDelta(revenueThisMonth, revenuePrevMonth)}
          deltaLabel="vs last month"
        />
        <StatCard
          index={1}
          label="Bookings · MTD"
          value={bookingsThisMonth}
          format="number"
          icon={CalendarDays}
          delta={pctDelta(bookingsThisMonth, bookingsPrevMonth)}
          deltaLabel="vs last month"
        />
        <StatCard index={2} label="Trips in transit" value={inTransit} format="number" icon={CheckCircle2} />
        <StatCard index={3} label="New inquiries" value={newInquiries} format="number" icon={MessageSquare} />
      </div>

      {/* Catalog & Verticals Quick Access Bar */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => navigate("/routes")}
          className="flex flex-col items-start gap-1 rounded-lg border border-border bg-surface-card p-3.5 text-left transition hover:border-gold/50 hover:bg-surface-card-hover"
        >
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-gold" />
            <span className="font-semibold text-sm text-ink">Outstation Routes</span>
          </div>
          <span className="text-xs text-ink-soft">Intercity highways & one-way fares</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/tour-packages")}
          className="flex flex-col items-start gap-1 rounded-lg border border-border bg-surface-card p-3.5 text-left transition hover:border-teal/50 hover:bg-surface-card-hover"
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-teal" />
            <span className="font-semibold text-sm text-ink">Tour Packages</span>
          </div>
          <span className="text-xs text-ink-soft">Multi-day itineraries & fixed packages</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/local-transfers")}
          className="flex flex-col items-start gap-1 rounded-lg border border-border bg-surface-card p-3.5 text-left transition hover:border-gold-deep/50 hover:bg-surface-card-hover"
        >
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-gold-deep" />
            <span className="font-semibold text-sm text-ink">Local & Transfers</span>
          </div>
          <span className="text-xs text-ink-soft">Airport hubs & 4h/8h city packages</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/vehicles")}
          className="flex flex-col items-start gap-1 rounded-lg border border-border bg-surface-card p-3.5 text-left transition hover:border-ink-bright/50 hover:bg-surface-card-hover"
        >
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-ink-bright" />
            <span className="font-semibold text-sm text-ink">Fleet & Vehicles</span>
          </div>
          <span className="text-xs text-ink-soft">Models, groups & base fare rules</span>
        </button>
      </div>

      {/* Revenue + status mix */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Revenue — trailing 12 months</CardTitle>
              <CardDescription>Captured gateway amounts, ₹</CardDescription>
            </div>
            <Badge tone="gold">{shortMonth(now)} in progress</Badge>
          </CardHeader>
          <CardContent>
            {revenueHasData ? (
              <AreaChart
                data={revenueSeries.map((b) => ({
                  label: b.label,
                  value: b.value,
                  sub: `${b.count} ${b.count === 1 ? "payment" : "payments"}`,
                }))}
              />
            ) : (
              <div className="flex h-44 items-center justify-center text-center">
                <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
                  No captured payments in the last 12 months yet. Revenue appears here once customers
                  complete checkouts.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking status mix</CardTitle>
            <CardDescription>All bookings on record</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length > 0 ? (
              <DonutChart
                centerLabel="Bookings"
                centerValue={String(bookings.length)}
                slices={Object.entries(statusCounts).map(([status, value]) => ({
                  label: STATUS_LABELS[status] ?? status,
                  value,
                  color: STATUS_COLORS[status] ?? "var(--text-faint)",
                }))}
              />
            ) : (
              <div className="flex h-44 items-center justify-center text-center">
                <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
                  No bookings yet — create one from the customer site to see the status mix.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle tiers + top routes */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Trips by vehicle tier</CardTitle>
            <CardDescription>Current records</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length > 0 ? (
              <VerticalBars
                items={Object.entries(TIER_LABELS).map(([key, label]) => ({
                  label,
                  value: tierCounts[key] ?? 0,
                }))}
              />
            ) : (
              <div className="flex h-44 items-center justify-center text-center">
                <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
                  Vehicle usage appears here once bookings exist.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top routes</CardTitle>
            <CardDescription>By booking count</CardDescription>
          </CardHeader>
          <CardContent>
            {topRoutes.length > 0 ? (
              <RankedBars items={topRoutes} />
            ) : (
              <div className="flex h-44 items-center justify-center text-center">
                <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
                  Popular routes appear here once bookings exist.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Latest desk activity</CardTitle>
              <CardDescription>Immutable audit trail</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/audit")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length > 0 ? (
              <ol className="space-y-0">
                {recent.map((entry, i) => (
                  <motion.li
                    key={entry.id}
                    initial={reduce ? { opacity: 1 } : { opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex gap-3 pb-4 last:pb-0"
                  >
                    {i < recent.length - 1 && (
                      <span className="absolute left-[5px] top-4 h-full w-px bg-hairline" aria-hidden="true" />
                    )}
                    <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-gold bg-surface" />
                    <div className="min-w-0">
                      <p className="text-[13px] leading-snug text-ink">
                        <span className="font-semibold">{entry.actor}</span>{" "}
                        <span className="text-ink-soft">{entry.detail || entry.action}</span>
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                        {entry.resourceType} · {timeAgo(entry.at)}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            ) : (
              <p className="py-6 text-center text-sm leading-relaxed text-ink-soft">
                No staff activity yet. Actions you take in this panel are recorded here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
