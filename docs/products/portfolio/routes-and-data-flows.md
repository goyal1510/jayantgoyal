# Portfolio routes and data flows

This page catalogs every implemented Portfolio page and route handler. All
Portfolio pages are public and indexable according to their page metadata and
the Portfolio sitemap/robots rules.

## Page routes

| Route             | Responsibility                                                   | Primary runtime source                   |
| ----------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| `/`               | Full editorial home                                              | `getEditorialPortfolioData()`            |
| `/about`          | Detailed profile, experience, skill, and credential narrative    | Editorial data                           |
| `/contact`        | Public enquiry interface                                         | Shell/contact CMS data                   |
| `/resume`         | Resume presentation and PDF entry                                | Shell data and `/api/resume`             |
| `/analytics`      | Aggregate traffic, geography, caching, and real-user performance | CMS `analytics` section plus Cloudflare |
| `/work`           | Visible work catalog                                             | Editorial work records                   |
| `/work/[slug]`    | Published case study                                             | Work slug and publication guard          |
| `/writing`        | Published Writing index                                          | `portfolio.writing_posts`                |
| `/writing/[slug]` | Published article                                                | Writing slug query and Markdown renderer |

The app also owns `layout.tsx`, `error.tsx`, `not-found.tsx`, `manifest.ts`,
`robots.txt`, and `sitemap.ts` for global presentation and discoverability.

The root `src/proxy.ts` rewrites HTML page requests with `Accept: text/markdown`
to `/llms.txt`. Direct catalog, robots, API, and `auth.md` requests stay on
their own handlers. The editorial layout registers WebMCP navigation tools when
the browser exposes `navigator.modelContext`.

The root layout renders one shared footer after the page content on every
Portfolio page, including Contact and article/case-study detail pages. It uses
the cached shell profile for the copyright name, location, social links, and
hydrated email link. The footer stays at the bottom of short pages and follows
longer content in normal document flow; the Contact section owns only the
contact details and enquiry form.

The shared footer retains the original Contact footer's font size, icon sizes,
copyright, location, and circular social/email links. It uses a warm beige
surface with dark text and borders, a thin divider flush with the top edge,
and 8px above and below the content row. At 760px and below, the location is
hidden and the copyright and icons share one row. Contact owns the spacing
below its enquiry form; that spacing does not add empty space to the shared
footer on other pages.

## Route handlers

| Method and route                | Input and authorization                  | Operation                                                                               | Failure/degradation                       |
| ------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------- |
| `POST /api/contact`             | Public JSON; hashed client IP rate limit | Validate enquiry, load CMS recipient, send with Resend                                  | `400`, `429`, `500`, or fail-closed `503` |
| `GET /api/github-contributions` | Valid GitHub username and period         | Fetch contribution calendar with server token and bounded cache                         | Non-sensitive unavailable payload         |
| `GET /api/github-loc`           | Valid GitHub username                    | Fetch language/code statistics through `@jayantgoyal/github`                            | `404` or `503`, no provider details       |
| `GET /api/resume`               | Public request                           | Export Google document as PDF                                                           | Checked-in PDF, CMS URL, then safe error  |
| `GET /llms.txt`                 | Public request; `Accept: text/markdown` uses markdown type | Generate current Portfolio discovery text from shared identity and URL contracts | Markdown or plain-text response           |
| `GET /auth.md`                  | Public request                           | Explain that this origin is public and Auth owns human sign-in                  | Markdown response                         |
| `GET /.well-known/api-catalog`  | Public request                           | RFC 9727 linkset of public Portfolio handlers                                   | `application/linkset+json`                |
| `GET /.well-known/ai-catalog.json` | Public request                         | ARD capability catalog for llms.txt, API catalog, and auth.md                   | JSON with CORS `*`                        |
| `GET /.well-known/oauth-protected-resource` | Public request              | RFC 9728 metadata pointing at the suite Auth issuer                             | JSON with CORS `*`                        |
| `GET /robots.txt`               | Public request                           | Indexing rules, Content Signals, and Agentmap                                   | Plain-text response                       |

## Editorial read flow

