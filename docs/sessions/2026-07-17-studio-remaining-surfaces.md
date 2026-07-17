# Studio Remaining Surfaces

## Scope

- Audit and improve the remaining Studio product surfaces after the approved
  Studio redesign was promoted to `apps/studio`.
- Cover GitHub Stats, currency calculator and history, Calculator Builder,
  Activity Tracker, and Messenger.
- Preserve each feature's existing routes, data behavior, authentication,
  realtime behavior, and API contracts while improving hierarchy, density,
  navigation consistency, empty/loading states, and accessibility.

## Approach

- Capture fresh local screenshots of each current surface before implementation.
- Compare the pages against the approved Studio visual language already used by
  Home, Products, Tech Tools, and Games.
- Record page-specific findings and an implementation order before editing UI.
- Keep validation local and focused; no hosted deployment testing is planned.

## Current status

- Dedicated worktree created from the latest `origin/main` after PR #56 merged.
- Installed repository dependencies from the existing lockfile and local pnpm
  store without changing dependency versions.
- Linked only the worktree-local Studio directory to the existing
  `jayantgoyal-studio` Vercel project and pulled its Development environment for
  local rendering. The environment and `.vercel` state are ignored; the CLI's
  broad temporary `.env*` ignore addition was removed so tracked repository
  policy remains unchanged.
- Completed a fresh authenticated browser audit at `http://localhost:3001` for
  GitHub Stats (empty and loaded states), currency calculator (new and
  history), Calculator Builder (empty and configured states), all three
  Activity Tracker routes, and Messenger. Screenshots are stored outside the
  repository under `/tmp/studio-remaining-surfaces-audit-2026-07-17`.

## Audit findings

- GitHub Stats has useful data and charts, but its empty state has no guidance
  and the loaded state gives equal weight to the profile, six metrics, and
  every chart. It needs a clear Studio page introduction, a compact metrics
  band, and more intentional section hierarchy.
- Currency Calculator is dominated by a nested denomination table; the running
  total and note appear below the first viewport. History is dominated by
  filters and nested cards despite the current low-data state. Both should use
  a compact workspace header and keep the primary action and total visible.
- Calculator Builder's click/drag behavior works, but three equal boxed columns
  obscure the intended sequence. It needs a compact component palette, a clear
  composition area, and a stronger live calculator preview without changing
  the persisted builder state.
- Activity Dashboard and Management rely on generic titles, nested tables, and
  large empty canvases. Tracker exposes the useful monthly grid but needs a
  clearer toolbar and a flatter surface. The three routes should read as one
  coherent Activity Tracker workspace.
- Messenger immediately presents a dense stream of visually identical message
  cards without a title, summary, or filtering context. Selection, copy,
  expansion, realtime loading, and message creation should remain intact while
  the list becomes easier to scan.

## Implementation direction

- Reuse the approved Studio typography, restrained accent colors, flat section
  dividers, and responsive density already present in Products, Tech Tools, and
  Games.
- Change presentation and page framing only. Preserve routes, Supabase calls,
  stores, authentication, API shapes, realtime subscriptions, and all current
  actions.
- Work in feature slices: GitHub Stats; currency calculator and history;
  Activity Tracker; Messenger; then Calculator Builder. Validate once at the
  end with focused Studio checks and local screenshots.

## Implementation progress

- Added a compact, reusable Studio workspace header with blue, coral,
  lavender, sage, and sand presentation tones. It centralizes only visual
  hierarchy; feature state and behavior remain local to each product.
- Updated GitHub Stats with an explanatory blue workspace header, integrated
  username search, a flatter profile surface, a compact six-metric band, and
  consistent chart/repository sections. Data fetching, default profile loading,
  sorting, contribution year selection, and external links are unchanged.
- Reworked Currency Calculator into a denomination workspace with a persistent
  running-total summary, compact note counts, one visible save action, and a
  direct History link. Reworked History with a clear header, New Calculation
  action, compact filters, flatter entries table, and clearer row-selection
  copy. Calculation persistence, pagination, filtering, detail sheets, and
  deletion behavior are unchanged.
- Unified Activity Tracker's Overview, Monthly Tracker, and Management routes
  with the shared sage workspace framing. The overview now exposes useful
  aggregate metrics and progress bars, the monthly grid has clearer editability
  context and horizontal overflow handling, and Management presents a compact
  activity library with active counts. Creation, editing, activation, monthly
  navigation, date-edit rules, and entry API behavior are unchanged.
- Reframed Messenger as a private realtime workspace with a clear header and
  visible New Message action. Added local All/Unread/Read filters and content
  search, removed the floating action, improved message scanning, and replaced
  read-item strikethrough with quieter visual hierarchy. Realtime inserts,
  updates, deletion handling, copy, expand, code rendering, and read-state API
  behavior are unchanged.
