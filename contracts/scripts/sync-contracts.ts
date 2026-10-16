/**
 * Sync contract sources into each app's tree.
 *
 * Source of truth: contracts/*.ts
 * Destinations (checked in, never hand-edited):
 *   backend/src/contracts/, admin/src/contracts/, react/src/contracts/
 *
 * Usage: npx tsx contracts/scripts/sync-contracts.ts [--check]
 *   --check: exit non-zero if any destination differs (used by CI / the lock test).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const contractsDir = join(root, "contracts");

const dests = [
  join(root, "backend", "src", "contracts"),
  join(root, "admin", "src", "contracts"),
  join(root, "react", "src", "contracts"),
];

export const GENERATED_HEADER = (name: string) =>
  `/**\n` +
  ` * GENERATED — do not edit by hand.\n` +
  ` * Source: contracts/${name}\n` +
  ` * Regenerate: npx tsx contracts/scripts/sync-contracts.ts\n` +
  ` * Contract: C-CONTRACT-ALL · contracts/LOCKED.md\n` +
  ` */\n`;

function buildOutput(name: string, source: string): string {
  return GENERATED_HEADER(name) + source;
}

const checkOnly = process.argv.includes("--check");
let dirty = false;

function syncFile(target: string, output: string, sourceDesc: string) {
  const current = existsSync(target) ? readFileSync(target, "utf8") : null;
  if (current !== output) {
    if (checkOnly) {
      console.error(`DRIFT: ${target} differs from contracts/${sourceDesc}`);
      dirty = true;
    } else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, output);
      console.log(`synced ${target}`);
    }
  }
}

// Read all .ts contract files directly from contracts/
const contractFiles = readdirSync(contractsDir).filter(
  (f) => f.endsWith(".ts") && f !== "index.ts"
);

// Compare or regenerate contracts/index.ts
const indexContent =
  "// Canonical contract exports across backend, admin, and react\n" +
  contractFiles.map((f) => `export * from "./${basename(f, ".ts")}.js";`).join("\n") +
  "\n";
const indexPath = join(contractsDir, "index.ts");
const currentIndex = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : null;
if (currentIndex !== indexContent) {
  if (checkOnly) {
    console.error(`DRIFT: ${indexPath} differs from generated index`);
    dirty = true;
  } else {
    writeFileSync(indexPath, indexContent);
    console.log(`synced ${indexPath}`);
  }
}

// Sync all contract files + index.ts to destinations
for (const file of [...contractFiles, "index.ts"]) {
  const source = readFileSync(join(contractsDir, file), "utf8");
  const output = buildOutput(file, source);

  for (const dest of dests) {
    syncFile(join(dest, file), output, file);
  }
}

if (checkOnly && dirty) process.exit(1);
if (!checkOnly) console.log("all contracts in sync.");
