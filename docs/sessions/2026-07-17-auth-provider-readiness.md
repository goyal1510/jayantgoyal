# Auth Provider Readiness

## Scope

- Continue setup work after the standalone Auth source boundary merged.
- Keep Portfolio, Studio, and Admin as the live authentication owners.
- Do not perform browser, Preview, Production, or post-deployment functional
  testing; deployed acceptance remains user-owned.

## Provider changes

- Created `jayantgoyal-auth` (`prj_aioHlnbOo2PcCbTjjDHUwQon2iDD`) under the
  verified personal Vercel team and linked it to `goyal1510/jayantgoyal`.
- Set root `apps/auth`, Next.js, build `pnpm --filter auth build`, install
  `pnpm install`, Node.js 24.x, and the `main` production branch.
- Added the minimum public Auth environment inventory across Development,
  Preview, and Production. Preview deliberately has no fixed Site URL; no
  service-role or unrelated secret was copied.
- Assigned `auth.jayantgoyal.com` to the Auth project. The required Cloudflare
  DNS record is not present, and the available Wrangler OAuth grant has zone
  read but not DNS-record write permission.
- Verified all nine existing app/environment public Supabase inventories point
  to `jayantgoyal` (`orwfvyditlguqvxvztkw`) and match exactly.
- Applied a scoped hosted Supabase Auth patch: add the Auth generated Preview
  callback family, enable TOTP enrollment/verification, and enable authenticated
  manual identity linking. The Site URL remains `https://jayantgoyal.com`.

## Verification and residual gates

- Vercel project settings and environment names/targets were read back without
  displaying secret values.
- Hosted Supabase settings were read back and confirm the intended four fields;
  Google and email recovery configuration were already valid.
- A direct Git-source deployment request and the PR's Git Preview check were
  both rejected by Vercel's account-wide daily deployment/build rate limit
  before an Auth deployment was created. Vercel reports retry in 24 hours; no
  application failure or deployment identifier exists yet.
- Verified the project-level ignored-build command for all four platform
  projects. Portfolio and Auth now join the existing Studio/Admin setup, using
  the same detector with their own exact app directories.
- Remaining: Cloudflare DNS, first Git deployment status, user-owned Auth flow
  acceptance, controlled Production dark launch, rollback capture, and
  observation.
