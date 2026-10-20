import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, CheckCircle2, Lock, Sparkles, Check, ArrowRight } from "lucide-react";

export type CountdownStage = "preparing_checkout" | "verifying_payment";

export interface BookingPaymentCountdownModalProps {
  isOpen: boolean;
  stage: CountdownStage;
  ticketId?: string;
  advanceAmount?: number;
  totalAmount?: number;
  onCountdownComplete: () => void;
  onDismiss?: () => void;
}

function formatINR(amount?: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export const BookingPaymentCountdownModal: React.FC<BookingPaymentCountdownModalProps> = ({
  isOpen,
  stage,
  ticketId,
  advanceAmount,
  totalAmount,
  onCountdownComplete,
  onDismiss,
}) => {
  const initialSeconds = stage === "preparing_checkout" ? 3 : 7;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const callbackRef = useRef(onCountdownComplete);
  callbackRef.current = onCountdownComplete;

  // Reset countdown whenever stage or isOpen changes
  useEffect(() => {
    if (!isOpen) return;
    const duration = stage === "preparing_checkout" ? 3 : 7;
    setSecondsRemaining(duration);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            callbackRef.current();
          }, 350);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, stage]);

  if (!isOpen) return null;

  const totalDuration = stage === "preparing_checkout" ? 3 : 7;
  const progressRatio = Math.max(0, Math.min(1, (totalDuration - secondsRemaining) / totalDuration));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="countdown-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-hairline bg-surface p-6 sm:p-8 text-center shadow-2xl"
        >
          {/* Ambient Glow */}
          <div
            className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl opacity-30 ${
              stage === "preparing_checkout" ? "bg-primary" : "bg-emerald-500"
            }`}
          />

          {/* Progress Circular Countdown */}
          <div className="relative mx-auto my-3 flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-surface-2"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`transition-all duration-1000 ease-linear ${
                  stage === "preparing_checkout" ? "stroke-primary" : "stroke-emerald-500"
                }`}
                strokeWidth="6"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>

            {/* Numeric Countdown Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-bold tracking-tight text-ink">
                {secondsRemaining > 0 ? secondsRemaining : "✓"}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                {secondsRemaining > 0 ? "Seconds" : "Ready"}
              </span>
            </div>
          </div>

          {/* Stage Content */}
          {stage === "preparing_checkout" ? (
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
                  Bank-Grade Encryption
                </span>
              </div>

              <h2
                id="countdown-modal-title"
                className="mt-3 font-display text-xl font-bold text-ink sm:text-2xl"
              >
                Launching Payment Gateway
              </h2>

              <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
                Opening Razorpay in{" "}
                <span className="font-bold text-primary font-mono">{secondsRemaining}s</span>. Please
                keep this window open to complete your reservation.
              </p>

              {/* Progress Steps */}
              <div className="mt-5 space-y-2 rounded-xl border border-hairline bg-surface-2/50 p-3.5 text-left text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span className="text-ink font-medium">Vehicle allocation locked on server</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      secondsRemaining <= 2
                        ? "bg-emerald-500/20 text-emerald-600"
                        : "bg-surface-2 text-ink-faint"
                    }`}
                  >
                    {secondsRemaining <= 2 ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                    )}
                  </span>
                  <span className={secondsRemaining <= 2 ? "text-ink font-medium" : "text-ink-soft"}>
                    28% advance deposit invoice generated
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      secondsRemaining <= 1
                        ? "bg-emerald-500/20 text-emerald-600"
                        : "bg-surface-2 text-ink-faint"
                    }`}
                  >
                    {secondsRemaining <= 1 ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <Lock className="h-2.5 w-2.5 text-ink-faint" />
                    )}
                  </span>
                  <span className={secondsRemaining <= 1 ? "text-ink font-medium" : "text-ink-soft"}>
                    Launching secure Razorpay portal
                  </span>
                </div>
              </div>

              {advanceAmount ? (
                <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-xs">
                  <span className="text-ink-soft font-mono">Advance Due Today (28%):</span>
                  <span className="font-display font-bold text-primary text-sm">
                    {formatINR(advanceAmount)}
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
                  Payment Received
                </span>
              </div>

              <h2
                id="countdown-modal-title"
                className="mt-3 font-display text-xl font-bold text-ink sm:text-2xl"
              >
                Reservation Confirmed!
              </h2>

              <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
                Confirming with Agra dispatch and issuing your ticket pass in{" "}
                <span className="font-bold text-emerald-600 font-mono">{secondsRemaining}s</span>…
              </p>

              {/* Progress Steps for 7s */}
              <div className="mt-5 space-y-2 rounded-xl border border-hairline bg-surface-2/50 p-3.5 text-left text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span className="text-ink font-medium">Digital payment signature verified</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      secondsRemaining <= 4
                        ? "bg-emerald-500/20 text-emerald-600"
                        : "bg-surface-2 text-ink-faint"
                    }`}
                  >
                    {secondsRemaining <= 4 ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </span>
                  <span className={secondsRemaining <= 4 ? "text-ink font-medium" : "text-ink-soft"}>
                    Vehicle and chauffeur schedule assigned
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      secondsRemaining <= 2
                        ? "bg-emerald-500/20 text-emerald-600"
                        : "bg-surface-2 text-ink-faint"
                    }`}
                  >
                    {secondsRemaining <= 2 ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <Sparkles className="h-2.5 w-2.5 text-ink-faint" />
                    )}
                  </span>
                  <span className={secondsRemaining <= 2 ? "text-ink font-medium" : "text-ink-soft"}>
                    Generating official PDF booking pass & SMS
                  </span>
                </div>
              </div>

              {ticketId ? (
                <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-xs">
                  <span className="text-ink-soft font-mono">Booking Reference:</span>
                  <span className="font-mono font-bold text-ink text-xs">{ticketId}</span>
                </div>
              ) : null}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => callbackRef.current()}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                >
                  <span>Click here to view confirmation now</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Dismiss button if user needs to cancel pre-checkout */}
          {stage === "preparing_checkout" && onDismiss ? (
            <div className="mt-4 pt-2">
              <button
                type="button"
                onClick={onDismiss}
                className="font-mono text-[11px] text-ink-faint hover:text-ink transition-colors"
              >
                Cancel and return to form
              </button>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
