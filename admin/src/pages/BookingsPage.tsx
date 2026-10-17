import { useEffect, useMemo, useState } from "react";
import {
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  Phone,
  Plus,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Select } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import { AlertTriangle, RotateCw } from "lucide-react";
import { LocationAutocompleteInput } from "@/components/admin/LocationAutocompleteInput";
import { createAdminBooking, fetchAdminBookings, transitionAdminBooking, unmaskAdminBooking } from "@/lib/api";
import { VEHICLE_LABELS, can, type AdminUser, type Booking, type BookingStatus } from "@/lib/types";
import { cn, formatDate, formatINR, maskEmail, maskPhone, timeAgo } from "@/lib/utils";

const STATUSES: (BookingStatus | "all")[] = [
  "all",
  "pending_payment",
  "paid_confirmed",
  "in_transit",
  "completed",
  "cancelled",
  "refunded",
];

function bookingTitle(booking: Booking): string {
  const selection = booking.bookingSelection;
  if (selection?.kind === "outstation") return selection.name || `${selection.originName} → ${selection.destinationName}`;
  if (selection?.name) return selection.name;
  if (selection?.kind === "package") return `Tour package: ${selection.slug.replaceAll("-", " ")}`;
  if (selection?.kind === "local") return "Local service";
  if (booking.origin && booking.destination) return `${booking.origin} → ${booking.destination}`;
  return "Trip details unavailable";
}

function bookingSubtitle(booking: Booking): string {
  const selection = booking.bookingSelection;
  if (selection?.kind === "outstation") return `${selection.originName} → ${selection.destinationName} · ${selection.tripType.replaceAll("-", " ")}`;
  if (selection?.kind === "local") return `Pickup: ${selection.pickupLocation} · ${selection.tripType.replaceAll("-", " ")} · ID ${selection.id}`;
  if (selection?.kind === "package") return `Tour package · ${selection.slug.replaceAll("-", " ")} · ID ${selection.id}`;
  if (booking.origin && booking.destination) return `${booking.origin} → ${booking.destination}`;
  return "Confirmed booking";
}

/** Valid staff transitions per TRD §4.1 state machine */
const TRANSITIONS: Partial<Record<BookingStatus, { to: BookingStatus; label: string; tone: "gold" | "default" | "destructive" | "outline" }[]>> = {
  paid_confirmed: [
    { to: "in_transit", label: "Start trip", tone: "gold" },
    { to: "completed", label: "Mark completed", tone: "default" },
    { to: "cancelled", label: "Cancel booking", tone: "destructive" },
  ],
  in_transit: [{ to: "completed", label: "Complete trip", tone: "default" }],
};

