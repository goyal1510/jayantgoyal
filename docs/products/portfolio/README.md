# Portfolio

Portfolio is the public professional and editorial product at
[jayantgoyal.com](https://jayantgoyal.com). Its web client lives at
`apps/portfolio/web` and runs locally on port 3000.

## Ownership

Portfolio owns the public home, About, Work, Writing, Resume, and Contact
experiences; public metadata and structured data; its sitemap and robots policy;
contact delivery; Resume export; and public GitHub activity presentation.

Primary routes are `/`, `/about`, `/work`, `/work/[slug]`, `/writing`,
`/writing/[slug]`, `/resume`, and `/contact`. Public API routes provide contact
delivery, Resume export, and cached GitHub contribution/code statistics.

## Data

Portfolio reads canonical CMS records through the Supabase anonymous key and
RLS:

- `portfolio` contains hero, about, education, experience, skills, work,
  credentials, contact, navigation, and section presentation.
- `jg_app.writing_posts` contains published and visible Writing content.

`apps/portfolio/web/src/lib/portfolio/editorial-server.ts` is the canonical
loader and mapper. Missing core records and query failures surface as errors;
there is no duplicate static editorial fallback.

`@jayant/portfolio-contracts` is colocated at `apps/portfolio/contracts` and is
shared with Admin. Portfolio also consumes the web brand, URL, SEO, and GitHub
packages. It intentionally does not use the shared application shell.

## Environment and security

The contract is `apps/portfolio/web/.env.example`. Supabase URL/anonymous key,
site URL, and contact rate-limit secret are required. GitHub, Resend, and Google
Resume variables are optional integrations. Portfolio must never receive or
use `SUPABASE_SERVICE_ROLE_KEY`.

Public changes must preserve metadata, canonical/Open Graph data, sitemap
coverage, robots/indexability behavior, and compatibility redirects.
