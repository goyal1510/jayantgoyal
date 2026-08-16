# Portfolio

Portfolio is Jayant's public professional and editorial product at
[jayantgoyal.com](https://jayantgoyal.com). The implemented client is
`apps/portfolio/web`, workspace `@jayant/portfolio-web`, running locally on
port 3000.

## Product boundary

Portfolio owns the professional narrative presented to public visitors:

- home and section-based editorial presentation;
- About, education, experience, skills, credentials, and contact information;
- Work catalog and publishable case studies;
- Writing index and article rendering;
- Resume presentation and PDF delivery;
- contact enquiry validation, rate limiting, and email delivery;
- public GitHub contribution and code-statistic presentation;
- public SEO, structured data, sitemap, robots, and web manifest behavior.

Portfolio does not own account entry, private Studio workspaces, user-role
administration, or deployment operations. Admin edits Portfolio data but does
not become the owner of the Portfolio contract.

## Current web surface

The client has eight public pages and four public route handlers. The complete
route behavior and request flows are in [routes and data
flows](routes-and-data-flows.md).

| Area           | Routes                                         | Source of content                            |
| -------------- | ---------------------------------------------- | -------------------------------------------- |
| Editorial home | `/`                                            | Full Portfolio editorial loader              |
| About          | `/about`                                       | CMS profile, experience, skills, credentials |
| Work           | `/work`, `/work/[slug]`                        | Visible work and published case studies      |
| Writing        | `/writing`, `/writing/[slug]`                  | Published `jg_app.writing_posts`             |
| Resume         | `/resume`, `/api/resume`                       | CMS shell plus Google/static PDF delivery    |
| Contact        | `/contact`, `/api/contact`                     | CMS contact data plus Resend delivery        |
| GitHub         | `/api/github-contributions`, `/api/github-loc` | GitHub provider APIs with caching            |

## Internal architecture

Server components load canonical data through
`src/lib/portfolio/editorial-server.ts` and Writing query helpers. The loader
selects explicit public columns, maps database records into editorial view
models, and is cached with the `portfolio-content` tag. Core `hero`, `about`,
and `contact` records are required; query failures and missing core records
surface as errors rather than using duplicated static content.

Portfolio owns an editorial component and CSS system under
`src/components/editorial` and `src/app/editorial`. This is intentionally not
the same application shell used by Studio, Admin, and Auth. Shared identity,
URLs, metadata helpers, and genuinely shared providers remain packages.

## Contracts and dependencies

`@jayant/portfolio-contracts` lives at `apps/portfolio/contracts` because the
public Portfolio reader and Admin editor both consume the same table columns,
guards, section keys, Writing shape, asset rules, and presentation contract.
It remains a Portfolio-owned contract.

Portfolio also consumes:

- `@jayant/web-brand` for public identity and deployable web assets;
- `@jayant/web-urls` for canonical application origins;
- `@jayant/web-seo` for metadata and indexability helpers;
- `@jayant/github` for shared server-side GitHub statistics;
- shared Tailwind, ESLint, and TypeScript configuration.

It deliberately does not consume `@jayant/web-auth`, `@jayant/web-ui`, or a
Supabase service-role client.

## Data ownership

Portfolio reads `portfolio.*` CMS tables and `jg_app.writing_posts` using the
anonymous Supabase key and RLS. Admin performs authorized writes to the same
contract and public `portfolio-assets` bucket. `portfolio.contact_rate_limits`
is an operational table used only through its database function.

The detailed table inventory and policies are in the [schema
catalog](../../shared-systems/data/schema-catalog.md).

## Environment and providers

`apps/portfolio/web/.env.example` is the client contract. It covers canonical
site origins, Supabase anonymous access, contact rate-limit hashing, GitHub,
Resend, and optional Google Resume export. Exact exposure, requirement, and
failure behavior is listed in the [environment variable
reference](../../reference/environment-variables.md).

Portfolio must never receive or use `SUPABASE_SERVICE_ROLE_KEY`. Contact and
provider credentials remain in server-only modules.

## Failure behavior

- Canonical CMS query or required-record failure renders an application error.
- Contact rate-limit configuration or database enforcement failure returns
  unavailable; it does not fail open.
- Invalid contact input returns a safe validation error; Resend failure does not
  expose provider details.
- Resume export falls back to the checked-in PDF, then a different CMS-configured
  resume URL, before returning unavailable.
- GitHub endpoints bound cache size and return unavailable responses when the
  provider fails.

## Change checklist

For a public route or editorial change, update metadata, canonical/Open Graph
data, sitemap coverage, structured data, robots/indexability behavior, and the
route catalog. For CMS changes, update the Portfolio contract, Admin editor,
migration/schema snapshots, validation, loader mapping, and both products'
documentation together.
