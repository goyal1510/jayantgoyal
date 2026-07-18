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

| Section          | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| **Hero**         | Public identity, headline, SEO, GitHub username, and Resume             |
| **Section Copy** | Headings, descriptions, and visibility for public sections and subpages |
| **About**        | Story, objective, personal facts, and product principles                |
| **Experience**   | Work history with company, role, dates                                  |
| **Education**    | Degrees, institutions, years                                            |
| **Skills**       | Capability groups, proficiency labels, and evidence                     |
| **Projects**     | Project stories, full-width screenshots, links, and technologies        |
| **Certificates** | Credential metadata, documents, previews, and verification links        |
| **Contact**      | Contact details, social links, and the Resend recipient                 |
| **Navigation**   | Labels, notes, ordering, and visibility for real Portfolio anchors      |
| **Blog**         | Published articles, cover images, tags, and publication state           |

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
│   │   │   │   ├── projects/
│   │   │   │   ├── certificates/
│   │   │   │   ├── contact/
│   │   │   │   ├── navigation/
│   │   │   │   └── section-copy/
│   │   │   ├── blog/             # Blog content management
│   │   │   └── users/            # User management
│   │   ├── api/
│   │   │   ├── portfolio/[table]/ # Generic CRUD for portfolio tables
│   │   │   ├── portfolio/assets/ # Authenticated public media uploads
│   │   │   └── users/            # User API
│   │   ├── auth/callback/        # OAuth callback
│   │   ├── welcome/              # Login and authentication entry
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
- Public routes: `/welcome`, `/unauthorized`, `/auth/callback`

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
