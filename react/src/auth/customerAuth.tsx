import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { onUserInteractionOrIdle } from "../utils/deferredRevalidation";

const AUTH_RETURN_TO_KEY = "arenaai:auth-return-to";
let customerClient: SupabaseClient | null = null;
let clientPromise: Promise<SupabaseClient> | null = null;

export function getCustomerSupabaseConfig(): { url: string; key: string } {
  const url = (import.meta.env.VITE_SUPABASE_URL || "")?.trim();
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "")?.trim();
  return { url, key };
}

export function hasCustomerSupabaseConfig(): boolean {
  const { url, key } = getCustomerSupabaseConfig();
  return Boolean(url && key);
}

export function hasPersistedCustomerAuthSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.location.search.includes("code=") || window.location.search.includes("error=")) {
      return true;
    }
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export async function getCustomerSupabaseClientAsync(): Promise<SupabaseClient> {
  if (customerClient) return customerClient;
  if (!clientPromise) {
    clientPromise = (async () => {
      const { url, key } = getCustomerSupabaseConfig();
      if (!url || !key) {
        throw new Error("Google sign-in is not configured on this site yet.");
      }
      const { createClient } = await import("@supabase/supabase-js");
      customerClient = createClient(url, key, {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return customerClient;
    })();
  }
  return clientPromise;
}

export function getCustomerSupabaseClient(): SupabaseClient {
  if (customerClient) return customerClient;
  const { url, key } = getCustomerSupabaseConfig();
  if (!url || !key) {
    throw new Error("Google sign-in is not configured on this site yet.");
  }
  throw new Error("Supabase client is initializing asynchronously. Please use getCustomerSupabaseClientAsync().");
}

export function safeInternalReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

/**
 * Returns a human-friendly message when the current URL carries an OAuth
 * error (e.g. after a failed Supabase/Google redirect), otherwise null.
 * The raw provider error is intentionally NOT surfaced to the user.
 */
export function friendlyOAuthSignInError(search: string): string | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  } catch {
    return null;
  }
  const error = params.get("error");
  const errorCode = params.get("error_code");
  const description = (params.get("error_description") || "").toLowerCase();
  if (!error && !errorCode) return null;
  if (errorCode === "bad_oauth_state" || description.includes("oauth state") || description.includes("expired")) {
    return "Your sign-in session expired before it could be completed. Please try signing in again.";
  }
  if (error === "access_denied" || description.includes("cancel")) {
    return "Sign-in was cancelled. Nothing was booked or charged.";
  }
  if (error === "server_error" || error === "temporarily_unavailable") {
    return "The sign-in service is temporarily unavailable. Please try again in a moment.";
  }
  return "Sign-in didn't complete. Please try again.";
}

/**
 * Strips OAuth error params (`error`, `error_code`, `error_description`) from
 * the current URL, keeping every other query param intact.
 */
export function clearOAuthErrorFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("error") && !url.searchParams.has("error_code")) return;
    url.searchParams.delete("error");
    url.searchParams.delete("error_code");
    url.searchParams.delete("error_description");
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  } catch { /* leave the URL untouched on unexpected failures */ }
}

/**
 * Detects errors that mean the PKCE/OAuth round-trip lost its state
 * (stale or missing code verifier), e.g. after a cross-origin redirect or
 * an expired OAuth attempt. Retrying the same exchange will never succeed;
 * the user must start a fresh sign-in.
 */
export function isStaleOAuthStateError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const haystack = message.toLowerCase();
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "").toLowerCase()
      : "";
  const needle = `${code} ${haystack}`;
  return (
    needle.includes("bad_oauth") ||
    needle.includes("oauth state") ||
    needle.includes("code verifier") ||
    needle.includes("code_verifier") ||
    needle.includes("pkce") ||
    needle.includes("invalid_grant") ||
    needle.includes("invalid code") ||
    needle.includes("auth code and code verifier should be non-empty")
  );
}

/**
 * Clears any locally persisted Supabase auth state (including a stale PKCE
 * code verifier) without touching the server session. Use before asking the
 * user to retry sign-in after a stale-state failure.
 */