```text
Server page
  → cached editorial or shell loader
  → anonymous Supabase server client
  → parallel explicit-column queries in portfolio schema
  → contract readers for JSON/array fields
  → editorial view model
  → server-rendered Portfolio components
```

`getEditorialPortfolioData()` loads the complete home/About/Work contract.
`getPortfolioShellData()` loads the smaller profile/navigation/section subset
needed by shared layout and Resume behavior. Both use React request caching and
Next data caching with the `portfolio-content` tag and a 60-second revalidation
window.

## Writing read flow

```text
Writing page
  → Writing query helper
  → portfolio.writing_posts
  → published + visible filter
  → Portfolio Writing contract
  → safe Markdown/remark rendering
```

Writing resides with its Portfolio owner. Admin's Writing workspace is the
capability-authorized editor. Publishing or unpublishing invalidates public
Writing paths.

## Contact flow

1. Derive the originating IP from trusted deployment headers.
2. Hash it with `CONTACT_RATE_LIMIT_SECRET`; raw IP is not stored as the key.
3. Call `portfolio.consume_contact_rate_limit`.
4. Fail closed if configuration or the database limiter is unavailable.
5. Normalize length-bounded fields and validate stage/timeline options and
   email shape.
6. Load the canonical recipient from Portfolio contact data.
7. Escape HTML and send text plus HTML through Resend.

The database rate limiter is an abuse boundary, not analytics. Delivery logs
must not include secrets or unnecessary enquiry contents.

## Resume flow

When all Google service-account variables exist, the Node.js route creates a
short-lived signed OAuth assertion, obtains a Drive read-only token, and
exports the configured document as PDF. The response is cached at the edge for
five minutes with stale revalidation.

If provider configuration or export fails, the route serves
`public/documents/Jayant_Resume.pdf`. If that file is unavailable, it follows a
different CMS-configured resume location. It returns a safe unavailable error
instead of redirecting back to itself.

## GitHub flow

Both GitHub handlers validate the public username before provider access. The
in-process response cache has a one-hour TTL and a 25-entry bound; public edge
cache headers allow stale revalidation. `GITHUB_TOKEN` stays server-only.

## Cloudflare analytics flow

The public `/analytics` page accepts only the fixed `24h`, `7d`, and `30d`
range options and is exposed through the shared desktop and mobile Portfolio
navigation. Portfolio queries Cloudflare from server-only modules and caches
each fixed range for 15 minutes. A zone-scoped Analytics Read token supplies
edge traffic, cache, bandwidth, and country request aggregates. A separate,
least-privilege Account Analytics Read token supplies Web Analytics real-user
measurements filtered to the canonical `jayantgoyal.com` host. The 24-hour view
uses complete hourly groups; longer views use daily groups to stay within
dataset limits.

Only aggregate visitors, requests, bytes, cached bytes, country totals, threat
request counts, Web Vital rating distributions, and P75 LCP, INP, CLS, FCP, and
TTFB measurements reach client chart components. The traffic dashboard separates
request bars and a visitor area into aligned, single-scale plots and compares
cached with uncached delivery in a stacked area. The map exposes aggregate hover
summaries and a single animated country inspector without a competing
ranked-country list;
country-level Web Vitals appear only after ten measured visits. The experience
explorer explains P75, applies the published good/poor thresholds, and lets the
visitor select one metric trend at a time.

Countries with fewer than five requests in the selected range are withheld.
Provider credentials, IP addresses, query strings, URLs, and request-level
records are never returned to the browser. Edge failure renders a safe page
fallback; missing or unavailable RUM configuration degrades only the experience
panel while keeping traffic analytics visible. Shared editorial loaders retain
their 60-second data cache, while the Resume's embedded PDF loads lazily so it
does not compete with above-the-fold content.

## Admin write propagation

```text
Admin editor
  → capability-authorized Admin API
  → Portfolio contract validation
  → portfolio table / portfolio.writing_posts / portfolio-assets
  → public path and tag revalidation
  → next Portfolio request reads canonical data
```

Any change to selected columns, JSON shapes, section keys, asset kinds, or
publication semantics must update `@jayantgoyal/portfolio-contracts`, the public
loader, Admin validation/editor behavior, tests, and database constraints in
one coherent change.
