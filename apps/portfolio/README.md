## Getting Started

From the repo root:

```bash
pnpm dev --filter jayant
```

The app runs on [http://localhost:3001](http://localhost:3001).

## UI Toolkit (shadcn)

- Tailwind v4 tokens live in `src/app/globals.css`; shared UI primitives live under `src/components/ui` (seeded with a shadcn-style `Button`).
- `components.json` configures the shadcn CLI. Add components with `pnpm dlx shadcn@latest add <component>`; utilities are under `src/lib/utils.ts`.

## Supabase Auth

- Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (optionally) `SUPABASE_SERVICE_ROLE_KEY` for server-side admin tasks.
- Use `createSupabaseBrowserClient` in client components and `createSupabaseServerClient` in server components/route handlers; both live in `src/lib/supabase/`.
