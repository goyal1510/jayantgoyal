# JG Hub

A unified hub that combines multiple applications (Portfolio, Games, Tools, etc.) into a single Next.js application with shared authentication and navigation.

## Overview

JG Hub consolidates multiple standalone apps from the monorepo into one cohesive application. Instead of maintaining separate deployments for each app, users can access everything from a single URL with a unified sidebar navigation.

### Why JG Hub?

- **Single Entry Point**: One URL to access all applications
- **Shared Authentication**: Login once, access all protected apps
- **Unified Navigation**: Expandable sidebar with all apps organized
- **Consistent UX**: Same layout, theme, and user experience across all apps
- **Easier Maintenance**: Shared components, utilities, and configurations

## Architecture

### App Structure

```
src/
├── app/
│   ├── (protected)/           # Auth-guarded routes
│   │   ├── page.tsx           # Portfolio (root page)
│   │   ├── games/             # Game Hub routes
│   │   │   ├── page.tsx       # Games dashboard
│   │   │   ├── tic-tac-toe/
│   │   │   ├── rock-paper-scissors/
│   │   │   ├── connect-four/
│   │   │   ├── dare-x/
│   │   │   └── memory-match/
│   │   └── layout.tsx         # Shared layout with sidebar
│   ├── login/                 # Public login page
│   ├── signup/                # Public signup page
│   └── api/                   # API routes
├── components/
│   ├── app-sidebar.tsx        # Main sidebar with apps navigation
│   ├── nav-apps.tsx           # Expandable app groups
│   ├── nav-user.tsx           # User profile dropdown
│   ├── dynamic-breadcrumb.tsx # Route-aware breadcrumb
│   ├── games/                 # Game components
│   └── ui/                    # Shared UI components
└── lib/
    ├── hub-config.ts          # Central app configuration
    ├── games.ts               # Game metadata
    └── supabase/              # Auth clients
```

### Hub Configuration (`lib/hub-config.ts`)

Central configuration defining all apps, their navigation items, icons, and public/private status:

```typescript
type AppConfig = {
  id: string           // Unique app identifier
  name: string         // Display name
  icon: LucideIcon     // Sidebar icon
  color: string        // Icon color classes
  isPublic: boolean    // Requires auth?
  navItems: NavItem[]  // Sub-navigation items
}
```

### Current Apps

| App | Status | Route | Description |
|-----|--------|-------|-------------|
| Portfolio | Implemented | `/` | Personal portfolio with scroll sections |
| Game Hub | Implemented | `/games/*` | 5 browser games |
| Tech Tools | Planned | `/tools/*` | 99+ utilities |
| File Manager | Planned | `/files/*` | File management |
| Activity Tracker | Planned | `/tracker/*` | Activity tracking |
| Currency Calculator | Planned | `/currency/*` | Currency conversion |
| Sync Messenger | Planned | `/messenger/*` | Messaging |
| Weather | Planned (Public) | `/weather` | Weather lookup |
| Custom Calculator | Planned (Public) | `/calculator` | Drag-drop calculator |

## Authentication Flow

### Public vs Protected Routes

Handled by `proxy.ts` (middleware):

```typescript
// Public paths (no auth required)
const publicPaths = [
  "/",              // Portfolio is public
  "/login",
  "/signup",
  "/api/guest-login",
  "/api/contact",
]
```

### Login Redirect Flow

1. User tries to access protected route (e.g., `/games/tic-tac-toe`)
2. Redirected to `/login?redirect=/games/tic-tac-toe`
3. After successful login, redirected back to `/games/tic-tac-toe`
4. Guest login also respects the redirect URL

### Auth State in Sidebar

The sidebar listens for Supabase auth state changes:
- **Logged in**: Shows user profile with settings/logout dropdown
- **Logged out**: Shows Login button with user icon
- **Loading**: Shows skeleton loader

### Logout Behavior

- Redirects to `/` (Portfolio) after logout
- Sidebar updates immediately via `onAuthStateChange` listener

## Navigation System

### Sidebar Structure

