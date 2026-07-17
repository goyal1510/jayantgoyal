# Studio Copy Option 3

## Scope

- Remove the rejected standalone `apps/studio-V2` prototype and its generated
  implementation artifacts.
- Create `apps/studio-copy` from the tracked existing `apps/studio` application
  inside this monorepo.
- Preserve Studio's existing sidebar, application header, route inventory, and
  shared-package integration in the copy.
- Apply the approved Option 3 visual direction only within `apps/studio-copy`.
- Leave `apps/studio`, `apps/portfolio`, and `apps/admin` unchanged.

## Implementation

- Removed the rejected standalone prototype before beginning the replacement.
- Renamed the task branch and worktree to match the `studio-copy` scope.
- Copied every tracked file from `apps/studio` into `apps/studio-copy`, then
  changed only the copy's package identity and local development port.
- Retained the existing Studio product inventory, navigation inventory, icons,
  routes, API handlers, auth gates, workspace features, and shared-package
  integrations.
- Applied the selected Option 3 cream, espresso, sage, coral, and lilac visual
  system to the copy, with Manrope and IBM Plex Mono typography.
- Restyled the copied sidebar and application shell without replacing their
  existing navigation, active-route, collapse, resize, mobile, or user-session
  behavior.
- Reworked the copied Home, product catalog, product cards, and product detail
  views while sourcing their titles, descriptions, icons, access rules, launch
  destinations, and capabilities from the existing Studio inventory.
- Connected the Home tool search to the existing `/tools` page and initializes
  the existing tool filter from its query parameter.
- Copied the ignored local Studio-era environment file into the prototype and
  changed only its non-secret local site URL to port `3004`; the environment
  file remains ignored and no values were printed or committed.
- Corrected the first visual pass after manual review showed that it had drifted
  into a dashboard-like collection of oversized cards. The Home headline now
  sits directly on the cream canvas, radii and nested surface treatments are
  smaller, the coral/search and lower feature panels are flatter, and the
  product catalog introduction no longer sits inside an additional card.
- Reduced the sidebar to the agreed Discover, Workspaces, and Experiments
  destinations while leaving every omitted route and product available through
  the catalog and direct navigation. The signed-in user menu now lives in the
  top bar, retaining account settings, shared-auth redirects, sign-out, profile
  refresh, and signed-out fallback behavior.
- Removed the extra Home component top padding, restored the shared sidebar
  button sizing so collapsed icons remain centered, and gave breadcrumb links
  consistent centered hover targets without changing breadcrumb route mapping.
- Corrected the collapsed-sidebar offset identified in the user's screenshot by
  removing the extra header and content horizontal padding. The expanded shell
  now places its collapse control inside the sidebar brand row; on desktop the
  top-bar trigger appears only while collapsed so it remains available for
  reopening, and mobile retains the normal top-bar trigger.
- Replaced the ambiguous shared panel trigger after a second screenshot showed
  that it remained unclear in the collapsed dark state. Copy-local header
  controls now use explicit directional panel-open and panel-close icons, a
  bordered high-contrast collapsed-state surface, and state-specific accessible
  labels while preserving the existing sidebar state and cookie behavior.
- Removed the generic button variant, negative margin, responsive header
  padding, and separator margin after they visibly distorted the collapsed
  control. Both sidebar controls now use explicit square native-button geometry
  with zero margin and padding and a centered Lucide icon.
- Consolidated the desktop toggle into the sidebar after review showed that an
  inside-collapse/outside-expand pattern felt inconsistent. The collapsed
  Studio brand square now reveals the matching expand action only on hover or
  keyboard focus, using the same background, radius, dimensions, and no border;
  the top-bar trigger remains only where mobile requires an off-canvas opener.
- Replaced the first dark treatment after manual review found its brown and
  olive surfaces too muddy. The alternate dark theme uses a neutral graphite
  canvas, warm off-white type, clearer cool-gray borders, brighter sage actions,
  and deeper lilac and green feature surfaces; the approved light theme remains
  unchanged.
- Removed the sidebar header's extra vertical padding after paired collapsed and
  expanded screenshots exposed the same eight-pixel offset. Its explicit
  eight-pixel padding now produces a 48-pixel collapsed header and 64-pixel
  expanded header, matching the top bar's state-dependent heights and center
  line exactly.
