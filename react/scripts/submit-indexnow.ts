/**
 * IndexNow URL Submission Script (Bing, Yandex, Naver & IndexNow Network)
 *
 * Automatically submits indexable canonical URLs to IndexNow search engines.
 * Protocol reference: https://www.indexnow.org/documentation
 *
 * Usage:
 *   node --experimental-strip-types scripts/submit-indexnow.ts
 *   node --experimental-strip-types scripts/submit-indexnow.ts --dry-run
 *   node --experimental-strip-types scripts/submit-indexnow.ts --host=agraskbagheltourandtravels.com
 *   node --experimental-strip-types scripts/submit-indexnow.ts --include-www
 */

import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");
const publicDir = join(reactRoot, "public");

const DEFAULT_KEY = "069094c8c68b41528a0893ddb7839be1";
const DEFAULT_HOST = "agraskbagheltourandtravels.com";

const ENDPOINTS = [
  { name: "IndexNow Global API", url: "https://api.indexnow.org/indexnow" },
  { name: "Bing Direct IndexNow", url: "https://www.bing.com/indexnow" },
];

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

function resolveApiKey(): string {
  if (process.env.INDEXNOW_KEY?.trim()) {
    return process.env.INDEXNOW_KEY.trim();
  }
  const keyFilePath = join(publicDir, `${DEFAULT_KEY}.txt`);
  if (existsSync(keyFilePath)) {
    const content = readFileSync(keyFilePath, "utf8").trim();
    if (content) return content;
  }
  return DEFAULT_KEY;
}

async function extractSitemapUrls(): Promise<string[]> {
  const sitemapPath = join(publicDir, "sitemap.xml");
  if (!existsSync(sitemapPath)) {
    throw new Error(`sitemap.xml not found at ${sitemapPath}. Run sitemap generation first.`);
  }
  const sitemapXml = await readFile(sitemapPath, "utf8");
  const urls: string[] = [];
  const matches = sitemapXml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi);
  for (const match of matches) {
    const url = match[1]?.trim();
    if (url) urls.push(url);
  }
  return [...new Set(urls)];
}

async function submitBatch(
  endpoint: { name: string; url: string },
  payload: IndexNowPayload,
  dryRun: boolean
): Promise<{ status: number; text: string; ok: boolean }> {
  if (dryRun) {
    console.log(`[DRY-RUN] Would submit ${payload.urlList.length} URLs to ${endpoint.name} (${endpoint.url})`);
    return { status: 200, text: "DRY_RUN_OK", ok: true };
  }

  const response = await fetch(endpoint.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const ok = response.status === 200 || response.status === 202;
  return { status: response.status, text, ok };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const includeWww = args.includes("--include-www") || args.includes("--both-hosts");
  const hostArg = args.find((a) => a.startsWith("--host="))?.split("=")[1]?.trim();

  const key = resolveApiKey();
  console.log(`====================================================`);
  console.log(`IndexNow Submission Utility — SK Baghel Tour & Travels`);
  console.log(`====================================================`);
  console.log(`IndexNow Key       : ${key}`);
  console.log(`Key verification file: /${key}.txt`);

  const sitemapUrls = await extractSitemapUrls();
  console.log(`Found ${sitemapUrls.length} canonical URLs in public/sitemap.xml\n`);

  if (sitemapUrls.length === 0) {
    console.warn("No URLs found in sitemap.xml. Aborting.");
    return;
  }

  // Determine host sets to submit
  const targetHosts: string[] = [];
  if (hostArg) {
    targetHosts.push(hostArg);
  } else {
    targetHosts.push(DEFAULT_HOST);
    if (includeWww) {
      targetHosts.push(`www.${DEFAULT_HOST}`);
    }
  }

  for (const host of targetHosts) {
    const keyLocation = `https://${host}/${key}.txt`;
    const hostUrls = sitemapUrls.map((u) => {
      const parsed = new URL(u);
      parsed.host = host;
      parsed.protocol = "https:";
      return parsed.toString();
    });

    console.log(`----------------------------------------------------`);
    console.log(`Target Host  : ${host}`);
    console.log(`Key Location : ${keyLocation}`);
    console.log(`URL Count    : ${hostUrls.length}`);
    console.log(`Sample URL   : ${hostUrls[0]}`);
    console.log(`----------------------------------------------------`);

    const payload: IndexNowPayload = {
      host,
      key,
      keyLocation,
      urlList: hostUrls,
    };

    for (const endpoint of ENDPOINTS) {
      try {
        const result = await submitBatch(endpoint, payload, dryRun);
        if (result.ok) {
          console.log(`[PASS] ${endpoint.name}: HTTP ${result.status} (Accepted / Processed)`);
        } else {
          console.warn(`[WARN] ${endpoint.name}: HTTP ${result.status} ${result.text}`);
          if (result.status === 403) {
            console.warn(`       -> HTTP 403 usually indicates the key file '${key}.txt' is not yet live on https://${host}/`);
            console.warn(`       -> Deploy the site first, then re-run this script to complete domain verification.`);
          }
        }
      } catch (err: unknown) {
        console.error(`[ERROR] Failed submitting to ${endpoint.name}:`, (err as Error).message);
      }
    }
    console.log("");
  }

  console.log(`====================================================`);
  console.log(`IndexNow submission completed.`);
  console.log(`Note: Search engines will periodically verify domain ownership`);
  console.log(`by fetching: https://${DEFAULT_HOST}/${key}.txt`);
  console.log(`Ensure 'react/public/${key}.txt' is included in your production deployment.`);
  console.log(`====================================================`);
}

main().catch((err) => {
  console.error("IndexNow script failed:", err);
  process.exit(1);
});

