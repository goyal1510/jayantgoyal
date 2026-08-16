# Portfolio

Public professional and editorial application for Jayant.

- Production: [jayantgoyal.com](https://jayantgoyal.com)
- Package/filter: `portfolio`
- Local port: `3000`
- Access: public

## Ownership

Portfolio owns:

- The public profile, About, Work, Writing, Resume, and Contact experiences.
- Public Portfolio metadata, structured data, sitemap, and robots policy.
- Read-only rendering of the canonical Portfolio CMS contract.
- Contact delivery and persistent rate limiting.
- GitHub contribution/code-statistics presentation.
- Google Drive Resume export with a checked-in PDF fallback.

Admin edits the same Portfolio and Writing data. Studio redirects historical
professional-content URLs to Portfolio.

## Routes

| Route                       | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `/`                         | Editorial home composed from visible CMS sections     |
| `/about`                    | About, education, skills, experience, and credentials |
| `/work`                     | Published work and case studies                       |
| `/work/[slug]`              | Published case-study detail                           |
| `/writing`                  | Published Writing index                               |
| `/writing/[slug]`           | Published article                                     |
| `/resume`                   | Embedded Resume experience                            |
| `/contact`                  | Public contact form and details                       |
| `/api/contact`              | Rate-limited Resend delivery                          |
| `/api/resume`               | Google Drive PDF export with static fallback          |
| `/api/github-contributions` | Cached contribution calendar data                     |
| `/api/github-loc`           | Cached GitHub language/code statistics                |

Compatibility redirects in `next.config.ts` preserve historical Portfolio,
Studio, Writing, Auth, and project URLs.

## Data

Portfolio reads public data through the Supabase anonymous key and RLS:

- `portfolio`: hero, about, education, experience, skills, work, credentials,
  contact, navigation, and section presentation.
- `jg_app.writing_posts`: published and visible Writing posts.

`src/lib/portfolio/editorial-server.ts` is the canonical loader and mapper.
Missing core records and query failures surface as errors; there is no duplicated
static content fallback.

Shared contracts come from `@repo/portfolio-data`. Portfolio also consumes
`@repo/brand`, `@repo/platform`, `@repo/seo`, and `@repo/github`. It deliberately
does not consume the shared `@repo/ui` product application shell.

## Environment

Use `.env.example` as the contract.

- Required: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `CONTACT_RATE_LIMIT_SECRET`.
- Optional integrations: `GITHUB_TOKEN`, `RESEND_API_KEY`,
  `RESEND_FROM_EMAIL`, and Google Resume service-account variables.
- `NEXT_PUBLIC_STUDIO_URL` controls compatibility destinations.

Portfolio has no `SUPABASE_SERVICE_ROLE_KEY`.

## Development

```bash
pnpm --filter portfolio dev
pnpm --filter portfolio lint
pnpm --filter portfolio check-types
pnpm --filter portfolio build
pnpm test
```

When adding a public page, update metadata, canonical/Open Graph data, sitemap
coverage, robots/indexability behavior, and relevant compatibility redirects.