export function BookingsPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [vehicle, setVehicle] = useState("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [unmasked, setUnmasked] = useState(false);
  const [unmaskedData, setUnmaskedData] = useState<{ customerPhone: string; customerEmail: string | null } | null>(null);
  const [unmasking, setUnmasking] = useState(false);
  const [unmaskError, setUnmaskError] = useState<string | null>(null);

  // Unmask state is cleared when drawer closes or selection changes
  useEffect(() => {
    setUnmasked(false);
    setUnmaskedData(null);
    setUnmasking(false);
    setUnmaskError(null);
  }, [selected?.id]);

  // New Booking Modal State
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
  const dayAfterTomorrow = new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [newForm, setNewForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    tripType: "one-way" as "one-way" | "round-trip",
    originName: "Agra",
    destinationName: "Delhi Airport",
    pickupAddress: "",
    dropAddress: "",
    pickupDate: tomorrow,
    pickupTime: "10:00",
    returnDate: dayAfterTomorrow,
    returnTime: "10:00",
    specialNotes: "",
  });

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const dt = new Date(`${newForm.pickupDate}T${newForm.pickupTime}:00`);
      if (isNaN(dt.getTime()) || dt.getTime() < Date.now() + 50 * 60 * 1000) {
        throw new Error("Pickup datetime must be at least 1 hour in the future.");
      }
      let returnDatetime: string | undefined;
      if (newForm.tripType === "round-trip") {
        const returnDt = new Date(`${newForm.returnDate}T${newForm.returnTime}:00`);
        if (isNaN(returnDt.getTime()) || returnDt.getTime() <= dt.getTime()) {
          throw new Error("Return datetime must be after pickup for a round-trip booking.");
        }
        returnDatetime = returnDt.toISOString();
      }

      const res = await createAdminBooking({
        customerName: newForm.customerName.trim(),
        customerPhone: newForm.customerPhone.trim(),
        customerEmail: newForm.customerEmail.trim() || undefined,
        tripType: newForm.tripType,
        originName: newForm.originName.trim(),
        destinationName: newForm.destinationName.trim(),
        pickupAddress: newForm.pickupAddress.trim(),
        dropAddress: newForm.dropAddress.trim() || newForm.destinationName.trim(),
        pickupDatetime: dt.toISOString(),
        returnDatetime,
        specialNotes: newForm.specialNotes.trim() || undefined,
      });

      setCreateSuccess(`Manual booking registered! Ticket ID: ${res?.ticketId || "Created"}`);
      setReloadKey((k) => k + 1);
      setTimeout(() => {
        setIsNewBookingOpen(false);
        setCreateSuccess(null);
        setNewForm({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          tripType: "one-way",
          originName: "Agra",
          destinationName: "Delhi Airport",
          pickupAddress: "",
          dropAddress: "",
          pickupDate: tomorrow,
          pickupTime: "10:00",
          returnDate: dayAfterTomorrow,
          returnTime: "10:00",
          specialNotes: "",
        });
      }, 1500);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create booking.");
    } finally {
      setCreating(false);
    }
  };

  const canRead = can(user.role, "bookings:read");
  const canTransition = can(user.role, "bookings:transition");
  const canUnmask = can(user.role, "bookings:unmask");

  const handleToggleUnmask = async () => {
    if (!selected) return;
    if (unmasked) {
      setUnmasked(false);
      setUnmaskedData(null);
      setUnmaskError(null);
      return;
    }

    setUnmasking(true);
    setUnmaskError(null);
    try {
      const res = await unmaskAdminBooking(selected.id);
      setUnmaskedData({
        customerPhone: res.customerPhone,
        customerEmail: res.customerEmail,
      });
      setUnmasked(true);
    } catch (err) {
      setUnmasked(false);
      setUnmaskedData(null);
      setUnmaskError(err instanceof Error ? err.message : "Failed to unmask customer PII.");
    } finally {
      setUnmasking(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoadError(null);
    fetchAdminBookings({
      status: status as BookingStatus | "all",
    })
      .then((data) => {
        if (isMounted) {
          setBookings(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setBookings([]);
          setLoadError(err instanceof Error ? err.message : "Could not load bookings from the backend.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [status, reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (vehicle !== "all" && b.vehicleTier !== vehicle) return false;
      if (
        q &&
        !b.ticketId.toLowerCase().includes(q) &&
        !b.customerName.toLowerCase().includes(q) &&
        !b.customerPhone.includes(q)
      )
        return false;
      return true;
    });
  }, [bookings, query, status, vehicle]);

  const tabs = STATUSES.map((s) => ({
    value: s,
    label: s === "all" ? "All" : s.replace("_", " "),
    count: s === "all" ? bookings.length : bookings.filter((b) => b.status === s).length,
  }));

  async function transition(b: Booking, to: BookingStatus) {
    setActionError(null);
    try {
      await transitionAdminBooking(b.id, to, b.version);
      const next = { ...b, status: to, version: b.version + 1 };
      setBookings((prev) => prev.map((item) => (item.id === b.id ? next : item)));
      setSelected(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Booking update failed on the backend.";
      setActionError(`Could not update ${b.ticketId}: ${message}`);
    }
  }

  if (!canRead) {
    return (
      <div>
        <PageHeader eyebrow="Access" title="Booking Operations" />
        <Card className="p-10 text-center">
          <Lock className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 font-display text-lg text-ink">Your role cannot view bookings</p>
          <p className="mt-1 text-sm text-ink-soft">
            The <code className="font-mono">bookings:read</code> permission requires dispatcher,
            finance_operator or super_admin.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Lifecycle"
        title="Booking Operations"
        description="Search by ticket ID (AGR-YYYYMMDD-XXXX), phone or customer name. Status changes use optimistic version locking."
        actions={
          canTransition ? (
            <Button variant="gold" size="sm" onClick={() => setIsNewBookingOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Booking
            </Button>
          ) : undefined
        }
      />

      {/* Toolbar */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              className="pl-9"
              placeholder="Ticket, phone or customer…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search bookings"
            />
          </div>
          <div className="w-44">
            <Select value={vehicle} onChange={(e) => setVehicle(e.target.value)} aria-label="Filter by vehicle">
              <option value="all">All vehicles</option>
              {Object.entries(VEHICLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <Tabs items={tabs} value={status} onChange={setStatus} />
        </div>
      </Card>

      {/* Table */}
      {loadError && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{loadError}</span>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            <RotateCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}
      {actionError && (
        <div
          className="mb-4 flex items-start gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="rounded-sm p-1 hover:bg-error/10"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TRow>
              <TH>Ticket</TH>
              <TH>Customer</TH>
              <TH>Trip / Route</TH>
              <TH>Pickup</TH>
              <TH>Vehicle</TH>
              <TH className="text-right">Total</TH>
              <TH>Status</TH>
              <TH className="text-right">Ver</TH>
            </TRow>
          </THead>
          <TBody>
            {filtered.map((b, i) => (
              <motion.tr
                key={b.id}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  setSelected(b);
                  setUnmasked(false);
                }}
                className="cursor-pointer transition-colors hover:bg-gold-wash/60"
              >
                <TD>
                  <span className="font-mono text-[13px] font-medium text-ink">{b.ticketId}</span>
                </TD>
                <TD>
                  <span className="block text-[13px] font-medium text-ink">{b.customerName}</span>
                  <span className="block font-mono text-[11px] text-ink-faint">{maskPhone(b.customerPhone)}</span>
                </TD>
                <TD>
                  <span className="flex items-start gap-1.5 text-[13px] text-ink">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    <span className="min-w-0"><span className="block font-medium">{bookingTitle(b)}</span><span className="block max-w-[240px] truncate text-[11px] text-ink-faint">{bookingSubtitle(b)}</span></span>
                  </span>
                </TD>
                <TD className="whitespace-nowrap font-mono text-[12px] text-ink-soft">
                  {formatDate(b.pickupDateTime)}
                </TD>
                <TD>
                  <span className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                    <Car className="h-3.5 w-3.5 text-ink-faint" />
                    {(VEHICLE_LABELS as Record<string, string>)[b.vehicleTier] ?? b.vehicleTier}
                  </span>
                </TD>
                <TD className="whitespace-nowrap text-right font-mono text-[13px] font-medium text-ink">
                  {formatINR(b.fare.totalFare)}
                </TD>
                <TD><StatusBadge status={b.status} /></TD>
                <TD className="w-8 text-right font-mono text-[11px] text-ink-faint">v{b.version}</TD>
              </motion.tr>
            ))}
          </TBody>
        </Table>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="font-display text-lg text-ink">
              {bookings.length === 0 && !loadError ? "No bookings yet" : "No bookings match the current filters"}
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
              {bookings.length === 0 && !loadError
                ? "Bookings created on the customer site appear here in real time once the backend is connected."
                : "Try a different search term, status tab or vehicle filter."}
            </p>
          </div>
        )}
      </Card>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
              onClick={() => setSelected(null)}
            />
            <motion.aside
              key="panel"
              role="dialog"
              aria-label={`Booking ${selected.ticketId}`}
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-hairline bg-surface"
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-hairline bg-surface/95 px-6 py-4 backdrop-blur">
                <div>
                  <Badge tone="gold" className="mb-1.5">{selected.ticketId}</Badge>
                  <h2 className="font-display text-xl font-medium tracking-tight text-ink">
                    {bookingTitle(selected)}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-ink-soft">{bookingSubtitle(selected)}</p>
                  <p className="mt-0.5 text-[13px] text-ink-soft">
                    {(VEHICLE_LABELS as Record<string, string>)[selected.vehicleTier] ?? selected.vehicleTier} · {selected.distanceKm} km · created {timeAgo(selected.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="rounded-sm p-2 text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6 px-6 py-5">
                {/* Status + transitions */}
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Status · v{selected.version}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selected.status} />
                    <AnimatePresence mode="popLayout">
                      {canTransition && TRANSITIONS[selected.status]?.map((t) => (
                        <motion.div
                          key={t.to}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <Button variant={t.tone} size="sm" onClick={() => transition(selected, t.to)}>
                            {t.label}
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {!canTransition && (
                    <p className="mt-2 text-[12px] text-ink-faint">
                      Your role can view but not transition this booking.
                    </p>
                  )}
                </div>

                {/* Customer */}
                <div className="rounded-sm border border-hairline bg-bg-alt p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Customer</p>
                    {canUnmask ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleUnmask}
                        disabled={unmasking}
                        aria-pressed={unmasked}
                      >
                        {unmasking ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
                            <RotateCw className="h-3 w-3 animate-spin" /> Auditing...
                          </span>
                        ) : (
                          <>
                            {unmasked ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {unmasked ? "Mask PII" : "Unmask (audited)"}
                          </>
                        )}
                      </Button>
                    ) : (
                      <Badge tone="neutral"><Lock className="h-3 w-3" /> PII locked</Badge>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5 text-[13px]">
                    <p className="font-medium text-ink">{selected.customerName}</p>
                    <p className="flex items-center gap-2 font-mono text-[12px] text-ink-soft">
                      <Phone className="h-3.5 w-3.5 text-gold" />
                      <span data-testid="customer-phone">
                        {unmasked && unmaskedData ? unmaskedData.customerPhone : maskPhone(selected.customerPhone)}
                      </span>
                    </p>
                    <p className="font-mono text-[12px] text-ink-soft">
                      <span data-testid="customer-email">
                        {unmasked && unmaskedData
                          ? (unmaskedData.customerEmail || "—")
                          : (selected.customerEmail ? maskEmail(selected.customerEmail) : "—")}
                      </span>
                    </p>
                    {unmaskError && (
                      <p className="text-[12px] text-destructive" role="alert" data-testid="unmask-error">
                        {unmaskError}
                      </p>
                    )}
                    {unmasked && unmaskedData && (
                      <p className="text-[11px] italic text-gold-text" data-testid="unmask-audit-notice">
                        Unmasked view recorded in audit trail as BOOKING_UNMASK_VIEWED.
                      </p>
                    )}
                  </div>
                </div>

                {/* Itinerary */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Pickup", value: formatDate(selected.pickupDateTime) },
                    { label: "Return", value: selected.returnDateTime ? formatDate(selected.returnDateTime) : "One-way" },
                    { label: "Trip type", value: selected.tripType.replace("-", " ") },
                    { label: "Est. distance", value: `${selected.distanceKm} km` },
                  ].map((f) => (
                    <div key={f.label} className="rounded-sm border border-hairline p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{f.label}</p>
                      <p className="mt-1 text-[13px] font-medium capitalize text-ink">{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* Fare snapshot */}
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                    Fare snapshot · engine-locked
                  </p>
                  <div className="overflow-hidden rounded-sm border border-hairline">
                    {[
                      ["Base fare", selected.fare.baseFare],
                      ["Night allowance", selected.fare.nightAllowance],
                      ["Driver allowance", selected.fare.driverAllowance],
                      ["Tolls & taxes", selected.fare.tollsTaxes],
                      ["Promo discount", -selected.fare.promoDiscount],
                    ].map(([label, val], i) => (
                      <div key={label as string} className={cn("flex items-center justify-between px-4 py-2.5 text-[13px]", i > 0 && "border-t border-hairline")}>
                        <span className="text-ink-soft">{label}</span>
                        <span className={cn("font-mono", (val as number) < 0 ? "text-success" : "text-ink")}>
                          {(val as number) < 0 ? "− " : ""}{formatINR(Math.abs(val as number))}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t-2 border-gold-border bg-gold-soft px-4 py-3">
                      <span className="text-sm font-semibold text-gold-text">Total fare</span>
                      <span className="font-display text-lg font-semibold text-gold-text">{formatINR(selected.fare.totalFare)}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-sm bg-success-soft p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-success">Advance paid</p>
                      <p className="mt-0.5 text-sm font-semibold text-success">{formatINR(selected.fare.advancePaid)}</p>
                    </div>
                    <div className="rounded-sm bg-gold-soft p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold-text">Balance at drop</p>
                      <p className="mt-0.5 text-sm font-semibold text-gold-text">{formatINR(selected.fare.balancePayable)}</p>
                    </div>
                  </div>
                </div>

                {selected.notes && (
                  <div>
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Notes</p>
                    <p className="rounded-sm border border-hairline bg-bg-alt p-3 text-[13px] leading-relaxed text-ink-soft">
                      {selected.notes}
                    </p>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* New Booking Modal */}
      <Dialog
        open={isNewBookingOpen}
        onClose={() => !creating && setIsNewBookingOpen(false)}
        title="Create Desk / Phone Booking"
        description="Register a walk-in, phone, or manual dispatch reservation. Authoritative fares, advance deposit, and ticket ID will be generated by the backend."
        className="h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[88vh] rounded-none sm:rounded-md max-w-xl"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          {createError && (
            <div className="flex items-start gap-2 rounded-md bg-error-soft px-3 py-2.5 text-xs text-error" role="alert">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="flex-1">{createError}</span>
            </div>
          )}

          {createSuccess && (
            <div className="flex items-start gap-2 rounded-md bg-teal-soft px-3 py-2.5 text-xs text-teal-text" role="status">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="flex-1">{createSuccess}</span>
            </div>
          )}

          <div className="rounded-lg border border-gold/20 bg-gold-wash/30 p-3 text-xs text-ink-soft">
            <span className="font-semibold text-ink">Zero Client Trust:</span> The fare engine will compute authoritative distance and fare breakdown automatically based on active fare rules.
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Customer Full Name *</label>
              <Input
                required
                placeholder="e.g. Ramesh Kumar"
                value={newForm.customerName}
                onChange={(e) => setNewForm((f) => ({ ...f, customerName: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Phone Number (10–14 digits) *</label>
              <Input
                required
                type="tel"
                placeholder="+919876543210"
                value={newForm.customerPhone}
                onChange={(e) => setNewForm((f) => ({ ...f, customerPhone: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Customer Email (Optional)</label>
            <Input
              type="email"
              placeholder="customer@example.com"
              value={newForm.customerEmail}
              onChange={(e) => setNewForm((f) => ({ ...f, customerEmail: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Trip Type *</label>
              <Select
                value={newForm.tripType}
                onChange={(e) => setNewForm((f) => ({ ...f, tripType: e.target.value as any }))}
              >
                <option value="one-way">One-way Outstation</option>
                <option value="round-trip">Round-trip Outstation</option>
              </Select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="rounded-sm border border-hairline bg-surface-2 px-3 py-2 text-[12px] text-ink-soft">
                <span className="font-semibold text-ink">Vehicle:</span> Sedan — standard desk rate (assigned by backend)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LocationAutocompleteInput
              label="Pickup City / Landmark *"
              placeholder="e.g. Agra, Uttar Pradesh"
              value={newForm.originName}
              onChange={(val) => setNewForm((f) => ({ ...f, originName: val }))}
            />
            <LocationAutocompleteInput
              label="Destination City / Landmark *"
              placeholder="e.g. Indira Gandhi International Airport, New Delhi"
              value={newForm.destinationName}
              onChange={(val) => setNewForm((f) => ({ ...f, destinationName: val }))}
            />
          </div>

          <LocationAutocompleteInput
            label="Pickup Street Address *"
            placeholder="e.g. Hotel Clarks Shiraz, 54 Taj Road, Agra Cantt"
            value={newForm.pickupAddress}
            onChange={(val) => setNewForm((f) => ({ ...f, pickupAddress: val }))}
          />

          <LocationAutocompleteInput
            label="Drop Street Address (Optional)"
            placeholder="e.g. Terminal 3 Departures, IGI Airport, New Delhi"
            value={newForm.dropAddress}
            onChange={(val) => setNewForm((f) => ({ ...f, dropAddress: val }))}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Pickup Date *</label>
              <Input
                type="date"
                required
                value={newForm.pickupDate}
                onChange={(e) => setNewForm((f) => ({ ...f, pickupDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Pickup Time *</label>
              <Input
                type="time"
                required
                value={newForm.pickupTime}
                onChange={(e) => setNewForm((f) => ({ ...f, pickupTime: e.target.value }))}
              />
            </div>
          </div>

          {newForm.tripType === "round-trip" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Return Date *</label>
                <Input
                  type="date"
                  required
                  min={newForm.pickupDate}
                  value={newForm.returnDate}
                  onChange={(e) => setNewForm((f) => ({ ...f, returnDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Return Time *</label>
                <Input
                  type="time"
                  required
                  value={newForm.returnTime}
                  onChange={(e) => setNewForm((f) => ({ ...f, returnTime: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Special Instructions / Dispatch Notes</label>
            <Input
              placeholder="e.g. English speaking driver requested, child seat required"
              value={newForm.specialNotes}
              onChange={(e) => setNewForm((f) => ({ ...f, specialNotes: e.target.value }))}
            />
          </div>

          <div className="sticky bottom-0 z-10 -mx-5 -mb-4 mt-5 flex items-center justify-end gap-2 border-t border-hairline bg-surface/95 px-5 py-3 backdrop-blur">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] flex-1 sm:flex-initial"
              onClick={() => setIsNewBookingOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              className="min-h-[44px] flex-1 sm:flex-initial"
              disabled={creating}
            >
              {creating ? "Creating…" : "Register Booking"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
