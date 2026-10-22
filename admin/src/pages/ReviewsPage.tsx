import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  EyeOff,
  Globe,
  QrCode,
  RotateCcw,
  Share2,
  Sparkles,
  Star,
  XCircle,
  X,
  Check,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import QRCode from "qrcode";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { actOnReview, createAdminReviewLink, fetchAdminReviews } from "@/lib/api";
import { env } from "@/lib/env";
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

  // Review Invitation & WhatsApp QR Studio State (D-11)
  const [studioOpen, setStudioOpen] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [chauffeurName, setChauffeurName] = useState("");
  const [tourName, setTourName] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Production review links can still be overridden for preview deployments.
  const reviewSharingBaseUrl =
    (import.meta.env.VITE_REVIEW_SHARING_URL as string | undefined)?.replace(/\/+$/, "") ||
    env.CUSTOMER_SITE_URL ||
    "https://agraskbagheltourandtravels.com";

  const activeReviewUrl = useMemo(() => {
    if (generatedToken) {
      return `${reviewSharingBaseUrl}/review/${encodeURIComponent(generatedToken)}`;
    }
    const params = new URLSearchParams();
    if (customerName.trim()) params.set("name", customerName.trim());
    if (ticketId.trim()) params.set("ticket", ticketId.trim());
    if (chauffeurName.trim()) params.set("driver", chauffeurName.trim());
    if (tourName.trim()) params.set("tour", tourName.trim());
    const qs = params.toString();
    return `${reviewSharingBaseUrl}/review${qs ? `?${qs}` : ""}`;
  }, [generatedToken, customerName, ticketId, chauffeurName, tourName, reviewSharingBaseUrl]);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(activeReviewUrl, {
      width: 280,
      margin: 1,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("QR Code generation error:", err);
      });
    return () => {
      active = false;
    };
  }, [activeReviewUrl]);

  async function handleCreateTokenLink() {
    setGeneratingLink(true);
    setActionError(null);
    try {
      const res = await createAdminReviewLink({
        label: ticketId ? `Ticket ${ticketId}` : `Invite for ${customerName || "Customer"}`,
        prefill: {
          customerName: customerName.trim() || undefined,
          ticketId: ticketId.trim() || undefined,
          chauffeurName: chauffeurName.trim() || undefined,
          tourName: tourName.trim() || undefined,
        },
      });
      if (!res.token || typeof res.token !== "string") {
        throw new Error("The server did not return a review token. No official link was created.");
      }
      setGeneratedToken(res.token);
      setActionSuccess("Official review invitation token generated successfully!");
    } catch (err) {
      setActionError(`Could not generate official token: ${err instanceof Error ? err.message : "server error"}`);
    } finally {
      setGeneratingLink(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(activeReviewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  function handleDownloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `review-qr-${ticketId.trim() || "sk-baghel"}.png`;
    a.click();
  }

  const whatsappMessage = `Namaste ${customerName.trim() || "Guest"}! Thank you for traveling with Agra SK Baghel Tour & Travels${chauffeurName.trim() ? ` (Chauffeur: ${chauffeurName.trim()})` : ""}${ticketId.trim() ? ` [Ticket #${ticketId.trim()}]` : ""}. We would appreciate a moment of your time to share your feedback:\n\n${activeReviewUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

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
      if (action === "publish") {
        if (result.showOnHomepage) {
          setActionSuccess("Review published to website homepage.");
        } else {
          setActionError("Review could not be published to homepage. Check public consent and moderation permissions.");
        }
      } else {
        setActionSuccess(
          action === "approve"
            ? "Review approved successfully."
            : action === "reject"
            ? "Review rejected."
            : "Review removed from homepage."
        );
      }
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

      {/* Review Invitation & WhatsApp QR Studio (D-11) */}
      <Card className="mb-6 p-5 border-hairline bg-surface overflow-hidden shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gold-soft text-gold">
              <QrCode className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                Review Invitation &amp; WhatsApp QR Studio
                <Badge tone="gold" className="text-[10px] uppercase tracking-wider">
                  Dispatch &amp; Social Proof
                </Badge>
              </h2>
              <p className="text-[12px] text-ink-soft">
                Generate pre-filled review invites, 1-click WhatsApp messages, and downloadable QR codes for completed trips.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStudioOpen((o) => !o)}
            className="text-xs text-ink-soft"
          >
            {studioOpen ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" /> Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" /> Expand Studio
              </>
            )}
          </Button>
        </div>

        {studioOpen && (
          <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Inputs & Direct Sharing */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-md border border-hairline bg-surface-2 p-2 text-xs text-ink focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Booking Ticket ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SKB-2026-9812"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    className="w-full rounded-md border border-hairline bg-surface-2 p-2 text-xs text-ink focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Chauffeur Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Singh"
                    value={chauffeurName}
                    onChange={(e) => setChauffeurName(e.target.value)}
                    className="w-full rounded-md border border-hairline bg-surface-2 p-2 text-xs text-ink focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Tour / Route Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Taj Mahal Sunrise Sightseeing"
                    value={tourName}
                    onChange={(e) => setTourName(e.target.value)}
                    className="w-full rounded-md border border-hairline bg-surface-2 p-2 text-xs text-ink focus:outline-primary"
                  />
                </div>
              </div>

              {/* URL Preview & Link Action */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Review Link</span>
                  {generatedToken ? (
                    <span className="font-mono text-[11px] text-teal flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Token Active: {generatedToken.slice(0, 8)}…
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateTokenLink}
                      disabled={generatingLink}
                      className="text-[11px] h-7"
                    >
                      <Sparkles className="h-3 w-3 mr-1 text-gold" />
                      {generatingLink ? "Generating Token…" : "Generate Official Token"}
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeReviewUrl}
                    className="w-full rounded-md border border-hairline bg-surface-2 p-2 text-xs font-mono text-ink select-all"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0 text-xs h-8"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-teal" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#20ba5a] transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share via WhatsApp
                </a>

                <a
                  href={generatedToken ? activeReviewUrl : undefined}
                  aria-disabled={!generatedToken}
                  onClick={(event) => {
                    if (!generatedToken) event.preventDefault();
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-2 px-3 py-2 text-xs font-medium text-ink hover:bg-hairline transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-ink-soft" />
                  {generatedToken ? "Preview Review Form" : "Generate Token to Preview"}
                </a>
              </div>
            </div>

            {/* QR Code Canvas Preview */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl border border-hairline bg-surface-2 text-center">
              <span className="text-xs font-semibold text-ink mb-2">
                Contactless Vehicle QR Code
              </span>

              <div className="p-3 bg-white rounded-lg shadow-sm border border-hairline mb-3">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Review Invitation QR Code"
                    className="w-44 h-44 object-contain rounded"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center font-mono text-xs text-ink-soft">
                    Generating QR…
                  </div>
                )}
              </div>

              <p className="text-[11px] text-ink-soft mb-3">
                Print or display in vehicle for instant customer smartphone scanning.
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
                className="w-full text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download QR Code PNG
              </Button>
            </div>
          </div>
        )}
      </Card>

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
                        {review.status === "approved" && (
                          <span title="Reviewed and approved by the Agra SK Baghel admin team">
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
                          disabled={!canPublish || !review.consentPublic || busyId === review.id}
                           title={
                             !canPublish
                               ? "Publish requires super_admin role"
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
