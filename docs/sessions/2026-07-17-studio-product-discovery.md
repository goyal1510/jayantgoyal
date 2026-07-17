# Studio Product Discovery

## Scope

- Advance PLATFORM-11 without creating the unapproved `jg_app` catalog schema.
- Separate the Studio landing page's featured selection from a complete public
  product catalog.
- Give every current Studio product a public detail page with its access
  requirement visible before launch.
- Preserve the shared Studio sidebar and header behavior explicitly selected by
  the user; this slice does not replace the shell with a separate marketing
  layout.

## Implementation

- Expanded the app-owned static product contract with type, lifecycle status,
  featured state, highlights, and validated launch destinations.
- Removed Blog from the Studio product catalog because professional writing is
  owned by Portfolio; the external Blog navigation link remains available.
- Added an intentional three-product featured set to Studio Home.
- Added a public, type-filterable `/products` catalog and statically generated
  `/products/[slug]` detail pages for all current products.
- Product details disclose Public, Account, or External access before launch;
  account-backed launches continue into the existing app-local auth gate.
- Structured product data uses each public detail page as its canonical URL,
  while launch destinations remain separate calls to action.
- Added Products to Studio navigation, visual breadcrumbs, breadcrumb JSON-LD,
  public-route policy, SEO indexability, sitemap, and `llms.txt`.

## Boundaries

- No database table, migration, hosted Supabase configuration, provider setting,
  DNS record, environment variable, or authentication behavior changed.
- Product inventory and route meaning remain Studio-owned; no Admin or shared UI
  package imports Studio implementation.
- Search, recently updated data, releases, and related products remain omitted
  until real data or relationships justify them.

## Verification

- `pnpm test`: 13 test files and 52 tests passed, including the inventory
  contract, featured subset, and detail-route construction.
- `pnpm --filter studio lint` and `pnpm --filter studio check-types` passed.
- `pnpm --filter studio build` passed after rebuilding with the ignored local
  Studio environment; the route manifest includes `/products` and
  `/products/[slug]`.
- Chrome production-mode validation passed for Studio Home, the complete
  catalog, type filtering, public/account/external product details, navigation,
  breadcrumbs, desktop layout, and a 390-by-844 mobile viewport with no
  horizontal overflow.
- The final account-product check kept `/activity-tracker/dashboard` on Studio
  and rendered the shared sign-in gate. Product JSON-LD used the public detail
  URL, and the final browser warning/error log was empty.
- The first local browser run exposed a missing ignored Studio environment after
  the physical app rename. The existing pre-rename local environment was copied
  to the worktree, its local application URLs were corrected without printing
  values, and the clean rebuild/browser run above replaced that invalid proof.

## Rollback

- Revert this slice to restore the previous all-products home inventory. Existing
  product routes and authentication behavior are unchanged, so rollback does not
  require a database, DNS, or provider action.
