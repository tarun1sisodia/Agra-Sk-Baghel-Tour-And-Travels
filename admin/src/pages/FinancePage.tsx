import { useEffect, useMemo, useState, useCallback } from "react";
import { AlertTriangle, Banknote, CheckCircle2, CreditCard, Lock, QrCode, RefreshCw, ShieldCheck, UserCheck, Wallet } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label } from "@/components/ui/Input";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import { RankedBars } from "@/components/charts/Charts";
import { fetchAdminPayments, fetchAdminBookings, refundAdminBooking } from "@/lib/api";
import { can, type AdminUser, type Payment, type Booking } from "@/lib/types";
import { cn, formatDateTime, formatINR } from "@/lib/utils";

const METHOD_META = {
  upi: { label: "UPI", icon: QrCode },
  card: { label: "Card", icon: CreditCard },
  netbanking: { label: "NetBanking", icon: Banknote },
  paypal: { label: "PayPal", icon: RefreshCw },
} as const;

export function FinancePage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const canRead = can(user.role, "finance:read");
  const canRefund = can(user.role, "finance:refund");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [idemKey, setIdemKey] = useState("");
  const [stage, setStage] = useState<"form" | "processing" | "done">("form");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const loadFinanceData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setLoadError(null);
    try {
      const [paymentsRes, bookingsRes] = await Promise.all([
        fetchAdminPayments(),
        fetchAdminBookings({ pageSize: 100 }),
      ]);
      setPayments(paymentsRes.items || []);
      setBookings(bookingsRes || []);
      setLastSyncTime(new Date());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load finance records from the live backend.");
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFinanceData();
    // 30-second live data ingestion synchronization
    const interval = setInterval(() => {
      void loadFinanceData();
    }, 30_000);
    return () => clearInterval(interval);
  }, [loadFinanceData]);

  const captured = payments.filter((p) => p.status === "captured");
  const refunded = payments.filter((p) => p.status === "refunded");
  const totalCaptured = captured.reduce((s, p) => s + p.amount, 0);
  const totalRefunded = refunded.reduce((s, p) => s + p.amount, 0);

  // Settlement Balance calculations
  const estGatewayFees = Math.round(totalCaptured * 0.02);
  const netSettlementDisbursed = Math.max(0, totalCaptured - totalRefunded - estGatewayFees);

  // Chauffeur Cash Collection (72% balance) audit calculations
  const activeBookings = useMemo(() => {
    return bookings.filter((b) =>
      ["paid_confirmed", "confirmed", "driver_assigned", "in_transit", "completed"].includes(b.status)
    );
  }, [bookings]);

  const totalCashCollectible = useMemo(() => {
    return activeBookings.reduce((sum, b) => sum + (b.fare.balancePayable || 0), 0);
  }, [activeBookings]);

  const cashReconciled = useMemo(() => {
    return activeBookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.fare.balancePayable || 0), 0);
  }, [activeBookings]);

  const cashInTransit = useMemo(() => {
    return activeBookings
      .filter((b) => ["paid_confirmed", "confirmed", "driver_assigned", "in_transit"].includes(b.status))
      .reduce((sum, b) => sum + (b.fare.balancePayable || 0), 0);
  }, [activeBookings]);

  const methodTotals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of captured) {
      if (p.method) acc[p.method] = (acc[p.method] ?? 0) + p.amount;
    }
    return Object.entries(acc).map(([method, value]) => ({
      label: METHOD_META[method as keyof typeof METHOD_META]?.label ?? method,
      value,
    }));
  }, [captured]);

  /** Refund eligibility: captured payment. The backend enforces the booking state
   *  (paid_confirmed) and rejects ineligible refunds with a surfaced error. */
  function isEligible(p: Payment) {
    return p.status === "captured";
  }

  function openRefund(p: Payment) {
    setRefundTarget(p);
    setAmount(p.amount);
    setReason("");
    setRefundError(null);
    setIdemKey(`rfn_${p.bookingTicketId.replace(/-/g, "")}_${Math.floor(Math.random() * 900 + 100)}`);
    setStage("form");
  }

  async function executeRefund() {
    if (!refundTarget) return;
    setStage("processing");
    try {
      const targetBookingId = refundTarget.bookingId || refundTarget.bookingTicketId;
      const amountMinor = Math.round(amount * 100); // Convert INR to paise
      await refundAdminBooking(targetBookingId, reason || "Staff requested refund", idemKey, amountMinor);
      setTimeout(() => setStage("done"), 600);
    } catch (err) {
      setStage("form");
      setRefundError(err instanceof Error ? err.message : "Refund failed on the backend. No state was changed.");
    }
  }

  if (!canRead) {
    return (
      <div>
        <PageHeader eyebrow="Access" title="Finance & Refunds" />
        <Card className="p-10 text-center">
          <Lock className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 font-display text-lg text-ink">Finance module is role-gated</p>
          <p className="mt-1 text-sm text-ink-soft">
            Requires <code className="font-mono">finance:read</code> (finance_operator or super_admin).
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <PageHeader
            eyebrow="Money movement"
            title="Finance & Refunds"
            description="Gateway-confirmed ledger. Refunds are idempotent, reason-documented and executed only by super_admin."
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success" className="flex items-center gap-1.5 text-xs py-1 px-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Ingestion Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadFinanceData(true)}
            disabled={isRefreshing}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-gold")} />
            Sync Ledger
          </Button>
          <span className="text-[11px] text-ink-faint">
            {formatDateTime(lastSyncTime.toISOString())}
          </span>
        </div>
      </div>

      {loadError && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{loadError}</span>
        </div>
      )}

      {/* Top financial indicators */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Captured · 28% Advance" value={totalCaptured} format="inr" icon={CreditCard} />
        <StatCard index={1} label="Refunded · all time" value={totalRefunded} format="inr" icon={RefreshCw} />
        <StatCard index={2} label="Net Bank Settlement" value={netSettlementDisbursed} format="inr" icon={Wallet} />
        <StatCard index={3} label="Chauffeur 72% Cash Due" value={totalCashCollectible} format="inr" icon={Banknote} />
      </div>

      {/* Settlement Balance Overview */}
      <div className="mt-4">
        <Card className="overflow-hidden border border-gold/20 bg-gold-wash/10">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gold" />
                Settlement Balance &amp; Disbursal Overview
              </CardTitle>
              <CardDescription>
                Razorpay &amp; PayPal net payout ledger to primary HDFC Current Account (T+1 daily cycle)
              </CardDescription>
            </div>
            <Badge tone="gold" className="text-xs">T+1 Auto Sweep</Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
            <div className="rounded-md border border-hairline bg-surface p-3.5">
              <span className="text-xs text-ink-soft block mb-1">Gross Gateway Ingestion</span>
              <span className="text-lg font-mono font-semibold text-ink">{formatINR(totalCaptured)}</span>
              <span className="text-[11px] text-ink-faint block mt-1">28% online customer deposit</span>
            </div>
            <div className="rounded-md border border-hairline bg-surface p-3.5">
              <span className="text-xs text-ink-soft block mb-1">Estimated Gateway Fees (~2%)</span>
              <span className="text-lg font-mono font-semibold text-error">-{formatINR(estGatewayFees)}</span>
              <span className="text-[11px] text-ink-faint block mt-1">MDR &amp; GST deducted at source</span>
            </div>
            <div className="rounded-md border border-hairline bg-surface p-3.5">
              <span className="text-xs text-ink-soft block mb-1">Disbursed to Bank Account</span>
              <span className="text-lg font-mono font-semibold text-success">{formatINR(netSettlementDisbursed)}</span>
              <span className="text-[11px] text-ink-faint block mt-1">HDFC A/C •••• 9821</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Payment ledger</CardTitle>
              <CardDescription>Razorpay · PayPal — captured amounts in INR</CardDescription>
            </div>
            <Badge tone="neutral">{payments.length} records</Badge>
          </CardHeader>
          <Table>
            <THead>
              <TRow>
                <TH>Booking</TH>
                <TH>Provider</TH>
                <TH>Gateway reference</TH>
                <TH>Method</TH>
                <TH className="text-right">Amount</TH>
                <TH>Captured</TH>
                <TH>Reconciliation</TH>
                <TH>Status</TH>
                <TH className="w-24" />
              </TRow>
            </THead>
            <TBody>
              {payments.map((p, i) => {
                const methodMeta = METHOD_META[p.method as keyof typeof METHOD_META];
                const MethodIcon = methodMeta?.icon ?? CreditCard;
                const eligible = isEligible(p);
                return (
                  <motion.tr
                    key={p.id}
                    initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className={cn("transition-colors", canRefund && eligible && "cursor-pointer hover:bg-gold-wash/60")}
                    onClick={() => canRefund && eligible && openRefund(p)}
                  >
                    <TD className="font-mono text-[12px] font-medium">{p.bookingTicketId}</TD>
                    <TD className="text-[13px] capitalize text-ink-soft">{p.provider}</TD>
                    <TD className="max-w-44 font-mono text-[11px] text-ink-soft" title={p.providerOrderId}>
                      <span className="block truncate">{p.providerOrderId}</span>
                      {p.webhookEventId ? <span className="block truncate text-[10px] text-ink-faint">webhook: {p.webhookEventId}</span> : <span className="block text-[10px] text-ink-faint">browser-verified</span>}
                    </TD>
                    <TD>
                      <span className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                        <MethodIcon className="h-3.5 w-3.5 text-ink-faint" />
                        {methodMeta?.label ?? p.method ?? "—"}
                      </span>
                    </TD>
                    <TD className="text-right font-mono text-[13px] font-medium">
                      {p.amount === 0 ? "—" : formatINR(p.amount)}
                    </TD>
                    <TD className="font-mono text-[12px] text-ink-soft">{p.capturedAt ? formatDateTime(p.capturedAt) : "—"}</TD>
                    <TD><StatusBadge status={p.reconciliationStatus === "matched" ? "captured" : p.reconciliationStatus} /></TD>
                    <TD><StatusBadge status={p.status} /></TD>
                    <TD className="text-right">
                      {canRefund && eligible && (
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openRefund(p); }}>
                          Refund
                        </Button>
                      )}
                    </TD>
                  </motion.tr>
                );
              })}
            </TBody>
          </Table>
          {payments.length === 0 && !loadError && (
            <div className="p-12 text-center">
              <p className="font-display text-lg text-ink">No payments yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
                Gateway payments created from customer checkouts appear here once payments are enabled.
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Method mix · captured</CardTitle>
              <CardDescription>Share of 30-day volume</CardDescription>
            </CardHeader>
            <CardContent>
              <RankedBars items={methodTotals} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Refund safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[13px] leading-relaxed text-ink-soft">
              <p>· Every refund carries a unique <code className="font-mono text-gold-text">idempotency key</code> — duplicates are rejected at the DB layer.</p>
              <p>· Gateway calls time out at 8 s; on failure the booking state is untouched.</p>
              <p>· Rate limit: <span className="font-mono">10 req/min</span> on the refund endpoint.</p>
              <p>· 100% of executions are written to the audit trail.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chauffeur Cash Collection Audit Section (72% Balance Ledger) */}
      <div className="mt-6">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-gold" />
                Chauffeur Cash Collection Audit (72% Cash Ledger)
              </CardTitle>
              <CardDescription>
                Direct cash reconciliation for active and completed journeys collected by chauffeurs at destination.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{activeBookings.length} Active Journeys</Badge>
            </div>
          </CardHeader>

          {/* Chauffeur summary metrics */}
          <div className="grid grid-cols-1 gap-4 px-6 pb-4 sm:grid-cols-3">
            <div className="rounded-md border border-hairline bg-surface-raised/40 p-3">
              <span className="text-xs text-ink-soft block">Total 72% Cash Collectible</span>
              <span className="text-lg font-mono font-semibold text-ink">{formatINR(totalCashCollectible)}</span>
              <span className="text-[11px] text-ink-faint block mt-0.5">Across {activeBookings.length} confirmed bookings</span>
            </div>
            <div className="rounded-md border border-hairline bg-surface-raised/40 p-3">
              <span className="text-xs text-ink-soft block">Reconciled Cash (Completed Trips)</span>
              <span className="text-lg font-mono font-semibold text-success">{formatINR(cashReconciled)}</span>
              <span className="text-[11px] text-ink-faint block mt-0.5">Handed over &amp; audited</span>
            </div>
            <div className="rounded-md border border-hairline bg-surface-raised/40 p-3">
              <span className="text-xs text-ink-soft block">In-Transit / Scheduled Cash</span>
              <span className="text-lg font-mono font-semibold text-amber-600">{formatINR(cashInTransit)}</span>
              <span className="text-[11px] text-ink-faint block mt-0.5">Pending completion on road</span>
            </div>
          </div>

          <Table>
            <THead>
              <TRow>
                <TH>Ticket</TH>
                <TH>Customer</TH>
                <TH>Route / Corridor</TH>
                <TH>Vehicle</TH>
                <TH className="text-right">Total Fare</TH>
                <TH className="text-right">28% Online</TH>
                <TH className="text-right">72% Cash Due</TH>
                <TH>Trip Status</TH>
                <TH>Chauffeur Audit</TH>
              </TRow>
            </THead>
            <TBody>
              {activeBookings.map((b, idx) => {
                const isCompleted = b.status === "completed";
                const isInTransit = b.status === "in_transit" || b.status === "driver_assigned";
                const isScheduled = b.status === "paid_confirmed" || b.status === "confirmed";

                return (
                  <TRow key={b.id || idx}>
                    <TD className="font-mono text-[12px] font-medium">{b.ticketId}</TD>
                    <TD className="text-[13px]">
                      <span className="font-medium text-ink block">{b.customerName}</span>
                      <span className="text-[11px] text-ink-faint block font-mono">{b.customerPhone}</span>
                    </TD>
                    <TD className="text-[12px] text-ink-soft max-w-48 truncate">
                      {b.origin} → {b.destination}
                    </TD>
                    <TD className="text-[12px] capitalize font-mono text-ink-soft">{b.vehicleTier}</TD>
                    <TD className="text-right font-mono text-[12px] font-medium">{formatINR(b.fare.totalFare)}</TD>
                    <TD className="text-right font-mono text-[12px] text-success font-medium">{formatINR(b.fare.advancePaid)}</TD>
                    <TD className="text-right font-mono text-[12px] font-bold text-amber-700">{formatINR(b.fare.balancePayable)}</TD>
                    <TD><StatusBadge status={b.status} /></TD>
                    <TD>
                      {isCompleted ? (
                        <Badge tone="success" className="text-[11px]">Reconciled</Badge>
                      ) : isInTransit ? (
                        <Badge tone="gold" className="text-[11px]">Collection Due</Badge>
                      ) : isScheduled ? (
                        <Badge tone="neutral" className="text-[11px]">Scheduled</Badge>
                      ) : (
                        <Badge tone="neutral" className="text-[11px]">Pending</Badge>
                      )}
                    </TD>
                  </TRow>
                );
              })}
            </TBody>
          </Table>

          {activeBookings.length === 0 && (
            <div className="p-8 text-center">
              <p className="font-display text-base text-ink">No active chauffeur cash journeys</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-ink-soft">
                Confirmed bookings with 72% cash balance payable will appear here for audit upon trip dispatch.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Refund dialog */}
      <Dialog
        open={refundTarget !== null && stage !== "done"}
        onClose={() => setRefundTarget(null)}
        title="Execute refund"
        description={refundTarget ? `${refundTarget.bookingTicketId} · ${formatINR(refundTarget.amount)} via ${refundTarget.provider}` : undefined}
      >
        {stage === "form" && refundTarget && (
          <div className="space-y-4">
            {refundError && (
              <div
                className="flex items-start gap-2.5 rounded-md border border-error/20 bg-error-soft p-3 text-[13px] text-error"
                role="alert"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-snug">{refundError}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="refund-amount">Amount (₹)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  min={0}
                  max={refundTarget.amount}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Idempotency key</Label>
                <Input value={idemKey} readOnly className="bg-surface-2 font-mono text-[12px]" />
              </div>
            </div>
            <div>
              <Label htmlFor="refund-reason">Reason (mandatory)</Label>
              <Input
                id="refund-reason"
                placeholder="e.g. duplicate gateway capture"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <p className="rounded-sm bg-gold-soft p-3 text-[12px] leading-relaxed text-gold-text">
              This triggers the {refundTarget.provider === "razorpay" ? "Razorpay Refund API" : "PayPal Payout API"} and
              transitions the booking to <span className="font-mono">refunded</span> atomically. This action is
              irreversible and audit-logged.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRefundTarget(null)}>Cancel</Button>
              <Button variant="destructive" disabled={amount <= 0 || amount > refundTarget.amount || reason.trim().length < 4} onClick={executeRefund}>
                Refund {formatINR(amount || 0)}
              </Button>
            </div>
          </div>
        )}
        {stage === "processing" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <motion.span
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              className="text-gold"
            >
              <RefreshCw className="h-6 w-6" />
            </motion.span>
            <p className="text-sm text-ink-soft">Calling payment gateway… (max 8 s)</p>
          </div>
        )}
      </Dialog>

      {/* Success dialog */}
      <Dialog open={stage === "done"} onClose={() => { setRefundTarget(null); setStage("form"); }} title="Refund settled">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <motion.span
            initial={reduce ? { opacity: 1 } : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 16 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success"
          >
            <CheckCircle2 className="h-7 w-7" />
          </motion.span>
          <p className="font-display text-lg font-medium text-ink">
            {formatINR(amount)} refunded to customer
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed text-ink-soft">
            Payment marked <span className="font-mono">refunded</span>, booking{" "}
            <span className="font-mono">{refundTarget?.bookingTicketId}</span> updated, audit record written.
          </p>
          <Button variant="gold" className="mt-2" onClick={() => { setRefundTarget(null); setStage("form"); }}>
            Done
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
