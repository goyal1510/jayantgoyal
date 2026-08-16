# Design and brand

Jayant is the public person identity, while each product has its own
presentation. The repository/domain slug and `jg` mark remain technical and
visual identifiers rather than additional personal or umbrella-product names.
See the [naming contract](naming-contract.md) for the complete rules.

## Ownership

- `@jayantgoyal/identity` owns person/technical identity, product names,
  canonical hosts/origins, and development origins.
- `@jayantgoyal/web-brand` owns web labels, descriptions, title templates,
  social-preview records, and deployable asset paths.
- `@jayantgoyal/web-seo` owns complete root/page/article metadata and manifest
  builders.
- `assets/brand/web` is the canonical web favicon source.
- `assets/brand/social` is the canonical product social-preview source.
- `@jayantgoyal/web-ui` owns reusable application-surface components used by Studio,
  Admin, and Auth.
- Portfolio owns its public editorial component and stylesheet system.
- `@jayantgoyal/tailwind-config` owns shared web styling foundations.

Run `pnpm check:brand-assets` after changing canonical assets or deployable
copies. New clients should project the same identity foundation into their own
client-native asset formats rather than treating web paths as universal.

Shared components should encode stable behavior and accessibility, not erase
meaningful product identity. Promote a component only after reuse is real;
keep page-specific composition inside the owning client.

## Identity layers

| Layer                | Examples                                                  | Owner                    |
| -------------------- | --------------------------------------------------------- | ------------------------ |
| Identity foundation  | Person, technical namespace, products, origins/hosts      | `@jayantgoyal/identity`  |
| Web brand            | Titles, descriptions, social previews, asset paths        | `@jayantgoyal/web-brand` |
| Web URL              | Overrides, URL construction, normalization, host checks   | `@jayantgoyal/web-urls`  |
| Web SEO              | Root/page/article metadata and installable manifests      | `@jayantgoyal/web-seo`   |
| Application surface  | Sidebar, dialogs, inputs, navigation/loading primitives   | `@jayantgoyal/web-ui`    |
| Product presentation | Portfolio editorial system; Studio/Admin/Auth composition | Owning web client        |

The domain `jayantgoyal.com` identifies the public host family. It is not a
personal full name or product brand. Product display names come from shared
contracts, while route-specific copy remains product content.

## Shared UI extraction

A component belongs in `@jayantgoyal/web-ui` when multiple application-style web
clients need the same semantics, interaction, accessibility, variants, and
maintenance owner. A similar-looking page section stays local when content,
layout, or lifecycle differs. Portfolio deliberately does not depend on the
shared application shell.

Shared UI accepts product-owned navigation/data through explicit props. It
must not import product routes, permissions, or registries. Product clients
adapt their domain configuration into the shared presentation contract.

## Accessibility and interaction

Reusable components preserve keyboard operation, focus management, semantic
labels, reduced-motion behavior where applicable, contrast, and responsive
touch targets. Icons do not replace accessible text without a label. Loading,
empty, error, and disabled states are part of the component contract, not
optional page decoration.

## Asset change workflow

1. Update the relevant source in `assets/brand/web` or `assets/brand/social`.
2. Update each owning web client's deployable public copy and any special
   `src/app/favicon.ico` file.
3. Update manifest/metadata dimensions or types when the asset contract changes.
4. Run `pnpm check:brand-assets`, client metadata tests, and affected builds.
5. For a future native client, generate native formats from the identity source
   without treating web paths as a cross-platform API.
