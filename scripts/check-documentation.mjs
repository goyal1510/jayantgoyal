import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const requiredDocuments = [
  "docs/README.md",
  "docs/overview/ecosystem.md",
  "docs/overview/system-map.md",
  "docs/overview/terminology.md",
  "docs/architecture/principles.md",
  "docs/architecture/repository-structure.md",
  "docs/architecture/runtime-topology.md",
  "docs/architecture/ownership-boundaries.md",
  "docs/architecture/domains-and-contracts.md",
  "docs/architecture/change-placement-guide.md",
  "docs/architecture/extensibility.md",
  "docs/products/portfolio/README.md",
  "docs/products/portfolio/routes-and-data-flows.md",
  "docs/products/studio/README.md",
  "docs/products/studio/capability-catalog.md",
  "docs/products/studio/routes-and-apis.md",
  "docs/products/admin/README.md",
  "docs/products/admin/routes-and-operations.md",
  "docs/products/auth/README.md",
  "docs/products/auth/flows-and-security.md",
  "docs/clients/README.md",
  "docs/clients/web/README.md",
  "docs/shared-systems/authentication/README.md",
  "docs/shared-systems/authentication/cookie-and-return-contract.md",
  "docs/shared-systems/data/README.md",
  "docs/shared-systems/data/schema-catalog.md",
  "docs/shared-systems/design-and-brand/README.md",
  "docs/shared-systems/integrations/README.md",
  "docs/engineering/local-development.md",
  "docs/engineering/configuration.md",
  "docs/engineering/code-quality.md",
  "docs/engineering/testing.md",
  "docs/engineering/documentation.md",
  "docs/operations/security/README.md",
  "docs/operations/reliability.md",
  "docs/operations/deployment/vercel.md",
  "docs/operations/runbooks.md",
  "docs/reference/commands.md",
  "docs/reference/applications-and-ports.md",
  "docs/reference/repository-inventory.md",
  "docs/reference/environment-variables.md",
  "docs/reference/package-catalog.md",
  "docs/reference/technology-catalog.md",
  "docs/reference/ownership-matrix.md",
];

const requiredSections = {
  "docs/architecture/principles.md": [
    "Product is independent from platform",
    "Code is local by default",
    "Dependencies have one direction",
    "Decision test",
  ],
  "docs/architecture/runtime-topology.md": [
    "Deployment topology",
    "Authentication and cross-product return",
    "Trust boundaries",
    "Failure boundaries",
  ],
  "docs/products/portfolio/README.md": [
    "Product boundary",
    "Current web surface",
    "Internal architecture",
    "Data ownership",
    "Failure behavior",
  ],
  "docs/products/studio/README.md": [
    "Product boundary",
    "Implemented surface",
    "Access model",
    "Capability architecture",
    "Environment and security",
  ],
  "docs/products/admin/README.md": [
    "Product boundary",
    "Roles and access",
    "Current workspaces",
    "Data and provider access",
  ],
  "docs/products/auth/README.md": [
    "Product boundary",
    "Route surface",
    "Internal architecture",
    "Security posture",
  ],
  "docs/shared-systems/data/schema-catalog.md": [
    "Ownership summary",
    "Account schema",
    "Studio and Writing schema",
    "Portfolio schema",
    "Storage buckets",
    "Current versus historical objects",
  ],
  "docs/reference/environment-variables.md": [
    "Shared Supabase and Auth variables",
    "Portfolio variables",
    "Studio variables",
    "Admin variables",
  ],
  "docs/operations/runbooks.md": [
    "Production deployment failure",
    "Auth entry or return failure",
    "Suspected credential exposure",
    "Database migration check or drift",
  ],
};

/** Returns tracked and non-ignored Markdown files, including new worktree files. */
function listRepositoryFiles() {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: repositoryRoot, encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean)
    .sort();
}

function readRepositoryFile(file) {
  return readFileSync(path.join(repositoryRoot, file), "utf8");
}

