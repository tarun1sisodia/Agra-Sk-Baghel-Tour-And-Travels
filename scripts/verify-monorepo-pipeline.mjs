#!/usr/bin/env node
/**
 * Monorepo Pipeline Verification Suite
 *
 * Simulates a 100% clean CI environment by purging dist/ directories,
 * then executing every verification, build, SSG pre-render, security,
 * and guardrail check across all 3 monorepo workspaces:
 * - react/ (Customer Site)
 * - admin/ (Operations Desk)
 * - backend/ (Fastify API)
 */

import { execSync } from "node:child_process";
import { rmSync, existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = join(dirname(__filename), "..");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

const results = [];

function step(name, fn) {
  const start = Date.now();
  process.stdout.write(`  ⏳ ${name.padEnd(52)} `);
  try {
    fn();
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`${colors.green}PASSED${colors.reset} (${duration}s)`);
    results.push({ name, status: "PASSED", duration: `${duration}s` });
  } catch (err) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`${colors.red}FAILED${colors.reset} (${duration}s)`);
    console.error(`\n${colors.red}[Error in ${name}]:${colors.reset}\n`, err.message || err);
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    results.push({ name, status: "FAILED", duration: `${duration}s`, error: err.message });
    printSummaryAndExit(1);
  }
}

function run(cmd, cwd = rootDir) {
  return execSync(cmd, { cwd, stdio: "pipe", env: { ...process.env, CI: "true", NODE_ENV: "test" } });
}

console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  🛡️ SK Baghel Tour & Travels — Monorepo Pipeline Check${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

// 1. Purge all dist directories to simulate clean checkout
step("Purge dist directories (simulate clean CI checkout)", () => {
  for (const d of ["react/dist", "admin/dist", "backend/dist"]) {
    const p = join(rootDir, d);
    if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  }
});

// 2. Contracts & Synced Types
step("Check contracts & shared schema parity", () => {
  run("npm run contracts:check");
});

// 3. Workspace Typechecks
step("Typecheck Customer (React 19 / TypeScript)", () => {
  run("npm run customer:typecheck");
});

step("Typecheck Admin Desk (Vite / TypeScript)", () => {
  run("npm run admin:typecheck");
});

step("Typecheck Backend (Fastify / TypeScript)", () => {
  run("npm run backend:typecheck");
});

// 4. Site Configuration & Unit Tests
step("Validate site configuration & canonical origin", () => {
  run("npm run customer:validate-config");
});

step("Run Backend unit tests (Vitest)", () => {
  run("npm --prefix backend run test:ci");
});

step("Run Customer catalog sources tests", () => {
  run("npm --prefix react run test:catalog-sources");
});

step("Run Admin Desk tests (Vitest)", () => {
  run("npm --prefix admin test");
});

// 5. Pre-Build SEO lifecycle tests
step("Run SEO lifecycle checks", () => {
  run("npm run customer:seo");
});

// 6. Monorepo Production Builds & SSG Pre-Rendering
step("Build & Pre-Render Customer App (120 SSG pages)", () => {
  run("npm run customer:build");
});

step("Build Admin Desk SPA", () => {
  run("npm run admin:build");
});

step("Build Backend API", () => {
  run("npm run backend:build");
});

// 7. Security & Cloudflare Deployment Budgets (CI Parity)
step("Verify Admin SPA deep-link fallback (_redirects)", () => {
  const redirectsPath = join(rootDir, "admin/dist/_redirects");
  if (!existsSync(redirectsPath)) {
    throw new Error("admin/dist/_redirects is missing. Deep links will 404 on Cloudflare Pages.");
  }
});

step("Enforce Cloudflare single-file threshold (< 25 MiB)", () => {
  const checkDir = (dir) => {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        checkDir(fullPath);
      } else if (entry.isFile()) {
        const size = statSync(fullPath).size;
        if (size > 25 * 1024 * 1024) {
          throw new Error(`File ${fullPath} exceeds 25 MiB threshold: ${(size / 1024 / 1024).toFixed(2)} MiB`);
        }
      }
    }
  };
  checkDir(join(rootDir, "react/dist"));
  checkDir(join(rootDir, "admin/dist"));
});

step("Frontend Secret Leak Guard (zero backend secrets)", () => {
  const disallowedSecrets = [
    "DATABASE_URL",
    "RAZORPAY_KEY_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "SUPABASE_JWT_SECRET",
    "MONGODB_URI",
    "CARD_PROVIDER_SECRET",
  ];
  const scanDir = (dir) => {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && /\.(js|html|css|json)$/.test(entry.name)) {
        const content = readFileSync(fullPath, "utf8");
        for (const secret of disallowedSecrets) {
          if (content.includes(secret)) {
            throw new Error(`Disallowed secret identifier '${secret}' detected in ${fullPath}!`);
          }
        }
      }
    }
  };
  scanDir(join(rootDir, "react/dist"));
  scanDir(join(rootDir, "admin/dist"));
});

printSummaryAndExit(0);

function printSummaryAndExit(code) {
  console.log(`\n${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.bold}  📊 Pipeline Execution Summary${colors.reset}`);
  console.log(`${colors.bold}======================================================${colors.reset}`);
  for (const r of results) {
    const symbol = r.status === "PASSED" ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`  ${symbol} ${r.name.padEnd(52)} ${r.duration}`);
  }
  console.log(`${colors.bold}======================================================${colors.reset}`);
  if (code === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 All Monorepo Pipeline Checks PASSED! Zero errors.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}${colors.bold}💥 Pipeline Verification FAILED.${colors.reset}\n`);
  }
  process.exit(code);
}