- Compacted the Products catalog introduction after the original eyebrow,
  oversized headline, long description, and stacked result controls pushed the
  product grid below the first viewport. The page now uses a concise title and
  one-line description, tighter section spacing, and a compact filter/result
  toolbar while preserving the existing product data and filtering behavior.
- Increased the Products filter pills to a 44-pixel touch target below the
  small breakpoint while retaining the approved compact 36-pixel desktop
  height.
- Rebuilt the Tools catalog around the approved Products hierarchy: a compact
  title and search, one filter toolbar containing All, Favorites, and every
  category, one live result count, and one dense four-column desktop grid.
- Removed the three Tools metric cards and the separate Favorites and History
  sections. Favorites now behaves like a normal catalog filter, while category
  filtering and search can be combined without changing any tool route.
- Removed History from the sidebar quick links and stopped recording new tool
  visits. Existing favorite persistence and server synchronization remain
  intact, and only favorite IDs are persisted by the client going forward.
- Removed Favorites from both expanded and collapsed sidebar tool navigation so
  the sidebar remains a stable route/category index. Favorites now appears only
  as a catalog filter on `/tools`.
- Applied the approved Products palette directly to Tools cards. A stable
  tool-ID distribution scatters coral, sage, lilac, warm-neutral, and graphite
  surfaces throughout the catalog, producing variety without changing card
  order or causing colors to reshuffle between visits.
- Replaced the hard-coded `99+ utilities` copy in the Studio inventory and Tools
  metadata with the actual tool inventory count.
- Kept catalog icons compatible with the existing generic Tool icon contract
  instead of assuming Lucide-only stroke properties.
- Added a copy-local canonical Studio surface registry for product names,
  navigation labels, routes, icons, colors, visibility, and search keywords.
  The first consumers now include Hub configuration, the product inventory,
  and sidebar navigation rather than maintaining conflicting local overrides.
- Standardized the sidebar on Tech Tools, Activity Tracker, File Manager, Game
  Hub, and Calculator Builder; renamed the Game Hub root child to All Games;
  and added the requested direct Weather and GitHub Stats destinations under
  Discover.
- Replaced the hard-coded Game Hub capability count with the actual game
  inventory count.
- Rebuilt the top-bar command palette as Search Studio. It now includes Home,
  Products, external Blog and Portfolio destinations, every product, workspace
  route, game, and Tech Tools category with canonical routes rather than
  deriving invalid paths from display names.
- Aligned visible and JSON-LD breadcrumbs with the canonical registry. Product
  and Tech Tools details now preserve catalog filter context in their sole
  breadcrumb return link, while the Game Hub root no longer invents a
  Dashboard page label.
- Made Product filters URL-backed and preserved the active type when opening a
  detail page, so the breadcrumb returns to the same catalog view. Product
  cards are now one accessible link instead of a card with a small nested
  action target, and muted copy meets the reviewed contrast threshold.
- Removed the duplicate All products control from product details, compacted
  the hero so capabilities stay nearer the first viewport, and humanized raw
  type and status values without changing launch behavior.
- Made Tech Tools search and category filters URL-backed and carried that
  context into every tool detail link. The shared breadcrumb is now the only
  return navigation and restores the same category/query state.
- Flattened the tool detail introduction into the page hierarchy while keeping
  every tool's functional input/output interface untouched. Also standardized
  page metadata on Game Hub, File Manager, Calculator Builder, and Activity
  Tracker Dashboard.
- Added focused registry tests for unique canonical surfaces, direct Discover
  destinations, the All Games root label, and external Blog/Portfolio links.
- Standardized the Home utility entry point on Search tools so the top-bar and
  catalog search vocabulary no longer alternates between Search and Find.
- Corrected catalog-to-detail navigation after visual QA exposed retained
  scroll position clipping the next page's header. Product and Tech Tools cards
  now reset the shared shell to the top before route navigation.
- Replaced the overly flat Tool detail introduction after user review found it
  visually unfinished beside Product details. Each Tool now receives a compact
  color-coded hero that reuses its exact catalog tone, icon, category, title,
  description, and favorite state while leaving the functional tool workspace
  and breadcrumb behavior unchanged.
