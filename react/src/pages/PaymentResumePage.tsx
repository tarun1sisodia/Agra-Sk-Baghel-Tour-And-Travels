import { useEffect, useRef, useState } from "react";
import { useCustomerAuth, getCustomerDisplayName } from "../auth/customerAuth";
import { clearPaymentResumeReference, getPaymentResumeReference, storePaymentResumeReference } from "../auth/bookingIntentStorage";
import { createOwnerPaymentCheckout, getMyBooking, getOwnerPaymentStatus, verifyOwnerPayment, type CustomerBookingDetails, type PaymentCheckoutResponse } from "../services/customerAuthApi";
import { loadRazorpayScript } from "../features/booking/razorpay";

function makeKey(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}
function money(value: number): string { return `₹${Number(value || 0).toLocaleString("en-IN")}`; }
function bookingTitle(booking: CustomerBookingDetails): string {
  const selection = booking.bookingSelection;
  if (selection?.kind === "outstation") return selection.name || `${selection.originName} → ${selection.destinationName}`;
  if (selection?.name) return selection.name;
  if (selection?.kind === "package") return `Tour package: ${selection.slug.replaceAll("-", " ")}`;
  if (selection?.kind === "local") return "Local service";
  if (booking.originName && booking.destinationName) return `${booking.originName} → ${booking.destinationName}`;
  return booking.fare.label || "Trip details unavailable";
}
function bookingDetails(booking: CustomerBookingDetails): string {
  const selection = booking.bookingSelection;
  if (selection?.kind === "outstation") return `${selection.originName} → ${selection.destinationName}`;
  if (selection?.kind === "local") return `Pickup: ${selection.pickupLocation}${selection.transferTarget ? ` · To: ${selection.transferTarget}` : ""}`;
  if (selection?.kind === "package") return `Package ID: ${selection.id} · ${selection.slug}`;
  return booking.originName && booking.destinationName
    ? `${booking.originName} → ${booking.destinationName}`
    : booking.fare.label || "Confirmed booking";
}
function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

