# Jayant Goyal - Personal Hub 

A modern, full-stack monorepo featuring a unified web application built with Next.js 16, TypeScript, React 19, and Supabase. This repository showcases expertise in monorepo architecture, shared component libraries, and scalable application development.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.6-EF4444)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/pnpm-10.24-F69220)](https://pnpm.io/)

## Overview

This is a **Turborepo monorepo** managed with **pnpm workspaces**, containing:

- **2 Applications** - Main hub app and an admin panel
- **4 Shared Packages** - Reusable UI components and configurations
- **TypeScript** throughout for type safety
- **Shared Design System** via `@repo/ui`

## Applications

### Main App (`apps/jayantgoyal`)

The main application is a unified hub combining:

### Portfolio
Personal portfolio showcasing projects, skills, experience, education, and certificates with smooth animations and responsive design.

### Games Hub
Five interactive games with AI opponents:
- Tic Tac Toe, Connect Four, Memory Match, Rock Paper Scissors, Dare X
- Animated gameplay with winning line highlighting
- Multiple difficulty levels and game modes

### Currency Calculator
Cash denomination calculator with historical tracking, notes, and full CRUD operations.

### Custom Drag & Drop Calculator
Customizable calculator builder with drag-and-drop button/operator layout using Zustand.

### Tech Tools
99+ developer utilities including:
- Generators (UUID, ULID, tokens, RSA keys)
- Hash & Encryption (Bcrypt, HMAC, encrypt/decrypt)
- Converters (JSON/YAML/TOML/XML, Base64, color, date-time)
- Text Tools, Parsers & Validators, Formatters
- Code & Dev Tools, Network Tools, Media & QR generators

### Activity Tracker
Daily activity tracking with custom activities, monthly progress, and dashboard analytics.

### Weather Dashboard
Weather information with city search, geolocation, and 5-day forecast via OpenWeather API.

### File Manager
Full-stack file management with hierarchical directories, file operations, and soft delete.

### Sync Messenger
Real-time messaging with Supabase subscriptions and instant synchronization.

### Admin Panel (`apps/admin`)

Administrative interface for managing portfolio data and application content.

## Shared Packages

### `@repo/ui`
React 19 + Tailwind v4 component library with shared design system.

### `@repo/tailwind-config`
Shared Tailwind CSS and PostCSS configuration.

### `@repo/eslint-config`
Flat ESLint configurations (base, Next.js, React).

### `@repo/typescript-config`
Strict TypeScript configurations for apps and libraries.

## Tech Stack

### Core Technologies
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.9** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Supabase** - Authentication, database, real-time, storage
- **Turborepo** - Monorepo build system
- **pnpm** - Fast, disk space efficient package manager

### Key Libraries
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Framer Motion** - Animation library
- **Sonner** - Toast notifications
- **next-themes** - Theme management
- **Zustand** - State management
- **React DnD** - Drag and drop

## Getting Started

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

   Create `.env.local` in `apps/jayantgoyal/`:
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
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
   ```

## Development

### Run the Application
```bash
# Run the main app
pnpm dev --filter jg

# Or run all workspaces
pnpm dev
```

### UI Package Development
```bash
# Watch styles
pnpm --filter @repo/ui dev:styles

# Watch components
pnpm --filter @repo/ui dev:components
```

## Build & Quality

### Build
```bash
pnpm build
```

### Linting
```bash
pnpm lint
```

### Type Checking
```bash
pnpm check-types
```

### Formatting
```bash
pnpm format
```

## Project Structure

```
jayantgoyal/
├── apps/
│   ├── jayantgoyal/           # Main web application (port 3000)
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router pages
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities and configurations
│   │   │   └── hooks/         # Custom React hooks
│   │   └── public/            # Static assets
│   └── admin/                 # Admin panel
│       ├── src/
│       │   ├── app/           # Next.js App Router pages
│       │   ├── components/    # React components
│       │   ├── lib/           # Utilities and configurations
│       │   └── hooks/         # Custom React hooks
│       └── public/            # Static assets
├── packages/
│   ├── ui/                    # Shared UI component library
│   ├── tailwind-config/       # Shared Tailwind configuration
│   ├── eslint-config/         # Shared ESLint configurations
│   └── typescript-config/     # Shared TypeScript configurations
├── turbo.json                 # Turborepo configuration
├── pnpm-workspace.yaml        # pnpm workspace configuration
└── package.json               # Root package.json
```

## Live

**Website:** [jayantgoyal.com](https://jayantgoyal.com)  
**Admin Panel:** [admin.jayantgoyal.com](https://admin.jayantgoyal.com)


## Author

**Jayant Goyal**
- **GitHub:** [@goyal1510](https://github.com/goyal1510)
- **Portfolio:** [jayantgoyal.com](https://jayantgoyal.com)
- **Email:** goyal151002@gmail.com
- **Location:** Hyderabad, India

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Turborepo](https://turbo.build/) - High-performance build system
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

**Built with Next.js, TypeScript, and modern web technologies**
