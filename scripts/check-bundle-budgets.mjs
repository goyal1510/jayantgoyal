import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";

const root = process.cwd();

const clientBudgets = [
  { app: "portfolio", maximumKiB: 280 },
  { app: "studio", maximumKiB: 525 },
  { app: "admin", maximumKiB: 385 },
  { app: "auth", maximumKiB: 320 },
];

const routeBudgets = [
  {
    name: "Studio Scratchpad",
    app: "studio",
    manifest:
      "server/app/(protected)/scratchpad/page_client-reference-manifest.js",
    maximumGzipKiB: 250,
  },
  {
    name: "Studio Calculator history",
    app: "studio",
    manifest:
      "server/app/(protected)/calculator/history/page_client-reference-manifest.js",
    maximumGzipKiB: 245,
  },
  {
    name: "Studio Personal Information generator",
    app: "studio",
    manifest:
      "server/app/(protected)/tools/other/personal-information-form/page_client-reference-manifest.js",
    maximumGzipKiB: 400,
  },
];

function readAnalyzeHeader(app) {
  const filename = path.join(
    root,
    "apps",
    app,
    ".next",
    "diagnostics",
    "analyze",
    "data",
    "analyze.data",
  );
  const data = fs.readFileSync(filename);
  const headerLength = data.readUInt32BE(0);
  return JSON.parse(data.subarray(4, 4 + headerLength).toString());
}

function getClientCompressedKiB(app) {
  const header = readAnalyzeHeader(app);
  const compressedBytes = header.chunk_parts.reduce((total, chunkPart) => {
    const output = header.output_files[chunkPart.output_file_index];
    return output?.filename.startsWith("[client-fs]/")
      ? total + chunkPart.compressed_size
      : total;
  }, 0);

  return compressedBytes / 1024;
}

function getRouteEntryGzipKiB({ app, manifest }) {
  const appBuildDirectory = path.join(root, "apps", app, ".next");
  const filename = path.join(appBuildDirectory, manifest);
  const source = fs.readFileSync(filename, "utf8");
  const context = { globalThis: {} };
  vm.runInNewContext(source, context);

  const manifests = Object.values(context.globalThis.__RSC_MANIFEST ?? {});
  if (manifests.length !== 1) {
    throw new Error(`Expected one route manifest in ${filename}`);
  }

  const routeManifest = manifests[0];
  const chunks = new Set(Object.values(routeManifest.entryJSFiles).flat());
  const gzipBytes = [...chunks].reduce((total, chunk) => {
    const contents = fs.readFileSync(path.join(appBuildDirectory, chunk));
    return total + zlib.gzipSync(contents).length;
  }, 0);

  return gzipBytes / 1024;
}

function format(value) {
  return `${value.toFixed(1)} KiB`;
}

let failed = false;

console.log("Whole emitted client budgets");
for (const budget of clientBudgets) {
  const actual = getClientCompressedKiB(budget.app);
  const passed = actual <= budget.maximumKiB;
  failed ||= !passed;
  console.log(
    `${passed ? "PASS" : "FAIL"} ${budget.app}: ${format(actual)} / ${format(budget.maximumKiB)}`,
  );
}

console.log("\nInitial route entry budgets");
for (const budget of routeBudgets) {
  const actual = getRouteEntryGzipKiB(budget);
  const passed = actual <= budget.maximumGzipKiB;
  failed ||= !passed;
  console.log(
    `${passed ? "PASS" : "FAIL"} ${budget.name}: ${format(actual)} gzip / ${format(budget.maximumGzipKiB)} gzip`,
  );
}

if (failed) {
  process.exitCode = 1;
}
