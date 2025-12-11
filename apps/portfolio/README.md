# Portfolio

Personal Next.js 16 portfolio for Jayant with animated sections, host-aware profiles, and an optional Supabase-powered auth shell.

## Features
- Host-aware portfolio data (see `src/lib/portfolio-data.ts`) so different domains can map to different profiles; defaults to the Jayant profile.
- Rich sections for hero, about, skills, experience, projects, certificates, and contact with resume download and motion flourishes.
- Supabase auth flows for email/password, guest login, profile updates, and account deletion (service-role protected).
- Theming and UI primitives come from `@repo/ui` with Tailwind v4 tokens in `src/app/globals.css`.

## Run locally
From the repo root:
```bash
pnpm dev --filter portfolio
```

## Environment
Create `.env.local` in `apps/portfolio` (or the repo root) with:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # required for /api/account/delete
GUEST_EMAIL_LOGIN=...           # optional, enables “Continue as guest”
GUEST_PASSWORD_LOGIN=...
```

## Content updates
- Edit `src/lib/portfolio-profiles/jayant-portfolio-data.ts` to change copy, links, or assets.
- Map new hosts or profiles in `src/lib/portfolio-data.ts` if you want alternate portfolios per domain.