export function PaymentResumePage() {
  const { user, accessToken, loading: authLoading, configured, signInWithGoogle } = useCustomerAuth();
  const [reference, setReference] = useState(() => getPaymentResumeReference());
  const [confirmedBooking, setConfirmedBooking] = useState<CustomerBookingDetails | null>(null);
  const [status, setStatus] = useState("Preparing your secure payment…");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const started = useRef(false);

  const launchCheckout = async (checkout: PaymentCheckoutResponse, current: NonNullable<typeof reference>) => {
    if (checkout.checkoutUrl) {
      window.location.assign(checkout.checkoutUrl);
      return;
    }
    if (!checkout.providerOrderId) throw new Error("Razorpay did not return a checkout order. Your booking is saved; try again from My Bookings.");
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) throw new Error("Unable to load secure Razorpay Checkout. Check your connection or content blocker.");
    const key = checkout.publicClientToken || checkout.keyId;
    if (!key) throw new Error("The payment provider key is missing from the server response.");
    setStatus("Razorpay is ready. Complete payment in the secure checkout window.");
    const instance = new window.Razorpay({
      key,
      order_id: checkout.providerOrderId,
      amount: checkout.amountMinor,
      currency: checkout.currency || "INR",
      name: "Agra SK Baghel Tour and Travels",
      description: `Trip booking ${current.ticketId}`,
      image: `${window.location.origin}/assets/brand/agra-sk-baghel-mark.svg`,
      prefill: { name: getCustomerDisplayName(user), email: user?.email ?? undefined },
      theme: { color: "#8B1E1E" },
      modal: { ondismiss: () => { setBusy(false); setStatus("Checkout was closed. Your booking is still saved; you can reopen the same payment safely."); } },
      handler: async (response) => {
        setStatus("Payment submitted. Waiting for server-side confirmation…");
        try {
          const verified = await verifyOwnerPayment(current.bookingId, accessToken!, {
            providerOrderId: response.razorpay_order_id,
            providerPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          const isConfirmed = (s?: string) => s === "paid_confirmed" || s === "confirmed";
          if (verified.status === "captured" && isConfirmed(verified.bookingStatus)) {
            try { setConfirmedBooking(await getMyBooking(current.bookingId, accessToken!)); }
            catch { setError("Payment is verified. Your voucher details are not available yet; open My Bookings to retrieve them."); }
            clearPaymentResumeReference();
            setReference(null);
            setStatus("Payment verified. Your booking is confirmed.");
            setBusy(false);
            return;
          }
          for (let attempt = 0; attempt < 10; attempt += 1) {
            const result = await getOwnerPaymentStatus(current.bookingId, accessToken!);
            if (result.status === "captured" && isConfirmed(result.bookingStatus)) {
              try { setConfirmedBooking(await getMyBooking(current.bookingId, accessToken!)); }
              catch { setError("Payment is verified. Your voucher details are not available yet; open My Bookings to retrieve them."); }
              clearPaymentResumeReference();
              setReference(null);
              setStatus("Payment verified. Your booking is confirmed.");
              setBusy(false);
              return;
            }
            if (result.status === "failed" || result.status === "refunded") {
              setPaymentFailed(true);
              setBusy(false);
              setStatus("The payment was not completed. You can retry with a new payment attempt.");
              return;
            }
            await new Promise((resolve) => window.setTimeout(resolve, 1500));
          }
          setStatus("Razorpay returned successfully, but server verification is still pending. Do not pay again yet; check My Bookings shortly.");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not verify payment status yet. Do not pay again until status is checked.");
        } finally {
          setBusy(false);
        }
      },
    });
    instance.on("payment.failed", (response: any) => {
      setPaymentFailed(true);
      setBusy(false);
      setStatus(response?.error?.description ? `Payment failed: ${response.error.description}` : "Payment was not completed. You can retry from your account.");
    });
    instance.open();
  };

  const retryCheckout = (newAttempt: boolean) => {
    if (!reference || busy) return;
    const next = { ...reference, idempotencyKey: newAttempt ? makeKey() : reference.idempotencyKey, createdAt: Date.now() };
    storePaymentResumeReference(next);
    setReference(next);
    started.current = false;
    setError(null);
    setPaymentFailed(false);
    setStatus("Reopening your secure checkout…");
  };

  useEffect(() => {
    if (authLoading || !accessToken || !reference || started.current) return;
    started.current = true;
    setBusy(true);
    void getMyBooking(reference.bookingId, accessToken)
      .then((booking) => {
        if (booking.status === "paid_confirmed" || booking.status === "confirmed") {
          setConfirmedBooking(booking);
          clearPaymentResumeReference();
          setReference(null);
          setStatus("Payment verified. Your booking is confirmed.");
          return null;
        }
        return createOwnerPaymentCheckout(reference.bookingId, accessToken, reference.idempotencyKey)
          .then((checkout) => launchCheckout(checkout, reference));
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Could not load the authoritative booking.");
        setStatus("Booking verification failed. Payment has not been started; open My Bookings or retry later.");
      })
      .finally(() => setBusy(false));
    // This mount-driven launch is intentional: the OAuth redirect continues directly into Checkout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, accessToken, reference]);

  if (authLoading) return <main className="min-h-[65vh] p-8 grid place-items-center"><section className="text-center"><h1 className="text-2xl font-bold text-ink-midnight">Secure payment recovery</h1><p className="mt-2 text-on-surface-variant">Restoring your account and booking…</p></section></main>;
  if (!accessToken) return (
    <main className="min-h-[65vh] px-4 py-16 grid place-items-center">
      <section className="max-w-lg rounded-2xl border border-border-warm bg-surface-container-lowest p-8 text-center shadow-md">
        <h1 className="text-2xl font-bold text-ink-midnight">Sign in to continue payment</h1>
        <p className="mt-3 text-on-surface-variant">Your booking is saved. Sign in to reopen secure checkout and complete your payment.</p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" disabled={!configured} onClick={() => void signInWithGoogle("/payment/resume/").catch((cause) => setError(cause.message))} className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50 cursor-pointer shadow-xs">Continue with Google</button>
          <a href="/login?returnTo=/payment/resume/" className="text-xs text-on-surface-variant hover:text-primary transition-colors underline">Sign in with email & password</a>
        </div>
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
      </section>
    </main>
  );

  const canRetrySame = Boolean(reference && (error || status.includes("closed") || status.includes("not been started")) && !paymentFailed);
  return (
    <main className="min-h-[65vh] bg-surface px-4 py-12 sm:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-border-warm bg-surface-container-lowest p-6 text-center shadow-md sm:p-8">
        <p className="text-xs uppercase tracking-widest text-primary font-bold">Secure payment</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-midnight">Booking {confirmedBooking?.ticketId ?? reference?.ticketId ?? ""}</h1>
        <p className="mt-4 text-on-surface-variant" aria-live="polite">{status}</p>
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-left text-sm text-red-800" role="alert">{error}</p>}

        {confirmedBooking && (
          <div className="mt-6 rounded-xl border border-border-warm bg-surface-container-low p-5 text-left">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-warm pb-4">
              <div><p className="text-xs font-bold uppercase tracking-wide text-primary">Confirmed trip</p><h2 className="mt-1 text-xl font-bold text-ink-midnight">{bookingTitle(confirmedBooking)}</h2><p className="mt-1 text-sm text-on-surface-variant">{bookingDetails(confirmedBooking)}</p></div>
              <span className="rounded-full bg-success-jade/10 px-3 py-1 text-xs font-semibold uppercase text-success-jade">{confirmedBooking.status.replaceAll("_", " ")}</span>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-on-surface-variant">Pickup</dt><dd className="font-semibold text-ink-charcoal">{displayDate(confirmedBooking.pickupDatetime)}</dd></div>
              <div><dt className="text-on-surface-variant">Vehicle</dt><dd className="font-semibold capitalize text-ink-charcoal">{confirmedBooking.vehicleTier.replaceAll("-", " ")}</dd></div>
              <div><dt className="text-on-surface-variant">Pickup address</dt><dd className="font-semibold text-ink-charcoal">{confirmedBooking.pickupAddress}</dd></div>
              {confirmedBooking.dropAddress && <div><dt className="text-on-surface-variant">Drop address</dt><dd className="font-semibold text-ink-charcoal">{confirmedBooking.dropAddress}</dd></div>}
              <div><dt className="text-on-surface-variant">Total fare</dt><dd className="font-semibold text-ink-charcoal">{money(confirmedBooking.fare.totalFare)}</dd></div>
              <div><dt className="text-on-surface-variant">Advance paid</dt><dd className="font-semibold text-ink-charcoal">{money(confirmedBooking.fare.advanceAmount)}</dd></div>
              <div><dt className="text-on-surface-variant">Balance payable</dt><dd className="font-semibold text-ink-charcoal">{money(confirmedBooking.fare.balanceAmount)}</dd></div>
              {confirmedBooking.bookingSelection && <div><dt className="text-on-surface-variant">Selection reference</dt><dd className="break-all font-mono text-xs font-semibold text-ink-charcoal">{confirmedBooking.bookingSelection.id}</dd></div>}
            </dl>
          </div>
        )}

        {status.includes("confirmed") && <a href="/my-bookings/" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white">View My Bookings</a>}
        {canRetrySame && <button type="button" onClick={() => retryCheckout(false)} disabled={busy} className="mt-5 rounded-xl border border-primary px-5 py-3 font-semibold text-primary disabled:opacity-50">Reopen secure checkout</button>}
        {paymentFailed && <button type="button" onClick={() => retryCheckout(true)} disabled={busy} className="mt-5 rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">Retry payment</button>}
        {!reference && !confirmedBooking && <a href="/my-bookings/" className="mt-5 inline-flex rounded-xl border border-primary px-5 py-3 font-semibold text-primary">Return to My Bookings</a>}
      </section>
    </main>
  );
}

export default PaymentResumePage;