function hasInlineCode(markdown, value) {
  return markdown.includes(`\`${value}\``);
}

function hasDocumentedRoute(markdown, route) {
  return [...markdown.matchAll(/`([^`\n]+)`/g)].some((match) => {
    const inlineCode = match[1].trim();
    return inlineCode === route || inlineCode.endsWith(` ${route}`);
  });
}

function routeFromAppFile(file) {
  const match = file.match(
    /^apps\/([^/]+)\/web\/src\/app\/(.+\/(?:page|route)\.tsx?|(?:page|route)\.tsx?)$/,
  );
  if (!match) return null;

  const product = match[1];
  const relativeFile = match[2];
  const directory = path.posix.dirname(relativeFile);
  const segments = directory === "." ? [] : directory.split("/");
  const routeSegments = segments.filter(
    (segment) => !/^\(.*\)$/.test(segment) && !segment.startsWith("@"),
  );
  return { product, route: `/${routeSegments.join("/")}` };
}

/** Removes fenced examples so link-like code is not treated as navigation. */
function withoutFencedCode(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "");
}

/** Resolves a relative Markdown target using README conventions for directories. */
function resolveLocalTarget(sourceFile, rawTarget) {
  const target = rawTarget.replace(/^<|>$/g, "").split(/[?#]/, 1)[0];
  if (!target || /^(?:[a-z]+:|\/)/i.test(target)) return null;

  const absoluteTarget = path.resolve(
    repositoryRoot,
    path.dirname(sourceFile),
    decodeURIComponent(target),
  );
  if (!absoluteTarget.startsWith(`${repositoryRoot}${path.sep}`)) {
    return { exists: false, repositoryPath: target };
  }

  let resolvedTarget = absoluteTarget;
  if (existsSync(resolvedTarget) && statSync(resolvedTarget).isDirectory()) {
    resolvedTarget = path.join(resolvedTarget, "README.md");
  }

  return {
    exists: existsSync(resolvedTarget),
    repositoryPath: path.relative(repositoryRoot, resolvedTarget),
  };
}

const repositoryFiles = listRepositoryFiles();
const markdownFiles = repositoryFiles.filter((file) => file.endsWith(".md"));
const documentationFiles = markdownFiles.filter((file) =>
  file.startsWith("docs/"),
);
const failures = [];
const documentationLinks = new Map();

for (const requiredDocument of requiredDocuments) {
  if (!documentationFiles.includes(requiredDocument)) {
    failures.push(`Missing required document: ${requiredDocument}`);
  }
}

for (const [file, sections] of Object.entries(requiredSections)) {
  if (!documentationFiles.includes(file)) continue;
  const markdown = readRepositoryFile(file);
  for (const section of sections) {
    if (!markdown.includes(`\n## ${section}\n`)) {
      failures.push(`Missing required section in ${file}: ${section}`);
    }
  }
}

for (const file of markdownFiles) {
  if (/^apps\/[^/]+\/[^/]+\/README\.md$/.test(file)) {
    failures.push(
      `Detailed client documentation must stay centralized, not in ${file}`,
    );
  }

  if (
    file.startsWith("docs/") &&
    /(?:^|\/)(?:sessions?|history|progress|completed-plans?|qa-archive|decision-ledger)(?:\/|[-_.])/i.test(
      file,
    )
  ) {
    failures.push(`Historical or session-log document is prohibited: ${file}`);
  }

  const markdown = readRepositoryFile(file);
  if (!markdown.trimStart().startsWith("# ")) {
    failures.push(`Markdown file must start with one H1 heading: ${file}`);
  }

  const linkedDocuments = new Set();
  const linkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of withoutFencedCode(markdown).matchAll(linkPattern)) {
    const resolved = resolveLocalTarget(file, match[1]);
    if (!resolved) continue;
    if (!resolved.exists) {
      failures.push(`Broken link in ${file}: ${match[1]}`);
      continue;
    }
    if (resolved.repositoryPath.startsWith("docs/")) {
      linkedDocuments.add(resolved.repositoryPath);
    }
  }
  documentationLinks.set(file, linkedDocuments);
}

