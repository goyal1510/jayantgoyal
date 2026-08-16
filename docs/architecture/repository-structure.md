# Repository structure

The top-level layout separates product ownership from cross-product packages:

```text
apps/
├── portfolio/
│   ├── web/
│   └── contracts/
├── studio/
│   └── web/
├── admin/
│   └── web/
└── auth/
    └── web/

packages/
├── ecosystem/
│   └── identity/
├── integrations/
│   └── github/
├── web/
│   ├── auth/
│   ├── brand/
│   ├── seo/
│   ├── tailwind-config/
│   ├── ui/
│   └── urls/
└── tooling/
    ├── eslint-config/
    └── typescript-config/

assets/
└── brand/web/

docs/
scripts/
supabase/
```

## Application convention

`apps/<product>/<platform>` is an implemented client. All current clients are
under `web`. Product-owned contracts that cross a client boundary stay beside
the product; Portfolio uses `apps/portfolio/contracts` because both Portfolio
and Admin consume its CMS contract.

Do not create a platform directory until its implementation exists. A future
iOS client would be added under the owning product, for example
`apps/studio/ios`, without moving the web client or splitting the repository.

## Package convention

- `packages/ecosystem`: framework-neutral identity and ecosystem concepts.
- `packages/integrations`: external provider adapters.
- `packages/web`: contracts that intentionally depend on web frameworks,
  browser behavior, Next.js, React, or web metadata.
- `packages/tooling`: repository build and quality configuration.

The workspace patterns are `apps/*/*` and `packages/*/*`. New platform clients
and grouped packages are therefore discovered without adding another root
workspace exception.

## Assets and documentation

`assets/brand/web` is the canonical source for favicon assets copied into each
web client's public directory. `pnpm check:brand-assets` prevents divergence.

`docs/` is the only maintained documentation tree. App-local READMEs are not
used because product information belongs in `docs/products` and operational
information belongs in the matching central category.
