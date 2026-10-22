import { useState, type FormEvent } from "react";
import { useCustomerAuth, getCustomerDisplayName, getStoredAuthReturnTo } from "../auth/customerAuth";

export function LoginPage() {
  const { user, loading, configured, error: authError, signInWithGoogle, signInWithPassword, signOut } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const returnTo = query?.get("returnTo") || getStoredAuthReturnTo();

  const handleReturn = () => {
    if (typeof window !== "undefined") {
      const target = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/my-bookings";
      window.location.assign(target);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }
    setLocalError(null);
    setBusy(true);
    try {
      await signInWithPassword(email, password);
      handleReturn();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Unable to sign in with credentials.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[65vh] p-8 grid place-items-center bg-surface">
        <section className="text-center">
          <h1 className="text-2xl font-bold text-ink-midnight">Customer Sign-in</h1>
          <p className="mt-2 text-on-surface-variant">Checking account state…</p>
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <main className="min-h-[65vh] px-4 py-16 grid place-items-center bg-surface">
        <section className="w-full max-w-md rounded-2xl border border-border-warm bg-surface-container-lowest p-8 text-center shadow-md">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-3xl">account_circle</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-ink-midnight">Signed In</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Welcome, <strong>{getCustomerDisplayName(user)}</strong> ({user.email})
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href="/my-bookings"
              className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-opacity hover:opacity-95"
            >
              Go to My Bookings
            </a>
            <a
              href="/book.html"
              className="w-full rounded-xl border border-border-warm bg-white px-4 py-3 font-semibold text-ink-midnight hover:bg-sandstone-wash transition-colors"
            >
              Book a Ride
            </a>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-2 text-sm text-on-surface-variant hover:text-primary transition-colors underline"
            >
              Sign out of this account
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[75vh] px-4 py-16 grid place-items-center bg-surface">
      <section className="w-full max-w-md rounded-2xl border border-border-warm bg-surface-container-lowest p-8 shadow-md">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-primary font-bold">Customer Portal</p>
          <h1 className="mt-2 text-2xl font-bold text-ink-midnight">Sign in to your account</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Access your verified booking vouchers, track driver status, and review trip receipts.
          </p>
        </div>

        {(localError || authError) && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800" role="alert">
            {localError || authError}
          </div>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-warm" />
          <span className="text-xs uppercase tracking-wider text-on-surface-variant">Or sign in with</span>
          <div className="h-px flex-1 bg-border-warm" />
        </div>

        {/* Google OAuth Login */}
        <button
          type="button"
          disabled={!configured || busy}
          onClick={() => void signInWithGoogle(returnTo).catch((e) => setLocalError(e.message))}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-warm bg-white px-4 py-3 font-semibold text-ink-midnight hover:bg-sandstone-wash transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-primary shadow-2xs border border-border-warm">G</span>
          <span>Continue with Google</span>
        </button>

        {/* Email / Password Form */}
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-border-warm bg-surface px-3 py-2.5 text-sm text-ink-midnight outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-border-warm bg-surface px-3 py-2.5 text-sm text-ink-midnight outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-ink-midnight px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Verifying…" : "Sign in with Email"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
