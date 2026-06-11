# 2026-06-11 Store RCM Table UI

## Scope

- Rework the Jayant Tools store/pricing UI after feedback that the current storefront, separate pricing URL, and simple table/list do not match the cleaner operational UI quality expected from the RCM app.
- Use the RCM `ServerDataTable` interaction model as reference: TanStack table, search, faceted filters, column controls, pagination, compact toolbar, and a restrained app-shell layout.

## Notes

- Source clone is protected and was not edited. Implementation worktree: `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/store-rcm-table-ui`.
- RCM reference inspected from `/Users/jayant/Desktop/Jayant/Projects/office/rcm-mono/apps/rcm/src/components/tables/server-data-table.tsx` and related table toolbar/filter/view components.
- Replaced the previous handcrafted store list with a TanStack React Table catalog: global search, faceted filters, sorting, pagination, column visibility, detail links, and checkout actions.
- Folded pricing into `/store#plans`, changed commerce sidebar nav to in-store `Catalog` and `Plans` anchors, and made `/pricing` redirect into the store plans section so pricing is no longer a disconnected page.
- Browser screenshots showed the 3D background made the store feel noisy and the pricing feature columns were too cramped. Removed the 3D background/toggle from the public store shell and constrained pricing feature columns to wider layouts only.
- Follow-up screenshot still showed feature copy wrapping too hard in pricing rows, so pricing plan features now stay single-column for a calmer operational layout.
- Catalog screenshot showed an unnecessary default `Featured` column and clipped checkout action. Hid `Featured` by default through column visibility, reduced the table minimum width, and tightened the checkout button sizing.

## Validation

- `pnpm lint --filter jg` passed.
- `pnpm check-types --filter jg` passed.
- `git diff --check` passed.
- Browser QA on `http://localhost:3000/store` confirmed the cleaner store shell, in-store `Catalog`/`Plans` sidebar nav, integrated pricing section, TanStack catalog search, faceted filter dropdown, empty-search reset, column visibility menu, and unclipped checkout actions.
- Browser QA on `/pricing` confirmed navigation resolves to the store plans section.

## User Rework

- User rejected the remaining copy, oversized headings, implementation language, column chooser, pagination, horizontal table scrolling, and public product naming.
- Reworked the store again into a quieter buyer-facing page: compact `Products and plans` heading, short plan cards, no metrics block, no implementation text, no column chooser, no pagination, responsive no-horizontal-scroll catalog rows, and public naming helper that presents `jayant-tools-starter-pass` as `Tools Access` in store/catalog/detail UI.
- Removed the raw product name from store breadcrumbs and rebuilt product detail as a smaller account-access page without the oversized media hero.
- Aligned sidebar and `/pricing` redirect anchors to the cleaned `#plans` section.
- Final browser pass confirmed `/store`, `/store/jayant-tools-starter-pass`, filter overlay behavior, and `/pricing -> /store#plans`.
- Fixed the store document title by letting the root title template produce `Store | Jayant` instead of nesting `Jayant Tools` into the page title.
- Matched the store catalog toolbar sizing to the RCM table toolbar reference: 36px search and filter controls, shrink-stable filter buttons, and no dynamic count badge in the filter trigger so active filters do not shift the row.
- Browser validation confirmed `/store` title is `Store | Jayant`, product detail title is `Tools Access | Store | Jayant`, and the active Type filter remains 92px wide by 36px tall while the search input stays 36px tall.
- Removed the remaining store pill, helper paragraph, top anchor buttons, catalog helper copy, and bottom explainer cards after user feedback that the page still had too much useless text.
- Reworked the catalog table header and row alignment: normal capitalization, centered Type/Status/Action columns, right-aligned price, and a single action dropdown with Details and Buy.
- Restored product media on the detail page using `commerce_products.image_url` with a tools image fallback, and simplified the detail page to image, name, price, buy button, and policy links.
- Further reduced visible store copy by removing plan feature lists and the product summary from the detail page; the action dropdown trigger is now an explicit `Action` button instead of an icon-only control.
- Replaced the catalog action dropdown with two icon-only controls for details and cart checkout, restored stable active-filter count badges, and added short useful context back to the store cards and detail page.
- Fixed the active filter count to render inside a fixed-width trigger and restored a single-line product description in the catalog row.
- Tightened table geometry after screenshot review: Type, Price, Status, and Actions now use fixed-width centered columns while Product remains left-aligned.
- Replaced body-cell text alignment with flex centering for Type, Price, Status, and Actions so badges and icon controls align to their column headers.
- Combined the details and cart actions into a single pill-shaped control with an internal divider.
- Matched header and row grid gaps so Status and other fixed columns share the same visual center.