export async function clearStaleCustomerAuthState(): Promise<void> {
  try {
    const client = await getCustomerSupabaseClientAsync();
    await client.auth.signOut({ scope: "local" });
  } catch { /* not configured or already cleared — nothing to do */ }
}


export interface CustomerAuthValue {
  session: Session | null;
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle(returnTo?: string): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const defaultContext: CustomerAuthValue = {
  session: null,
  user: null,
  accessToken: null,
  loading: true,
  configured: hasCustomerSupabaseConfig(),
  error: null,
  async signInWithGoogle() { throw new Error("Google sign-in is not available in this render context."); },
  async signInWithPassword() { throw new Error("Sign-in is not available in this render context."); },
  async signOut() { throw new Error("Sign-out is not available in this render context."); },
};

const CustomerAuthContext = createContext<CustomerAuthValue>(defaultContext);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === "undefined" || !hasCustomerSupabaseConfig()) return false;
    return hasPersistedCustomerAuthSession();
  });
  const [error, setError] = useState<string | null>(null);
  const configured = hasCustomerSupabaseConfig();

  useEffect(() => {
    let active = true;
    if (!configured) {
      setLoading(false);
      setError("Google sign-in is not configured on this build.");
      return () => { active = false; };
    }

    let unsubscribe: (() => void) | undefined;

    const setupAuth = async () => {
      try {
        const client = await getCustomerSupabaseClientAsync();
        if (!active) return;

        const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
          if (!active) return;
          setSession(nextSession);
          setLoading(false);
          setError(null);
        });
        unsubscribe = () => subscription.unsubscribe();

        const { data, error: sessionError } = await client.auth.getSession();
        if (!active) return;
        setSession(data.session);
        setLoading(false);
        if (sessionError) setError("Could not restore your sign-in session. Please sign in again.");
      } catch {
        if (!active) return;
        setSession(null);
        setLoading(false);
        setError("Could not restore your sign-in session. Please sign in again.");
      }
    };

    if (hasPersistedCustomerAuthSession()) {
      void setupAuth();
      return () => {
        active = false;
        unsubscribe?.();
      };
    }

    const cancelIdle = onUserInteractionOrIdle(() => {
      if (active) {
        void setupAuth();
      }
    }, 8000);

    return () => {
      active = false;
      cancelIdle();
      unsubscribe?.();
    };
  }, [configured]);

  const signInWithGoogle = useCallback(async (returnTo = typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`) => {
    if (typeof window === "undefined") throw new Error("Sign-in can only start in a browser.");
    const client = await getCustomerSupabaseClientAsync();
    const safeReturn = safeInternalReturnTo(returnTo);
    try { window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, safeReturn); } catch { /* callback falls back to home */ }
    const redirectTo = new URL("/auth/callback/", window.location.origin).toString();
    const { error: signInError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "openid email profile",
        queryParams: { prompt: "select_account" },
      },
    });
    if (signInError) throw signInError;
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const client = await getCustomerSupabaseClientAsync();
    const { data, error: signInError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) throw signInError;
    setSession(data.session);
  }, []);

  const signOut = useCallback(async () => {
    const client = await getCustomerSupabaseClientAsync();
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) throw signOutError;
    setSession(null);
  }, []);

  const value = useMemo<CustomerAuthValue>(() => ({
    session,
    user: session?.user ?? null,
    accessToken: session?.access_token ?? null,
    loading,
    configured,
    error,
    signInWithGoogle,
    signInWithPassword,
    signOut,
  }), [session, loading, configured, error, signInWithGoogle, signInWithPassword, signOut]);

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthValue {
  return useContext(CustomerAuthContext);
}

export function getStoredAuthReturnTo(): string {
  if (typeof window === "undefined") return "/";
  try {
    const value = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY);
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return safeInternalReturnTo(value);
  } catch {
    return "/";
  }
}

export function getCustomerDisplayName(user: User | null): string {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const value = metadata?.full_name ?? metadata?.name ?? user?.email?.split("@")[0];
  return typeof value === "string" && value.trim() ? value.trim() : "Your account";
}

export function getCustomerAvatarUrl(user: User | null): string | null {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const url = metadata?.avatar_url ?? metadata?.picture;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export function getCustomerInitials(user: User | null): string {
  const name = getCustomerDisplayName(user);
  if (!name || name === "Your account") return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