- Rebuilt Calculator Builder's presentation around a clear Key Library →
  Selected Keys → Live Calculator flow. Removed the equal glass-card treatment,
  replaced handcrafted inline icons with the repository's Lucide icon set,
  strengthened the calculator preview, and kept click, drag/drop, persisted
  selection, removal, clearing, calculation, and history behavior intact.

## Validation

- `pnpm --filter studio check-types` — passed after generating current Next.js
  route types.
- `pnpm --filter studio lint` — passed with zero warnings.
- `git diff --check` — passed.
- Reviewed authenticated, loaded desktop states locally for GitHub Stats,
  Currency Calculator, Currency History, Activity Overview, Monthly Tracker,
  Activity Management, Messenger, and Calculator Builder at a consistent
  viewport. Confirmed the revised hierarchy, spacing, borders, dark-mode tones,
  horizontal tracker overflow, loaded data states, and primary actions render
  without visible layout regressions.
- No deployment or hosted-preview validation was performed, matching the
  requested local-only validation approach. Feature mutations were deliberately
  avoided during visual review.

## Residual checks

- Mobile and unusual content-length behavior should receive the normal manual
  product review before shipping. No API, database, authentication, environment,
  or deployment changes are included in this branch.

## Follow-up refinement

- Removed the small eyebrow/subheading layer from the shared Studio workspace
  header and every updated surface. Page titles and breadcrumbs now carry the
  hierarchy without repetitive labels such as `Developer intelligence`,
  `Activity Tracker`, `Cash workspace`, or `Personal inbox`.

## Weather follow-up

- Audited Weather's authenticated empty and loaded city-search states. The
  existing API, geolocation, recent-city persistence, current conditions, and
  five-day forecast all worked, but the page used the older split dashboard
  layout, had no page heading, and left a large unused canvas before results.
- Reworked Weather with the shared Studio workspace header, integrated city and
  location controls, visible recent-city shortcuts, a more legible current
  conditions surface, restrained condition-aware tones, a flatter five-day
  forecast, and a purposeful empty state. Weather data fetching, metric units,
  geolocation, recent search persistence, and forecast selection are unchanged.
- Tightened the loaded current-conditions surface after local visual review so
  the five-day forecast begins higher in the viewport without reducing the
  prominence of location, temperature, wind, or humidity.

## Sidebar follow-up

- Added Currency Calculator to the Studio Workspaces navigation group. Its
  existing New and History sub-navigation now appears in the expanded sidebar,
  while the calculator icon remains available in the collapsed sidebar.
- Restored the Terms & Conditions entry that was unintentionally dropped when
  the redesigned sidebar removed its old footer. It reuses the existing terms
  dialog, remains visible as a document icon with a tooltip in collapsed mode,
  and does not move user/account controls back from the top bar.
- Locally verified the expanded label, opened and closed the existing Terms
  dialog, and confirmed the entry remains visible and accessible after
  collapsing the sidebar. Targeted ESLint and the Studio TypeScript check
  passed.
- Removed the repeated display name from the opened top-bar account menu. The
  trigger continues to show the user's name, while the dropdown identity row
  now shows only the email address before Settings and Log out.
- Locally verified that the account dropdown has one email identity line and
  retains Settings and Log out. Targeted ESLint and the Studio TypeScript check
  passed.

## Header consolidation

- Standardized Studio detail and workspace headers on the accepted Tech Tools
  editorial treatment: icon first, large display title, readable description,
  and optional actions aligned at the lower edge. The shared component retains
  each surface's own tone and supports controls beneath a divider.
- Replaced the separate hand-built Tech Tools and individual Game header markup
  with the shared Studio workspace header. This removes three competing header
  implementations while preserving Tool favorites, Game play-mode labels, and
  every module's existing actions and embedded controls.
- Added the previously missing File Manager identity header using the same
  editorial component. Upload and New Folder are now visible primary actions;
  folder breadcrumbs, sorting, and view selection sit beneath the header
  divider without duplicating the creation controls.
- Browser-reviewed the shared header in Tech Tools, Calculator Builder, File
  Manager, and Weather at 1280 × 720 in dark mode. The final comparison passed
  with no actionable desktop hierarchy or alignment differences and no browser
  warnings or errors; the File Manager New Folder dialog also opened and closed
  successfully without creating data.
- Refined File Manager after review so the editorial header contains identity
  only. Upload, New Folder, folder breadcrumbs, sorting, and grid/list controls
  now live together in a separate toolbar directly below the header.

## Studio home viewport fix

- Traced the unnecessary desktop scroll to fixed homepage minimum heights and
  generous vertical spacing: at 1280 × 720 the shell provided 576px, while the
  homepage required about 868px plus the shell header and padding.
- Constrained the desktop inventory to the shell's available viewport height,
  assigned a compact fixed row to File Manager and Game Hub, and tightened only
  the laptop/desktop typography, padding, and feature-card spacing. Mobile keeps
  the natural stacked document flow, and the homepage content and links are
  unchanged.
- Verified the result locally at 1280 × 720: the document height now equals the
  720px viewport (previously about 1012px), the 576px inventory fits between the
  top bar and shell padding, and the browser reports no vertical overflow.

