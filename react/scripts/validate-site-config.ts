import { APPROVED_PRODUCTION_ORIGIN, resolveSiteOrigin, type SiteOriginMode } from "../src/config/siteOrigin.ts";

const configuredOrigin = process.env.VITE_SITE_URL?.trim();
const isCloudflareBuild = Boolean(process.env.CF_PAGES_BRANCH);
let mode: SiteOriginMode = "development";
if (process.env.RELEASE_BUILD === "1" || process.env.CF_PAGES_BRANCH === "main" || process.env.VITE_SITE_MODE === "production") {
  mode = "production";
} else if (isCloudflareBuild || process.env.VITE_SITE_MODE === "preview") {
  mode = "preview";
}
if (mode !== "development" && !configuredOrigin) {
  throw new Error("VITE_SITE_URL is required for Cloudflare preview and production release builds.");
}
const origin = resolveSiteOrigin(configuredOrigin, mode);
if (mode === "production" && origin !== APPROVED_PRODUCTION_ORIGIN) {
  throw new Error("Release build must use " + APPROVED_PRODUCTION_ORIGIN + " as its canonical origin.");
}
console.log("Site origin validated: " + origin + " (" + mode + ").");