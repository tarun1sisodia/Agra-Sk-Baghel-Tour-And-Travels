import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().default("http://localhost:4000"),
  CUSTOMER_SITE_URL: z.string().url().default("https://agraskbagheltourandtravels.com"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  FARE_RULES_VERSION: z.string().min(1).default("2026-09-13"),
  CORS_ORIGINS: z
    .string()
    .default(
      "http://localhost:5173,http://localhost:5174,http://localhost:4174,http://localhost:4175,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:4174,http://127.0.0.1:4175,http://localhost:3000,https://agraskbagheltourandtravels.com,https://www.agraskbagheltourandtravels.com,https://admin.agraskbagheltourandtravels.com,https://skbagheltravels-admin.coccoder999.workers.dev,https://agraskbagheltourandtravels.com",
    ),
  CUSTOMER_AUTH_REQUIRED_FOR_NEW_BOOKINGS: z
    .string()
    .optional()
    .transform((value) => value === "true" || value === "1"),

  ALLOW_TEST_AUTH: z
    .string()
    .optional()
    .transform((value) => {
      if (value === "true" || value === "1") return true;
      if (value === "false" || value === "0") return false;
      return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" || !process.env.NODE_ENV;
    }),

  DATABASE_URL: z.string().optional().default(""),
  SUPABASE_URL: z.string().optional().default(""),
  SUPABASE_ANON_KEY: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  SUPABASE_JWT_SECRET: z.string().optional().default(""),
  // Supabase Storage bucket the admin CMS uploads catalog images into.
  // Falls back to inline DB storage when neither storage backend below is configured.
  CATALOG_MEDIA_BUCKET: z
    .string()
    .trim()
    .optional()
    .transform((val) => val || process.env.S3_BUCKET_NAME || "skb-media-backup"),
  S3_BUCKET_NAME: z.string().trim().optional(),
  SUPABASE_MEDIA_BUCKET: z.string().trim().optional().default("documents"),
  // S3 protocol connection (preferred) — Supabase Storage's S3-compatible
  // endpoint, or any other S3-compatible provider (AWS S3, R2, MinIO...).
  // Find this under Supabase Dashboard -> Storage -> S3 Connection.
  S3_ENDPOINT: z.string().optional().default(""),
  S3_REGION: z
    .string()
    .trim()
    .optional()
    .transform((val) => val || (process.env.S3_ENDPOINT?.includes("r2.cloudflarestorage.com") ? "auto" : "us-east-1")),
  S3_ACCESS_KEY_ID: z.string().optional().default(""),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(""),

  MONGODB_URI: z.string().optional().default(""),

  RAZORPAY_KEY_ID: z.string().trim().optional().default(""),
  RAZORPAY_KEY_SECRET: z.string().trim().optional().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().trim().optional().default(""),

  LOCATIONIQ_TOKEN: z.string().trim().optional().default(""),

  WHATSAPP_TOKEN: z.string().optional().default(""),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(""),
  WHATSAPP_TEMPLATE_PAYMENT: z.string().default("skb_payment_confirmed"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("bookings@agraskbagheltourandtravels.com"),
  ADMIN_EMAIL: z.string().trim().optional().default(""),
  // Cloudflare deploy hook fired after admin publishes content (routes, packages, monuments).
  PAGES_DEPLOY_HOOK_URL: z.string().optional().default(""),
  CLOUDFLARE_DEPLOY_HOOK_URL: z.string().optional().default(""),
  DEPLOY_CALLBACK_SECRET: z.string().optional().default(""),
  // Razorpay pending payment timeout window before auto-cancelling abandoned bookings (default 30 min)
  PAYMENT_PENDING_EXPIRY_MINUTES: z.coerce.number().min(1).max(1440).default(30),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (source === process.env) {
    try {
      process.loadEnvFile?.("backend/.env");
    } catch {
      // ignore if not running from repo root
    }
    try {
      process.loadEnvFile?.(".env");
    } catch {
      // .env file is optional in production/container environments
    }
  }
  if (cached && source === process.env) return cached;
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === "production") {
    const missing: string[] = [];
    if (!env.DATABASE_URL) missing.push("DATABASE_URL");
    if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!env.SUPABASE_JWT_SECRET && !env.SUPABASE_URL) {
      // Need at least one way to verify JWTs
      missing.push("SUPABASE_JWT_SECRET or SUPABASE_URL for JWT verification");
    }
    // Payment provider: Razorpay is mandatory in production; test HMAC fallback prohibited
    if (!/^rzp_live_[A-Za-z0-9_-]+$/.test(env.RAZORPAY_KEY_ID)) {
      missing.push("RAZORPAY_KEY_ID must be a valid rzp_live_ key in production");
    }
    if (!env.RAZORPAY_KEY_SECRET) {
      missing.push("RAZORPAY_KEY_SECRET is mandatory in production");
    }
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      missing.push("RAZORPAY_WEBHOOK_SECRET is mandatory in production");
    }
    if (!env.DEPLOY_CALLBACK_SECRET) {
      missing.push("DEPLOY_CALLBACK_SECRET is mandatory in production");
    }
    if (env.ALLOW_TEST_AUTH) missing.push("ALLOW_TEST_AUTH must be false in production");
    // Validate CORS origins are HTTPS in production
    const origins = env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
    const insecure = origins.filter((o) => !o.startsWith("https://") && !o.includes("localhost"));
    if (insecure.length > 0) {
      missing.push(`CORS_ORIGINS contains insecure origins in production: ${insecure.join(", ")}`);
    }
    if (missing.length > 0) {
      throw new Error(`Production environment is incomplete: ${missing.join(", ")}`);
    }
  }
  // SEC-003 defence-in-depth: catch ALLOW_TEST_AUTH=true on a server that has a real DB URL
  // (staging/docker accident detection — not restricted to NODE_ENV=production)
  if (env.ALLOW_TEST_AUTH && env.DATABASE_URL && env.NODE_ENV !== "test") {
    // Warn loudly — do not throw so tests that set DATABASE_URL for integration can still run
    // eslint-disable-next-line no-console
    console.warn(
      "[SECURITY WARNING] ALLOW_TEST_AUTH=true with a real DATABASE_URL detected. " +
      "This grants unauthenticated super_admin access. Remove ALLOW_TEST_AUTH from any non-test environment.",
    );
  }


  if (source === process.env) cached = env;
  return env;
}

export function resetEnvCache(): void {
  cached = null;
}

export function corsOriginList(env: Env): string[] {
  return env.CORS_ORIGINS.split(",")
    .map((item) => item.trim().replace(/\/+$/, ""))
    .filter(Boolean)
    .filter((origin) => {
      // Basic validation: must be valid URL format
      try {
        const url = new URL(origin);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    });
}

export function isProduction(env: Env): boolean {
  return env.NODE_ENV === "production";
}
