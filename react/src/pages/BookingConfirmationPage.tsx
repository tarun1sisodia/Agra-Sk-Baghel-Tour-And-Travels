import { useEffect, useState, useRef, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Printer,
  Phone,
  MessageCircle,
  Calendar,
  MapPin,
  Car,
  User,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { fetchBookingById, createBookingPayment } from "../services/cleanFareApi";
import { loadRazorpayScript } from "../features/booking/razorpay";
import { contact } from "../data/contact";
import type { BookingDetailResponse } from "../contracts/fare-system";
import { useCustomerAuth } from "../auth/customerAuth";

function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return isoString;
  }
}

export function BookingConfirmationPage() {
  const { accessToken } = useCustomerAuth();
  const [bookingId, setBookingId] = useState<string>("");
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const pollCountRef = useRef(0);

  // Read ID and optional token from URL params or sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("id") || params.get("booking_id") || params.get("bookingId");
    const lastId = sessionStorage.getItem("arenaai:last_booking_id");
    const resolvedId = idFromUrl || lastId || "";
    setBookingId(resolvedId);

    const tokenFromUrl = params.get("token");
    if (tokenFromUrl && resolvedId) {
      sessionStorage.setItem(`arenaai:guest_token:${resolvedId}`, tokenFromUrl);
    }
  }, []);

  const loadBooking = useCallback(
    async (isPolling = false) => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      if (!isPolling) {
        setLoading(true);
        setError(null);
      } else {
        setPolling(true);
      }

      try {
        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const guestToken =
          sessionStorage.getItem(`arenaai:guest_token:${bookingId}`) ||
          params?.get("token") ||
          undefined;

        const data = await fetchBookingById(bookingId, guestToken, accessToken);
        setBooking(data);

        // If payment is pending and we're polling, keep polling for up to 6 cycles (15s)
        const isPaid =
          data.payment_status === "paid" ||
          data.payment_status === "captured" ||
          data.payment_status === "confirmed" ||
          data.status === "paid_confirmed" ||
          data.status === "confirmed" ||
          data.status === "driver_assigned" ||
          data.status === "in_transit" ||
          data.status === "completed";
        if (!isPaid && pollCountRef.current < 6) {
          pollCountRef.current += 1;
          setTimeout(() => {
            void loadBooking(true);
          }, 2500);
        } else {
          setPolling(false);
        }
      } catch (err: any) {
        if (!isPolling) {
          setError(
            err.message ||
              "Could not retrieve booking details. Please verify your reference or contact the travel desk."
          );
        }
        setPolling(false);
      } finally {
        if (!isPolling) setLoading(false);
      }
    },
    [bookingId]
  );

  useEffect(() => {
    if (bookingId) {
      pollCountRef.current = 0;
      void loadBooking(false);
    }
  }, [bookingId, loadBooking]);

  // Handle Pay Now for pending/failed bookings
  const handlePayNow = async () => {
    if (!booking) return;
    setPayBusy(true);
    try {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const guestToken =
        sessionStorage.getItem(`arenaai:guest_token:${booking.booking_id}`) ||
        params?.get("token") ||
        undefined;
      const paymentRes = await createBookingPayment(booking.booking_id, guestToken, accessToken);
      const ready = await loadRazorpayScript();
      if (!ready || !window.Razorpay) {
        throw new Error("Unable to initialize payment gateway. Please check your connection.");
      }

      const rzp = new window.Razorpay({
        key: paymentRes.key_id,
        order_id: paymentRes.order_id,
        amount: paymentRes.amount_paise,
        currency: "INR",
        name: "SK Baghel Tour & Travels",
        description: `Advance Deposit for ${booking.ticket_id}`,
        prefill: {
          name: booking.customer_name,
          contact: booking.customer_phone,
          email: booking.customer_email || undefined,
        },
        theme: { color: "#9F3C16" },
        handler: () => {
          pollCountRef.current = 0;
          void loadBooking(true);
        },
        modal: {
          ondismiss: () => {
            setPayBusy(false);
          },
        },
      });
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Could not launch checkout. Please contact the desk.");
    } finally {
      setPayBusy(false);
    }
  };

  const isPaid =
    booking?.payment_status === "paid" ||
    booking?.payment_status === "captured" ||
    booking?.payment_status === "confirmed" ||
    booking?.status === "paid_confirmed" ||
    booking?.status === "confirmed" ||
    booking?.status === "driver_assigned" ||
    booking?.status === "in_transit" ||
    booking?.status === "completed";

  const whatsappMsg = booking
    ? encodeURIComponent(
        `Hi SK Baghel Tour & Travels, I am inquiring about my booking ${booking.ticket_id} (${booking.product_name}).`
      )
    : encodeURIComponent("Hi SK Baghel Tour & Travels, I have a query about my booking.");

  if (loading) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center bg-surface px-4 py-16">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-on-surface-variant">
            Retrieving authoritative booking voucher…
          </p>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center bg-surface px-4 py-16">
        <div className="max-w-md w-full rounded-2xl border border-border-warm bg-surface-container-lowest p-8 text-center shadow-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-terracotta-sandstone" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-ink-midnight">
            Booking Details Unavailable
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {error || "No booking record found for the provided reference."}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href="/book.html"
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm hover:bg-terracotta-sunlit transition-colors text-center"
            >
              Start New Reservation
            </a>
            <a
              href={`https://wa.me/${contact.whatsapp}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-xl border border-border-warm py-2.5 text-sm font-semibold text-ink-midnight hover:bg-sandstone-wash transition-colors text-center"
            >
              Contact Travel Desk via WhatsApp
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-surface px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Status Banner */}
        <div
          className={`rounded-2xl p-6 sm:p-8 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isPaid
              ? "bg-emerald-50/80 border-emerald-200"
              : "bg-amber-50/80 border-amber-200"
          }`}
        >
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`p-3 rounded-full shrink-0 ${
                isPaid ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
              }`}
            >
              {isPaid ? (
                <CheckCircle2 className="h-7 w-7" />
              ) : (
                <Clock className="h-7 w-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  TICKET: {booking.ticket_id}
                </span>
                {polling && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-primary animate-pulse">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Verifying…
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-midnight mt-0.5">
                {isPaid ? "Booking Confirmed & Guaranteed" : "Advance Deposit Required"}
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                {isPaid
                  ? "Your 28% advance deposit has been verified. Chauffeur custody is locked."
                  : "Your journey reservation is created. Complete 28% advance to finalize chauffeur custody."}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
            {!isPaid && (
              <button
                type="button"
                disabled={payBusy}
                onClick={handlePayNow}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-terracotta-sunlit transition-all cursor-pointer disabled:opacity-50"
              >
                {payBusy ? "Connecting…" : `Pay Advance ${formatINR(booking.advance_amount)}`}
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-warm bg-surface-container-lowest px-3.5 py-2 text-xs font-semibold text-ink-midnight hover:bg-sandstone-wash transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print Voucher
            </button>
          </div>
        </div>

        {/* Voucher Container */}
        <div className="mt-8 rounded-2xl border border-border-warm bg-surface-container-lowest p-6 sm:p-8 shadow-md">
          {/* Header Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-warm/60 pb-6">
            <div>
              <span className="text-xs font-label-caps uppercase tracking-widest text-primary font-bold">
                Official Chauffeur Booking Voucher
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-midnight mt-1">
                {booking.product_name}
              </h2>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs uppercase text-on-surface-variant">
                Payment Status
              </span>
              <p
                className={`font-mono text-sm font-bold uppercase ${
                  isPaid ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {booking.payment_status.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-border-warm/60">
            {/* Travel Details */}
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Journey Schedule
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Pickup Date & Time:</span>
                  <span className="font-semibold text-ink-midnight">
                    {formatDate(booking.pickup_at)}
                  </span>
                </div>
                {booking.return_at && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Return Schedule:</span>
                    <span className="font-semibold text-ink-midnight">
                      {formatDate(booking.return_at)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Vehicle Class:</span>
                  <span className="font-semibold text-ink-midnight">
                    {booking.vehicle_model.display_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Passengers:</span>
                  <span className="font-semibold text-ink-midnight">
                    {booking.passenger_count} Passenger(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Passenger & Pickup Location */}
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Pickup & Passenger Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Lead Passenger:</span>
                  <span className="font-semibold text-ink-midnight">
                    {booking.customer_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Contact Phone:</span>
                  <span className="font-semibold text-ink-midnight font-mono">
                    {booking.customer_phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Pickup Location:</span>
                  <span className="font-semibold text-ink-midnight text-right max-w-xs">
                    {booking.pickup_address}
                  </span>
                </div>
                {booking.drop_address && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Drop Location:</span>
                    <span className="font-semibold text-ink-midnight text-right max-w-xs">
                      {booking.drop_address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Authoritative Financial Breakdown */}
          <div className="pt-6">
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Authoritative Tariff Breakdown
            </h3>

            <div className="rounded-xl bg-sandstone-wash/40 p-5 space-y-2.5 text-sm">
              {booking.fare_breakdown.lines.map((line, idx) => (
                <div key={idx} className="flex justify-between text-on-surface-variant">
                  <span>{line.label}</span>
                  <span className="font-mono">{formatINR(line.amount)}</span>
                </div>
              ))}

              <div className="border-t border-border-warm/60 pt-2 flex justify-between font-bold text-base text-ink-midnight">
                <span>Total Guaranteed Fare:</span>
                <span className="font-mono text-primary">{formatINR(booking.total_amount)}</span>
              </div>

              <div className="flex justify-between text-sm font-semibold text-emerald-800">
                <span>Advance Deposit (28% {isPaid ? "Paid" : "Payable"}):</span>
                <span className="font-mono">{formatINR(booking.advance_amount)}</span>
              </div>

              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Balance Payable at Drop-off (72%):</span>
                <span className="font-mono">{formatINR(booking.balance_amount)}</span>
              </div>
            </div>
          </div>

          {/* Concierge & Support Footer */}
          <div className="mt-8 border-t border-border-warm/60 pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-on-surface-variant">
              <p className="font-semibold text-ink-midnight">SK Baghel Tour & Travels 24/7 Concierge</p>
              <p>Chauffeur and car number details are dispatched via SMS/WhatsApp prior to departure.</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border-warm px-3 py-2 text-xs font-semibold text-ink-midnight hover:bg-sandstone-wash transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-primary" /> Call {contact.phoneDisplay}
              </a>
              <a
                href={`https://wa.me/${contact.whatsapp}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default BookingConfirmationPage;
