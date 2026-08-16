import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const canonicalRootName = "jayantgoyal";
const canonicalScope = "@jayantgoyal/";
const legacyScopes = [`@${"jayant"}/`, `@${"repo"}/`];
const expandedPublicName = ["Jayant", "Goyal"].join(" ");
const canonicalDomain = "jayantgoyal.com";
const identitySource = "packages/foundation/identity/src";
const failures = [];

function repositoryFiles() {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter((file) => file && existsSync(file));
}

function read(file) {
  return readFileSync(file, "utf8");
}

const files = repositoryFiles();
const rootManifest = JSON.parse(read("package.json"));
if (rootManifest.name !== canonicalRootName) {
  failures.push(`Root package name must be ${canonicalRootName}.`);
}

for (const file of files.filter((candidate) => candidate.endsWith("package.json"))) {
  const manifest = JSON.parse(read(file));
  if (file === "package.json") continue;
  if (manifest.name && !manifest.name.startsWith(canonicalScope)) {
    failures.push(`${file}: workspace name must use ${canonicalScope}*.`);
  }
  if (manifest.name?.startsWith(canonicalScope) && manifest.private !== true) {
    failures.push(`${file}: internal workspace must be explicitly private.`);
  }
}

for (const file of files) {
  if (file === "pnpm-lock.yaml" || /\.(?:ico|png|jpe?g|pdf)$/i.test(file)) {
    continue;
  }

  const source = read(file);
  for (const legacyScope of legacyScopes) {
    if (source.includes(legacyScope)) {
      failures.push(`${file}: legacy package scope ${legacyScope} is forbidden.`);
    }
  }
  const isImmutableMigration = file.startsWith("supabase/migrations/");
  if (!isImmutableMigration && source.includes(expandedPublicName)) {
    failures.push(`${file}: never expand the public name to ${expandedPublicName}.`);
  }

  const isRuntimeSource =
    /^(?:apps|packages)\/.+\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(file) &&
    !/\.(?:test|spec)\.[^.]+$/.test(file) &&
    !file.startsWith(identitySource);
  if (!isRuntimeSource) continue;

  if (source.includes(`"Jayant"`) || source.includes(`'Jayant'`)) {
    failures.push(`${file}: consume the fixed public name from ${canonicalScope}identity.`);
  }
  if (source.includes(canonicalDomain)) {
    failures.push(`${file}: consume canonical hosts from the foundation registry.`);
  }
  if (/PERSON_(?:IDENTITY|BRAND)\.(?:fullName|givenName|monogram)/.test(source)) {
    failures.push(`${file}: use displayName, officialName, or shortMark.`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  console.error(`Identity contract failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  `Identity contract passed: Jayant is public, jg is the short mark, and ${canonicalRootName}/${canonicalScope} are technical identifiers.`,
);
