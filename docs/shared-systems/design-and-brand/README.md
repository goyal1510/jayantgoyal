# Design and brand

Jayant has one identity with product-specific presentations. Shared brand
contracts prevent naming and metadata drift; they do not force every product
into one visual system.

## Ownership

- `@jayant/identity` owns framework-neutral person and product names.
- `@jayant/web-brand` owns web metadata labels, title templates, manifests,
  and canonical deployable asset paths.
- `assets/brand/web` is the canonical web favicon source.
- `@jayant/web-ui` owns reusable application-surface components used by Studio,
  Admin, and Auth.
- Portfolio owns its public editorial component and stylesheet system.
- `@jayant/tailwind-config` owns shared web styling foundations.

Run `pnpm check:brand-assets` after changing canonical assets or deployable
copies. New clients should project the same ecosystem identity into their own
platform-native asset formats rather than treating the web asset directory as
universal.

Shared components should encode stable behavior and accessibility, not erase
meaningful product identity. Promote a component only after reuse is real;
keep page-specific composition inside the owning client.
