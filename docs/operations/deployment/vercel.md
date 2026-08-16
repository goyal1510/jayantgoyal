# Vercel deployment

Each web client is an independent Vercel project connected to the same GitHub
repository and deployed from `main`.

| Product   | Vercel root directory | Production host          |
| --------- | --------------------- | ------------------------ |
| Portfolio | `apps/portfolio/web`  | `jayantgoyal.com`        |
| Studio    | `apps/studio/web`     | `studio.jayantgoyal.com` |
| Admin     | `apps/admin/web`      | `admin.jayantgoyal.com`  |
| Auth      | `apps/auth/web`       | `auth.jayantgoyal.com`   |

The install command uses the repository lockfile. The client build command is
its normal workspace/Next.js build; application-specific environment values
are configured only on projects that consume them.

## Project contract

Each project must keep:

- the root directory shown above;
- pnpm installation from the repository root lockfile;
- the client-specific build command/root discovered by Vercel;
- only the environment variables listed by that client's `.env.example`;
- the ignored-build command below;
- the canonical Production domain and generated Preview domains;
- Git integration targeting `main` for Production.

A shared package or root tool can affect several projects. Changing only a
client root in Vercel without the repository path move leaves deployment and
local architecture inconsistent.

## Ignored build step

Because Vercel executes the ignored-build command from the configured client
root, use the three-level path back to the repository script:

```text
Portfolio: node ../../../scripts/ignore-build.mjs apps/portfolio/web
Studio:    node ../../../scripts/ignore-build.mjs apps/studio/web
Admin:     node ../../../scripts/ignore-build.mjs apps/admin/web
Auth:      node ../../../scripts/ignore-build.mjs apps/auth/web
```

Keep Vercel's monorepo **Skip deployment** setting enabled for every project so
Vercel can avoid queuing deployments for unaffected workspace dependency
graphs. The repository detector is a second guard for global paths outside the
workspace graph, such as documentation and database migrations.

The detector reads the target client's declared workspace dependencies and
recursively watches their directories. This includes shared workspaces outside
`packages/`, such as `apps/portfolio/contracts`. It also watches repository
build configuration and its own implementation. If the graph, deployment
range, or Git diff cannot be read safely, it builds instead of risking a false
skip.

## Environment ownership

`apps/<product>/web/.env.example` defines the variables for each project, while
`apps/<product>/web/turbo.json` defines the values that affect that client's
build hash. Preview uses generated deployment origins where required; there is
no persistent staging branch or staging domain.

Auth is the canonical interactive entry/security owner at
`auth.jayantgoyal.com`. Studio and Admin retain redirect aliases and narrow
callback compatibility for already-issued links; those paths do not change
normal ownership.

## Build and runtime validation

Before a production push, run the frozen install when the lockfile changed,
all structural/quality checks, strict types, tests, and the full production
build. A Next.js build that ignores framework type errors does not replace
`pnpm check-types`.

After the push:

1. Confirm the GitHub Quality workflow is green for the exact commit.
2. Confirm every affected Vercel project reaches `Ready` for that commit.
3. Check the deployment root/build logs for unexpected workspace selection.
4. Smoke the canonical route for each affected product.
5. For shared Auth changes, test a protected Studio return and Admin admission.
6. For public content/SEO changes, verify canonical metadata, robots, and a
   representative dynamic page.
7. For provider changes, exercise only the affected safe read/action without
   exposing credentials in evidence.

## Rollback

Prefer reverting the responsible Git commit and letting all affected projects
redeploy from one consistent repository state. A Vercel-only redeploy is useful
for a transient failed build but does not undo a bad source/configuration
change. If an environment variable caused the incident, restore/rotate it in
the owning project, redeploy that exact known source revision, and verify
cross-product Auth/session behavior when relevant.

## Shipping

Before pushing directly to `main`, fetch `origin/main`, verify the reviewed
commit contains the latest base, run the full quality gates, inspect for secrets
and generated files, and update all four Vercel root directories atomically
with the repository path change. After pushing, verify GitHub Actions and all
affected deployments.
