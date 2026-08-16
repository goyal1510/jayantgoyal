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

## Identity layers

| Layer                | Examples                                                      | Owner               |
| -------------------- | ------------------------------------------------------------- | ------------------- |
| Ecosystem identity   | Jayant/person name and product IDs                            | `@jayant/identity`  |
| Web identity         | Titles, descriptions, manifests, social previews, asset paths | `@jayant/web-brand` |
| Web origin           | Canonical/Preview/local URLs and host checks                  | `@jayant/web-urls`  |
| Application surface  | Sidebar, dialogs, inputs, navigation/loading primitives       | `@jayant/web-ui`    |
| Product presentation | Portfolio editorial system; Studio/Admin/Auth composition     | Owning web client   |

The domain `jayantgoyal.com` identifies the public host family; it does not
rename the ecosystem. Product display names come from shared brand contracts,
while route-specific copy remains product content.

## Shared UI extraction

A component belongs in `@jayant/web-ui` when multiple application-style web
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

1. Update the canonical source in `assets/brand/web`.
2. Update each web client's deployable public copy.
3. Update manifest/metadata dimensions or types when the asset contract changes.
4. Run `pnpm check:brand-assets`, client metadata tests, and affected builds.
5. For a future native client, generate native formats from the identity source
   without treating web paths as a cross-platform API.