- Centralized deterministic Tool tone selection so catalog cards and their
  detail heroes cannot drift to different color treatments.
- Removed the Tool category badge chip from detail heroes after user review;
  the existing breadcrumb already communicates categories such as Text Tools,
  so repeating them inside the hero added visual noise.
- Audited the Game Hub, Tic Tac Toe setup and empty gameplay, and Dare X setup
  before beginning the game redesign. The audit identified missing discovery
  hierarchy, inaccurate capability labels, overloaded setup flows, oversized
  empty gameplay regions, and Dare X primary actions falling below the sheet
  viewport.
- Rebuilt Game Hub using the approved Studio catalog language: a compact title,
  URL-backed All/Solo/Local/Online filters, an accurate result count, whole-card
  navigation, and the established coral/sage/lilac/warm-neutral palette.
- Replaced generic `Ready to play` chips and incomplete mode labels with
  capability text derived from the canonical game registry, so online-ready
  games are discoverable without inventing unsupported modes.
- Expanded the approved game scope beyond the Game Hub to every individual
  game route, every setup sheet, and shared online-room surfaces. Added a
  canonical game presentation registry so catalog cards and game detail heroes
  use the same icon and palette, wrapped all nine individual game routes in the
  shared Studio detail hierarchy, and introduced a reusable fixed-header,
  scrollable-body, sticky-action setup sheet for the game-specific migrations.
- Reworked Tic Tac Toe as the first complete individual-game slice. Its setup
  now separates Local, Computer, and Online into explicit paths, keeps the
  relevant primary action fixed at the bottom of the sheet, and no longer
  resets an active match when setup is merely cancelled. The gameplay surface
  now has a compact match toolbar, clearer status and board hierarchy,
  accessible cell/reset labels, distinct symbol colors, and a purposeful empty
  move-history state.
- Reworked Connect Four independently rather than treating it as a reskinned
  Tic Tac Toe page. The board retains its seven-column drop behavior and
  animations, but now sits in a focused game surface with a labelled reset,
  icon-based column controls, compact status, and Studio-aligned color framing.
  Its setup sheet has distinct Local, Computer, and Online paths with a sticky
  primary action and context-specific player or room fields.
- Reworked Memory Match as its own game flow. The page now emphasizes turn,
  score, board, and completion states without a duplicate game heading, while
  the setup sheet separates play path from board size and shows only the names
  or online-room controls relevant to that path. Card states reuse Studio's
  sage and lilac palette and the primary setup action remains visible.
- Kept the shared game sheet frame usable for secondary read/manage sheets by
  making its sticky footer optional; primary setup sheets still supply an
  explicit fixed action row.
- Started the Dare X individual redesign by removing the duplicate page title
  and always-visible online form from its gameplay card. The main surface now
  prioritizes the active player, current dare, attempt actions, and per-player
  history; online creation and joining are being consolidated into the setup
  flow where session decisions belong.
- Completed the Dare X sheet restructure. Local and Online are explicit setup
  paths; only active player fields render; dare source, custom prompt import,
  and room controls remain available without pushing the primary action below
  the viewport. Custom-dare management and player history now reuse the same
  fixed, scroll-safe sheet frame and history excludes inactive player slots.
- Reworked Rock Paper Scissors around its real solo loop: the selectable source
  images remain the primary interaction, the score and last-round comparison
  are compact, and the duplicate title/message blocks are gone. Online room
  creation and joining now live in a focused sticky-action sheet opened from
  the match toolbar instead of consuming permanent gameplay space.
- Reworked Wordle's pre-game and active-game states separately. Challenge
  selection is now a compact Daily/Random choice surface, online play uses a
  dedicated room sheet with an editable display name, and the puzzle itself is
  contained in a clear round shell without repeating the page title. Replaced
  the backspace text glyph with a labelled icon while preserving keyboard and
  reveal behavior.
- Kept Wordle's optional pre-game stats visually grouped with challenge
  selection and made the active round heading report the actual guesses
  remaining rather than a fixed value.
