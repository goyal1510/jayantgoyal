# Studio

Studio is Jayant's product catalog, browser-utility collection, game hub, and
personal workspace at
[studio.jayantgoyal.com](https://studio.jayantgoyal.com). The current client is
`apps/studio/web`, workspace `@jayantgoyal/studio-web`, running locally on port 3001.

## Product boundary

Studio owns four kinds of experience:

- public discovery of implemented products and capabilities;
- public browser utilities, weather, GitHub statistics, and calculator builder;
- account-owned productivity workspaces;
- local/computer and realtime room-based games.

It does not own credential entry, Portfolio editorial content, or access
administration. Auth owns account entry/security. Portfolio owns Writing even
when Studio links to it. No commerce surface is currently implemented.

## Implemented surface

The current web route tree contains 125 pages and 40 route handlers. The public
utility collection has 87 tool pages in 11 categories. Game Hub has nine games,
eight with online-room support. Exact current inventories are documented in:

- [capability catalog](capability-catalog.md): products, tools, games, and
  account workspaces;
- [routes and APIs](routes-and-apis.md): every page/handler, access class, and
  grouped API behavior.

Runtime registries remain executable sources of truth:

- `src/lib/config/studio-inventory.ts`: product cards and detail pages;
- `src/lib/config/studio-surfaces.ts`: named product surfaces;
- `src/lib/config/hub-config.ts`: application navigation;
- `src/lib/games/config.ts`: game modes and online readiness;
- `src/lib/tools/tools.ts`: aggregated utility registry.

Tests assert alignment among inventory, routes, navigation, SEO content, and
presentation. Documentation explains the meaning and flow; it does not replace
those runtime registries.

## Access model

Public pages are classified both in `src/proxy.ts` and
`src/components/auth/auth-gate.tsx`. Public catalog/tool routes render without
a full identity lookup when possible. Account workspaces render a sign-in CTA
or require a verified session. APIs have a separate policy: zero-cost public,
auth-aware public, or protected.

For authenticated requests the proxy:

1. strips client-supplied internal headers;
2. resolves the shared session cookie and calls Supabase `getUser()`;
3. evaluates current Studio product membership;
4. checks TOTP assurance when a factor exists;
5. confines recovery-mode sessions to reset behavior;
6. checks versioned terms acceptance for protected APIs;
7. forwards verified user headers and refreshed cookies.

Auth owns the resulting login, forgot-password, and MFA UI. Studio aliases
redirect there with a validated return target.

## Capability architecture

Public utilities are mostly browser-local and retain their UI/logic under the
Studio client. Tool favorites and recently used history are persisted for
signed-in users. Weather uses the browser-visible OpenWeather key. GitHub
statistics use server routes and the shared GitHub package.

Account workspaces use Studio-owned API routes and capability-aware `studio`
RLS:

- Activity Tracker: activities, entries, and computed statistics;
- Currency Calculator: calculations and denomination rows;
- File Manager: metadata/RPCs plus private Storage objects and signed uploads;
- Sync Scratchpad: private entries and Realtime updates;
- Game Hub: sessions, participants, ordered moves, results, and typing scores;
- Tool usage: favorites and bounded recent history.

Calculator Builder currently persists browser state through Zustand rather
than the database. This local state does not justify a foundation package.

## Dependencies

Studio consumes `@jayantgoyal/web-auth`, `@jayantgoyal/web-brand`, `@jayantgoyal/web-urls`,
`@jayantgoyal/web-seo`, `@jayantgoyal/web-ui`, `@jayantgoyal/github`, shared Tailwind, and
tooling configuration. Studio product rules, game engines, file operations,
weather, calculators, and tool metadata remain inside Studio because another
product does not consume those domains.

## Environment and security

`apps/studio/web/.env.example` owns Supabase, shared Auth/session, application
origins, Wordle seed, OpenWeather, and GitHub variables. The service-role key is
server-only and used by independently authorized account deletion and online
game coordination routes. Those handlers authenticate the current user and
validate room membership/state before elevated access; ordinary workspace
operations use the user's RLS-bound session.

Private files use signed upload/complete flows and the `studio-files` bucket.
Online game actions validate session membership, turn/order rules, and current
state before the database RPC records an action. Provider secrets and the
Wordle seed secret must never reach client bundles.

## Change checklist

For a public surface, reconcile the product/surface/tool registry, route page,
navigation, command palette, proxy, AuthGate, metadata, JSON-LD/breadcrumb,
sitemap, API cost class, and tests. For an account capability, also update RLS,
API authorization, data catalog, failure behavior, and operational signals.
