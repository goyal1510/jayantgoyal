# LinkedIn publishing operations

LinkedIn publishing is manual operator tooling under `scripts/linkedin`. The
private `portfolio.linkedin_posts` table is the durable content ledger for
planned, scheduled, published, replaced, deleted, and failed posts. The ignored
`.posts.json` file is only a machine-local recovery cache for LinkedIn post
indices and legacy backfill.

Scheduling records an intended publication time; it does not run an automatic
publisher. The operator still reviews and publishes each post deliberately.

## Tool ownership

| File                                    | Responsibility                                              |
| --------------------------------------- | ----------------------------------------------------------- |
| `scripts/linkedin/auth.mjs`             | Authorize LinkedIn and save an ignored member token         |
| `scripts/linkedin/database-auth.mjs`    | Sign in to Supabase as the operator and save a session      |
| `scripts/linkedin/post.mjs`             | Publish ad hoc or saved content and finalize its ledger row |
| `scripts/linkedin/manage.mjs`           | Plan, list, backfill, replace, or delete tracked posts      |
| `scripts/linkedin/.token.json`          | Ignored LinkedIn token and member identity                  |
| `scripts/linkedin/.supabase-token.json` | Ignored refreshable Supabase user session                   |
| `scripts/linkedin/.posts.json`          | Ignored LinkedIn recovery cache                             |
| `portfolio.linkedin_posts`              | Canonical private content and publication history           |

Never commit or print the ignored environment, token, session, or recovery
files. Database requests use a normal authenticated session. RLS checks the
existing `portfolio.content.read`, `portfolio.content.create`, and
`portfolio.content.update` capabilities; the scripts do not use a
service-role key.

## Configure and authenticate

Copy `scripts/linkedin/.env.example` to the ignored
`scripts/linkedin/.env` and provide the LinkedIn application client ID and
secret. The application must allow
`http://localhost:3333/callback` with the `openid`, `profile`, and
`w_member_social` scopes.

The Supabase project URL and anonymous key are loaded from the existing
`apps/admin/web/.env.local` file. They may instead be placed in the ignored
LinkedIn environment file.

Authenticate each provider from the repository root:

```bash
node scripts/linkedin/auth.mjs
node scripts/linkedin/database-auth.mjs
```

The database command prompts for the normal Supabase account email and password
without putting the password in arguments or files. Both token files are
written with owner-only permissions and refreshed or renewed independently.

## Build the content queue

Save a draft-like planned record:

```bash
node scripts/linkedin/manage.mjs plan "Post text" --topic "Build in public"
node scripts/linkedin/manage.mjs plan "Post text" --writing example
```

Save an intended publication time as an ISO timestamp:

```bash
node scripts/linkedin/manage.mjs plan "Post text" \
  --schedule 2026-08-24T10:00:00+05:30
```

List the planned, scheduled, and failed queue:

```bash
node scripts/linkedin/manage.mjs queue
```

Draft and schedule rows are not publicly readable. A topic is optional
organizing metadata; the full post text remains the source used at publication.

## Publish

Publish reviewed ad hoc content:

```bash
node scripts/linkedin/post.mjs "Post text"
node scripts/linkedin/post.mjs "Post text" --url https://jayantgoyal.com/writing/example
node scripts/linkedin/post.mjs --writing example
```

Publish an exact saved record from the queue:

```bash
node scripts/linkedin/post.mjs --record <ledger-uuid>
```

Before calling LinkedIn, the command creates or advances the ledger row to
`publishing`. A database failure therefore stops publication. After LinkedIn
returns the post URN, the command records the canonical post URL and publication
time, then keeps the local recovery cache aligned.

The command prints a preview but publishes immediately. Pass multiline content
as one argument and inspect the paragraph spacing before running it.

## Backfill and manage published posts

Import legacy `.posts.json` history into Supabase once after the migration is
available:

```bash
node scripts/linkedin/manage.mjs sync
```

The sync is repeatable. It upserts by LinkedIn post URN, preserves deleted and
replaced states, connects replacement records, and writes each database UUID
back to the local recovery cache.

List local published-history indices before a mutation:

```bash
node scripts/linkedin/manage.mjs list
```

Replace or delete a tracked post:

```bash
node scripts/linkedin/manage.mjs edit <index> "Replacement text"
node scripts/linkedin/manage.mjs edit <index> "Replacement text" --url https://jayantgoyal.com/writing/example
node scripts/linkedin/manage.mjs delete <index>
```

LinkedIn does not edit these posts in place. Replacement deletes the old post,
loses its reactions and comments, publishes a new post, and retains both ledger
records. Deletion marks the ledger row instead of physically removing it. A
LinkedIn `404` is treated as an already-completed deletion.

## Failure handling

- Missing or expired LinkedIn token: run `auth.mjs`.
- Missing or rejected Supabase session: run `database-auth.mjs`.
- Capability rejection: verify that the signed-in account has the matching
  Portfolio content capability; do not substitute a service-role key.
- LinkedIn publish failure: the ledger row becomes `failed` and can be
  reviewed or retried with `post.mjs --record <ledger-uuid>`.
- Database finalization failure after LinkedIn succeeds: the local recovery
  entry retains the returned URN; run `manage.mjs sync` to reconcile it.
- Replacement failure after deletion: the old ledger record stays deleted and
  the replacement record stays failed, preserving what happened.

After a write, inspect `manage.mjs list` or `manage.mjs queue` and open the
printed LinkedIn URL to verify the text, spacing, link, visibility, and author.
