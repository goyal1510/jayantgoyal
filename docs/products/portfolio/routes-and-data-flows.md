# Portfolio routes and data flows

This page catalogs every implemented Portfolio page and route handler. All
Portfolio pages are public and indexable according to their page metadata and
the Portfolio sitemap/robots rules.

## Page routes

| Route             | Responsibility                                                | Primary runtime source                   |
| ----------------- | ------------------------------------------------------------- | ---------------------------------------- |
| `/`               | Full editorial home                                           | `getEditorialPortfolioData()`            |
| `/about`          | Detailed profile, experience, skill, and credential narrative | Editorial data                           |
| `/contact`        | Public enquiry interface                                      | Shell/contact CMS data                   |
| `/resume`         | Resume presentation and PDF entry                             | Shell data and `/api/resume`             |
| `/work`           | Visible work catalog                                          | Editorial work records                   |
| `/work/[slug]`    | Published case study                                          | Work slug and publication guard          |
| `/writing`        | Published Writing index                                       | `jg_app.writing_posts`                   |
| `/writing/[slug]` | Published article                                             | Writing slug query and Markdown renderer |

The app also owns `layout.tsx`, `error.tsx`, `not-found.tsx`, `manifest.ts`,
`robots.ts`, and `sitemap.ts` for global presentation and discoverability.

## Route handlers

| Method and route                | Input and authorization                  | Operation                                                       | Failure/degradation                       |
| ------------------------------- | ---------------------------------------- | --------------------------------------------------------------- | ----------------------------------------- |
| `POST /api/contact`             | Public JSON; hashed client IP rate limit | Validate enquiry, load CMS recipient, send with Resend          | `400`, `429`, `500`, or fail-closed `503` |
| `GET /api/github-contributions` | Valid GitHub username and period         | Fetch contribution calendar with server token and bounded cache | Non-sensitive unavailable payload         |
| `GET /api/github-loc`           | Valid GitHub username                    | Fetch language/code statistics through `@jayant/github`         | `404` or `503`, no provider details       |
| `GET /api/resume`               | Public request                           | Export Google document as PDF                                   | Checked-in PDF, CMS URL, then safe error  |

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
  → jg_app.writing_posts
  → published + visible filter
  → Portfolio Writing contract
  → safe Markdown/remark rendering
```

Writing resides in `jg_app` for existing database ownership, but the product
capability is owned by Portfolio. Admin's Writing workspace is the authorized
editor. Publishing or unpublishing invalidates public Writing paths.

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

## Admin write propagation

```text
Admin editor
  → role-authorized Admin API
  → Portfolio contract validation
  → portfolio table / jg_app.writing_posts / portfolio-assets
  → public path and tag revalidation
  → next Portfolio request reads canonical data
```

Any change to selected columns, JSON shapes, section keys, asset kinds, or
publication semantics must update `@jayant/portfolio-contracts`, the public
loader, Admin validation/editor behavior, tests, and database constraints in
one coherent change.
