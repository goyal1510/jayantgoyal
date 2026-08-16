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

Next.js request middleware lives in `src/proxy.ts`. Application-local imports
use `@/*` for `src/*`. Client modules must not cross a server-only secret
boundary. External images that cannot satisfy current Next.js proxy
requirements use a normal `<img>` with appropriate accessibility and security
considerations.

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
