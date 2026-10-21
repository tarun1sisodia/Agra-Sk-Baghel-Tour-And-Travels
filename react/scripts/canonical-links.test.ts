import assert from "node:assert/strict";
import { test } from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const sourceRoot = join(scriptsDir, "..", "src");
const forbidden = /(?:href=\s*["'`]\/(?:services|routes|packages|fleet|about|contact|privacy|terms|faq)(?:["'`/?])|href=\s*\{\s*`\/(?:routes|packages|fleet)\/)/g;

async function sourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(path));
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(path);
  }
  return files;
}

test("customer marketing and detail links use canonical /en/ paths", async () => {
  const violations: string[] = [];
  for (const path of await sourceFiles(sourceRoot)) {
    const content = await readFile(path, "utf8");
    if (forbidden.test(content)) violations.push(path.replace(`${sourceRoot}/`, ""));
    forbidden.lastIndex = 0;
  }
  assert.deepEqual(violations, [], `Non-canonical internal links found: ${violations.join(", ")}`);
});
