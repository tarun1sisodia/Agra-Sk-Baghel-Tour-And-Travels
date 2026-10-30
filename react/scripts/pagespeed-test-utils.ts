/**
 * PageSpeed 100/100 E2E Testing Suite — Shared Test Utilities & Assertions
 *
 * Provides DOM metric parsing, CSP parsing, head tag extraction, file loading,
 * and progressive milestone execution helpers for Tiers 1-4.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
export const reactRoot = join(scriptsDir, "..");
export const distDir = join(reactRoot, "dist");
export const publicHeadersPath = join(reactRoot, "public", "_headers");
export const distHeadersPath = join(distDir, "_headers");
export const distIndexPath = join(distDir, "index.html");
export const sourceIndexPath = join(reactRoot, "index.html");

export type Milestone = "M1" | "M2" | "M3" | "M4";

/**
 * Checks if a milestone is active for strict assertion.
 * When PAGESPEED_STRICT=1 or PAGESPEED_MILESTONE=ALL, all milestones are active.
 * When PAGESPEED_MILESTONE is set (e.g. M1, M2), milestones up to that rank are active.
 * Defaults to M1 (current implementation milestone) so CI and progressive testability pass.
 */
export function isMilestoneActive(milestone: Milestone): boolean {
  if (process.env.PAGESPEED_STRICT === "1" || process.env.PAGESPEED_MILESTONE === "ALL") {
    return true;
  }
  const ranks: Record<Milestone, number> = { M1: 1, M2: 2, M3: 3, M4: 4 };
  const target = (process.env.PAGESPEED_MILESTONE || "M1") as Milestone;
  const targetRank = ranks[target] ?? 1;
  return ranks[milestone] <= targetRank;
}

/**
 * Helper to run a test with progressive testability.
 * If the milestone is not active and the implementation is absent, skips the test with context.
 */
export function runWithMilestone(
  t: { skip: (msg?: string) => void },
  milestone: Milestone,
  isImplemented: boolean | (() => boolean),
  fn: () => void
): void {
  const implemented = typeof isImplemented === "function" ? isImplemented() : isImplemented;
  if (!isMilestoneActive(milestone) && !implemented) {
    t.skip(`Deferred: Milestone ${milestone} feature pending implementation in codebase`);
    return;
  }
  fn();
}

/**
 * Reads pre-rendered HTML for a given route (e.g. "/", "/en/services/").
 */
export function getDistHtml(route = "/"): string {
  let targetFile = distIndexPath;
  if (route !== "/" && route !== "/index.html") {
    const cleanRoute = route.replace(/^\/|\/$/g, "");
    const candidate1 = join(distDir, cleanRoute, "index.html");
    const candidate2 = join(distDir, `${cleanRoute}.html`);
    if (existsSync(candidate1)) {
      targetFile = candidate1;
    } else if (existsSync(candidate2)) {
      targetFile = candidate2;
    }
  }

  if (!existsSync(targetFile)) {
    throw new Error(`Pre-rendered HTML not found at ${targetFile}. Ensure 'npm run customer:build' was run.`);
  }
  return readFileSync(targetFile, "utf8");
}

/**
 * Reads source file from react/
 */
export function getSourceFile(relativePath: string): string {
  const target = join(reactRoot, relativePath);
  if (!existsSync(target)) {
    throw new Error(`Source file not found at ${target}`);
  }
  return readFileSync(target, "utf8");
}

/**
 * Reads public or dist _headers
 */
export function getSecurityHeaders(useDist = false): string {
  const file = useDist && existsSync(distHeadersPath) ? distHeadersPath : publicHeadersPath;
  if (!existsSync(file)) {
    throw new Error(`_headers file not found at ${file}`);
  }
  return readFileSync(file, "utf8");
}

/**
 * Parses CSP directives from _headers text into a Map
 */
export function parseCspDirectives(headersText: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const cspLineMatch = headersText.match(/Content-Security-Policy:\s*([^\r\n]+)/i);
  if (!cspLineMatch) return map;

  const rawCsp = cspLineMatch[1].trim();
  const directives = rawCsp.split(";").map((d) => d.trim()).filter(Boolean);
  for (const dir of directives) {
    const parts = dir.split(/\s+/);
    const name = parts[0];
    const values = parts.slice(1);
    map.set(name, values);
  }
  return map;
}

export interface DomMetrics {
  elementCount: number;
  maxDepth: number;
}

/**
 * Recursively parses HTML to compute total elements and max DOM tree depth.
 */
export function computeDomMetrics(rawHtml: string): DomMetrics {
  const clean = rawHtml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const voidTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);

  let maxDepth = 0;
  let currentDepth = 0;
  let elementCount = 0;

  const tagRegex = /<\/?([a-zA-Z0-9-]+)(?:\s+[^>]*)?\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(clean)) !== null) {
    const isClosing = match[0].startsWith("</");
    const isSelfClosing = match[0].endsWith("/>");
    const tagName = match[1].toLowerCase();

    if (isClosing) {
      currentDepth = Math.max(0, currentDepth - 1);
    } else {
      elementCount++;
      currentDepth++;
      if (currentDepth > maxDepth) maxDepth = currentDepth;
      if (isSelfClosing || voidTags.has(tagName)) {
        currentDepth--;
      }
    }
  }

  return { elementCount, maxDepth };
}

export interface PreloadTagInfo {
  tag: string;
  as?: string;
  href?: string;
  fetchpriority?: string;
  type?: string;
  media?: string;
  imagesizes?: string;
  imagesrcset?: string;
}

/**
 * Extracts and parses all <link rel="preload" ...> tags from an HTML string.
 */
export function extractPreloadTags(html: string): PreloadTagInfo[] {
  const results: PreloadTagInfo[] = [];
  const linkRegex = /<link\s+[^>]*rel=["']preload["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const tag = match[0];
    const getAttr = (name: string) => {
      const m = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
      return m ? m[1] : undefined;
    };

    results.push({
      tag,
      as: getAttr("as"),
      href: getAttr("href"),
      fetchpriority: getAttr("fetchpriority"),
      type: getAttr("type"),
      media: getAttr("media"),
      imagesizes: getAttr("imagesizes"),
      imagesrcset: getAttr("imagesrcset"),
    });
  }

  return results;
}

/**
 * Extracts all script tags from HTML.
 */
export function extractScriptTags(html: string): Array<{ tag: string; src?: string; async?: boolean; defer?: boolean; inline: string }> {
  const results: Array<{ tag: string; src?: string; async?: boolean; defer?: boolean; inline: string }> = [];
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const attrs = match[1];
    const inline = match[2].trim();
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    const isAsync = /\basync\b/i.test(attrs);
    const isDefer = /\bdefer\b/i.test(attrs);

    results.push({
      tag: match[0],
      src: srcMatch ? srcMatch[1] : undefined,
      async: isAsync,
      defer: isDefer,
      inline,
    });
  }

  return results;
}
