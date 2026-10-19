import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");
const distDir = join(reactRoot, "dist");
const publicDir = join(reactRoot, "public");

function getCommitSha(): string {
  if (process.env.CF_PAGES_COMMIT_SHA) return process.env.CF_PAGES_COMMIT_SHA;
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  if (process.env.COMMIT_SHA) return process.env.COMMIT_SHA;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "dev";
  }
}

export function generateReleaseMetadata() {
  const commitSha = getCommitSha();
  const builtAt = new Date().toISOString();
  const releaseId = `rel-${Date.now()}-${commitSha.slice(0, 7)}`;
  const metadata = {
    version: "0.1.0",
    releaseId,
    commitSha,
    builtAt,
  };

  const json = JSON.stringify(metadata, null, 2);

  if (existsSync(publicDir)) {
    writeFileSync(join(publicDir, "release.json"), json, "utf-8");
  }

  if (existsSync(distDir)) {
    writeFileSync(join(distDir, "release.json"), json, "utf-8");
  }

  console.log(`✅ [Release] Emitted release.json (ID: ${releaseId}, SHA: ${commitSha.slice(0, 7)})`);
}

generateReleaseMetadata();
