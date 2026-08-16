import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const violations = [];

function walk(directory, pattern = /\.(?:ts|tsx|js|mjs|css)$/) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path, pattern);
    return pattern.test(entry.name) ? [path] : [];
  });
}

function repositoryPath(path) {
  return relative(root, path).split(sep).join("/");
}

function imports(source, pattern) {
  return pattern.test(source);
}

const packageSourceRoots = [
  ...readdirSync(join(root, "packages"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((group) => {
      const groupRoot = join(root, "packages", group.name);
      return readdirSync(groupRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(groupRoot, entry.name, "src"))
        .filter(existsSync);
    }),
  ...readdirSync(join(root, "apps"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(root, "apps", entry.name, "contracts", "src"))
    .filter(existsSync),
];

for (const sourceRoot of packageSourceRoots) {
  for (const file of walk(sourceRoot)) {
    const source = readFileSync(file, "utf8");
    const path = repositoryPath(file);

    if (imports(source, /(?:from\s+|import\()["'][^"']*apps\/[^"']*\/web\//)) {
      violations.push(`${path}: reusable packages cannot import a web client`);
    }

    if (
      path.startsWith("packages/ecosystem/") &&
      imports(
        source,
        /["']@jayant\/(?:web-|github(?:[/'"]|$)|portfolio-contracts(?:[/'"]|$))/,
      )
    ) {
      violations.push(
        `${path}: ecosystem packages must remain independent of web, integrations, and product contracts`,
      );
    }

    if (
      path.startsWith("packages/integrations/") &&
      imports(source, /["']@jayant\/(?:web-|portfolio-contracts(?:[/'"]|$))/)
    ) {
      violations.push(
        `${path}: integration packages must remain independent of web and product contracts`,
      );
    }

    if (
      path.startsWith("apps/") &&
      path.includes("/contracts/") &&
      imports(source, /["']@jayant\/web-/)
    ) {
      violations.push(
        `${path}: product contracts cannot depend on web packages`,
      );
    }
  }
}

const appNames = readdirSync(join(root, "apps"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const appName of appNames) {
  const clientRoot = join(root, "apps", appName, "web", "src");
  for (const file of walk(clientRoot)) {
    const source = readFileSync(file, "utf8");
    const path = repositoryPath(file);
    const otherApps = appNames.filter((name) => name !== appName).join("|");

    if (
      otherApps &&
      imports(
        source,
        new RegExp(
          `(?:from\\s+|import\\()["'][^"']*apps\\/(?:${otherApps})\\/web\\/`,
        ),
      )
    ) {
      violations.push(
        `${path}: web clients cannot import another client's source`,
      );
    }

    if (
      appName === "portfolio" &&
      source.includes("@jayant/web-ui/application-shell")
    ) {
      violations.push(`${path}: Portfolio cannot import the application shell`);
    }
    if (
      appName === "portfolio" &&
      source.includes("@jayant/web-ui/application-surface.css")
    ) {
      violations.push(
        `${path}: Portfolio cannot import the application surface`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log(
  "Architecture boundaries are clean across ecosystem, integration, web, product-contract, and client ownership layers.",
);