## Compact header prototype

- Added a reversible compact layout option to the shared Studio workspace
  header and enabled it only for Random Port Generator. The large icon and main
  title now share one row, with the description beneath them, reducing vertical
  space while preserving the existing tone and Favorite action. Every other
  page remains on the approved editorial layout until this prototype is
  reviewed.

## Compact tool header approval

- Product Design review confirmed that the compact header improves tool-page
  hierarchy: it preserves the large identity treatment while moving the actual
  tool interface higher in the viewport. Applied the compact icon-and-title row
  to every individual Tech Tool page; non-tool Studio workspaces retain their
  existing editorial header treatment.

## Studio-wide compact header

- Removed the temporary compact/editorial split after follow-up approval.
  `StudioWorkspaceHeader` now has one canonical composition across Tech Tools,
  Games, Weather, GitHub Stats, File Manager, Messenger, Currency Calculator,
  Activity Tracker, and Calculator Builder: icon and title share the first row,
  the description follows beneath, module actions remain aligned at the edge,
  and optional module controls keep their divided section below.
- The change centralizes the layout at the shared component rather than adding
  per-module overrides, so new Studio modules inherit the same hierarchy by
  default.
- Browser-reviewed Weather (embedded search controls), GitHub Stats (loaded
  data and embedded profile search), and File Manager (separate operational
  toolbar) at 1280 × 720. All three use the same icon-title-description
  hierarchy without horizontal overflow; their different heights now reflect
  real module controls rather than competing header layouts.
- Targeted ESLint for the shared header and tool shell passed with zero
  warnings, the Studio TypeScript check passed, and `git diff --check` remained
  clean after the shared-layout consolidation.

## Home Tech Tools density

- Rejected the first density adjustment because vertically centering the same
  sparse content redistributed the empty area without making the feature more
  useful.
- Rebuilt the Studio home Tech Tools feature as a compact inventory summary. It
  now shows the live utility and category totals, six representative categories
  with their real tool counts and direct filtered-catalog links, a View All
  route, and search. The middle of the feature is occupied by useful navigation
  rather than decorative boxes or artificial alignment.
- Browser-reviewed the full Studio home at 1280 × 720. The Tech Tools feature
  fits the existing desktop grid without horizontal overflow, all six category
  links and counts are visible, and the search remains prominent without an
  empty center.
- Targeted ESLint and the Studio TypeScript check passed after the inventory
  change; `git diff --check` remained clean.

## Tool reference coverage

- Audited the reference section that appears after individual tool interfaces.
  Only 10 of the 87 catalogued tools had content, so most tool pages ended
  without the useful summary, use cases, examples, and FAQ treatment already
  present on Random Port Generator.
- Added explicit reference registries for all 11 tool categories and tailored
  each of the 87 entries to the tool's real purpose, examples, constraints, and
  privacy or security risks. The shared renderer and FAQ structured data remain
  unchanged; only the content source was reorganized and completed.
- Added a focused registry test that requires exact catalog coverage with no
  orphaned paths and verifies every reference has a summary, at least two use
  cases, two examples, and non-empty practical guidance.
- Local browser review confirmed the compact Random Port header at 1280 × 720
  and verified that a previously uncovered page, Device Information, now
  renders the same reference structure. At that prototype checkpoint, Random
  Port remained the only page using the compact header pending design approval.
- `pnpm --filter studio exec vitest run --config vitest.config.ts
src/lib/tools/seo-content.test.ts` — passed (2 tests).
- Targeted ESLint for the reference registries, content test, shared header, and
  tool shell — passed with zero warnings.
- `pnpm --filter studio check-types` — passed after current Next.js route type
  generation.

## Tool reference refinement

- Follow-up review identified that the generated FAQ questions repeated the
  same two prompts and duplicated each tool's summary and caution. This made
  individually written reference content feel generic even though the use
  cases, examples, and risks differed by tool.
- Removed generated FAQs. Each tool now exposes its own tailored consideration
  as a visible `Keep in mind` note, while the shared summary, use-case, and
  example labels remain consistent for scanning. FAQ rendering and structured
  data are still supported when genuinely tool-specific questions are authored.
- Browser-reviewed Random Port Generator, JSON to CSV, and the longest current
  tool title at 1280 × 720. The compact treatment remained aligned, long titles
  wrapped without horizontal overflow, Favorite stayed visible, and the two
  representative references showed different tool-specific guidance.
- Re-ran the focused reference test (2 tests), targeted ESLint, and the Studio
  TypeScript check after the approved changes; all passed.

## Shipping cleanup

- Extracted the Currency History filter panel into a focused component before
  shipping so the stateful history container remains below the repository's
  300-line review threshold. Search, amount/date filtering, clear behavior, and
  pagination reset behavior are unchanged.
- Applied one final Prettier pass across the complete touched-file set after
  functionality was finished; formatting was deliberately deferred until this
  shipping checkpoint.
