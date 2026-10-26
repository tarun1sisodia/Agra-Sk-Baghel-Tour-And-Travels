import crypto from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

// Load backend .env if exists
let envConfig = {};
const envPath = path.join(rootDir, "backend/.env");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envConfig[key] = val;
    }
  }
}

export const API_BASE_URL =
  process.env.API_BASE_URL ||
  envConfig.API_BASE_URL ||
  "https://api.agraskbagheltourandtravels.com";

export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  envConfig.SUPABASE_URL ||
  "https://uwtcawvtchrqqojoekxf.supabase.co";

export const SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET ||
  envConfig.SUPABASE_JWT_SECRET ||
  "";

export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ||
  envConfig.ADMIN_EMAIL ||
  "skbagheltravels@gmail.com";

function base64url(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function generateJwt(secret, role = "super_admin", email = "skbagheltravels@gmail.com") {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: "authenticated",
    iat: now,
    exp: now + 3600,
    sub: "00000000-0000-4000-a000-000000000001",
    email,
    app_metadata: { role },
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

export async function getAdminAuthToken() {
  if (SUPABASE_JWT_SECRET) {
    return generateJwt(SUPABASE_JWT_SECRET, "super_admin", ADMIN_EMAIL);
  }
  return "test-super_admin";
}

export async function getCustomerAuthToken() {
  if (SUPABASE_JWT_SECRET) {
    return generateJwt(SUPABASE_JWT_SECRET, "customer", "customer.test@example.com");
  }
  return "test-customer";
}

export function formatResult(name, passed, durationMs, details = "") {
  const symbol = passed ? "\x1b[32m✔ PASS\x1b[0m" : "\x1b[31m✖ FAIL\x1b[0m";
  const duration = `(${durationMs}ms)`.padStart(10);
  console.log(` ${symbol} ${name.padEnd(50)} ${duration} ${details ? `\x1b[90m${details}\x1b[0m` : ""}`);
}
