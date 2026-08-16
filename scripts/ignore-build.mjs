#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const GLOBAL_BUILD_PATHS = [
  ".node-version",
  ".npmrc",
  ".nvmrc",
  "package.json",
  "patches",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "pnpmfile.cjs",
  "scripts/ignore-build.mjs",
  "turbo.json",
  "vercel.json",
];

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

function normalizeRepositoryPath(path) {
  return path.replaceAll("\\", "/").replace(/\/$/, "");
}

function buildSafely(message) {
  console.log(`${message}; building safely.`);
  process.exit(1);
}

function runGit(repository, args) {
  return spawnSync("git", args, {
    cwd: repository,
    encoding: "utf8",
  });
}

function commitExists(repository, revision) {
  return (
    runGit(repository, [
      "rev-parse",
      "--verify",
      "--quiet",
      `${revision}^{commit}`,
    ]).status === 0
  );
}

function loadWorkspaceGraph(repository) {
  const result = runGit(repository, [
    "ls-files",
    "--",
    "apps/*/*/package.json",
    "packages/*/*/package.json",
  ]);

  if (result.status !== 0) {
    throw new Error("Workspace manifests could not be listed");
  }

  const manifestPaths = result.stdout.trim().split("\n").filter(Boolean);
  const packagesByName = new Map();
  const packagesByDirectory = new Map();

  for (const manifestPath of manifestPaths) {
    const manifest = JSON.parse(
      readFileSync(resolve(repository, manifestPath), "utf8"),
    );
    const directory = normalizeRepositoryPath(dirname(manifestPath));

    if (typeof manifest.name !== "string" || manifest.name.length === 0) {
      throw new Error(`${manifestPath} has no package name`);
    }

    if (packagesByName.has(manifest.name)) {
      throw new Error(`Duplicate workspace package name: ${manifest.name}`);
    }

    const workspacePackage = { directory, manifest };
    packagesByName.set(manifest.name, workspacePackage);
    packagesByDirectory.set(directory, workspacePackage);
  }

  return { packagesByName, packagesByDirectory };
}

function getWorkspaceDependencies(workspacePackage, packagesByName) {
  const dependencies = new Set();

  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, version] of Object.entries(
      workspacePackage.manifest[field] ?? {},
    )) {
      if (packagesByName.has(name)) {
        dependencies.add(name);
        continue;
      }

      if (typeof version === "string" && version.startsWith("workspace:")) {
        throw new Error(
          `${workspacePackage.manifest.name} references missing workspace ${name}`,
        );
      }
    }
  }

  return dependencies;
}

function getAffectedWorkspacePaths(appDirectory, graph) {
  const appPackage = graph.packagesByDirectory.get(appDirectory);

  if (!appPackage) {
    throw new Error(`${appDirectory}/package.json is not a tracked workspace`);
  }

  const packageQueue = [appPackage.manifest.name];
  const visitedPackages = new Set();
  const workspacePaths = [];

  while (packageQueue.length > 0) {
    const packageName = packageQueue.shift();

    if (visitedPackages.has(packageName)) {
      continue;
    }

    const workspacePackage = graph.packagesByName.get(packageName);

    if (!workspacePackage) {
      throw new Error(
        `Workspace package could not be resolved: ${packageName}`,
      );
    }

    visitedPackages.add(packageName);
    workspacePaths.push(workspacePackage.directory);
    packageQueue.push(
      ...getWorkspaceDependencies(workspacePackage, graph.packagesByName),
    );
  }

  return workspacePaths;
}

function getRepositoryRoot() {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
}

function main() {
  const requestedAppDirectory = process.argv[2];

  if (!requestedAppDirectory) {
    buildSafely("Usage: ignore-build.mjs <app-directory>");
  }

  const repository = getRepositoryRoot();
  const appDirectory = normalizeRepositoryPath(
    relative(repository, resolve(repository, requestedAppDirectory)),
  );

  if (
    appDirectory.length === 0 ||
    appDirectory.startsWith("../") ||
    isAbsolute(appDirectory)
  ) {
    buildSafely("The application directory is outside the repository");
  }

  const headSha = process.env.VERCEL_GIT_COMMIT_SHA ?? "HEAD";
  const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA;

  if (!previousSha) {
    buildSafely("VERCEL_GIT_PREVIOUS_SHA is unavailable");
  }

  if (!commitExists(repository, headSha)) {
    buildSafely("Current deployment SHA is unavailable");
  }

  if (!commitExists(repository, previousSha)) {
    buildSafely("Previous deployment SHA is unavailable in the clone");
  }

  const graph = loadWorkspaceGraph(repository);
  const watchedPaths = [
    ...getAffectedWorkspacePaths(appDirectory, graph),
    ...GLOBAL_BUILD_PATHS,
  ];

  console.log(
    `Checking deployment range for changes in: ${watchedPaths.join(", ")}`,
  );

  const diff = runGit(repository, [
    "diff",
    "--quiet",
    previousSha,
    headSha,
    "--",
    ...watchedPaths,
  ]);

  if (diff.status === 0) {
    console.log("No relevant changes detected; skipping build.");
    process.exit(0);
  }

  if (diff.status === 1) {
    console.log("Relevant changes detected; building.");
    process.exit(1);
  }

  buildSafely("The deployment diff could not be read");
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  buildSafely(message);
}
