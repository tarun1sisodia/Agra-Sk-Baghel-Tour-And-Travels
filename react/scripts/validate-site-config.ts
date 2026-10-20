import { APPROVED_PRODUCTION_ORIGINS, resolveSiteOrigin, type SiteOriginMode } from "../src/config/siteOrigin.ts";

const configuredOrigin = process.env.VITE_SITE_URL?.trim();
const isCloudflareBuild = Boolean(process.env.CF_PAGES_BRANCH);
let mode: SiteOriginMode = "development";
if (process.env.VITE_SITE_MODE === "preview") {
  mode = "preview";
} else if (process.env.RELEASE_BUILD === "1" || process.env.CF_PAGES_BRANCH === "main" || process.env.VITE_SITE_MODE === "production") {
  mode = "production";
} else if (isCloudflareBuild) {
  mode = "preview";
}
if (mode !== "development" && !configuredOrigin) {
  throw new Error("VITE_SITE_URL is required for Cloudflare preview and production release builds.");
}
const origin = resolveSiteOrigin(configuredOrigin, mode);
if (mode === "production" && !APPROVED_PRODUCTION_ORIGINS.includes(origin as any) && !origin.includes(".workers.dev")) {
  throw new Error("Release build must use an approved canonical origin: " + APPROVED_PRODUCTION_ORIGINS.join(", "));
}
console.log("Site origin validated: " + origin + " (" + mode + ").");