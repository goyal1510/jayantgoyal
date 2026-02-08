# Admin Panel

Administrative dashboard for managing portfolio data and users.

**Live**: [admin.jayantgoyal.com](https://admin.jayantgoyal.com)

## Features

- Manage all portfolio sections from a single dashboard
- User management with role-based access
- Real-time data updates
- Dark/light theme support
- Responsive sidebar navigation

## Portfolio Management

| Section | Description |
|---------|-------------|
| **Hero** | Name, title, tagline, social links |
| **About** | Bio, description, profile image |
| **Experience** | Work history with company, role, dates |
| **Education** | Degrees, institutions, years |
| **Skills** | Skill categories and items |
| **Tech Icons** | Technology icons displayed on portfolio |
| **Projects** | Project cards with images, links, tech stack |
| **Certificates** | Certifications and achievements |
| **Contact** | Contact information and form settings |
| **Navigation** | Portfolio navigation menu items |

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Supabase** - Auth and database
- **@repo/ui** - Shared component library
- **TanStack Table** - Data tables
- **Tailwind CSS v4** - Styling

## Project Structure

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── (admin)/              # Protected admin routes
│   │   │   ├── layout.tsx        # Admin layout with sidebar
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   ├── portfolio/        # Portfolio management
│   │   │   │   ├── hero/
│   │   │   │   ├── about/
│   │   │   │   ├── education/
│   │   │   │   ├── experience/
│   │   │   │   ├── skills/
│   │   │   │   ├── tech-icons/
│   │   │   │   ├── projects/
│   │   │   │   ├── certificates/
│   │   │   │   ├── contact/
│   │   │   │   └── navigation/
│   │   │   └── users/            # User management
│   │   ├── api/
│   │   │   ├── portfolio/[table]/ # Generic CRUD for portfolio tables
│   │   │   └── users/            # User API
│   │   ├── auth/callback/        # OAuth callback
│   │   ├── login/                # Login page
│   │   └── unauthorized/         # Access denied page
│   ├── components/
│   │   ├── sidebar/              # Navigation sidebar
│   │   └── theme/                # Theme toggle
│   └── lib/
│       ├── supabase/             # Supabase clients
│       ├── portfolio-api.ts      # Portfolio data operations
│       ├── types.ts              # TypeScript types
│       └── config/nav-config.ts  # Sidebar navigation config
└── public/
```

## Key Patterns

### Dynamic Portfolio API

Single API route handles all portfolio tables:

```typescript
// POST /api/portfolio/[table]
// GET /api/portfolio/[table]
// PUT /api/portfolio/[table]
// DELETE /api/portfolio/[table]
```

### Form Components

Each portfolio section has a dedicated form/list component:
- `hero-form.tsx` - Single record form
- `education-list.tsx` - CRUD list with add/edit/delete
- `skills-manager.tsx` - Nested category + items management

### Route Groups

- `(admin)/` - Protected routes requiring authentication
- Public routes: `/login`, `/unauthorized`, `/auth/callback`

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Development

```bash
# Run admin panel (from monorepo root)
pnpm dev --filter admin

# Or run all apps
pnpm dev
```

The admin panel runs on port 3001 by default when running alongside the main app.

## Access Control

- Only authenticated users can access admin routes
- Role-based permissions for different operations
- Unauthorized users redirected to `/unauthorized`
