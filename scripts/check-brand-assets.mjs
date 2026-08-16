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

async function digest(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

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
      "brand",
      file,
    );
    try {
      const canonicalDigest = await digest(canonicalPath);
      const appDigest = await digest(appPath);
      if (canonicalDigest !== appDigest) {
        throw new Error(`${file} differs from assets/brand/web/${file}`);
      }
    } catch (error) {
      throw new Error(
        `Brand asset check failed for ${app}/${file}: ${error.message}`,
      );
    }
  }

  const canonicalFavicon = resolve(canonicalDirectory, "favicon.ico");
  const specialFavicon = resolve(
    root,
    "apps",
    app,
    "web",
    "src",
    "app",
    "favicon.ico",
  );
  if ((await digest(canonicalFavicon)) !== (await digest(specialFavicon))) {
    throw new Error(
      `Brand asset check failed for ${app}/src/app/favicon.ico: it differs from assets/brand/web/favicon.ico`,
    );
  }

  const socialFile = `${app}-preview.jpg`;
  const canonicalSocial = resolve(root, "assets", "brand", "social", socialFile);
  const appSocial = resolve(
    root,
    "apps",
    app,
    "web",
    "public",
    "images",
    "social",
    socialFile,
  );
  if ((await digest(canonicalSocial)) !== (await digest(appSocial))) {
    throw new Error(
      `Brand asset check failed for ${app}/${socialFile}: it differs from assets/brand/social/${socialFile}`,
    );
  }
}

console.log(
  `Brand icons and social previews match their canonical sources across ${apps.length} web clients.`,
);
