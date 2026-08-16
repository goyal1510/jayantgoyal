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
├── foundation/
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
└── brand/
    ├── web/
    └── social/

docs/
├── overview/
├── architecture/
├── products/<product>/
├── clients/<platform>/
├── shared-systems/
├── engineering/
├── operations/
└── reference/

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

- `packages/foundation`: framework-neutral identity and foundation concepts.
- `packages/integrations`: external provider adapters.
- `packages/web`: contracts that intentionally depend on web frameworks,
  browser behavior, Next.js, React, or web metadata.
- `packages/tooling`: repository build and quality configuration.

The workspace patterns are `apps/*/*` and `packages/*/*`. New platform clients
and grouped packages are therefore discovered without adding another root
workspace exception.

## Assets and documentation

`assets/brand/web` is the canonical favicon source and `assets/brand/social`
owns product social previews. Each web client serves synchronized copies from
stable `/assets/brand` and `/images/social` paths. `pnpm check:brand-assets`
prevents divergence, including special `src/app/favicon.ico` files.

`docs/` is the only maintained detailed documentation tree. Product information
belongs in `docs/products/<product>`, platform behavior in `docs/clients`, and
cross-product, engineering, operational, and exact reference information in
their central categories. App-local READMEs are not used.
