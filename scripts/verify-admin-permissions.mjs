import fs from "node:fs";
import path from "node:path";

const typesPath = path.resolve("admin/src/lib/types.ts");
const typesContent = fs.readFileSync(typesPath, "utf8");

// Extract PERMISSIONS block
const permissionsMatch = typesContent.match(/export const PERMISSIONS[^{]*= ({[\s\S]*?});/);
if (!permissionsMatch) {
  throw new Error("Could not find PERMISSIONS object in admin/src/lib/types.ts");
}

const permissionsObj = eval(`(${permissionsMatch[1]})`);

console.log("Checking PERMISSIONS map in admin/src/lib/types.ts:");
if (!permissionsObj["catalog:create"]) {
  throw new Error("FAIL: catalog:create is not defined in PERMISSIONS");
}
if (!permissionsObj["catalog:create"].includes("super_admin")) {
  throw new Error("FAIL: super_admin is not granted catalog:create in PERMISSIONS");
}
console.log("  [x] catalog:create is defined in PERMISSIONS and includes super_admin");

// Verify can() simulation
function can(role, permission) {
  const allowed = permissionsObj[permission] || [];
  return allowed.includes(role);
}

if (!can("super_admin", "catalog:create")) {
  throw new Error("FAIL: can('super_admin', 'catalog:create') returned false");
}
if (can("dispatcher", "catalog:create")) {
  throw new Error("FAIL: can('dispatcher', 'catalog:create') returned true, should be super_admin only");
}
console.log("  [x] can('super_admin', 'catalog:create') === true");
console.log("  [x] can('dispatcher', 'catalog:create') === false");

// Find all can(..., "...") occurrences in admin/src
const adminSrcDir = path.resolve("admin/src");
function scanFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const allAdminFiles = scanFiles(adminSrcDir);
let checkedCount = 0;
const permissionRegex = /can\([^,]+,\s*["']([^"']+)["']\)/g;

for (const file of allAdminFiles) {
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = permissionRegex.exec(content)) !== null) {
    const perm = match[1];
    checkedCount++;
    if (!(perm in permissionsObj)) {
      throw new Error(`FAIL: File ${file} uses undeclared permission "${perm}" in can() check!`);
    }
  }
}

console.log(`  [x] Verified ${checkedCount} can() permission checks across all admin UI files: all map to valid declared permissions.`);
console.log("ALL PERMISSION CHECKS PASSED SUCCESSFULLY!");
