import type { FastifyRequest } from "fastify";
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import type { Env } from "../../src/config/env.js";
import { authenticateRequest } from "../../src/middlewares/authGuard.js";

const JWT_SECRET = "unit-test-supabase-jwt-secret";
const JWT_KEY = new TextEncoder().encode(JWT_SECRET);

function envWith(overrides: Partial<Env> = {}): Env {
  return {
    SUPABASE_JWT_SECRET: JWT_SECRET,
    SUPABASE_URL: "",
    ALLOW_TEST_AUTH: false,
    ADMIN_EMAIL: "",
    ...overrides,
  } as Env;
}

async function signedToken(email?: string): Promise<string> {
  const payload: Record<string, unknown> = {
    sub: "admin-user-1",
    app_metadata: { role: "super_admin" },
  };
  if (email !== undefined) payload.email = email;

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setAudience("authenticated")
    .setIssuedAt()
    .sign(JWT_KEY);
}

function requestFor(token: string): FastifyRequest {
  return { headers: { authorization: `Bearer ${token}` } } as FastifyRequest;
}

describe("authenticateRequest ADMIN_EMAIL whitelist", () => {
  it("accepts a valid super_admin token matching ADMIN_EMAIL", async () => {
    const token = await signedToken("admin@example.com");

    await expect(
      authenticateRequest(requestFor(token), envWith({ ADMIN_EMAIL: "admin@example.com" })),
    ).resolves.toMatchObject({
      id: "admin-user-1",
      role: "super_admin",
      email: "admin@example.com",
    });
  });

  it("rejects a valid token with a non-whitelisted email with 403", async () => {
    const token = await signedToken("other@example.com");

    await expect(
      authenticateRequest(requestFor(token), envWith({ ADMIN_EMAIL: "admin@example.com" })),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
    });
  });

  it("rejects a valid token missing an email with 403 when a whitelist is configured", async () => {
    const token = await signedToken();

    await expect(
      authenticateRequest(requestFor(token), envWith({ ADMIN_EMAIL: "admin@example.com" })),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
    });
  });

  it("normalizes case and surrounding whitespace for the token email", async () => {
    const token = await signedToken("  Admin@Example.COM  ");

    await expect(
      authenticateRequest(requestFor(token), envWith({ ADMIN_EMAIL: "admin@example.com" })),
    ).resolves.toMatchObject({
      role: "super_admin",
      email: "Admin@Example.COM",
    });
  });

  it("allows a valid super_admin token through when ADMIN_EMAIL is unset", async () => {
    const token = await signedToken();

    await expect(authenticateRequest(requestFor(token), envWith())).resolves.toMatchObject({
      id: "admin-user-1",
      role: "super_admin",
      email: null,
    });
  });
});
