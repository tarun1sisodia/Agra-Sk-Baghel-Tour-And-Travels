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
import {
  fetchBookingById,
  createBookingPayment,
  verifyBookingPayment,
  downloadBookingPdf,
} from "../services/cleanFareApi";
import { loadRazorpayScript } from "../features/booking/razorpay";
import {
  BookingPaymentCountdownModal,
  type CountdownStage,
} from "../features/booking/clean/BookingPaymentCountdownModal";
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
  const { user, accessToken, loading: authLoading, signInWithGoogle } = useCustomerAuth();
  const [bookingId, setBookingId] = useState<string>("");
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pollCountRef = useRef(0);

  const [countdownModal, setCountdownModal] = useState<{
    isOpen: boolean;
    stage: CountdownStage;
    ticketId?: string;
    advanceAmount?: number;
    totalAmount?: number;
    onCountdownComplete?: () => void;
  }>({
    isOpen: false,
    stage: "preparing_checkout",
  });

  // Read ID from URL params or sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("id") || params.get("booking_id") || params.get("bookingId");
    const lastId = sessionStorage.getItem("arenaai:last_booking_id");
    const resolvedId = idFromUrl || lastId || "";
    setBookingId(resolvedId);
  }, []);

  const loadBooking = useCallback(
    async (isPolling = false) => {
      if (!bookingId) {
        setLoading(false);
        return;
      }
      if (!accessToken) {
        if (!authLoading) setLoading(false);
        return;
      }

      if (!isPolling) {
        setLoading(true);
        setError(null);
      } else {
        setPolling(true);
      }

      try {
        const data = await fetchBookingById(bookingId, accessToken);
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
    [bookingId, accessToken, authLoading]
  );

  useEffect(() => {
    if (bookingId && accessToken) {
      pollCountRef.current = 0;
      void loadBooking(false);
    } else if (!authLoading && !accessToken) {
      setLoading(false);
    }
  }, [bookingId, accessToken, authLoading, loadBooking]);

  // Handle Pay Now for pending/failed bookings
  const handlePayNow = async () => {
    if (!booking) return;
    if (!accessToken) {
      alert("Please sign in to proceed with payment.");
      return;
    }
    setPayBusy(true);

    let rzpInstance: any = null;
    let countdownFinished = false;
    let setupFinished = false;
    let setupFailure: string | null = null;

    setCountdownModal({
      isOpen: true,
      stage: "preparing_checkout",
      advanceAmount: booking.advance_amount,
      totalAmount: booking.total_amount,
      ticketId: booking.ticket_id,
      onCountdownComplete: () => {
        countdownFinished = true;
        if (setupFinished) {
          if (rzpInstance) {
            setCountdownModal((prev) => ({ ...prev, isOpen: false }));
            setPayBusy(false);
            rzpInstance.open();
          } else if (setupFailure) {
            setCountdownModal((prev) => ({ ...prev, isOpen: false }));
            setPayBusy(false);
            alert(setupFailure);
          }
        }
      },
    });

    const onRazorpaySetupReady = (rzp: any) => {
      rzpInstance = rzp;
      setupFinished = true;
      if (countdownFinished) {
        setCountdownModal((prev) => ({ ...prev, isOpen: false }));
        setPayBusy(false);
        rzp.open();
      }
    };

    try {
      const paymentRes = await createBookingPayment(booking.booking_id, accessToken);
      const ready = await loadRazorpayScript();
      if (!ready || !window.Razorpay) {
        throw new Error("Unable to initialize payment gateway. Please check your connection.");
      }

      const rzp = new window.Razorpay({
        key: paymentRes.key_id,
        order_id: paymentRes.order_id,
        amount: paymentRes.amount_paise,
        currency: "INR",
        name: "Agra SK Baghel Tour & Travels",
        image: `${window.location.origin}/assets/brand/agra-sk-baghel-mark.svg`,
        description: `Advance Deposit for ${booking.ticket_id}`,
        prefill: {
          name: booking.customer_name,
          contact: booking.customer_phone,
          email: booking.customer_email || undefined,
        },
        theme: { color: "#9F3C16" },
        handler: (response: any) => {
          setCountdownModal({
            isOpen: true,
            stage: "verifying_payment",
            ticketId: booking.ticket_id,
            advanceAmount: booking.advance_amount,
            totalAmount: booking.total_amount,
            onCountdownComplete: () => {
              setCountdownModal((prev) => ({ ...prev, isOpen: false }));
              pollCountRef.current = 0;
              void loadBooking(true);
            },
          });

          if (response?.razorpay_payment_id && response?.razorpay_order_id && response?.razorpay_signature) {
            verifyBookingPayment(
              booking.booking_id,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
              accessToken
            ).catch((verifyErr) => {
              console.warn("Payment verification notification deferred to webhook:", verifyErr);
            });
          }
        },
        modal: {
          ondismiss: () => {
            setCountdownModal((prev) => ({ ...prev, isOpen: false }));
            setPayBusy(false);
          },
        },
      });

      onRazorpaySetupReady(rzp);
    } catch (err: any) {
      const msg = err.message || "Could not launch checkout. Please contact the desk.";
      setupFailure = msg;
      setupFinished = true;
      if (countdownFinished) {
        setCountdownModal((prev) => ({ ...prev, isOpen: false }));
        setPayBusy(false);
        alert(msg);
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (!booking) return;
    setDownloadingPdf(true);
    setPdfError(null);
    try {
      const targetId = booking.booking_id || bookingId;
      const blob = await downloadBookingPdf(targetId, accessToken || "");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${booking.ticket_id || "booking"}-voucher.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setPdfError(err?.message || "Could not generate PDF voucher. Please try Print Voucher.");
    } finally {
      setDownloadingPdf(false);
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
      `Hi Agra SK Baghel Tour & Travels, I am inquiring about my booking ${booking.ticket_id} (${booking.product_name}).`
    )
    : encodeURIComponent("Hi Agra SK Baghel Tour & Travels, I have a query about my booking.");

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

  if (!authLoading && !user) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center bg-surface px-4 py-16">
        <div className="max-w-md w-full rounded-2xl border border-hairline bg-surface p-8 text-center shadow-lg">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-ink">
            Sign In to View Reservation
          </h1>
          <p className="mt-2 text-xs text-ink-soft leading-relaxed">
            Booking vouchers and travel itineraries are protected. Please sign in with the account you used to book.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              id="btn-confirm-signin-google"
              onClick={() => void signInWithGoogle()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-surface py-3 text-xs font-semibold text-ink shadow-sm hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign In with Google
            </button>
          </div>
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
          className={`rounded-2xl p-6 sm:p-8 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isPaid
            ? "bg-emerald-50/80 border-emerald-200"
            : "bg-amber-50/80 border-amber-200"
            }`}
        >
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`p-3 rounded-full shrink-0 ${isPaid ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
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
              id="btn-download-pdf-voucher"
              disabled={downloadingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-surface-container-lowest px-3.5 py-2 text-xs font-semibold text-primary hover:bg-sandstone-wash transition-colors disabled:opacity-50 cursor-pointer"
            >
              {downloadingPdf ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {downloadingPdf ? "Generating PDF…" : "Download PDF Voucher"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-warm bg-surface-container-lowest px-3.5 py-2 text-xs font-semibold text-ink-midnight hover:bg-sandstone-wash transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" /> Print Voucher
            </button>
          </div>
        </div>

        {pdfError && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>{pdfError}</span>
            </div>
            <button
              type="button"
              onClick={() => setPdfError(null)}
              className="font-semibold text-amber-950 underline hover:no-underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

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
                className={`font-mono text-sm font-bold uppercase ${isPaid ? "text-emerald-700" : "text-amber-700"
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
              <p className="font-semibold text-ink-midnight">Agra SK Baghel Tour & Travels 24/7 Concierge</p>
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

      <BookingPaymentCountdownModal
        isOpen={countdownModal.isOpen}
        stage={countdownModal.stage}
        ticketId={countdownModal.ticketId}
        advanceAmount={countdownModal.advanceAmount}
        totalAmount={countdownModal.totalAmount}
        onCountdownComplete={() => {
          if (countdownModal.onCountdownComplete) {
            countdownModal.onCountdownComplete();
          }
        }}
        onDismiss={() => {
          setCountdownModal((prev) => ({ ...prev, isOpen: false }));
          setPayBusy(false);
        }}
      />
    </main>
  );
}

export default BookingConfirmationPage;
