# Vercel deployment

Each web client is an independent Vercel project connected to the same GitHub
repository and deployed from `main`.

| Product   | Vercel root directory  | Production host             |
| --------- | ---------------------- | --------------------------- |
| Portfolio | `apps/portfolio/web`   | `jayantgoyal.com`           |
| Studio    | `apps/studio/web`      | `studio.jayantgoyal.com`    |
| Admin     | `apps/admin/web`       | `admin.jayantgoyal.com`     |
| Auth      | `apps/auth/web`        | `auth.jayantgoyal.com`      |

The install command uses the repository lockfile. The client build command is
its normal workspace/Next.js build; application-specific environment values
are configured only on projects that consume them.

## Ignored build step

Because Vercel executes the ignored-build command from the configured client
root, use the three-level path back to the repository script:

```text
Portfolio: bash ../../../scripts/ignore-build.sh apps/portfolio/web
Studio:    bash ../../../scripts/ignore-build.sh apps/studio/web
Admin:     bash ../../../scripts/ignore-build.sh apps/admin/web
Auth:      bash ../../../scripts/ignore-build.sh apps/auth/web
```

The detector builds when its client, any shared package, repository build
configuration, or the detector itself changes. If Vercel cannot provide a safe
previous deployment range, it builds instead of risking a false skip.

## Environment ownership

`apps/<product>/web/.env.example` defines the variables for each project, while
`apps/<product>/web/turbo.json` defines the values that affect that client's
build hash. Preview uses generated deployment origins where required; there is
no persistent staging branch or staging domain.

Auth is provider-linked but DNS/cutover state must be verified before changing
live entry ownership. Studio and Admin compatibility routes remain available
until the Auth cutover is explicitly complete.

## Shipping

Before pushing directly to `main`, fetch `origin/main`, verify the reviewed
commit contains the latest base, run the full quality gates, inspect for secrets
and generated files, and update all four Vercel root directories atomically
with the repository path change. After pushing, verify GitHub Actions and all
affected deployments.
