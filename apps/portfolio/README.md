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
RESEND_API_KEY=...              # required for contact form email sending
RESEND_FROM_EMAIL=...           # optional, verified domain email (e.g., "Portfolio Contact <contact@yourdomain.com>"). Defaults to "Portfolio Contact <onboarding@resend.dev>"
NEXT_PUBLIC_SITE_URL=...        # optional, defaults to http://localhost:3000 in dev
```

### Email Setup (Contact Form)
The contact form uses [Resend](https://resend.com) to send emails. To set it up:
1. Sign up for a free Resend account at https://resend.com
2. Get your API key from the Resend dashboard
3. Add `RESEND_API_KEY` to your `.env.local` file
4. (Optional) Add `RESEND_FROM_EMAIL` with your verified domain (e.g., `"Portfolio Contact <contact@yourdomain.com>"`). If not set, it defaults to `onboarding@resend.dev` which works for testing.

**Note:** Resend requires domain verification for the `from` field. You cannot use arbitrary email addresses. The user's email is automatically set in the `replyTo` field, so when you reply to the email, it will go directly to the person who filled out the form.

## Content updates
- Edit `src/lib/portfolio-profiles/jayant-portfolio-data.ts` to change copy, links, or assets.
- Map new hosts or profiles in `src/lib/portfolio-data.ts` if you want alternate portfolios per domain.
