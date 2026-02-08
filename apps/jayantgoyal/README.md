# Main App

Personal hub application with portfolio, games, tools, and productivity apps.

**Live**: [jayantgoyal.com](https://jayantgoyal.com)

## Features

| Feature | Route | Description |
|---------|-------|-------------|
| Portfolio | `/` | Personal portfolio with projects, skills, experience |
| Messenger | `/messenger` | Real-time chat with Supabase Realtime |
| File Manager | `/files` | Cloud storage with folders and uploads |
| Activity Tracker | `/activity-tracker` | Daily tracking with analytics |
| Weather | `/weather` | City search, geolocation, 5-day forecast |
| Games | `/games` | 5 games with AI opponents |
| Calculator | `/calculator` | Cash denomination calculator |
| Custom Calculator | `/custom-calculator` | Drag & drop calculator builder |
| Dev Tools | `/tools` | 99+ developer utilities |
| Contact | `/contact` | Contact form with email delivery |

## Tech Stack

- **Next.js 16** - App Router, React Server Components
- **React 19** - UI library
- **TypeScript 5.9** - Type safety
- **Tailwind CSS v4** - Styling
- **Supabase** - Auth, Database, Realtime, Storage
- **Zustand** - State management
- **Framer Motion** - Animations
- **React DnD** - Drag and drop

## Project Structure

```
src/
├── app/
│   ├── (protected)/          # Auth-required routes
│   │   ├── page.tsx          # Portfolio (home)
│   │   ├── messenger/
│   │   ├── files/
│   │   ├── activity-tracker/
│   │   ├── weather/
│   │   ├── games/
│   │   ├── calculator/
│   │   ├── custom-calculator/
│   │   ├── tools/
│   │   └── contact/
│   ├── api/                  # API routes
│   ├── login/
│   ├── signup/
│   └── auth/callback/
├── components/               # React components
├── lib/                      # Utilities and configs
└── hooks/                    # Custom React hooks
```

## Key Patterns

- **Server -> Client**: Pages are server components rendering client components
- **Auth**: Supabase SSR with multiple auth methods (email, OAuth, magic link, guest)
- **State**: Zustand with persist middleware + manual hydration
- **Multi-tenant**: Portfolio data fetched by hostname
- **Shared UI**: Components from `@repo/ui`

## Development

```bash
# From monorepo root
pnpm dev --filter jg

# Type check
pnpm check-types

# Lint
pnpm lint
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_OPENWEATHER_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
GUEST_EMAIL_LOGIN=
GUEST_PASSWORD_LOGIN=
```

See `.env.example` for full list.
