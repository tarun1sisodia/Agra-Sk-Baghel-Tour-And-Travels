/**
 * @file ResilientStates.tsx — Reusable UI Components for the 10 Resilient States.
 * Styled exclusively with TailwindCSS v4 @theme tokens from react/src/styles/theme.css.
 */

import React, { useState } from "react";
import type { ActionableErrorEnvelope, FuzzySearchResponse } from "../../contracts/ux-states";
import type { ValidationFeedback } from "../../utils/inlineValidators";
import type { SavedBookingDraft } from "../../hooks/useBookingDraftPersistence";

// ============================================================================
// STATE 1: EMPTY STATE (Explain Why + Immediate Next Step CTA)
// ============================================================================
export interface EmptyStateCardProps {
    badge?: string;
    title: string;
    whyExplanation: string;
    primaryCtaLabel: string;
    onPrimaryCta: () => void;
    secondaryCtaLabel?: string;
    onSecondaryCta?: () => void;
}

export function EmptyStateCard({
    badge = "NOTHING SAVED YET",
    title,
    whyExplanation,
    primaryCtaLabel,
    onPrimaryCta,
    secondaryCtaLabel,
    onSecondaryCta,
}: EmptyStateCardProps) {
    return (
        <section
            aria-label={title}
            className="w-full rounded-xl border border-border-warm bg-surface p-6 sm:p-8 text-center max-w-xl mx-auto my-6"
        >
            <span className="inline-block px-3 py-1 rounded-full bg-sandstone-wash text-primary font-label-caps text-label-caps mb-3">
                {badge}
            </span>
            <h2 className="font-headline-md text-headline-md text-ink-charcoal mb-2">{title}</h2>
            <p className="font-body-md text-body-md text-ink-slate mb-6">{whyExplanation}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={onPrimaryCta}
                    className="min-h-[48px] px-5 py-2.5 rounded-lg bg-primary text-ivory-surface font-label-lg text-label-lg cursor-pointer"
                >
                    {primaryCtaLabel}
                </button>
                {secondaryCtaLabel && onSecondaryCta && (
                    <button
                        type="button"
                        onClick={onSecondaryCta}
                        className="min-h-[48px] px-5 py-2.5 rounded-lg border border-border-warm bg-sandstone-wash text-ink-charcoal font-label-lg text-label-lg cursor-pointer"
                    >
                        {secondaryCtaLabel}
                    </button>
                )}
            </div>
        </section>
    );
}

// ============================================================================
// STATE 2: LOADING STATE (Dimensional Skeleton Placeholders — Zero CLS)
// ============================================================================
export function CatalogCardSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div
            role="status"
            aria-label="Loading travel packages and routes"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className="rounded-xl border border-border-warm bg-surface overflow-hidden p-3.5 sm:p-4 animate-pulse"
                >
                    <div className="w-full h-44 sm:h-48 rounded-lg bg-sandstone-wash mb-4" />
                    <div className="h-4 w-24 rounded bg-sandstone-wash mb-2.5" />
                    <div className="h-6 w-3/4 rounded bg-sandstone-wash mb-2" />
                    <div className="h-4 w-full rounded bg-sandstone-wash mb-4" />
                    <div className="flex items-center justify-between pt-3 border-t border-border-warm">
                        <div className="h-7 w-28 rounded bg-sandstone-wash" />
                        <div className="h-11 w-32 rounded-lg bg-sandstone-wash" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function VehicleQuoteSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div role="status" aria-label="Calculating server-authoritative vehicle quotes" className="space-y-3.5">
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className="rounded-xl border border-border-warm bg-surface p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 min-h-[190px] animate-pulse"
                >
                    <div className="w-full sm:w-48 h-36 rounded-lg bg-sandstone-wash shrink-0" />
                    <div className="flex-1 space-y-2.5 w-full">
                        <div className="h-4 w-28 rounded bg-sandstone-wash" />
                        <div className="h-6 w-52 rounded bg-sandstone-wash" />
                        <div className="h-4 w-64 rounded bg-sandstone-wash" />
                        <div className="h-4 w-40 rounded bg-sandstone-wash" />
                    </div>
                    <div className="w-full sm:w-48 space-y-2 text-right">
                        <div className="h-7 w-28 sm:ml-auto rounded bg-sandstone-wash" />
                        <div className="h-5 w-36 sm:ml-auto rounded bg-sandstone-wash" />
                        <div className="h-12 w-full rounded-lg bg-sandstone-wash" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// STATE 3: ERROR STATE (What Went Wrong + Whose Fault + How to Fix)
