# Local development

## Requirements

- Node.js 22 or newer
- pnpm 10.32.1, pinned by the root package manifest
- Supabase CLI for local or linked database tasks
- Vercel CLI through the repository-local dependency for deployment linking

Install once at the repository root:

```bash
pnpm install
```

Copy only the environment contract for the client you are running:

```bash
cp apps/portfolio/web/.env.example apps/portfolio/web/.env.local
cp apps/studio/web/.env.example apps/studio/web/.env.local
cp apps/admin/web/.env.example apps/admin/web/.env.local
cp apps/auth/web/.env.example apps/auth/web/.env.local
```

Each `.env.example` is authoritative for that client. Do not give every client
the union of all secrets. Turbo build hashing is likewise owned by each
client's `turbo.json`.

## Run clients

```bash
pnpm dev
pnpm --filter @jayantgoyal/portfolio-web dev  # http://localhost:3000
pnpm --filter @jayantgoyal/studio-web dev     # http://localhost:3001
pnpm --filter @jayantgoyal/admin-web dev      # http://localhost:3002
pnpm --filter @jayantgoyal/auth-web dev       # http://localhost:3003
```

## Vercel environment pull

Link the exact client project from its client directory before pulling local
environment values:

```bash
cd apps/portfolio/web && pnpm exec vercel link --yes --project jayantgoyal-portfolio && pnpm exec vercel env pull .env.local
cd apps/studio/web && pnpm exec vercel link --yes --project jayantgoyal-studio && pnpm exec vercel env pull .env.local
cd apps/admin/web && pnpm exec vercel link --yes --project jayantgoyal-admin && pnpm exec vercel env pull .env.local
cd apps/auth/web && pnpm exec vercel link --yes --project jayantgoyal-auth && pnpm exec vercel env pull .env.local
```

Do not commit `.vercel` or local environment files.

## Adding code

- Add an implemented client at `apps/<product>/<platform>`.
- Keep product contracts at `apps/<product>/contracts` when another client or
  an administrative product genuinely consumes them.
- Add provider adapters under `packages/integrations` only for stable reuse.
- Add web-only contracts under `packages/web`.
- Update the relevant central documentation page in the same change.

Run the ownership and quality gates described in [testing.md](testing.md) before
shipping.
