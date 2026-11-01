/**
 * @file NetworkAndLiteModeContext.tsx — States 4 & 5: Offline Mode, Slow Network Progress & Lite Mode.
 * 100% SSR/SSG Hydration Safe: Initializes with deterministic defaults and attaches browser listeners in useEffect.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { NetworkQualityMode } from "../contracts/ux-states.js";

interface NetworkAndLiteModeContextValue {
    mode: NetworkQualityMode;
    isOffline: boolean;
    isSlowNetwork: boolean;
    isLiteMode: boolean;
    isReconnecting: boolean;
    progressPercent: number | null;
    progressStageLabel: string | null;
    enableLiteMode: () => void;
    disableLiteMode: () => void;
    startTrackedOperation: (initialLabel?: string) => void;
    advanceOperationProgress: (percent: number, label: string) => void;
    completeTrackedOperation: () => void;
    checkConnectionNow: () => Promise<boolean>;
}

const NetworkAndLiteModeContext = createContext<NetworkAndLiteModeContextValue | null>(null);

const LITE_MODE_STORAGE_KEY = "skb_lite_mode_v1";

export function NetworkAndLiteModeProvider({ children }: { children: ReactNode }) {
    // SSR-safe deterministic initial states (prevents React Hydration Error #418)
    const [isOffline, setIsOffline] = useState(false);
    const [isSlowNetwork, setIsSlowNetwork] = useState(false);
    const [isLiteMode, setIsLiteMode] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [progressPercent, setProgressPercent] = useState<number | null>(null);
    const [progressStageLabel, setProgressStageLabel] = useState<string | null>(null);

    useEffect(() => {
        // 1. Restore saved Lite Mode preference after mount
        try {
            if (window.localStorage.getItem(LITE_MODE_STORAGE_KEY) === "1") {
                setIsLiteMode(true);
                document.documentElement.classList.add("skb-lite-mode");
            }
        } catch {
            // Ignore storage access errors in private browsing
        }

        // 2. Sync initial online/offline state
        setIsOffline(!window.navigator.onLine);

        const handleOnline = () => {
            setIsOffline(false);
            setIsReconnecting(false);
        };
        const handleOffline = () => {
            setIsOffline(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // 3. Inspect Network Information API for 2G / 3G / Save-Data
        const navConn = (window.navigator as any)?.connection;
        const updateConnectionQuality = () => {
            if (!navConn) return;
            const slowTypes = ["slow-2g", "2g", "3g"];
            const slow = Boolean(
                navConn.saveData ||
                slowTypes.includes(navConn.effectiveType) ||
                (typeof navConn.rtt === "number" && navConn.rtt > 600)
            );
            setIsSlowNetwork(slow);
        };

        updateConnectionQuality();
        navConn?.addEventListener?.("change", updateConnectionQuality);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            navConn?.removeEventListener?.("change", updateConnectionQuality);
        };
    }, []);

    const checkConnectionNow = useCallback(async (): Promise<boolean> => {
        setIsReconnecting(true);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const res = await fetch("/robots.txt", {
                method: "HEAD",
                cache: "no-store",
                signal: controller.signal,
            });
            clearTimeout(timeout);
            const online = res.ok || res.status === 304;
            setIsOffline(!online);
            setIsReconnecting(false);
            return online;
        } catch {
            setIsOffline(true);
            setIsReconnecting(false);
            return false;
        }
    }, []);

    // Auto-reconnect heartbeat when offline
    useEffect(() => {
        if (!isOffline) return;
        const interval = setInterval(() => {
            void checkConnectionNow();
        }, 8000);
        return () => clearInterval(interval);
    }, [isOffline, checkConnectionNow]);

    const enableLiteMode = useCallback(() => {
        setIsLiteMode(true);
        document.documentElement.classList.add("skb-lite-mode");
        try {
            window.localStorage.setItem(LITE_MODE_STORAGE_KEY, "1");
        } catch {
            // Ignore
        }
    }, []);

    const disableLiteMode = useCallback(() => {
        setIsLiteMode(false);
        document.documentElement.classList.remove("skb-lite-mode");
        try {
            window.localStorage.removeItem(LITE_MODE_STORAGE_KEY);
        } catch {
            // Ignore
        }
    }, []);

    const startTrackedOperation = useCallback((initialLabel = "Validating itinerary & IST schedule...") => {
        setProgressPercent(16);
        setProgressStageLabel(initialLabel);
    }, []);

    const advanceOperationProgress = useCallback((percent: number, label: string) => {
        setProgressPercent(Math.min(99, Math.max(16, Math.round(percent))));
        setProgressStageLabel(label);
    }, []);

    const completeTrackedOperation = useCallback(() => {
        setProgressPercent(100);
        setProgressStageLabel("Completed");
        setTimeout(() => {
            setProgressPercent(null);
            setProgressStageLabel(null);
        }, 400);
    }, []);

    const mode: NetworkQualityMode = isOffline
        ? "offline"
        : isLiteMode
            ? "lite_mode"
            : isSlowNetwork
                ? "online_slow"
                : "online_fast";

    return (
        <NetworkAndLiteModeContext.Provider
            value={{
                mode,
                isOffline,
                isSlowNetwork,
                isLiteMode,
                isReconnecting,
                progressPercent,
                progressStageLabel,
                enableLiteMode,
                disableLiteMode,
                startTrackedOperation,
                advanceOperationProgress,
                completeTrackedOperation,
                checkConnectionNow,
            }}
        >
            <NetworkResilienceBanner />
            {children}
        </NetworkAndLiteModeContext.Provider>
    );
}

export function useNetworkAndLiteMode(): NetworkAndLiteModeContextValue {
    const ctx = useContext(NetworkAndLiteModeContext);
    if (!ctx) {
        throw new Error("useNetworkAndLiteMode must be used within a NetworkAndLiteModeProvider");
    }
    return ctx;
}

/**
 * Sticky top banner for State 4 (Offline) and State 5 (Slow Network / Lite Mode).
 */
