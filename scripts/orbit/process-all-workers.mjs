#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workers = [
  "process-outbox.mjs",
  "process-recurrence.mjs",
  "process-exports.mjs",
  "process-automations.mjs",
  "process-webhooks.mjs",
  "process-imports.mjs",
  "process-purge.mjs",
];

let failed = 0;

for (const worker of workers) {
  const scriptPath = join(scriptDir, worker);
  console.log(`\n==> ${worker}`);

  const exitCode = await new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", resolve);
  });

  if (exitCode !== 0) {
    failed += 1;
    console.error(`${worker} exited with code ${exitCode}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} Orbit worker(s) failed.`);
  process.exit(1);
}

console.log("\nAll Orbit workers completed.");
