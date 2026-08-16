# Admin

Private administration application for Portfolio content, accounts, and Vercel
operations.

- Production: [admin.jayantgoyal.com](https://admin.jayantgoyal.com)
- Package/filter: `admin`
- Local port: `3002`
- Access: `admin` or `super_admin`

## Active Workspaces

| Workspace          | Route                   | Ownership                                       |
| ------------------ | ----------------------- | ----------------------------------------------- |
| Portfolio overview | `/portfolio`            | Editorial state and workspace entry points      |
| Home               | `/portfolio/home`       | Identity, hero, Resume, and home presentation   |
| About              | `/portfolio/about`      | About content and education                     |
| Skills             | `/portfolio/skills`     | Skill categories, proficiency, and evidence     |
| Experience         | `/portfolio/experience` | Experience and credentials                      |
| Activity           | `/portfolio/activity`   | GitHub identity and activity presentation       |
| Work               | `/portfolio/work`       | Work records, media, and case studies           |
| Writing            | `/portfolio/writing`    | Writing posts and article/list presentation     |
| Contact            | `/portfolio/contact`    | Contact details, social links, and presentation |
| Users              | `/users`                | Profile and role administration (`super_admin`) |
| Deployments        | `/deployments`          | Vercel deployment operations (`super_admin`)    |

Older granular Portfolio URLs remain as compatibility redirects in
`src/lib/config/portfolio-route-map.ts`; they are not separate active
workspaces.

## Access Control

`src/proxy.ts` authenticates requests, enforces enrolled MFA, loads the
`jg_account.profiles` role, and rejects non-admin users. The protected layout
rechecks authentication and role before rendering.

- `admin`: Portfolio editing.
- `super_admin`: Portfolio editing, user administration, and deployments.

Every service-role route must authorize the caller before bypassing RLS.

## Data and APIs

Admin edits the same contracts consumed by public applications:

- `portfolio` tables through `/api/portfolio/[table]`.
- `jg_app.writing_posts` through the Writing workspace.
- Section copy and navigation transactionally through
  `/api/portfolio/section-presentation`.
- Public media through `/api/portfolio/assets` and the `portfolio-assets`
  bucket.
- Account profiles through `/api/users`.
- Vercel deployments through `/api/vercel/deployments/*`.

`@repo/portfolio-data` owns the shared Portfolio/Admin runtime and type
contracts. `src/lib/portfolio-workspace.ts` composes database records into the
eight active editorial workspaces.

## Environment

Use `.env.example` as the contract. Admin requires:

- Supabase URL, anonymous key, and server-only service-role key.
- Cross-application Auth session, cookie, owner, and origin settings.
- Vercel token, team ID, Studio project ID, and Admin project ID.

Never expose service-role or Vercel credentials to client components.

## Development

```bash
pnpm --filter admin dev
pnpm --filter admin lint
pnpm --filter admin check-types
pnpm --filter admin build
pnpm test
```

Admin is intentionally `noindex`. Portfolio CMS writes must preserve shared
validation, revalidate affected public routes, and remain compatible with the
public Portfolio read contract.
