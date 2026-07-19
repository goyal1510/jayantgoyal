import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const apps = ["portfolio", "studio", "admin"];
const files = [
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
];

const hashes = new Map();
for (const app of apps) {
  for (const file of files) {
    const path = resolve(root, "apps", app, "public", "assets", "Jayant_favicon_io", file);
    try {
      const digest = createHash("sha256").update(await readFile(path)).digest("hex");
      const existing = hashes.get(file);
      if (existing && existing.digest !== digest) {
        throw new Error(`${file} differs between ${existing.app} and ${app}`);
      }
      hashes.set(file, { app, digest });
    } catch (error) {
      throw new Error(`Brand asset check failed for ${app}/${file}: ${error.message}`);
    }
  }
}

console.log(`Brand assets are synchronized across ${apps.length} apps (${files.length} files).`);
