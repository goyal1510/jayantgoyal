# 🚀 Jayant Goyal - Monorepo

A modern, full-stack monorepo showcasing multiple production-ready applications built with Next.js 16, TypeScript, React 19, and Supabase. This repository demonstrates expertise in monorepo architecture, shared component libraries, and scalable application development.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.6-EF4444)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/pnpm-10.24-F69220)](https://pnpm.io/)

## 📦 Repository Structure

This is a **Turborepo monorepo** managed with **pnpm workspaces**, containing:

- **7 Production Applications** - Full-stack Next.js apps
- **4 Shared Packages** - Reusable UI components and configurations
- **TypeScript** throughout for type safety
- **Shared Design System** via `@repo/ui`

## 🎯 Applications

### 1. **Portfolio** (`apps/portfolio/`)
Personal portfolio website showcasing projects, skills, experience, and certificates.

- **Tech Stack:** Next.js 16, TypeScript, Tailwind CSS
- **Features:** Responsive design, dark mode, smooth animations
- **Dev:** `pnpm dev --filter portfolio` (port 3000)
- **Live:** [jayantgoyal.com](https://jayantgoyal.com)

### 2. **Game Hub** (`apps/game-hub/`)
Interactive gaming platform with 5 classic games featuring AI opponents and multiplayer support.

- **Games:** Tic Tac Toe, Connect Four, Memory Match, Rock Paper Scissors, Dare X
- **Tech Stack:** Next.js 16, TypeScript, Supabase Auth
- **Features:** 
  - Animated coin drops in Connect Four
  - Winning line highlighting
  - AI opponents with strategic gameplay
  - Multiple difficulty levels
  - Player vs Player and vs Computer modes
- **Dev:** `pnpm dev --filter ghub`
- **Live:** [ghub.jayantgoyal.com](https://ghub.jayantgoyal.com)

### 3. **Currency Calculator** (`apps/currency-calculator/`)
Supabase-authenticated currency breakdown tool for INR with saved calculation history.

- **Tech Stack:** Next.js, Supabase, TypeScript
- **Features:** 
  - Cash denomination calculations
  - Historical tracking per date
  - Notes and annotations
  - Full CRUD operations
- **Dev:** `pnpm dev --filter ccal`
- **Live:** [ccal.jayantgoyal.com](https://ccal.jayantgoyal.com)

### 4. **Custom Drag & Drop Calculator** (`apps/custom-drag-drop-calculator/`)
Customizable calculator with drag-and-drop button/operator layout.

- **Tech Stack:** Next.js, React, Zustand, Tailwind CSS
- **Features:**
  - Drag-and-drop calculator builder
  - Dark mode support
  - Backspace and clear functionality
  - Duplicate prevention
- **Dev:** `pnpm dev --filter customcal`
- **Live:** [customcal.jayantgoyal.com](https://customcal.jayantgoyal.com)

### 5. **Activity Tracker** (`apps/activity-tracker/`)
Supabase-authenticated activity tracking tool for monitoring daily activities with performance KPIs.

- **Tech Stack:** Next.js, Supabase, TypeScript
- **Features:**
  - Daily activity logging
  - Performance metrics and KPIs
  - User authentication
  - Data visualization
- **Dev:** `pnpm dev --filter atrack`

### 6. **Tech Tools** (`apps/tech/`)
Collection of 99+ developer tools and utilities (generators, converters, parsers, validators, formatters).

- **Tech Stack:** Next.js, TypeScript
- **Features:**
  - Wide range of developer utilities
  - JSON/CSV/XML formatters
  - Code generators
  - Validators and converters
- **Dev:** `pnpm dev --filter tech`

### 7. **Weather Dashboard** (`apps/weather/`)
Weather dashboard powered by OpenWeather API with city search and 5-day forecast.

- **Tech Stack:** Next.js, TypeScript, OpenWeather API, Tailwind CSS
- **Features:**
  - City-based search
  - Geolocation support
  - 5-day weather forecast
  - Responsive UI
- **Dev:** `pnpm dev --filter weather`
- **Live:** [weather.jayantgoyal.com](https://weather.jayantgoyal.com)

### 8. **Supabase Manager** (`apps/supabase-manager/`)
Multi-project Supabase management interface with user management capabilities.

- **Tech Stack:** Next.js, Supabase, TypeScript
- **Features:**
  - Multi-project management
  - User administration
  - Project configuration
- **Dev:** `pnpm dev --filter smanager`

## 📚 Shared Packages

### `@repo/ui`
React 19 + Tailwind v4 component library with shared design system.

- **Build:** `pnpm --filter @repo/ui build:styles` then `build:components`
- **Dev:** `pnpm --filter @repo/ui dev:styles` and `dev:components`
- **Usage:** Import `@repo/ui/styles.css` in global styles

### `@repo/tailwind-config`
Shared Tailwind CSS and PostCSS configuration across all apps.

### `@repo/eslint-config`
Flat ESLint configurations (base, Next.js, React) used across all apps.

### `@repo/typescript-config`
Strict TypeScript configurations for apps and libraries.

## 🛠️ Tech Stack

### Core Technologies
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.9** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Supabase** - Authentication and database
- **Turborepo** - Monorepo build system
- **pnpm** - Fast, disk space efficient package manager

### Key Libraries
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Framer Motion** - Animation library
- **Sonner** - Toast notifications
- **next-themes** - Theme management
- **Zustand** - State management

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18
- **pnpm** >= 10.24.0

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/goyal1510/jayantgoyal.git
   cd jayantgoyal
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` files in respective app directories or at repo root:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Guest Login (optional)
   GUEST_EMAIL_LOGIN=guest@example.com
   GUEST_PASSWORD_LOGIN=guest_password
   
   # Email Service (optional)
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=noreply@example.com
   
   # Site URL
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

## 💻 Development

### Run All Apps
```bash
pnpm dev
```
Turborepo orchestrates the development graph and runs all apps in parallel.

### Run Specific App
```bash
# Portfolio
pnpm dev --filter portfolio

# Game Hub
pnpm dev --filter ghub

# Currency Calculator
pnpm dev --filter ccal

# Custom Calculator
pnpm dev --filter customcal

# Activity Tracker
pnpm dev --filter atrack

# Tech Tools
pnpm dev --filter tech

# Weather
pnpm dev --filter weather

# Supabase Manager
pnpm dev --filter smanager
```

### UI Package Development
```bash
# Watch styles
pnpm --filter @repo/ui dev:styles

# Watch components
pnpm --filter @repo/ui dev:components
```

## 🏗️ Build & Quality

### Build All Apps
```bash
pnpm build
```
Turborepo orchestrates builds across all workspaces with dependency management.

### Linting
```bash
pnpm lint
```
Runs ESLint across all apps and packages.

### Type Checking
```bash
pnpm check-types
```
Runs TypeScript type checking including Next.js type generation.

### Formatting
```bash
pnpm format
```
Formats code using Prettier with Tailwind CSS class sorting.

## 📁 Project Structure

```
jayantgoyal/
├── apps/
│   ├── portfolio/              # Personal portfolio website
│   ├── game-hub/               # Interactive gaming platform
│   ├── currency-calculator/    # Currency breakdown tool
│   ├── custom-drag-drop-calculator/  # Customizable calculator
│   ├── activity-tracker/       # Activity tracking app
│   ├── tech/                   # Developer tools collection
│   ├── weather/                # Weather dashboard
│   └── supabase-manager/       # Supabase management interface
├── packages/
│   ├── ui/                     # Shared UI component library
│   ├── tailwind-config/        # Shared Tailwind configuration
│   ├── eslint-config/          # Shared ESLint configurations
│   └── typescript-config/      # Shared TypeScript configurations
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace configuration
└── package.json                # Root package.json
```

## 🔐 Environment Variables

Key environment variables used across apps (see `turbo.json` for full list):

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `GUEST_EMAIL_LOGIN` - Guest user email (optional)
- `GUEST_PASSWORD_LOGIN` - Guest user password (optional)
- `RESEND_API_KEY` - Resend API key for emails (optional)
- `RESEND_FROM_EMAIL` - From email for Resend (optional)
- `NEXT_PUBLIC_SITE_URL` - Site URL for production

**Note:** Keep all environment variables in local `.env*` files, never commit them to VCS.

## 📝 Notes

- **ESLint:** Warns on undeclared env vars (`turbo/no-undeclared-env-vars`); declare them in `.env*` files
- **Components:** Export in PascalCase; file names may remain lowercase
- **Type Safety:** All apps use strict TypeScript configurations
- **Shared Code:** Common utilities and components live in `@repo/ui` package
- **Build System:** Turborepo handles dependency graph and caching automatically

## 🌐 Live Applications

- **Portfolio:** [jayantgoyal.com](https://jayantgoyal.com)
- **Game Hub:** [ghub.jayantgoyal.com](https://ghub.jayantgoyal.com)
- **Currency Calculator:** [ccal.jayantgoyal.com](https://ccal.jayantgoyal.com)
- **Custom Calculator:** [customcal.jayantgoyal.com](https://customcal.jayantgoyal.com)
- **Weather:** [weather.jayantgoyal.com](https://weather.jayantgoyal.com)

## 🤝 Contributing

This is a personal monorepo. Contributions and suggestions are welcome, but please note this is primarily a showcase of personal projects.

## 📄 License

This project is private and proprietary.

## 👤 Author

**Jayant Goyal**
- **GitHub:** [@goyal1510](https://github.com/goyal1510)
- **Portfolio:** [jayantgoyal.com](https://jayantgoyal.com)
- **Email:** goyal151002@gmail.com
- **Location:** Hyderabad, India

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Turborepo](https://turbo.build/) - High-performance build system
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**