const reachableDocuments = new Set(["docs/README.md"]);
const pendingDocuments = ["docs/README.md"];
while (pendingDocuments.length) {
  const currentDocument = pendingDocuments.shift();
  for (const linkedDocument of documentationLinks.get(currentDocument) ?? []) {
    if (reachableDocuments.has(linkedDocument)) continue;
    reachableDocuments.add(linkedDocument);
    pendingDocuments.push(linkedDocument);
  }
}

for (const documentationFile of documentationFiles) {
  if (!reachableDocuments.has(documentationFile)) {
    failures.push(
      `Document is not reachable from docs/README.md: ${documentationFile}`,
    );
  }
}

const productDocumentation = new Map();
for (const product of ["portfolio", "studio", "admin", "auth"]) {
  const productFiles = documentationFiles.filter((file) =>
    file.startsWith(`docs/products/${product}/`),
  );
  productDocumentation.set(
    product,
    productFiles.map(readRepositoryFile).join("\n"),
  );
}

for (const file of repositoryFiles) {
  const route = routeFromAppFile(file);
  if (!route) continue;
  const markdown = productDocumentation.get(route.product) ?? "";
  if (!hasDocumentedRoute(markdown, route.route)) {
    failures.push(
      `Undocumented ${route.product} route ${route.route} from ${file}`,
    );
  }
}

const workspaceDocumentation = [
  "docs/reference/package-catalog.md",
  "docs/reference/repository-inventory.md",
]
  .filter((file) => documentationFiles.includes(file))
  .map(readRepositoryFile)
  .join("\n");
for (const manifest of repositoryFiles.filter((file) =>
  /^(?:apps|packages)\/[^/]+\/[^/]+\/package\.json$/.test(file),
)) {
  const packageJson = JSON.parse(readRepositoryFile(manifest));
  const workspacePath = path.posix.dirname(manifest);
  if (!hasInlineCode(workspaceDocumentation, packageJson.name)) {
    failures.push(
      `Undocumented workspace name ${packageJson.name} from ${manifest}`,
    );
  }
  if (!hasInlineCode(workspaceDocumentation, workspacePath)) {
    failures.push(`Undocumented workspace path ${workspacePath}`);
  }
}

const environmentReference = documentationFiles.includes(
  "docs/reference/environment-variables.md",
)
  ? readRepositoryFile("docs/reference/environment-variables.md")
  : "";
for (const environmentExample of repositoryFiles.filter((file) =>
  /^apps\/[^/]+\/web\/\.env\.example$/.test(file),
)) {
  const variables = readRepositoryFile(environmentExample)
    .split("\n")
    .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1])
    .filter(Boolean);
  for (const variable of variables) {
    if (!hasInlineCode(environmentReference, variable)) {
      failures.push(
        `Undocumented environment variable ${variable} from ${environmentExample}`,
      );
    }
  }
}

const schemaCatalog = documentationFiles.includes(
  "docs/shared-systems/data/schema-catalog.md",
)
  ? readRepositoryFile("docs/shared-systems/data/schema-catalog.md")
  : "";
for (const schemaFile of repositoryFiles.filter((file) =>
  /^supabase\/schemas\/[^/]+\.sql$/.test(file),
)) {
  const schemaSql = readRepositoryFile(schemaFile);
  const tablePattern =
    /CREATE TABLE IF NOT EXISTS "([a-z_]+)"\."([a-z0-9_]+)"/gi;
  for (const match of schemaSql.matchAll(tablePattern)) {
    const table = `${match[1]}.${match[2]}`;
    if (!hasInlineCode(schemaCatalog, table)) {
      failures.push(`Undocumented canonical schema table ${table}`);
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.error(`Documentation check failed with ${failures.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log(
    `Documentation check passed for ${documentationFiles.length} central document(s).`,
  );
}
