import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apps = ["portfolio", "studio", "admin", "auth"];
const files = [
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
];

const canonicalDirectory = resolve(root, "assets", "brand", "web");
for (const app of apps) {
  for (const file of files) {
    const canonicalPath = resolve(canonicalDirectory, file);
    const appPath = resolve(
      root,
      "apps",
      app,
      "web",
      "public",
      "assets",
      "Jayant_favicon_io",
      file,
    );
    try {
      const canonicalDigest = createHash("sha256")
        .update(await readFile(canonicalPath))
        .digest("hex");
      const appDigest = createHash("sha256")
        .update(await readFile(appPath))
        .digest("hex");
      if (canonicalDigest !== appDigest) {
        throw new Error(`${file} differs from assets/brand/web/${file}`);
      }
    } catch (error) {
      throw new Error(
        `Brand asset check failed for ${app}/${file}: ${error.message}`,
      );
    }
  }
}

console.log(
  `Brand assets match the canonical assets/brand/web source across ${apps.length} web clients (${files.length} files).`,
);
