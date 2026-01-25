# Jayant Goyal - Personal Hub

A unified full-stack web application combining portfolio, games, tools, and productivity features built with Next.js 16, TypeScript, React 19, and Supabase.

## Features

### Portfolio
Personal portfolio showcasing projects, skills, experience, education, and certificates with smooth animations and responsive design.

### Games Hub
Five interactive games with AI opponents and multiplayer support:
- **Tic Tac Toe** - Classic game with AI opponent
- **Connect Four** - Animated coin drops with winning line highlighting
- **Memory Match** - Multiple difficulty levels
- **Rock Paper Scissors** - Play against computer
- **Dare X** - Interactive dare game

### Currency Calculator
Cash denomination calculator with:
- Bundle counting for INR denominations
- Historical tracking per date
- Notes and annotations
- Full CRUD operations with Supabase

### Custom Drag & Drop Calculator
Customizable calculator builder with:
- Drag-and-drop button/operator layout
- Dark mode support
- Zustand state management

### Tech Tools
99+ developer utilities organized into categories:
- **Generators** - UUID, ULID, tokens, RSA keys, OTP, MAC addresses
- **Hash & Encryption** - Bcrypt, HMAC, hash text, encrypt/decrypt
- **Converters** - JSON/YAML/TOML/XML, Base64, color, date-time, temperature
- **Text Tools** - Case converter, lorem ipsum, ASCII art, text diff
- **Parsers & Validators** - JWT parser, URL parser, email normalizer, IBAN validator
- **Formatters** - JSON, SQL, XML, YAML prettify/minify
- **Code & Dev Tools** - Regex tester, chmod calculator, crontab generator, git cheatsheet
- **Network Tools** - IPv4 subnet calculator, MAC address lookup
- **Media & QR** - QR code generator, WiFi QR, camera recorder
- **Calculators** - Chronometer, ETA calculator, percentage calculator

### Activity Tracker
Daily activity tracking with:
- Custom activity creation
- Monthly progress tracking
- Dashboard with KPIs and analytics
- Completion rates and progress bars

### Weather Dashboard
Weather information powered by OpenWeather API:
- City-based search
- Geolocation support
- 5-day weather forecast

### File Manager
Full-stack file management system:
- Hierarchical directory support
- File upload/download/preview
- Copy, move, rename, delete operations
- Soft delete with restore functionality

### Sync Messenger
Real-time messaging application:
- Supabase real-time subscriptions
- Instant message synchronization
- Message history

## Tech Stack

- **Next.js 16** with App Router
- **React 19** / **TypeScript 5.9**
- **Tailwind CSS v4**
- **Supabase** - Auth, PostgreSQL, real-time, storage
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations
- **Zustand** - State management
- **React DnD** - Drag and drop
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## Development

```bash
# Install dependencies (from repo root)
pnpm install

# Run development server
pnpm dev --filter jg

# Build for production
pnpm build --filter jg

# Lint
pnpm lint --filter jg

# Type check
pnpm check-types --filter jg
```

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
GUEST_EMAIL_LOGIN=guest@example.com
GUEST_PASSWORD_LOGIN=guest_password
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── (protected)/           # Auth-guarded routes
│   │   ├── page.tsx           # Portfolio home
│   │   ├── calculator/        # Currency calculator
│   │   ├── custom-calculator/ # Drag-drop calculator
│   │   ├── files/             # File manager
│   │   ├── games/             # Games hub
│   │   ├── messenger/         # Sync messenger
│   │   ├── tools/             # Tech tools (99+ utilities)
│   │   └── weather/           # Weather dashboard
│   ├── api/                   # API routes
│   ├── login/
│   └── signup/
├── components/
│   ├── ui/                    # UI components
│   ├── portfolio/             # Portfolio sections
│   ├── games/                 # Game components
│   ├── tools/                 # Tool components
│   └── files/                 # File manager components
├── lib/
│   ├── supabase/              # Supabase clients
│   ├── db/                    # Database queries
│   ├── portfolio/             # Portfolio data
│   └── types/                 # TypeScript types
└── hooks/
```

## Live

[jayantgoyal.com](https://jayantgoyal.com)
