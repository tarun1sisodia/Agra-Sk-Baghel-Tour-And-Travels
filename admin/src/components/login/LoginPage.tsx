import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { loginWithCredentials, signInWithGoogle } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

const easeExpo = [0.16, 1, 0.3, 1] as const;

/** Route constellation: Agra → Delhi → Jaipur. Decorative, aria-hidden. */
function RouteScene() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 480 300" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="loginGlow" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="480" height="300" fill="url(#loginGlow)" />
      {[
        { x: 70, y: 210, r: 5 },
        { x: 170, y: 130, r: 4 },
        { x: 290, y: 170, r: 4 },
        { x: 405, y: 70, r: 6 },
      ].map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill="var(--gold)"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.16, type: "spring", stiffness: 300, damping: 18 }}
        />
      ))}
      <motion.path
        d="M70 210 C 110 185, 130 140, 170 130 C 225 118, 245 175, 290 170 C 345 165, 360 95, 405 70"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeDasharray="5 6"
        strokeLinecap="round"
        opacity="0.9"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: easeExpo, delay: 0.25 }}
      />
      <circle cx="405" cy="70" r="6" fill="none" stroke="var(--gold)" strokeWidth="1.5">
        {!reduce && (
          <animate attributeName="r" values="6;20" dur="2.4s" repeatCount="indefinite" begin="1.4s" />
        )}
        {!reduce && (
          <animate attributeName="opacity" values="0.7;0" dur="2.4s" repeatCount="indefinite" begin="1.4s" />
        )}
      </circle>
    </svg>
  );
}

export function LoginPage({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailValid && password.length >= 6 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);

    try {
      const authedUser = await loginWithCredentials(email, password);
      onLogin(authedUser);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to sign in right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to initiate Google sign in.");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-night p-10 lg:flex">
        <div className="absolute inset-0 opacity-90">
          <RouteScene />
        </div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeExpo }}
          className="relative flex flex-col items-start gap-2"
        >
          <img
            src="/assets/brand/agra-sk-baghel-logo-inverse.svg"
            alt="Agra SK Baghel Tour & Travels"
            width={845}
            height={230}
            className="h-14 w-auto max-w-full object-contain"
          />
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8c857e]">
            Agra · Operations Desk
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeExpo, delay: 0.15 }}
          className="relative max-w-md"
        >
          <p className="font-display text-2xl leading-snug tracking-tight text-white">
            Run the day&rsquo;s bookings, dispatch and payments from one desk.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[#b5afa9]">
            The internal panel for the Agra SK Baghel fleet — booking lifecycle,
            payment reconciliation, tour catalog, review moderation and a complete
            audit trail of every action.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {["Bookings", "Dispatch", "Payments", "Catalog", "Audit"].map((chip) => (
              <li
                key={chip}
                className="rounded-pill border border-white/12 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#d6d0c9]"
              >
                {chip}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative font-mono text-[11px] uppercase tracking-[0.18em] text-[#8c857e]">
          © {new Date().getFullYear()} Agra SK Baghel Tour &amp; Travels
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-10">
        {/* Mobile brand */}
        <div className="mb-8 flex flex-col items-start gap-2 lg:hidden">
          <img
            src="/assets/brand/agra-sk-baghel-logo.svg"
            alt="Agra SK Baghel Tour & Travels"
            width={845}
            height={230}
            className="h-12 w-auto max-w-[min(72vw,250px)] object-contain"
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">Operations Desk</p>
        </div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeExpo, delay: 0.08 }}
          className="w-full max-w-[400px]"
        >
          <h1 className="font-display text-[28px] font-medium tracking-tight text-ink">Sign in</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Staff access to the operations desk. Authorized personnel only.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            {error && (
              <motion.div
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-md border border-error/20 bg-error-soft p-3.5 text-[13px] leading-snug text-error"
                role="alert"
                aria-live="assertive"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}

            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoFocus
                autoComplete="username"
                inputMode="email"
                placeholder="you@agraskbagheltourandtravels.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error && !emailValid)}
                disabled={busy}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error && password.length < 6)}
                  disabled={busy}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-ink-faint transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-gold"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={!canSubmit}
              className="w-full"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4.5 w-4.5" aria-hidden="true" />
                  Sign in
                </>
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-hairline" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 font-mono text-[10px] tracking-wider text-ink-faint">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2.5 font-medium text-ink"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.27 21.43 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>Sign in with Google</span>
            </Button>
          </form>

          <div className="mt-8 border-t border-hairline pt-5">
            <p className="text-center text-[12px] leading-relaxed text-ink-faint">
              Trouble signing in? Contact the super admin to reset your access.
            </p>
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              All sign-in activity is recorded for security
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
