import { execFileSync, spawnSync } from "node:child_process";
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT_PATH = fileURLToPath(
  new URL("../../../../scripts/ignore-build.sh", import.meta.url),
);
const repositories: string[] = [];

function git(repository: string, ...args: string[]) {
  return execFileSync("git", args, {
    cwd: repository,
    encoding: "utf8",
  }).trim();
}

function commit(repository: string, message: string) {
  git(repository, "add", ".");
  git(repository, "commit", "--quiet", "-m", message);
  return git(repository, "rev-parse", "HEAD");
}

function createRepository() {
  const repository = mkdtempSync(join(tmpdir(), "ignore-build-"));
  repositories.push(repository);

  git(repository, "init", "--quiet");
  git(repository, "config", "user.email", "test@example.com");
  git(repository, "config", "user.name", "Test User");

  for (const directory of [
    "apps/studio/web",
    "apps/admin/web",
    "apps/auth/web",
    "packages/web/ui",
    "scripts",
    "docs",
  ]) {
    mkdirSync(join(repository, directory), { recursive: true });
  }

  const files = {
    "apps/studio/web/app.ts": "studio\n",
    "apps/admin/web/app.ts": "admin\n",
    "apps/auth/web/app.ts": "auth\n",
    "packages/web/ui/index.ts": "ui\n",
    "scripts/ignore-build.sh": "detector\n",
    "docs/readme.md": "docs\n",
    "package.json": "{}\n",
    "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
    "pnpm-workspace.yaml": "packages: []\n",
    "turbo.json": "{}\n",
  };

  for (const [path, contents] of Object.entries(files)) {
    writeFileSync(join(repository, path), contents);
  }

  return { repository, base: commit(repository, "initial") };
}

function runDetector(
  repository: string,
  appDirectory: string,
  previousSha: string | undefined,
  commitSha: string,
) {
  const result = spawnSync("bash", [SCRIPT_PATH, appDirectory], {
    cwd: repository,
    encoding: "utf8",
    env: {
      ...process.env,
      VERCEL_GIT_COMMIT_SHA: commitSha,
      VERCEL_GIT_PREVIOUS_SHA: previousSha,
    },
  });

  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}

afterEach(() => {
  for (const repository of repositories.splice(0)) {
    rmSync(repository, { recursive: true, force: true });
  }
});

describe("Vercel ignored build detection", () => {
  it("builds only the application changed in the deployment range", () => {
    const { repository, base } = createRepository();
    appendFileSync(join(repository, "apps/studio/web/app.ts"), "changed\n");
    const head = commit(repository, "change studio");

    expect(runDetector(repository, "apps/studio/web", base, head).status).toBe(
      1,
    );
    expect(runDetector(repository, "apps/admin/web", base, head).status).toBe(
      0,
    );
    expect(runDetector(repository, "apps/auth/web", base, head).status).toBe(0);
  });

  it("detects shared changes hidden behind a final documentation commit", () => {
    const { repository, base } = createRepository();
    appendFileSync(join(repository, "packages/web/ui/index.ts"), "changed\n");
    commit(repository, "change shared package");
    appendFileSync(join(repository, "docs/readme.md"), "changed\n");
    const head = commit(repository, "change docs last");

    expect(runDetector(repository, "apps/studio/web", base, head).status).toBe(
      1,
    );
    expect(runDetector(repository, "apps/admin/web", base, head).status).toBe(
      1,
    );
  });

  it("skips a documentation-only deployment range", () => {
    const { repository, base } = createRepository();
    appendFileSync(join(repository, "docs/readme.md"), "changed\n");
    const head = commit(repository, "change docs");

    expect(runDetector(repository, "apps/studio/web", base, head).status).toBe(
      0,
    );
  });

  it.each([
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/ignore-build.sh",
    "turbo.json",
  ])("builds when shared root configuration changes: %s", (path) => {
    const { repository, base } = createRepository();
    appendFileSync(join(repository, path), "changed\n");
    const head = commit(repository, `change ${path}`);

    expect(runDetector(repository, "apps/studio/web", base, head).status).toBe(
      1,
    );
  });

  it("builds safely when the previous deployment SHA is missing", () => {
    const { repository, base } = createRepository();

    const result = runDetector(repository, "apps/studio/web", undefined, base);

    expect(result.status).toBe(1);
    expect(result.output).toContain("building safely");
  });

  it("builds safely when the previous deployment SHA is unavailable", () => {
    const { repository, base } = createRepository();

    const result = runDetector(repository, "apps/studio/web", "missing", base);

    expect(result.status).toBe(1);
    expect(result.output).toContain("unavailable in the clone");
  });
});
