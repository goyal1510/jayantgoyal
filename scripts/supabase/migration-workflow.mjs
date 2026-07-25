#!/usr/bin/env node

import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const supabaseRoot = join(repoRoot, "supabase");
const migrationsRoot = join(supabaseRoot, "migrations");
const linkedProjectFile = join(supabaseRoot, ".temp", "linked-project.json");

function usage() {
  console.error(
    "Usage: node scripts/supabase/migration-workflow.mjs --check|--apply",
  );
}

function fail(message) {
  console.error(`Migration workflow failed: ${message}`);
  process.exitCode = 1;
}

function run(command, args, cwd, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} exited with status ${result.status}`,
    );
  }

  return result;
}

function parseMigrationList(output) {
  const jsonLine = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reverse()
    .find((line) => line.startsWith("{"));

  if (!jsonLine) {
    throw new Error(
      "Supabase did not return a machine-readable migration list",
    );
  }

  const payload = JSON.parse(jsonLine);
  if (!Array.isArray(payload.migrations)) {
    throw new Error("Supabase migration list did not contain migrations");
  }

  return payload.migrations;
}

function listMigrations(workdir) {
  const result = run(
    "supabase",
    ["migration", "list", "--linked", "--output-format", "json"],
    workdir,
    { capture: true },
  );
  return parseMigrationList(result.stdout);
}

function localMigrationVersions() {
  return readdirSync(migrationsRoot)
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .map((file) => basename(file).split("_", 1)[0])
    .sort();
}

function validateHistory(migrations, localVersions, phase) {
  const localSet = new Set(localVersions);
  const remoteVersions = migrations
    .map((migration) => migration.remote)
    .filter(Boolean)
    .sort();
  const remoteSet = new Set(remoteVersions);
  const mismatchedRows = migrations.filter(
    (migration) =>
      migration.local &&
      migration.remote &&
      migration.local !== migration.remote,
  );
  const remoteMissingLocally = remoteVersions.filter(
    (version) => !localSet.has(version),
  );
  const pendingLocally = localVersions.filter(
    (version) => !remoteSet.has(version),
  );

  if (mismatchedRows.length > 0) {
    throw new Error(
      `${phase}: local and remote versions disagree (${mismatchedRows
        .map((migration) => `${migration.local}/${migration.remote}`)
        .join(", ")})`,
    );
  }

  if (remoteMissingLocally.length > 0) {
    throw new Error(
      `${phase}: remote history contains migration files missing locally: ${remoteMissingLocally.join(", ")}. Restore the exact files before applying anything; do not repair history automatically.`,
    );
  }

  return { pendingLocally, remoteVersions };
}

function readProjectRef() {
  const envRef = process.env.SUPABASE_PROJECT_REF?.trim();
  if (envRef) return envRef;

  try {
    const linkedProject = JSON.parse(readFileSync(linkedProjectFile, "utf8"));
    return linkedProject.ref;
  } catch {
    throw new Error(
      "No linked Supabase project found. Run `supabase link --project-ref <ref> --yes` once or set SUPABASE_PROJECT_REF.",
    );
  }
}

function main() {
  const mode = process.argv[2];
  if (mode !== "--check" && mode !== "--apply") {
    usage();
    process.exitCode = 2;
    return;
  }

  const projectRef = readProjectRef();
  if (!/^[a-z0-9]{20}$/.test(projectRef)) {
    throw new Error(
      "The Supabase project reference is not in the expected format",
    );
  }

  const migrationFiles = readdirSync(migrationsRoot)
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();
  if (migrationFiles.length === 0) {
    throw new Error("No migration files were found");
  }

  const tempProject = mkdtempSync(
    join(tmpdir(), "jayantgoyal-supabase-migrations-"),
  );
  try {
    mkdirSync(join(tempProject, "supabase", "migrations"), { recursive: true });
    cpSync(
      join(supabaseRoot, "config.toml"),
      join(tempProject, "supabase", "config.toml"),
    );
    for (const migrationFile of migrationFiles) {
      cpSync(
        join(migrationsRoot, migrationFile),
        join(tempProject, "supabase", "migrations", migrationFile),
      );
    }

    console.log(
      `Checking Supabase project ${projectRef} with ${migrationFiles.length} local migrations.`,
    );
    run(
      "supabase",
      ["link", "--project-ref", projectRef, "--yes"],
      tempProject,
    );

    const before = listMigrations(tempProject);
    const beforeState = validateHistory(
      before,
      localMigrationVersions(),
      "before apply",
    );
    console.log(
      `Remote history is aligned; pending migrations: ${beforeState.pendingLocally.length}.`,
    );

    if (mode === "--apply") {
      run("supabase", ["migration", "up", "--linked", "--yes"], tempProject);
      const after = listMigrations(tempProject);
      const afterState = validateHistory(
        after,
        localMigrationVersions(),
        "after apply",
      );
      if (afterState.pendingLocally.length > 0) {
        throw new Error(
          `migration up completed but ${afterState.pendingLocally.length} migration(s) remain pending: ${afterState.pendingLocally.join(", ")}`,
        );
      }
      console.log(
        "Migration apply completed; local and remote histories are identical.",
      );
    }
  } finally {
    rmSync(tempProject, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
