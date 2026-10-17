#!/usr/bin/env node

/**
 * SK Baghel Tour & Travels — Localhost Monorepo Runner
 * Starts Backend (port 4000), React Customer (port 5173), and Admin Desk (port 5174).
 * Handles clean shutdown across all children on SIGINT/SIGTERM.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const services = [
  { name: "BACKEND ", cwd: path.join(rootDir, "backend"), args: ["run", "dev"], color: "\x1b[34m" },
  { name: "CUSTOMER", cwd: path.join(rootDir, "react"), args: ["run", "dev"], color: "\x1b[32m" },
  { name: "ADMIN   ", cwd: path.join(rootDir, "admin"), args: ["run", "dev"], color: "\x1b[35m" },
];

const processes = [];

console.log("\x1b[1m\x1b[33m%s\x1b[0m", "Starting SK Baghel Localhost Monorepo Environment...");
console.log("  • Backend API:        http://localhost:4000");
console.log("  • Customer Site:      http://localhost:5173");
console.log("  • Operations Desk:    http://localhost:5174");
console.log("-------------------------------------------------------------\n");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

for (const svc of services) {
  const child = spawn(isWindows ? npmCmd : "npm", svc.args, {
    cwd: svc.cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: isWindows,
    env: { ...process.env, NODE_ENV: "development", FORCE_COLOR: "1" },
  });

  child.stdout?.on("data", (data) => {
    process.stdout.write(`${svc.color}[${svc.name}]\x1b[0m ${data}`);
  });

  child.stderr?.on("data", (data) => {
    process.stderr.write(`${svc.color}[${svc.name}]\x1b[0m \x1b[31m${data}\x1b[0m`);
  });

  child.on("exit", (code) => {
    console.log(`${svc.color}[${svc.name}]\x1b[0m exited with code ${code}`);
  });

  processes.push(child);
}

function shutdown() {
  console.log("\nShutting down all services...");
  for (const p of processes) {
    if (isWindows && p.pid) {
      try {
        spawn("taskkill.exe", ["/pid", String(p.pid), "/T", "/F"]);
      } catch {
        p.kill("SIGTERM");
      }
    } else {
      p.kill("SIGTERM");
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
