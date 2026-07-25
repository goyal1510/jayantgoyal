# Jayant

Independent Portfolio, Studio, Admin, and Auth applications by **Jayant**.

[![Portfolio](https://img.shields.io/badge/Portfolio-jayantgoyal.com-000?style=for-the-badge&logo=vercel)](https://jayantgoyal.com)
[![GitHub](https://img.shields.io/badge/GitHub-goyal1510-181717?style=for-the-badge&logo=github)](https://github.com/goyal1510)
[![Email](https://img.shields.io/badge/Email-goyal151002%40gmail.com-EA4335?style=for-the-badge&logo=gmail)](mailto:goyal151002@gmail.com)

---

## Live Projects

| Project                                                                   | Description                                     | Tech Highlights                     |
| ------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------- |
| [**Sync Scratchpad**](https://studio.jayantgoyal.com/scratchpad)          | Private text, code, and note synchronization   | Supabase Realtime, RLS              |
| [**File Manager**](https://studio.jayantgoyal.com/files)                  | Cloud storage with folders, upload, soft delete | Supabase Storage, Hierarchical data |
| [**Activity Tracker**](https://studio.jayantgoyal.com/activity-tracker)   | Daily tracking with analytics dashboard         | Recharts, Data visualization        |
| [**Weather**](https://studio.jayantgoyal.com/weather)                     | City search, geolocation, 5-day forecast        | OpenWeather API, Geolocation        |
| [**Games**](https://studio.jayantgoyal.com/games)                         | 9 solo, local, and online games                 | Realtime sessions, Game validation  |
| [**Calculator**](https://studio.jayantgoyal.com/calculator)               | Cash denomination with history                  | CRUD, Zustand persistence           |
| [**Custom Calculator**](https://studio.jayantgoyal.com/custom-calculator) | Drag & drop calculator builder                  | React DnD, Dynamic layouts          |
| [**Dev Tools**](https://studio.jayantgoyal.com/tools)                     | 87 utilities (UUID, hash, encode, format)       | Typed registry, Persisted favorites |
| [**Admin Panel**](https://admin.jayantgoyal.com)                          | Manage portfolio data                           | Protected routes, RBAC              |

---

## Tech Stack

```
Frontend     Next.js 16 · React 19 · TypeScript 5.9 · Tailwind CSS v4
Backend      Supabase (Auth, Database, Realtime, Storage)
Monorepo     Turborepo · pnpm Workspaces
UI/UX        Radix UI · Framer Motion · Lucide Icons · Sonner
State        Zustand (persisted stores)
```

---

## Architecture

```
jayantgoyal/
├── apps/
│   ├── portfolio/          # Public portfolio, blog, resume, contact
│   ├── studio/             # Products, tools, games, and workspaces
│   ├── admin/              # Administration and content operations
│   └── auth/               # Sign-in, recovery, MFA, and account security
│
├── packages/
│   ├── auth/               # Shared Supabase SSR and session contracts
│   ├── brand/              # Shared names and metadata identity
│   ├── platform/           # Canonical application hosts and URLs
│   ├── seo/                # Shared public metadata contracts
│   ├── ui/                 # Shared component library (React 19 + Tailwind v4)
│   ├── tailwind-config/    # Shared Tailwind configuration
│   ├── eslint-config/      # Flat ESLint configs (base, next, react)
│   └── typescript-config/  # Strict TS configs
│
└── turbo.json              # Build pipeline
```

**Why Monorepo?**

- Shared UI components across apps via `@repo/ui`
- Consistent linting, formatting, and TypeScript configs
- Single `pnpm install`, parallel builds with Turborepo
- Code reuse without npm publishing overhead

---

## Features Deep Dive

### Sync Scratchpad

A private authenticated stream for moving temporary text, links, and notes
between personal devices. Supabase Realtime keeps the durable scratchpad
synchronized across tabs and sessions.

### File Manager

Full cloud file system with:

- Hierarchical folder structure
- Drag & drop uploads
- Copy, move, rename operations
- Soft delete with trash/restore

### Activity Tracker

Track daily activities with custom categories. Monthly calendar view, streak tracking, and analytics dashboard with charts.

### Dev Tools

87 developer utilities organized by category:

- **Generators**: UUID, ULID, nanoid, RSA keys, tokens
- **Hash & Crypto**: Bcrypt, SHA, HMAC, AES encrypt/decrypt
- **Converters**: JSON/YAML/TOML/XML, Base64, colors, timestamps
- **Formatters**: JSON, SQL, code beautifiers
- **Validators**: JSON, regex, JWT decoder

### Games Hub

Nine games spanning solo, local, computer, and online room modes:

- **Tic Tac Toe** - Minimax AI, unbeatable mode
- **Connect Four** - Column-drop mechanics
- **Memory Match** - Card flip animations
- **Rock Paper Scissors** - Animated results
- **Dare X** - Party game with random dares
- **Wordle** - Solo play and online races
- **Typing Speed** - Speed and accuracy testing
- **Chess** - Legal move validation and online rooms
- **Ludo** - Online room-based board game

---

## Quick Start

```bash
# Clone
git clone https://github.com/goyal1510/jayantgoyal.git
cd jayantgoyal

# Install (requires pnpm 10.24+, Node 22+)
pnpm install

# Set up the application environments
cp apps/portfolio/.env.example apps/portfolio/.env.local
cp apps/studio/.env.example apps/studio/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/auth/.env.example apps/auth/.env.local

# Run Studio
pnpm --filter studio dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_OPENWEATHER_API_KEY=
RESEND_API_KEY=
```

---

## Commands

| Command                       | Description                         |
| ----------------------------- | ----------------------------------- |
| `pnpm dev`                    | Run all apps                        |
| `pnpm --filter portfolio dev` | Run Portfolio on port 3000          |
| `pnpm --filter studio dev`    | Run Studio on port 3001             |
| `pnpm --filter admin dev`     | Run Admin on port 3002              |
| `pnpm --filter auth dev`      | Run Auth on port 3003               |
| `pnpm build`                  | Build all                           |
| `pnpm lint`                   | Lint (zero warnings)                |
| `pnpm check-types`            | Type check                          |
| `pnpm test`                   | Run focused Vitest regression tests |
| `pnpm format`                 | Format with Prettier                |

---

## Key Patterns

- **Server → Client**: Pages are server components that render client components
- **Auth**: Supabase SSR with email/password, magic link, OAuth, guest login
- **State**: Zustand stores with `persist` middleware + manual hydration
- **Styling**: Tailwind v4 + CVA for variants + `cn()` for class merging
- **Application boundaries**: Portfolio content, Studio products, Admin operations, and Auth account flows deploy independently

---

## Connect

- **Portfolio**: [jayantgoyal.com](https://jayantgoyal.com)
- **GitHub**: [@goyal1510](https://github.com/goyal1510)
- **Email**: [goyal151002@gmail.com](mailto:goyal151002@gmail.com)

---

Built with Next.js 16, React 19, TypeScript, Supabase, and Turborepo
