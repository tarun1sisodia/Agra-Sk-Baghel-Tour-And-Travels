/**
 * GENERATED — do not edit by hand.
 * Source: contracts/ux-states.ts
 * Regenerate: npx tsx contracts/scripts/sync-contracts.ts
 * Contract: C-CONTRACT-ALL · contracts/LOCKED.md
 */
// --- Canonical Contract: 10 Resilient UX & System States ---
// Agra SK Baghel Tour & Travels — Single source of truth for error recovery, validation, and resilience

import { z } from "zod";

// --- State 1: Empty State (No data, no errors, no loading) ---
export const EmptyStateConfigSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    actionLabel: z.string().optional(),
    actionIcon: z.string().optional(),
});
export type EmptyStateConfig = z.infer<typeof EmptyStateConfigSchema>;

// --- State 2: Loading State (Three tiers: skeleton, spinner, progress) ---
export const LoadingStateTypeSchema = z.enum([
    "skeleton",     // Content placeholder (shimmer)
    "spinner",      // Circular/linear progress indicator
    "progress",     // Determinate progress bar (0–100%)
]);
export type LoadingStateType = z.infer<typeof LoadingStateTypeSchema>;

export const LoadingStateConfigSchema = z.object({
    type: LoadingStateTypeSchema,
    message: z.string().optional(),
    progress: z.number().min(0).max(100).optional(), // 0–100 for progress type
});
export type LoadingStateConfig = z.infer<typeof LoadingStateConfigSchema>;

// --- State 3: Structured Error Classification (What went wrong, Whose fault, How to fix) ---
export const ErrorFaultOwnerSchema = z.enum([
    "user_input",     // Validation / missing field
    "bank_gateway",   // Bank declined card / UPI timeout / insufficient funds
    "network",        // Offline / DNS / connection timeout
    "auth_session",   // Expired JWT or guest token
    "server",         // Internal API / DB issue
]);
export type ErrorFaultOwner = z.infer<typeof ErrorFaultOwnerSchema>;

export const RecoveryActionTypeSchema = z.enum([
    "retry_payment_method",
    "try_alternate_payment",
    "refresh_live_fare",
    "reauthenticate_keep_draft",
    "fix_inline_fields",
    "switch_to_lite_mode",
    "contact_whatsapp_desk",
    "reload_page",
]);
export type RecoveryActionType = z.infer<typeof RecoveryActionTypeSchema>;

export const FieldValidationFixSchema = z.object({
    field: z.string(),
    issue: z.string(),        // e.g., "Email address is missing a domain"
    specific_fix: z.string(), // e.g., "Add a domain like '@gmail.com' or '@outlook.com'"
});
export type FieldValidationFix = z.infer<typeof FieldValidationFixSchema>;

export const ActionableErrorEnvelopeSchema = z.object({
    code: z.string(),
    title: z.string(),                  // What went wrong: "Payment Declined by Bank"
    fault_owner: ErrorFaultOwnerSchema, // Whose fault: "bank_gateway"
    explanation: z.string(),            // "Your bank or UPI app declined the transaction. No money was deducted."
    how_to_fix: z.string(),             // "Try another UPI ID, use a different card, or retry below."
    primary_action: RecoveryActionTypeSchema,
    primary_action_label: z.string(),   // "Try Another Payment Method"
    field_fixes: z.array(FieldValidationFixSchema).default([]),
    request_id: z.string().optional(),
});
export type ActionableErrorEnvelope = z.infer<typeof ActionableErrorEnvelopeSchema>;

// --- State 4: No Internet (Offline detection, retry queue, sync) ---
export const OfflineStateConfigSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    retryLabel: z.string(),
    retryAction: z.enum(["retry_now", "retry_later", "queue_for_sync"]),
});
export type OfflineStateConfig = z.infer<typeof OfflineStateConfigSchema>;

// --- State 5: Slow Network (Progressive enhancement, fallback, patience) ---
export const SlowNetworkStateConfigSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    patienceMessage: z.string(),
    fallbackLabel: z.string().optional(),
    fallbackAction: z.string().optional(),
});
export type SlowNetworkStateConfig = z.infer<typeof SlowNetworkStateConfigSchema>;

