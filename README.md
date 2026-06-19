# JG

Portfolio, tools, games, and productivity apps by **Jayant**.

[![Portfolio](https://img.shields.io/badge/Portfolio-jayantgoyal.com-000?style=for-the-badge&logo=vercel)](https://jayantgoyal.com)
[![GitHub](https://img.shields.io/badge/GitHub-goyal1510-181717?style=for-the-badge&logo=github)](https://github.com/goyal1510)
[![Email](https://img.shields.io/badge/Email-goyal151002%40gmail.com-EA4335?style=for-the-badge&logo=gmail)](mailto:goyal151002@gmail.com)

---

## Live Projects

| Project | Description | Tech Highlights |
|---------|-------------|-----------------|
| [**Messenger**](https://jayantgoyal.com/messenger) | Real-time chat with instant sync | Supabase Realtime, Subscriptions |
| [**File Manager**](https://jayantgoyal.com/files) | Cloud storage with folders, upload, soft delete | Supabase Storage, Hierarchical data |
| [**Activity Tracker**](https://jayantgoyal.com/activity-tracker) | Daily tracking with analytics dashboard | Recharts, Data visualization |
| [**Weather**](https://jayantgoyal.com/weather) | City search, geolocation, 5-day forecast | OpenWeather API, Geolocation |
| [**Games**](https://jayantgoyal.com/games) | 5 games with AI opponents | Game logic, State machines |
| [**Calculator**](https://jayantgoyal.com/calculator) | Cash denomination with history | CRUD, Zustand persistence |
| [**Custom Calculator**](https://jayantgoyal.com/custom-calculator) | Drag & drop calculator builder | React DnD, Dynamic layouts |
| [**Dev Tools**](https://jayantgoyal.com/tools) | 99+ utilities (UUID, hash, encode, format) | Crypto APIs, Converters |
| [**Admin Panel**](https://admin.jayantgoyal.com) | Manage portfolio data | Protected routes, RBAC |

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
│   ├── jayantgoyal/        # Main app - all features above
│   └── admin/              # Admin panel
│
├── packages/
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

### Messenger
Real-time messaging built on Supabase Realtime subscriptions. Messages sync instantly across tabs/devices. Handles presence, typing indicators, and optimistic updates.

### File Manager
Full cloud file system with:
- Hierarchical folder structure
- Drag & drop uploads
- Copy, move, rename operations
- Soft delete with trash/restore

### Activity Tracker
Track daily activities with custom categories. Monthly calendar view, streak tracking, and analytics dashboard with charts.

### Dev Tools
99+ developer utilities organized by category:
- **Generators**: UUID, ULID, nanoid, RSA keys, tokens
- **Hash & Crypto**: Bcrypt, SHA, HMAC, AES encrypt/decrypt
- **Converters**: JSON/YAML/TOML/XML, Base64, colors, timestamps
- **Formatters**: JSON, SQL, code beautifiers
- **Validators**: JSON, regex, JWT decoder

### Games Hub
Five games with polished UI and AI opponents:
- **Tic Tac Toe** - Minimax AI, unbeatable mode
- **Connect Four** - Column-drop mechanics
- **Memory Match** - Card flip animations
- **Rock Paper Scissors** - Animated results
- **Dare X** - Party game with random dares

---

## Quick Start

```bash
# Clone
git clone https://github.com/goyal1510/jayantgoyal.git
cd jayantgoyal

# Install (requires pnpm 10.24+, Node 18+)
pnpm install

# Set up environment
cp apps/jayantgoyal/.env.example apps/jayantgoyal/.env.local
# Edit .env.local with your Supabase keys

# Run
pnpm dev --filter jg
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

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps |
| `pnpm dev --filter jg` | Run main app only |
| `pnpm build` | Build all |
| `pnpm lint` | Lint (zero warnings) |
| `pnpm check-types` | Type check |
| `pnpm format` | Format with Prettier |

---

## Key Patterns

- **Server → Client**: Pages are server components that render client components
- **Auth**: Supabase SSR with email/password, magic link, OAuth, guest login
- **State**: Zustand stores with `persist` middleware + manual hydration
- **Styling**: Tailwind v4 + CVA for variants + `cn()` for class merging
- **Multi-tenant**: Portfolio data fetched by hostname

---

## Connect

- **Portfolio**: [jayantgoyal.com](https://jayantgoyal.com)
- **GitHub**: [@goyal1510](https://github.com/goyal1510)
- **Email**: [goyal151002@gmail.com](mailto:goyal151002@gmail.com)

---

Built with Next.js 16, React 19, TypeScript, Supabase, and Turborepo
