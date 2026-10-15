import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { env } from "./env";
import type { AdminUser } from "./types";

export const SESSION_KEY = "skb-admin-session";
export const AUTH_EXPIRED_EVENT = "skb-admin-auth-expired";

let supabaseClient: SupabaseClient | null = null;

export function getAdminSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error("Backend is not connected.");
  }
  supabaseClient = createClient(url, key, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return supabaseClient;
}

export function extractSuperAdminUser(user: User, token: string): AdminUser {
  const role = user.app_metadata?.role;
  if (role !== "super_admin") {
    throw new Error("Access denied: insufficient privileges for the operations desk.");
  }

  if (env.ADMIN_EMAIL) {
    const userEmail = (user.email || "").trim().toLowerCase();
    if (userEmail !== env.ADMIN_EMAIL) {
      throw new Error(`Access denied: account (${user.email || "unknown"}) is not authorized for the operations desk.`);
    }
  }

  return {
    id: user.id || "usr_super_admin",
    role: "super_admin",
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "A. Baghel",
    email: user.email || "",
    token,
  };
}


/**
 * Verifies backend server connectivity before authentication.
 */
async function assertBackendConnected(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const healthRes = await fetch(`${env.API_BASE_URL}/api/v1/health`, {
      method: "GET",
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (!healthRes || !healthRes.ok) {
      throw new Error("Backend is not connected.");
    }
  } catch {
    throw new Error("Backend is not connected.");
  }
}

/**
 * Authenticates staff credentials against Supabase Auth.
 */
export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<AdminUser> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new Error("Please enter your administrator email address.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  if (env.ADMIN_EMAIL && trimmedEmail.toLowerCase() !== env.ADMIN_EMAIL) {
    throw new Error("Access denied: this email is not authorized for the operations desk.");
  }

  // 1. Verify backend server connectivity
  await assertBackendConnected();

  // Dev-only fallback for local development / testing with ALLOW_TEST_AUTH backend tokens
  if (
    import.meta.env.DEV &&
    trimmedEmail === "super_admin@test.local" &&
    (password === "test-super_admin" || password === "password123")
  ) {
    const adminUser: AdminUser = {
      id: "00000000-0000-4000-a000-000000000004",
      role: "super_admin",
      name: "Super Admin",
      email: "super_admin@test.local",
      token: "test-super_admin",
    };
    saveSession(adminUser);
    return adminUser;
  }

  // 2. Production path: Supabase Auth
  try {
    const client = getAdminSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error || !data.user || !data.session) {
      const message = error?.message || "Invalid email or password. Please check your credentials.";
      const lower = message.toLowerCase();
      if (
        lower.includes("invalid login credentials") ||
        lower.includes("invalid_grant") ||
        lower.includes("invalid email or password")
      ) {
        throw new Error("Invalid email or password. Please check your credentials.");
      }
      if (lower.includes("rate limit") || lower.includes("too many")) {
        throw new Error("Too many failed attempts. Please try again later.");
      }
      throw new Error(message || "Backend is not connected.");
    }

    const adminUser = extractSuperAdminUser(data.user, data.session.access_token);
    saveSession(adminUser);
    return adminUser;
  } catch (err) {
    if (err instanceof Error) {
      if (
        err.message.includes("Invalid email or password") ||
        err.message.includes("Access denied") ||
        err.message.includes("Too many failed attempts")
      ) {
        throw err;
      }
    }
    throw new Error("Backend is not connected.");
  }
}

/**
 * Initiates Google OAuth with Supabase Auth using PKCE flow.
 * Redirect URL is fixed to `${window.location.origin}/auth/callback`.
 */
export async function signInWithGoogle(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Sign-in can only start in a browser.");
  }
  await assertBackendConnected();

  const client = getAdminSupabaseClient();
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      scopes: "openid email profile",
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) {
    throw new Error(error.message || "Google OAuth could not be initiated.");
  }
}

/**
 * Handles the OAuth callback by exchanging the returned code for a Supabase session
 * and strictly enforcing `app_metadata.role === 'super_admin'`.
 */
export async function handleAuthCallback(): Promise<AdminUser> {
  if (typeof window === "undefined") {
    throw new Error("Auth callback can only execute in a browser.");
  }
  const client = getAdminSupabaseClient();
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  let session: Session | null = null;
  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      throw new Error(error.message || "Google OAuth could not be completed.");
    }
    session = data.session;
  } else {
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw new Error(error.message || "Google OAuth could not be completed.");
    }
    session = data.session;
  }

  if (!session || !session.user) {
    throw new Error("Google OAuth could not be completed. No active session returned.");
  }

  try {
    const adminUser = extractSuperAdminUser(session.user, session.access_token);
    saveSession(adminUser);
    if (typeof window !== "undefined" && window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname || "/");
    }
    return adminUser;
  } catch (err) {
    await client.auth.signOut().catch(() => {});
    clearSession();
    throw err;
  }
}

export function getStoredSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminUser>;
    if (
      typeof parsed.id !== "string" ||
      parsed.role !== "super_admin" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.token !== "string" ||
      (parsed.token.length < 20 && !parsed.token.startsWith("test-"))
    ) {
      clearSession();
      return null;
    }
    return parsed as AdminUser;
  } catch {
    clearSession();
    return null;
  }
}

export async function validateStoredSession(user: AdminUser): Promise<boolean> {
  try {
    const response = await fetch(`${env.API_BASE_URL}/api/v1/ops/admin/audit-logs?limit=1`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function saveSession(user: AdminUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function expireSession(): void {
  clearSession();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

export function getAuthHeaders(user?: AdminUser | null): Record<string, string> {
  const token = user?.token || getStoredSession()?.token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
