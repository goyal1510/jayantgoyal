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
  "docs/architecture/repository-structure.md",
  "docs/architecture/ownership-boundaries.md",
  "docs/architecture/domains-and-contracts.md",
  "docs/architecture/extensibility.md",
  "docs/products/portfolio/README.md",
  "docs/products/studio/README.md",
  "docs/products/admin/README.md",
  "docs/products/auth/README.md",
  "docs/clients/README.md",
  "docs/clients/web/README.md",
  "docs/shared-systems/authentication/README.md",
  "docs/shared-systems/data/README.md",
  "docs/shared-systems/design-and-brand/README.md",
  "docs/shared-systems/integrations/README.md",
  "docs/engineering/local-development.md",
  "docs/engineering/code-quality.md",
  "docs/engineering/testing.md",
  "docs/engineering/documentation.md",
  "docs/operations/security/README.md",
  "docs/operations/reliability.md",
  "docs/operations/deployment/vercel.md",
  "docs/reference/commands.md",
  "docs/reference/applications-and-ports.md",
  "docs/reference/package-catalog.md",
  "docs/reference/technology-catalog.md",
  "docs/reference/ownership-matrix.md",
];

/** Returns tracked and non-ignored Markdown files, including new worktree files. */
function listMarkdownFiles() {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--", "*.md"],
    { cwd: repositoryRoot, encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean)
    .sort();
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

const markdownFiles = listMarkdownFiles();
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

  const markdown = readFileSync(path.join(repositoryRoot, file), "utf8");
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

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.error(`Documentation check failed with ${failures.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log(
    `Documentation check passed for ${documentationFiles.length} central document(s).`,
  );
}