- Reworked Typing Speed as a wide, focused testing workspace. Test/History and
  duration controls now share one toolbar, four nested metric cards became one
  compact readable score band, and the typing passage is the strongest surface
  while existing timing, accuracy, save, reset, and history behavior remains
  intact.
- Reworked Chess around the actual local board instead of nested decorative
  cards. Status, last move, legal-move guidance, and board now form one match
  workspace; online table creation/joining moved into the shared room sheet and
  the duplicate Chess heading was removed. Chess rules and move validation are
  unchanged.
- Reworked Ludo as the online-only room experience it actually supports. The
  non-functional decorative board was removed; the page now clearly separates
  creating a room from joining one, exposes a real display name, explains
  player and finish-target choices, and preserves the existing room/session
  behavior.
- Gave Ludo's player-count and finish-target selections explicit selected-state
  contrast on the coral room surface instead of relying on a variant that was
  visually overridden by the local palette.
- Added a shared online-room header contract for all multiplayer routes. It
  centralizes the game identity, live status, room code, back path, and invite
  action while continuing to source icons and names from the canonical game
  presentation registry.
- Migrated Tic Tac Toe, Memory Match, and Dare X online rooms to the shared
  room header while retaining their existing realtime refresh, join, move,
  board, player, and invite-detail behavior.
- Migrated Rock Paper Scissors, Chess, Ludo, and Wordle online rooms to the same
  identity/status/invite header. Their game-specific realtime actions, boards,
  challenge layouts, participants, and existing side panels remain independent.
- Migrated Connect Four's distinct single-card online room to the shared header
  as well, extending the header with an optional action slot so its manual
  refresh control is preserved alongside the canonical room code and invite.
- Removed the extra route-level padding from every online room and applied the
  same 1280-pixel content boundary used by the individual game detail pages,
  avoiding doubled whitespace inside the protected Studio shell.
- Added a copy-local Vitest configuration and test script so Studio Copy tests
  resolve `@/` to the copy instead of silently exercising `apps/studio` through
  the repository's production-app alias. Added focused coverage proving the
  canonical presentation registry covers every game and supplies complete
  Studio surface tokens.
- Fixed a browser-discovered Typing Speed hydration mismatch: its first passage
  is now deterministic across server and client rendering, while the existing
  New text/reset action still selects a random passage afterward.
- Corrected a catalog capability mismatch exposed by the individual-game pass:
  Tic Tac Toe already has a working online room route and setup path, so it is
  now marked Online in the canonical registry and appears in the Online filter.
  Its canonical description now names online play and focused tests cover that
  capability explicitly.
- Removed invented Local labels from Rock Paper Scissors and Ludo. Their real
  interfaces support computer-versus-player plus online, and online-only play,
  respectively, so the Game Hub and individual-page heroes now advertise only
  capabilities users can actually launch.
- Passed only the current active-player set into Dare X setup and history
  presentation while preserving the hook's full internal player pool, so
  increasing the selected count still reveals the next stored player safely;
  removed the now-unused full-player binding from the page component.

## Boundaries

- This is a local design prototype and does not change production deployment,
  DNS, Supabase, authentication, or environment configuration.
- The copy may continue using the same shared packages as Studio because the
  requested baseline is the real Studio application's existing behavior.
- Validation remains local-only: static checks, HTTP smoke checks, and focused
  browser QA against the local Studio copy. No deployment or remote environment
  validation is part of this prototype slice.

## Verification

- Shipping preflight confirmed the worktree branch contains the latest fetched
  `origin/main`, GitHub CLI is active on the personal `goyal1510` account, and
  the repository-local personal Git identity/SSH route are correct. The final
  `pnpm --filter studio-copy build` compiled all 156 routes successfully.
- The staged diff check found inherited trailing whitespace in seven copied
  files. A targeted whitespace-only cleanup resolved it without running a broad
  formatter or changing application behavior.
- Studio Copy's own `pnpm --filter studio-copy test` now runs against the copy's
  alias and passed 9 test files / 28 tests in the final batch, including the
  corrected game capabilities and complete presentation registry coverage.
- `pnpm --filter studio-copy lint` passed with zero warnings and
  `pnpm --filter studio-copy check-types` passed after generating all copied
  Next.js route types for the complete individual-games and room-header slice.