export function NetworkResilienceBanner() {
    const {
        isOffline,
        isSlowNetwork,
        isLiteMode,
        isReconnecting,
        progressPercent,
        progressStageLabel,
        enableLiteMode,
        disableLiteMode,
        checkConnectionNow,
    } = useNetworkAndLiteMode();

    if (!isOffline && !isSlowNetwork && !isLiteMode && progressPercent === null) {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className="w-full border-b border-border-warm bg-sandstone-wash text-ink-charcoal px-4 py-2 text-body-sm"
        >
            <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-2">
                {isOffline ? (
                    <div className="flex items-center gap-2.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
                        <span>
                            <strong>You are offline.</strong> Showing saved routes, packages, and your trip draft from your last visit.
                        </span>
                    </div>
                ) : progressPercent !== null ? (
                    <div className="flex items-center gap-3 flex-1">
                        <span className="font-semibold text-primary">{progressPercent}%</span>
                        <span>{progressStageLabel ?? "Loading..."}</span>
                        <div className="w-32 sm:w-48 h-2 rounded-full bg-surface overflow-hidden border border-border-warm">
                            <div
                                className="h-full bg-primary transition-all duration-200"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                ) : isLiteMode ? (
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-success-jade text-ivory-surface font-label-caps">
                            LITE MODE ACTIVE
                        </span>
                        <span>Heavy images and animations are turned off for faster browsing on your connection.</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span>Slow mobile network detected. Switch to Lite Mode for instant text-first loading.</span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {isOffline && (
                        <button
                            type="button"
                            onClick={() => void checkConnectionNow()}
                            disabled={isReconnecting}
                            className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-primary text-ivory-surface font-label-lg text-body-sm cursor-pointer"
                        >
                            {isReconnecting ? "Reconnecting..." : "Retry Connection"}
                        </button>
                    )}

                    {!isLiteMode && (isSlowNetwork || progressPercent !== null) && (
                        <button
                            type="button"
                            onClick={enableLiteMode}
                            className="min-h-[44px] px-3.5 py-1.5 rounded-lg border border-primary text-primary font-semibold text-body-sm cursor-pointer"
                        >
                            Switch to Lite Mode
                        </button>
                    )}

                    {isLiteMode && (
                        <button
                            type="button"
                            onClick={disableLiteMode}
                            className="min-h-[44px] px-3 py-1 rounded-lg border border-border-warm text-ink-slate text-body-sm cursor-pointer"
                        >
                            Restore Full Graphics
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
