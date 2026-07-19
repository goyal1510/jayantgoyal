import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sharedSourceRoots = [
  "packages/auth/src",
  "packages/brand/src",
  "packages/github/src",
  "packages/platform/src",
  "packages/portfolio-data/src",
  "packages/seo/src",
  "packages/ui/src",
];

function walk(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(?:ts|tsx|js|mjs|css)$/.test(entry.name) ? [path] : [];
  });
}

const violations = [];

for (const sourceRoot of sharedSourceRoots) {
  for (const file of walk(join(root, sourceRoot))) {
    const source = readFileSync(file, "utf8");
    if (/from\s+["'][^"']*apps\//.test(source) || /import\(["'][^"']*apps\//.test(source)) {
      violations.push(`${file}: shared packages cannot import application source`);
    }
  }
}

for (const file of walk(join(root, "apps/portfolio/src"))) {
  const source = readFileSync(file, "utf8");
  if (source.includes("@repo/ui/application-shell")) {
    violations.push(`${file}: Portfolio cannot import the product application shell`);
  }
  if (source.includes("@repo/ui/application-surface.css")) {
    violations.push(`${file}: Portfolio cannot import the product application surface`);
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Architecture boundaries are clean: shared packages are app-free and Portfolio is outside the product shell.");