// --- State 6: No Search Results (Empty query, no matches, suggestions) ---
export const NoSearchResultsStateConfigSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    suggestions: z.array(z.string()).optional(),
    resetLabel: z.string().optional(),
});
export type NoSearchResultsStateConfig = z.infer<typeof NoSearchResultsStateConfigSchema>;

// --- State 5: Network Quality Mode (Offline, Slow, Lite, Fast) ---
export const NetworkQualityModeSchema = z.enum([
    "offline",      // No internet connection
    "online_slow",  // 2G/3G or high latency (>600ms RTT)
    "online_fast",  // 4G/5G or low latency (<600ms RTT)
    "lite_mode",    // User manually enabled Lite Mode
]);
export type NetworkQualityMode = z.infer<typeof NetworkQualityModeSchema>;

// --- State 6: Fuzzy Search Response (Typo Correction + Popular Alternatives) ---
export const FuzzySearchResponseSchema = z.object({
    original_query: z.string(),
    exact_match_count: z.number().int().nonnegative(),
    did_you_mean: z.string().nullable(),
    suggested_query_slug: z.string().nullable(),
    popular_alternatives: z.array(z.object({
        id: z.string(),
        category: z.enum(["outstation", "local_package", "transfer", "tour_package"]),
        name: z.string(),
        slug: z.string(),
        starting_price_inr: z.number().int().nonnegative(),
        badge_label: z.string(),
    })),
});
export type FuzzySearchResponse = z.infer<typeof FuzzySearchResponseSchema>;

// --- State 7: Permission Denied (Auth, location, notifications) ---
export const PermissionDeniedStateConfigSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    permissionType: z.enum(["auth", "location", "notifications", "camera", "microphone"]),
    actionLabel: z.string(),
    actionIcon: z.string().optional(),
});
export type PermissionDeniedStateConfig = z.infer<typeof PermissionDeniedStateConfigSchema>;

// --- State 8: Session Expired (JWT expiry, guest token expiry, re-auth) ---
export const SessionExpiredStateConfigSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    actionLabel: z.string(),
    keepDraft: z.boolean().optional(), // Preserve form state on re-auth
});
export type SessionExpiredStateConfig = z.infer<typeof SessionExpiredStateConfigSchema>;

// --- State 9: Actionable Inline Field Validation Fix ---
export const InlineValidationFixSchema = z.object({
    field: z.string(),
    issue: z.string(),
    specific_fix: z.string(),
    action_label: z.string(),
});
export type InlineValidationFix = z.infer<typeof InlineValidationFixSchema>;

export const ValidationFailureEnvelopeSchema = z.object({
    code: z.string(),
    title: z.string(),
    field_fixes: z.array(InlineValidationFixSchema),
});
export type ValidationFailureEnvelope = z.infer<typeof ValidationFailureEnvelopeSchema>;

// --- State 10: Success State (Success message, next steps, CTA) ---
export const SuccessStateConfigSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    icon: z.string().optional(),
    ctaLabel: z.string().optional(),
    ctaAction: z.string().optional(),
    nextSteps: z.array(z.string()).optional(),
});
export type SuccessStateConfig = z.infer<typeof SuccessStateConfigSchema>;

// --- Unified Resilient State Union ---
export const ResilientStateTypeSchema = z.enum([
    "empty",
    "loading",
    "error",
    "offline",
    "slow_network",
    "no_search_results",
    "permission_denied",
    "session_expired",
    "validation_failure",
    "success",
]);
export type ResilientStateType = z.infer<typeof ResilientStateTypeSchema>;