```
JG Hub (header with LayoutGrid icon)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Apps
  ▼ Portfolio (expandable, scroll-based nav)
      Home, About, Skills, Experience, Projects, Certificates, Contact
  ▼ Game Hub (expandable, route-based nav)
      Dashboard, Rock Paper Scissors, Tic Tac Toe, Dare X, Connect Four, Memory Match
  ▶ Tech Tools (planned)
  ▶ File Manager (planned)
  ▶ Activity Tracker (planned)
  ▶ Currency Calculator (planned)
  ▶ Sync Messenger (planned)
─────────────────────────────────────
Public
  ▶ Weather (planned)
  ▶ Custom Calculator (planned)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[User Profile / Login Button]
```

### Navigation Types

**1. Portfolio (Scroll-based)**
- Uses `IntersectionObserver` to track active section as user scrolls
- Clicking nav items when on `/`: Smooth scroll to section
- Clicking nav items when on other pages: Navigate to `/#section-id`

**2. Other Apps (Route-based)**
- Standard Next.js Link navigation
- Active state determined by current pathname

### Dynamic Breadcrumb

Located in header, automatically updates based on current route:

| Route | Breadcrumb |
|-------|------------|
| `/` | `Portfolio > Home` (updates on scroll) |
| `/#about` | `Portfolio > About` |
| `/games` | `Game Hub > Dashboard` |
| `/games/tic-tac-toe` | `Game Hub > Tic Tac Toe` |

## Key Components

### `app-sidebar.tsx`
- Loads user profile from `/api/account/profile`
- Listens for Supabase `onAuthStateChange` events
- Manages active app/nav detection based on pathname
- Portfolio scroll tracking with `IntersectionObserver`
- Shows Login button when no user, NavUser when authenticated

### `nav-apps.tsx`
- Renders expandable app groups using Collapsible
- Handles Portfolio scroll navigation vs URL navigation
- Uses `usePathname` to determine if on portfolio page
- Active state highlighting for current app and nav item

### `nav-user.tsx`
- User profile dropdown with avatar
- Settings sheet for updating name and password
- Logout functionality (redirects to `/`)
- Account deletion with confirmation

### `dynamic-breadcrumb.tsx`
- Client component using `usePathname`
- Portfolio section tracking with `IntersectionObserver`
- Automatic label resolution from `hub-config.ts`

### `proxy.ts`
- Middleware for authentication
- Public/protected route handling
- Login redirect with return URL preservation

## Adding a New App

### Step 1: Update Hub Config

Add app configuration in `lib/hub-config.ts`:

```typescript
// Define navigation items
const MY_APP_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-blue-500", url: "/my-app" },
  { id: "feature", label: "Feature", icon: Star, color: "text-yellow-500", url: "/my-app/feature" },
]

// Add to HUB_APPS array
{
  id: "my-app",
  name: "My App",
  icon: MyIcon,
  color: "text-purple-500",
  isPublic: false,  // or true for public apps
  navItems: MY_APP_NAV,
}
```

### Step 2: Create Routes

```
src/app/(protected)/my-app/
├── page.tsx           # Dashboard/main page
├── feature/
│   └── page.tsx       # Feature page
└── layout.tsx         # Optional app-specific layout
```

### Step 3: Copy Components from Original App

**Important**: Copy files directly, don't rewrite them to avoid introducing bugs.

```bash
# Copy components
cp -r apps/original-app/src/components/feature apps/jg-hub/src/components/

# Copy utilities
cp apps/original-app/src/lib/utils.ts apps/jg-hub/src/lib/

# Copy UI components if different
cp apps/original-app/src/components/ui/*.tsx apps/jg-hub/src/components/ui/

# Copy assets
cp -r apps/original-app/public/assets apps/jg-hub/public/
```

### Step 4: Update Import Paths

Update all imports in copied files:
- `@/components/...` → ensure paths are correct
- `@/lib/...` → ensure paths are correct

### Step 5: Compare package.json

Check for missing dependencies:
```bash
diff <(cat apps/original-app/package.json | jq -S '.dependencies') \
     <(cat apps/jg-hub/package.json | jq -S '.dependencies')
```

