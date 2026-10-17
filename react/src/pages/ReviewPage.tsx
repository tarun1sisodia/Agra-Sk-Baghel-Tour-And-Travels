import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { fetchReviewLink, submitReview } from "../services/cleanFareApi";

interface ReviewLinkResponse {
  link?: {
    prefill?: Record<string, unknown> | null;
    expires_at?: string | null;
    used_at?: string | null;
  };
  trip_summary?: {
    ticket_id?: string;
    category?: string;
    vehicle_model_id?: string;
  };
}

function tokenFromPath(): string {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/^\/review\/([^/]+)\/?$/i);
  return match ? decodeURIComponent(match[1]) : "";
}

export function ReviewPage() {
  const token = tokenFromPath();
  const [link, setLink] = useState<ReviewLinkResponse | null>(null);
  const [rating, setRating] = useState(5);
  const [displayName, setDisplayName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [tourName, setTourName] = useState("");
  const [consentPublic, setConsentPublic] = useState(true);
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "This review link is incomplete.");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchReviewLink(token)
      .then((response: ReviewLinkResponse) => {
        if (!active) return;
        const prefill = response.link?.prefill ?? {};
        setLink(response);
        setDisplayName(String(prefill.customerName ?? prefill.customer_name ?? ""));
        setTourName(String(prefill.tourName ?? prefill.tour_name ?? response.trip_summary?.category ?? ""));
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "This review link is not valid or has expired.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const tripLabel = useMemo(() => {
    const summary = link?.trip_summary;
    if (!summary) return tourName || "your journey";
    return tourName || summary.category || summary.vehicle_model_id || "your journey";
  }, [link, tourName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(token, {
        display_name: displayName.trim(),
        rating,
        review_text: reviewText.trim(),
        tour_name: tourName.trim() || undefined,
        consent_public: consentPublic,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "We could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-surface px-4 py-10 sm:px-6 md:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="font-label-caps text-xs font-bold uppercase tracking-[0.2em] text-terracotta-sandstone">SK Baghel Tour &amp; Travels</p>
          <h1 className="mt-3 font-headline-hero text-4xl leading-tight text-ink-charcoal sm:text-5xl">How was {tripLabel}?</h1>
          <p className="mx-auto mt-4 max-w-xl text-on-surface-variant">Your feedback helps our dispatch team keep every Agra journey thoughtful, punctual, and comfortable.</p>
        </div>

        <section className="rounded-2xl border border-border-warm bg-surface-container-lowest p-5 shadow-sm sm:p-8" aria-live="polite">
          {loading ? <p className="py-10 text-center text-on-surface-variant">Loading your secure review invitation…</p> : null}
          {!loading && error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-red-800">
              <h2 className="font-headline-sm text-lg font-semibold">Review link unavailable</h2>
              <p className="mt-2 text-sm">{error}</p>
              <a className="mt-5 inline-flex rounded-lg bg-terracotta-deep px-4 py-2 text-sm font-semibold text-white" href="/">Return to SK Baghel</a>
            </div>
          ) : null}
          {!loading && !error && submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-jade/15 text-success-jade" aria-hidden="true">✓</div>
              <h2 className="mt-5 font-headline-sm text-2xl text-ink-charcoal">Thank you for sharing your journey.</h2>
              <p className="mx-auto mt-3 max-w-md text-on-surface-variant">Your review has been received and will be checked by our team before it appears publicly.</p>
            </div>
          ) : null}
          {!loading && !error && !submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-charcoal" htmlFor="review-name">Your name</label>
                <input id="review-name" required minLength={1} maxLength={120} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 text-ink-charcoal outline-none focus:border-terracotta-sandstone" />
              </div>
              <fieldset>
                <legend className="mb-2 block text-sm font-semibold text-ink-charcoal">Your rating</legend>
                <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value} onClick={() => setRating(value)} className="rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-terracotta-sandstone">
                      <Star className={`size-8 ${value <= rating ? "fill-terracotta-sandstone text-terracotta-sandstone" : "text-border-warm"}`} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-charcoal" htmlFor="review-text">Tell us about your experience</label>
                <textarea id="review-text" required minLength={1} maxLength={5000} rows={6} value={reviewText} onChange={(event) => setReviewText(event.target.value)} className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 text-ink-charcoal outline-none focus:border-terracotta-sandstone" />
              </div>
              <label className="flex items-start gap-3 text-sm text-on-surface-variant">
                <input type="checkbox" checked={consentPublic} onChange={(event) => setConsentPublic(event.target.checked)} className="mt-1" />
                <span>I consent to SK Baghel displaying this review publicly after moderation.</span>
              </label>
              {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
              <button type="submit" disabled={submitting} className="w-full rounded-lg bg-terracotta-deep px-4 py-3 font-semibold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Submitting review…" : "Submit review"}</button>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default ReviewPage;
