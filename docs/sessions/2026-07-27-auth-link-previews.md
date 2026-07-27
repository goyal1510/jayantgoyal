# Auth link previews

- **Date:** 2026-07-27
- **Area:** Auth routing and public link-preview metadata across Portfolio, Studio, Admin, and Auth
- **Problem:** LinkedIn rejects `auth.jayantgoyal.com`, and automatically generated project thumbnails do not use the portfolio's canonical application screenshots.
- **Plan:** Make the Auth landing URL return crawler-friendly public metadata without exposing protected routes, then align each public application preview with its canonical screenshot. Validate the production build and live metadata before removing the four temporary LinkedIn project entries.
- **Key decision:** Keep security-sensitive application routes non-indexable; only the public landing surface should be eligible for link previews.
- **Implemented:** Added a shared application-preview contract in `@repo/brand`, switched Portfolio, Studio, Admin, and Auth metadata to matching 1200×630 screenshot crops, and replaced Auth's abstract preview artwork with its account-security screenshot.
- **Auth fix:** The unauthenticated Auth root now renders the welcome surface with a `200` response instead of redirecting. Only `/` and `/welcome` override the global `X-Robots-Tag`; account, callback, recovery, MFA, and other security routes remain non-indexable and are explicitly disallowed in `robots.txt`.
- **Tests:** Extended the brand and Auth contract suites to cover canonical preview dimensions/URLs and the public-versus-private crawler policy.
- **Screenshot refresh:** The existing Portfolio screenshot still showed the old “Product Associate Engineer” wording. Captured the live database-backed homepage at 1466×836 after verifying “Associate Product Engineer,” then regenerated the 1200×630 Portfolio social crop from that current source.
- **Validation:** The full Vitest suite passed (63 files, 305 tests), Prettier passed, affected lint and type-check tasks passed, and production builds passed for Portfolio, Studio, Admin, and Auth. A local production Auth server confirmed `200` plus `index, follow` on `/` and `/welcome`, the canonical 1200×630 Auth screenshot metadata, and retained `noindex` plus the welcome redirect for `/account/security`.
- **Database:** No schema, migration, or remote-data changes. Worktree link verification confirmed the canonical `jayantgoyal` project (`orwfvyditlguqvxvztkw`) with aligned local/remote migration history.