- `pnpm test -- apps/studio-copy/src/lib/config/studio-surfaces.test.ts
apps/studio-copy/src/lib/config/studio-inventory.test.ts` passed the complete
  local Vitest suite: 28 files and 181 tests.
- `pnpm --filter studio-copy lint` passed with zero warnings and
  `pnpm --filter studio-copy check-types` passed after Next.js route type
  generation for this naming, Search, Products, and Tech Tools slice.
- Browser QA at 1280 × 720 verified Weather and GitHub Stats in Discover;
  Search Studio content and its `/tools` destination; Product and Tech Tools
  URL-backed filters; context-preserving breadcrumb returns; the absence of
  duplicate detail return links; and zero retained scroll offset after catalog
  navigation. The comparison history and evidence paths are recorded in
  `design-qa.md`, whose final result is passed.
- A second 1280 × 720 Product-versus-Tool comparison validated the revised
  color-coded Tool hero and the removal of its redundant category chip. The
  functional Token Generator controls remained visible and unchanged below it.
- `pnpm test -- apps/studio-copy/src/lib/games/catalog.test.ts` passed the full
  local Vitest suite (28 files, 181 tests); Studio Copy lint and TypeScript
  checks also passed after the Game Hub rebuild.
- Browser QA at 1280 × 720 verified the rebuilt Hub hierarchy, truthful
  capability labels, all nine individual game pages, representative Local and
  Online setup paths, sticky sheet actions, and the absence of horizontal
  overflow. The final Online filter returned eight launchable games and updated
  the URL to `/games?play=online`.
- Browser comparison evidence for the overloaded Tic Tac Toe and Dare X sheets
  is recorded beside their final setup-path implementations in `design-qa.md`.
  The final browser log contained development/HMR messages only and no
  application or hydration error.
- `pnpm --filter studio-copy lint` passed with zero warnings, including after
  compacting the Products catalog header and toolbar.
- `pnpm --filter studio-copy check-types` passed after Next.js route type
  generation, including after the Products catalog density change.
- `pnpm --filter studio-copy build` compiled successfully and generated all 156
  copied Studio routes, including existing API, auth, workspace, game, tool,
  product, and account routes.
- Local HTTP smoke checks returned `200` for `/`, `/products`,
  `/products/tech-tools`, and `/tools?q=json` on port `3004` with no server
  errors after the ignored environment file was loaded.
- `git diff --check` passed, the lockfile contains the `apps/studio-copy`
  importer, and `apps/studio`, `apps/portfolio`, `apps/admin`, and shared
  packages remain byte-for-byte unchanged from `origin/main`.
- No deployment or remote browser validation was performed; the user will own
  later manual production review.

## Rollback

- Delete `apps/studio-copy`, remove its lockfile importer, and remove this
  session entry. Existing applications remain unaffected.

## Shipping and hosted rollout

- The standalone Studio Copy and its local design proof are being shipped in a
  dedicated PR; no current application is replaced or repointed by that PR.
- Vercel's current Portfolio, Studio, Admin, and Auth Production deployments
  were inspected and were Ready before rollout. Portfolio remained untouched.
- Studio, Admin, and Auth now use the shared-session compatibility mode across
  Development, Preview, and Production. Studio and Admin also hand new login
  entry traffic to canonical Auth across those three targets. Read-back checks
  passed for all nine project/target combinations and confirmed the optional
  local cookie-domain override is absent from hosted environments.
- Same-SHA redeploy attempts were canceled by the approved ignored-build rule,
  so fresh forced builds were uploaded from a clean detached worktree pinned to
  the exact current `origin/main` commit. Auth, Studio, and Admin all reached
  Ready and their canonical domains were assigned to the new deployments.
- Anonymous HTTP checks verified Auth redirects its root to `/login`, Studio
  preserves `/games` in its Auth `return_to`, and Admin preserves `/users`.
  Credential login, cross-subdomain session promotion, Admin authorization,
  and logout remain manual controlled-production acceptance checks.
- Immediate rollback remains changing Studio/Admin/Auth session mode to the
  legacy setting and Studio/Admin entry ownership to the legacy owner, followed
  by fresh deployments. No secret or environment-file content is recorded.
