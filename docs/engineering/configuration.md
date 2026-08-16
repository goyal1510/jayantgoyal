# Configuration model

Configuration is owned by the smallest deployed client or shared build system
that consumes it. The repository does not maintain one union environment file
for all products.

## Sources and precedence

| Source                            | Purpose                                       | Commit status |
| --------------------------------- | --------------------------------------------- | ------------- |
| `apps/<product>/web/.env.example` | Secret-free variable contract for one client  | tracked       |
| `apps/<product>/web/.env.local`   | Developer-local values                        | ignored       |
| Vercel project environment        | Preview/Production runtime and build values   | external      |
| `apps/<product>/web/turbo.json`   | Variables that affect that client's task hash | tracked       |
| root `turbo.json`                 | Shared task dependency/output/cache behavior  | tracked       |
| package/Next config               | Typed/static framework configuration          | tracked       |

Never put a secret value in documentation, `.env.example`, client source,
`NEXT_PUBLIC_*`, or Turbo configuration output. Documentation names variables
and explains ownership only.

## Client-scoped environment

Copy or pull only the environment for the client being run. Giving every
client the union of all credentials increases blast radius and hides ownership
mistakes. Portfolio and Auth intentionally have no service-role key. Vercel
credentials belong only to Admin. Weather belongs only to Studio. Contact and
Google Resume credentials belong only to Portfolio.

The exact variable-by-variable contract is in [environment
variables](../reference/environment-variables.md).

## Browser-visible versus server-only

`NEXT_PUBLIC_*` is embedded into browser-accessible JavaScript when referenced
by client code. It may contain public origins, Supabase project URL/anonymous
key, session mode, or a provider key intentionally designed for browser use.
It must never contain service-role, OAuth private key, provider token, signing
secret, or other confidential material.

Server-only variables should be read only from server components, route
handlers, server actions, or explicitly server-only modules. The source-health
and service-role checks supplement code review but do not replace it.

## Environment classes

### Local development

Each client runs on its assigned loopback port. The shared production cookie
domain is not used on plain localhost. An explicitly configured `.localhost`
or `.test` domain may exercise shared local cookies when all hostnames and
callback URLs are configured together.

### Vercel Preview

Preview origins are generated and are not a permanent staging tier. Auth may
derive its own origin from request headers when `NEXT_PUBLIC_SITE_URL` is
omitted. Cross-product Preview returns must be listed exactly in
`NEXT_PUBLIC_AUTH_RETURN_ORIGINS`; wildcard/suffix trust is not used. Preview
must not receive the production parent-domain cookie attribute.

### Production

Production uses the four canonical hosts and shared secure web session. Each
Vercel project receives only its own variables. Changing an origin, cookie, or
Auth return variable is a coordinated multi-project change.

## Adding a variable

1. Name the owning client and feature.
2. Decide whether the value is public or secret before choosing its name.
3. Add the name and secret-free comment to that client's `.env.example`.
4. Add it to the client's `turbo.json` only when it affects a cached build/task.
5. Add local and Vercel values without printing or committing them.
6. Document requirement, fallback, exposure, and rotation owner in the
   environment reference.
7. Test missing, invalid, Preview, and Production behavior where relevant.

## Removing or renaming a variable

Search source, workspace config, Vercel project configuration, examples,
documentation, and tests. Support a compatibility window only when deployed
clients cannot change atomically. Remove old names after all consumers are
verified. Secrets should be revoked/rotated in the provider even after the code
reference is removed.

## Configuration failures

Public product content should report a clear unavailable/configuration state
when a required backend is missing. Security controls fail closed. Optional
provider features may degrade locally without taking down unrelated pages.
Never replace a missing server secret with a browser-visible equivalent or log
its value while diagnosing configuration.
