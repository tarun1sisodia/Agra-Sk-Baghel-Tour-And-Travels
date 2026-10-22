#!/usr/bin/env node

/**
 * Public uptime check for the three production services.
 *
 * Usage:
 *   node scripts/healthcheck.mjs
 *   HEALTHCHECK_URLS='https://api.example.com/health,https://example.com/' node scripts/healthcheck.mjs
 *
 * The process exits 0 only when every endpoint responds with an expected
 * status code. It uses no third-party dependencies so it can run in GitHub
 * Actions, Render jobs, or any Node.js 22 environment.
 */

const timeoutMs = Number.parseInt(process.env.HEALTHCHECK_TIMEOUT_MS || "10000", 10);
const attempts = Math.max(1, Number.parseInt(process.env.HEALTHCHECK_ATTEMPTS || "2", 10));
const urls = (process.env.HEALTHCHECK_URLS || [
  "https://api.agraskbagheltourandtravels.com/api/v1/health",
  "https://agraskbagheltourandtravels.com/",
  "https://skbagheltravels-admin.coccoder999.workers.dev/",
].join(","))
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function expectedStatuses(url) {
  const configured = process.env.HEALTHCHECK_EXPECTED_STATUS;
  if (configured) return configured.split(",").map((value) => Number.parseInt(value.trim(), 10));
  return url.includes("/health") ? [200] : [200, 301, 302, 307, 308];
}

async function check(url) {
  const startedAt = Date.now();
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "ArenaAI-uptime-check/1.0" },
      });
      clearTimeout(timer);
      const elapsed = Date.now() - startedAt;
      const accepted = expectedStatuses(url).includes(response.status);
      if (accepted) {
        return { url, ok: true, status: response.status, elapsed, attempt };
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      clearTimeout(timer);
      lastError = error?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : error?.message || String(error);
    }

    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return { url, ok: false, error: lastError, elapsed: Date.now() - startedAt, attempt: attempts };
}

const results = await Promise.all(urls.map(check));
for (const result of results) {
  if (result.ok) {
    console.log(`PASS ${result.url} -> ${result.status} (${result.elapsed}ms, attempt ${result.attempt})`);
  } else {
    console.error(`FAIL ${result.url} -> ${result.error} (${result.elapsed}ms)`);
  }
}

const failures = results.filter((result) => !result.ok);
console.log(`Health check complete: ${results.length - failures.length}/${results.length} passed.`);
process.exitCode = failures.length === 0 ? 0 : 1;