export const ResilientStateSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("empty"),
        config: EmptyStateConfigSchema,
    }),
    z.object({
        type: z.literal("loading"),
        config: LoadingStateConfigSchema,
    }),
    z.object({
        type: z.literal("error"),
        config: ActionableErrorEnvelopeSchema,
    }),
    z.object({
        type: z.literal("offline"),
        config: OfflineStateConfigSchema,
    }),
    z.object({
        type: z.literal("slow_network"),
        config: SlowNetworkStateConfigSchema,
    }),
    z.object({
        type: z.literal("no_search_results"),
        config: NoSearchResultsStateConfigSchema,
    }),
    z.object({
        type: z.literal("permission_denied"),
        config: PermissionDeniedStateConfigSchema,
    }),
    z.object({
        type: z.literal("session_expired"),
        config: SessionExpiredStateConfigSchema,
    }),
    z.object({
        type: z.literal("validation_failure"),
        config: ValidationFailureEnvelopeSchema,
    }),
    z.object({
        type: z.literal("success"),
        config: SuccessStateConfigSchema,
    }),
]);
export type ResilientState = z.infer<typeof ResilientStateSchema>;

// --- Resilient State Manager API ---
export interface ResilientStateContext {
    type: ResilientStateType;
    state: ResilientState;
    reset: () => void;
    retry: () => Promise<void>;
}

// --- Error Fault Classification Helper ---
export function classifyErrorFault(errorCode: string, httpStatus: number): ErrorFaultOwner {
    // User input errors (4xx client errors, validation)
    if (httpStatus >= 400 && httpStatus < 500) {
        if (errorCode === "VALIDATION_ERROR" || errorCode === "INVALID_INPUT") {
            return "user_input";
        }
        if (errorCode === "SESSION_EXPIRED" || errorCode === "UNAUTHORIZED") {
            return "auth_session";
        }
    }

    // Bank gateway errors (payment-related)
    if (errorCode.includes("PAYMENT") || errorCode.includes("RAZORPAY")) {
        return "bank_gateway";
    }

    // Network errors (offline, timeout, DNS)
    if (errorCode === "NETWORK_ERROR" || errorCode === "TIMEOUT" || errorCode === "DNS_PROBLEM") {
        return "network";
    }

    // Server errors (5xx, internal)
    if (httpStatus >= 500) {
        return "server";
    }

    // Default fallback
    return "server";
}

// --- Recovery Action Resolver ---
export function resolveRecoveryAction(faultOwner: ErrorFaultOwner, errorCode: string): RecoveryActionType {
    switch (faultOwner) {
        case "user_input":
            return "fix_inline_fields";
        case "bank_gateway":
            return errorCode.includes("DECLINED") || errorCode.includes("INSUFFICIENT_FUNDS")
                ? "try_alternate_payment"
                : "retry_payment_method";
        case "network":
            return "reload_page";
        case "auth_session":
            return "reauthenticate_keep_draft";
        case "server":
        default:
            return "contact_whatsapp_desk";
    }
}

// --- Recovery Action Label Generator ---
export function getRecoveryActionLabel(action: RecoveryActionType): string {
    const labels: Record<RecoveryActionType, string> = {
        retry_payment_method: "Retry Payment",
        try_alternate_payment: "Try Another Payment Method",
        refresh_live_fare: "Refresh Live Fare",
        reauthenticate_keep_draft: "Sign In to Keep Draft",
        fix_inline_fields: "Fix Field Errors",
        switch_to_lite_mode: "Switch to Lite Mode",
        contact_whatsapp_desk: "Contact WhatsApp Desk",
        reload_page: "Reload Page",
    };
    return labels[action];
}

// --- Field Fix Resolver ---
export function resolveFieldFixes(errorDetails?: Record<string, unknown>): FieldValidationFix[] {
    if (!errorDetails || typeof errorDetails !== "object") return [];

    const fixes: FieldValidationFix[] = [];

    // Common field-specific fixes
    if (errorDetails.email && typeof errorDetails.email === "string") {
        fixes.push({
            field: "email",
            issue: "Invalid email format",
            specific_fix: "Enter a valid email with a domain (e.g., user@gmail.com)",
        });
    }

    if (errorDetails.phone && typeof errorDetails.phone === "string") {
        fixes.push({
            field: "phone",
            issue: "Invalid phone number",
            specific_fix: "Enter a 10-digit Indian phone number (e.g., 9876543210)",
        });
    }

    if (errorDetails.password && typeof errorDetails.password === "string") {
        fixes.push({
            field: "password",
            issue: "Password requirements not met",
            specific_fix: "Use 8+ characters with uppercase, lowercase, number, and special character",
        });
    }

    return fixes;
}
