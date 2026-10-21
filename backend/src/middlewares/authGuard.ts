import { createRemoteJWKSet, jwtVerify, decodeProtectedHeader } from "jose";
import type { FastifyRequest } from "fastify";
import type { Env } from "../config/env.js";
import { Errors } from "../shared/errors.js";
import { USER_ROLES, type AuthUser, type UserRole } from "../types/domain.js";

const TEST_ROLE_PREFIX = "test-";

// JWKS cache: Map of normalized URL to JWKSet function
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Secure authentication:
 * - Only trusts app_metadata.role (server-controlled), never user_metadata or payload.role which are client-writable
 * - Validates sub exists
 * - Rejects expired/invalid JWTs via jose verification
 * - Test auth is strictly opt-in and blocked in production via env validation
 */
export async function authenticateRequest(request: FastifyRequest, env: Env): Promise<AuthUser | null> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;
  if (token.length > 2048) throw Errors.unauthorized("Token too long.");

  if (env.ALLOW_TEST_AUTH && token.startsWith(TEST_ROLE_PREFIX)) {
    const role = token.slice(TEST_ROLE_PREFIX.length) as UserRole;
    if (!USER_ROLES.includes(role)) {
      throw Errors.unauthorized("Unknown test role.");
    }
    return {
      id: `00000000-0000-4000-a000-00000000000${USER_ROLES.indexOf(role)}`,
      role,
      email: `${role}@test.local`,
      phone: null,
    };
  }

  try {
    let headerAlg: string | undefined;
    try {
      headerAlg = decodeProtectedHeader(token).alg;
    } catch {
      // Invalid header structure
      throw Errors.unauthorized("Malformed access token.");
    }

    const isSymmetric = headerAlg?.startsWith("HS");

    // 1. If symmetric (HS256) and secret is provided, verify with secret
    if (isSymmetric && env.SUPABASE_JWT_SECRET) {
      const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
      const { payload } = await jwtVerify(token, secret, { audience: "authenticated" });
      return enforceAdminEmailWhitelist(principalFromPayload(payload as unknown as Record<string, unknown>), env);
    }

    // 2. If asymmetric (ES256/RS256) or no symmetric secret, verify against Supabase JWKS
    if (env.SUPABASE_URL) {
      const normalizedUrl = env.SUPABASE_URL.replace(/\/+$/, "");
      const jwksUrl = `${normalizedUrl}/auth/v1/.well-known/jwks.json`;
      // Use cached JWKSet if available
      let jwks = jwksCache.get(jwksUrl);
      if (!jwks) {
        jwks = createRemoteJWKSet(new URL(jwksUrl));
        jwksCache.set(jwksUrl, jwks);
      }
      const { payload } = await jwtVerify(token, jwks, {
        issuer: [`${normalizedUrl}/auth/v1`, normalizedUrl, "supabase"],
        audience: "authenticated",
      });
      return enforceAdminEmailWhitelist(principalFromPayload(payload as unknown as Record<string, unknown>), env);
    }

    // 3. Fallback to secret if JWKS is not configured
    if (env.SUPABASE_JWT_SECRET) {
      const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
      const { payload } = await jwtVerify(token, secret, { audience: "authenticated" });
      return enforceAdminEmailWhitelist(principalFromPayload(payload as unknown as Record<string, unknown>), env);
    }
  } catch (err) {
    console.warn("[AUTH] Token verification failed:", err);
    throw Errors.unauthorized("Invalid or expired access token.");
  }

  return null;
}

function principalFromPayload(payload: Record<string, unknown>): AuthUser {
  const sub = String(payload.sub ?? "").trim();
  if (!sub) throw Errors.unauthorized("Token missing subject.");

  // Only trust app_metadata.role which is server-controlled
  const appMeta = asRecord(payload.app_metadata);
  const roleRaw = String(appMeta.role ?? "customer").trim();
  const role = USER_ROLES.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : "customer";

  const email = payload.email ? String(payload.email).trim() : null;
  const phone = payload.phone ? String(payload.phone).trim() : null;

  return {
    id: sub,
    role,
    email: email && email.includes("@") ? email : null,
    phone: phone && /^\+?[0-9]{10,14}$/.test(phone) ? phone : null,
  };
}

export function requireUser(request: FastifyRequest): AuthUser {
  if (!request.user) throw Errors.unauthorized();
  if (!request.user.id) throw Errors.unauthorized("Invalid principal.");
  return request.user;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function enforceAdminEmailWhitelist(user: AuthUser, env: Env): AuthUser {
  if (user.role === "super_admin" && env.ADMIN_EMAIL) {
    const email = (user.email || "").trim().toLowerCase();
    if (email !== env.ADMIN_EMAIL.toLowerCase()) {
      console.warn(`[AUTH] super_admin rejected: email "${email}" does not match ADMIN_EMAIL whitelist`);
      throw Errors.forbidden("Access denied: account is not authorized for operations desk.");
    }
  }
  return user;
}