Add any missing dependencies to `apps/jg-hub/package.json`.

### Step 6: Update Sidebar Detection (if needed)

If the app has a unique route prefix, update `app-sidebar.tsx`:

```typescript
// In the pathname detection logic
if (pathname.startsWith("/my-app")) {
  const myApp = allApps.find((app) => app.id === "my-app")
  if (myApp) {
    const activeNav = myApp.navItems.find((nav) => nav.url === pathname)
    return {
      activeAppId: "my-app",
      activeNavId: activeNav?.id ?? "dashboard",
    }
  }
}
```

### Step 7: Update Dynamic Breadcrumb (if needed)

Add route handling in `dynamic-breadcrumb.tsx` for the new app.

### Step 8: Test and Verify

```bash
pnpm check-types --filter jg-hub
pnpm lint --filter jg-hub
pnpm dev --filter jg-hub
```

## File Migration Checklist

When migrating an app to JG Hub:

- [ ] Compare `package.json` for missing dependencies
- [ ] Copy components (don't rewrite to avoid bugs)
- [ ] Copy UI components if they differ
- [ ] Copy lib utilities (supabase clients, helpers)
- [ ] Copy API routes
- [ ] Copy public assets (images, JSON files)
- [ ] Update import paths (`@/...`)
- [ ] Update route URLs in `hub-config.ts`
- [ ] Update proxy.ts if new public routes needed
- [ ] Test all functionality
- [ ] Run type check and lint

## Development

```bash
# Run development server
pnpm dev --filter jg-hub

# Type check
pnpm check-types --filter jg-hub

# Lint
pnpm lint --filter jg-hub

# Build
pnpm build --filter jg-hub
```

## Environment Variables

Create `.env.local` in `apps/jg-hub` (or repo root):

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Guest login (optional)
GUEST_EMAIL_LOGIN=guest@example.com
GUEST_PASSWORD_LOGIN=guest-password

# Contact form (optional)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=contact@yourdomain.com

# Site URL (optional)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Portfolio Features

The Portfolio (root page) includes:
- Host-aware portfolio data (different domains can show different profiles)
- Sections: Hero, About, Skills, Experience, Projects, Certificates, Contact
- Resume download
- Framer Motion animations
- GitHub activity calendar
- Contact form with Resend email integration

Edit portfolio content in `src/lib/portfolio-profiles/jayant-portfolio-data.ts`.

## Game Hub Features

Five browser games with local multiplayer and vs computer modes:
- **Tic Tac Toe**: Classic 3x3 grid game
- **Rock Paper Scissors**: Quick rounds vs computer
- **Connect Four**: Drop pieces to connect 4 in a row
- **Dare X**: Multi-player dare challenge game
- **Memory Match**: Find matching pairs

All games include:
- Setup configuration sheets
- Score tracking
- Audio feedback
- Dark mode support

## Next Steps / Planned Improvements

### 1. Reorganize Component Structure

Current flat structure needs to be organized into logical subdirectories:

**Current:**
```
src/components/
├── app-sidebar.tsx
├── contact-form.tsx
├── dynamic-breadcrumb.tsx
├── github-calendar.tsx
├── login-form.tsx
├── nav-apps.tsx
├── nav-main.tsx
├── nav-projects.tsx
├── nav-user.tsx
├── signup-form.tsx
├── team-switcher.tsx
├── theme-provider.tsx
├── theme-toogle.tsx
├── games/
└── ui/
```

**Target:**
```
src/components/
├── auth/                    # Authentication components
│   ├── login-form.tsx
│   └── signup-form.tsx
├── sidebar/                 # Sidebar & navigation components
│   ├── app-sidebar.tsx
│   ├── dynamic-breadcrumb.tsx
│   ├── nav-apps.tsx
│   ├── nav-main.tsx
│   ├── nav-projects.tsx
│   ├── nav-user.tsx
│   └── team-switcher.tsx
├── theme/                   # Theme components
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── portfolio/               # Portfolio-specific components
│   ├── contact-form.tsx
│   ├── github-calendar.tsx
│   ├── hero-section.tsx
│   ├── about-section.tsx
│   ├── skills-section.tsx
│   ├── experience-section.tsx
│   ├── projects-section.tsx
│   ├── certificates-section.tsx
│   └── contact-section.tsx
├── games/                   # Game components (already organized)
│   ├── TicTacToe.tsx
│   ├── RockPaperScissors.tsx
│   ├── ConnectFour.tsx
│   ├── DareX.tsx
│   └── MemoryMatch.tsx
└── ui/                      # Shared UI primitives (already organized)
```

### 2. Restructure Routes - Portfolio as Explicit Route

Current: Portfolio is at `/` (root)
Target: Portfolio at `/portfolio`, root redirects to it

**Current:**
```
src/app/(protected)/
├── page.tsx              # Portfolio (root)
├── games/
└── layout.tsx
```

**Target:**
```
src/app/
├── page.tsx              # Redirect to /portfolio
├── (protected)/
│   ├── portfolio/
│   │   └── page.tsx      # Portfolio page
│   ├── games/
│   └── layout.tsx
```

**Root page.tsx (redirect):**
```typescript
import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/portfolio")
}
```

**Benefits:**
- Cleaner URL structure (`/portfolio`, `/games`, `/tools`)
- Consistent pattern across all apps
- Easier to add a landing/home page later if needed

### 3. Reorganize Lib Structure

**Current:**
```
src/lib/
├── games.ts
├── hub-config.ts
├── portfolio-data.ts
├── portfolio-profiles/
├── portfolio-server.ts
├── sound.ts
├── supabase/
├── use-portfolio-data.tsx
└── utils.ts
```

**Target:**
```
src/lib/
├── config/
│   └── hub-config.ts        # Central app configuration
├── portfolio/
│   ├── data.ts              # Portfolio data mapping
│   ├── server.ts            # Server-side helpers
│   ├── use-portfolio-data.tsx
│   └── profiles/
│       └── jayant.ts
├── games/
│   ├── config.ts            # Game metadata
│   └── sound.ts             # Audio utilities
├── supabase/
│   ├── client.ts
│   └── server.ts
└── utils.ts
```

### 4. Update proxy.ts for New Routes

When portfolio moves to `/portfolio`:

```typescript
const publicPaths = [
  "/",                // Root redirect (still public)
  "/portfolio",       # Portfolio page (public)
  "/login",
  "/signup",
  "/api/guest-login",
  "/api/contact",
]
```

### 5. Update Hub Config for New Routes

```typescript
const PORTFOLIO_NAV: NavItem[] = [
  { id: "home", label: "Home", icon: Home, color: "...", url: "/portfolio#home" },
  { id: "about", label: "About", icon: User, color: "...", url: "/portfolio#about" },
  // ... etc
]
```

### 6. Update Navigation Components

- `nav-apps.tsx`: Update portfolio detection from `pathname === "/"` to `pathname.startsWith("/portfolio")`
- `app-sidebar.tsx`: Update active app detection
- `dynamic-breadcrumb.tsx`: Update portfolio route handling

### 7. Consider Adding a Landing Page (Future)

Once portfolio is at `/portfolio`, the root `/` could become:
- A landing page with links to all apps
- A dashboard showing activity across apps
- Keep as redirect (current plan)

### 8. Cleanup Unused Files

After reorganization, remove:
- [ ] `nav-main.tsx` (if replaced by nav-apps)
- [ ] `nav-projects.tsx` (if not used)
- [ ] Any duplicate/unused components

### Implementation Order

1. **Phase 1: Component Reorganization**
   - Create subdirectories
   - Move files
   - Update all import paths
   - Test everything works

2. **Phase 2: Route Restructuring**
   - Create `/portfolio` route
   - Move portfolio page content
   - Add root redirect
   - Update proxy.ts
   - Update hub-config.ts
   - Update navigation components

3. **Phase 3: Lib Reorganization**
   - Create subdirectories
   - Move files
   - Update import paths

4. **Phase 4: Cleanup**
   - Remove unused files
   - Update README
   - Final testing
