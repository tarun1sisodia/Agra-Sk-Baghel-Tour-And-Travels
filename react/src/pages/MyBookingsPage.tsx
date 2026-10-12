import { useCallback, useEffect, useState } from "react";
import { useCustomerAuth } from "../auth/customerAuth";
import { storePaymentResumeReference } from "../auth/bookingIntentStorage";
import { listMyBookings, type CustomerBookingSummary } from "../services/customerAuthApi";

function makeKey(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}
function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
function money(value: number): string { return `₹${Number(value || 0).toLocaleString("en-IN")}`; }

function bookingTitle(booking: CustomerBookingSummary): string {
  const selection = booking.bookingSelection;
  if (selection?.kind === "outstation") return selection.name || `${selection.originName} → ${selection.destinationName}`;
  if (selection?.kind === "package") return selection.name || `Tour package: ${selection.slug.replaceAll("-", " ")}`;
  if (selection?.kind === "local") return selection.name || "Local service";
  if (booking.originName && booking.destinationName) return `${booking.originName} → ${booking.destinationName}`;
  return "Trip details unavailable";
}

function bookingSubtitle(booking: CustomerBookingSummary): string {
  const selection = booking.bookingSelection;
  if (selection?.kind === "outstation") return `${selection.originName} → ${selection.destinationName}`;
  if (selection?.kind === "local") return `Pickup: ${selection.pickupLocation}`;
  if (selection?.kind === "package") return `Package itinerary · ${selection.slug.replaceAll("-", " ")}`;
  if (booking.originName && booking.destinationName) return `${booking.originName} → ${booking.destinationName}`;
  return "Confirmed booking";
}

export function MyBookingsPage() {
  const { user, accessToken, loading: authLoading, configured, signInWithGoogle, signInWithSeedCustomer, signOut } = useCustomerAuth();
  const [items, setItems] = useState<CustomerBookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listMyBookings(accessToken);
      setItems(result.items ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your bookings.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!authLoading && accessToken) void refresh();
    else if (!authLoading) setLoading(false);
  }, [authLoading, accessToken, refresh]);

  const continuePayment = (booking: CustomerBookingSummary) => {
    if (!booking.bookingId || !booking.ticketId) {
      setError("This booking record cannot be resumed from the customer account. Please contact the travel desk.");
      return;
    }
    try {
      storePaymentResumeReference({ bookingId: booking.bookingId, ticketId: booking.ticketId, idempotencyKey: makeKey() });
      window.location.assign("/payment/resume/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start payment recovery.");
    }
  };

  if (authLoading) return <main className="min-h-[60vh] p-8 grid place-items-center"><section className="text-center"><h1 className="text-2xl font-bold text-ink-midnight">My bookings</h1><p className="mt-2 text-on-surface-variant">Checking your account…</p></section></main>;
  if (!user || !accessToken) return (
    <main className="min-h-[65vh] px-4 py-16 grid place-items-center">
      <section className="max-w-lg rounded-2xl border border-border-warm bg-surface-container-lowest p-8 text-center shadow-md">
        <h1 className="text-2xl font-bold text-ink-midnight">Your bookings</h1>
        <p className="mt-3 text-on-surface-variant">Sign in to view pending, confirmed, and paid bookings associated with your account.</p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" disabled={!configured} onClick={() => void signInWithGoogle("/my-bookings/").catch((cause) => setError(cause.message))} className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50 cursor-pointer shadow-xs">Continue with Google</button>
          <button type="button" onClick={() => void signInWithSeedCustomer().catch((cause) => setError(cause.message))} className="w-full rounded-xl border border-primary/25 bg-sandstone-wash/60 px-5 py-2.5 text-xs font-bold text-primary hover:bg-sandstone-wash transition-colors cursor-pointer">⚡ 1-Click Seed Customer Login</button>
          <a href="/login?returnTo=/my-bookings" className="text-xs text-on-surface-variant hover:text-primary transition-colors underline">Sign in with email & password</a>
        </div>
        <div className="mt-6 border-t border-border-warm/60 pt-4">
          <p className="text-xs text-on-surface-variant">Looking for a recent guest booking?</p>
          <a href="/booking/confirmation" className="mt-1 inline-block text-xs font-bold text-primary hover:underline">
            View Recent Guest Booking Voucher →
          </a>
        </div>
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
      </section>
    </main>
  );

  return (
    <main className="min-h-[65vh] bg-surface px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-primary font-bold">Your account</p><h1 className="mt-2 text-3xl font-bold text-ink-midnight">My bookings</h1><p className="mt-2 text-sm text-on-surface-variant">Signed in as {user.email ?? "Google account"}. Only bookings linked to this account are shown.</p></div><div className="flex gap-2"><button type="button" onClick={() => void refresh()} disabled={loading} className="rounded-lg border border-border-warm px-4 py-2 font-semibold hover:bg-sandstone-wash disabled:opacity-50">Refresh</button><button type="button" onClick={() => void signOut().then(() => window.location.assign("/")).catch((cause) => setError(cause.message))} className="rounded-lg border border-border-warm px-4 py-2 font-semibold hover:bg-sandstone-wash">Sign out</button></div></div>
        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        {loading ? <p className="mt-8">Loading bookings…</p> : items.length === 0 ? <section className="mt-8 rounded-2xl border border-border-warm bg-surface-container-lowest p-8 text-center"><h2 className="text-xl font-semibold">No bookings yet</h2><p className="mt-2 text-on-surface-variant">Your new bookings will appear here, including drafts whose payment was interrupted.</p><a href="/book.html" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white">Plan a trip</a></section> : <div className="mt-7 grid gap-4">{items.map((booking) => {
          const pending = ["pending_payment", "draft", "payment_failed"].includes(booking.status);
          const statusText = booking.status.replaceAll("_", " ");
          return <article key={booking.bookingId} className="rounded-2xl border border-border-warm bg-surface-container-lowest p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{booking.ticketId}</p><h2 className="mt-1 text-lg font-bold text-ink-midnight">{bookingTitle(booking)}</h2><p className="mt-1 text-sm text-on-surface-variant">{bookingSubtitle(booking)} · {formatDate(booking.pickupDatetime)} · {booking.vehicleTier.replaceAll("-", " ")}</p></div><span className="rounded-full bg-sandstone-wash px-3 py-1 text-sm font-semibold capitalize">{statusText}</span></div><div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border-warm pt-4"><div className="text-sm"><span className="text-on-surface-variant">Total </span><strong>{money(booking.totalFare)}</strong><span className="mx-2 text-border-warm">·</span><span className="text-on-surface-variant">Advance </span><strong>{money(booking.advanceAmount)}</strong></div>{pending ? <button type="button" onClick={() => continuePayment(booking)} className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-white">Continue payment</button> : <span className="text-sm text-on-surface-variant">{booking.paymentStatus ? `Payment: ${booking.paymentStatus.replaceAll("_", " ")}` : "Booking status is up to date"}</span>}</div></article>;
        })}</div>}
      </div>
    </main>
  );
}

export default MyBookingsPage;
