# Web platform

Web is the only implemented client platform. Portfolio, Studio, Admin, and Auth
are independent Next.js applications under `apps/<product>/web`.

## Runtime

- Next.js 16 and React 19
- TypeScript 5.9 in strict mode
- Tailwind CSS v4 with shared web styles
- Radix UI, Framer Motion, Lucide, Sonner, and Zustand where needed
- Supabase browser/server clients

Each client owns its routes, APIs, local components, authorization policy,
environment example, Vitest project, and Turbo build environment inputs. A
client imports stable contracts from `@jayant/*` packages; it never imports
another client's source.

## Server and client boundaries

Server components load canonical data and pass serializable view models to
client components. Client components own interaction, browser APIs, and local
state. Route handlers/server actions own secrets, privileged provider calls,
and mutation validation. A file using service-role or provider secrets must not
be reachable from a `"use client"` import graph.

`page.tsx` commonly provides metadata/server composition while a nearby client
component provides interaction. This is a convention, not a rule that requires
a client component for every page.

Next.js request middleware lives in `src/proxy.ts`. Application-local imports
use `@/*` for `src/*`. Client modules must not cross a server-only secret
boundary. External images that cannot satisfy current Next.js proxy
requirements use a normal `<img>` with appropriate accessibility and security
considerations.

## Routing and discoverability

Every public page defines intentional metadata and canonical/Open Graph data,
appears in the appropriate sitemap when indexable, has matching robots policy,
and updates both visible and structured breadcrumbs where those systems exist.
Product proxies and client gates must agree on public access. Public API routes
also need an explicit cost/abuse class.

Next.js route groups such as `(protected)` organize layouts but do not add URL
segments. `src/proxy.ts`, not folder naming alone, owns request admission.

## State and persistence

Use server/database state for canonical shared behavior, URL/query state for
shareable navigation, local React state for ephemeral UI, and Zustand
persistence only for intentionally browser-local state. Persisted Zustand
stores use manual hydration to avoid server/client mismatch. Realtime is a
delivery mechanism for canonical rows, not a second data source.

## Client definition of done

A new web client needs a workspace manifest, Next/Turbo/TypeScript/ESLint
configuration, environment example, local port, package dependency boundaries,
root commands/CI discovery, tests, Vercel project/root/domain, brand assets,
security/access policy, product documentation, and route/environment reference
coverage. Create it only for an implemented product client.

## Shared web layer

`packages/web` intentionally contains web-specific contracts:

- `brand`: metadata, application labels, manifest identity, asset paths.
- `urls`: origins, host checks, URL construction and rewriting.
- `seo`: public metadata and indexability helpers.
- `auth`: Supabase SSR and web-session contracts.
- `ui`: reusable React components and the Studio/Admin/Auth shell.
- `tailwind-config`: shared CSS source and PostCSS configuration.

This code is not presented as universal. A future native client should reuse
only contracts that are genuinely framework-neutral and should not force web
packages into a lowest-common-denominator abstraction.

## Brand assets

`assets/brand/web` is canonical. Each web client's public directory contains a
deployable copy under `public/assets/Jayant_favicon_io`. Run
`pnpm check:brand-assets` after changing either source or copies.
