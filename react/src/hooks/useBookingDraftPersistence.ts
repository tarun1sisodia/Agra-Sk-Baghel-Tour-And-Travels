/**
 * @file useBookingDraftPersistence.ts — State 8: Session / Hold Expired Recovery.
 * Persists the customer's booking draft so if an auth session or 30-minute payment window
 * expires, their trip selection and passenger details are preserved for 1-click continuation.
 */

import { useState, useEffect, useCallback } from "react";

export interface SavedBookingDraft {
    step: number;
    category: "outstation" | "local_package" | "transfer" | "tour_package";
    productCode: string;
    productName: string;
    tripType: "one_way" | "round_trip";
    vehicleModelId: string;
    vehicleDisplayName: string;
    pickupDate: string;
    pickupTime: string;
    returnDate?: string;
    returnTime?: string;
    passengerCount: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    pickupAddress: string;
    dropAddress: string;
    specialNotes: string;
    quotedTotalInr?: number;
    advanceAmountInr?: number;
    savedAtIso: string;
}

const DRAFT_STORAGE_KEY = "skb_booking_draft_v1";
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useBookingDraftPersistence() {
    const [savedDraft, setSavedDraft] = useState<SavedBookingDraft | null>(null);
    const [isSessionExpiredWithDraft, setIsSessionExpiredWithDraft] = useState(false);
    const [isPaymentHoldExpiredWithDraft, setIsPaymentHoldExpiredWithDraft] = useState(false);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as SavedBookingDraft;
            const ageMs = Date.now() - new Date(parsed.savedAtIso).getTime();
            if (ageMs <= DRAFT_MAX_AGE_MS) {
                setSavedDraft(parsed);
            } else {
                window.localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
        } catch {
            // Ignore malformed draft
        }
    }, []);

    const saveDraft = useCallback((draft: Omit<SavedBookingDraft, "savedAtIso">) => {
        const record: SavedBookingDraft = {
            ...draft,
            savedAtIso: new Date().toISOString(),
        };
        setSavedDraft(record);
        try {
            window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(record));
        } catch {
            // Ignore storage quota errors
        }
    }, []);

    const clearDraft = useCallback(() => {
        setSavedDraft(null);
        setIsSessionExpiredWithDraft(false);
        setIsPaymentHoldExpiredWithDraft(false);
        try {
            window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
            // Ignore
        }
    }, []);

    const flagSessionExpired = useCallback(() => {
        setIsSessionExpiredWithDraft(true);
    }, []);

    const flagPaymentHoldExpired = useCallback(() => {
        setIsPaymentHoldExpiredWithDraft(true);
    }, []);

    return {
        savedDraft,
        isSessionExpiredWithDraft,
        isPaymentHoldExpiredWithDraft,
        saveDraft,
        clearDraft,
        flagSessionExpired,
        flagPaymentHoldExpired,
    };
}