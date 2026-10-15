import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  Globe,
  RotateCcw,
  Star,
  XCircle,
  X,
  Check,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { actOnReview, fetchAdminReviews } from "@/lib/api";
import { can, type AdminUser, type Review } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={i <= n ? "h-3.5 w-3.5 fill-gold text-gold" : "h-3.5 w-3.5 text-hairline-strong"}
        />
      ))}
    </span>
  );
}

export type ReviewQueueTab = "pending" | "approved" | "published" | "rejected" | "all";

export function ReviewsPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<ReviewQueueTab>("pending");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const canModerate = can(user.role, "reviews:moderate");
  const canPublish = can(user.role, "reviews:publish");

  useEffect(() => {
    let isMounted = true;
    setLoadError(null);
    fetchAdminReviews()
      .then((data) => {
        if (isMounted) setReviews(data);
      })
      .catch((err) => {
        if (isMounted) {
          setReviews([]);
          setLoadError(err instanceof Error ? err.message : "Could not load reviews from the backend.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  async function act(
    id: string,
    action: "approve" | "reject" | "publish" | "unpublish",
    reason?: string
  ) {
    setActionError(null);
    setActionSuccess(null);
    setBusyId(id);
    try {
      const result = await actOnReview(id, action, reason);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: result.status,
                showOnHomepage: result.showOnHomepage,
                rejectionReason: action === "reject" ? reason || "Rejected during moderation." : r.rejectionReason,
              }
            : r
        )
      );
      setActionSuccess(
        action === "approve"
          ? "Review approved successfully."
          : action === "reject"
          ? "Review rejected."
          : action === "publish"
          ? "Review published to website homepage."
          : "Review removed from homepage."
      );
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      setActionError(`Could not update the review: ${err instanceof Error ? err.message : "backend error"}`);
    } finally {
      setBusyId(null);
    }
  }

  const queueCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved" && !r.showOnHomepage).length;
  const publishedCount = reviews.filter((r) => r.status === "approved" && r.showOnHomepage).length;
  const rejectedCount = reviews.filter((r) => r.status === "rejected").length;

  const visible = reviews.filter((r) => {
    if (filter === "pending") return r.status === "pending";
    if (filter === "approved") return r.status === "approved" && !r.showOnHomepage;
    if (filter === "published") return r.status === "approved" && r.showOnHomepage;
    if (filter === "rejected") return r.status === "rejected";
    return true;
  });

  const tabs: { value: ReviewQueueTab; label: string; count: number }[] = [
    { value: "pending", label: "Queue", count: queueCount },
    { value: "approved", label: "Approved", count: approvedCount },
    { value: "published", label: "Published", count: publishedCount },
    { value: "rejected", label: "Rejected", count: rejectedCount },
    { value: "all", label: "All", count: reviews.length },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Social proof"
        title="Review Moderation"
        description="Cross-reference every customer review with a completed ticket before publishing to the public site."
        actions={
          <div className="flex rounded-sm border border-hairline bg-surface-2 p-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setFilter(t.value);
                  setRejectingId(null);
                }}
                className={`rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  filter === t.value ? "bg-surface text-ink shadow-card" : "text-ink-soft hover:text-ink"
                }`}
              >
                {t.label} <span className="font-mono text-[11px] text-ink-faint">{t.count}</span>
              </button>
            ))}
          </div>
        }
      />

      {loadError && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{loadError}</span>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </Button>
        </div>
      )}

      {actionError && (
        <div
          className="mb-4 flex items-start gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1 leading-snug">{actionError}</span>
          <button onClick={() => setActionError(null)} className="rounded-sm p-0.5 hover:bg-error/10" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div
          className="mb-4 flex items-center gap-2.5 rounded-md border border-teal/20 bg-teal-soft px-4 py-3 text-[13px] text-teal"
          role="status"
        >
          <Check className="h-4 w-4 shrink-0" />
          <span className="flex-1 leading-snug">{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="rounded-sm p-0.5 hover:bg-teal/10" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visible.map((review, i) => (
            <motion.article
              key={review.id}
              layout
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-night font-display text-sm font-semibold text-gold">
                      {review.customerName.slice(0, 1)}
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                        {review.customerName}
                        {review.verifiedBooking && (
                          <span title="Verified against a completed booking">
                            <BadgeCheck className="h-4 w-4 text-teal" />
                          </span>
                        )}
                      </p>
                      <p className="font-mono text-[11px] text-ink-faint">
                        {review.ticketId} · {review.route}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={review.status} />
                    {review.showOnHomepage && (
                      <Badge tone="gold" className="text-[10px] uppercase font-bold">
                        Homepage
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Stars n={review.rating} />
                  <span className="font-mono text-[11px] text-ink-faint">{timeAgo(review.submittedAt)}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Badge tone={review.verifiedBooking ? "success" : "neutral"} className="text-[10px]">
                      {review.verifiedBooking ? "Completed Trip" : review.bookingStatus ? `Trip: ${review.bookingStatus}` : "No Ticket"}
                    </Badge>
                    <Badge tone={review.consentPublic ? "teal" : "error"} className="text-[10px]">
                      {review.consentPublic ? "Consented" : "No Consent"}
                    </Badge>
                  </div>
                </div>

                <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">{review.text}</p>

                {review.socialPlatform && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-ink-soft">
                    <span className="capitalize font-medium text-ink-faint">{review.socialPlatform}:</span>
                    {review.socialUrl ? (
                      <a
                        href={review.socialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal hover:underline flex items-center gap-0.5"
                      >
                        @{review.socialUsername || "profile"} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span>@{review.socialUsername}</span>
                    )}
                  </div>
                )}

                {!review.verifiedBooking && (
                  <p className="mt-3 rounded-sm bg-error-soft px-3 py-2 text-[12px] leading-snug text-error">
                    ⚠ No completed booking matches this ticket ID. Ineligible for completed-ticket verified badge.
                  </p>
                )}

                {!review.consentPublic && (
                  <p className="mt-2 rounded-sm bg-error-soft px-3 py-2 text-[12px] leading-snug text-error">
                    ⚠ Customer did not consent to public use. Cannot be placed on website.
                  </p>
                )}

                {review.status === "rejected" && review.rejectionReason && (
                  <p className="mt-2.5 rounded-sm bg-hairline/30 px-3 py-2 text-[12px] leading-snug text-ink-soft">
                    <strong className="text-ink">Rejection Reason:</strong> {review.rejectionReason}
                  </p>
                )}

                {rejectingId === review.id && (
                  <div className="mt-3 rounded-md border border-error/30 bg-surface-2 p-3">
                    <label className="block text-[12px] font-medium text-ink mb-1.5">
                      Specify rejection reason:
                    </label>
                    <input
                      type="text"
                      className="w-full rounded border border-hairline bg-surface px-3 py-1.5 text-[13px] text-ink focus:border-gold focus:outline-none"
                      placeholder="e.g. Inappropriate language, spam, or unverifiable trip details"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="mt-2.5 flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-error border-error/40 hover:bg-error-soft"
                        onClick={() => act(review.id, "reject", rejectReason)}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                )}

                {canModerate && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
                    {review.status === "pending" && (
                      <>
                        <Button
                          variant="gold"
                          size="sm"
                          disabled={busyId === review.id}
                          onClick={() => act(review.id, "approve")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === review.id}
                          onClick={() => setRejectingId(review.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}

                    {review.status === "approved" && !review.showOnHomepage && (
                      <>
                        <Button
                          variant="gold"
                          size="sm"
                          disabled={!canPublish || !review.verifiedBooking || !review.consentPublic || busyId === review.id}
                          title={
                            !canPublish
                              ? "Publish requires super_admin role"
                              : !review.verifiedBooking
                              ? "Cannot publish: requires verified completed booking"
                              : !review.consentPublic
                              ? "Cannot publish: customer did not grant consent for public display"
                              : "Publish review to customer homepage"
                          }
                          onClick={() => act(review.id, "publish")}
                        >
                          <Globe className="h-3.5 w-3.5" /> Publish to Homepage
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === review.id}
                          onClick={() => setRejectingId(review.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}

                    {review.status === "approved" && review.showOnHomepage && (
                      <>
                        <Badge tone="success" className="px-3 py-1">
                          Live on Homepage
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === review.id}
                          onClick={() => act(review.id, "unpublish")}
                        >
                          <EyeOff className="h-3.5 w-3.5" /> Unpublish
                        </Button>
                      </>
                    )}

                    {review.status === "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === review.id}
                        onClick={() => act(review.id, "approve")}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Re-approve
                      </Button>
                    )}

                    {!canModerate && (
                      <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                        moderation requires super_admin or review_moderator
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {visible.length === 0 && !loadError && (
        <Card className="p-10 text-center">
          <p className="text-sm text-ink-soft">
            {reviews.length === 0
              ? "No reviews yet — customer-submitted reviews appear here for moderation."
              : `Nothing in the ${tabs.find((t) => t.value === filter)?.label.toLowerCase()} bucket.`}
          </p>
        </Card>
      )}
    </div>
  );
}