// ============================================================================
const FAULT_OWNER_BADGE: Record<ActionableErrorEnvelope["fault_owner"], string> = {
    bank_gateway: "BANK / PAYMENT GATEWAY DECLINED — NO MONEY DEDUCTED",
    network: "NETWORK CONNECTION INTERRUPTED",
    user_input: "ACTION REQUIRED ON FORM FIELDS",
    auth_session: "SESSION TIMED OUT — DRAFT SAVED",
    server: "OUR SERVER TOOK TOO LONG TO RESPOND",
};

export interface ActionableErrorCardProps {
    error: ActionableErrorEnvelope;
    onPrimaryAction: () => void;
    onSecondaryWhatsApp?: () => void;
}

export function ActionableErrorCard({
    error,
    onPrimaryAction,
    onSecondaryWhatsApp,
}: ActionableErrorCardProps) {
    return (
        <div
            role="alert"
            className="rounded-xl border-2 border-primary bg-surface p-5 sm:p-6 my-4"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-1 rounded bg-sandstone-wash text-primary font-label-caps text-label-caps">
                    {FAULT_OWNER_BADGE[error.fault_owner]}
                </span>
                {error.request_id && (
                    <span className="font-body-sm text-body-sm text-ink-slate">Ref: {error.request_id}</span>
                )}
            </div>

            <h3 className="font-headline-md text-headline-md text-ink-charcoal mb-1.5">{error.title}</h3>
            <p className="font-body-md text-body-md text-ink-charcoal mb-2">{error.explanation}</p>
            <p className="font-body-sm text-body-sm text-ink-slate mb-5">
                <strong>How to fix:</strong> {error.how_to_fix}
            </p>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={onPrimaryAction}
                    className="min-h-[48px] px-5 py-2.5 rounded-lg bg-primary text-ivory-surface font-label-lg text-label-lg cursor-pointer"
                >
                    {error.primary_action_label}
                </button>

                {onSecondaryWhatsApp && (
                    <button
                        type="button"
                        onClick={onSecondaryWhatsApp}
                        className="min-h-[48px] px-4 py-2.5 rounded-lg border border-border-warm bg-sandstone-wash text-ink-charcoal font-label-lg text-label-lg cursor-pointer"
                    >
                        Need Help? Message 24/7 Agra Desk
                    </button>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// STATE 6: NO SEARCH RESULTS (Typo Correction + Popular Alternatives)
// ============================================================================
export interface FuzzySearchEmptyStateProps {
    fuzzyMeta: FuzzySearchResponse;
    onApplySuggestedQuery: (suggestion: string, slug: string | null) => void;
    onSelectAlternative: (slug: string, category: string) => void;
}

export function FuzzySearchEmptyState({
    fuzzyMeta,
    onApplySuggestedQuery,
    onSelectAlternative,
}: FuzzySearchEmptyStateProps) {
    return (
        <section className="rounded-xl border border-border-warm bg-surface p-5 sm:p-6 my-4">
            <div className="mb-6">
                <h3 className="font-headline-md text-headline-md text-ink-charcoal mb-1">
                    No exact match for &ldquo;{fuzzyMeta.original_query}&rdquo;
                </h3>
                {fuzzyMeta.did_you_mean ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="font-body-md text-body-md text-ink-slate">Did you mean:</span>
                        <button
                            type="button"
                            onClick={() => onApplySuggestedQuery(fuzzyMeta.did_you_mean!, fuzzyMeta.suggested_query_slug)}
                            className="min-h-[44px] px-4 py-1.5 rounded-lg bg-sandstone-wash border border-primary text-primary font-semibold text-body-md cursor-pointer"
                        >
                            {fuzzyMeta.did_you_mean} &rarr;
                        </button>
                    </div>
                ) : (
                    <p className="font-body-md text-body-md text-ink-slate">
                        Check the city spelling or choose one of our most booked Agra corridors and tours below:
                    </p>
                )}
            </div>

            <h4 className="font-headline-sm text-headline-sm text-ink-charcoal mb-3">
                Popular Routes & Bestselling Tours from Agra
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fuzzyMeta.popular_alternatives.map((alt) => (
                    <button
                        key={alt.id}
                        type="button"
                        onClick={() => onSelectAlternative(alt.slug, alt.category)}
                        className="text-left rounded-lg border border-border-warm bg-sandstone-wash p-3.5 hover:border-primary transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[64px]"
                    >
                        <div>
                            <span className="inline-block font-label-caps text-label-caps text-primary mb-0.5">
                                {alt.badge_label}
                            </span>
                            <div className="font-body-md text-body-md font-semibold text-ink-charcoal">{alt.name}</div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="font-price-display text-price-display text-ink-charcoal">
                                &#8377;{alt.starting_price_inr.toLocaleString("en-IN")}
                            </div>
                            <span className="font-body-sm text-body-sm text-ink-slate">onwards</span>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}

// ============================================================================
// STATE 7: PERMISSION DENIED (Explain Why + Settings Help + Instant Presets)
// ============================================================================
const AGRA_PICKUP_PRESETS = [
    "Taj Ganj / Taj East Gate Road",
    "Agra Cantt Railway Station (AGC)",
    "Fatehabad Road Hotel Zone",
    "Sikandra / NH-19",
    "Agra Fort Railway Station",
    "Dayalbagh, Agra",
];

export interface PermissionDeniedFallbackCardProps {
    permissionType: "geolocation" | "camera";
    onSelectPresetLocation?: (location: string) => void;
    onTriggerFilePickerFallback?: () => void;
}

export function PermissionDeniedFallbackCard({
    permissionType,
    onSelectPresetLocation,
    onTriggerFilePickerFallback,
}: PermissionDeniedFallbackCardProps) {
    const [showSettingsGuide, setShowSettingsGuide] = useState(false);

    return (
        <div role="region" className="rounded-xl border border-border-warm bg-sandstone-wash p-4 sm:p-5 my-3">
            <h4 className="font-headline-sm text-headline-sm text-ink-charcoal mb-1">
                {permissionType === "geolocation"
                    ? "Location Access Is Blocked in Your Browser"
                    : "Camera Access Is Blocked in Your Browser"}
            </h4>
            <p className="font-body-sm text-body-sm text-ink-slate mb-3">
                {permissionType === "geolocation"
                    ? "We only use location access once to auto-fill your nearest pickup landmark in Agra. You can either allow it in settings or pick a landmark below."
                    : "Camera access is used to snap a travel photo for your verified review. You can allow it in settings or upload an existing photo from your gallery instead."}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <button
                    type="button"
                    onClick={() => setShowSettingsGuide((prev) => !prev)}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-lg border border-border-warm bg-surface text-ink-charcoal font-body-sm text-body-sm font-semibold cursor-pointer"
                >
                    {showSettingsGuide ? "Hide Browser Settings Guide" : "How to Allow in Browser Settings"}
                </button>

                {permissionType === "camera" && onTriggerFilePickerFallback && (
                    <button
                        type="button"
                        onClick={onTriggerFilePickerFallback}
                        className="min-h-[44px] px-4 py-1.5 rounded-lg bg-primary text-ivory-surface font-body-sm text-body-sm font-semibold cursor-pointer"
                    >
                        Upload a Photo from Device Instead
                    </button>
                )}
            </div>

            {showSettingsGuide && (
                <ol className="list-decimal list-inside font-body-sm text-body-sm text-ink-charcoal bg-surface p-3 rounded-lg border border-border-warm mb-3 space-y-1">
                    <li>Tap the <strong>Lock / Tune icon</strong> on the left side of your browser address bar.</li>
                    <li>Set <strong>{permissionType === "geolocation" ? "Location" : "Camera"}</strong> permission to <strong>Allow</strong>, then reload or try again.</li>
                </ol>
            )}

            {permissionType === "geolocation" && onSelectPresetLocation && (
                <div>
                    <span className="block font-label-caps text-label-caps text-ink-slate mb-2">
                        OR TAP A POPULAR AGRA PICKUP POINT:
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {AGRA_PICKUP_PRESETS.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => onSelectPresetLocation(preset)}
                                className="min-h-[44px] px-3 py-1.5 rounded-lg bg-surface border border-border-warm hover:border-primary text-ink-charcoal font-body-sm text-body-sm cursor-pointer"
                            >
                                {preset}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// STATE 8: SESSION OR HOLD EXPIRED (Saved Draft Reassurance + 1-Click Resume)
// ============================================================================
export interface SessionExpiredDraftBannerProps {
    reason: "auth_session_expired" | "payment_hold_expired";
    draft: SavedBookingDraft;
    onContinueWithSavedDraft: () => void;
}

export function SessionExpiredDraftBanner({
    reason,
    draft,
    onContinueWithSavedDraft,
}: SessionExpiredDraftBannerProps) {
    return (
        <div
            role="alert"
            className="rounded-xl border-2 border-primary bg-sandstone-wash p-4 sm:p-5 my-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
            <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-surface text-primary font-label-caps text-label-caps mb-1.5">
                    {reason === "auth_session_expired"
                        ? "SIGNED OUT AFTER 30 MIN INACTIVITY — TRIP SAVED"
                        : "30-MINUTE PAYMENT WINDOW EXPIRED — DETAILS SAVED"}
                </span>
                <h3 className="font-headline-sm text-headline-sm text-ink-charcoal">
                    Your {draft.productName} ({draft.vehicleDisplayName}) details are safely saved
                </h3>
                <p className="font-body-sm text-body-sm text-ink-slate mt-0.5">
                    Passenger: <strong>{draft.customerName || "Guest"}</strong> &bull; Pickup:{" "}
                    <strong>{draft.pickupAddress || draft.pickupDate}</strong>
                </p>
            </div>

            <button
                type="button"
                onClick={onContinueWithSavedDraft}
                className="min-h-[48px] px-5 py-2.5 rounded-lg bg-primary text-ivory-surface font-label-lg text-label-lg shrink-0 cursor-pointer"
            >
                {reason === "auth_session_expired"
                    ? "Sign In & Continue Checkout"
                    : "Refresh Live Fare & Resume Payment"}
            </button>
        </div>
    );
}

// ============================================================================
// STATE 9: INLINE FORM VALIDATION COMPONENT (Specific Fix + 1-Click Auto-Fix)
// ============================================================================
export interface InlineFieldErrorProps {
    feedback: ValidationFeedback | null | undefined;
    onApplySuggestedValue?: (suggestedValue: string) => void;
}

export function InlineFieldError({ feedback, onApplySuggestedValue }: InlineFieldErrorProps) {
    if (!feedback || feedback.valid) return null;

    return (
        <div role="alert" className="mt-1.5 rounded-lg bg-sandstone-wash border border-primary/40 px-3 py-2 text-body-sm">
            <p className="font-semibold text-primary">{feedback.issue}</p>
            {feedback.specificFix && (
                <p className="text-ink-charcoal mt-0.5">{feedback.specificFix}</p>
            )}
            {feedback.suggestedValue && onApplySuggestedValue && (
                <button
                    type="button"
                    onClick={() => onApplySuggestedValue(feedback.suggestedValue!)}
                    className="mt-1.5 min-h-[36px] px-3 py-1 rounded bg-surface border border-primary text-primary font-semibold text-body-sm cursor-pointer"
                >
                    Use &ldquo;{feedback.suggestedValue}&rdquo;
                </button>
            )}
        </div>
    );
}

// ============================================================================
// STATE 10: SUCCESS STATE (Confirmed Details + Financial Reassurance + Next CTAs)
// ============================================================================
export interface BookingSuccessStateCardProps {
    ticketId: string;
    productName: string;
    vehicleDisplayName: string;
    pickupDateTimeFormatted: string;
    pickupAddress: string;
    customerEmail?: string | null;
    customerPhone: string;
    totalFareInr: number;
    advancePaidInr: number;
    balancePayableToDriverInr: number;
    isDownloadingPdf: boolean;
    onDownloadPdfVoucher: () => void;
    onViewMyBookings: () => void;
    onShareWhatsApp: () => void;
}

export function BookingSuccessStateCard({
    ticketId,
    productName,
    vehicleDisplayName,
    pickupDateTimeFormatted,
    pickupAddress,
    customerEmail,
    customerPhone,
    totalFareInr,
    advancePaidInr,
    balancePayableToDriverInr,
    isDownloadingPdf,
    onDownloadPdfVoucher,
    onViewMyBookings,
    onShareWhatsApp,
}: BookingSuccessStateCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyTicket = () => {
        void navigator.clipboard?.writeText(ticketId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section
            aria-label="Booking Confirmed"
            className="rounded-xl border-2 border-success-jade bg-surface p-5 sm:p-8 max-w-2xl mx-auto my-6"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border-warm">
                <span className="px-3 py-1 rounded-full bg-success-jade text-ivory-surface font-label-caps text-label-caps">
                    BOOKING CONFIRMED & GUARANTEED
                </span>
                <div className="flex items-center gap-2">
                    <span className="font-body-sm text-body-sm text-ink-slate">Ticket ID:</span>
                    <strong className="font-mono text-body-md text-ink-charcoal">{ticketId}</strong>
                    <button
                        type="button"
                        onClick={handleCopyTicket}
                        className="px-2.5 py-1 rounded border border-border-warm bg-sandstone-wash text-body-sm cursor-pointer"
                    >
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
            </div>

            <h1 className="font-headline-lg text-headline-lg text-ink-charcoal mt-4 mb-2">
                Your Private Chauffeur Reservation Is Locked
            </h1>
            <p className="font-body-md text-body-md text-ink-slate mb-5">
                We have sent your official confirmation pass to{" "}
                {customerEmail ? <strong>{customerEmail}</strong> : null}
                {customerEmail ? " and " : ""}
                WhatsApp (<strong>+91 {customerPhone}</strong>).
            </p>

            {/* Itinerary Summary */}
            <div className="rounded-lg bg-sandstone-wash p-4 mb-5 space-y-1.5 font-body-md text-body-md">
                <div>
                    <span className="text-ink-slate">Service / Route:</span>{" "}
                    <strong className="text-ink-charcoal">{productName}</strong>
                </div>
                <div>
                    <span className="text-ink-slate">Reserved Vehicle:</span>{" "}
                    <strong className="text-ink-charcoal">{vehicleDisplayName}</strong>
                </div>
                <div>
                    <span className="text-ink-slate">Scheduled Pickup:</span>{" "}
                    <strong className="text-ink-charcoal">{pickupDateTimeFormatted}</strong>
                </div>
                <div>
                    <span className="text-ink-slate">Pickup Location:</span>{" "}
                    <strong className="text-ink-charcoal">{pickupAddress}</strong>
                </div>
            </div>

            {/* Financial Reassurance Ledger (28% Paid Now / 72% Driver Balance) */}
            <div className="rounded-lg border border-border-warm p-4 mb-6 space-y-2">
                <div className="flex justify-between font-body-md text-body-md">
                    <span className="text-ink-slate">Total Guaranteed Fare (incl. 18% GST):</span>
                    <strong className="text-ink-charcoal">&#8377;{totalFareInr.toLocaleString("en-IN")}</strong>
                </div>
                <div className="flex justify-between font-body-md text-body-md text-success-jade">
                    <span>28% Advance Paid Online (Verified):</span>
                    <strong>&#8377;{advancePaidInr.toLocaleString("en-IN")}</strong>
                </div>
                <div className="flex justify-between font-body-md text-body-md pt-2 border-t border-border-warm">
                    <span className="text-ink-charcoal font-semibold">
                        72% Balance Payable to Driver on Trip Completion:
                    </span>
                    <strong className="font-price-display text-price-display text-primary">
                        &#8377;{balancePayableToDriverInr.toLocaleString("en-IN")}
                    </strong>
                </div>
            </div>

            {/* Clear Next Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    id="btn-download-pdf-voucher"
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={onDownloadPdfVoucher}
                    className="min-h-[48px] px-5 py-2.5 rounded-lg bg-primary text-ivory-surface font-label-lg text-label-lg cursor-pointer disabled:opacity-60"
                >
                    {isDownloadingPdf ? "Generating PDF..." : "Download Official PDF Voucher"}
                </button>

                <button
                    type="button"
                    onClick={onShareWhatsApp}
                    className="min-h-[48px] px-4 py-2.5 rounded-lg bg-success-jade text-ivory-surface font-label-lg text-label-lg cursor-pointer"
                >
                    Share on WhatsApp
                </button>

                <button
                    type="button"
                    onClick={onViewMyBookings}
                    className="min-h-[48px] px-4 py-2.5 rounded-lg border border-border-warm bg-sandstone-wash text-ink-charcoal font-label-lg text-label-lg cursor-pointer"
                >
                    View in My Bookings
                </button>
            </div>
        </section>
    );
}